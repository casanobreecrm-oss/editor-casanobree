import { GoogleGenAI } from '@google/genai';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '20mb',
        },
    },
};

export default async function handler(req: any, res: any) {
    // Adicionando cabeçalhos CORS manuais para evitar falha no navegador em caso de erro
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { base64Data, mimeType, prompt } = req.body;
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no servidor.' });
        }

        console.log("🚀 [Backend] Inicializando Gemini Genius via Fetch...");

        const model = "gemini-2.5-flash"; // gemini-2.5-flash-image does not exist

        // Cria o prompt do sistema para instruir o Gemini
        const systemInstruction = `
Você é um especialista em engenharia de prompts para Inteligência Artificial (modelo FLUX).
Seu objetivo é analisar a imagem fornecida e a instrução de alteração do usuário: "${prompt}".
Gere um prompt otimizado em INGLÊS que descreva perfeitamente o resultado final desejado após a alteração.
O prompt deve ser focado em detalhes visuais, iluminação, realismo e estética fotorrealista.
Não inclua introduções como "Here is your prompt". Responda APENAS com o prompt em inglês.
        `.trim();

        console.log("🚀 [Backend] Enviando para Gemini via REST API...");

        // Remove o prefixo se existir
        const base64WithoutPrefix = base64Data.includes(',') 
            ? base64Data.split(',')[1] 
            : base64Data;

        const payload = JSON.stringify({
            contents: [
                {
                    parts: [
                        {
                            inlineData: {
                                mimeType: mimeType || "image/jpeg",
                                data: base64WithoutPrefix
                            }
                        },
                        {
                            text: systemInstruction
                        }
                    ]
                }
            ]
        });

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: payload
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`Google API Error (${response.status}): ${errText}`);
        }

        const data = await response.json();

        const enhancedPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text || prompt;
        console.log("✅ [Backend] Prompt otimizado pelo Gemini:", enhancedPrompt);

        return res.status(200).json({
            enhancedPrompt: enhancedPrompt?.trim() || prompt
        });

    } catch (error: any) {
        console.error("❌ Erro no Backend (analyze-image via Fetch):", error);
        return res.status(500).json({ error: error.message || "Erro interno no servidor analisando imagem." });
    }
}
