@echo off
set SERVER_IP=3.107.56.224
set KEY_FILE=rtwe-key.pem
set REMOTE_USER=ubuntu

cd /d "%~dp0"

echo.
echo ===================================================
echo   CHECKING TODAY'S ATTENDANCE DATA
echo ===================================================
echo.

echo [1/3] Checking recent attendance logs...
ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "sudo -u postgres psql -d rtwe_erp -c 'SELECT log_id, employee_id, punch_time, created_at FROM attendance_logs ORDER BY log_id DESC LIMIT 10;'"

echo.
echo [2/3] Checking listener logs...
ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "pm2 logs attendance-listener --lines 30 --nostream 2>&1 | tail -20"

echo.
echo [3/3] Checking listener status...
ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "curl -s http://localhost:3002/status"

echo.
echo ===================================================
echo   CHECK COMPLETE
echo ===================================================
echo.
pause
