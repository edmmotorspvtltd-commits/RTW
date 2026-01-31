const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function verifyAndSetupSalaryTables() {
    try {
        console.log('🔍 Verifying Salary Management Tables...\n');

        // Check if tables exist
        const tables = [
            'salary_structure',
            'monthly_salary_register',
            'advance_salary',
            'advance_recovery_schedule',
            'employee_bank_details',
            'employee_documents'
        ];

        for (const table of tables) {
            const result = await pool.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = $1
                )
            `, [table]);

            if (result.rows[0].exists) {
                console.log(`✅ ${table} - EXISTS`);

                // Get row count
                const countResult = await pool.query(`SELECT COUNT(*) FROM ${table}`);
                console.log(`   Records: ${countResult.rows[0].count}`);
            } else {
                console.log(`❌ ${table} - MISSING (needs schema creation)`);
            }
        }

        console.log('\n📊 Checking daily_attendance table for payroll...\n');

        // Check daily_attendance
        const dailyAttResult = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'daily_attendance'
            )
        `);

        if (dailyAttResult.rows[0].exists) {
            console.log('✅ daily_attendance table exists');

            // Check if it has data
            const countResult = await pool.query('SELECT COUNT(*) FROM daily_attendance');
            console.log(`   Total records: ${countResult.rows[0].count}`);

            // Check this month's data
            const thisMonthResult = await pool.query(`
                SELECT COUNT(*) as count,
                       COUNT(*) FILTER (WHERE status = 'present') as present,
                       COUNT(*) FILTER (WHERE status = 'absent') as absent
                FROM daily_attendance
                WHERE DATE_TRUNC('month', attendance_date) = DATE_TRUNC('month', CURRENT_DATE)
            `);

            console.log(`   This month: ${thisMonthResult.rows[0].count} records`);
            console.log(`   - Present: ${thisMonthResult.rows[0].present}`);
            console.log(`   - Absent: ${thisMonthResult.rows[0].absent}`);

            if (thisMonthResult.rows[0].count === 0) {
                console.log('\n⚠️  WARNING: No daily_attendance records for current month!');
                console.log('   Run: SELECT process_daily_attendance(CURRENT_DATE);');
            }
        } else {
            console.log('❌ daily_attendance table MISSING');
        }

        console.log('\n🔧 Checking process_daily_attendance function...\n');

        const funcResult = await pool.query(`
            SELECT EXISTS (
                SELECT FROM pg_proc 
                WHERE proname = 'process_daily_attendance'
            )
        `);

        if (funcResult.rows[0].exists) {
            console.log('✅ process_daily_attendance function exists');
            console.log('\n📝 To populate daily_attendance, run:');
            console.log('   SELECT process_daily_attendance(\'2026-01-10\');');
        } else {
            console.log('❌ process_daily_attendance function MISSING');
        }

        console.log('\n==============================================');
        console.log('✅ Verification Complete!');
        console.log('==============================================\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    } finally {
        await pool.end();
    }
}

verifyAndSetupSalaryTables();
