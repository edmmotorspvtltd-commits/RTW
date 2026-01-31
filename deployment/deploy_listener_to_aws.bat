@echo off
set SERVER_IP=3.107.56.224
set KEY_FILE=rtwe-key.pem
set REMOTE_USER=ubuntu

cd /d "%~dp0"

echo.
echo ===================================================
echo   DEPLOYING ATTENDANCE LISTENER TO AWS
echo ===================================================
echo.

echo [1/5] Copying listener files to AWS...
scp -i %KEY_FILE% ..\attendance-listener\device-listener-bidirectional.js %REMOTE_USER%@%SERVER_IP%:/home/ubuntu/rtwe-erp/
scp -i %KEY_FILE% ..\attendance-listener\config.json %REMOTE_USER%@%SERVER_IP%:/home/ubuntu/rtwe-erp/attendance-config.json

echo.
echo [2/5] Installing dependencies on AWS...
ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "cd /home/ubuntu/rtwe-erp && npm install axios zkteco-js --save"

echo.
echo [3/5] Creating PM2 ecosystem config for listener...
ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "cat > /home/ubuntu/rtwe-erp/listener-ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'attendance-listener',
    script: 'device-listener-bidirectional.js',
    cwd: '/home/ubuntu/rtwe-erp',
    env: {
      NODE_ENV: 'production'
    },
    watch: false,
    max_memory_restart: '200M'
  }]
};
EOF"

echo.
echo [4/5] Starting attendance listener with PM2...
ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "cd /home/ubuntu/rtwe-erp && pm2 start listener-ecosystem.config.js"
ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "pm2 save"

echo.
echo [5/5] Checking listener status...
ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "pm2 list"

echo.
echo ===================================================
echo   DEPLOYMENT COMPLETE!
echo ===================================================
echo.
echo IMPORTANT: You need to open port 8080 in AWS Security Group!
echo   1. Go to AWS Console > EC2 > Security Groups
echo   2. Add Inbound Rule: Custom TCP, Port 8080, Source 0.0.0.0/0
echo.
echo Then update eSSL device:
echo   Server Address: 3.107.56.224
echo   Server Port: 8080
echo.
pause
