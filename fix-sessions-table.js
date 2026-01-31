const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function fixSessionsTable() {
    try {
        console.log('Checking user_sessions table structure...\n');

        // Get current columns
        const currentColumns = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'user_sessions'
            ORDER BY ordinal_position;
        `);

        console.log('Current columns in user_sessions:');
        currentColumns.rows.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type})`);
        });

        // Check what columns are missing
        const requiredColumns = ['session_id', 'refresh_token', 'user_agent'];
        const existingColumnNames = currentColumns.rows.map(c => c.column_name);
        const missingColumns = requiredColumns.filter(col => !existingColumnNames.includes(col));

        console.log('\nRequired columns for auth.js:', requiredColumns.join(', '));
        console.log('Missing columns:', missingColumns.length > 0 ? missingColumns.join(', ') : 'None');

        if (missingColumns.length > 0) {
            console.log('\n🔧 Adding missing columns...\n');

            // Add session_id if missing
            if (missingColumns.includes('session_id')) {
                await pool.query(`
                    ALTER TABLE user_sessions 
                    ADD COLUMN IF NOT EXISTS session_id VARCHAR(255) UNIQUE;
                `);
                console.log('✓ Added session_id column');
            }

            // Add refresh_token if missing
            if (missingColumns.includes('refresh_token')) {
                await pool.query(`
                    ALTER TABLE user_sessions 
                    ADD COLUMN IF NOT EXISTS refresh_token TEXT;
                `);
                console.log('✓ Added refresh_token column');
            }

            // Add user_agent if missing
            if (missingColumns.includes('user_agent')) {
                await pool.query(`
                    ALTER TABLE user_sessions 
                    ADD COLUMN IF NOT EXISTS user_agent TEXT;
                `);
                console.log('✓ Added user_agent column');
            }

            console.log('\n✅ All required columns added successfully!');
        } else {
            console.log('\n✅ All required columns already exist!');
        }

        // Verify final structure
        const finalColumns = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'user_sessions'
            ORDER BY ordinal_position;
        `);

        console.log('\nFinal user_sessions table structure:');
        finalColumns.rows.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type})`);
        });

        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

fixSessionsTable();
