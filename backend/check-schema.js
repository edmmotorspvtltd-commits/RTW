require('dotenv').config({ path: '../.env' });
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function checkSchema() {
    const result = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'attendance_logs' 
        ORDER BY ordinal_position
    `);
    console.log('attendance_logs columns:', result.rows);
    await pool.end();
}

checkSchema().catch(e => console.error(e));
