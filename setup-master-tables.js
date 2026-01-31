// Run master tables SQL setup
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'rtwe_erp',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
});

async function runSQL() {
    const client = await pool.connect();
    try {
        console.log('📦 Creating master tables...\n');

        const sqlPath = path.join(__dirname, 'Schema', 'master_tables.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await client.query(sql);

        console.log('✅ Master tables created successfully!\n');

        // Verify all tables
        const tables = [
            { name: 'agents', label: 'Agents' },
            { name: 'consignees', label: 'Consignees' },
            { name: 'godown_locations', label: 'Godown Locations' },
            { name: 'insurance_companies', label: 'Insurance Companies' },
            { name: 'domestic_buyers', label: 'Domestic Buyers' },
            { name: 'buyer_consignees', label: 'Buyer Consignees' },
            { name: 'buyer_representatives', label: 'Buyer Representatives' },
            { name: 'payment_terms', label: 'Payment Terms' }
        ];

        for (const table of tables) {
            const result = await client.query(`SELECT COUNT(*) FROM ${table.name}`);
            console.log(`📊 ${table.label}: ${result.rows[0].count} records`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

runSQL();
