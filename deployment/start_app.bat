@echo off
:: =================================================================
::   RTWE ERP - START APP SCRIPT
::   Installs dependencies and starts PM2
:: =================================================================

set SERVER_IP=3.107.56.224
set KEY_FILE=rtwe-key.pem
set REMOTE_USER=ubuntu

cd /d "%~dp0"

echo.
echo ===================================================
echo   FINALIZING SERVER SETUP
echo ===================================================
echo.
echo [1/3] Configuring Environment...
ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "cd ~/rtwe-erp && cp ~/env.example .env"

echo [2/3] Installing Dependencies (This takes 1-2 mins)...
ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "cd ~/rtwe-erp && npm install"

echo [3/3] Starting Application with PM2...
ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "cd ~/rtwe-erp && pm2 delete rtwe-erp 2> /dev/null"
ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "cd ~/rtwe-erp && pm2 start backend/server.js --name rtwe-erp"
ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "pm2 save"

echo.
echo ===================================================
echo   APP IS LIVE! 🟢
echo   Visit: http://%SERVER_IP%:3000
echo ===================================================
echo.
pause
