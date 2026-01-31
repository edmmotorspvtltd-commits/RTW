require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function checkStatus() {
    const result = await pool.query(`
        SELECT employee_id, user_id, full_name, email, status
        FROM employees 
        WHERE employee_id = 1
    `);
    console.log('Employee #1 status:', JSON.stringify(result.rows[0], null, 2));
    await pool.end();
}

checkStatus().catch(e => console.error(e));
