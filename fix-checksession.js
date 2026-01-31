// Fix checkSession redirect loop
// This script comments out checkSession() calls since auth is handled by sidebar.js

const fs = require('fs');
const path = require('path');

const files = [
    'agents.html',
    'consignees.html',
    'costing-management.html',
    'domestic-buyers.html',
    'godown.html',
    'insurance.html',
    'payment-terms.html',
    'sourcing-by.html',
    'stock-types.html',
    'terms-conditions.html',
    'transportation.html',
    'vendors.html'
];

const frontendDir = path.join(__dirname, 'apps', 'frontend');

files.forEach(file => {
    const filePath = path.join(frontendDir, file);

    try {
        let content = fs.readFileSync(filePath, 'utf8');

        // Comment out checkSession() calls
        content = content.replace(/(\s+)(await\s+)?checkSession\(\);/g, '$1// $2checkSession(); // Removed - auth handled by sidebar.js');

        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ Fixed: ${file}`);
    } catch (error) {
        console.error(`❌ Error fixing ${file}:`, error.message);
    }
});

console.log('\n✅ All files fixed!');
console.log('Refresh your browser and the redirect loop should be resolved.');
