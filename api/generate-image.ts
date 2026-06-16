import { GoogleGenAI } from '@google/genai';

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
        const { prompt } = req.body;
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no servidor.' });
        }

        console.log("🚀 [Backend] Gerando imagem com Gemini API...");
        const ai = new GoogleGenAI({ apiKey });

        const model = "gemini-2.5-flash-image";

        const systemInstruction = `
Você é um modelo de geração visual avançado. Receba o prompt do usuário e gere a imagem de acordo com as instruções.
Retorne EXCLUSIVAMENTE a imagem processada em formato base64 puro (sem prefixo data:image/png;base64). Não adicione nenhum texto explicativo, Markdown ou aspas. Apenas a string base64.
        `.trim();

        const response = await ai.models.generateContent({
            model: model,
            contents: [
                { text: systemInstruction + "\\n\\nInstrução do usuário: " + prompt }
            ]
        });

        let base64Response = response.text?.trim() || "";
        
        // Limpar possíveis formatações indesejadas (caso a IA retorne markdown)
        base64Response = base64Response.replace(/^```\\w*\\n?/g, '').replace(/\\n?```$/g, '').trim();

        const imageUrl = `data:image/png;base64,${base64Response}`;

        return res.status(200).json({
            imageUrl,
            mimeType: "image/png"
        });

    } catch (error: any) {
        console.error("❌ Erro no Backend (generate-image com Gemini):", error);
        return res.status(500).json({ error: error.message || "Erro interno no servidor gerando imagem." });
    }
}
