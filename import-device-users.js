// Import Device Users to ERP Database
// Fetches users from ESSL device and adds them to employees table

const ZKTeco = require('zkteco-js');
const { pool } = require('./backend/config/database');

async function importDeviceUsers() {
    const z = new ZKTeco('192.168.1.2', 4370, 5000);
    await z.createSocket();
    console.log('Connected to device');

    const usersResult = await z.getUsers();
    const deviceUsers = usersResult.data || [];
    console.log('Found', deviceUsers.length, 'users on device\n');

    let imported = 0, skipped = 0;

    for (const u of deviceUsers) {
        // Format: device has userId like '001', we store as 'RTWDI-001'
        const rawId = u.userId.replace(/^0+/, '') || u.userId;
        const paddedId = String(rawId).padStart(3, '0');
        const erpUserId = 'RTWDI-' + paddedId;
        const name = (u.name || 'Employee_' + paddedId).trim();
        const nameParts = name.split(' ');
        const firstName = nameParts[0] || name;
        const lastName = nameParts.slice(1).join(' ') || '';

        // Generate employee code
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const namePrefix = firstName.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase().padEnd(4, 'X');

        try {
            // Check if already exists (by device user_id or ERP format)
            const existing = await pool.query(
                'SELECT employee_id FROM employees WHERE user_id = $1 OR user_id = $2',
                [u.userId, erpUserId]
            );

            if (existing.rows.length > 0) {
                console.log('Skipped (exists):', u.userId, '-', name);
                skipped++;
                continue;
            }

            // Get next sequence for employee code
            const seqResult = await pool.query(
                'SELECT COUNT(*)+1 as seq FROM employees WHERE employee_code LIKE $1',
                ['RTWEC/' + namePrefix + today + '%']
            );
            const seq = String(seqResult.rows[0].seq).padStart(3, '0');
            const employeeCode = 'RTWEC/' + namePrefix + today + seq;

            // Insert employee
            await pool.query(
                'INSERT INTO employees (user_id, employee_code, first_name, last_name, full_name, status) VALUES ($1, $2, $3, $4, $5, $6)',
                [erpUserId, employeeCode, firstName, lastName, name, 'active']
            );
            imported++;
            console.log('✓ Imported:', erpUserId, '-', name, '→', employeeCode);
        } catch (e) {
            console.log('✗ Error for', u.userId, ':', e.message);
        }
    }

    console.log('\n========================================');
    console.log('Import Complete!');
    console.log('Imported:', imported);
    console.log('Skipped (already exist):', skipped);
    console.log('========================================');

    await z.disconnect();
    await pool.end();
}

importDeviceUsers().catch(e => {
    console.error('Import failed:', e);
    process.exit(1);
});
