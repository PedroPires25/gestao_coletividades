@echo off
setlocal enabledelayedexpansion

echo ========================================
echo VALIDACAO DO BACKEND (Maven)
echo ========================================
cd /d "%~dp0gestao-clubes-api"
call mvnw.cmd clean test
set MAVEN_RESULT=!ERRORLEVEL!

echo.
echo ========================================
echo LINT DO FRONTEND (npm run lint)
echo ========================================
cd /d "%~dp0gestao-clubes-web"
call npm run lint
set LINT_RESULT=!ERRORLEVEL!

echo.
echo ========================================
echo BUILD DO FRONTEND (npm run build)
echo ========================================
call npm run build
set BUILD_RESULT=!ERRORLEVEL!

echo.
echo ========================================
echo RESUMO
echo ========================================
echo Resultado dos testes Maven: !MAVEN_RESULT!
echo Resultado do lint npm: !LINT_RESULT!
echo Resultado do build npm: !BUILD_RESULT!
