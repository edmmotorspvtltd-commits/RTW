const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'rapier_costing_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
});

// ================================================
// Generate Next Costing Number
// ================================================

exports.generateCostingNumber = async (req, res) => {
    try {
        // Use hardcoded company initials (RTW for RTWE)
        // This avoids cross-database dependency on the companies table
        const companyInitials = 'RTW';

        // Get current financial year (Apr-Mar)
        const now = new Date();
        const currentMonth = now.getMonth() + 1; // 1-12
        const currentYear = now.getFullYear();

        let financialYearStart, financialYearEnd;
        if (currentMonth >= 4) {
            // Apr-Dec: FY is current year to next year
            financialYearStart = currentYear;
            financialYearEnd = currentYear + 1;
        } else {
            // Jan-Mar: FY is previous year to current year
            financialYearStart = currentYear - 1;
            financialYearEnd = currentYear;
        }

        const yearSuffix = `${financialYearStart.toString().slice(-2)}-${financialYearEnd.toString().slice(-2)}`;

        // Get the last costing number for this financial year
        const pattern = `${companyInitials}/${yearSuffix}/%`;
        const countQuery = `
            SELECT order_number 
            FROM costing_sheets 
            WHERE order_number LIKE $1
            ORDER BY order_number DESC
            LIMIT 1
        `;

        const countResult = await pool.query(countQuery, [pattern]);

        let sequenceNumber = 1;
        if (countResult.rows.length > 0) {
            // Extract sequence number from last costing number
            const lastNumber = countResult.rows[0].order_number;
            const parts = lastNumber.split('/');
            if (parts.length === 3) {
                sequenceNumber = parseInt(parts[2]) + 1;
            }
        }

        // Format sequence number with leading zeros (001, 002, etc.)
        const formattedSequence = sequenceNumber.toString().padStart(3, '0');

        // Generate final costing number
        const costingNumber = `${companyInitials}/${yearSuffix}/${formattedSequence}`;

        res.json({
            success: true,
            data: {
                costingNumber: costingNumber,
                companyInitials: companyInitials,
                financialYear: yearSuffix,
                sequence: formattedSequence
            }
        });
    } catch (error) {
        console.error('Generate costing number error:', error);
        res.status(500).json({
            success: false,
            message: 'Error generating costing number',
            error: error.message
        });
    }
};

// ================================================
// Get Parties (for dropdown)
// ================================================

exports.getParties = async (req, res) => {
    try {
        const query = `
            SELECT id, party_name as name 
            FROM parties 
            WHERE company_id = $1 OR company_id IS NULL
            ORDER BY party_name ASC
        `;

        const result = await pool.query(query, [req.user.companyId || null]);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get parties error:', error);
        // If table doesn't exist, return empty array
        if (error.code === '42P01') {
            return res.json({
                success: true,
                data: []
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error fetching parties',
            error: error.message
        });
    }
};

// ================================================
// Get Agents/Brokers (for dropdown)
// ================================================

exports.getAgents = async (req, res) => {
    try {
        const query = `
            SELECT id, name 
            FROM agents 
            WHERE is_active = true
            ORDER BY name ASC
        `;

        const result = await pool.query(query);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Get agents error:', error);
        // If table doesn't exist, return empty array
        if (error.code === '42P01') {
            return res.json({
                success: true,
                data: []
            });
        }
        res.status(500).json({
            success: false,
            message: 'Error fetching agents',
            error: error.message
        });
    }
};
