@echo off
cd /d "%~dp0gestao-clubes-api"
echo A transferir dependencias Maven...
mvn dependency:resolve
echo.
echo A compilar projeto...
mvn clean install -DskipTests
pause
