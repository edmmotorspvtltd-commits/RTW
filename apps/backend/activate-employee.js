require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function activateEmployee() {
    console.log('Before update:');
    const before = await pool.query(`SELECT employee_id, full_name, status FROM employees WHERE employee_id = 1`);
    console.log(JSON.stringify(before.rows[0], null, 2));

    console.log('\nUpdating status to active...');
    await pool.query(`UPDATE employees SET status = 'active' WHERE employee_id = 1`);

    console.log('\nAfter update:');
    const after = await pool.query(`SELECT employee_id, full_name, status FROM employees WHERE employee_id = 1`);
    console.log(JSON.stringify(after.rows[0], null, 2));

    await pool.end();
    console.log('\n✓ Employee activated! Now refresh your browser page.');
}

activateEmployee().catch(e => console.error(e));
