const fs = require('fs');
const path = require('path');

const files = {
    vendorList: 'c:\\rtwe-erp\\exisitng\\Master\\Vendor list.txt',
    vendorGroupList: 'c:\\rtwe-erp\\exisitng\\Master\\Vensdor group list.txt',
    yarnAdjustEntry: 'c:\\rtwe-erp\\exisitng\\Master\\Yarn adjustentry list.txt'
};

function extractOptions(html, selectId) {
    const regex = new RegExp(`<select[^>]*id=["']${selectId}["'][^>]*>([\\s\\S]*?)<\/select>`, 'i');
    const match = html.match(regex);
    if (!match) return [];

    const optionsHtml = match[1];
    const options = [];
    const optionRegex = /<option value=["']([^"']+)["'][^>]*>([^<]+)<\/option>/g;
    let optionMatch;

    while ((optionMatch = optionRegex.exec(optionsHtml)) !== null) {
        if (optionMatch[1].trim() !== "") {
            options.push({
                id: optionMatch[1].trim(),
                name: optionMatch[2].trim().replace(/&amp;/g, '&')
            });
        }
    }
    return options;
}

function extractTableRows(html) {
    // Extract rows from the main table (assuming class "colorTblCss")
    const tableRegex = /<table class=["']colorTblCss["'][^>]*>([\s\S]*?)<\/table>/i;
    const match = html.match(tableRegex);
    if (!match) return [];

    const rowsHtml = match[1];
    const rows = [];
    const rowRegex = /<tr>([\s\S]*?)<\/tr>/g;
    let rowMatch;

    while ((rowMatch = rowRegex.exec(rowsHtml)) !== null) {
        const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
        const cells = [];
        let cellMatch;
        while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
            // clean up cell content (remove links, images, whitespace)
            let content = cellMatch[1].replace(/<[^>]+>/g, '').trim().replace(/\s+/g, ' ');
            cells.push(content);
        }
        if (cells.length > 0) {
            rows.push(cells);
        }
    }
    return rows;
}

function generateSQL() {
    let sql = "";

    // 1. Vendor Groups
    const vendorListContent = fs.readFileSync(files.vendorList, 'utf8');
    const vendorGroups = extractOptions(vendorListContent, 'vendorGroupId');

    // Create a map for name -> legacy_id lookup
    const vendorGroupMap = new Map();
    vendorGroups.forEach(g => {
        vendorGroupMap.set(g.name.toUpperCase(), g.id); // Case insensitive lookup
    });

    sql += `-- Vendor Groups\n`;
    sql += `DROP TABLE IF EXISTS vendor_groups CASCADE;\n`;
    sql += `CREATE TABLE IF NOT EXISTS vendor_groups (
    id SERIAL PRIMARY KEY,
    legacy_id INTEGER UNIQUE,
    name VARCHAR(255) NOT NULL,
    group_type_id INTEGER
);\n\n`;

    if (vendorGroups.length > 0) {
        sql += `INSERT INTO vendor_groups (legacy_id, name) VALUES \n`;
        sql += vendorGroups.map(g => `(${g.id}, '${g.name.replace(/'/g, "''")}')`).join(',\n') + ';\n\n';
    }

    // 2. Vendors
    const vendors = extractTableRows(vendorListContent);

    sql += `-- Vendors\n`;
    sql += `DROP TABLE IF EXISTS vendors CASCADE;\n`;
    sql += `CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50),
    name VARCHAR(255),
    vendor_group_id INTEGER REFERENCES vendor_groups(legacy_id), -- Linking to legacy_id since that is what we have 
    address TEXT,
    city VARCHAR(100),
    pincode VARCHAR(20),
    state VARCHAR(100),
    gstn VARCHAR(50),
    is_active BOOLEAN
);\n\n`;

    if (vendors.length > 0) {
        const validVendors = vendors.filter(v => v.length > 5 && v[1] !== 'Vendor Code');
        if (validVendors.length > 0) {
            sql += `INSERT INTO vendors (code, name, vendor_group_id, address, city, pincode, state, gstn, is_active) VALUES \n`;
            sql += validVendors.map(v => {
                const isActive = v[9] === 'Active';
                const groupName = v[3].trim(); // Group Name from table
                let groupId = vendorGroupMap.get(groupName.toUpperCase());

                // If group ID not found but name exists, maybe we need to create it? 
                // For now, if null, we insert NULL.
                // NOTE: The HTML table often has Group Names that match the Dropdown options exactly.

                return `('${v[1]}', '${v[2].replace(/'/g, "''")}', ${groupId ? groupId : 'NULL'}, '${v[4].replace(/'/g, "''")}', '${v[5].replace(/'/g, "''")}', '${v[6]}', '${v[7].replace(/'/g, "''")}', '${v[8]}', ${isActive})`;
            }).join(',\n') + ';\n\n';
        }
    }

    // 3. Yarn Adjust Data (Mills, Items, Locations, StockTypes)
    const yarnContent = fs.readFileSync(files.yarnAdjustEntry, 'utf8');
    const mills = extractOptions(yarnContent, 'millId');
    const items = extractOptions(yarnContent, 'itemId');
    const locations = extractOptions(yarnContent, 'godownlocationId');
    const stockTypes = extractOptions(yarnContent, 'stockTypeId');

    // Mills
    sql += `-- Mills\n`;
    sql += `DROP TABLE IF EXISTS mills CASCADE;\n`;
    sql += `CREATE TABLE IF NOT EXISTS mills (
    id SERIAL PRIMARY KEY,
    legacy_id INTEGER UNIQUE,
    name VARCHAR(255)
);\n\n`;
    if (mills.length > 0) {
        sql += `INSERT INTO mills (legacy_id, name) VALUES \n`;
        sql += mills.map(m => `(${m.id}, '${m.name.replace(/'/g, "''")}')`).join(',\n') + ';\n\n';
    }

    // Items (Yarn)
    sql += `-- Yarn Items\n`;
    sql += `DROP TABLE IF EXISTS yarn_items CASCADE;\n`;
    sql += `CREATE TABLE IF NOT EXISTS yarn_items (
    id SERIAL PRIMARY KEY,
    legacy_id INTEGER UNIQUE,
    name VARCHAR(255)
);\n\n`;
    if (items.length > 0) {
        sql += `INSERT INTO yarn_items (legacy_id, name) VALUES \n`;
        sql += items.map(m => `(${m.id}, '${m.name.replace(/'/g, "''")}')`).join(',\n') + ';\n\n';
    }

    // Locations
    sql += `-- Godown Locations\n`;
    sql += `DROP TABLE IF EXISTS godown_locations CASCADE;\n`;
    sql += `CREATE TABLE IF NOT EXISTS godown_locations (
    id SERIAL PRIMARY KEY,
    legacy_id INTEGER UNIQUE,
    name VARCHAR(255)
);\n\n`;
    if (locations.length > 0) {
        sql += `INSERT INTO godown_locations (legacy_id, name) VALUES \n`;
        sql += locations.map(m => `(${m.id}, '${m.name.replace(/'/g, "''")}')`).join(',\n') + ';\n\n';
    }

    // Stock Types
    sql += `-- Stock Types\n`;
    sql += `DROP TABLE IF EXISTS stock_types CASCADE;\n`;
    sql += `CREATE TABLE IF NOT EXISTS stock_types (
    id SERIAL PRIMARY KEY,
    legacy_id INTEGER UNIQUE,
    name VARCHAR(50)
);\n\n`;
    if (stockTypes.length > 0) {
        sql += `INSERT INTO stock_types (legacy_id, name) VALUES \n`;
        sql += stockTypes.map(m => `(${m.id}, '${m.name.replace(/'/g, "''")}')`).join(',\n') + ';\n\n';
    }

    // Yarn Adjust Entries
    // For this aggregated table, we will keep text lists but rename cols to clearly indicate they are lists.
    const adjustEntries = extractTableRows(yarnContent);

    sql += `-- Yarn Adjust Entries\n`;
    sql += `DROP TABLE IF EXISTS yarn_adjust_entries CASCADE;\n`;
    sql += `CREATE TABLE IF NOT EXISTS yarn_adjust_entries (
    id SERIAL PRIMARY KEY,
    yarn_name VARCHAR(255),
    mill_names_list TEXT, 
    location_names_list TEXT,
    stock_type_names_list TEXT,
    quantity NUMERIC(10, 2)
);\n\n`;

    if (adjustEntries.length > 0) {
        const validEntries = adjustEntries.filter(v => v.length > 4 && v[1] !== 'Yarn Name');
        if (validEntries.length > 0) {
            sql += `INSERT INTO yarn_adjust_entries (yarn_name, mill_names_list, location_names_list, stock_type_names_list, quantity) VALUES \n`;
            sql += validEntries.map(v => {
                const qty = parseFloat(v[5]);
                return `('${v[1].replace(/'/g, "''")}', '${v[2].replace(/'/g, "''")}', '${v[3].replace(/'/g, "''")}', '${v[4].replace(/'/g, "''")}', ${isNaN(qty) ? 0 : qty})`;
            }).join(',\n') + ';\n\n';
        }
    }

    // 4. Vendor Prefixes (Empty but schema needed)
    sql += `-- Vendor Prefixes\n`;
    sql += `DROP TABLE IF EXISTS vendor_prefixes CASCADE;\n`;
    sql += `CREATE TABLE IF NOT EXISTS vendor_prefixes (
    id SERIAL PRIMARY KEY,
    prefix VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);\n\n`;

    fs.writeFileSync('master_tables_v2.sql', sql, 'utf8');
    console.log('SQL file created: master_tables_v2.sql');
}

generateSQL();
