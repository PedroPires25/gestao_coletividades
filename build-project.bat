@echo off
setlocal enabledelayedexpansion
cd /d "C:\Users\Pedro Pires\Desktop\Projeto-final\gestao-clubes-api"
call mvnw.cmd clean install -DskipTests
echo Build completed with exit code: %ERRORLEVEL%
