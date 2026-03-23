// @ts-ignore
const { GoogleGenAI } = require('@google/genai');

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '20mb',
        },
    },
};

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { base64Data, mimeType, prompt } = req.body;
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no servidor.' });
        }

        console.log("🚀 [Backend] Inicializando Gemini Genius...");
        const ai = new GoogleGenAI({ apiKey });

        const model = "gemini-2.0-flash";

        // Cria o prompt do sistema para instruir o Gemini
        const systemInstruction = `
Você é um especialista em engenharia de prompts para Inteligência Artificial (modelo FLUX).
Seu objetivo é analisar a imagem fornecida e a instrução de alteração do usuário: "${prompt}".
Gere um prompt otimizado em INGLÊS que descreva perfeitamente o resultado final desejado após a alteração.
O prompt deve ser focado em detalhes visuais, iluminação, realismo e estética fotorrealista.
Não inclua introduções como "Here is your prompt". Responda APENAS com o prompt em inglês.
        `.trim();

        console.log("🚀 [Backend] Enviando para Gemini 2.0 Flash...");

        // Remove o prefixo se existir
        const base64WithoutPrefix = base64Data.includes(',') 
            ? base64Data.split(',')[1] 
            : base64Data;

        const response = await ai.models.generateContent({
            model: model,
            contents: [
                {
                    inlineData: {
                        mimeType: mimeType || "image/jpeg",
                        data: base64WithoutPrefix
                    }
                },
                { text: systemInstruction }
            ]
        });

        const enhancedPrompt = response.text;
        console.log("✅ [Backend] Prompt otimizado pelo Gemini:", enhancedPrompt);

        return res.status(200).json({
            enhancedPrompt: enhancedPrompt?.trim() || prompt
        });

    } catch (error: any) {
        console.error("❌ Erro no Backend (analyze-image):", error);
        return res.status(500).json({ error: error.message || "Erro interno no servidor analisando imagem." });
    }
}
