@echo off
:: ================================================================================
::   RTWE ATTENDANCE LISTENER - STOP
:: ================================================================================

echo Stopping RTWE Attendance Listener...

:: Kill the exe process
taskkill /F /IM attendance-listener.exe >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK] Stopped attendance-listener.exe
) else (
    echo [INFO] attendance-listener.exe was not running
)

:: Kill node process running the script (if any)
for /f "tokens=2" %%i in ('wmic process where "commandline like '%%device-listener-bidirectional%%'" get processid 2^>nul ^| findstr /r "[0-9]"') do (
    taskkill /F /PID %%i >nul 2>&1
    echo [OK] Stopped Node.js process
)

echo.
echo Listener stopped.
echo.
timeout /t 2 >nul
