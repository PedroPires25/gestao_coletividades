@echo off
setlocal enabledelayedexpansion

echo ========================================
echo BACKEND VALIDATION (Maven)
echo ========================================
cd /d "C:\Users\Pedro Pires\OneDrive - Colégio Marista Carcavelos\Ambiente de Trabalho\Projeto-final\gestao-clubes-api"
call mvnw.cmd clean test
set MAVEN_RESULT=!ERRORLEVEL!

echo.
echo ========================================
echo FRONTEND LINTING (npm run lint)
echo ========================================
cd /d "C:\Users\Pedro Pires\OneDrive - Colégio Marista Carcavelos\Ambiente de Trabalho\Projeto-final\gestao-clubes-web"
call npm run lint
set LINT_RESULT=!ERRORLEVEL!

echo.
echo ========================================
echo FRONTEND BUILD (npm run build)
echo ========================================
call npm run build
set BUILD_RESULT=!ERRORLEVEL!

echo.
echo ========================================
echo SUMMARY
echo ========================================
echo Maven Test Result: !MAVEN_RESULT!
echo npm Lint Result: !LINT_RESULT!
echo npm Build Result: !BUILD_RESULT!
