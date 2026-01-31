require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function checkEmail() {
    const result = await pool.query(`
        SELECT employee_id, user_id, employee_code, full_name, email, status
        FROM employees 
        WHERE email = 'shekhar.jha@ramratantechnoweave.com'
    `);
    console.log('Employees with this email:', JSON.stringify(result.rows, null, 2));
    await pool.end();
}

checkEmail().catch(e => console.error(e));
