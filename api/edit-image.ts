import https from 'https';

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
        const { base64Data, mimeType, prompt, secondaryImage } = req.body;
        const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no servidor.' });
        }

        console.log("🚀 [Backend] Inicializando Gemini via HTTPS nativo para edição visual...");

        const model = "gemini-2.5-flash-image";

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
                            text: systemInstruction + "\\n\\nInstrução do usuário: " + fullPrompt
                        }
                    ]
                }
            ]
        });

        const options = {
            hostname: 'generativelanguage.googleapis.com',
            port: 443,
            path: `/v1beta/models/${model}:generateContent?key=${apiKey}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const data = await new Promise<any>((resolve, reject) => {
            const reqHttps = https.request(options, (resHttps) => {
                let chunks: Buffer[] = [];
                
                resHttps.on('data', (chunk) => {
                    chunks.push(chunk);
                });

                resHttps.on('end', () => {
                    const responseBody = Buffer.concat(chunks).toString();
                    if (resHttps.statusCode && resHttps.statusCode >= 400) {
                        reject(new Error(`Google API Error (${resHttps.statusCode}): ${responseBody}`));
                    } else {
                        try {
                            resolve(JSON.parse(responseBody));
                        } catch (e) {
                            reject(new Error("Erro ao parsear resposta da API do Google"));
                        }
                    }
                });
            });

            reqHttps.on('error', (error) => {
                reject(error);
            });

            reqHttps.write(payload);
            reqHttps.end();
        });

        let base64Response = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        
        // Limpar possíveis formatações indesejadas
        base64Response = base64Response.replace(/^```\\w*\\n?/g, '').replace(/\\n?```$/g, '').trim();

        if (!base64Response) {
             throw new Error("A API retornou sucesso, mas não encontrou a string base64 na resposta. O modelo pode não suportar retorno de imagens desta forma.");
        }

        const imageUrl = `data:image/png;base64,${base64Response}`;

        console.log("✅ [Backend] Imagem editada com sucesso via HTTPS!");

        return res.status(200).json({
            imageUrl,
            mimeType: "image/png"
        });

    } catch (error: any) {
        console.error("❌ Erro no Backend (edit-image via HTTPS):", error);
        return res.status(500).json({ error: error.message || "Erro interno no servidor editando imagem." });
    }
}
