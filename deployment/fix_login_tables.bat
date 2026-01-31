@echo off
set SERVER_IP=3.107.56.224
set KEY_FILE=rtwe-key.pem
set REMOTE_USER=ubuntu

cd /d "%~dp0"

echo.
echo ===================================================
echo   FIXING LOGIN TABLES AND EMAIL VERIFICATION
echo ===================================================
echo.

echo [1/3] Creating user_sessions table if missing...
ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "sudo -u postgres psql -d rtwe_erp -c \"CREATE TABLE IF NOT EXISTS user_sessions (id SERIAL PRIMARY KEY, user_id INTEGER, session_id TEXT, refresh_token TEXT, ip_address TEXT, user_agent TEXT, expires_at TIMESTAMP, is_active BOOLEAN DEFAULT true, created_at TIMESTAMP DEFAULT NOW());\""

echo [2/3] Ensuring email_verified is TRUE for Shekhar_admin...
ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "sudo -u postgres psql -d rtwe_erp -c \"UPDATE users SET email_verified = true, is_email_verified = true WHERE custom_user_id = 'Shekhar_admin';\""

echo [3/3] Restarting application...
ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "pm2 restart rtwe-erp"

echo.
echo ===================================================
echo   FIX COMPLETE! Try logging in now.
echo ===================================================
echo.
pause
