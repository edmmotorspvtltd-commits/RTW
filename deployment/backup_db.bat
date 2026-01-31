@echo off
:: ================================================================================
::   RTWE DATABASE BACKUP SCRIPT
::   Safe export of PostgreSQL data
:: ================================================================================

echo.
echo ===================================================
echo   BACKING UP DATABASE (RTwe)...
echo ===================================================
echo.

set TIMESTAMP=%DATE:~10,4%%DATE:~7,2%%DATE:~4,2%_%TIME:~0,2%%TIME:~3,2%
set TIMESTAMP=%TIMESTAMP: =0%
set BACKUP_FILE=RTwe_%TIMESTAMP%.sql

:: Ensure deployment folder exists
if not exist "%~dp0" mkdir "%~dp0"
cd /d "%~dp0"

echo Saving to: deployment\%BACKUP_FILE%
echo.
:: Set password to avoid prompt (sourced from your env file)
set PGPASSWORD=Shekhar@2506

:: Run pg_dump using absolute path
"C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U postgres -h localhost RTwe > "%BACKUP_FILE%"

if %errorLevel% equ 0 (
    echo.
    echo [OK] Backup successful!
    echo File: %BACKUP_FILE%
) else (
    echo.
    echo [ERROR] Backup failed!
    echo Check if PostgreSQL is running and password is correct.
)

echo.
pause
