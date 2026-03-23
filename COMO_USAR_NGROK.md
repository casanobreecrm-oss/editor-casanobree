# 🎉 ngrok Instalado com Sucesso!

## ✅ Status da Instalação
- **Versão instalada**: ngrok 3.36.0
- **Localização**: `C:\ngrok\ngrok.exe`
- **Scripts criados**: ✓

---

## 🚀 Como Usar (3 Passos Simples)

### 1️⃣ Criar Conta e Autenticar (OBRIGATÓRIO - Só precisa fazer 1 vez)

1. **Crie uma conta gratuita**: https://dashboard.ngrok.com/signup
2. **Copie seu authtoken**: https://dashboard.ngrok.com/get-started/your-authtoken
3. **Execute no terminal**:
```bash
C:\ngrok\ngrok.exe config add-authtoken SEU_TOKEN_AQUI
```

### 2️⃣ Iniciar Servidor + ngrok

**Opção A: Automático (Recomendado)**
```bash
.\start-dev-and-ngrok.bat
```
Este script abre duas janelas:
- Servidor Vite (localhost:5173)
- ngrok com link público

**Opção B: Manual**
```bash
# Terminal 1: Iniciar servidor
npm run dev

# Terminal 2: Iniciar ngrok
C:\ngrok\ngrok.exe http 5173
```

### 3️⃣ Compartilhar o Link

Após executar o ngrok, você verá:

```
Forwarding    https://xxxx-xxxx-xxxx.ngrok-free.app -> http://localhost:5173
```

**Copie e compartilhe o link `https://xxxx-xxxx-xxxx.ngrok-free.app`** 🎉

---

## 📝 Observações

- ⚠️ **O link muda toda vez que você reinicia o ngrok**
- 🆓 **Versão gratuita**: Limite de 40 conexões/minuto
- 🔄 **Mantenha ambos rodando**: Vite + ngrok precisam estar ativos
- 🔐 **Primeiro uso**: Não esqueça de autenticar com seu token!

---

## 🛠️ Comandos Úteis

```bash
# Ver versão
C:\ngrok\ngrok.exe version

# Autenticar
C:\ngrok\ngrok.exe config add-authtoken SEU_TOKEN

# Iniciar na porta 5173
C:\ngrok\ngrok.exe http 5173

# Iniciar em outra porta
C:\ngrok\ngrok.exe http 3000
```

---

## 📚 Arquivos Criados

- `NGROK_SETUP.md` - Guia completo de instalação
- `start-ngrok.bat` - Inicia apenas o ngrok
- `start-dev-and-ngrok.bat` - Inicia Vite + ngrok juntos
- `COMO_USAR_NGROK.md` - Este arquivo (guia rápido)
