// Quick script to unlock admin account
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function unlockAdmin() {
    try {
        console.log('Connecting to database...');
        
        // Unlock admin account
        const result = await pool.query(`
            UPDATE users 
            SET failed_login_attempts = 0, 
                account_locked_until = NULL, 
                last_failed_login = NULL
            WHERE custom_user_id = 'admin'
            RETURNING id, user_name, custom_user_id, email, failed_login_attempts, account_locked_until
        `);
        
        if (result.rows.length > 0) {
            console.log('\n✅ Admin account unlocked successfully!');
            console.log('User:', result.rows[0]);
        } else {
            console.log('⚠️ Admin user not found');
        }
        
        // Also show all users
        const allUsers = await pool.query('SELECT id, user_name, email, custom_user_id, role, is_active, failed_login_attempts FROM users');
        console.log('\nAll users in database:');
        console.table(allUsers.rows);
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

unlockAdmin();
