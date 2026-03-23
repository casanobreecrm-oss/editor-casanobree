const apiKey = "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";
const model = "runwayml/stable-diffusion-v1-5";
const apiUrl = `https://api-inference.huggingface.co/models/${model}`;

async function run() {
    console.log("🚀 [Teste] Iniciando requisição para Hugging Face...");
    
    const base64Image = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    
    const requestBody = {
        inputs: "improve image quality, brighten",
        image: base64Image
    };

    try {
        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody),
        });

        console.log(`Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log("Resposta:", text.substring(0, 500)); // Limita logs
    } catch (error) {
        console.error("Erro na requisição:", error);
    }
}

run();
