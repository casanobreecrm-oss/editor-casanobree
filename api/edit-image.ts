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
        const apiKey = process.env.HUGGINGFACE_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'HUGGINGFACE_API_KEY não configurada no servidor.' });
        }

        const model = "runwayml/stable-diffusion-v1-5";
        const apiUrl = `https://api-inference.huggingface.co/models/${model}`;

        console.log("🚀 [Backend] Enviando requisição para Hugging Face API...");

        // Converte base64 para buffer (Node.js)
        const base64WithoutPrefix = base64Data.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64WithoutPrefix, 'base64');

        // Cria o prompt completo
        let fullPrompt = prompt;
        if (secondaryImage) {
            fullPrompt += " (com marca d'água/logo aplicada)";
        }

        // Para a Inference API, podemos enviar FormData ou o binário diretamente
        // no body com o prompt em cabeçalhos ou estrutura específica.
        // Mas a implementação anterior usava FormData.
        // No Node.js (Vercel), FormData é nativo em versões recentes do Node (18+),
        // ou podemos usar o pacote form-data se der erro, mas Vercel roda com Node atualizado.
        
        const formData = new FormData();
        formData.append("inputs", fullPrompt);
        
        // No Node.js recente, FormData aceita Blaob
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
