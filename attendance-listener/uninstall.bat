@echo off
:: ================================================================================
::   RTWE ATTENDANCE LISTENER - UNINSTALL
:: ================================================================================

echo.
echo ===================================================
echo   RTWE ATTENDANCE LISTENER - UNINSTALLER
echo ===================================================
echo.

:: Check for admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Please run this script as Administrator!
    pause
    exit /b 1
)

:: Stop the listener
echo Stopping listener...
taskkill /F /IM attendance-listener.exe >nul 2>&1
for /f "tokens=2" %%i in ('wmic process where "commandline like '%%device-listener-bidirectional%%'" get processid 2^>nul ^| findstr /r "[0-9]"') do (
    taskkill /F /PID %%i >nul 2>&1
)
echo [OK] Listener stopped

:: Remove scheduled task
echo Removing scheduled task...
schtasks /delete /tn "RTWE Attendance Listener" /f >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK] Scheduled task removed
) else (
    echo [INFO] No scheduled task found
)

echo.
echo ===================================================
echo   UNINSTALL COMPLETE
echo ===================================================
echo.
echo The listener has been stopped and will no longer
echo auto-start on boot.
echo.
echo You can delete this folder to remove all files.
echo.
pause
