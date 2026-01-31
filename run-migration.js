// Run database migration to add refresh_token column
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'rtwe_erp',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('🔧 Running migration: Adding refresh_token column...\n');

        const sqlPath = path.join(__dirname, 'Schema', 'add_refresh_token_column.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await client.query(sql);

        console.log('✅ Migration completed successfully!\n');

        // Verify column was added
        const result = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'user_sessions'
            AND column_name = 'refresh_token'
        `);

        if (result.rows.length > 0) {
            console.log('📊 Column details:');
            console.log(result.rows[0]);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
