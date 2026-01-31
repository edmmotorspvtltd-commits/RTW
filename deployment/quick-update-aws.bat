@echo off
:: =================================================================
::   RTWE ERP - QUICK UPDATE TO AWS (Changed Files Only)
:: =================================================================

set SERVER_IP=3.107.56.224
set KEY_FILE=rtwe-key.pem
set REMOTE_USER=ubuntu
set REMOTE_PATH=/home/ubuntu/rtwe-erp

echo.
echo ===================================================
echo   QUICK UPDATE TO AWS (IP: %SERVER_IP%)
echo   Uploading only changed files...
echo ===================================================
echo.

cd /d "%~dp0"

:: Check if key exists
if not exist "%KEY_FILE%" (
    echo [ERROR] Key file %KEY_FILE% not found!
    pause
    exit /b
)

:: Fix Key Permissions
echo [1/5] Securing key file permissions...
icacls %KEY_FILE% /reset >nul 2>&1
icacls %KEY_FILE% /grant:r "%USERNAME%":"R" >nul 2>&1
icacls %KEY_FILE% /inheritance:r >nul 2>&1

:: Upload Backend Files
echo [2/5] Uploading backend calculation files...
scp -i %KEY_FILE% -o StrictHostKeyChecking=no ..\backend\rapier-costing\utils\costing-calculations.js %REMOTE_USER%@%SERVER_IP%:%REMOTE_PATH%/backend/rapier-costing/utils/
scp -i %KEY_FILE% -o StrictHostKeyChecking=no ..\backend\rapier-costing\controllers\costing.controller.simple.js %REMOTE_USER%@%SERVER_IP%:%REMOTE_PATH%/backend/rapier-costing/controllers/

:: Upload Frontend Files
echo [3/5] Uploading frontend fixes...
scp -i %KEY_FILE% -o StrictHostKeyChecking=no ..\frontend\rapier-costing.html %REMOTE_USER%@%SERVER_IP%:%REMOTE_PATH%/frontend/
scp -i %KEY_FILE% -o StrictHostKeyChecking=no ..\frontend\js\costing-calculations.js %REMOTE_USER%@%SERVER_IP%:%REMOTE_PATH%/frontend/js/
scp -i %KEY_FILE% -o StrictHostKeyChecking=no ..\frontend\js\costing-functions.js %REMOTE_USER%@%SERVER_IP%:%REMOTE_PATH%/frontend/js/
scp -i %KEY_FILE% -o StrictHostKeyChecking=no ..\frontend\js\sidebar-metrics-update.js %REMOTE_USER%@%SERVER_IP%:%REMOTE_PATH%/frontend/js/
scp -i %KEY_FILE% -o StrictHostKeyChecking=no ..\frontend\js\costing-profit-helper.js %REMOTE_USER%@%SERVER_IP%:%REMOTE_PATH%/frontend/js/

:: Restart Backend
echo [4/5] Restarting backend server...
ssh -i %KEY_FILE% -o StrictHostKeyChecking=no %REMOTE_USER%@%SERVER_IP% "cd %REMOTE_PATH%/backend && pm2 restart rtwe-backend"

:: Check Status
echo [5/5] Checking server status...
ssh -i %KEY_FILE% -o StrictHostKeyChecking=no %REMOTE_USER%@%SERVER_IP% "pm2 list"

echo.
echo ===================================================
echo   DEPLOYMENT COMPLETE! 🚀
echo ===================================================
echo.
echo Your application is now updated at:
echo   http://%SERVER_IP%
echo.
echo Changes deployed:
echo   ✅ Backend calculation system
echo   ✅ Selling price input fix
echo   ✅ Security fixes (console.log removed)
echo   ✅ Database field population
echo.
pause
