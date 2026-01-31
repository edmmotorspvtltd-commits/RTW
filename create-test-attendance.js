const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function cleanAndCreateTestData() {
    try {
        console.log('Step 1: Removing old deleted records...');

        // Permanently delete the deleted records for today
        const deleteResult = await pool.query(`
            DELETE FROM attendance_logs 
            WHERE DATE(punch_time) = '2026-01-10' 
            AND status = 'deleted'
        `);

        console.log(`✅ Deleted ${deleteResult.rowCount} old records\n`);

        console.log('Step 2: Creating fresh test attendance data...\n');

        // Get employee
        const empResult = await pool.query(`
            SELECT employee_id, full_name 
            FROM employees 
            WHERE LOWER(full_name) LIKE '%shekhar%' 
            LIMIT 1
        `);

        if (empResult.rows.length === 0) {
            console.log('❌ No employee found');
            return;
        }

        const employee = empResult.rows[0];
        console.log(`Employee: ${employee.full_name} (ID: ${employee.employee_id})`);

        // Get device
        const deviceResult = await pool.query(`
            SELECT device_id FROM devices WHERE status = 'active' LIMIT 1
        `);

        const deviceId = deviceResult.rows[0]?.device_id || 1;

        // Create IN punch at 10:00 AM
        await pool.query(`
            INSERT INTO attendance_logs (
                employee_id, device_id, punch_time, verify_mode, in_out_mode,
                sync_status, status, remarks
            ) VALUES ($1, $2, '2026-01-10 10:00:00', 15, 0, 'synced', 'valid', 'Test data - IN')
        `, [employee.employee_id, deviceId]);

        console.log('✅ Created IN punch at 10:00:00');

        // Create OUT punch at 9:30 PM
        await pool.query(`
            INSERT INTO attendance_logs (
                employee_id, device_id, punch_time, verify_mode, in_out_mode,
                sync_status, status, remarks
            ) VALUES ($1, $2, '2026-01-10 21:30:00', 15, 1, 'synced', 'valid', 'Test data - OUT')
        `, [employee.employee_id, deviceId]);

        console.log('✅ Created OUT punch at 21:30:00');

        console.log('\n📊 Summary:');
        console.log('   IN Time:  10:00 AM');
        console.log('   OUT Time: 9:30 PM');
        console.log('   Total:    11.50 hours\n');

        console.log('✅ Test data created successfully!');
        console.log('\n🔄 Now refresh:');
        console.log('   1. Attendance Dashboard');
        console.log('   2. Attendance Logs page\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

cleanAndCreateTestData();
