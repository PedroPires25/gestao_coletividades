@echo off
cd /d "C:\Users\Pedro Pires\Desktop\Projeto-final\gestao-clubes-api"
rmdir /s /q "gestao-clubes-api"
if %errorlevel% equ 0 (
    echo Pasta duplicada removida com sucesso!
) else (
    echo Erro ao remover a pasta.
)
pause
