@echo off
set SERVER_IP=3.107.56.224
set KEY_FILE=rtwe-key.pem
set REMOTE_USER=ubuntu

cd /d "%~dp0"

echo.
echo ===================================================
echo   DIAGNOSING LOGIN ISSUES ON CLOUD SERVER
echo ===================================================
echo.

echo [1/5] Checking if user_sessions table exists...
ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "sudo -u postgres psql -d rtwe_erp -c \"SELECT tablename FROM pg_tables WHERE tablename = 'user_sessions';\""
echo.

echo [2/5] Checking Shekhar_admin user details...
ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "sudo -u postgres psql -d rtwe_erp -c \"SELECT id, custom_user_id, email, email_verified, is_email_verified, is_active, role FROM users WHERE custom_user_id = 'Shekhar_admin';\""
echo.

echo [3/5] Checking user_sessions table structure...
ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "sudo -u postgres psql -d rtwe_erp -c \"\\d user_sessions\""
echo.

echo [4/5] Checking PM2 logs (last 50 lines)...
ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "pm2 logs rtwe-erp --lines 50 --nostream"
echo.

echo [5/5] Testing DB connection from app...
ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "cd /var/www/rtwe-erp && node -e \"require('dotenv').config(); const {Pool}=require('pg'); const pool=new Pool({host:process.env.DB_HOST,database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD,port:process.env.DB_PORT}); pool.query('SELECT 1').then(()=>console.log('✅ DB Connection OK')).catch(e=>console.log('❌ DB Error:', e.message));\""

echo.
echo ===================================================
echo   DIAGNOSIS COMPLETE
echo ===================================================
echo.
pause
