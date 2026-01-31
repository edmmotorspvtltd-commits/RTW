// ================================================================================
//                    RTWE ATTENDANCE LISTENER - BIDIRECTIONAL
//     Standalone Service for Toyota PC - Syncs with Main ERP Server
// ================================================================================
// 
// Features:
//   1. PULL: Listen for device punches (ADMS protocol on port 8080)
//   2. Forward attendance to main server via HTTP API
//   3. PUSH: Receive commands from server (port 3002)
//   4. Send commands to device via TCP (zkteco protocol)
//   5. Offline backup queue with auto-sync
//   6. Runs as Windows background service
//
// Usage:
//   node device-listener-bidirectional.js
//   OR run attendance-listener.exe (built with pkg)
//
// ================================================================================

const net = require('net');
const http = require('http');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const ZKTeco = require('zkteco-js');

// ================================================================================
// CONFIGURATION
// ================================================================================

let config;

// For pkg executables, use the exe's directory; otherwise use __dirname
const BASE_PATH = process.pkg ? path.dirname(process.execPath) : __dirname;
const CONFIG_PATH = path.join(BASE_PATH, 'config.json');

function loadConfig() {
    try {
        console.log(`[DEBUG] Looking for config at: ${CONFIG_PATH}`);
        const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
        config = JSON.parse(configData);
        log('INFO', 'Configuration loaded successfully');
        log('INFO', `Config path: ${CONFIG_PATH}`);
        return true;
    } catch (error) {
        log('ERROR', `Failed to load config from ${CONFIG_PATH}: ${error.message}`);
        // Use defaults with AWS server
        config = {
            listener: { admsPort: 8081, apiPort: 3002, host: '0.0.0.0' },
            mainServer: { url: 'http://3.107.56.224:3000', apiKey: 'rtwe-attendance-api-key-2026' },
            device: { ip: '192.168.1.2', port: 4370, timeout: 5000 },
            backup: { enabled: true, filePath: './offline-backup.json', retryIntervalMs: 30000 },
            logging: { level: 'info', logToFile: true, logDir: './logs' }
        };
        return false;
    }
}

// ================================================================================
// LOGGING
// ================================================================================

function log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [${level}] ${message}${data ? ' ' + JSON.stringify(data) : ''}`;

    console.log(logLine);

    // Log to file if enabled
    if (config?.logging?.logToFile) {
        try {
            const logDir = config.logging.logDir || './logs';
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
            const dateStr = new Date().toISOString().split('T')[0];
            const logFile = path.join(logDir, `listener-${dateStr}.log`);
            fs.appendFileSync(logFile, logLine + '\n');
        } catch (e) {
            // Ignore file logging errors
        }
    }
}

// ================================================================================
// BACKUP QUEUE (for offline scenarios)
// ================================================================================

let backupQueue = [];
const BACKUP_FILE = './offline-backup.json';

function loadBackupQueue() {
    try {
        if (fs.existsSync(BACKUP_FILE)) {
            const data = fs.readFileSync(BACKUP_FILE, 'utf8');
            backupQueue = JSON.parse(data);
            log('INFO', `Loaded ${backupQueue.length} records from backup queue`);
        }
    } catch (error) {
        log('ERROR', `Failed to load backup queue: ${error.message}`);
        backupQueue = [];
    }
}

function saveBackupQueue() {
    try {
        fs.writeFileSync(BACKUP_FILE, JSON.stringify(backupQueue, null, 2));
    } catch (error) {
        log('ERROR', `Failed to save backup queue: ${error.message}`);
    }
}

function addToBackup(record) {
    backupQueue.push({
        ...record,
        queuedAt: new Date().toISOString()
    });
    saveBackupQueue();
    log('INFO', `Added to backup queue. Queue size: ${backupQueue.length}`);
}

async function processBackupQueue() {
    if (backupQueue.length === 0) return;

    log('INFO', `Processing backup queue. ${backupQueue.length} records pending`);

    const toProcess = [...backupQueue];
    let successCount = 0;

    for (const record of toProcess) {
        try {
            const success = await forwardToServer(record, true);
            if (success) {
                // Remove from queue
                const index = backupQueue.findIndex(r => r.queuedAt === record.queuedAt);
                if (index !== -1) {
                    backupQueue.splice(index, 1);
                }
                successCount++;
            }
        } catch (error) {
            log('ERROR', `Failed to process backup record: ${error.message}`);
            break; // Stop if server is down
        }
    }

    saveBackupQueue();
    log('INFO', `Backup queue processed. ${successCount} synced, ${backupQueue.length} remaining`);
}

// ================================================================================
// FORWARD TO MAIN SERVER
// ================================================================================

async function forwardToServer(attendanceData, isRetry = false) {
    try {
        const serverUrl = config.mainServer.url;
        const endpoint = config.mainServer.endpoints?.receive || '/api/attendance/receive';
        const apiKey = config.mainServer.apiKey;

        log('INFO', `Forwarding to server: ${serverUrl}${endpoint}`);

        const response = await axios.post(`${serverUrl}${endpoint}`, attendanceData, {
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            },
            timeout: 10000
        });

        if (response.data.success) {
            log('INFO', '✅ Successfully forwarded to server');
            return true;
        } else {
            log('WARN', `Server returned error: ${response.data.error}`);
            return false;
        }
    } catch (error) {
        log('ERROR', `Failed to forward to server: ${error.message}`);

        // Add to backup queue if not already a retry
        if (!isRetry && config.backup?.enabled) {
            addToBackup(attendanceData);
        }

        return false;
    }
}

// ================================================================================
// ADMS PROTOCOL PARSER (Device → Listener)
// ================================================================================

function parseADMSData(buffer) {
    try {
        const dataStr = buffer.toString('utf8');

        // Check for ATTLOG command
        if (dataStr.includes('ATTLOG') || dataStr.includes('PIN=')) {
            return { command: 'ATTLOG', payload: dataStr };
        } else if (dataStr.includes('SN=')) {
            return { command: 'CONNECT', payload: dataStr };
        } else if (dataStr.includes('ping') || dataStr.length < 10) {
            return { command: 'HEARTBEAT', payload: dataStr };
        }

        return { command: 'UNKNOWN', payload: dataStr };
    } catch (error) {
        log('ERROR', `Parse error: ${error.message}`);
        return null;
    }
}

function parseAttendanceRecords(payload) {
    const records = [];
    try {
        const lines = payload.split('\n');

        for (const line of lines) {
            if (line.includes('PIN=') || line.includes('\t')) {
                const record = {};

                // Parse key=value pairs
                const parts = line.split('\t');
                for (const part of parts) {
                    if (part.includes('=')) {
                        const [key, value] = part.split('=');
                        record[key.trim()] = value ? value.trim() : '';
                    }
                }

                // Extract serial number from SN= in the data
                const snMatch = payload.match(/SN=([^\&\s]+)/);

                if (record.PIN || record.UserId) {
                    records.push({
                        userId: record.PIN || record.UserId,
                        timestamp: parseTimestamp(record.TIME || record.DateTime),
                        verifyMode: parseInt(record.VERIFY || record.Verified || 1),
                        inOutMode: parseInt(record.INOUT || record.InOutMode || 0),
                        serialNumber: snMatch ? snMatch[1] : config.device?.serial || 'UNKNOWN'
                    });
                }
            }
        }

        // Alternative: tab-separated format
        if (records.length === 0 && payload.includes('\t')) {
            const lines = payload.split('\n');
            for (const line of lines) {
                const parts = line.split('\t');
                if (parts.length >= 3) {
                    records.push({
                        userId: parts[0],
                        timestamp: parseTimestamp(parts[1]),
                        verifyMode: parseInt(parts[2]) || 1,
                        inOutMode: parseInt(parts[3]) || 0,
                        serialNumber: config.device?.serial || 'UNKNOWN'
                    });
                }
            }
        }
    } catch (error) {
        log('ERROR', `Record parse error: ${error.message}`);
    }
    return records;
}

function parseTimestamp(timestampStr) {
    if (!timestampStr) return new Date().toISOString();

    try {
        // Format: YYYY-MM-DD HH:MM:SS
        if (timestampStr.match(/^\d{4}-\d{2}-\d{2}/)) {
            return new Date(timestampStr).toISOString();
        }
        // Format: DD/MM/YYYY HH:MM:SS
        if (timestampStr.match(/^\d{2}\/\d{2}\/\d{4}/)) {
            const [date, time] = timestampStr.split(' ');
            const [day, month, year] = date.split('/');
            return new Date(`${year}-${month}-${day}T${time}`).toISOString();
        }
        return new Date(timestampStr).toISOString();
    } catch (error) {
        return new Date().toISOString();
    }
}

// ================================================================================
// ADMS SERVER (Listen for device punches - HTTP Protocol for eSSL)
// ================================================================================

let admsServer = null;

function startADMSServer() {
    const port = config.listener.admsPort || 8081;
    const host = config.listener.host || '0.0.0.0';

    // Use HTTP server for eSSL ADMS protocol
    admsServer = http.createServer(async (req, res) => {
        const clientIp = req.socket.remoteAddress;
        const url = req.url;

        log('INFO', `ADMS Request: ${req.method} ${url} from ${clientIp}`);

        // Parse URL and query string
        const urlParts = new URL(url, `http://${req.headers.host}`);
        const pathname = urlParts.pathname;
        const params = Object.fromEntries(urlParts.searchParams);

        // Extract device serial from SN parameter
        const deviceSerial = params.SN || 'UNKNOWN';

        try {
            // Handle different ADMS endpoints
            if (pathname.includes('/iclock/cdata')) {
                // POST - Device sending attendance data
                if (req.method === 'POST') {
                    let body = '';
                    for await (const chunk of req) {
                        body += chunk;
                    }

                    log('INFO', `📥 Received attendance data from ${deviceSerial}`);
                    log('DEBUG', `Data: ${body.substring(0, 500)}`);

                    // Parse ATTLOG data
                    const records = parseATTLOGData(body, deviceSerial);

                    for (const record of records) {
                        log('INFO', `📋 Attendance: User ${record.userId} at ${record.timestamp}`);

                        // Forward to main server
                        await forwardToServer({
                            type: 'attendance',
                            source: 'adms-push',
                            deviceSerial: deviceSerial,
                            data: record
                        });
                    }

                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end('OK');
                    return;
                }

                // GET - Device checking in / requesting settings
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('OK');
                return;
            }

            // Handle getrequest.aspx - device asking for commands
            if (pathname.includes('/iclock/getrequest')) {
                log('DEBUG', `Device ${deviceSerial} checking for commands`);
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('OK');
                return;
            }

            // Handle devicecmd.aspx - command results from device
            if (pathname.includes('/iclock/devicecmd')) {
                let body = '';
                for await (const chunk of req) {
                    body += chunk;
                }
                log('INFO', `Device command result: ${body.substring(0, 200)}`);
                res.writeHead(200, { 'Content-Type': 'text/plain' });
                res.end('OK');
                return;
            }

            // Default response
            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('OK');

        } catch (error) {
            log('ERROR', `ADMS error: ${error.message}`);
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('ERROR');
        }
    });

    admsServer.listen(port, host, () => {
        log('INFO', `
╔══════════════════════════════════════════════════════════════╗
║           ADMS LISTENER STARTED (HTTP)                       ║
╠══════════════════════════════════════════════════════════════╣
║  Port: ${port}                                                  ║
║  Protocol: HTTP (eSSL ADMS)                                  ║
║  Endpoints:                                                  ║
║    /iclock/cdata.aspx     - Receive attendance data          ║
║    /iclock/getrequest.aspx - Device command requests         ║
║  Status: READY for device connections                        ║
╚══════════════════════════════════════════════════════════════╝
        `);
    });

    admsServer.on('error', (err) => {
        log('ERROR', `ADMS Server error: ${err.message}`);
    });
}

// Parse ATTLOG data from eSSL device
function parseATTLOGData(body, deviceSerial) {
    const records = [];

    try {
        // ATTLOG format: PIN\tTimestamp\tStatus\tVerify\tWorkCode\tReserved1\tReserved2
        // Example: 1\t2026-01-12 09:30:00\t0\t1\t\t\t
        const lines = body.split('\n').filter(line => line.trim());

        for (const line of lines) {
            const parts = line.split('\t');

            if (parts.length >= 2) {
                const userId = parts[0].trim();
                const timestamp = parts[1].trim();
                const status = parseInt(parts[2]) || 0; // 0=Check-In, 1=Check-Out
                const verifyMode = parseInt(parts[3]) || 1;

                if (userId && timestamp) {
                    records.push({
                        userId: userId,
                        timestamp: formatTimestamp(timestamp),
                        inOutMode: status,
                        verifyMode: verifyMode,
                        serialNumber: deviceSerial
                    });
                }
            }
        }

        log('INFO', `Parsed ${records.length} attendance records`);
    } catch (error) {
        log('ERROR', `Parse ATTLOG error: ${error.message}`);
    }

    return records;
}

function formatTimestamp(ts) {
    try {
        // Try to parse various formats
        if (ts.match(/^\d{4}-\d{2}-\d{2}/)) {
            return new Date(ts.replace(' ', 'T')).toISOString();
        }
        return new Date(ts).toISOString();
    } catch (e) {
        return new Date().toISOString();
    }
}

// ================================================================================
// DEVICE COMMANDS (Send commands to device - PUSH)
// ================================================================================

let zkDevice = null;

async function connectToDevice() {
    try {
        const { ip, port, timeout } = config.device;
        log('INFO', `Connecting to device at ${ip}:${port}...`);

        zkDevice = new ZKTeco(ip, port, timeout);
        await zkDevice.createSocket();

        log('INFO', `✅ Connected to device at ${ip}:${port}`);
        return true;
    } catch (error) {
        log('ERROR', `Failed to connect to device: ${error.message}`);
        zkDevice = null;
        return false;
    }
}

async function disconnectDevice() {
    if (zkDevice) {
        try {
            await zkDevice.disconnect();
        } catch (e) { /* ignore */ }
        zkDevice = null;
    }
}

async function executeDeviceCommand(command, params) {
    try {
        // Connect if not connected
        if (!zkDevice) {
            const connected = await connectToDevice();
            if (!connected) {
                return { success: false, error: 'Cannot connect to device' };
            }
        }

        let result;

        switch (command) {
            case 'add-user':
                // Strip RTWDI- prefix for device
                let userId = String(params.userId);
                if (userId.startsWith('RTWDI-')) {
                    userId = userId.replace('RTWDI-', '');
                }
                const name = params.name || 'User';
                const password = params.password || '12345678';
                const role = params.role || 0;
                const cardNo = parseInt(params.cardNumber) || 0;

                log('INFO', `Adding user to device: ${userId} - ${name}`);
                await zkDevice.setUser(userId, userId, name, password, role, cardNo);
                result = { success: true, message: `User ${userId} added to device` };
                break;

            case 'delete-user':
                log('INFO', `Deleting user from device: ${params.userId}`);
                await zkDevice.deleteUser(params.userId);
                result = { success: true, message: `User ${params.userId} deleted from device` };
                break;

            case 'get-users':
                log('INFO', 'Getting all users from device');
                const users = await zkDevice.getUsers();
                result = { success: true, data: users?.data || [], count: users?.data?.length || 0 };
                break;

            case 'get-attendance':
                log('INFO', 'Getting attendance logs from device');
                const logs = await zkDevice.getAttendances();
                result = { success: true, data: logs?.data || [], count: logs?.data?.length || 0 };
                break;

            case 'clear-attendance':
                log('INFO', 'Clearing attendance logs from device');
                await zkDevice.clearAttendanceLog();
                result = { success: true, message: 'Attendance logs cleared' };
                break;

            case 'get-info':
                log('INFO', 'Getting device info');
                const info = await zkDevice.getInfo();
                result = { success: true, data: info };
                break;

            default:
                result = { success: false, error: `Unknown command: ${command}` };
        }

        return result;

    } catch (error) {
        log('ERROR', `Device command error: ${error.message}`);
        zkDevice = null; // Reset connection
        return { success: false, error: error.message };
    }
}

// ================================================================================
// API SERVER (Receive commands from main server - PUSH)
// ================================================================================

let apiServer = null;

function startAPIServer() {
    const port = config.listener.apiPort || 3002;
    const host = config.listener.host || '0.0.0.0';

    apiServer = http.createServer(async (req, res) => {
        // CORS headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        // Parse URL
        const url = new URL(req.url, `http://${req.headers.host}`);
        const pathname = url.pathname;

        log('INFO', `API Request: ${req.method} ${pathname}`);

        // Routes
        try {
            // Health check
            if (pathname === '/health' || pathname === '/') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'running',
                    version: '1.0.0',
                    uptime: process.uptime(),
                    backupQueue: backupQueue.length
                }));
                return;
            }

            // Status
            if (pathname === '/status') {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    admsServer: admsServer ? 'running' : 'stopped',
                    apiServer: 'running',
                    deviceConnected: zkDevice !== null,
                    backupQueue: backupQueue.length,
                    config: {
                        admsPort: config.listener.admsPort,
                        apiPort: config.listener.apiPort,
                        mainServer: config.mainServer.url,
                        deviceIp: config.device.ip
                    }
                }));
                return;
            }

            // Device commands (POST)
            if (req.method === 'POST' && pathname.startsWith('/command/')) {
                const command = pathname.replace('/command/', '');

                // Read body
                let body = '';
                for await (const chunk of req) {
                    body += chunk;
                }

                const params = body ? JSON.parse(body) : {};
                const result = await executeDeviceCommand(command, params);

                res.writeHead(result.success ? 200 : 500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
                return;
            }

            // Sync backup queue
            if (pathname === '/sync-backup') {
                await processBackupQueue();
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, remaining: backupQueue.length }));
                return;
            }

            // 404
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not found' }));

        } catch (error) {
            log('ERROR', `API error: ${error.message}`);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: error.message }));
        }
    });

    apiServer.listen(port, host, () => {
        log('INFO', `
╔══════════════════════════════════════════════════════════════╗
║           API SERVER STARTED (PUSH)                          ║
╠══════════════════════════════════════════════════════════════╣
║  Port: ${port}                                                  ║
║  Endpoints:                                                  ║
║    GET  /health          - Health check                      ║
║    GET  /status          - Full status                       ║
║    POST /command/add-user      - Add user to device          ║
║    POST /command/delete-user   - Delete user from device     ║
║    POST /command/get-users     - Get all device users        ║
║    POST /command/get-attendance - Get attendance logs        ║
║    POST /command/get-info      - Get device info             ║
╚══════════════════════════════════════════════════════════════╝
        `);
    });

    apiServer.on('error', (err) => {
        log('ERROR', `API Server error: ${err.message}`);
    });
}

// ================================================================================
// AUTO-SYNC BACKUP QUEUE
// ================================================================================

function startBackupSync() {
    const interval = config.backup?.retryIntervalMs || 30000;

    setInterval(async () => {
        if (backupQueue.length > 0) {
            log('INFO', 'Auto-syncing backup queue...');
            await processBackupQueue();
        }
    }, interval);

    log('INFO', `Backup sync scheduled every ${interval / 1000} seconds`);
}

// ================================================================================
// MAIN - START EVERYTHING
// ================================================================================

async function main() {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║   ██████╗ ████████╗██╗    ██╗███████╗                        ║
║   ██╔══██╗╚══██╔══╝██║    ██║██╔════╝                        ║
║   ██████╔╝   ██║   ██║ █╗ ██║█████╗                          ║
║   ██╔══██╗   ██║   ██║███╗██║██╔══╝                          ║
║   ██║  ██║   ██║   ╚███╔███╔╝███████╗                        ║
║   ╚═╝  ╚═╝   ╚═╝    ╚══╝╚══╝ ╚══════╝                        ║
║                                                              ║
║        ATTENDANCE LISTENER - BIDIRECTIONAL                   ║
║                  Version 1.0.0                               ║
╚══════════════════════════════════════════════════════════════╝
    `);

    // Load configuration
    loadConfig();

    // Load backup queue
    loadBackupQueue();

    // Start ADMS server (for device punches - PULL)
    startADMSServer();

    // Start API server (for commands from main server - PUSH)
    startAPIServer();

    // Start backup queue auto-sync
    startBackupSync();

    log('INFO', '🚀 Attendance Listener started successfully!');
    log('INFO', `Main Server: ${config.mainServer.url}`);
    log('INFO', `Device IP: ${config.device.ip}:${config.device.port}`);

    // Handle shutdown
    process.on('SIGINT', async () => {
        log('INFO', 'Shutting down...');
        await disconnectDevice();
        if (admsServer) admsServer.close();
        if (apiServer) apiServer.close();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        log('INFO', 'Shutting down...');
        await disconnectDevice();
        if (admsServer) admsServer.close();
        if (apiServer) apiServer.close();
        process.exit(0);
    });
}

// Run
main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
