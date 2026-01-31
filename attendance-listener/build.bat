@echo off
:: ================================================================================
::   RTWE ATTENDANCE LISTENER - BUILD EXE
::   Builds standalone .exe using pkg
:: ================================================================================

echo.
echo ===================================================
echo   RTWE ATTENDANCE LISTENER - BUILD
echo ===================================================
echo.

:: Check for Node.js
where node >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

:: Check for npm
where npm >nul 2>&1
if %errorLevel% neq 0 (
    echo [ERROR] npm is not installed!
    pause
    exit /b 1
)

:: Install dependencies
echo Installing dependencies...
call npm install
if %errorLevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo [OK] Dependencies installed

:: Install pkg globally
echo.
echo Installing pkg (for building .exe)...
call npm install -g pkg
if %errorLevel% neq 0 (
    echo [ERROR] Failed to install pkg
    pause
    exit /b 1
)
echo [OK] pkg installed

:: Create dist folder
if not exist dist mkdir dist

:: Build the exe
echo.
echo Building attendance-listener.exe...
call pkg . --target node18-win-x64 --output dist/attendance-listener.exe
if %errorLevel% neq 0 (
    echo [ERROR] Build failed
    pause
    exit /b 1
)

:: Copy config and scripts to dist
echo.
echo Copying files to dist folder...
copy config.json dist\ >nul
copy install.bat dist\ >nul
copy start.bat dist\ >nul
copy stop.bat dist\ >nul
copy status.bat dist\ >nul
copy uninstall.bat dist\ >nul
copy README.txt dist\ >nul

echo.
echo ===================================================
echo   BUILD COMPLETE!
echo ===================================================
echo.
echo Output folder: %~dp0dist\
echo.
echo Files created:
echo   - attendance-listener.exe (standalone, no Node.js needed)
echo   - config.json
echo   - install.bat / start.bat / stop.bat / uninstall.bat
echo   - README.txt
echo.
echo Copy the entire 'dist' folder to Toyota PC to deploy.
echo.
echo ===================================================
echo.
pause
