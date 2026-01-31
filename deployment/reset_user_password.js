const bcrypt = require('bcryptjs');
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'rtwe_erp',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

async function reset() {
    try {
        await client.connect();
        console.log("Connected to DB...");

        // Hash the password 'Shekhar@2506'
        const newPassword = 'Shekhar@2506';
        const hash = await bcrypt.hash(newPassword, 10);

        // Update the user
        const res = await client.query(
            "UPDATE users SET password_hash = $1 WHERE custom_user_id = 'Shekhar_admin'",
            [hash]
        );

        if (res.rowCount === 0) {
            console.log("❌ User 'Shekhar_admin' not found!");
        } else {
            console.log("✅ Password successfully reset for 'Shekhar_admin'.");
            console.log(`   New Password: ${newPassword}`);
        }
    } catch (e) {
        console.error("❌ Error:", e);
    } finally {
        await client.end();
    }
}

reset();
