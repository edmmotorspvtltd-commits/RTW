@echo off
set SERVER_IP=3.107.56.224
set KEY_FILE=rtwe-key.pem
set REMOTE_USER=ubuntu

cd /d "%~dp0"

echo.
echo ===================================================
echo   CHECKING ATTENDANCE DATA SYNC TO AWS
echo ===================================================
echo.

echo [1/4] Checking if attendance API is responding...
curl -s "http://%SERVER_IP%:3000/api/attendance/status" 2>nul || echo API check via curl failed

echo.
echo [2/4] Checking latest attendance records in database...
ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "sudo -u postgres psql -d rtwe_erp -c \"SELECT id, employee_id, punch_time, source, created_at FROM attendance_logs ORDER BY created_at DESC LIMIT 10;\""

echo.
echo [3/4] Checking if listener has sent any data (last 24 hours)...
ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "sudo -u postgres psql -d rtwe_erp -c \"SELECT COUNT(*) as count_today FROM attendance_logs WHERE created_at > NOW() - INTERVAL '24 hours';\""

echo.
echo [4/4] Checking server logs for attendance receive...
ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "pm2 logs rtwe-erp --lines 30 --nostream 2>&1 | grep -i 'attendance\|receive' | tail -10"

echo.
echo ===================================================
echo   SYNC CHECK COMPLETE
echo ===================================================
echo.
echo If no recent records, check:
echo   1. Is listener running on Toyota PC? (run status.bat)
echo   2. Can Toyota PC reach AWS? (ping 3.107.56.224)
echo   3. Is device pushing data? (check device ADMS settings)
echo.
pause
