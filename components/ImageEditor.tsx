import React, { useState, useRef, useEffect } from 'react';
import { AppStatus, ImageFile, GeneratedImage, BatchItem, User } from '../types';
import { editImageWithGemini, generateImageWithGemini } from '../services/imageService';
import { analyzeImageWithGemini } from '../services/geminiService';
import { PhotoIcon, SparklesIcon, ArrowRightIcon, DownloadIcon, TrashIcon, LoadingSpinner, CheckCircleIcon, XCircleIcon, RefreshIcon, LayersIcon, CloudUploadIcon } from './Icons';
import { CRMUploadModal } from './CRMUploadModal';

type LogoPosition = 'center' | 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';
type LogoSize = 'small' | 'medium' | 'large';

interface DownloadFormat {
  label: string;
  width?: number;
  height?: number;
  id: string;
}

const DOWNLOAD_FORMATS: DownloadFormat[] = [
  { id: 'orig', label: 'Original (Manter formato)' },
  { id: 'sq', label: 'Post (1080x1080)', width: 1080, height: 1080 },
  { id: 'hd', label: 'Full HD (Smart)', width: 1920, height: 1080 },
  { id: 'fb', label: 'Link (1200x628)', width: 1200, height: 628 },
];

interface ImageEditorProps {
  user: User;
}

export const ImageEditor: React.FC<ImageEditorProps> = ({ user }) => {
  const [globalStatus, setGlobalStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [items, setItems] = useState<BatchItem[]>([]);
  const [secondaryImage, setSecondaryImage] = useState<ImageFile | null>(null); // Logo/Overlay
  const [prompt, setPrompt] = useState<string>('');

  // Estados para controle da Logo
  const [logoPosition, setLogoPosition] = useState<LogoPosition>('center');
  const [logoSize, setLogoSize] = useState<LogoSize>('small');
  const [logoOpacity, setLogoOpacity] = useState<number>(90);

  // Estados para Menus de Download e CRM
  const [activeDownloadMenu, setActiveDownloadMenu] = useState<string | null>(null); // ID do item ou null
  const [showDownloadAllMenu, setShowDownloadAllMenu] = useState<boolean>(false);
  const [showCRMModal, setShowCRMModal] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const secondaryFileInputRef = useRef<HTMLInputElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);

  // Fecha menus ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(event.target as Node)) {
        setActiveDownloadMenu(null);
        setShowDownloadAllMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const processFile = (file: File): Promise<ImageFile> => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject('Arquivo inválido');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;

        // Load image to get dimensions
        const img = new Image();
        img.onload = () => {
          const base64Data = result.split(',')[1];
          resolve({
            file,
            previewUrl: result,
            base64: base64Data,
            mimeType: file.type,
            width: img.width,
            height: img.height
          });
        };
        img.onerror = () => reject('Erro ao carregar dimensões da imagem');
        img.src = result;
      };
      reader.onerror = () => reject('Erro ao ler');
      reader.readAsDataURL(file);
    });
  };

  const handleBatchFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setGlobalStatus(AppStatus.UPLOADING);
    const newItems: BatchItem[] = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const imgFile = await processFile(files[i]);
        newItems.push({
          id: Math.random().toString(36).substring(7),
          original: imgFile,
          generated: null,
          status: 'IDLE'
        });
      } catch (e) {
        console.error("Skipped invalid file", files[i].name);
      }
    }

    setItems(prev => [...prev, ...newItems]);
    setGlobalStatus(AppStatus.IDLE);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSecondaryFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const img = await processFile(file);
      setSecondaryImage(img);
    } catch (e) {
      alert("Erro ao carregar logo");
    }
    if (secondaryFileInputRef.current) secondaryFileInputRef.current.value = '';
  };

  const buildEnrichedPrompt = (basePrompt: string, mainImageWidth: number, mainImageHeight: number) => {
    const isPortrait = mainImageHeight > mainImageWidth;
    const orientationText = isPortrait ? "VERTICAL (Portrait)" : "HORIZONTAL (Landscape)";
    const orientationRule = `OUTPUT FORMAT RULE: The resulting image MUST be ${orientationText}. Do NOT rotate the image. Maintain the exact aspect ratio of the input image.`;

    const qualityInstruction = "REQUIREMENT: Output must be PHOTOREALISTIC, HIGH RESOLUTION, and SHARP. Do not blur details.";

    return `
    STRICT CONSTRAINT: ${orientationRule}
    
    USER REQUEST: ${basePrompt}
    
    ${qualityInstruction}
    `;
  };

  const applyOverlay = async (baseImageBase64: string, overlayImage: ImageFile): Promise<string> => {
    return new Promise((resolve, reject) => {
      const baseImg = new Image();
      const overlayImg = new Image();

      let loadedCount = 0;
      const onImageLoad = () => {
        loadedCount++;
        if (loadedCount === 2) {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = baseImg.width;
            canvas.height = baseImg.height;
            const ctx = canvas.getContext('2d');

            if (!ctx) throw new Error("Não foi possível criar contexto 2D");

            ctx.drawImage(baseImg, 0, 0);

            const scaleMap: Record<LogoSize, number> = {
              'small': 0.30,
              'medium': 0.50,
              'large': 0.70
            };
            const targetWidth = baseImg.width * scaleMap[logoSize];
            const scaleFactor = targetWidth / overlayImg.width;
            const targetHeight = overlayImg.height * scaleFactor;

            let x = 0;
            let y = 0;
            const margin = baseImg.width * 0.05;

            switch (logoPosition) {
              case 'center':
                x = (baseImg.width - targetWidth) / 2;
                y = (baseImg.height - targetHeight) / 2;
                break;
              case 'top_left':
                x = margin;
                y = margin;
                break;
              case 'top_right':
                x = baseImg.width - targetWidth - margin;
                y = margin;
                break;
              case 'bottom_left':
                x = margin;
                y = baseImg.height - targetHeight - margin;
                break;
              case 'bottom_right':
                x = baseImg.width - targetWidth - margin;
                y = baseImg.height - targetHeight - margin;
                break;
            }

            ctx.globalAlpha = logoOpacity / 100;
            ctx.drawImage(overlayImg, x, y, targetWidth, targetHeight);
            ctx.globalAlpha = 1.0;

            resolve(canvas.toDataURL('image/png'));
          } catch (e) {
            reject(e);
          }
        }
      };

      baseImg.onload = onImageLoad;
      baseImg.onerror = () => reject("Erro ao carregar imagem base");
      overlayImg.onload = onImageLoad;
      overlayImg.onerror = () => reject("Erro ao carregar logo");

      baseImg.src = `data:image/png;base64,${baseImageBase64}`;
      overlayImg.src = overlayImage.previewUrl;
    });
  };

  const processItemInternal = async (item: BatchItem, currentPrompt: string, currentSecondary: ImageFile | null) => {
    try {
      let currentBase64 = item.original.base64;
      let currentMime = item.original.mimeType;

      if (currentPrompt.trim()) {
        const finalPrompt = buildEnrichedPrompt(currentPrompt, item.original.width, item.original.height);

        // Usa Gemini para edição de imagens
        const aiResult = await editImageWithGemini(
          item.original.base64,
          item.original.mimeType,
          finalPrompt
        );

        currentBase64 = aiResult.imageUrl.split(',')[1];
        currentMime = aiResult.mimeType;
      }

      let finalImageUrl = `data:${currentMime};base64,${currentBase64}`;

      if (currentSecondary) {
        finalImageUrl = await applyOverlay(currentBase64, currentSecondary);
      } else if (!currentPrompt.trim()) {
        return;
      }

      setItems(prev => prev.map(it => it.id === item.id ? {
        ...it,
        status: 'SUCCESS',
        generated: { imageUrl: finalImageUrl, mimeType: 'image/png' }
      } : it));

    } catch (err: any) {
      console.error(err);
      setItems(prev => prev.map(it => it.id === item.id ? { ...it, status: 'ERROR', error: err.message } : it));
    }
  };
  
  const handleAnalyzePrompt = async () => {
    if (items.length === 0 || !prompt.trim()) {
      alert("Adicione pelo menos uma foto e escreva uma breve instrução primeiro.");
      return;
    }
    setIsAnalyzing(true);
    try {
      const enhanced = await analyzeImageWithGemini(
        items[0].original.base64,
        items[0].original.mimeType,
        prompt
      );
      setPrompt(enhanced);
    } catch (e: any) {
      alert(`Erro ao analisar imagem: ${e.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleProcessItem = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item || (!prompt.trim() && !secondaryImage)) return;

    setItems(prev => prev.map(i => i.id === id ? { ...i, status: 'PROCESSING', error: undefined } : i));
    await processItemInternal(item, prompt, secondaryImage);
  };

  const handleProcessBatch = async (reprocessAll = false) => {
    if (items.length === 0 || (!prompt.trim() && !secondaryImage)) return;

    setGlobalStatus(AppStatus.PROCESSING);
    const queue = items.filter(i => reprocessAll || i.status === 'IDLE' || i.status === 'ERROR');

    setItems(prev => prev.map(it => queue.find(q => q.id === it.id) ? { ...it, status: 'PROCESSING', error: undefined } : it));

    for (const item of queue) {
      const currentItem = items.find(i => i.id === item.id);
      if (!currentItem) continue;
      await processItemInternal(item, prompt, secondaryImage);
    }

    setGlobalStatus(AppStatus.IDLE);
  };

  const handleCommitEdits = () => {
    setItems(prev => prev.map(item => {
      if (item.status === 'SUCCESS' && item.generated) {
        const base64Clean = item.generated.imageUrl.split(',')[1];
        return {
          ...item,
          original: {
            ...item.original,
            previewUrl: item.generated.imageUrl,
            base64: base64Clean,
            mimeType: item.generated.mimeType,
            width: item.original.width,
            height: item.original.height
          },
          generated: null,
          status: 'IDLE'
        };
      }
      return item;
    }));

    setPrompt('');
    setSecondaryImage(null);
    alert("Edições salvas! Agora você pode aplicar novas alterações.");
  };

  const handleRemoveItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleResetAll = () => {
    setItems([]);
    setGlobalStatus(AppStatus.IDLE);
    setPrompt('');
    setSecondaryImage(null);
  };

  const downloadResizedImage = async (url: string, filename: string, targetWidth?: number, targetHeight?: number) => {
    if (!targetWidth || !targetHeight) {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    try {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(new Error("Falha ao carregar a imagem para processamento."));
        img.src = url;
      });

      let finalWidth = targetWidth;
      let finalHeight = targetHeight;
      const isSourcePortrait = img.height > img.width;
      const isTargetLandscape = targetWidth > targetHeight;

      if (isSourcePortrait && isTargetLandscape) {
        finalWidth = targetHeight;
        finalHeight = targetWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = finalWidth;
      canvas.height = finalHeight;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        const scale = Math.max(finalWidth / img.width, finalHeight / img.height);
        const x = (finalWidth / 2) - (img.width / 2) * scale;
        const y = (finalHeight / 2) - (img.height / 2) * scale;

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

        const dataUrl = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      console.error("Erro no download:", e);
      alert("Não foi possível processar a imagem.");
    }
  };

  const handleBatchDownload = async (format: DownloadFormat) => {
    const successItems = items.filter(i => i.status === 'SUCCESS' && i.generated);
    const sanitizedUserName = user.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

    successItems.forEach((item, index) => {
      setTimeout(() => {
        const fileName = `casanobree-${sanitizedUserName}-${format.id}-${index + 1}.png`;
        downloadResizedImage(item.generated!.imageUrl, fileName, format.width, format.height);
      }, index * 800);
    });

    setShowDownloadAllMenu(false);
  };

  const completedCount = items.filter(i => i.status === 'SUCCESS').length;
  const isProcessing = globalStatus === AppStatus.PROCESSING;
  const hasPending = items.some(i => i.status === 'IDLE' || i.status === 'ERROR');

  const suggestions = [
    'Dia ensolarado e céu azul',
    'Iluminação interna aconchegante',
    'Jardim verde vibrante',
    'Remover bagunça da mesa',
    'Estilo moderno e clean'
  ];

  return (
    <div className="flex flex-col gap-6" onClick={() => { setActiveDownloadMenu(null); setShowDownloadAllMenu(false); }}>

      {showCRMModal && (
        <CRMUploadModal
          user={user}
          items={items}
          onClose={() => setShowCRMModal(false)}
        />
      )}

      {/* 1. CONFIGURAÇÃO GLOBAL */}
      <div className="bg-neutral-900 rounded-3xl border border-white/10 p-6 shadow-xl relative overflow-hidden" onClick={e => e.stopPropagation()}>

        <div className="flex flex-col md:flex-row gap-6 relative z-10">

          {/* Logo Upload */}
          <div className="w-full md:w-1/3 min-w-[250px] flex flex-col gap-4">
            <div>
              <label className="block text-xs text-amber-500/80 uppercase tracking-widest font-bold mb-3">
                1. Logo / Marca D'água
              </label>
              <div
                onClick={() => secondaryFileInputRef.current?.click()}
                className={`border border-dashed rounded-xl h-32 flex items-center justify-center cursor-pointer transition-all relative overflow-hidden group
                    ${secondaryImage ? 'border-amber-500/50 bg-neutral-950' : 'border-neutral-700 bg-neutral-800/50 hover:bg-neutral-800 hover:border-amber-500/30'}
                `}
              >
                {secondaryImage ? (
                  <>
                    <img src={secondaryImage.previewUrl} className="h-full w-full object-contain p-2 opacity-80 group-hover:opacity-100 transition-opacity" alt="Logo" />
                    <button
                      onClick={(e) => { e.stopPropagation(); setSecondaryImage(null); }}
                      className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white p-1 rounded-full"
                      title="Remover Logo"
                    >
                      <XCircleIcon className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <span className="text-xl text-amber-500 font-bold block mb-1">+</span>
                    <span className="text-sm text-neutral-400">Adicionar Logo</span>
                  </div>
                )}
                <input type="file" ref={secondaryFileInputRef} onChange={handleSecondaryFileChange} accept="image/*" className="hidden" />
              </div>
            </div>

            {/* Configurações da Logo */}
            {secondaryImage && (
              <div className="bg-neutral-800/50 p-4 rounded-xl border border-white/5 space-y-3 animate-fadeIn">
                <h4 className="text-xs text-white uppercase font-bold tracking-wider mb-2">Ajustes da Logo</h4>

                <div className="space-y-1">
                  <label className="text-xs text-neutral-400">Posição</label>
                  <select
                    value={logoPosition}
                    onChange={(e) => setLogoPosition(e.target.value as LogoPosition)}
                    className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-sm text-white focus:border-amber-500 outline-none"
                  >
                    <option value="center">Centro (Discreto)</option>
                    <option value="top_left">Canto Superior Esq.</option>
                    <option value="top_right">Canto Superior Dir.</option>
                    <option value="bottom_left">Canto Inferior Esq.</option>
                    <option value="bottom_right">Canto Inferior Dir.</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1 space-y-1">
                    <label className="text-xs text-neutral-400">Tamanho</label>
                    <select
                      value={logoSize}
                      onChange={(e) => setLogoSize(e.target.value as LogoSize)}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded p-2 text-sm text-white focus:border-amber-500 outline-none"
                    >
                      <option value="small">Pequeno (30%)</option>
                      <option value="medium">Médio (50%)</option>
                      <option value="large">Grande (70%)</option>
                    </select>
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-xs text-neutral-400">Opacidade ({logoOpacity}%)</label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={logoOpacity}
                      onChange={(e) => setLogoOpacity(Number(e.target.value))}
                      className="w-full h-9 accent-amber-500 bg-neutral-900 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Prompt Input */}
          <div className="w-full md:w-2/3 flex flex-col">
            <label className="block text-xs text-amber-500/80 uppercase tracking-widest font-bold mb-3">
              2. Instruções {secondaryImage ? '(Opcional)' : ''}
            </label>
            <div className="flex-grow flex flex-col h-full">
              <div className="relative flex-grow h-24 md:h-auto mb-3">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={secondaryImage ? "Oculte elementos ou melhore a iluminação (Opcional)..." : "Ex: Remova a vassoura, melhore a iluminação..."}
                  className="w-full h-full p-4 border border-neutral-700 rounded-xl bg-neutral-950 text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 resize-none text-sm leading-relaxed"
                  disabled={isProcessing}
                />
              </div>

              {!secondaryImage && (
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-neutral-500 uppercase font-bold tracking-wider py-1.5 mr-1 self-center">Atalhos:</span>
                  {suggestions.map((sug) => (
                    <button
                      key={sug}
                      onClick={() => setPrompt(sug)}
                      disabled={isProcessing}
                      className="text-xs bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-amber-400 border border-neutral-700 hover:border-amber-500/30 rounded px-3 py-1.5 transition-all duration-200"
                    >
                      {sug}
                    </button>
                  ))}
                  
                  <button
                    onClick={handleAnalyzePrompt}
                    disabled={isAnalyzing || items.length === 0 || !prompt.trim()}
                    className={`ml-auto text-xs font-bold py-1.5 px-3 rounded flex items-center gap-1.5 transition-all
                      ${isAnalyzing || items.length === 0 || !prompt.trim()
                        ? 'bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed'
                        : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 hover:border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
                      }
                    `}
                  >
                    {isAnalyzing ? (
                      <LoadingSpinner className="w-3 h-3" />
                    ) : (
                      <SparklesIcon className="w-3 h-3" />
                    )}
                    {isAnalyzing ? 'Otimizando...' : 'Otimizar com Gemini'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. ÁREA DE ARQUIVOS */}
      <div className="bg-neutral-900/40 rounded-3xl border border-white/10 overflow-hidden shadow-2xl backdrop-blur-sm p-6 md:p-8 min-h-[400px]">

        {/* Header da Galeria */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-bold text-white">Galeria de Trabalho</h3>
            <span className="bg-neutral-800 text-neutral-400 px-3 py-1 rounded-full text-xs font-medium border border-neutral-700">
              {items.length} {items.length === 1 ? 'Foto' : 'Fotos'}
            </span>
            {completedCount > 0 && (
              <span className="bg-green-900/30 text-green-400 px-3 py-1 rounded-full text-xs font-medium border border-green-500/20">
                {completedCount} Concluídas
              </span>
            )}
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            {completedCount > 0 && !isProcessing && (
              <button
                onClick={handleCommitEdits}
                className="flex items-center gap-2 border border-blue-500/30 bg-blue-900/20 hover:bg-blue-900/40 text-blue-200 px-4 py-2 rounded-lg text-sm transition-colors"
                title="Transforma os resultados atuais em originais para continuar editando"
              >
                <LayersIcon className="w-4 h-4" />
                Manter Edições Atuais
              </button>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex-1 md:flex-none border border-neutral-600 hover:border-amber-500 text-neutral-300 hover:text-amber-400 px-4 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-lg leading-none">+</span> Adicionar Fotos
            </button>
            <input type="file" ref={fileInputRef} onChange={handleBatchFileChange} accept="image/*" multiple className="hidden" />

            {items.length > 0 && (
              <button onClick={handleResetAll} disabled={isProcessing} className="border border-red-900/50 hover:border-red-500/50 text-red-500/70 hover:text-red-400 px-4 py-2 rounded-lg text-sm transition-colors">
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Grid de Imagens */}
        {items.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-neutral-700 rounded-2xl h-64 flex flex-col items-center justify-center text-center cursor-pointer hover:border-amber-500/50 hover:bg-neutral-800/50 transition-all group"
          >
            <PhotoIcon className="w-12 h-12 text-neutral-500 group-hover:text-amber-500 mb-4 transition-colors" />
            <p className="text-neutral-400 font-medium">Arraste fotos ou clique para adicionar</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {items.map((item) => (
              <div key={item.id} className="bg-black border border-neutral-800 rounded-xl overflow-hidden relative group">
                <div className="absolute top-2 left-2 z-20">
                  {item.status === 'SUCCESS' && <div className="bg-green-500 text-black p-1 rounded-full shadow-lg"><CheckCircleIcon className="w-4 h-4" /></div>}
                  {item.status === 'ERROR' && <div className="bg-red-500 text-white p-1 rounded-full shadow-lg" title={item.error}><XCircleIcon className="w-4 h-4" /></div>}
                  {item.status === 'PROCESSING' && <div className="bg-amber-500 text-black p-1 rounded-full shadow-lg"><LoadingSpinner className="w-4 h-4" /></div>}
                </div>

                {!isProcessing && (
                  <div className="absolute top-2 right-2 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    {(item.status === 'SUCCESS' || item.status === 'ERROR') && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleProcessItem(item.id); }}
                        className="bg-black/60 hover:bg-amber-500 text-white p-1.5 rounded-full backdrop-blur-sm border border-white/10"
                        title="Refazer esta imagem"
                      >
                        <RefreshIcon className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveItem(item.id); }}
                      className="bg-black/60 hover:bg-red-500 text-white p-1.5 rounded-full backdrop-blur-sm border border-white/10"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="relative aspect-[4/3]">
                  {item.status === 'SUCCESS' && item.generated ? (
                    <img src={item.generated.imageUrl} alt="Resultado" className="w-full h-full object-cover" />
                  ) : (
                    <>
                      <img src={item.original.previewUrl} alt="Original" className={`w-full h-full object-cover ${item.status === 'PROCESSING' ? 'opacity-50 blur-sm' : ''}`} />
                      {item.status === 'PROCESSING' && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-amber-400 font-bold text-sm tracking-wider animate-pulse">PROCESSANDO</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="bg-neutral-900 p-3 flex justify-between items-center border-t border-neutral-800">
                  <span className="text-xs text-neutral-500 truncate max-w-[150px]">{item.original.file.name}</span>
                  {item.status === 'SUCCESS' && item.generated && (
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setActiveDownloadMenu(activeDownloadMenu === item.id ? null : item.id)}
                        className="text-amber-500 hover:text-amber-300 p-1"
                        title="Baixar imagem"
                      >
                        <DownloadIcon className="w-5 h-5" />
                      </button>

                      {activeDownloadMenu === item.id && (
                        <div className="absolute bottom-full right-0 mb-2 bg-neutral-800 border border-neutral-700 rounded-xl shadow-2xl z-50 w-48 overflow-hidden animate-fadeIn">
                          <div className="p-2 space-y-1">
                            <div className="text-[10px] text-neutral-500 uppercase font-bold px-2 py-1">Formatos</div>
                            {DOWNLOAD_FORMATS.map(fmt => {
                              const sanitizedUserName = user.name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
                              return (
                                <button
                                  key={fmt.id}
                                  onClick={() => {
                                    const fileName = `casanobree-${sanitizedUserName}-${fmt.id}.png`;
                                    downloadResizedImage(item.generated!.imageUrl, fileName, fmt.width, fmt.height);
                                    setActiveDownloadMenu(null);
                                  }}
                                  className="w-full text-left px-2 py-2 text-xs text-neutral-300 hover:bg-amber-500/20 hover:text-amber-400 rounded transition-colors"
                                >
                                  {fmt.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        {items.length > 0 && (
          <div className="sticky bottom-0 bg-neutral-900/90 backdrop-blur-md p-4 -m-6 md:-m-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-neutral-400 hidden md:block">
              {completedCount === items.length ? (
                "Processo concluído."
              ) : `Pronto para processar ${items.length - completedCount} imagens.`}
            </div>

            <div className="flex w-full md:w-auto gap-3 relative">
              {completedCount > 0 && (
                <>
                  <div className="relative flex-1 md:flex-none" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setShowDownloadAllMenu(!showDownloadAllMenu)}
                      className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg border border-neutral-600 transition-all"
                    >
                      <DownloadIcon className="w-5 h-5" />
                      Baixar Todas ({completedCount})
                    </button>

                    {showDownloadAllMenu && (
                      <div className="absolute bottom-full left-0 md:left-auto md:right-0 mb-2 bg-neutral-800 border border-neutral-700 rounded-xl shadow-2xl z-50 w-full md:w-56 overflow-hidden animate-fadeIn">
                        <div className="p-2 space-y-1">
                          <div className="text-[10px] text-neutral-500 uppercase font-bold px-2 py-1">Escolha o formato</div>
                          {DOWNLOAD_FORMATS.map(fmt => (
                            <button
                              key={fmt.id}
                              onClick={() => handleBatchDownload(fmt)}
                              className="w-full text-left px-3 py-2 text-sm text-neutral-300 hover:bg-amber-500/20 hover:text-amber-400 rounded transition-colors"
                            >
                              {fmt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* BOTÃO DE UPLOAD PARA O SITE */}
                  <button
                    onClick={() => setShowCRMModal(true)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 py-3 px-6 bg-blue-900/30 hover:bg-blue-800/40 text-blue-200 border border-blue-500/30 rounded-lg transition-all"
                  >
                    <CloudUploadIcon className="w-5 h-5" />
                    Publicar no Site
                  </button>
                </>
              )}

              <button
                onClick={() => handleProcessBatch(!hasPending)}
                disabled={isProcessing || (!prompt.trim() && !secondaryImage)}
                className={`flex-1 md:flex-none flex items-center justify-center gap-2 py-3 px-8 rounded-lg shadow-lg text-sm font-bold uppercase tracking-wider transition-all min-w-[200px]
                  ${(isProcessing || (!prompt.trim() && !secondaryImage))
                    ? 'bg-neutral-800 cursor-not-allowed text-neutral-500'
                    : hasPending
                      ? 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-black hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                      : 'bg-neutral-700 text-white hover:bg-amber-600 hover:text-black border border-white/10'
                  }`}
              >
                {isProcessing ? (
                  <>
                    <LoadingSpinner className="w-5 h-5" /> Processando...
                  </>
                ) : (
                  <>
                    {hasPending ? (
                      <>Processar Pendentes <ArrowRightIcon className="w-5 h-5" /></>
                    ) : (
                      <>Refazer Todas <RefreshIcon className="w-5 h-5" /></>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};