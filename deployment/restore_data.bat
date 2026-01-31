@echo off
:: =================================================================
::   RTWE ERP - DATA RESTORE TOOL
::   Uploads your local backup to the AWS Cloud
:: =================================================================

set SERVER_IP=3.107.56.224
set KEY_FILE=rtwe-key.pem
set REMOTE_USER=ubuntu

cd /d "%~dp0"

echo.
echo ===================================================
echo   RESTORE DATABASE TO CLOUD
echo ===================================================
echo.
echo We need to send your "memories" (data) to the new server.
echo.
:: Auto-find the latest .sql file
for /f "delims=" %%i in ('dir /b /o-d /a-d *.sql') do (
    set BACKUP_PATH=%%i
    goto Found
)

echo [ERROR] No .sql file found in this folder!
echo Please run backup_db.bat first.
pause
exit /b

:Found
echo Found Latest Backup: %BACKUP_PATH%
echo.
pause

echo.
echo [1/2] Uploading backup file...
scp -i %KEY_FILE% "%BACKUP_PATH%" %REMOTE_USER%@%SERVER_IP%:~/backup.sql

echo [2/2] Restoring data on server...
:: We pipe 'y' to the script to answer the confirmation prompt automatically
ssh -i %KEY_FILE% %REMOTE_USER%@%SERVER_IP% "chmod +x ~/restore_db.sh && echo y | ./restore_db.sh backup.sql"

echo.
echo ===================================================
echo   RESTORE COMPLETE! 🥳
echo ===================================================
echo.
pause
