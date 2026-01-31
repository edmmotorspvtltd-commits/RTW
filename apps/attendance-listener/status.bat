@echo off
:: ================================================================================
::   RTWE ATTENDANCE LISTENER - STATUS
:: ================================================================================

echo.
echo ===================================================
echo   RTWE ATTENDANCE LISTENER - STATUS
echo ===================================================
echo.

:: Check if exe is running
echo Checking processes...
echo.

tasklist /FI "IMAGENAME eq attendance-listener.exe" 2>NUL | find /I "attendance-listener.exe" >NUL
if %errorLevel% equ 0 (
    echo [RUNNING] attendance-listener.exe is running
) else (
    echo [STOPPED] attendance-listener.exe is not running
)

:: Check for Node.js process
wmic process where "commandline like '%%device-listener-bidirectional%%'" get processid 2>nul | findstr /r "[0-9]" >nul
if %errorLevel% equ 0 (
    echo [RUNNING] Node.js listener is running
)

:: Check scheduled task
echo.
echo Checking scheduled task...
schtasks /query /tn "RTWE Attendance Listener" >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK] Auto-start task is configured
) else (
    echo [WARN] Auto-start task is NOT configured
)

:: Check API endpoint
echo.
echo Checking API endpoint...
curl -s http://localhost:3002/health >nul 2>&1
if %errorLevel% equ 0 (
    echo [OK] API server is responding on port 3002
) else (
    echo [WARN] API server is not responding on port 3002
)

echo.
echo ===================================================
echo.
pause
