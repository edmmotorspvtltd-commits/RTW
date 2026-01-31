const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function checkUser() {
    try {
        console.log('Checking database connection...');
        console.log('DB Config:', {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: process.env.DB_NAME,
            user: process.env.DB_USER
        });

        // Check if users table exists
        const tableCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        `);
        console.log('\nUsers table exists:', tableCheck.rows[0].exists);

        if (!tableCheck.rows[0].exists) {
            console.log('ERROR: Users table does not exist!');
            process.exit(1);
        }

        // Get all users
        const usersResult = await pool.query(`
            SELECT id, custom_user_id, email, full_name, role, is_active, 
                   email_verified, is_email_verified, password_hash IS NOT NULL as has_password
            FROM users 
            ORDER BY id
            LIMIT 5;
        `);

        console.log('\n=== Users in Database ===');
        console.log(JSON.stringify(usersResult.rows, null, 2));

        // Try to find Shekhar user
        const shekharResult = await pool.query(`
            SELECT id, custom_user_id, email, full_name, role, is_active, 
                   email_verified, is_email_verified, password_hash IS NOT NULL as has_password
            FROM users 
            WHERE custom_user_id ILIKE '%shekhar%' OR email ILIKE '%shekhar%'
            LIMIT 3;
        `);

        console.log('\n=== Shekhar User(s) ===');
        console.log(JSON.stringify(shekharResult.rows, null, 2));

        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

checkUser();
