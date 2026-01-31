require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function fixShekharDuplicate() {
    console.log('\n=== Current Shekhar Records ===');
    const before = await pool.query(`
        SELECT employee_id, user_id, employee_code, full_name, created_at
        FROM employees 
        WHERE full_name ILIKE '%shekhar%'
        ORDER BY employee_id
    `);
    console.log(JSON.stringify(before.rows, null, 2));

    console.log('\n=== Deleting duplicate employee_id 47 (newer one) ===');
    await pool.query(`DELETE FROM employees WHERE employee_id = 47`);
    console.log('✓ Deleted employee_id 47');

    console.log('\n=== Setting user_id for employee_id 1 (original) ===');
    await pool.query(`
        UPDATE employees 
        SET user_id = 'RTWDI-100', 
            employee_code = 'RTWEC/SHEK20260110001'
        WHERE employee_id = 1
    `);
    console.log('✓ Updated employee_id 1');

    const after = await pool.query(`
        SELECT employee_id, user_id, employee_code, full_name 
        FROM employees 
        WHERE full_name ILIKE '%shekhar%'
        ORDER BY employee_id
    `);
    console.log('\n=== After Fix ===');
    console.log(JSON.stringify(after.rows, null, 2));

    await pool.end();
}

fixShekharDuplicate().catch(e => console.error(e));
