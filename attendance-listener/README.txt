================================================================================
   RTWE ATTENDANCE LISTENER - README
   Standalone Bidirectional Device Sync for Toyota PC
================================================================================

OVERVIEW
--------
This is a standalone attendance listener that:
 - Receives punches from eSSL device (PULL)
 - Forwards to main ERP server
 - Receives commands from ERP server (PUSH)
 - Sends commands to device (add/delete users)
 - Auto-starts on Windows boot
 - Runs silently in background


QUICK INSTALLATION (2 STEPS)
----------------------------
1. Edit config.json:
   - Set "mainServer.url" to your ERP server IP (e.g., "http://192.168.1.100:3000")
   - Set "device.ip" to your eSSL device IP
   
2. Right-click "install.bat" -> "Run as administrator"

Done! Listener is now running and will auto-start on boot.


FILES INCLUDED
--------------
 attendance-listener.exe    - Main program (run this)
 config.json                - Configuration settings (EDIT THIS)
 install.bat                - One-click installer (run as admin)
 start.bat                  - Manually start listener
 stop.bat                   - Stop listener
 status.bat                 - Check if running
 uninstall.bat              - Remove auto-start
 logs/                      - Log files directory


CONFIGURATION (config.json)
---------------------------
Edit these values before installation:

{
    "mainServer": {
        "url": "http://YOUR_SERVER_IP:3000",  <-- Your ERP server
        "apiKey": "rtwe-attendance-api-key-2026"
    },
    "device": {
        "ip": "YOUR_DEVICE_IP",               <-- eSSL device IP
        "port": 4370
    }
}


PORTS USED
----------
 Port 8080  - ADMS listener (receives device punches)
 Port 3002  - API server (receives commands from ERP)


TESTING
-------
After installation, check status:
 - Run status.bat
 - Open browser: http://localhost:3002/status
 - Check logs folder for activity


TROUBLESHOOTING
---------------
1. "Listener not starting"
   - Check if Node.js is installed (if using .js file)
   - Run as Administrator
   
2. "Cannot connect to device"  
   - Check device IP in config.json
   - Ensure device is on same network
   
3. "Cannot forward to server"
   - Check mainServer.url in config.json
   - Ensure ERP server is running
   - Data will be queued and synced when server is online


MANUAL START (if needed)
------------------------
If you have Node.js installed:
   cd [this folder]
   npm install
   node device-listener-bidirectional.js


CONTACT
-------
RTWE ERP Team

================================================================================
