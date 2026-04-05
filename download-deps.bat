@echo off
cd /d "C:\Users\Pedro Pires\Desktop\Projeto-final\gestao-clubes-api"
echo Downloading Maven dependencies...
mvn dependency:resolve
echo.
echo Building project...
mvn clean install -DskipTests
pause
