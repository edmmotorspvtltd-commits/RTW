@echo off
:: ================================================================================
::   RTWE ATTENDANCE LISTENER - START
:: ================================================================================

echo Starting RTWE Attendance Listener...

set INSTALL_DIR=%~dp0
set EXE_PATH=%INSTALL_DIR%attendance-listener.exe
set SCRIPT_PATH=%INSTALL_DIR%device-listener-bidirectional.js

:: Check if already running
tasklist /FI "IMAGENAME eq attendance-listener.exe" 2>NUL | find /I "attendance-listener.exe" >NUL
if %errorLevel% equ 0 (
    echo [INFO] Listener is already running!
    pause
    exit /b 0
)

:: Start the listener
if exist "%EXE_PATH%" (
    start "" /min "%EXE_PATH%"
    echo [OK] Started attendance-listener.exe
) else if exist "%SCRIPT_PATH%" (
    start "" /min cmd /c "cd /d "%INSTALL_DIR%" && node device-listener-bidirectional.js"
    echo [OK] Started device-listener-bidirectional.js
) else (
    echo [ERROR] Listener files not found!
    pause
    exit /b 1
)

echo.
echo Listener is now running in background.
echo Check logs folder for activity.
echo.
timeout /t 3 >nul
