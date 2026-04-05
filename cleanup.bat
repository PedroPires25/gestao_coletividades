@echo off
REM Script para limpar ficheiros duplicados

setlocal enabledelayedexpansion

set DAO_PATH=C:\Users\Pedro Pires\Desktop\Projeto-final\gestao-clubes-api\src\main\java\com\gestaoclubes\api\dao

echo Limpando ficheiros duplicados...
echo.

if exist "%DAO_PATH%\ColetividadeAtividadeDAO.java.backup" (
    del /f "%DAO_PATH%\ColetividadeAtividadeDAO.java.backup"
    echo [OK] Removido: ColetividadeAtividadeDAO.java.backup
) else (
    echo [SKIP] ColetividadeAtividadeDAO.java.backup nao existe
)

if exist "%DAO_PATH%\ColetividadeAtividadeDAO_NEW.java" (
    del /f "%DAO_PATH%\ColetividadeAtividadeDAO_NEW.java"
    echo [OK] Removido: ColetividadeAtividadeDAO_NEW.java
) else (
    echo [SKIP] ColetividadeAtividadeDAO_NEW.java nao existe
)

echo.
echo Limpeza concluida!
echo Ficheiros restantes em %DAO_PATH%:
dir /B "%DAO_PATH%\ColetividadeAtividade*"

endlocal
