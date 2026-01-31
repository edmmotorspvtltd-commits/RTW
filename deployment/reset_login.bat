@echo off
set SERVER_IP=3.107.56.224
set KEY_FILE=rtwe-key.pem
set REMOTE_USER=ubuntu

cd /d "%~dp0"

echo.
echo ===================================================
echo   RESETTING PASSWORD FOR 'Shekhar_admin'
echo ===================================================
echo.

echo [1/2] Uploading reset script...
scp -i %KEY_FILE% reset_user_password.js %REMOTE_USER%@%SERVER_IP%:~/rtwe-erp/reset_user_password.js

echo [2/2] Running reset script...
ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "cd ~/rtwe-erp && node reset_user_password.js"

echo.
echo ===================================================
echo   DONE! Try logging in now.
echo ===================================================
echo.
pause
