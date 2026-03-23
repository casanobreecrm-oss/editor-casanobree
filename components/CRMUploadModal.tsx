import React, { useState } from 'react';
import { User, BatchItem } from '../types';
import { uploadToCRM } from '../services/crmService';
import { CloudUploadIcon, XCircleIcon, CheckCircleIcon, LoadingSpinner } from './Icons';

interface CRMUploadModalProps {
  user: User;
  items: BatchItem[];
  onClose: () => void;
}

export const CRMUploadModal: React.FC<CRMUploadModalProps> = ({ user, items, onClose }) => {
  const [propertyRef, setPropertyRef] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'UPLOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');

  // Filtra apenas as imagens que foram geradas com sucesso
  const validItems = items.filter(i => i.status === 'SUCCESS' && i.generated);
  const count = validItems.length;

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyRef.trim()) return;

    setStatus('UPLOADING');
    setErrorMessage('');

    try {
      // Prepara os dados
      const imagesPayload = validItems.map((item, index) => ({
        fileName: `casanobree-${propertyRef}-${index + 1}.png`,
        base64: item.generated!.imageUrl.split(',')[1] // Remove o cabeçalho data:image...
      }));

      await uploadToCRM(user, propertyRef, imagesPayload);
      
      setStatus('SUCCESS');
      // Fecha automaticamente após 3 segundos de sucesso
      setTimeout(onClose, 3000);

    } catch (err: any) {
      setStatus('ERROR');
      setErrorMessage(err.message || 'Erro desconhecido ao enviar.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
      <div className="bg-neutral-900 border border-amber-500/20 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="bg-neutral-800 p-6 border-b border-white/5">
           <div className="flex items-center gap-3 mb-2">
             <div className="bg-amber-500/10 p-2 rounded-lg text-amber-500">
               <CloudUploadIcon className="w-8 h-8" />
             </div>
             <div>
               <h2 className="text-2xl font-bold text-white">Publicar no Site</h2>
               <p className="text-sm text-neutral-400">Integração Casanobree CRM</p>
             </div>
           </div>
        </div>

        {/* Content */}
        <div className="p-8">
           {status === 'SUCCESS' ? (
             <div className="text-center py-8">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 text-green-500 mb-6 animate-fadeIn">
                  <CheckCircleIcon className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Sucesso!</h3>
                <p className="text-neutral-400">
                  {count} imagens foram enviadas para o imóvel <strong>{propertyRef.toUpperCase()}</strong>.
                </p>
                <p className="text-neutral-500 text-sm mt-4">Fechando em instantes...</p>
             </div>
           ) : (
             <form onSubmit={handleUpload} className="space-y-6">
                
                <div className="bg-neutral-800/50 p-4 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="text-neutral-400">Corretor Responsável:</span>
                    <span className="text-white font-semibold">{user.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-neutral-400">Imagens para envio:</span>
                    <span className="text-amber-500 font-bold">{count} fotos</span>
                  </div>
                </div>

                <div>
                   <label className="block text-xs text-amber-500 uppercase font-bold tracking-wider mb-2">
                     Código do Imóvel (Referência)
                   </label>
                   <input 
                     type="text" 
                     value={propertyRef}
                     onChange={e => setPropertyRef(e.target.value)}
                     className="w-full bg-black border border-neutral-700 rounded-xl p-4 text-lg text-white placeholder-neutral-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none uppercase"
                     placeholder="Ex: AP-205 ou REF-1090"
                     required
                     disabled={status === 'UPLOADING'}
                   />
                   <p className="text-xs text-neutral-500 mt-2">
                     As fotos serão automaticamente vinculadas a esta referência no seu painel.
                   </p>
                </div>

                {status === 'ERROR' && (
                  <div className="bg-red-900/20 border border-red-500/30 p-3 rounded-lg text-red-300 text-sm flex items-center gap-2">
                    <XCircleIcon className="w-5 h-5 flex-shrink-0" />
                    {errorMessage}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button 
                    type="button" 
                    onClick={onClose}
                    disabled={status === 'UPLOADING'}
                    className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={status === 'UPLOADING' || count === 0}
                    className="flex-[2] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {status === 'UPLOADING' ? (
                      <>
                         <LoadingSpinner className="w-5 h-5" /> Enviando...
                      </>
                    ) : (
                      <>
                        <CloudUploadIcon className="w-5 h-5" /> Enviar para o Site
                      </>
                    )}
                  </button>
                </div>
             </form>
           )}
        </div>

      </div>
    </div>
  );
};