# 🤗 Configuração do Hugging Face API

## 🎯 Por que Hugging Face?

- ✅ **100% GRATUITO** - Sem necessidade de cartão de crédito
- ✅ **Modelos de Alta Qualidade** - FLUX, FireRed, Stable Diffusion
- ✅ **Fácil de Usar** - API simples e bem documentada
- ✅ **Sem Limites Rígidos** - Muito mais generoso que outras APIs gratuitas

---

## 📝 Passo 1: Criar Conta (2 minutos)

1. Acesse: **https://huggingface.co/join**
2. Crie sua conta gratuita
3. Confirme seu email

---

## 🔑 Passo 2: Obter API Token (1 minuto)

1. Faça login em: **https://huggingface.co**
2. Clique no seu **avatar** (canto superior direito)
3. Vá em **Settings** → **Access Tokens**
4. Ou acesse diretamente: **https://huggingface.co/settings/tokens**
5. Clique em **"New token"**
6. Configure:
   - **Name**: `Editor de Imagens` (ou qualquer nome)
   - **Role**: Selecione **"Read"** (suficiente para usar modelos)
7. Clique em **"Generate token"**
8. **COPIE O TOKEN** (você só verá uma vez!)

---

## ⚙️ Passo 3: Configurar no Projeto

1. Abra o arquivo **`.env.local`** na raiz do projeto
2. Adicione a linha:

```env
HUGGINGFACE_API_KEY=seu_token_aqui
```

3. Substitua `seu_token_aqui` pelo token que você copiou
4. Salve o arquivo

**Exemplo completo do `.env.local`:**
```env
GEMINI_API_KEY=AIzaSyA_D5ZP1pDmUQSBOSq3O7zDRAlXdcLWQ0I
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🚀 Passo 4: Testar a API

Execute o servidor de desenvolvimento:

```bash
npm run dev
```

Agora você pode:
1. Fazer upload de uma imagem
2. Escrever um prompt de edição
3. Clicar em **"Editar Imagem"**
4. Aguardar a mágica acontecer! ✨

---

## 🎨 Modelos Disponíveis

O projeto usa automaticamente os melhores modelos:

### 🥇 FLUX.1-dev (Padrão)
- **Qualidade**: ⭐⭐⭐⭐⭐
- **Velocidade**: ⭐⭐⭐
- **Uso**: Edição de imagens de alta qualidade

### 🥈 FLUX.1-schnell (Alternativo)
- **Qualidade**: ⭐⭐⭐⭐
- **Velocidade**: ⭐⭐⭐⭐⭐
- **Uso**: Geração rápida de imagens

---

## ⚠️ Observações Importantes

1. **Primeira Requisição Lenta**: O modelo pode demorar ~20 segundos na primeira vez (está "acordando")
2. **Requisições Seguintes**: Muito mais rápidas (~5-10 segundos)
3. **Limite de Taxa**: ~1000 requisições/dia no plano gratuito (muito generoso!)
4. **Tamanho da Imagem**: Recomendado até 1024x1024 pixels

---

## 🆘 Problemas Comuns

### ❌ "API Key não configurada"
- Verifique se o arquivo `.env.local` existe
- Confirme que a variável se chama `HUGGINGFACE_API_KEY`
- Reinicie o servidor (`Ctrl+C` e `npm run dev` novamente)

### ❌ "Modelo está carregando"
- Aguarde 20-30 segundos e tente novamente
- É normal na primeira requisição

### ❌ "API Key inválida"
- Verifique se copiou o token completo
- Gere um novo token se necessário

---

## 📚 Recursos Úteis

- **Documentação Oficial**: https://huggingface.co/docs/api-inference
- **Modelos Disponíveis**: https://huggingface.co/models?pipeline_tag=image-to-image
- **Suporte**: https://discuss.huggingface.co/

---

## 🎉 Pronto!

Agora você tem um editor de imagens com IA **100% gratuito e poderoso**! 🚀

Divirta-se criando imagens incríveis! ✨
