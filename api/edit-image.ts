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
        const apiKey = process.env.HUGGINGFACE_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'HUGGINGFACE_API_KEY não configurada no servidor.' });
        }

        const model = "runwayml/stable-diffusion-v1-5"; 
        console.log("🚀 [Backend] Enviando requisição de edição para Hugging Face via HTTPS manual...");

        const base64WithoutPrefix = base64Data.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Buffer.from(base64WithoutPrefix, 'base64');

        let fullPrompt = prompt;
        if (secondaryImage) {
            fullPrompt += " (com marca d'água/logo aplicada)";
        }

        const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
        const crlf = '\\r\\n';

        // Constroi o corpo Multipart
        const postDataChunks = [];

        // Adiciona prompt
        postDataChunks.push(Buffer.from(
            `--${boundary}${crlf}Content-Disposition: form-data; name="inputs"${crlf}${crlf}${fullPrompt}${crlf}`
        ));

        // Adiciona image
        postDataChunks.push(Buffer.from(
            `--${boundary}${crlf}Content-Disposition: form-data; name="image"; filename="image.png"${crlf}Content-Type: ${mimeType || 'image/png'}${crlf}${crlf}`
        ));
        postDataChunks.push(imageBuffer);
        postDataChunks.push(Buffer.from(`${crlf}--${boundary}--${crlf}`));

        const postData = Buffer.concat(postDataChunks);

        const options = {
            hostname: 'router.huggingface.co',
            port: 443,
            path: `/hf-inference/models/${model}`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': postData.length
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
                        if (errorText.includes('is currently loading') || resHttp.statusCode === 503) {
                            reject(new Error("O modelo de IA está sendo carregado (wake up). Por favor, aguarde 20 segundos e tente novamente!"));
                        } else {
                            reject(new Error(`Hugging Face API Error (${resHttp.statusCode}): ${errorText}`));
                        }
                    } else {
                        resolve(buffer);
                    }
                });
            });

            reqHttp.on('error', (e: any) => {
                reject(new Error(`Erro de rede: ${e.message}`));
            });

            reqHttp.write(postData);
            reqHttp.end();
        });

        const base64Response = resultBuffer.toString('base64');
        const imageUrl = `data:image/png;base64,${base64Response}`;

        return res.status(200).json({
            imageUrl,
            mimeType: "image/png"
        });

    } catch (error: any) {
        console.error("❌ Erro no Backend (edit-image):", error);
        return res.status(500).json({ error: error.message || "Erro interno no servidor." });
    }
}
