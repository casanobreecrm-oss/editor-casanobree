# 🌐 Guia de Configuração do ngrok

## 📥 Passo 1: Instalar o ngrok

### Opção A: Download Direto (Recomendado)
1. Acesse: https://ngrok.com/download
2. Baixe a versão para Windows
3. Extraia o arquivo `ngrok.exe` para uma pasta (ex: `C:\ngrok\`)
4. Adicione a pasta ao PATH do Windows OU copie o `ngrok.exe` para a pasta do projeto

### Opção B: Via PowerShell (Rápido)
Execute no PowerShell como Administrador:
```powershell
# Criar pasta para ngrok
New-Item -Path "C:\ngrok" -ItemType Directory -Force

# Baixar ngrok
Invoke-WebRequest -Uri "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip" -OutFile "C:\ngrok\ngrok.zip"

# Extrair
Expand-Archive -Path "C:\ngrok\ngrok.zip" -DestinationPath "C:\ngrok" -Force

# Adicionar ao PATH (sessão atual)
$env:Path += ";C:\ngrok"
```

---

## 🔑 Passo 2: Criar Conta e Autenticar (Obrigatório)

1. Crie uma conta gratuita em: https://dashboard.ngrok.com/signup
2. Copie seu authtoken em: https://dashboard.ngrok.com/get-started/your-authtoken
3. Execute no terminal:
```bash
ngrok config add-authtoken SEU_TOKEN_AQUI
```

---

## 🚀 Passo 3: Usar o ngrok

### Método Simples (Comando Direto)
```bash
# Inicie seu servidor Vite primeiro
npm run dev

# Em outro terminal, execute:
ngrok http 5173
```

### Método Automatizado (Use o script start-ngrok.bat)
Basta executar:
```bash
.\start-ngrok.bat
```

---

## 📋 O que você verá

Após executar o ngrok, você verá algo assim:

```
Session Status                online
Account                       seu-email@example.com
Version                       3.x.x
Region                        United States (us)
Forwarding                    https://xxxx-xxxx-xxxx.ngrok-free.app -> http://localhost:5173
```

**Compartilhe o link `https://xxxx-xxxx-xxxx.ngrok-free.app` com seu amigo!** 🎉

---

## ⚠️ Observações Importantes

- O link do ngrok muda toda vez que você reinicia
- A versão gratuita tem limite de conexões simultâneas
- Seu servidor local (`npm run dev`) precisa estar rodando
- O ngrok funciona apenas enquanto o comando estiver ativo

---

## 🛠️ Solução de Problemas

### Erro: "command not found"
- Certifique-se de que o ngrok está no PATH ou execute com caminho completo: `C:\ngrok\ngrok.exe http 5173`

### Erro: "authentication required"
- Execute: `ngrok config add-authtoken SEU_TOKEN`

### Porta errada?
- Verifique qual porta o Vite está usando (geralmente 5173)
- Ajuste o comando: `ngrok http PORTA_CORRETA`
