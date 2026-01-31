require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function checkShekhar() {
    // Check Shekhar's employee record
    const emp = await pool.query(`
        SELECT employee_id, user_id, employee_code, full_name 
        FROM employees 
        WHERE full_name ILIKE '%shekhar%'
    `);
    console.log('\n=== Shekhar Employee Record ===');
    console.log(JSON.stringify(emp.rows, null, 2));

    // Check what user_ids are in attendance logs
    const logs = await pool.query(`
        SELECT DISTINCT e.user_id, e.full_name, COUNT(*) as punch_count
        FROM attendance_logs al
        JOIN employees e ON al.employee_id = e.employee_id
        WHERE DATE(al.punch_time) = CURRENT_DATE
        GROUP BY e.user_id, e.full_name
    `);
    console.log('\n=== Today\'s Punches by User ID ===');
    console.log(JSON.stringify(logs.rows, null, 2));

    await pool.end();
}

checkShekhar().catch(e => console.error(e));
