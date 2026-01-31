// Script to connect all units to EDM Motors company
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'rtwe_erp',
    password: process.env.DB_PASSWORD || 'admin',
    port: process.env.DB_PORT || 5432,
});

async function connectUnitsToEDMMotors() {
    try {
        // Find EDM Motors company
        const companyResult = await pool.query(`
            SELECT id, company_name, company_code 
            FROM companies 
            WHERE company_name ILIKE '%edm%motors%' 
            AND deleted_at IS NULL
            LIMIT 1
        `);

        if (companyResult.rows.length === 0) {
            console.log('❌ EDM Motors company not found in database');
            console.log('\nAvailable companies:');
            const allCompanies = await pool.query(`
                SELECT id, company_name, company_code 
                FROM companies 
                WHERE deleted_at IS NULL 
                ORDER BY id
            `);
            allCompanies.rows.forEach(c => {
                console.log(`  - ID: ${c.id}, Name: ${c.company_name}, Code: ${c.company_code}`);
            });
            return;
        }

        const edmMotors = companyResult.rows[0];
        console.log(`✅ Found EDM Motors: ID=${edmMotors.id}, Code=${edmMotors.company_code}`);

        // Get all units that are not connected to any company or have NULL company_id
        const unitsResult = await pool.query(`
            SELECT id, unit_code, unit_name, company_id 
            FROM units 
            WHERE deleted_at IS NULL
            ORDER BY id
        `);

        console.log(`\n📋 Total units in database: ${unitsResult.rows.length}`);

        if (unitsResult.rows.length === 0) {
            console.log('No units found in database');
            return;
        }

        // Show current state
        console.log('\nCurrent units:');
        unitsResult.rows.forEach(u => {
            console.log(`  - ID: ${u.id}, Name: ${u.unit_name}, Code: ${u.unit_code}, Company ID: ${u.company_id || 'NULL'}`);
        });

        // Update all units to connect to EDM Motors
        const updateResult = await pool.query(`
            UPDATE units 
            SET company_id = $1, updated_at = CURRENT_TIMESTAMP
            WHERE deleted_at IS NULL
            RETURNING id, unit_name, unit_code
        `, [edmMotors.id]);

        console.log(`\n✅ Successfully connected ${updateResult.rows.length} units to EDM Motors!`);
        console.log('\nUpdated units:');
        updateResult.rows.forEach(u => {
            console.log(`  - ${u.unit_name} (${u.unit_code})`);
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await pool.end();
    }
}

connectUnitsToEDMMotors();
