require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function checkDevices() {
    const result = await pool.query('SELECT * FROM devices LIMIT 5');
    console.log('Devices in database:', JSON.stringify(result.rows, null, 2));
    await pool.end();
}

checkDevices().catch(e => console.error(e));
