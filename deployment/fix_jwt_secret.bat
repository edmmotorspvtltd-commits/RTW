@echo off
set SERVER_IP=3.107.56.224
set KEY_FILE=rtwe-key.pem
set REMOTE_USER=ubuntu

cd /d "%~dp0"

echo.
echo ===================================================
echo   FIXING JWT_REFRESH_SECRET ON CLOUD SERVER
echo ===================================================
echo.

echo [1/4] Checking current .env file...
ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "cd /home/ubuntu/rtwe-erp && grep -E 'JWT_SECRET|JWT_REFRESH' .env 2>/dev/null || echo 'No JWT secrets found in .env'"
echo.

echo [2/4] Adding JWT_REFRESH_SECRET if missing...
ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "cd /home/ubuntu/rtwe-erp && if ! grep -q 'JWT_REFRESH_SECRET' .env 2>/dev/null; then echo '' >> .env && echo '# JWT Refresh Token Secret' >> .env && echo 'JWT_REFRESH_SECRET=rtwe-erp-refresh-secret-key-2024-super-secure' >> .env && echo 'JWT_REFRESH_EXPIRES_IN=7d' >> .env && echo '✅ Added JWT_REFRESH_SECRET to .env'; else echo 'JWT_REFRESH_SECRET already exists'; fi"
echo.

echo [3/4] Verifying .env now has the secrets...
ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "cd /home/ubuntu/rtwe-erp && grep -E 'JWT_SECRET|JWT_REFRESH' .env"
echo.

echo [4/4] Restarting application...
ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "pm2 restart rtwe-erp"

echo.
echo ===================================================
echo   FIX COMPLETE! Try logging in again.
echo ===================================================
echo.
pause
