// Fix admin password script
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

async function fixAdminPassword() {
    try {
        console.log('Connecting to database...');

        // Generate proper bcrypt hash for "admin123"
        const plainPassword = 'admin123';
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(plainPassword, saltRounds);

        console.log('\n📝 Generated new password hash for "admin123"');
        console.log('Hash:', passwordHash);

        // Update admin account with correct password hash and unlock
        const result = await pool.query(`
            UPDATE users 
            SET password_hash = $1,
                failed_login_attempts = 0, 
                account_locked_until = NULL, 
                last_failed_login = NULL
            WHERE custom_user_id = 'admin'
            RETURNING id, user_name, custom_user_id, email, role
        `, [passwordHash]);

        if (result.rows.length > 0) {
            console.log('\n✅ Admin password updated and account unlocked!');
            console.log('User:', result.rows[0]);
            console.log('\n🔑 Login credentials:');
            console.log('   Username: admin');
            console.log('   Password: admin123');
        } else {
            console.log('⚠️ Admin user not found');
        }

        // Verify the hash works
        const verifyResult = await pool.query(
            'SELECT password_hash FROM users WHERE custom_user_id = $1',
            ['admin']
        );

        if (verifyResult.rows.length > 0) {
            const storedHash = verifyResult.rows[0].password_hash;
            const isMatch = await bcrypt.compare(plainPassword, storedHash);
            console.log('\n🔍 Password verification test:', isMatch ? '✅ PASSED' : '❌ FAILED');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

fixAdminPassword();
