// Quick script to check company data
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'rtwe_erp',
    password: process.env.DB_PASSWORD || 'admin',
    port: process.env.DB_PORT || 5432,
});

async function checkCompanyData() {
    try {
        const result = await pool.query(`
            SELECT id, company_name, state, city 
            FROM companies 
            WHERE deleted_at IS NULL 
            ORDER BY id 
            LIMIT 5
        `);

        console.log('\nCompanies in database:');
        result.rows.forEach(c => {
            console.log(`ID: ${c.id}, Name: ${c.company_name}`);
            console.log(`  State: "${c.state}"`);
            console.log(`  City: "${c.city}"`);
            console.log('');
        });
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkCompanyData();
