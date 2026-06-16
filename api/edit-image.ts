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

        const model = "runwayml/stable-diffusion-v1-5"; // Reliable image-to-image model
        const apiUrl = `https://api-inference.huggingface.co/models/${model}`;

        console.log("🚀 [Backend] Enviando requisição de edição para Hugging Face API...");

        const base64WithoutPrefix = base64Data.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64WithoutPrefix, 'base64');

        let fullPrompt = prompt;
        if (secondaryImage) {
            fullPrompt += " (com marca d'água/logo aplicada)";
        }
        
        const formData = new FormData();
        formData.append("inputs", fullPrompt);
        
        const blob = new Blob([buffer], { type: mimeType });
        formData.append("image", blob, "image.png");

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Erro da API Hugging Face:", errorText);
            
            // Tratamento especial para erro de loading do modelo
            if (errorText.includes('is currently loading') || response.status === 503) {
                return res.status(503).json({ error: "O modelo de IA está sendo carregado (wake up). Por favor, aguarde 20 segundos e tente novamente!" });
            }
            
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
        console.error("❌ Erro no Backend (edit-image):", error);
        return res.status(500).json({ error: error.message || "Erro interno no servidor." });
    }
}
