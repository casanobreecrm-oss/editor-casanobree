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
        const { base64Data, mimeType, prompt, secondaryImage } = req.body;
        // Agora usamos a chave do fal.ai
        const apiKey = process.env.FAL_KEY || process.env.HUGGINGFACE_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'FAL_KEY não configurada no servidor.' });
        }

        console.log("🚀 [Backend] Enviando requisição de edição para fal.ai...");

        let fullPrompt = prompt;
        if (secondaryImage) {
            fullPrompt += " (com marca d'água/logo aplicada)";
        }

        const payloadString = JSON.stringify({
            image_url: base64Data,
            prompt: fullPrompt,
            strength: 0.85
        });

        const options = {
            hostname: 'fal.run',
            port: 443,
            path: '/fal-ai/fast-sdxl/image-to-image',
            method: 'POST',
            headers: {
                'Authorization': `Key ${apiKey}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payloadString)
            }
        };

        const resultBuffer: Buffer = await new Promise((resolve, reject) => {
            const reqHttp = https.request(options, (resHttp: any) => {
                const chunks: any[] = [];
                resHttp.on('data', (chunk: any) => chunks.push(chunk));
                resHttp.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    if (resHttp.statusCode < 200 || resHttp.statusCode >= 300) {
                        const errorText = buffer.toString();
                        reject(new Error(`Fal.ai API Error (${resHttp.statusCode}): ${errorText}`));
                    } else {
                        resolve(buffer);
                    }
                });
            });

            reqHttp.on('error', (e: any) => {
                reject(new Error(`Erro de rede: ${e.message}`));
            });

            reqHttp.write(payloadString);
            reqHttp.end();
        });

        const data = JSON.parse(resultBuffer.toString());
        
        if (!data.images || data.images.length === 0) {
            throw new Error("A API não retornou imagens.");
        }

        // Fal.ai costuma retornar a URL da imagem hospedada ou base64 (geralmente URL)
        // O nosso frontend aceita URL diretamente, mas se o frontend espera imageUrl: base64, 
        // vamos retornar a imageUrl do fal.ai que o frontend renderiza no <img> src de boa.
        const imageUrl = data.images[0].url;

        return res.status(200).json({
            imageUrl,
            mimeType: "image/jpeg"
        });

    } catch (error: any) {
        console.error("❌ Erro no Backend (edit-image):", error);
        return res.status(500).json({ error: error.message || "Erro interno no servidor." });
    }
}
