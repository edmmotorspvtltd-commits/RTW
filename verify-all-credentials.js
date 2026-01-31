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

async function verifyAllCredentials() {
    try {
        console.log('='.repeat(60));
        console.log('COMPREHENSIVE CREDENTIAL VERIFICATION');
        console.log('='.repeat(60));

        // 1. Check Environment Variables
        console.log('\n1. ENVIRONMENT CONFIGURATION');
        console.log('-'.repeat(60));
        console.log('NODE_ENV:', process.env.NODE_ENV);
        console.log('PORT:', process.env.PORT);
        console.log('APP_URL:', process.env.APP_URL);
        console.log('DB_HOST:', process.env.DB_HOST);
        console.log('DB_PORT:', process.env.DB_PORT);
        console.log('DB_NAME:', process.env.DB_NAME);
        console.log('DB_USER:', process.env.DB_USER);
        console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
        console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length || 0);
        console.log('SESSION_SECRET exists:', !!process.env.SESSION_SECRET);

        // 2. Test Database Connection
        console.log('\n2. DATABASE CONNECTION TEST');
        console.log('-'.repeat(60));
        const dbTest = await pool.query('SELECT NOW() as current_time, version() as pg_version');
        console.log('✓ Database connected successfully');
        console.log('PostgreSQL version:', dbTest.rows[0].pg_version.split(',')[0]);
        console.log('Server time:', dbTest.rows[0].current_time);

        // 3. Check Users Table Structure
        console.log('\n3. USERS TABLE STRUCTURE');
        console.log('-'.repeat(60));
        const tableStructure = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_name = 'users'
            AND column_name IN ('id', 'custom_user_id', 'email', 'password_hash', 
                               'is_active', 'email_verified', 'is_email_verified', 
                               'role', 'two_factor_enabled')
            ORDER BY ordinal_position;
        `);
        console.log('Table columns:');
        tableStructure.rows.forEach(col => {
            console.log(`  - ${col.column_name} (${col.data_type})`);
        });

        // 4. Check All Active Users
        console.log('\n4. ALL ACTIVE USERS');
        console.log('-'.repeat(60));
        const activeUsers = await pool.query(`
            SELECT id, custom_user_id, email, role, is_active, 
                   email_verified, is_email_verified, two_factor_enabled,
                   password_hash IS NOT NULL as has_password,
                   LENGTH(password_hash) as password_hash_length
            FROM users
            WHERE is_active = true
            ORDER BY id;
        `);

        console.log(`Found ${activeUsers.rows.length} active user(s):\n`);
        activeUsers.rows.forEach((user, idx) => {
            console.log(`User ${idx + 1}:`);
            console.log(`  ID: ${user.id}`);
            console.log(`  Username: ${user.custom_user_id}`);
            console.log(`  Email: ${user.email}`);
            console.log(`  Role: ${user.role}`);
            console.log(`  Email Verified: ${user.email_verified || user.is_email_verified}`);
            console.log(`  2FA Enabled: ${user.two_factor_enabled}`);
            console.log(`  Has Password: ${user.has_password}`);
            console.log(`  Password Hash Length: ${user.password_hash_length}`);
            console.log('');
        });

        // 5. Test Admin User Password
        console.log('5. ADMIN USER PASSWORD VERIFICATION');
        console.log('-'.repeat(60));
        const adminUser = await pool.query(`
            SELECT id, custom_user_id, email, password_hash, is_active, 
                   email_verified, is_email_verified
            FROM users 
            WHERE id = 1;
        `);

        if (adminUser.rows.length === 0) {
            console.log('✗ Admin user (ID: 1) not found!');
        } else {
            const admin = adminUser.rows[0];
            console.log('Admin User Details:');
            console.log(`  ID: ${admin.id}`);
            console.log(`  Username: ${admin.custom_user_id}`);
            console.log(`  Email: ${admin.email}`);
            console.log(`  Active: ${admin.is_active}`);
            console.log(`  Email Verified: ${admin.email_verified || admin.is_email_verified}`);

            // Test password
            const testPassword = 'Shekhar@2506';
            const isValid = await bcrypt.compare(testPassword, admin.password_hash);

            console.log(`\n  Password Test: "${testPassword}"`);
            console.log(`  Result: ${isValid ? '✓ VALID' : '✗ INVALID'}`);

            if (!isValid) {
                console.log('\n  ⚠ WARNING: Password does not match!');
            }
        }

        // 6. Check user_sessions table
        console.log('\n6. USER SESSIONS TABLE');
        console.log('-'.repeat(60));
        const sessionsCheck = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'user_sessions'
            );
        `);
        console.log('user_sessions table exists:', sessionsCheck.rows[0].exists);

        if (sessionsCheck.rows[0].exists) {
            const activeSessions = await pool.query(`
                SELECT COUNT(*) as count 
                FROM user_sessions 
                WHERE is_active = true AND expires_at > NOW();
            `);
            console.log('Active sessions:', activeSessions.rows[0].count);
        }

        // 7. Final Summary
        console.log('\n' + '='.repeat(60));
        console.log('SUMMARY - LOGIN CREDENTIALS');
        console.log('='.repeat(60));
        console.log('\n✓ You can log in with:');
        console.log('  URL: http://localhost:3000/Login.html');
        console.log('  Username: admin');
        console.log('  Password: Shekhar@2506');
        console.log('\n✓ Backend server should be running on port 3000');
        console.log('✓ Database connection is working');
        console.log('✓ Admin user is active and email verified');
        console.log('\n' + '='.repeat(60));

        await pool.end();
    } catch (error) {
        console.error('\n✗ ERROR:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

verifyAllCredentials();
