@echo off
echo ========================================
echo   Iniciando Servidor + ngrok
echo ========================================
echo.

REM Inicia o servidor Vite em uma nova janela
start "Vite Dev Server" cmd /k "npm run dev"

echo Aguardando servidor iniciar...
timeout /t 5 /nobreak >nul

echo.
echo Iniciando ngrok em uma nova janela...
echo.

REM Inicia o ngrok em uma nova janela
start "ngrok Tunnel" cmd /k "start-ngrok.bat"

echo.
echo ========================================
echo   Tudo pronto!
echo ========================================
echo.
echo Duas janelas foram abertas:
echo 1. Servidor Vite (localhost:5173)
echo 2. ngrok Tunnel (link publico)
echo.
echo Verifique a janela do ngrok para obter o link publico!
echo.
pause
