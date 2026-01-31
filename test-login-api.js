const fetch = require('node-fetch');

async function testLogin() {
    try {
        console.log('Testing login API...\n');

        const response = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'admin',
                password: 'Shekhar@2506'
            })
        });

        const result = await response.json();

        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(result, null, 2));

        if (result.success) {
            console.log('\n✓ LOGIN SUCCESSFUL!');
            console.log('Token received:', result.token ? 'Yes' : 'No');
            console.log('User role:', result.user?.role);
        } else {
            console.log('\n✗ LOGIN FAILED');
            console.log('Error:', result.error);
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

testLogin();
