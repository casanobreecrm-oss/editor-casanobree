import { User } from '../types';

/**
 * Este serviço simula a comunicação com o futuro backend do site da Casanobree/CRM.
 * Quando o site real estiver pronto, substituiremos o `mockFetch` por `fetch` real.
 */

// URL da API (Futura)
// const API_ENDPOINT = "https://api.casanobree.com.br/v1/integracao/upload";

interface UploadPayload {
  agentName: string;
  agentUsername: string;
  propertyRef: string; // Código de referência do imóvel (Ex: REF-1020)
  images: {
    fileName: string;
    base64Data: string;
  }[];
}

export const uploadToCRM = async (user: User, propertyRef: string, images: { fileName: string, base64: string }[]): Promise<boolean> => {
  console.log("Iniciando upload para CRM...", { user: user.username, ref: propertyRef, count: images.length });

  // Prepara o pacote de dados (Payload)
  const payload: UploadPayload = {
    agentName: user.name,
    agentUsername: user.username,
    propertyRef: propertyRef.toUpperCase(),
    images: images.map(img => ({
      fileName: img.fileName,
      base64Data: img.base64 // Em produção, enviaríamos Multipart/FormData, mas JSON funciona para testes
    }))
  };

  // SIMULAÇÃO DE ENVIO (MOCK)
  // Substitua este bloco pelo fetch real no futuro
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 90% de chance de sucesso para simular a vida real
      const success = Math.random() > 0.1;
      
      if (success) {
        console.log("Casanobree CRM: Upload recebido com sucesso!", payload);
        resolve(true);
      } else {
        console.error("Casanobree CRM: Falha na conexão.");
        reject(new Error("Erro de conexão com o servidor da imobiliária. Tente novamente."));
      }
    }, 2500); // 2.5 segundos de delay para parecer real
  });
};
