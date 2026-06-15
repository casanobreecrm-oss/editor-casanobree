import { GeneratedImage } from "../types";

/**
 * Edita uma imagem usando modelos de IA do Gemini
 * Usa o modelo gemini-2.5-flash-image
 */
export const editImageWithGemini = async (
    base64Data: string,
    mimeType: string,
    prompt: string,
    secondaryImage?: { base64: string; mimeType: string }
): Promise<GeneratedImage> => {
    try {
        console.log("🚀 Enviando requisição para /api/edit-image...");

        const response = await fetch("/api/edit-image", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                base64Data,
                mimeType,
                prompt,
                secondaryImage
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("❌ Erro da API Backend:", errorData.error);
            throw new Error(errorData.error || "Falha na comunicação com o servidor.");
        }

        const data = await response.json();
        console.log("🖼️ Imagem editada com sucesso via Backend!");

        return {
            imageUrl: data.imageUrl,
            mimeType: data.mimeType || "image/png",
        };
    } catch (error: any) {
        console.error("❌ Erro ao chamar API Backend:", error);
        throw new Error(error.message || "Falha ao processar a imagem.");
    }
};

/**
 * Versão alternativa usando text-to-image
 */
export const generateImageWithGemini = async (
    prompt: string
): Promise<GeneratedImage> => {
    try {
        console.log("🚀 Gerando imagem com /api/generate-image...");

        const response = await fetch("/api/generate-image", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prompt,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("❌ Erro da API Backend:", errorData.error);
            throw new Error(errorData.error || "Falha na comunicação com o servidor.");
        }

        const data = await response.json();
        console.log("🖼️ Imagem gerada com sucesso via Backend!");

        return {
            imageUrl: data.imageUrl,
            mimeType: data.mimeType || "image/png",
        };
    } catch (error: any) {
        console.error("❌ Erro ao gerar imagem:", error);
        throw new Error(error.message || "Falha ao gerar a imagem.");
    }
};
