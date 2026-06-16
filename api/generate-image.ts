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
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    try {
        const { prompt } = req.body;
        const apiKey = process.env.HUGGINGFACE_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'HUGGINGFACE_API_KEY não configurada no servidor.' });
        }

        console.log("🚀 [Backend] Gerando imagem com Hugging Face (FLUX)...");
        const model = "black-forest-labs/FLUX.1-schnell"; // Fast and free FLUX model

        const payload = JSON.stringify({
            inputs: prompt
        });

        const options = {
            hostname: 'router.huggingface.co',
            port: 443,
            path: `/hf-inference/models/${model}`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const imageBuffer: Buffer = await new Promise((resolve, reject) => {
            const reqHttp = https.request(options, (resHttp: any) => {
                const chunks: any[] = [];
                resHttp.on('data', (chunk: any) => chunks.push(chunk));
                resHttp.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    if (resHttp.statusCode < 200 || resHttp.statusCode >= 300) {
                        reject(new Error(`Hugging Face API Error (${resHttp.statusCode}): ${buffer.toString()}`));
                    } else {
                        resolve(buffer);
                    }
                });
            });

            reqHttp.on('error', (e: any) => {
                reject(new Error(`Erro de rede ao contatar Hugging Face: ${e.message}`));
            });

            reqHttp.write(payload);
            reqHttp.end();
        });

        const base64Response = imageBuffer.toString('base64');
        const imageUrl = `data:image/jpeg;base64,${base64Response}`;

        return res.status(200).json({
            imageUrl,
            mimeType: "image/jpeg"
        });

    } catch (error: any) {
        console.error("❌ Erro no Backend (generate-image):", error);
        return res.status(500).json({ error: error.message || "Erro interno no servidor." });
    }
}
