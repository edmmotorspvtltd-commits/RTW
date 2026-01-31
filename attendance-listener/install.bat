@echo off
:: ================================================================================
::   RTWE ATTENDANCE LISTENER - INSTALLER
::   Creates Windows Scheduled Task for auto-start on boot
:: ================================================================================

echo.
echo ===================================================
echo   RTWE ATTENDANCE LISTENER - INSTALLER
echo ===================================================
echo.

:: Check for admin rights
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Please run this script as Administrator!
    echo Right-click on install.bat and select "Run as administrator"
    echo.
    pause
    exit /b 1
)

:: Get current directory
set INSTALL_DIR=%~dp0
set EXE_PATH=%INSTALL_DIR%attendance-listener.exe
set SCRIPT_PATH=%INSTALL_DIR%device-listener-bidirectional.js

:: Check if .exe exists, otherwise use Node.js script
if exist "%EXE_PATH%" (
    set RUN_PATH=%EXE_PATH%
    echo [OK] Found attendance-listener.exe
) else if exist "%SCRIPT_PATH%" (
    set RUN_PATH=node "%SCRIPT_PATH%"
    echo [OK] Found device-listener-bidirectional.js
    echo [INFO] Will use Node.js to run ^(make sure Node.js is installed^)
) else (
    echo [ERROR] Cannot find attendance-listener.exe or device-listener-bidirectional.js
    echo Please make sure all files are in the same folder.
    pause
    exit /b 1
)

:: Create logs folder
if not exist "%INSTALL_DIR%logs" mkdir "%INSTALL_DIR%logs"
echo [OK] Created logs folder

:: Remove existing task if any
schtasks /delete /tn "RTWE Attendance Listener" /f >nul 2>&1

:: Create scheduled task to run at system startup
echo.
echo Creating Windows Scheduled Task...

if exist "%EXE_PATH%" (
    schtasks /create /tn "RTWE Attendance Listener" /tr "\"%EXE_PATH%\"" /sc onstart /ru SYSTEM /rl highest /f
) else (
    schtasks /create /tn "RTWE Attendance Listener" /tr "cmd /c cd /d \"%INSTALL_DIR%\" && node device-listener-bidirectional.js" /sc onstart /ru SYSTEM /rl highest /f
)

if %errorLevel% equ 0 (
    echo [OK] Scheduled task created - will auto-start on boot
) else (
    echo [WARN] Could not create scheduled task
    echo        You may need to start the listener manually
)

:: Start the listener now
echo.
echo Starting listener now...

if exist "%EXE_PATH%" (
    start "" /min "%EXE_PATH%"
) else (
    start "" /min cmd /c "cd /d "%INSTALL_DIR%" && node device-listener-bidirectional.js"
)

echo [OK] Listener started in background

echo.
echo ===================================================
echo   INSTALLATION COMPLETE!
echo ===================================================
echo.
echo   - Listener is running in background
echo   - Will auto-start when PC boots
echo   - Logs saved to: %INSTALL_DIR%logs\
echo.
echo   To stop:   Run stop.bat
echo   To start:  Run start.bat
echo   To remove: Run uninstall.bat
echo.
echo ===================================================
echo.
pause
