const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function fixSessionTokenHashConstraint() {
    try {
        console.log('Fixing session_token_hash NOT NULL constraint...\n');

        // Check current constraint
        const constraintCheck = await pool.query(`
            SELECT column_name, is_nullable, data_type
            FROM information_schema.columns
            WHERE table_name = 'user_sessions' 
            AND column_name = 'session_token_hash';
        `);

        console.log('Current session_token_hash column:');
        console.log(`  Nullable: ${constraintCheck.rows[0].is_nullable}`);
        console.log(`  Type: ${constraintCheck.rows[0].data_type}`);

        if (constraintCheck.rows[0].is_nullable === 'NO') {
            console.log('\n🔧 Removing NOT NULL constraint...\n');

            await pool.query(`
                ALTER TABLE user_sessions 
                ALTER COLUMN session_token_hash DROP NOT NULL;
            `);

            console.log('✅ session_token_hash is now nullable');
        } else {
            console.log('\n✅ session_token_hash is already nullable');
        }

        // Verify the change
        const verifyCheck = await pool.query(`
            SELECT column_name, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'user_sessions' 
            AND column_name = 'session_token_hash';
        `);

        console.log('\nVerification:');
        console.log(`  session_token_hash nullable: ${verifyCheck.rows[0].is_nullable}`);
        console.log('\n✅ Login should now work!');

        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

fixSessionTokenHashConstraint();
