const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'rtwe_erp',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
});

async function checkColumns() {
    try {
        console.log('Connecting to database:', process.env.DB_NAME);

        const result = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'domestic_buyers' 
            ORDER BY ordinal_position
        `);

        console.log('\nColumns in domestic_buyers table:');
        result.rows.forEach(row => console.log('  - ' + row.column_name));

        // Check if address column exists
        const hasAddress = result.rows.some(r => r.column_name === 'address');
        const hasAddressLine1 = result.rows.some(r => r.column_name === 'address_line1');

        console.log('\n--- Analysis ---');
        console.log('Has "address" column:', hasAddress);
        console.log('Has "address_line1" column:', hasAddressLine1);

        if (hasAddress && !hasAddressLine1) {
            console.log('\n❌ ERROR: Database has OLD schema (with address column)');
            console.log('   You need to run: node setup-master-tables.js');
        } else if (hasAddressLine1) {
            console.log('\n✅ Database has NEW schema (with address_line1/2/3)');
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkColumns();
