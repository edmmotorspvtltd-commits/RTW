// ================================================================================
// COMPANY ROUTES - RTWE ERP
// ================================================================================

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
        return next();
    }
    res.status(401).json({ success: false, message: 'Unauthorized' });
};

// GET: Fetch all companies
router.get('/', isAuthenticated, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, company_code, company_name, company_type, owner_name,
                   owner_email, owner_phone, city, state, gst_number, pan_number,
                   status, created_at
            FROM companies
            WHERE deleted_at IS NULL
            ORDER BY created_at DESC
        `);

        res.json({ success: true, companies: result.rows });
    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ================================================================================
// EXCEL IMPORT/EXPORT ENDPOINTS (Must be before /:id route)
// ================================================================================

const XLSX = require('xlsx');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// GET: Download Excel template
router.get('/template', isAuthenticated, (req, res) => {
    try {
        // Create template data
        const templateData = [
            {
                'Company Name': 'Example Company Ltd',
                'Company Code': 'COMP-001',
                'Company Type': 'Private Limited',
                'Owner Name': 'John Doe',
                'Owner Email': 'john@example.com',
                'Owner Phone': '9876543210',
                'Alternate Phone': '9876543211',
                'Address Line 1': '123 Business Street',
                'Address Line 2': 'Suite 456',
                'City': 'Mumbai',
                'State': 'Maharashtra',
                'Pincode': '400001',
                'GST Number': '27AABCU9603R1ZM',
                'PAN Number': 'AABCU9603R',
                'TAN Number': 'MUMA12345A',
                'CIN Number': 'U12345MH2020PTC123456',
                'Registration Date': '2020-01-15',
                'Status': 'active',
                'Notes': 'Optional notes',
                // Units section (separate by semicolon for multiple units)
                'Unit Names': 'Head Office;Mumbai Branch;Delhi Branch',
                'Unit Types': 'Head Office;Branch;Branch',
                'Unit Locations': 'Mumbai, Maharashtra;Mumbai, Maharashtra;Delhi, Delhi',
                'Unit Manager Names': 'Rajesh Kumar;Amit Shah;Priya Singh',
                'Unit Manager Emails': 'rajesh@example.com;amit@example.com;priya@example.com',
                'Unit Manager Phones': '9876543210;9876543211;9876543212',
                'Unit Capacities': '100;50;75'
            }
        ];

        // Create workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(templateData);

        // Set column widths
        ws['!cols'] = [
            { wch: 25 }, { wch: 15 }, { wch: 20 }, { wch: 20 },
            { wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 30 },
            { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 10 },
            { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 25 },
            { wch: 15 }, { wch: 10 }, { wch: 30 },
            // Units columns
            { wch: 40 }, { wch: 30 }, { wch: 40 }, { wch: 30 },
            { wch: 35 }, { wch: 30 }, { wch: 20 }
        ];

        XLSX.utils.book_append_sheet(wb, ws, 'Companies');

        // Generate buffer
        const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

        // Send file
        res.setHeader('Content-Disposition', 'attachment; filename=company_import_template.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);
    } catch (error) {
        console.error('Error generating template:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST: Import companies from Excel
router.post('/import', isAuthenticated, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        // Read Excel file
        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet);

        if (data.length === 0) {
            return res.status(400).json({ success: false, message: 'No data found in Excel file' });
        }

        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        // Process each row
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            try {
                // Auto-generate company code if not provided
                let companyCode = row['Company Code'];
                if (!companyCode) {
                    const countResult = await pool.query('SELECT COUNT(*) as count FROM companies WHERE deleted_at IS NULL');
                    const companyCount = parseInt(countResult.rows[0].count) + 1;
                    companyCode = `COMP-${String(companyCount).padStart(3, '0')}`;
                }

                // Insert company
                await pool.query(`
                    INSERT INTO companies (
                        company_code, company_name, company_type, owner_name, owner_email, owner_phone,
                        alternate_phone, address_line1, address_line2, city, state, pincode,
                        gst_number, pan_number, tan_number, cin_number, registration_date, status, notes,
                        created_by
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
                `, [
                    companyCode,
                    row['Company Name'],
                    row['Company Type'] || 'Private Limited',
                    row['Owner Name'],
                    row['Owner Email'],
                    row['Owner Phone'],
                    row['Alternate Phone'] || null,
                    row['Address Line 1'] || null,
                    row['Address Line 2'] || null,
                    row['City'] || null,
                    row['State'] || null,
                    row['Pincode'] || null,
                    row['GST Number'] || null,
                    row['PAN Number'] || null,
                    row['TAN Number'] || null,
                    row['CIN Number'] || null,
                    row['Registration Date'] || null,
                    row['Status'] || 'active',
                    row['Notes'] || null,
                    req.session.userId
                ]);

                const companyResult = await pool.query('SELECT id FROM companies WHERE company_code = $1', [companyCode]);
                const companyId = companyResult.rows[0].id;

                // Process units if provided
                if (row['Unit Names']) {
                    const unitNames = row['Unit Names'].split(';').map(s => s.trim());
                    const unitTypes = (row['Unit Types'] || '').split(';').map(s => s.trim());
                    const unitLocations = (row['Unit Locations'] || '').split(';').map(s => s.trim());
                    const unitManagerNames = (row['Unit Manager Names'] || '').split(';').map(s => s.trim());
                    const unitManagerEmails = (row['Unit Manager Emails'] || '').split(';').map(s => s.trim());
                    const unitManagerPhones = (row['Unit Manager Phones'] || '').split(';').map(s => s.trim());
                    const unitCapacities = (row['Unit Capacities'] || '').split(';').map(s => s.trim());

                    for (let u = 0; u < unitNames.length; u++) {
                        if (unitNames[u]) {
                            const unitCode = `${companyCode}-U${String(u + 1).padStart(2, '0')}`;

                            await pool.query(`
                                INSERT INTO units (
                                    company_id, unit_code, unit_name, unit_type, location,
                                    manager_name, manager_email, manager_phone, capacity, is_active
                                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                            `, [
                                companyId,
                                unitCode,
                                unitNames[u],
                                unitTypes[u] || 'Branch',
                                unitLocations[u] || null,
                                unitManagerNames[u] || null,
                                unitManagerEmails[u] || null,
                                unitManagerPhones[u] || null,
                                unitCapacities[u] || null,
                                true
                            ]);
                        }
                    }
                }

                successCount++;
            } catch (error) {
                errorCount++;
                errors.push({ row: i + 2, error: error.message });
                console.error(`Error importing row ${i + 2}:`, error);
            }
        }

        res.json({
            success: true,
            count: successCount,
            errors: errorCount,
            errorDetails: errors.length > 0 ? errors : undefined,
            message: `Successfully imported ${successCount} companies${errorCount > 0 ? `, ${errorCount} failed` : ''}`
        });
    } catch (error) {
        console.error('Error importing companies:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ================================================================================
// COMPANY CRUD ENDPOINTS
// ================================================================================


// GET: Fetch company by ID
router.get('/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT * FROM companies WHERE id = $1 AND deleted_at IS NULL
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        res.json({ success: true, company: result.rows[0] });
    } catch (error) {
        console.error('Error fetching company:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST: Create new company
router.post('/create', isAuthenticated, async (req, res) => {
    try {
        const {
            companyName, companyCode, companyType, ownerName, ownerEmail, ownerPhone,
            alternatePhone, addressLine1, addressLine2, city, state, pincode,
            gstNumber, panNumber, tanNumber, cinNumber, registrationDate, status, notes
        } = req.body;

        // Auto-generate company code if not provided or if it already exists
        let finalCompanyCode = companyCode;

        // Get the next available company code
        const countResult = await pool.query('SELECT COUNT(*) as count FROM companies WHERE deleted_at IS NULL');
        const companyCount = parseInt(countResult.rows[0].count) + 1;
        finalCompanyCode = `COMP-${String(companyCount).padStart(3, '0')}`;

        // Check if code already exists, if so increment
        let codeExists = true;
        let attempt = companyCount;
        while (codeExists) {
            const checkResult = await pool.query(
                'SELECT id FROM companies WHERE company_code = $1',
                [finalCompanyCode]
            );
            if (checkResult.rows.length === 0) {
                codeExists = false;
            } else {
                attempt++;
                finalCompanyCode = `COMP-${String(attempt).padStart(3, '0')}`;
            }
        }

        const result = await pool.query(`
            INSERT INTO companies (
                company_code, company_name, company_type, owner_name, owner_email, owner_phone,
                alternate_phone, address_line1, address_line2, city, state, pincode,
                gst_number, pan_number, tan_number, cin_number, registration_date, status, notes,
                created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
            RETURNING *
        `, [
            finalCompanyCode, companyName, companyType, ownerName, ownerEmail, ownerPhone,
            alternatePhone, addressLine1, addressLine2, city, state, pincode,
            gstNumber, panNumber, tanNumber, cinNumber, registrationDate, status, notes,
            req.session.userId
        ]);

        const createdCompany = result.rows[0];

        // Create units if provided
        const { units } = req.body;
        if (units && Array.isArray(units) && units.length > 0) {
            for (let i = 0; i < units.length; i++) {
                const unit = units[i];
                const unitCode = `${finalCompanyCode}-U${String(i + 1).padStart(2, '0')}`;

                await pool.query(`
                    INSERT INTO units (
                        company_id, unit_code, unit_name, unit_type, location,
                        address_line1, manager_name, manager_email, manager_phone,
                        production_capacity, status, is_active, created_by
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                `, [
                    createdCompany.id,
                    unitCode,
                    unit.unitName,
                    unit.unitType,
                    unit.location,
                    unit.address,
                    unit.managerName,
                    unit.managerEmail,
                    unit.managerPhone,
                    unit.productionCapacity,
                    'active',
                    true,
                    req.session.userId
                ]);
            }
        }

        res.json({ success: true, message: 'Company created successfully', company: createdCompany });
    } catch (error) {
        console.error('Error creating company:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT: Update company
router.put('/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;

        // Map camelCase field names to snake_case database columns
        const fieldMapping = {
            companyName: 'company_name',
            companyCode: 'company_code',
            companyType: 'company_type',
            ownerName: 'owner_name',
            ownerEmail: 'owner_email',
            ownerPhone: 'owner_phone',
            alternatePhone: 'alternate_phone',
            addressLine1: 'address_line1',
            addressLine2: 'address_line2',
            gstNumber: 'gst_number',
            panNumber: 'pan_number',
            tanNumber: 'tan_number',
            cinNumber: 'cin_number',
            registrationDate: 'registration_date'
        };

        // Convert camelCase to snake_case
        const updateFields = {};
        Object.keys(req.body).forEach(key => {
            // Skip units array - it's handled separately
            if (key === 'units') return;

            const dbColumn = fieldMapping[key] || key;
            updateFields[dbColumn] = req.body[key];
        });

        updateFields.updated_by = req.session.userId;

        const setClause = Object.keys(updateFields)
            .map((key, index) => `${key} = $${index + 2}`)
            .join(', ');

        const values = [id, ...Object.values(updateFields)];

        const result = await pool.query(`
            UPDATE companies SET ${setClause} WHERE id = $1 AND deleted_at IS NULL RETURNING *
        `, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        res.json({ success: true, message: 'Company updated successfully', company: result.rows[0] });
    } catch (error) {
        console.error('Error updating company:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE: Soft delete company
router.delete('/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            UPDATE companies SET deleted_at = CURRENT_TIMESTAMP, updated_by = $2
            WHERE id = $1 AND deleted_at IS NULL RETURNING id
        `, [id, req.session.userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        res.json({ success: true, message: 'Company deleted successfully' });
    } catch (error) {
        console.error('Error deleting company:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PATCH: Toggle company status
router.patch('/:id/status', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!['active', 'inactive', 'suspended'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const result = await pool.query(`
            UPDATE companies SET status = $2, updated_by = $3, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND deleted_at IS NULL RETURNING *
        `, [id, status, req.session.userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Company not found' });
        }

        res.json({ success: true, message: `Company marked as ${status}`, company: result.rows[0] });
    } catch (error) {
        console.error('Error updating company status:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ================================================================================
// UNITS ROUTES
// ================================================================================

// GET: Fetch all units for a company
router.get('/:companyId/units', isAuthenticated, async (req, res) => {
    try {
        const { companyId } = req.params;
        const result = await pool.query(`
            SELECT id, unit_code, unit_name, unit_type, location, city, state,
                   manager_name, manager_phone, is_active, status, created_at
            FROM units
            WHERE company_id = $1 AND deleted_at IS NULL
            ORDER BY created_at DESC
        `, [companyId]);

        res.json({ success: true, units: result.rows });
    } catch (error) {
        console.error('Error fetching units:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET: Fetch single unit
router.get('/units/:unitId', isAuthenticated, async (req, res) => {
    try {
        const { unitId } = req.params;
        const result = await pool.query(`
            SELECT u.*, c.company_name 
            FROM units u 
            LEFT JOIN companies c ON u.company_id = c.id
            WHERE u.id = $1 AND u.deleted_at IS NULL
        `, [unitId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Unit not found' });
        }

        res.json({ success: true, unit: result.rows[0] });
    } catch (error) {
        console.error('Error fetching unit:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST: Create unit for company
router.post('/:companyId/units', isAuthenticated, async (req, res) => {
    try {
        const { companyId } = req.params;
        const {
            unitCode, unitName, unitType, location,
            addressLine1, addressLine2, city, state, pincode,
            managerName, managerEmail, managerPhone,
            productionCapacity, maxEmployees, status
        } = req.body;

        const result = await pool.query(`
            INSERT INTO units (
                company_id, unit_code, unit_name, unit_type, location,
                address_line1, address_line2, city, state, pincode,
                manager_name, manager_email, manager_phone,
                production_capacity, max_employees, status, is_active, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, true, $17)
            RETURNING *
        `, [
            companyId, unitCode, unitName, unitType, location,
            addressLine1, addressLine2, city, state, pincode,
            managerName, managerEmail, managerPhone,
            productionCapacity, maxEmployees, status || 'active',
            req.session.userId
        ]);

        res.json({ success: true, message: 'Unit created successfully', unit: result.rows[0] });
    } catch (error) {
        console.error('Error creating unit:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT: Update unit
router.put('/units/:unitId', isAuthenticated, async (req, res) => {
    try {
        const { unitId } = req.params;
        const {
            unitName, unitType, location,
            addressLine1, addressLine2, city, state, pincode,
            managerName, managerEmail, managerPhone,
            productionCapacity, maxEmployees, status
        } = req.body;

        const result = await pool.query(`
            UPDATE units SET
                unit_name = $2, unit_type = $3, location = $4,
                address_line1 = $5, address_line2 = $6, city = $7, state = $8, pincode = $9,
                manager_name = $10, manager_email = $11, manager_phone = $12,
                production_capacity = $13, max_employees = $14, status = $15,
                updated_by = $16, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1 AND deleted_at IS NULL
            RETURNING *
        `, [
            unitId, unitName, unitType, location,
            addressLine1, addressLine2, city, state, pincode,
            managerName, managerEmail, managerPhone,
            productionCapacity, maxEmployees, status,
            req.session.userId
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Unit not found' });
        }

        res.json({ success: true, message: 'Unit updated successfully', unit: result.rows[0] });
    } catch (error) {
        console.error('Error updating unit:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PATCH: Toggle unit status
router.patch('/units/:unitId/status', isAuthenticated, async (req, res) => {
    try {
        const { unitId } = req.params;
        const { status, isActive } = req.body;

        let query, params;
        if (status !== undefined) {
            query = `UPDATE units SET status = $2, updated_by = $3, updated_at = CURRENT_TIMESTAMP
                     WHERE id = $1 AND deleted_at IS NULL RETURNING *`;
            params = [unitId, status, req.session.userId];
        } else if (isActive !== undefined) {
            query = `UPDATE units SET is_active = $2, updated_by = $3, updated_at = CURRENT_TIMESTAMP
                     WHERE id = $1 AND deleted_at IS NULL RETURNING *`;
            params = [unitId, isActive, req.session.userId];
        } else {
            return res.status(400).json({ success: false, message: 'Provide status or isActive' });
        }

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Unit not found' });
        }

        res.json({ success: true, message: 'Unit status updated', unit: result.rows[0] });
    } catch (error) {
        console.error('Error updating unit status:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE: Soft delete unit
router.delete('/units/:unitId', isAuthenticated, async (req, res) => {
    try {
        const { unitId } = req.params;

        const result = await pool.query(`
            UPDATE units SET deleted_at = CURRENT_TIMESTAMP, updated_by = $2
            WHERE id = $1 AND deleted_at IS NULL RETURNING id
        `, [unitId, req.session.userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Unit not found' });
        }

        res.json({ success: true, message: 'Unit deleted successfully' });
    } catch (error) {
        console.error('Error deleting unit:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});



// GET: Fetch single unit by ID
router.get('/units/:id', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT id, company_id, unit_code, unit_name, unit_type, location,
                   manager_name, manager_email, manager_phone, capacity, is_active
            FROM units
            WHERE id = module.exports = router; AND deleted_at IS NULL
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Unit not found' });
        }

        res.json({ success: true, unit: result.rows[0] });
    } catch (error) {
        console.error('Error fetching unit:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT: Update unit
router.put('/:companyId/units/:id', isAuthenticated, async (req, res) => {
    try {
        const { companyId, id } = req.params;
        const { unit_code, unit_name, unit_type, location, manager_name, manager_email, manager_phone, is_active } = req.body;

        const result = await pool.query(`
            UPDATE units
            SET unit_code = module.exports = router;, unit_name = $2, unit_type = $3, location = $4,
                manager_name = $5, manager_email = $6, manager_phone = $7,
                is_active = $8, updated_by = $9, updated_at = CURRENT_TIMESTAMP
            WHERE id = $10 AND company_id = $11 AND deleted_at IS NULL
            RETURNING id
        `, [unit_code, unit_name, unit_type, location, manager_name, manager_email, manager_phone, is_active, req.session.userId, id, companyId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Unit not found' });
        }

        res.json({ success: true, message: 'Unit updated successfully' });
    } catch (error) {
        console.error('Error updating unit:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
