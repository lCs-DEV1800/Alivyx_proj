@echo off
echo ========================================
echo  CheckAgora - Instalacao Frontend
echo  Windows Script
echo ========================================
echo.

echo [1/5] Removendo node_modules antigo...
if exist node_modules (
    rmdir /s /q node_modules
    echo OK - node_modules removido
) else (
    echo OK - node_modules nao existe
)
echo.

echo [2/5] Removendo package-lock.json...
if exist package-lock.json (
    del /f package-lock.json
    echo OK - package-lock.json removido
) else (
    echo OK - package-lock.json nao existe
)
echo.

echo [3/5] Limpando cache do npm...
call npm cache clean --force
echo OK - Cache limpo
echo.

echo [4/5] Instalando dependencias...
echo Isso pode demorar alguns minutos...
call npm install --legacy-peer-deps
if %errorlevel% neq 0 (
    echo.
    echo ERRO ao instalar dependencias!
    echo Tente executar manualmente:
    echo   npm install --legacy-peer-deps
    pause
    exit /b 1
)
echo OK - Dependencias instaladas
echo.

echo [5/5] Pronto para iniciar!
echo.
echo ========================================
echo  Instalacao concluida com sucesso!
echo ========================================
echo.
echo Para iniciar o frontend, execute:
echo   npm start
echo.
echo Ou pressione qualquer tecla para iniciar agora...
pause >nul

echo.
echo Iniciando frontend...
call npm start
