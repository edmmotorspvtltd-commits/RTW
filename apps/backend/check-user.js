// Quick script to verify user email and check login credentials
// Run this with: node check-user.js

const { pool } = require('./config/database');

async function checkUser() {
    try {
        console.log('🔍 Checking user: Ansuya M\n');
        console.log('Connecting to database...');

        // Search for user by name or email
        const result = await pool.query(`
            SELECT 
                id, 
                custom_user_id, 
                email, 
                full_name, 
                user_name,
                is_active, 
                is_email_verified, 
                email_verified,
                role,
                company_id,
                unit_id
            FROM users 
            WHERE 
                full_name ILIKE '%Ansuya%' OR 
                user_name ILIKE '%Ansuya%' OR
                custom_user_id ILIKE '%Ansuya%' OR
                email ILIKE '%ansuya%'
        `);

        if (result.rows.length === 0) {
            console.log('❌ No user found matching "Ansuya"');
            console.log('\n📋 All users in database:');

            const allUsers = await pool.query(`
                SELECT id, custom_user_id, email, full_name, is_active, is_email_verified
                FROM users
                ORDER BY id
            `);

            console.table(allUsers.rows);
        } else {
            console.log('✅ Found user(s):\n');
            result.rows.forEach(user => {
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log(`ID: ${user.id}`);
                console.log(`Custom User ID (Username): ${user.custom_user_id}`);
                console.log(`Email: ${user.email}`);
                console.log(`Full Name: ${user.full_name}`);
                console.log(`User Name: ${user.user_name}`);
                console.log(`Active: ${user.is_active}`);
                console.log(`Email Verified: ${user.is_email_verified || user.email_verified}`);
                console.log(`Role: ${user.role}`);
                console.log(`Company ID: ${user.company_id}`);
                console.log(`Unit ID: ${user.unit_id}`);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
            });

            // Check if email needs to be verified
            const needsVerification = result.rows.filter(u => !u.is_email_verified && !u.email_verified);

            if (needsVerification.length > 0) {
                console.log('⚠️  Email not verified! Fixing...\n');

                for (const user of needsVerification) {
                    await pool.query(`
                        UPDATE users 
                        SET is_email_verified = true, email_verified = true
                        WHERE id = $1
                    `, [user.id]);

                    console.log(`✅ Email verified for: ${user.custom_user_id}`);
                }
            }

            console.log('\n📝 LOGIN INSTRUCTIONS:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`Username: ${result.rows[0].custom_user_id}`);
            console.log(`Email: ${result.rows[0].email}`);
            console.log('Password: (The password you set when creating the user)');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        }

        await pool.end();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkUser();
