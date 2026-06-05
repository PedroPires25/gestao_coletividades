@echo off
cd /d "%~dp0gestao-clubes-api"
rmdir /s /q "gestao-clubes-api"
if %errorlevel% equ 0 (
    echo Pasta duplicada removida com sucesso!
) else (
    echo Erro ao remover a pasta.
)
pause
