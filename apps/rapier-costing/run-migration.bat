@echo off
:: ================================================
:: Run Database Migration - Add Calculated Fields
:: ================================================

echo.
echo ===================================================
echo   Adding Calculated Fields to Database
echo ===================================================
echo.

:: Set PostgreSQL password (update if different)
set PGPASSWORD=Edm@2024

:: Run migration
echo Running migration...
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d rtwe_erp -f "%~dp0..\migrations\005-add-calculated-fields.sql"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===================================================
    echo   MIGRATION SUCCESSFUL! ✅
    echo ===================================================
    echo.
    echo All 22 calculated field columns have been added.
    echo You can now restart the backend and save costings!
    echo.
) else (
    echo.
    echo ===================================================
    echo   MIGRATION FAILED! ❌
    echo ===================================================
    echo.
    echo Please check:
    echo 1. PostgreSQL is running
    echo 2. Database 'rtwe_erp' exists
    echo 3. Password is correct
    echo.
    echo Or run manually in pgAdmin:
    echo Open: backend\rapier-costing\migrations\005-add-calculated-fields.sql
    echo Execute in rtwe_erp database
    echo.
)

pause
