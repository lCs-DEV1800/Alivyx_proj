@echo off
echo ========================================
echo  CheckAgora - Instalacao Backend
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
call npm install
if %errorlevel% neq 0 (
    echo.
    echo ERRO ao instalar dependencias!
    echo Tente executar manualmente:
    echo   npm install
    pause
    exit /b 1
)
echo OK - Dependencias instaladas
echo.

echo [5/5] Verificando arquivo .env...
if not exist .env (
    if exist .env.example (
        copy .env.example .env
        echo AVISO: Arquivo .env criado a partir do .env.example
        echo Por favor, edite o arquivo .env com suas credenciais do MySQL
        echo.
        notepad .env
    ) else (
        echo AVISO: Arquivo .env nao encontrado!
        echo Crie um arquivo .env com as configuracoes do banco de dados
    )
) else (
    echo OK - Arquivo .env existe
)
echo.

echo ========================================
echo  Instalacao concluida com sucesso!
echo ========================================
echo.
echo Para iniciar o backend, execute:
echo   npm start
echo.
echo Ou pressione qualquer tecla para iniciar agora...
pause >nul

echo.
echo Iniciando backend...
call npm start
