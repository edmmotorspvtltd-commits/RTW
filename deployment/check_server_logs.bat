@echo off
set SERVER_IP=3.107.56.224
set KEY_FILE=rtwe-key.pem

cd /d "%~dp0"

echo.
echo ===================================================
echo   VIEWING SERVER LOGS (Ctrl+C to exit)
echo ===================================================
echo.

ssh -i %KEY_FILE% ubuntu@%SERVER_IP% "pm2 logs rtwe-erp --lines 100"

pause
