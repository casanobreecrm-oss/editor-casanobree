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

        const model = "runwayml/stable-diffusion-v1-5";
        const apiUrl = `https://api-inference.huggingface.co/models/${model}`;

        console.log("🚀 [Backend] Gerando imagem com Hugging Face API...");

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                inputs: prompt,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return res.status(response.status).json({ error: `Erro Hugging Face: ${errorText}` });
        }

        const imageBuffer = await response.arrayBuffer();
        const base64Response = Buffer.from(imageBuffer).toString('base64');
        const imageUrl = `data:image/png;base64,${base64Response}`;

        return res.status(200).json({
            imageUrl,
            mimeType: "image/png"
        });

    } catch (error: any) {
        return res.status(500).json({ error: error.message || "Erro interno no servidor." });
    }
}
