@echo off
echo ========================================
echo   Iniciando ngrok para localhost:5173
echo ========================================
echo.
echo IMPORTANTE: Certifique-se de que o servidor Vite esta rodando!
echo Execute 'npm run dev' em outro terminal primeiro.
echo.
echo Pressione qualquer tecla para continuar...
pause >nul

echo.
echo Iniciando ngrok...
echo.

REM Tenta executar ngrok do PATH
where ngrok >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    ngrok http 5173
) else (
    REM Tenta executar de C:\ngrok
    if exist "C:\ngrok\ngrok.exe" (
        C:\ngrok\ngrok.exe http 5173
    ) else (
        echo ERRO: ngrok nao encontrado!
        echo.
        echo Por favor, instale o ngrok seguindo as instrucoes em NGROK_SETUP.md
        echo.
        pause
    )
)
