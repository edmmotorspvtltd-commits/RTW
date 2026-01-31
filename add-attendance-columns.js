const { pool } = require('./backend/config/database');

async function addStatusColumn() {
    try {
        console.log('Adding status column to attendance_logs...');

        await pool.query(`
            ALTER TABLE attendance_logs 
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'valid' 
            CHECK (status IN ('valid', 'deleted', 'edited'));
        `);

        console.log('✅ Status column added successfully');

        // Add remarks column for manual edits
        await pool.query(`
            ALTER TABLE attendance_logs 
            ADD COLUMN IF NOT EXISTS remarks TEXT;
        `);

        console.log('✅ Remarks column added successfully');

        // Add edited_by and edited_at columns
        await pool.query(`
            ALTER TABLE attendance_logs 
            ADD COLUMN IF NOT EXISTS edited_by INTEGER REFERENCES employees(employee_id),
            ADD COLUMN IF NOT EXISTS edited_at TIMESTAMP;
        `);

        console.log('✅ Audit columns added successfully');

        await pool.end();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

addStatusColumn();
