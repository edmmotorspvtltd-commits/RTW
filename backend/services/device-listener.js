// ================================================================================
//                    ESSL DEVICE LISTENER SERVICE
//     Real-time ADMS Protocol Handler for eSSL x2008 Attendance Device
// ================================================================================

const net = require('net');
const { pool } = require('../config/database');

// ADMS Protocol Constants
const PROTOCOL = {
    CMD_CONNECT: 1000,
    CMD_EXIT: 1001,
    CMD_DATA: 1500,
    CMD_ACK_OK: 2000,
    CMD_ACK_ERROR: 2001,
};

class DeviceListener {
    constructor() {
        this.server = null;
        this.clients = new Map();
        this.deviceInfo = new Map();
        this.config = {
            port: process.env.ADMS_PORT || 8080,
            host: process.env.ADMS_HOST || '0.0.0.0'
        };
    }

    // Start ADMS server to listen for device connections
    start() {
        this.server = net.createServer((socket) => {
            const clientId = `${socket.remoteAddress}:${socket.remotePort}`;
            console.log(`[ADMS] Device connected: ${clientId}`);

            this.clients.set(clientId, socket);

            // Handle incoming data
            socket.on('data', (data) => {
                this.handleData(socket, data, clientId);
            });

            // Handle disconnect
            socket.on('close', () => {
                console.log(`[ADMS] Device disconnected: ${clientId}`);
                this.clients.delete(clientId);
                this.deviceInfo.delete(clientId);
            });

            // Handle errors
            socket.on('error', (err) => {
                console.error(`[ADMS] Socket error for ${clientId}:`, err.message);
                this.clients.delete(clientId);
            });

            // Set timeout for inactive connections
            socket.setTimeout(300000); // 5 minutes
            socket.on('timeout', () => {
                console.log(`[ADMS] Connection timeout: ${clientId}`);
                socket.end();
            });
        });

        this.server.listen(this.config.port, this.config.host, () => {
            console.log(`
╔════════════════════════════════════════════════════════════╗
║           ESSL Device Listener Started                     ║
╠════════════════════════════════════════════════════════════╣
║  Listening on: ${this.config.host}:${this.config.port}                               ║
║  Protocol: ADMS (Active Device Monitoring System)          ║
║  Status: READY for device connections                      ║
╚════════════════════════════════════════════════════════════╝
            `);
        });

        this.server.on('error', (err) => {
            console.error('[ADMS] Server error:', err.message);
        });
    }

    // Handle incoming data from device
    handleData(socket, data, clientId) {
        try {
            const dataStr = data.toString('utf8');
            console.log(`[ADMS] Received from ${clientId}:`, dataStr.substring(0, 200));

            // Parse the data
            const parsedData = this.parseADMSData(data);

            if (parsedData) {
                switch (parsedData.command) {
                    case 'CONNECT':
                        this.handleDeviceConnection(socket, parsedData);
                        break;
                    case 'ATTLOG':
                    case 'OPERLOG':
                        this.handleAttendanceData(socket, parsedData);
                        break;
                    case 'HEARTBEAT':
                        this.sendResponse(socket, PROTOCOL.CMD_ACK_OK);
                        break;
                    default:
                        console.log(`[ADMS] Unknown command: ${parsedData.command}`);
                        this.sendResponse(socket, PROTOCOL.CMD_ACK_OK);
                }
            }
        } catch (error) {
            console.error('[ADMS] Error handling data:', error);
            this.sendResponse(socket, PROTOCOL.CMD_ACK_ERROR);
        }
    }

    // Parse ADMS protocol data
    parseADMSData(buffer) {
        try {
            const dataStr = buffer.toString('utf8');

            // Check for different ADMS formats
            if (dataStr.includes('SN=')) {
                // Extract command type
                if (dataStr.includes('ATTLOG')) {
                    return { command: 'ATTLOG', payload: dataStr };
                } else if (dataStr.includes('OPERLOG')) {
                    return { command: 'OPERLOG', payload: dataStr };
                } else {
                    return { command: 'CONNECT', payload: dataStr };
                }
            }

            // Check for heartbeat
            if (dataStr.includes('ping') || dataStr.length < 10) {
                return { command: 'HEARTBEAT', payload: dataStr };
            }

            return { command: 'UNKNOWN', payload: dataStr };
        } catch (error) {
            console.error('[ADMS] Parse error:', error);
            return null;
        }
    }

    // Handle device connection
    async handleDeviceConnection(socket, parsedData) {
        try {
            const deviceInfo = this.extractDeviceInfo(parsedData.payload);
            console.log('[ADMS] Device info:', deviceInfo);

            if (deviceInfo.serialNumber) {
                await this.updateDeviceStatus(deviceInfo.serialNumber, 'active');
                await this.logDeviceEvent(null, 'connection', 'info', deviceInfo);
            }

            this.sendResponse(socket, PROTOCOL.CMD_ACK_OK);
        } catch (error) {
            console.error('[ADMS] Connection handling error:', error);
            this.sendResponse(socket, PROTOCOL.CMD_ACK_ERROR);
        }
    }

    // Handle attendance data
    async handleAttendanceData(socket, parsedData) {
        try {
            const records = this.parseAttendanceRecord(parsedData.payload);

            for (const record of records) {
                if (record.userId && record.timestamp) {
                    await this.saveAttendanceRecord(record);
                    console.log(`[ADMS] ✅ Saved attendance: User ${record.userId} at ${record.timestamp}`);
                }
            }

            this.sendResponse(socket, PROTOCOL.CMD_ACK_OK);
        } catch (error) {
            console.error('[ADMS] Attendance handling error:', error);
            this.sendResponse(socket, PROTOCOL.CMD_ACK_ERROR);
        }
    }

    // Parse attendance record from payload
    parseAttendanceRecord(payload) {
        const records = [];
        try {
            // Format: ATTLOG PIN=xxx\tATT=xxx\tVERIFY=xxx\tINOUT=xxx\tTIME=xxx
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

                    // Map to standard format
                    if (record.PIN || record.UserId) {
                        records.push({
                            userId: record.PIN || record.UserId,
                            timestamp: this.parseTimestamp(record.TIME || record.DateTime),
                            verifyMode: parseInt(record.VERIFY || record.Verified || 1),
                            inOutMode: parseInt(record.INOUT || record.InOutMode || 0),
                            serialNumber: record.SN || null
                        });
                    }
                }
            }

            // Alternative format: tab-separated values
            if (records.length === 0 && payload.includes('\t')) {
                records.push(...this.parseAttendanceRecordAlternative(payload));
            }

        } catch (error) {
            console.error('[ADMS] Record parse error:', error);
        }
        return records;
    }

    // Alternative parsing method for different payload formats
    parseAttendanceRecordAlternative(payload) {
        const records = [];
        try {
            const lines = payload.split('\n');
            for (const line of lines) {
                const parts = line.split('\t');
                if (parts.length >= 3) {
                    records.push({
                        userId: parts[0],
                        timestamp: this.parseTimestamp(parts[1]),
                        verifyMode: parseInt(parts[2]) || 1,
                        inOutMode: parseInt(parts[3]) || 0,
                        serialNumber: null
                    });
                }
            }
        } catch (error) {
            console.error('[ADMS] Alternative parse error:', error);
        }
        return records;
    }

    // Parse timestamp from various formats
    parseTimestamp(timestampStr) {
        if (!timestampStr) return new Date();

        try {
            // Format: YYYY-MM-DD HH:MM:SS
            if (timestampStr.match(/^\d{4}-\d{2}-\d{2}/)) {
                return new Date(timestampStr);
            }
            // Format: DD/MM/YYYY HH:MM:SS
            if (timestampStr.match(/^\d{2}\/\d{2}\/\d{4}/)) {
                const [date, time] = timestampStr.split(' ');
                const [day, month, year] = date.split('/');
                return new Date(`${year}-${month}-${day}T${time}`);
            }
            // Unix timestamp
            if (timestampStr.match(/^\d{10,13}$/)) {
                return new Date(parseInt(timestampStr) * (timestampStr.length === 10 ? 1000 : 1));
            }
            return new Date(timestampStr);
        } catch (error) {
            return new Date();
        }
    }

    // Save attendance record to database
    async saveAttendanceRecord(record) {
        try {
            // Find employee by device user_id
            // Device sends numeric ID (e.g., "001"), but ERP stores with prefix (e.g., "RTWDI-001")
            let employeeResult = await pool.query(
                'SELECT employee_id FROM employees WHERE user_id = $1 OR user_id = $2',
                [record.userId, `RTWDI-${record.userId}`]
            );

            if (employeeResult.rows.length === 0) {
                console.log(`[ADMS] ⚠️ Unknown user_id: ${record.userId}. Creating placeholder employee.`);

                // Auto-create employee if not exists
                const newEmployee = await pool.query(`
                    INSERT INTO employees (user_id, first_name, full_name, status)
                    VALUES ($1, $2, $2, 'active')
                    ON CONFLICT (user_id) DO NOTHING
                    RETURNING employee_id
                `, [record.userId, `Employee_${record.userId}`]);

                if (newEmployee.rows.length === 0) {
                    console.error(`[ADMS] Failed to create employee for user_id: ${record.userId}`);
                    return;
                }
            }

            // Re-fetch employee (try both formats)
            const employee = await pool.query(
                'SELECT employee_id FROM employees WHERE user_id = $1 OR user_id = $2',
                [record.userId, `RTWDI-${record.userId}`]
            );

            if (employee.rows.length === 0) return;

            const employeeId = employee.rows[0].employee_id;

            // Find device
            let deviceId = 1; // Default device
            if (record.serialNumber) {
                const deviceResult = await pool.query(
                    'SELECT device_id FROM devices WHERE device_serial = $1',
                    [record.serialNumber]
                );
                if (deviceResult.rows.length > 0) {
                    deviceId = deviceResult.rows[0].device_id;
                }
            }

            // Insert attendance log
            await pool.query(`
                INSERT INTO attendance_logs (
                    employee_id, device_id, punch_time, verify_mode, in_out_mode, raw_data
                ) VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (employee_id, punch_time, device_id) DO NOTHING
            `, [employeeId, deviceId, record.timestamp, record.verifyMode, record.inOutMode,
                JSON.stringify(record)]);

            // Update daily attendance
            await this.processDailyAttendance(employeeId, record.timestamp);

        } catch (error) {
            console.error('[ADMS] Database error:', error);
        }
    }

    // Process daily attendance summary
    async processDailyAttendance(employeeId, timestamp) {
        try {
            const date = new Date(timestamp).toISOString().split('T')[0];
            await pool.query('SELECT process_daily_attendance($1)', [date]);
        } catch (error) {
            console.error('[ADMS] Daily processing error:', error);
        }
    }

    // Extract device info from payload
    extractDeviceInfo(payload) {
        const info = {};
        try {
            const snMatch = payload.match(/SN=([^&\s]+)/);
            if (snMatch) info.serialNumber = snMatch[1];

            const optMatch = payload.match(/options=([^&\s]+)/);
            if (optMatch) info.options = optMatch[1];

            const pushverMatch = payload.match(/pushver=([^&\s]+)/);
            if (pushverMatch) info.pushVersion = pushverMatch[1];
        } catch (error) {
            console.error('[ADMS] Device info extraction error:', error);
        }
        return info;
    }

    // Update device status in database
    async updateDeviceStatus(serialNumber, status) {
        try {
            await pool.query(`
                UPDATE devices 
                SET status = $1, last_sync_time = NOW()
                WHERE device_serial = $2
            `, [status, serialNumber]);
        } catch (error) {
            console.error('[ADMS] Device status update error:', error);
        }
    }

    // Log device event to database
    async logDeviceEvent(deviceId, eventType, severity, eventData) {
        try {
            await pool.query(`
                INSERT INTO device_events (device_id, event_type, severity, event_data)
                VALUES ($1, $2, $3, $4)
            `, [deviceId, eventType, severity, JSON.stringify(eventData)]);
        } catch (error) {
            console.error('[ADMS] Event logging error:', error);
        }
    }

    // Send response to device
    sendResponse(socket, commandCode) {
        try {
            const response = `OK\n`;
            socket.write(response);
        } catch (error) {
            console.error('[ADMS] Response error:', error);
        }
    }

    // Stop the server
    stop() {
        if (this.server) {
            console.log('[ADMS] Shutting down device listener...');

            // Close all client connections
            this.clients.forEach((socket, clientId) => {
                socket.end();
            });
            this.clients.clear();

            // Close server
            this.server.close();
            this.server = null;
        }
    }
}

// Export singleton instance
const deviceListener = new DeviceListener();
module.exports = deviceListener;
