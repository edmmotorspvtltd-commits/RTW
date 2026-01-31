const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function fixAdminUser() {
    try {
        console.log('Fixing admin user...\n');

        // 1. Activate the admin user
        const activateResult = await pool.query(`
            UPDATE users 
            SET is_active = true, 
                email_verified = true,
                is_email_verified = true
            WHERE id = 1
            RETURNING id, custom_user_id, email, is_active, email_verified, is_email_verified;
        `);

        console.log('✓ Admin user activated:');
        console.log(JSON.stringify(activateResult.rows[0], null, 2));

        // 2. Check if password is correct for "Shekhar@2506"
        const userResult = await pool.query('SELECT password_hash FROM users WHERE id = 1');
        const storedHash = userResult.rows[0].password_hash;

        const testPassword = 'Shekhar@2506';
        const isValid = await bcrypt.compare(testPassword, storedHash);

        console.log(`\n✓ Password "${testPassword}" is ${isValid ? 'VALID' : 'INVALID'}`);

        if (!isValid) {
            console.log('\nResetting password to "Shekhar@2506"...');
            const newHash = await bcrypt.hash(testPassword, 10);
            await pool.query('UPDATE users SET password_hash = $1 WHERE id = 1', [newHash]);
            console.log('✓ Password reset successfully');
        }

        console.log('\n=== Login Credentials ===');
        console.log('Username: admin');
        console.log('Password: Shekhar@2506');
        console.log('\nYou can now log in!');

        await pool.end();
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

fixAdminUser();
