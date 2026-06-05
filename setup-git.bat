@echo off
cd /d "%~dp0"

echo A inicializar repositorio Git...
git init

echo A configurar utilizador Git...
git config user.name "Pedro Pires"
git config user.email "seu.email@example.com"

echo A criar .gitignore...
(
echo node_modules/
echo .idea/
echo .env
echo .DS_Store
echo dist/
echo build/
echo *.log
) > .gitignore

echo A adicionar ficheiros...
git add .

echo A criar primeiro commit...
git commit -m "Initial commit"

echo.
echo Concluido! Repositorio Git criado.
echo.
echo Proximos passos:
echo 1. Ir a https://github.com/new
echo 2. Criar novo repositorio (ex: gestao-clubes-api)
echo 3. Depois correr:
echo    git remote add origin https://github.com/SEU_USERNAME/gestao-clubes-api.git
echo    git branch -M main
echo    git push -u origin main
echo.
pause
