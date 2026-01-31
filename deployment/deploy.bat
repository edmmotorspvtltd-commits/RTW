@echo off
:: =================================================================
::   RTWE ERP - AWS DEPLOYMENT SCRIPT
:: =================================================================

set SERVER_IP=3.107.56.224
set KEY_FILE=rtwe-key.pem
set REMOTE_USER=ubuntu

echo.
echo ===================================================
echo   DEPLOYING TO AWS (IP: %SERVER_IP%)
echo ===================================================
echo.

cd /d "%~dp0"

:: 1. Check if key exists
if not exist "%KEY_FILE%" (
    echo [ERROR] Key file %KEY_FILE% not found!
    pause
    exit /b
)

:: 2. Fix Key Permissions (CRITICAL for AWS)
echo [1/4] Securing key file permissions...
icacls %KEY_FILE% /reset
icacls %KEY_FILE% /grant:r "%USERNAME%":"R"
icacls %KEY_FILE% /inheritance:r

:: 3. Upload Setup Script
echo [2/4] Uploading setup scripts...
scp -i %KEY_FILE% -o StrictHostKeyChecking=no setup_vm.sh %REMOTE_USER%@%SERVER_IP%:~/setup_vm.sh
scp -i %KEY_FILE% -o StrictHostKeyChecking=no restore_db.sh %REMOTE_USER%@%SERVER_IP%:~/restore_db.sh
scp -i %KEY_FILE% -o StrictHostKeyChecking=no env.example %REMOTE_USER%@%SERVER_IP%:~/env.example

:: 4. Run Setup on Server
echo [3/4] Running Server Setup (Installs Node, DB, etc)...
echo        (This takes 5 minutes, please wait...)
ssh -i %KEY_FILE% -o StrictHostKeyChecking=no %REMOTE_USER%@%SERVER_IP% "chmod +x ~/setup_vm.sh && ./setup_vm.sh"

:: 5. Upload Code (Excluding node_modules)
echo [4/4] Uploading Application Code (might take time)...
:: We use tar to compress, upload, and extract to avoid 1000s of small file transfers
cd ..
tar -czf deployment/code.tar.gz --exclude=node_modules --exclude=.git --exclude=deployment --exclude=.env .
cd deployment
scp -i %KEY_FILE% code.tar.gz %REMOTE_USER%@%SERVER_IP%:~/code.tar.gz
ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "mkdir -p ~/rtwe-erp && tar -xzf code.tar.gz -C ~/rtwe-erp && rm code.tar.gz"
del code.tar.gz

echo.
echo ===================================================
echo   DEPLOYMENT FINISHED! 🚀
echo ===================================================
echo.
echo Next Steps:
echo 1. Run 'ssh -i rtwe-key.pem ubuntu@%SERVER_IP%' to login.
echo 2. Upload your database backup manualy or using scp.
echo.
pause
