// ================================================================================
//                    ATTENDANCE MANAGEMENT ROUTES
//     ESSL x2008 Attendance System - Integrated with RTWE ERP
// ================================================================================

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { validateSession } = require('../middleware/auth');
const deviceSync = require('../services/device-sync');

// ================================================================================
// EXTERNAL LISTENER API (For Toyota PC Listener)
// ================================================================================

// API Key validation middleware for external listener
const validateApiKey = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    const validApiKey = process.env.LISTENER_API_KEY || 'rtwe-attendance-api-key-2026';

    if (!apiKey || apiKey !== validApiKey) {
        console.log('[Listener API] Invalid API key attempted');
        return res.status(401).json({
            success: false,
            error: 'Invalid API key'
        });
    }
    next();
};

// POST /api/attendance/receive - Receive attendance data from Toyota PC listener
router.post('/receive', validateApiKey, async (req, res) => {
    try {
        const { type, source, data } = req.body;

        console.log(`[Listener API] Received ${type} from ${source}:`, data);

        if (type !== 'attendance' || !data) {
            return res.status(400).json({
                success: false,
                error: 'Invalid data format'
            });
        }

        const { userId, timestamp, verifyMode, inOutMode, serialNumber } = data;

        // Sanitize userId to remove binary garbage and invalid UTF-8
        let sanitizedUserId = userId;
        try {
            if (typeof userId === 'string') {
                // Remove non-printable/binary characters
                sanitizedUserId = userId.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
                // Keep only alphanumeric, dash, underscore, dot
                sanitizedUserId = sanitizedUserId.replace(/[^a-zA-Z0-9\-_.]/g, '');
                sanitizedUserId = sanitizedUserId.trim();

                // Limit length
                if (sanitizedUserId.length > 50) {
                    sanitizedUserId = sanitizedUserId.substring(0, 50);
                }

                // Log if sanitized
                if (sanitizedUserId !== userId) {
                    console.log(`[Listener API] Sanitized userId: "${userId}" → "${sanitizedUserId}"`);
                }
            }
        } catch (err) {
            console.error('[Listener API] Sanitization error:', err);
        }

        if (!sanitizedUserId || !timestamp) {
            console.warn(`[Listener API] Rejecting invalid userId: ${JSON.stringify(userId)}`);
            return res.status(400).json({
                success: false,
                error: 'userId and timestamp are required'
            });
        }

        // Find employee by device user_id (try both formats)
        let employeeResult = await pool.query(
            'SELECT employee_id FROM employees WHERE user_id = $1 OR user_id = $2',
            [sanitizedUserId, `RTWDI-${sanitizedUserId}`]
        );

        let employeeId;

        if (employeeResult.rows.length === 0) {
            // Auto-create employee if not exists
            console.log(`[Listener API] Creating new employee for user_id: ${sanitizedUserId}`);
            const newEmployee = await pool.query(`
                INSERT INTO employees (user_id, first_name, full_name, status)
                VALUES ($1, $2, $2, 'active')
                ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
                RETURNING employee_id
            `, [sanitizedUserId, `Employee_${sanitizedUserId}`]);

            if (newEmployee.rows.length === 0) {
                // Try to fetch again in case of conflict
                const retryResult = await pool.query(
                    'SELECT employee_id FROM employees WHERE user_id = $1',
                    [sanitizedUserId]
                );
                if (retryResult.rows.length > 0) {
                    employeeId = retryResult.rows[0].employee_id;
                } else {
                    return res.status(500).json({
                        success: false,
                        error: 'Failed to create/find employee'
                    });
                }
            } else {
                employeeId = newEmployee.rows[0].employee_id;
            }
        } else {
            employeeId = employeeResult.rows[0].employee_id;
        }

        // Find or create device
        let deviceId = 1; // Default device
        if (serialNumber) {
            const deviceResult = await pool.query(
                'SELECT device_id FROM devices WHERE device_serial = $1',
                [serialNumber]
            );
            if (deviceResult.rows.length > 0) {
                deviceId = deviceResult.rows[0].device_id;
            } else {
                // Create new device
                const newDevice = await pool.query(`
                    INSERT INTO devices (device_serial, device_name, status)
                    VALUES ($1, $2, 'active')
                    ON CONFLICT (device_serial) DO UPDATE SET last_sync_time = NOW()
                    RETURNING device_id
                `, [serialNumber, `Device_${serialNumber}`]);
                if (newDevice.rows.length > 0) {
                    deviceId = newDevice.rows[0].device_id;
                }
            }
        }

        // Insert attendance log
        const insertResult = await pool.query(`
            INSERT INTO attendance_logs (
                employee_id, device_id, punch_time, verify_mode, in_out_mode, 
                sync_status, raw_data
            ) VALUES ($1, $2, $3, $4, $5, 'synced', $6)
            ON CONFLICT (employee_id, punch_time, device_id) DO NOTHING
            RETURNING log_id
        `, [employeeId, deviceId, timestamp, verifyMode || 1, inOutMode || 0, JSON.stringify(data)]);

        const isNew = insertResult.rows.length > 0;

        // Process daily attendance
        const date = new Date(timestamp).toISOString().split('T')[0];
        await pool.query('SELECT process_daily_attendance($1)', [date]);

        console.log(`[Listener API] ✅ Attendance saved: Employee ${employeeId}, ${isNew ? 'new' : 'duplicate'}`);

        res.json({
            success: true,
            message: isNew ? 'Attendance saved' : 'Duplicate ignored',
            employeeId,
            isNew
        });

    } catch (error) {
        console.error('[Listener API] Error receiving attendance:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/attendance/device/status - Get device/listener status
router.get('/device/status', validateApiKey, async (req, res) => {
    try {
        const todayCount = await pool.query(`
            SELECT COUNT(*) as count FROM attendance_logs 
            WHERE DATE(punch_time) = CURRENT_DATE
        `);

        const devices = await pool.query(`
            SELECT device_id, device_name, device_serial, status, last_sync_time 
            FROM devices ORDER BY device_name
        `);

        res.json({
            success: true,
            server: 'online',
            todayPunches: parseInt(todayCount.rows[0].count),
            devices: devices.rows
        });
    } catch (error) {
        console.error('[Listener API] Error getting status:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/attendance/device/push - Relay PUSH command to Toyota PC listener
router.post('/device/push', validateSession, async (req, res) => {
    try {
        const axios = require('axios');
        const { command, params } = req.body;

        const listenerUrl = process.env.TOYOTA_PC_URL || 'http://3.107.56.224:8081';

        console.log(`[Device Push] Sending ${command} to listener at ${listenerUrl}`);

        const response = await axios.post(`${listenerUrl}/command/${command}`, params, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 30000
        });

        res.json(response.data);
    } catch (error) {
        console.error('[Device Push] Error:', error.message);
        res.status(500).json({
            success: false,
            error: `Failed to communicate with listener: ${error.message}`
        });
    }
});

// ================================================================================
// EMPLOYEE ROUTES (Attendance-specific)
// ================================================================================

// GET /api/attendance/employees - Get all employees with attendance data
router.get('/employees', validateSession, async (req, res) => {
    try {
        const { status = 'active', department_id, search } = req.query;

        let query = `
            SELECT e.*, d.department_name,
                   (SELECT COUNT(*) FROM attendance_logs al WHERE al.employee_id = e.employee_id) as punch_count
            FROM employees e
            LEFT JOIN att_departments d ON e.department_id = d.department_id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        // Default to active only (soft delete - inactive hidden from frontend)
        if (status && status !== 'all') {
            query += ` AND e.status = $${paramIndex++}`;
            params.push(status);
        }
        if (department_id) {
            query += ` AND e.department_id = $${paramIndex++}`;
            params.push(department_id);
        }
        if (search) {
            query += ` AND (e.first_name ILIKE $${paramIndex} OR e.last_name ILIKE $${paramIndex} OR e.employee_code ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
            paramIndex++;
        }

        query += ' ORDER BY e.first_name, e.last_name';

        const result = await pool.query(query, params);
        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/attendance/employees/template - Download Excel template for bulk import
router.get('/employees/template', validateSession, async (req, res) => {
    try {
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Employees');

        // Define columns
        worksheet.columns = [
            { header: 'Employee Code', key: 'employee_code', width: 20 },
            { header: 'First Name *', key: 'first_name', width: 20 },
            { header: 'Last Name', key: 'last_name', width: 20 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Phone', key: 'phone', width: 15 },
            { header: 'Department', key: 'department', width: 20 },
            { header: 'Designation', key: 'designation', width: 20 },
            { header: 'Card Number', key: 'card_number', width: 15 },
            { header: 'Role', key: 'role', width: 15 },
            { header: 'Hire Date (YYYY-MM-DD)', key: 'hire_date', width: 20 }
        ];

        // Style header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4CAF50' }
        };

        // Add sample data
        worksheet.addRow({
            employee_code: 'EMP001',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            phone: '1234567890',
            department: 'Human Resources',
            designation: 'HR Manager',
            card_number: '12345',
            role: 'employee',
            hire_date: '2026-01-01'
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=employee_template.xlsx');

        // Write to response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error generating template:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/attendance/employees/:id - Get single employee
router.get('/employees/:id', validateSession, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT e.*, d.department_name, d.department_code
            FROM employees e
            LEFT JOIN att_departments d ON e.department_id = d.department_id
            WHERE e.employee_id = $1
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Employee not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/attendance/employees - Create new employee
router.post('/employees', validateSession, async (req, res) => {
    try {
        const {
            user_id, employee_code, erp_user_id, first_name, last_name, email, phone,
            department_id, designation, card_number, role, hire_date
        } = req.body;

        // Generate full_name
        const full_name = `${first_name} ${last_name || ''}`.trim();

        // Auto-generate employee_code if not provided: RTWEC/NAME20260110001
        let generatedEmployeeCode = employee_code;
        if (!employee_code) {
            const namePrefix = first_name.toUpperCase().replace(/[^A-Z]/g, '').substring(0, 4).padEnd(4, 'X');
            const dateStr = hire_date ? hire_date.replace(/-/g, '') : new Date().toISOString().split('T')[0].replace(/-/g, '');

            // Get next sequence number for this prefix
            const seqResult = await pool.query(`
                SELECT COUNT(*) + 1 as seq FROM employees 
                WHERE employee_code LIKE $1
            `, [`RTWEC/${namePrefix}${dateStr}%`]);
            const seq = String(seqResult.rows[0].seq).padStart(3, '0');

            generatedEmployeeCode = `RTWEC/${namePrefix}${dateStr}${seq}`;
        }

        // Auto-generate user_id (Device User ID) if not provided: RTWDI-001 format
        let generatedUserId = user_id;
        if (!user_id) {
            const maxIdResult = await pool.query(`
                SELECT COALESCE(MAX(
                    CASE WHEN user_id ~ '^RTWDI-[0-9]+$' 
                    THEN CAST(SUBSTRING(user_id FROM 7) AS INTEGER) 
                    ELSE 0 END
                ), 0) + 1 as next_id 
                FROM employees
            `);
            generatedUserId = `RTWDI-${String(maxIdResult.rows[0].next_id).padStart(3, '0')}`;
        }

        // Convert empty strings to null for unique constraint fields
        const emailValue = email && email.trim() !== '' ? email.trim() : null;
        const phoneValue = phone && phone.trim() !== '' ? phone.trim() : null;
        const deptValue = department_id && department_id !== '' ? department_id : null;

        const result = await pool.query(`
            INSERT INTO employees (
                user_id, employee_code, erp_user_id, first_name, last_name, full_name,
                email, phone, department_id, designation, card_number, role, hire_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `, [generatedUserId, generatedEmployeeCode, erp_user_id, first_name, last_name, full_name,
            emailValue, phoneValue, deptValue, designation, card_number, role || 'employee', hire_date]);

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error creating employee:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


// PUT /api/attendance/employees/:id - Update employee
router.put('/employees/:id', validateSession, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            employee_code, first_name, last_name, email, phone,
            department_id, designation, card_number, role, status
        } = req.body;

        const full_name = `${first_name} ${last_name || ''}`.trim();

        // Convert empty strings to null for unique constraint fields
        const emailValue = email && email.trim() !== '' ? email.trim() : null;
        const phoneValue = phone && phone.trim() !== '' ? phone.trim() : null;
        const deptValue = department_id && department_id !== '' ? department_id : null;

        const result = await pool.query(`
            UPDATE employees SET
                employee_code = COALESCE($1, employee_code),
                first_name = COALESCE($2, first_name),
                last_name = COALESCE($3, last_name),
                full_name = $4,
                email = $5,
                phone = $6,
                department_id = $7,
                designation = COALESCE($8, designation),
                card_number = COALESCE($9, card_number),
                role = COALESCE($10, role),
                status = COALESCE($11, status),
                updated_at = NOW()
            WHERE employee_id = $12
            RETURNING *
        `, [employee_code, first_name, last_name, full_name, emailValue, phoneValue,
            deptValue, designation, card_number, role, status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Employee not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/attendance/employees/:id - Delete employee
router.delete('/employees/:id', validateSession, async (req, res) => {
    try {
        const { id } = req.params;

        // Soft delete - set status to inactive
        const result = await pool.query(
            `UPDATE employees SET status = 'inactive', updated_at = NOW() WHERE employee_id = $1 RETURNING *`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Employee not found' });
        }

        res.json({ success: true, message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ================================================================================
// ATTENDANCE LOGS ROUTES
// ================================================================================

// GET /api/attendance/logs - Get attendance logs
router.get('/logs', validateSession, async (req, res) => {
    try {
        const { employee_id, start_date, end_date, limit = 100 } = req.query;

        let query = `
            SELECT al.*, e.full_name, e.employee_code, d.device_name
            FROM attendance_logs al
            JOIN employees e ON al.employee_id = e.employee_id
            JOIN devices d ON al.device_id = d.device_id
            WHERE (al.status IS NULL OR al.status != 'deleted')
        `;
        const params = [];
        let paramIndex = 1;

        if (employee_id) {
            query += ` AND al.employee_id = $${paramIndex++}`;
            params.push(employee_id);
        }
        if (start_date) {
            query += ` AND DATE(al.punch_time) >= $${paramIndex++}`;
            params.push(start_date);
        }
        if (end_date) {
            query += ` AND DATE(al.punch_time) <= $${paramIndex++}`;
            params.push(end_date);
        }

        query += ` ORDER BY al.punch_time DESC LIMIT $${paramIndex}`;
        params.push(parseInt(limit));

        const result = await pool.query(query, params);
        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching attendance logs:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/attendance/logs/:id - Update punch record (Admin only)
router.put('/logs/:id', validateSession, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, error: 'Admin access required' });
        }

        const { id } = req.params;
        const { punch_time, in_out_mode, remarks } = req.body;

        // Get employee_id from user session if available (for edited_by field)
        const empResult = await pool.query(
            'SELECT employee_id FROM employees WHERE erp_user_id = $1',
            [req.userId]
        );
        const editedBy = empResult.rows.length > 0 ? empResult.rows[0].employee_id : null;

        const result = await pool.query(`
            UPDATE attendance_logs SET
                punch_time = COALESCE($1, punch_time),
                in_out_mode = COALESCE($2, in_out_mode),
                status = 'edited',
                remarks = $3,
                edited_by = $4,
                edited_at = NOW()
            WHERE log_id = $5
            RETURNING *
        `, [punch_time, in_out_mode, remarks, editedBy, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Punch record not found' });
        }

        res.json({ success: true, message: 'Punch record updated successfully', data: result.rows[0] });
    } catch (error) {
        console.error('Error updating punch record:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PATCH /api/attendance/logs/:id/delete - Soft delete punch record (Admin only)
router.patch('/logs/:id/delete', validateSession, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, error: 'Admin access required' });
        }

        const { id } = req.params;
        const { remarks } = req.body;

        const result = await pool.query(`
            UPDATE attendance_logs SET
                status = 'deleted',
                remarks = $1,
                edited_at = NOW()
            WHERE log_id = $2
            RETURNING *
        `, [remarks || 'Deleted by admin', id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Punch record not found' });
        }

        res.json({ success: true, message: 'Punch record deleted successfully' });
    } catch (error) {
        console.error('Error deleting punch record:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/attendance/logs/manual - Add manual punch record (Admin only)
router.post('/logs/manual', validateSession, async (req, res) => {
    try {
        // Check if user is admin
        if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            return res.status(403).json({ success: false, error: 'Admin access required' });
        }

        const { employee_id, punch_time, in_out_mode, remarks } = req.body;

        if (!employee_id || !punch_time || in_out_mode === undefined) {
            return res.status(400).json({
                success: false,
                error: 'employee_id, punch_time, and in_out_mode are required'
            });
        }

        // Get employee_id for audit (handle case where admin is not an employee)
        let editedBy = null;
        try {
            const empResult = await pool.query(
                'SELECT employee_id FROM employees WHERE erp_user_id = $1',
                [req.user.id]
            );
            editedBy = empResult.rows.length > 0 ? empResult.rows[0].employee_id : null;
        } catch (empError) {
            console.warn('Could not lookup employee for audit:', empError.message);
            // Continue anyway - editedBy can be null
        }

        // Get first active device for device_id (or use a default)
        const deviceResult = await pool.query(
            'SELECT device_id FROM devices WHERE status = $1 LIMIT 1',
            ['active']
        );
        const deviceId = deviceResult.rows.length > 0 ? deviceResult.rows[0].device_id : null;

        if (!deviceId) {
            return res.status(400).json({ success: false, error: 'No active device found' });
        }

        const result = await pool.query(`
            INSERT INTO attendance_logs (
                employee_id, device_id, punch_time, verify_mode, in_out_mode,
                sync_status, status, remarks, edited_by
            ) VALUES ($1, $2, $3, 0, $4, 'synced', 'edited', $5, $6)
            RETURNING *
        `, [employee_id, deviceId, punch_time, in_out_mode, remarks || 'Manually added by admin', editedBy]);

        res.status(201).json({
            success: true,
            message: 'Punch record added successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error adding manual punch record:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


// GET /api/attendance/daily - Get daily attendance summary
router.get('/daily', validateSession, async (req, res) => {
    try {
        const { employee_id, start_date, end_date, status } = req.query;

        let query = `
            SELECT da.*, e.full_name, e.employee_code, d.department_name
            FROM daily_attendance da
            JOIN employees e ON da.employee_id = e.employee_id
            LEFT JOIN att_departments d ON e.department_id = d.department_id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (employee_id) {
            query += ` AND da.employee_id = $${paramIndex++}`;
            params.push(employee_id);
        }
        if (start_date) {
            query += ` AND da.attendance_date >= $${paramIndex++}`;
            params.push(start_date);
        }
        if (end_date) {
            query += ` AND da.attendance_date <= $${paramIndex++}`;
            params.push(end_date);
        }
        if (status) {
            query += ` AND da.status = $${paramIndex++}`;
            params.push(status);
        }

        query += ' ORDER BY da.attendance_date DESC, e.full_name';

        const result = await pool.query(query, params);
        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching daily attendance:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/attendance/today - Get today's attendance (live from attendance_logs)
router.get('/today', validateSession, async (req, res) => {
    try {
        // Get all active employees with their punch data for today
        const result = await pool.query(`
            SELECT 
                e.employee_id,
                e.employee_code,
                e.full_name,
                e.photo_url,
                d.department_name,
                MIN(al.punch_time::TIME) as first_in,
                MAX(al.punch_time::TIME) as last_out,
                ROUND(EXTRACT(EPOCH FROM (MAX(al.punch_time) - MIN(al.punch_time))) / 3600.0, 2) as total_hours,
                COUNT(al.log_id) as punch_count,
                CASE 
                    WHEN COUNT(al.log_id) > 0 THEN 'present'
                    ELSE 'absent'
                END as status,
                CASE 
                    WHEN MIN(al.punch_time::TIME) > '09:30:00' THEN TRUE
                    ELSE FALSE
                END as is_late
            FROM employees e
            LEFT JOIN att_departments d ON e.department_id = d.department_id
            LEFT JOIN attendance_logs al ON e.employee_id = al.employee_id 
                AND DATE(al.punch_time) = CURRENT_DATE
                AND (al.status IS NULL OR al.status != 'deleted')
            WHERE e.status = 'active'
            GROUP BY e.employee_id, e.employee_code, e.full_name, e.photo_url, d.department_name
            ORDER BY first_in DESC NULLS LAST, e.full_name
        `);

        res.json({
            success: true,
            date: new Date().toISOString().split('T')[0],
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching today attendance:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/attendance/live-punches - Get live punch feed
router.get('/live-punches', validateSession, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM v_latest_punches');
        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching live punches:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/attendance/process-daily - Process daily attendance
router.post('/process-daily', validateSession, async (req, res) => {
    try {
        const { date } = req.body;
        const processDate = date || new Date().toISOString().split('T')[0];

        const result = await pool.query('SELECT process_daily_attendance($1) as processed', [processDate]);

        res.json({
            success: true,
            message: `Processed ${result.rows[0].processed} attendance records for ${processDate}`
        });
    } catch (error) {
        console.error('Error processing daily attendance:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ================================================================================
// DEPARTMENT ROUTES
// ================================================================================

// GET /api/attendance/departments - Get all departments
router.get('/departments', validateSession, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT d.*, 
                   (SELECT COUNT(*) FROM employees WHERE department_id = d.department_id AND status = 'active') as employee_count
            FROM att_departments d
            WHERE d.is_active = TRUE
            ORDER BY d.department_name
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching departments:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/attendance/departments - Create department
router.post('/departments', validateSession, async (req, res) => {
    try {
        const { department_code, department_name, description } = req.body;
        const result = await pool.query(`
            INSERT INTO att_departments (department_code, department_name, description)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [department_code, department_name, description]);

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error creating department:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ================================================================================
// SHIFT ROUTES
// ================================================================================

// GET /api/attendance/shifts - Get all shifts
router.get('/shifts', validateSession, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT * FROM shifts WHERE is_active = TRUE ORDER BY shift_name
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching shifts:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/attendance/shifts - Create shift
router.post('/shifts', validateSession, async (req, res) => {
    try {
        const { shift_name, shift_code, start_time, end_time, grace_period_minutes, full_day_hours, half_day_hours, break_duration_minutes } = req.body;

        // Auto-generate shift_code if not provided (from shift_name)
        const generatedCode = shift_code || shift_name.toUpperCase().replace(/\s+/g, '_').substring(0, 20);

        const result = await pool.query(`
            INSERT INTO shifts (shift_name, shift_code, start_time, end_time, grace_period_minutes, full_day_hours, half_day_hours, break_duration_minutes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [shift_name, generatedCode, start_time, end_time, grace_period_minutes || 15, full_day_hours || 8, half_day_hours || 4, break_duration_minutes || 60]);

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error creating shift:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/attendance/shifts/:id - Update shift
router.put('/shifts/:id', validateSession, async (req, res) => {
    try {
        const { id } = req.params;
        const { shift_name, shift_code, start_time, end_time, grace_period_minutes, full_day_hours, half_day_hours, break_duration_minutes } = req.body;

        const result = await pool.query(`
            UPDATE shifts SET
                shift_name = COALESCE($1, shift_name),
                shift_code = COALESCE($2, shift_code),
                start_time = COALESCE($3, start_time),
                end_time = COALESCE($4, end_time),
                grace_period_minutes = COALESCE($5, grace_period_minutes),
                full_day_hours = COALESCE($6, full_day_hours),
                half_day_hours = COALESCE($7, half_day_hours),
                break_duration_minutes = COALESCE($8, break_duration_minutes),
                updated_at = NOW()
            WHERE shift_id = $9
            RETURNING *
        `, [shift_name, shift_code, start_time, end_time, grace_period_minutes, full_day_hours, half_day_hours, break_duration_minutes, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Shift not found' });
        }

        res.json({ success: true, data: result.rows[0], message: 'Shift updated successfully' });
    } catch (error) {
        console.error('Error updating shift:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});


// DELETE /api/attendance/shifts/:id - Delete shift
router.delete('/shifts/:id', validateSession, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM shifts WHERE shift_id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Shift not found' });
        }
        res.json({ success: true, message: 'Shift deleted successfully' });
    } catch (error) {
        console.error('Error deleting shift:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ================================================================================
// DEVICE ROUTES
// ================================================================================

// GET /api/attendance/devices - Get all devices
router.get('/devices', validateSession, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT d.*,
                   (SELECT COUNT(*) FROM attendance_logs WHERE device_id = d.device_id AND DATE(punch_time) = CURRENT_DATE) as today_punches
            FROM devices d
            ORDER BY d.device_name
        `);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching devices:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/attendance/devices/:id - Delete device
router.delete('/devices/:id', validateSession, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM devices WHERE device_id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Device not found' });
        }
        res.json({ success: true, message: 'Device deleted successfully' });
    } catch (error) {
        console.error('Error deleting device:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/attendance/devices/:id/sync-users - Sync employees to device
router.post('/devices/:id/sync-users', validateSession, async (req, res) => {
    try {
        const { id } = req.params;
        const { employee_ids } = req.body; // Optional: specific employees to sync

        // Get device info
        const deviceResult = await pool.query('SELECT * FROM devices WHERE device_id = $1', [id]);
        if (deviceResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Device not found' });
        }
        const device = deviceResult.rows[0];

        if (!device.ip_address) {
            return res.status(400).json({ success: false, error: 'Device IP not configured' });
        }

        // Get employees to sync
        let employeeQuery = `SELECT employee_id, user_id, full_name, first_name, card_number FROM employees WHERE status = 'active'`;
        const params = [];

        if (employee_ids && employee_ids.length > 0) {
            employeeQuery += ` AND employee_id = ANY($1)`;
            params.push(employee_ids);
        }

        const empResult = await pool.query(employeeQuery, params);

        if (empResult.rows.length === 0) {
            return res.status(400).json({ success: false, error: 'No employees to sync' });
        }

        // Sync to device
        const results = await deviceSync.syncEmployees(
            device.ip_address.replace('/32', ''), // Remove CIDR notation if present
            device.port || 4370,
            empResult.rows
        );

        // Update device last sync time
        await pool.query('UPDATE devices SET last_sync_time = NOW() WHERE device_id = $1', [id]);

        res.json({
            success: true,
            message: `Synced ${results.success} employees to device`,
            synced: results.success,
            failed: results.failed,
            details: results.details
        });
    } catch (error) {
        console.error('Error syncing users to device:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/attendance/devices/:id/sync-attendance - Fetch attendance logs FROM device
router.post('/devices/:id/sync-attendance', validateSession, async (req, res) => {
    const ZKTeco = require('zkteco-js');

    try {
        const { id } = req.params;

        // Get device info
        const deviceResult = await pool.query('SELECT * FROM devices WHERE device_id = $1', [id]);
        if (deviceResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Device not found' });
        }
        const deviceInfo = deviceResult.rows[0];

        if (!deviceInfo.ip_address) {
            return res.status(400).json({ success: false, error: 'Device IP not configured' });
        }

        const ip = deviceInfo.ip_address.replace('/32', '');
        const port = deviceInfo.port || 4370;

        console.log(`[AttendanceSync] Connecting to device at ${ip}:${port}`);

        // Connect to device
        const device = new ZKTeco(ip, port, 10000);
        await device.createSocket();
        console.log(`[AttendanceSync] Connected to device`);

        // Get attendance logs from device
        const attendances = await device.getAttendances();
        console.log(`[AttendanceSync] Found ${attendances?.data?.length || 0} attendance records on device`);

        if (!attendances?.data || attendances.data.length === 0) {
            await device.disconnect();
            return res.json({ success: true, message: 'No attendance records on device', imported: 0 });
        }

        // Get all employees for user_id mapping
        const empResult = await pool.query('SELECT employee_id, user_id FROM employees');
        const empMap = new Map();
        empResult.rows.forEach(e => {
            // Map both RTWDI-XXX format and numeric format
            const numericId = String(e.user_id).replace('RTWDI-', '');
            empMap.set(numericId, e.employee_id);
            empMap.set(String(e.user_id), e.employee_id);
            // Also map with leading zeros removed (e.g., "0100" -> "100")
            empMap.set(parseInt(numericId, 10).toString(), e.employee_id);
        });

        let imported = 0, skipped = 0, errors = 0;

        for (const att of attendances.data) {
            try {
                // Find employee by user_id - try various formats
                const userId = String(att.user_id);
                let employeeId = empMap.get(userId);

                // Try without leading zeros (e.g., "0100" -> "100")
                if (!employeeId) {
                    employeeId = empMap.get(parseInt(userId, 10).toString());
                }

                if (!employeeId) {
                    console.log(`[AttendanceSync] Unknown user_id: ${userId}`);
                    skipped++;
                    continue;
                }

                // Parse punch time
                const punchTime = new Date(att.record_time);

                // Check if already exists (avoid duplicates)
                const existsCheck = await pool.query(
                    `SELECT 1 FROM attendance_logs 
                     WHERE employee_id = $1 AND punch_time = $2`,
                    [employeeId, punchTime]
                );

                if (existsCheck.rows.length > 0) {
                    skipped++;
                    continue;
                }

                // Insert attendance log (no punch_type column in schema)
                await pool.query(
                    `INSERT INTO attendance_logs (employee_id, device_id, punch_time, status)
                     VALUES ($1, $2, $3, $4)`,
                    [employeeId, id, punchTime, 'valid']
                );
                imported++;
            } catch (err) {
                console.error(`[AttendanceSync] Error inserting record:`, err.message);
                errors++;
            }
        }

        // Update device last sync time
        await pool.query('UPDATE devices SET last_sync_time = NOW() WHERE device_id = $1', [id]);

        await device.disconnect();
        console.log(`[AttendanceSync] Sync complete. Imported: ${imported}, Skipped: ${skipped}, Errors: ${errors}`);

        res.json({
            success: true,
            message: `Attendance sync complete`,
            total: attendances.data.length,
            imported,
            skipped,
            errors
        });
    } catch (error) {
        console.error('Error syncing attendance from device:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/attendance/devices/:id/users - Get users registered on device
router.get('/devices/:id/users', validateSession, async (req, res) => {
    try {
        const { id } = req.params;

        // Get device info
        const deviceResult = await pool.query('SELECT * FROM devices WHERE device_id = $1', [id]);
        if (deviceResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Device not found' });
        }
        const device = deviceResult.rows[0];

        if (!device.ip_address) {
            return res.status(400).json({ success: false, error: 'Device IP not configured' });
        }

        // Connect and get users
        const conn = await deviceSync.connect(device.ip_address.replace('/32', ''), device.port || 4370);
        const result = await deviceSync.getUsers(conn);
        await deviceSync.disconnect(device.ip_address.replace('/32', ''), device.port || 4370);

        res.json(result);
    } catch (error) {
        console.error('Error getting device users:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/attendance/devices/:id/users/:userId - Remove user from device
router.delete('/devices/:id/users/:userId', validateSession, async (req, res) => {
    try {
        const { id, userId } = req.params;

        // Get device info
        const deviceResult = await pool.query('SELECT * FROM devices WHERE device_id = $1', [id]);
        if (deviceResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Device not found' });
        }
        const device = deviceResult.rows[0];

        if (!device.ip_address) {
            return res.status(400).json({ success: false, error: 'Device IP not configured' });
        }

        // Connect and delete user
        const conn = await deviceSync.connect(device.ip_address.replace('/32', ''), device.port || 4370);
        const result = await deviceSync.deleteUser(conn, userId);
        await deviceSync.disconnect(device.ip_address.replace('/32', ''), device.port || 4370);

        res.json(result);
    } catch (error) {
        console.error('Error deleting user from device:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/attendance/employees/:id/sync-to-device - Sync single employee to device
router.post('/employees/:id/sync-to-device', validateSession, async (req, res) => {
    try {
        const { id } = req.params;
        const { device_id } = req.body;

        // Get employee
        const empResult = await pool.query(
            'SELECT employee_id, user_id, full_name, first_name, card_number FROM employees WHERE employee_id = $1',
            [id]
        );
        if (empResult.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Employee not found' });
        }
        const employee = empResult.rows[0];

        // Get device (or first active device if not specified)
        let deviceQuery = 'SELECT * FROM devices WHERE status = $1';
        const params = ['active'];
        if (device_id) {
            deviceQuery += ' AND device_id = $2';
            params.push(device_id);
        }
        deviceQuery += ' LIMIT 1';

        const deviceResult = await pool.query(deviceQuery, params);
        if (deviceResult.rows.length === 0) {
            return res.status(400).json({ success: false, error: 'No active device found' });
        }
        const device = deviceResult.rows[0];

        if (!device.ip_address) {
            return res.status(400).json({ success: false, error: 'Device IP not configured' });
        }

        // Connect and push user
        const conn = await deviceSync.connect(device.ip_address.replace('/32', ''), device.port || 4370);
        const result = await deviceSync.pushUser(conn, employee);
        await deviceSync.disconnect(device.ip_address.replace('/32', ''), device.port || 4370);

        if (result.success) {
            res.json({ success: true, message: `${employee.full_name} synced to device` });
        } else {
            res.status(500).json(result);
        }
    } catch (error) {
        console.error('Error syncing employee to device:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ================================================================================
// REPORTS / DASHBOARD STATISTICS
// ================================================================================

// GET /api/attendance/reports/dashboard-stats - Get dashboard statistics
router.get('/reports/dashboard-stats', validateSession, async (req, res) => {
    try {
        const stats = {};

        // Total employees
        const totalEmployees = await pool.query(
            "SELECT COUNT(*) as count FROM employees WHERE status = 'active'"
        );
        stats.totalEmployees = parseInt(totalEmployees.rows[0].count);

        // Present today - count distinct employees who punched in today
        const presentToday = await pool.query(
            "SELECT COUNT(DISTINCT employee_id) as count FROM attendance_logs WHERE DATE(punch_time) = CURRENT_DATE"
        );
        stats.presentToday = parseInt(presentToday.rows[0].count);

        // Absent today
        stats.absentToday = Math.max(0, stats.totalEmployees - stats.presentToday);

        // Late today - employees whose first punch is after shift start + grace period
        const lateToday = await pool.query(`
            SELECT COUNT(*) as count FROM (
                SELECT employee_id, MIN(punch_time) as first_punch
                FROM attendance_logs 
                WHERE DATE(punch_time) = CURRENT_DATE
                GROUP BY employee_id
                HAVING MIN(punch_time)::time > '09:30:00'
            ) late_employees
        `);
        stats.lateToday = parseInt(lateToday.rows[0].count);

        // Pending leaves
        const pendingLeaves = await pool.query(
            "SELECT COUNT(*) as count FROM att_leaves WHERE status = 'pending'"
        );
        stats.pendingLeaves = parseInt(pendingLeaves.rows[0].count);

        // Active devices
        const activeDevices = await pool.query(
            "SELECT COUNT(*) as count FROM devices WHERE status = 'active'"
        );
        stats.activeDevices = parseInt(activeDevices.rows[0].count);

        // Today's punches
        const todayPunches = await pool.query(
            "SELECT COUNT(*) as count FROM attendance_logs WHERE DATE(punch_time) = CURRENT_DATE"
        );
        stats.todayPunches = parseInt(todayPunches.rows[0].count);

        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/attendance/reports/monthly-summary - Monthly summary
router.get('/reports/monthly-summary', validateSession, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM v_current_month_attendance ORDER BY full_name');
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching monthly summary:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ================================================================================
// EXCEL IMPORT/EXPORT ROUTES (Bulk Employee Management)
// ================================================================================
const ExcelJS = require('exceljs');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.get('/employees/template', validateSession, async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Employee Import');
        worksheet.columns = [
            { header: 'First Name*', key: 'first_name', width: 15 },
            { header: 'Last Name', key: 'last_name', width: 15 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Phone', key: 'phone', width: 15 },
            { header: 'Department', key: 'department', width: 20 },
            { header: 'Designation', key: 'designation', width: 20 },
            { header: 'Hire Date (YYYY-MM-DD)', key: 'hire_date', width: 22 },
            { header: 'Card Number', key: 'card_number', width: 15 },
            { header: 'Status* (active/inactive)', key: 'status', width: 22 }
        ];
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF5D4037' } };
        worksheet.addRow({ first_name: 'John', last_name: 'Doe', email: 'john.doe@example.com', phone: '9876543210', department: 'HR', designation: 'Manager', hire_date: '2026-01-01', card_number: '12345', status: 'active' });
        worksheet.addRow({ first_name: 'Jane', last_name: 'Smith', email: 'jane.smith@example.com', phone: '9876543211', department: 'IT', designation: 'Developer', hire_date: '2026-01-05', card_number: '12346', status: 'active' });
        worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Employee_Import_Template.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error generating template:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

router.post('/employees/import', validateSession, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, error: 'No file uploaded' });
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(req.file.buffer);
        const worksheet = workbook.getWorksheet(1);
        const employees = [];
        const errors = [];
        const lastUserResult = await pool.query(`SELECT user_id FROM employees WHERE user_id LIKE 'RTWDI-%' ORDER BY user_id DESC LIMIT 1`);
        let nextUserNum = 1;
        if (lastUserResult.rows.length > 0) {
            const match = lastUserResult.rows[0].user_id.match(/RTWDI-(\d+)/);
            if (match) nextUserNum = parseInt(match[1]) + 1;
        }
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            const rowData = { first_name: row.getCell(1).value, last_name: row.getCell(2).value, email: row.getCell(3).value, phone: row.getCell(4).value, department: row.getCell(5).value, designation: row.getCell(6).value, hire_date: row.getCell(7).value, card_number: row.getCell(8).value, status: row.getCell(9).value || 'active' };
            if (!rowData.first_name && !rowData.last_name && !rowData.email) return;
            if (!rowData.first_name) { errors.push({ row: rowNumber, error: 'Missing required field: First Name' }); return; }
            const timestamp = Date.now().toString().slice(-6);
            const namePrefix = rowData.first_name.toString().substring(0, 4).toUpperCase().padEnd(4, 'X');
            rowData.employee_code = `RTWEC/${namePrefix}${timestamp}${String(rowNumber).padStart(2, '0')}`;
            rowData.user_id = `RTWDI-${String(nextUserNum++).padStart(3, '0')}`;
            employees.push({ rowNumber, data: rowData });
        });
        let importedCount = 0;
        for (const emp of employees) {
            try {
                const full_name = `${emp.data.first_name} ${emp.data.last_name || ''}`.trim();
                await pool.query(`INSERT INTO employees (user_id, employee_code, first_name, last_name, full_name, email, phone, designation, hire_date, card_number, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`, [emp.data.user_id, emp.data.employee_code, emp.data.first_name, emp.data.last_name, full_name, emp.data.email, emp.data.phone, emp.data.designation, emp.data.hire_date || null, emp.data.card_number, emp.data.status]);
                importedCount++;
            } catch (dbError) {
                if (dbError.code === '23505') errors.push({ row: emp.rowNumber, error: 'Duplicate email or employee code' });
                else errors.push({ row: emp.rowNumber, error: dbError.message });
            }
        }
        res.json({ success: true, imported: importedCount, failed: errors.length, errors: errors.slice(0, 20) });
    } catch (error) {
        console.error('Error importing employees:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
