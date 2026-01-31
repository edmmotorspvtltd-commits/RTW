@echo off
set SERVER_IP=3.107.56.224
set KEY_FILE=rtwe-key.pem
set REMOTE_USER=ubuntu

cd /d "%~dp0"

echo.
echo ===================================================
echo   FIXING DATABASE PASSWORD
echo ===================================================
echo.
echo The error logs show "password authentication failed".
echo This means the App Password (in .env) != Database Password.
echo.
echo [1/2] Updating Database Password to 'Shekhar@2506'...

ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "sudo -u postgres psql -c \"ALTER USER postgres PASSWORD 'Shekhar@2506';\""

echo.
echo [2/2] Restarting Application...
ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "pm2 restart rtwe-erp"

echo.
echo ===================================================
echo   FIX COMPLETE! ✅
echo   Please try to login again.
echo ===================================================
echo.
pause
