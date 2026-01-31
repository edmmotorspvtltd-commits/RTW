require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function checkPunches() {
    const result = await pool.query(`
        SELECT al.log_id, al.punch_time, e.full_name 
        FROM attendance_logs al 
        JOIN employees e ON al.employee_id = e.employee_id 
        WHERE e.full_name ILIKE '%shekhar%' 
        AND DATE(al.punch_time) = CURRENT_DATE 
        ORDER BY al.punch_time
    `);
    console.log('Punches for Shekhar today:', JSON.stringify(result.rows, null, 2));

    // Also check total count
    const count = await pool.query(`SELECT COUNT(*) FROM attendance_logs WHERE DATE(punch_time) = CURRENT_DATE`);
    console.log('Total punches today:', count.rows[0].count);

    await pool.end();
}

checkPunches().catch(e => console.error(e));
