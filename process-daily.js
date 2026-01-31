const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function processDailyAttendance() {
    try {
        console.log('Processing daily attendance for 2026-01-10...\n');

        // Call the stored procedure to process daily attendance
        const result = await pool.query(`
            SELECT process_daily_attendance('2026-01-10') as processed_count
        `);

        const count = result.rows[0].processed_count;
        console.log(`✅ Processed ${count} attendance record(s)\n`);

        // Verify the data
        const verifyResult = await pool.query(`
            SELECT 
                TO_CHAR(da.attendance_date, 'YYYY-MM-DD') as date,
                e.full_name,
                e.employee_code,
                TO_CHAR(da.first_in, 'HH24:MI:SS') as first_in,
                TO_CHAR(da.last_out, 'HH24:MI:SS') as last_out,
                da.total_hours,
                da.status
            FROM daily_attendance da
            JOIN employees e ON da.employee_id = e.employee_id
            WHERE da.attendance_date = '2026-01-10'
        `);

        console.log('=== DAILY ATTENDANCE TABLE ===');
        if (verifyResult.rows.length > 0) {
            console.table(verifyResult.rows);
            console.log('\n✅ Daily attendance updated successfully!');
            console.log('🔄 Now refresh the Live Dashboard page.');
        } else {
            console.log('⚠️ No records found in daily_attendance table');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        await pool.end();
    }
}

processDailyAttendance();
