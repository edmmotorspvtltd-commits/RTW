@echo off
echo Updating device configuration to use ADMS Push mode...
ssh -i rtwe-key.pem ubuntu@3.107.56.224 "sudo -u postgres psql -d rtwe_erp -c 'UPDATE devices SET ip_address = NULL WHERE device_id = 1;'"
echo.
echo Device IP cleared. Now the device will operate in ADMS Push mode only.
pause
