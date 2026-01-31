require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function updateShekharUserId() {
    console.log('\n=== Current Shekhar Records ===');
    const before = await pool.query(`
        SELECT employee_id, user_id, employee_code, full_name 
        FROM employees 
        WHERE full_name ILIKE '%shekhar%'
        ORDER BY employee_id
    `);
    console.log(JSON.stringify(before.rows, null, 2));

    console.log('\n=== Setting user_id for employee_id 1 ===');
    // Set user_id for the original shekhar (employee_id 1)
    await pool.query(`
        UPDATE employees 
        SET user_id = 'RTWDI-100'
        WHERE employee_id = 1
    `);

    console.log('✓ Updated employee_id 1 with user_id: RTWDI-100');

    const after = await pool.query(`
        SELECT employee_id, user_id, employee_code, full_name 
        FROM employees 
        WHERE full_name ILIKE '%shekhar%'
        ORDER BY employee_id
    `);
    console.log('\n=== After Update ===');
    console.log(JSON.stringify(after.rows, null, 2));

    await pool.end();
}

updateShekharUserId().catch(e => console.error(e));
