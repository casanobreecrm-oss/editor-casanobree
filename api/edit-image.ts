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
        const { base64Data, mimeType, prompt, secondaryImage } = req.body;
        const rawApiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
        const apiKey = rawApiKey.trim();

        if (!apiKey) {
            return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no servidor.' });
        }

        console.log("🚀 [Backend] Inicializando Gemini via Fetch nativo para edição visual...");

        const model = "gemini-2.5-flash"; // Usando o modelo padrão suportado! gemini-2.5-flash-image não existe.

        // Cria o prompt completo
        let fullPrompt = prompt;
        if (secondaryImage) {
            fullPrompt += " (aplique a marca d'água ou logo informada visualmente)";
        }

        const systemInstruction = `
Você é um modelo de edição visual avançado. Receba a imagem original e o prompt do usuário, e gere a nova versão da foto editada de acordo com as instruções.
Retorne EXCLUSIVAMENTE a imagem processada em formato base64 puro (sem prefixo data:image/png;base64). Não adicione nenhum texto explicativo, Markdown ou aspas. Apenas a string base64.
        `.trim();

        const base64WithoutPrefix = base64Data.replace(/^data:image\/\w+;base64,/, "");

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
                            text: systemInstruction + "\n\nInstrução do usuário: " + fullPrompt
                        }
                    ]
                }
            ]
        });

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
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

        let base64Response = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        
        // Limpar possíveis formatações indesejadas
        base64Response = base64Response.replace(/^```\w*\n?/g, '').replace(/\n?```$/g, '').trim();

        if (!base64Response) {
             throw new Error("A API retornou sucesso, mas não encontrou a string base64 na resposta. O modelo pode não suportar retorno de imagens desta forma.");
        }

        const imageUrl = `data:image/png;base64,${base64Response}`;

        console.log("✅ [Backend] Imagem editada com sucesso via Fetch!");

        return res.status(200).json({
            imageUrl,
            mimeType: "image/png"
        });

    } catch (error: any) {
        console.error("❌ Erro no Backend (edit-image via Fetch):", error);
        return res.status(500).json({ error: error.message || "Erro interno no servidor editando imagem." });
    }
}
