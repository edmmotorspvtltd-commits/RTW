@echo off
set SERVER_IP=3.107.56.224
set KEY_FILE=rtwe-key.pem
set REMOTE_USER=ubuntu

cd /d "%~dp0"

echo.
echo ===================================================
echo   LISTING ALL USERS ON CLOUD DB
echo ===================================================
echo.

echo [Users Table]
ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "sudo -u postgres psql -d rtwe_erp -c \"SELECT id, custom_user_id, user_name, email, role FROM users;\""

echo.
echo ===================================================
echo   Take a look above! 👆
echo   Use one of these Usernames or Emails to login.
echo ===================================================
echo.
pause
