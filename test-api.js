// Teste simples para verificar se a API do Gemini está configurada
console.log('🔍 Testando configuração da API do Gemini...');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✅ Configurada (primeiros 10 chars: ' + process.env.GEMINI_API_KEY.substring(0, 10) + '...)' : '❌ NÃO CONFIGURADA');
console.log('API_KEY:', process.env.API_KEY ? '✅ Configurada (primeiros 10 chars: ' + process.env.API_KEY.substring(0, 10) + '...)' : '❌ NÃO CONFIGURADA');

// Testa se a biblioteca pode ser importada
try {
    const { GoogleGenAI } = require('@google/genai');
    console.log('✅ Biblioteca @google/genai carregada com sucesso');

    // Tenta criar uma instância
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
    if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        console.log('✅ Cliente GoogleGenAI criado com sucesso');
        console.log('📝 Chave da API tem', apiKey.length, 'caracteres');
    } else {
        console.error('❌ ERRO: Nenhuma chave de API encontrada!');
    }
} catch (error) {
    console.error('❌ Erro ao carregar biblioteca:', error);
}
