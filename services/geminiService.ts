/**
 * Analisa uma imagem e um prompt usando o Gemini 2.0 Flash via Backend
 * para otimizar o prompt para o gerador de imagens (FLUX).
 */
export const analyzeImageWithGemini = async (
  base64Data: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  try {
    console.log('🚀 Enviando para /api/analyze-image...');

    const response = await fetch('/api/analyze-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Data,
        mimeType,
        prompt,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Erro da API Backend (Gemini):', errorData.error);
      throw new Error(errorData.error || 'Falha na comunicação com o Gemini.');
    }

    const data = await response.json();
    console.log('✅ Resposta recebida do Gemini Backend!');

    return data.enhancedPrompt || prompt;

  } catch (error: any) {
    console.error("❌ Erro ao analisar imagem:", error);
    throw new Error(error.message || "Falha ao analisar a imagem.");
  }
};