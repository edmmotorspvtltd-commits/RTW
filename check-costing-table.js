// Check costing_sheets table structure
const { pool } = require('./backend/config/database');

async function checkTable() {
    try {
        // Check table structure
        const result = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'costing_sheets'
            ORDER BY ordinal_position
        `);

        console.log('\n=== COSTING_SHEETS TABLE STRUCTURE ===');
        result.rows.forEach(row => {
            console.log(`${row.column_name}: ${row.data_type}`);
        });

        // Check if there are any records
        const countResult = await pool.query('SELECT COUNT(*) FROM costing_sheets');
        console.log(`\nTotal records: ${countResult.rows[0].count}`);

        // Show sample record if exists
        const sampleResult = await pool.query('SELECT * FROM costing_sheets LIMIT 1');
        if (sampleResult.rows.length > 0) {
            console.log('\n=== SAMPLE RECORD ===');
            console.log(JSON.stringify(sampleResult.rows[0], null, 2));
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkTable();
