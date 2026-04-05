@echo off
REM Script de Compilação - Redirecionamento por Perfil

echo ========================================
echo COMPILANDO BACKEND
echo ========================================
echo.

cd C:\Users\Pedro Pires\Desktop\Projeto-final\gestao-clubes-api

echo Limpando build anterior...
mvn clean -q

echo.
echo Compilando...
mvn compile -q

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo [SUCCESS] Backend compilado com sucesso!
    echo ========================================
    echo.
    echo Pode agora:
    echo 1. Executar: mvn spring-boot:run
    echo 2. Ou compilar o frontend:
    echo    cd ..\gestao-clubes-web
    echo    npm run build
) else (
    echo.
    echo ========================================
    echo [ERRO] Compilacao falhou!
    echo ========================================
    echo.
    echo Verifique os erros acima
)

pause
