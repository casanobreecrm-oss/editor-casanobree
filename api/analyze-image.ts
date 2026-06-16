import https from 'https';
export const maxDuration = 60;

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '20mb',
        },
    },
};

export default async function handler(req: any, res: any) {
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
        const rawApiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || "";
        const apiKey = rawApiKey.replace(/\s+/g, "");

        if (!apiKey) {
            return res.status(500).json({ error: 'GEMINI_API_KEY não configurada no servidor.' });
        }

        const model = "gemini-2.5-flash"; 

        const systemInstruction = `
Você é um especialista em engenharia de prompts para Inteligência Artificial (modelo FLUX).
Seu objetivo é analisar a imagem fornecida e a instrução de alteração do usuário: "${prompt}".
Gere um prompt otimizado em INGLÊS que descreva perfeitamente o resultado final desejado após a alteração.
O prompt deve ser focado em detalhes visuais, iluminação, realismo e estética fotorrealista.
Não inclua introduções como "Here is your prompt". Responda APENAS com o prompt em inglês.
        `.trim();

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

        const data: any = await new Promise((resolve, reject) => {
            const reqHttp = https.request(options, (resHttp: any) => {
                let responseData = '';
                resHttp.on('data', (chunk: any) => { responseData += chunk; });
                resHttp.on('end', () => {
                    if (resHttp.statusCode < 200 || resHttp.statusCode >= 300) {
                        reject(new Error(`Google API Error (${resHttp.statusCode}): ${responseData}`));
                    } else {
                        try {
                            resolve(JSON.parse(responseData));
                        } catch (e) {
                            reject(new Error("Erro ao parsear JSON da resposta da Google API."));
                        }
                    }
                });
            });

            reqHttp.on('error', (e: any) => {
                reject(new Error(`Erro de rede ao contatar Google API: ${e.message}`));
            });

            reqHttp.write(payload);
            reqHttp.end();
        });

        const enhancedPrompt = data.candidates?.[0]?.content?.parts?.[0]?.text || prompt;

        return res.status(200).json({
            enhancedPrompt: enhancedPrompt?.trim() || prompt
        });

    } catch (error: any) {
        return res.status(500).json({ error: error.message || "Erro interno no servidor analisando imagem." });
    }
}
