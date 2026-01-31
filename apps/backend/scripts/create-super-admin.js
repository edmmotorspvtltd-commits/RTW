// ================================================================================
//                    CREATE SUPER ADMIN USER
//     Run this script to create the first super admin account
// ================================================================================

const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

async function createSuperAdmin() {
    console.log('🚀 Creating Super Admin User...\n');

    const superAdminData = {
        username: 'admin',
        email: 'admin@rtwe.com',
        fullName: 'System Administrator',
        phone: '+91-9876543210',
        password: 'Admin@123456',  // Default password - CHANGE AFTER FIRST LOGIN!
        role: 'super_admin'
    };

    try {
        // Check if super admin already exists
        const existingUser = await pool.query(
            'SELECT user_id, email FROM users WHERE email = $1 OR username = $2',
            [superAdminData.email, superAdminData.username]
        );

        if (existingUser.rows.length > 0) {
            console.log('⚠️  Super admin user already exists!');
            console.log('📧 Email:', existingUser.rows[0].email);
            console.log('🆔 User ID:', existingUser.rows[0].user_id);
            console.log('\n✅ You can login with existing credentials.\n');
            process.exit(0);
        }

        // Hash password
        console.log('🔐 Hashing password...');
        const passwordHash = await bcrypt.hash(superAdminData.password, 10);

        // Insert super admin
        console.log('💾 Inserting super admin into database...');
        const result = await pool.query(
            `INSERT INTO users (
                username, email, full_name, phone, password_hash,
                role, email_verified, two_factor_enabled, is_active,
                created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
            RETURNING user_id, username, email, full_name, role`,
            [
                superAdminData.username,
                superAdminData.email,
                superAdminData.fullName,
                superAdminData.phone,
                passwordHash,
                superAdminData.role,
                true,  // email_verified
                false, // two_factor_enabled
                true   // is_active
            ]
        );

        const user = result.rows[0];

        console.log('\n✅ Super Admin Created Successfully!\n');
        console.log('═══════════════════════════════════════════');
        console.log('📋 SUPER ADMIN CREDENTIALS:');
        console.log('═══════════════════════════════════════════');
        console.log(`🆔 User ID:     ${user.user_id}`);
        console.log(`👤 Username:    ${user.username}`);
        console.log(`📧 Email:       ${user.email}`);
        console.log(`🔑 Password:    ${superAdminData.password}`);
        console.log(`👑 Role:        ${user.role}`);
        console.log('═══════════════════════════════════════════\n');

        console.log('🌐 Login URL: http://localhost:3000/Login.html\n');

        console.log('⚠️  SECURITY REMINDERS:');
        console.log('   1. Change the default password immediately after first login');
        console.log('   2. Enable 2FA for enhanced security');
        console.log('   3. Keep credentials secure\n');

        process.exit(0);

    } catch (error) {
        console.error('❌ Error creating super admin:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

// Run the script
createSuperAdmin();
