const ZKTeco = require('zkteco-js');

async function testDeviceSync() {
    const device = new ZKTeco('192.168.1.21', 4370, 10000);

    try {
        console.log('Connecting to device...');
        await device.createSocket();
        console.log('✓ Connected!');

        console.log('\nFetching attendance records...');
        const attendances = await device.getAttendances();

        console.log(`\n✓ Found ${attendances?.data?.length || 0} total attendance records on device\n`);

        if (attendances?.data) {
            // Show recent records
            const recent = attendances.data.slice(-10);
            console.log('Last 10 records:');
            recent.forEach((att, i) => {
                const time = new Date(att.record_time);
                console.log(`${i + 1}. User ID: ${att.user_id} | Time: ${time.toLocaleString('en-IN')} | State: ${att.state || 'N/A'}`);
            });
        }

        await device.disconnect();
        console.log('\n✓ Disconnected from device');
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testDeviceSync();
