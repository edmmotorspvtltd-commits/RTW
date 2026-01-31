const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function checkData() {
    try {
        // Check attendance logs for today
        const result = await pool.query(`
            SELECT log_id, employee_id, 
                   TO_CHAR(punch_time, 'YYYY-MM-DD HH24:MI:SS') as punch_time,
                   in_out_mode, status, sync_status
            FROM attendance_logs 
            WHERE DATE(punch_time) = '2026-01-10'
            ORDER BY punch_time
        `);

        console.log('\n=== ATTENDANCE LOGS FOR 2026-01-10 ===');
        console.log(`Total records: ${result.rows.length}\n`);

        if (result.rows.length > 0) {
            console.table(result.rows);
        } else {
            console.log('No records found for this date.');
        }

        // Check with filter (excluding deleted)
        const filteredResult = await pool.query(`
            SELECT log_id, employee_id, 
                   TO_CHAR(punch_time, 'YYYY-MM-DD HH24:MI:SS') as punch_time,
                   in_out_mode, status
            FROM attendance_logs 
            WHERE DATE(punch_time) = '2026-01-10'
              AND (status IS NULL OR status != 'deleted')
            ORDER BY punch_time
        `);

        console.log('\n=== FILTERED (EXCLUDING DELETED) ===');
        console.log(`Records after filter: ${filteredResult.rows.length}\n`);

        if (filteredResult.rows.length > 0) {
            console.table(filteredResult.rows);
        } else {
            console.log('No non-deleted records found.');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkData();
