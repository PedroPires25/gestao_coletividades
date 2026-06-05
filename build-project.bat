@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0gestao-clubes-api"
call mvnw.cmd clean install -DskipTests
echo Build concluida com codigo de saida: %ERRORLEVEL%
