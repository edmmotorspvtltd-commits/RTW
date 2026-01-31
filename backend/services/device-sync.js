// ============================================
// Device Sync Service - Push Users to ESSL Device
// Uses zkteco-js for TCP communication
// ============================================

const ZKTeco = require('zkteco-js');

class DeviceSyncService {
    constructor() {
        this.connections = new Map(); // Cache device connections
    }

    /**
     * Connect to a device
     * @param {string} ip - Device IP address
     * @param {number} port - Device port (default 4370)
     * @returns {Promise<ZKTeco>} Connected device instance
     */
    async connect(ip, port = 4370, timeout = 5000) {
        const key = `${ip}:${port}`;

        // Return cached connection if exists
        if (this.connections.has(key)) {
            const cached = this.connections.get(key);
            if (cached.connected) return cached.device;
        }

        try {
            console.log(`[DeviceSync] Connecting to device at ${ip}:${port}`);
            const device = new ZKTeco(ip, port, timeout);
            await device.createSocket();

            this.connections.set(key, { device, connected: true });
            console.log(`[DeviceSync] ✓ Connected to ${ip}:${port}`);
            return device;
        } catch (error) {
            console.error(`[DeviceSync] ✗ Failed to connect to ${ip}:${port}:`, error.message);
            throw new Error(`Cannot connect to device at ${ip}:${port}`);
        }
    }

    /**
     * Disconnect from device
     */
    async disconnect(ip, port = 4370) {
        const key = `${ip}:${port}`;
        if (this.connections.has(key)) {
            const cached = this.connections.get(key);
            try {
                await cached.device.disconnect();
            } catch (e) { /* ignore */ }
            this.connections.delete(key);
            console.log(`[DeviceSync] Disconnected from ${ip}`);
        }
    }

    /**
     * Push a single user to device
     * @param {object} device - Connected device instance
     * @param {object} employee - Employee data: { user_id, full_name, card_number }
     */
    async pushUser(device, employee) {
        try {
            // Get user_id and strip RTWDI- prefix for device (device only accepts numbers)
            let userId = String(employee.user_id || employee.employee_id);
            if (userId.startsWith('RTWDI-')) {
                userId = userId.replace('RTWDI-', '');
            }

            const name = employee.full_name || employee.first_name || 'User';
            const password = '12345678'; // Default password (8 chars required)
            const role = 0; // 0 = normal user, 14 = admin
            const cardNumber = parseInt(employee.card_number) || 0;

            console.log(`[DeviceSync] Pushing user: UID=${userId}, Name=${name}`);

            // setUser(uid, userid, name, password, role, cardno)
            // uid = unique ID on device, userid = display ID, name = user name
            await device.setUser(userId, userId, name, password, role, cardNumber);

            console.log(`[DeviceSync] ✓ User ${userId} pushed successfully`);
            return { success: true, userId, name };
        } catch (error) {
            console.error(`[DeviceSync] ✗ Failed to push user:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Delete user from device
     */
    async deleteUser(device, userId) {
        try {
            console.log(`[DeviceSync] Deleting user: ${userId}`);
            await device.deleteUser(userId);
            console.log(`[DeviceSync] ✓ User ${userId} deleted`);
            return { success: true, userId };
        } catch (error) {
            console.error(`[DeviceSync] ✗ Failed to delete user:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all users from device
     */
    async getUsers(device) {
        try {
            console.log(`[DeviceSync] Getting users from device`);
            const users = await device.getUsers();
            console.log(`[DeviceSync] ✓ Found ${users?.data?.length || 0} users`);
            return { success: true, data: users?.data || [] };
        } catch (error) {
            console.error(`[DeviceSync] ✗ Failed to get users:`, error.message);
            return { success: false, error: error.message, data: [] };
        }
    }

    /**
     * Sync multiple employees to device
     */
    async syncEmployees(ip, port, employees) {
        let device;
        const results = { success: 0, failed: 0, details: [] };

        try {
            device = await this.connect(ip, port);

            for (const emp of employees) {
                const result = await this.pushUser(device, emp);
                results.details.push(result);
                if (result.success) {
                    results.success++;
                } else {
                    results.failed++;
                }
            }

            return results;
        } catch (error) {
            throw error;
        } finally {
            if (device) {
                await this.disconnect(ip, port);
            }
        }
    }

    /**
     * Get device info
     */
    async getDeviceInfo(device) {
        try {
            const info = await device.getInfo();
            return { success: true, data: info };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// Export singleton
module.exports = new DeviceSyncService();
