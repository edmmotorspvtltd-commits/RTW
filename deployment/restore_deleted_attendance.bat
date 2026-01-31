@echo off
echo ============================================
echo Restoring Deleted Attendance Records
echo ============================================
echo.

echo This will restore recently deleted attendance records...
echo.

ssh -i rtwe-key.pem ubuntu@3.107.56.224 "sudo -u postgres psql rtwe_erp -c \"UPDATE attendance_logs SET status = 'active', remarks = 'Restored after accidental deletion' WHERE status = 'deleted' AND edited_at > (NOW() - INTERVAL '1 hour') RETURNING log_id, employee_id, punch_time;\""

echo.
echo ============================================
echo Restore Complete!
echo ============================================
pause
