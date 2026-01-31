// ================================================
// Costing Controller - Simplified with Raw SQL
// Fixed to use correct column names from database
// ================================================

const { pool } = require('../../config/database');
const { calculateCostingValues } = require('../utils/costing-calculations');

// ================================================
// GET ALL COSTINGS
// ================================================

exports.getAllCostings = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, sortBy = 'created_at', order = 'DESC' } = req.query;

        const offset = (page - 1) * limit;

        // Build WHERE clause - include records with null unit_id/company_id
        let whereConditions = [];
        let queryParams = [];

        // Filter by user's unit and company, but also include records with null values
        if (req.user.unitId) {
            whereConditions.push(`(unit_id = $${queryParams.length + 1} OR unit_id IS NULL)`);
            queryParams.push(req.user.unitId);
        } else {
            whereConditions.push(`unit_id IS NULL`);
        }

        if (req.user.companyId) {
            whereConditions.push(`(company_id = $${queryParams.length + 1} OR company_id IS NULL)`);
            queryParams.push(req.user.companyId);
        } else {
            whereConditions.push(`company_id IS NULL`);
        }

        if (status) {
            whereConditions.push(`status = $${queryParams.length + 1}`);
            queryParams.push(status);
        }

        const whereClause = whereConditions.length > 0 ? whereConditions.join(' AND ') : '1=1';

        // Get total count
        const countQuery = `SELECT COUNT(*) as total FROM costing_sheets WHERE ${whereClause}`;
        const countResult = await pool.query(countQuery, queryParams);
        const total = parseInt(countResult.rows[0].total);

        // Get paginated data
        const dataQuery = `
            SELECT 
                id, uuid, company_id, unit_id, order_number, order_length, party_name, 
                broker_name, quality_type, sizing_set_no, selling_price, 
                profit_percentage, status, created_at, updated_at
            FROM costing_sheets 
            WHERE ${whereClause}
            ORDER BY ${sortBy} ${order}
            LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
        `;

        const dataResult = await pool.query(dataQuery, [...queryParams, parseInt(limit), parseInt(offset)]);

        // Convert snake_case to camelCase for frontend
        const costings = dataResult.rows.map(row => ({
            id: row.id,
            uuid: row.uuid,
            companyId: row.company_id,
            unitId: row.unit_id,
            orderNumber: row.order_number,
            orderLength: row.order_length,
            partyName: row.party_name,
            brokerName: row.broker_name,
            qualityType: row.quality_type,
            sizingSetNo: row.sizing_set_no,
            sellingPrice: row.selling_price,
            profitPercentage: row.profit_percentage,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));

        res.json({
            success: true,
            data: costings,
            pagination: {
                total: total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get all costings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching costing sheets',
            error: error.message
        });
    }
};

// ================================================
// GET COSTING BY ID
// ================================================

exports.getCostingById = async (req, res) => {
    try {
        const query = `
            SELECT 
                id, uuid, company_id, unit_id, order_number, order_length, party_name, 
                broker_name, quality_type, sizing_set_no, selling_price, 
                profit_percentage, status, created_at, updated_at
            FROM costing_sheets 
            WHERE id = $1
        `;

        const result = await pool.query(query, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Costing sheet not found'
            });
        }

        const row = result.rows[0];
        const costing = {
            id: row.id,
            uuid: row.uuid,
            companyId: row.company_id,
            unitId: row.unit_id,
            orderNumber: row.order_number,
            orderLength: row.order_length,
            partyName: row.party_name,
            brokerName: row.broker_name,
            qualityType: row.quality_type,
            sizingSetNo: row.sizing_set_no,
            sellingPrice: row.selling_price,
            profitPercentage: row.profit_percentage,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };

        res.json({
            success: true,
            data: costing
        });
    } catch (error) {
        console.error('Get costing by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching costing sheet',
            error: error.message
        });
    }
};

// ================================================
// CREATE COSTING
// ================================================

exports.createCosting = async (req, res) => {
    try {
        const {
            orderNumber,
            orderLength,
            partyName,
            brokerName,
            agentName, // Support both brokerName and agentName
            qualityType,
            sizingSetNo,
            sellingPrice,
            profitPercentage,
            status = 'draft',
            warpData,
            weftData,
            chargesData
        } = req.body;

        // Validate required fields
        if (!orderNumber || !orderLength) {
            return res.status(400).json({
                success: false,
                message: 'Order number and order length are required'
            });
        }

        // Generate UUID
        const uuid = require('crypto').randomUUID();

        // Calculate all derived values
        const calculated = calculateCostingValues({
            orderLength: parseFloat(orderLength),
            warpData: warpData || [],
            weftData: weftData || [],
            chargesData: chargesData || {},
            sellingPrice: parseFloat(sellingPrice) || 0
        });

        // Insert costing sheet with ALL calculated fields
        const insertQuery = `
            INSERT INTO costing_sheets (
                uuid, company_id, unit_id, order_number, order_length,
                party_name, broker_name, quality_type, sizing_set_no,
                warp_data, weft_data, charges_data,
                total_warp_cost, total_weft_cost, net_warp_total, net_weft_total,
                warp_glm_total, weft_glm_total, glm_per_meter, yarn_required,
                additional_charges, job_rate_percentage, job_charges_per_mtr,
                expenses_percentage, expenses_per_mtr,
                brokerage_percentage, brokerage_per_mtr,
                production_cost, minimum_selling_price, selling_price,
                net_profit_per_mtr, profit_percentage,
                total_production_cost, total_net_profit,
                status, created_at, updated_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
                $13, $14, $15, $16, $17, $18, $19, $20,
                $21, $22, $23, $24, $25, $26, $27,
                $28, $29, $30, $31, $32, $33, $34, $35,
                NOW(), NOW()
            )
            RETURNING id, uuid, order_number, created_at
        `;

        const values = [
            uuid,
            req.user.companyId || null,
            req.user.unitId || null,
            orderNumber,
            parseFloat(orderLength),
            partyName || null,
            agentName || brokerName || null,
            qualityType || null,
            sizingSetNo || null,
            JSON.stringify(warpData || []),
            JSON.stringify(weftData || []),
            JSON.stringify(chargesData || {}),
            calculated.totalWarpCost,
            calculated.totalWeftCost,
            calculated.netWarpTotal,
            calculated.netWeftTotal,
            calculated.warpGLMTotal,
            calculated.weftGLMTotal,
            calculated.glmPerMeter,
            calculated.totalYarnRequired,
            calculated.additionalCharges,
            calculated.jobRatePercentage,
            calculated.jobChargesPerMtr,
            calculated.expensesPercentage,
            calculated.expensesPerMtr,
            calculated.brokeragePercentage,
            calculated.brokeragePerMtr,
            calculated.productionCost,
            calculated.minimumSellingPrice,
            calculated.sellingPrice,
            calculated.netProfitPerMtr,
            calculated.profitPercentage,
            calculated.totalProductionCost,
            calculated.totalNetProfit,
            status
        ];

        const result = await pool.query(insertQuery, values);
        const newCosting = result.rows[0];

        res.status(201).json({
            success: true,
            message: 'Costing sheet created successfully',
            data: {
                id: newCosting.id,
                uuid: newCosting.uuid,
                orderNumber: newCosting.order_number,
                createdAt: newCosting.created_at
            }
        });
    } catch (error) {
        console.error('Create costing error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating costing sheet',
            error: error.message
        });
    }
};

// ================================================
// UPDATE COSTING
// ================================================


// Updated UPDATE function with calculations
// Replace lines 292-415 in costing.controller.simple.js with this

exports.updateCosting = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            orderNumber,
            orderLength,
            partyName,
            brokerName,
            agentName,
            qualityType,
            sizingSetNo,
            sellingPrice,
            profitPercentage,
            status,
            warpData,
            weftData,
            chargesData
        } = req.body;

        // If warp/weft/charges data is being updated, recalculate all derived values
        let calculated = null;
        if (warpData !== undefined || weftData !== undefined || chargesData !== undefined || orderLength !== undefined || sellingPrice !== undefined) {
            // Get current data to fill in missing pieces
            const currentQuery = 'SELECT order_length, warp_data, weft_data, charges_data, selling_price FROM costing_sheets WHERE id = $1';
            const currentResult = await pool.query(currentQuery, [id]);

            if (currentResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Costing sheet not found'
                });
            }

            const current = currentResult.rows[0];

            // Use provided values or fall back to current values
            calculated = calculateCostingValues({
                orderLength: parseFloat(orderLength !== undefined ? orderLength : current.order_length),
                warpData: warpData !== undefined ? warpData : JSON.parse(current.warp_data || '[]'),
                weftData: weftData !== undefined ? weftData : JSON.parse(current.weft_data || '[]'),
                chargesData: chargesData !== undefined ? chargesData : JSON.parse(current.charges_data || '{}'),
                sellingPrice: parseFloat(sellingPrice !== undefined ? sellingPrice : current.selling_price) || 0
            });
        }

        // Build UPDATE query dynamically
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (orderNumber !== undefined) {
            updates.push(`order_number = $${paramCount++}`);
            values.push(orderNumber);
        }
        if (orderLength !== undefined) {
            updates.push(`order_length = $${paramCount++}`);
            values.push(parseFloat(orderLength));
        }
        if (partyName !== undefined) {
            updates.push(`party_name = $${paramCount++}`);
            values.push(partyName);
        }
        if (brokerName !== undefined || agentName !== undefined) {
            updates.push(`broker_name = $${paramCount++}`);
            values.push(agentName || brokerName);
        }
        if (qualityType !== undefined) {
            updates.push(`quality_type = $${paramCount++}`);
            values.push(qualityType);
        }
        if (sizingSetNo !== undefined) {
            updates.push(`sizing_set_no = $${paramCount++}`);
            values.push(sizingSetNo);
        }
        if (status !== undefined) {
            updates.push(`status = $${paramCount++}`);
            values.push(status);
        }

        // Add warp, weft, and charges data
        if (warpData !== undefined) {
            updates.push(`warp_data = $${paramCount++}`);
            values.push(JSON.stringify(warpData));
        }
        if (weftData !== undefined) {
            updates.push(`weft_data = $${paramCount++}`);
            values.push(JSON.stringify(weftData));
        }
        if (chargesData !== undefined) {
            updates.push(`charges_data = $${paramCount++}`);
            values.push(JSON.stringify(chargesData));
        }

        // If we calculated values, add all calculated fields
        if (calculated) {
            updates.push(`total_warp_cost = $${paramCount++}`, `total_weft_cost = $${paramCount++}`,
                `net_warp_total = $${paramCount++}`, `net_weft_total = $${paramCount++}`,
                `warp_glm_total = $${paramCount++}`, `weft_glm_total = $${paramCount++}`,
                `glm_per_meter = $${paramCount++}`, `yarn_required = $${paramCount++}`,
                `additional_charges = $${paramCount++}`, `job_rate_percentage = $${paramCount++}`,
                `job_charges_per_mtr = $${paramCount++}`, `expenses_percentage = $${paramCount++}`,
                `expenses_per_mtr = $${paramCount++}`, `brokerage_percentage = $${paramCount++}`,
                `brokerage_per_mtr = $${paramCount++}`, `production_cost = $${paramCount++}`,
                `minimum_selling_price = $${paramCount++}`, `selling_price = $${paramCount++}`,
                `net_profit_per_mtr = $${paramCount++}`, `profit_percentage = $${paramCount++}`,
                `total_production_cost = $${paramCount++}`, `total_net_profit = $${paramCount++}`);

            values.push(calculated.totalWarpCost, calculated.totalWeftCost,
                calculated.netWarpTotal, calculated.netWeftTotal,
                calculated.warpGLMTotal, calculated.weftGLMTotal,
                calculated.glmPerMeter, calculated.totalYarnRequired,
                calculated.additionalCharges, calculated.jobRatePercentage,
                calculated.jobChargesPerMtr, calculated.expensesPercentage,
                calculated.expensesPerMtr, calculated.brokeragePercentage,
                calculated.brokeragePerMtr, calculated.productionCost,
                calculated.minimumSellingPrice, calculated.sellingPrice,
                calculated.netProfitPerMtr, calculated.profitPercentage,
                calculated.totalProductionCost, calculated.totalNetProfit);
        }

        updates.push(`updated_at = NOW()`);

        if (updates.length === 1) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        values.push(id);

        const updateQuery = `UPDATE costing_sheets SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING id, uuid, order_number, updated_at`;

        const result = await pool.query(updateQuery, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Costing sheet not found'
            });
        }

        res.json({
            success: true,
            message: 'Costing sheet updated successfully',
            data: {
                id: result.rows[0].id,
                uuid: result.rows[0].uuid,
                orderNumber: result.rows[0].order_number,
                updatedAt: result.rows[0].updated_at
            }
        });
    } catch (error) {
        console.error('Update costing error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating costing sheet',
            error: error.message
        });
    }
};


// ================================================
// DELETE COSTING
// ================================================

exports.deleteCosting = async (req, res) => {
    try {
        const query = `
            DELETE FROM costing_sheets 
            WHERE id = $1
            RETURNING id
        `;

        const result = await pool.query(query, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Costing sheet not found'
            });
        }

        res.json({
            success: true,
            message: 'Costing sheet deleted successfully'
        });
    } catch (error) {
        console.error('Delete costing error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting costing sheet',
            error: error.message
        });
    }
};

// ================================================
// CALCULATE COSTING (STUB - needs implementation)
// ================================================

exports.calculateCosting = async (req, res) => {
    res.status(501).json({
        success: false,
        message: 'Calculate costing not yet implemented in simplified controller'
    });
};

// ================================================
// RECALCULATE COSTING (STUB - needs implementation)
// ================================================

exports.recalculateCosting = async (req, res) => {
    res.status(501).json({
        success: false,
        message: 'Recalculate costing not yet implemented in simplified controller'
    });
};

// ================================================
// SEARCH COSTINGS
// ================================================

exports.searchCostings = async (req, res) => {
    try {
        const { q, page = 1, limit = 20 } = req.query;

        if (!q) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const offset = (page - 1) * limit;
        const searchPattern = `%${q}%`;

        // Search across multiple fields
        const searchQuery = `
            SELECT 
                id, uuid, company_id, unit_id, order_number, order_length, party_name, 
                broker_name, quality_type, sizing_set_no, selling_price, 
                profit_percentage, status, created_at, updated_at
            FROM costing_sheets 
            WHERE (
                order_number ILIKE $1 OR
                party_name ILIKE $1 OR
                broker_name ILIKE $1 OR
                quality_type ILIKE $1 OR
                sizing_set_no ILIKE $1
            )
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `;

        const countQuery = `
            SELECT COUNT(*) as total
            FROM costing_sheets 
            WHERE (
                order_number ILIKE $1 OR
                party_name ILIKE $1 OR
                broker_name ILIKE $1 OR
                quality_type ILIKE $1 OR
                sizing_set_no ILIKE $1
            )
        `;

        const [dataResult, countResult] = await Promise.all([
            pool.query(searchQuery, [searchPattern, parseInt(limit), parseInt(offset)]),
            pool.query(countQuery, [searchPattern])
        ]);

        const total = parseInt(countResult.rows[0].total);

        // Convert to camelCase
        const costings = dataResult.rows.map(row => ({
            id: row.id,
            uuid: row.uuid,
            companyId: row.company_id,
            unitId: row.unit_id,
            orderNumber: row.order_number,
            orderLength: row.order_length,
            partyName: row.party_name,
            brokerName: row.broker_name,
            qualityType: row.quality_type,
            sizingSetNo: row.sizing_set_no,
            sellingPrice: row.selling_price,
            profitPercentage: row.profit_percentage,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));

        res.json({
            success: true,
            data: costings,
            pagination: {
                total: total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Search costings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching costing sheets',
            error: error.message
        });
    }
};

// ================================================
// FILTER COSTINGS
// ================================================

exports.filterCostings = async (req, res) => {
    try {
        const { status, minPrice, maxPrice, startDate, endDate, page = 1, limit = 20 } = req.query;

        const offset = (page - 1) * limit;
        const conditions = [];
        const values = [];
        let paramCount = 1;

        // Build dynamic WHERE clause
        if (status) {
            conditions.push(`status = $${paramCount++}`);
            values.push(status);
        }

        if (minPrice) {
            conditions.push(`selling_price >= $${paramCount++}`);
            values.push(parseFloat(minPrice));
        }

        if (maxPrice) {
            conditions.push(`selling_price <= $${paramCount++}`);
            values.push(parseFloat(maxPrice));
        }

        if (startDate) {
            conditions.push(`created_at >= $${paramCount++}`);
            values.push(startDate);
        }

        if (endDate) {
            conditions.push(`created_at <= $${paramCount++}`);
            values.push(endDate);
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Get filtered data
        const dataQuery = `
            SELECT 
                id, uuid, company_id, unit_id, order_number, order_length, party_name, 
                broker_name, quality_type, sizing_set_no, selling_price, 
                profit_percentage, status, created_at, updated_at
            FROM costing_sheets 
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT $${paramCount} OFFSET $${paramCount + 1}
        `;

        const countQuery = `
            SELECT COUNT(*) as total
            FROM costing_sheets 
            ${whereClause}
        `;

        const [dataResult, countResult] = await Promise.all([
            pool.query(dataQuery, [...values, parseInt(limit), parseInt(offset)]),
            pool.query(countQuery, values)
        ]);

        const total = parseInt(countResult.rows[0].total);

        // Convert to camelCase
        const costings = dataResult.rows.map(row => ({
            id: row.id,
            uuid: row.uuid,
            companyId: row.company_id,
            unitId: row.unit_id,
            orderNumber: row.order_number,
            orderLength: row.order_length,
            partyName: row.party_name,
            brokerName: row.broker_name,
            qualityType: row.quality_type,
            sizingSetNo: row.sizing_set_no,
            sellingPrice: row.selling_price,
            profitPercentage: row.profit_percentage,
            status: row.status,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));

        res.json({
            success: true,
            data: costings,
            pagination: {
                total: total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Filter costings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error filtering costing sheets',
            error: error.message
        });
    }
};

// ================================================
// EXPORT PDF
// ================================================


exports.exportPDF = async (req, res) => {
    try {
        const { id } = req.params;

        // Get costing data with all details
        const query = `
            SELECT * FROM costing_sheets WHERE id = $1
        `;
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Costing sheet not found'
            });
        }

        const costing = result.rows[0];
        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({
            margin: 50,
            size: 'A4'
        });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=costing-${costing.order_number || id}.pdf`);

        // Pipe PDF to response
        doc.pipe(res);

        // Define colors (matching UI brown theme)
        const primaryBrown = '#6D4C41';
        const darkBrown = '#5D4037';
        const lightBrown = '#BCAAA4';
        const textDark = '#212121';
        const textLight = '#757575';

        // ===== HEADER SECTION =====
        doc.fillColor(primaryBrown)
            .fontSize(24)
            .font('Helvetica-Bold')
            .text('RTWE ERP SYSTEM', { align: 'center' });

        doc.fillColor(darkBrown)
            .fontSize(18)
            .text('Costing Sheet', { align: 'center' });

        doc.moveDown(0.5);

        // Company details (you can customize these)
        doc.fillColor(textLight)
            .fontSize(10)
            .font('Helvetica')
            .text('RTWE Textile Manufacturing', { align: 'center' })
            .text('Email: info@rtwe.com | Phone: +91 XXXXXXXXXX', { align: 'center' });

        // Horizontal line
        doc.moveDown();
        doc.strokeColor(primaryBrown)
            .lineWidth(2)
            .moveTo(50, doc.y)
            .lineTo(545, doc.y)
            .stroke();

        doc.moveDown(1.5);

        // ===== BASIC INFORMATION SECTION =====
        doc.fillColor(primaryBrown)
            .fontSize(14)
            .font('Helvetica-Bold')
            .text('Basic Information');

        doc.moveDown(0.5);

        const startY = doc.y;
        const leftCol = 70;
        const rightCol = 320;

        doc.fillColor(textDark)
            .fontSize(11)
            .font('Helvetica-Bold');

        // Left column
        doc.text('Order Number:', leftCol, startY);
        doc.text('Order Length:', leftCol, startY + 20);
        doc.text('Party Name:', leftCol, startY + 40);
        doc.text('Broker Name:', leftCol, startY + 60);

        // Right column
        doc.text('Quality Type:', rightCol, startY);
        doc.text('Sizing Set No:', rightCol, startY + 20);
        doc.text('Status:', rightCol, startY + 40);
        doc.text('Created:', rightCol, startY + 60);

        // Values
        doc.font('Helvetica')
            .fillColor(textLight);

        doc.text(costing.order_number || 'N/A', leftCol + 100, startY);
        doc.text((costing.order_length || 'N/A') + ' mtrs', leftCol + 100, startY + 20);
        doc.text(costing.party_name || 'N/A', leftCol + 100, startY + 40);
        doc.text(costing.broker_name || 'N/A', leftCol + 100, startY + 60);

        doc.text(costing.quality_type || 'N/A', rightCol + 100, startY);
        doc.text(costing.sizing_set_no || 'N/A', rightCol + 100, startY + 20);
        doc.text((costing.status || 'draft').toUpperCase(), rightCol + 100, startY + 40);
        doc.text(costing.created_at ? new Date(costing.created_at).toLocaleDateString() : 'N/A', rightCol + 100, startY + 60);

        doc.y = startY + 90;
        doc.moveDown(1);

        // ===== WARP DETAILS SECTION =====
        if (costing.warp_data) {
            doc.fillColor(primaryBrown)
                .fontSize(14)
                .font('Helvetica-Bold')
                .text('Warp Details');

            doc.moveDown(0.5);

            const warpData = typeof costing.warp_data === 'string' ? JSON.parse(costing.warp_data) : costing.warp_data;

            if (Array.isArray(warpData) && warpData.length > 0) {
                // Table header
                const tableTop = doc.y;
                const col1 = 70;
                const col2 = 150;
                const col3 = 230;
                const col4 = 310;
                const col5 = 390;
                const col6 = 470;

                doc.fillColor(darkBrown)
                    .fontSize(9)
                    .font('Helvetica-Bold');

                doc.text('Count', col1, tableTop);
                doc.text('Yarn Type', col2, tableTop);
                doc.text('Supplier', col3, tableTop);
                doc.text('Rate', col4, tableTop);
                doc.text('Ends', col5, tableTop);
                doc.text('Total', col6, tableTop);

                doc.moveDown(0.3);
                doc.strokeColor(lightBrown)
                    .lineWidth(1)
                    .moveTo(50, doc.y)
                    .lineTo(545, doc.y)
                    .stroke();

                doc.moveDown(0.3);

                // Table rows
                doc.font('Helvetica')
                    .fontSize(9)
                    .fillColor(textDark);

                warpData.forEach((item, index) => {
                    const rowY = doc.y;
                    doc.text(item.count || '-', col1, rowY);
                    doc.text(item.yarnType || '-', col2, rowY);
                    doc.text(item.supplier || '-', col3, rowY);
                    doc.text(item.rate ? `₹${item.rate}` : '-', col4, rowY);
                    doc.text(item.ends || '-', col5, rowY);
                    doc.text(item.total ? `₹${item.total}` : '-', col6, rowY);
                    doc.moveDown(0.8);
                });
            } else {
                doc.fillColor(textLight)
                    .fontSize(10)
                    .font('Helvetica-Oblique')
                    .text('No warp data available');
            }

            doc.moveDown(1);
        }

        // ===== WEFT DETAILS SECTION =====
        if (costing.weft_data) {
            doc.fillColor(primaryBrown)
                .fontSize(14)
                .font('Helvetica-Bold')
                .text('Weft Details');

            doc.moveDown(0.5);

            const weftData = typeof costing.weft_data === 'string' ? JSON.parse(costing.weft_data) : costing.weft_data;

            if (Array.isArray(weftData) && weftData.length > 0) {
                // Table header
                const tableTop = doc.y;
                const col1 = 70;
                const col2 = 150;
                const col3 = 230;
                const col4 = 310;
                const col5 = 390;
                const col6 = 470;

                doc.fillColor(darkBrown)
                    .fontSize(9)
                    .font('Helvetica-Bold');

                doc.text('Count', col1, tableTop);
                doc.text('Yarn Type', col2, tableTop);
                doc.text('Supplier', col3, tableTop);
                doc.text('Rate', col4, tableTop);
                doc.text('Picks', col5, tableTop);
                doc.text('Total', col6, tableTop);

                doc.moveDown(0.3);
                doc.strokeColor(lightBrown)
                    .lineWidth(1)
                    .moveTo(50, doc.y)
                    .lineTo(545, doc.y)
                    .stroke();

                doc.moveDown(0.3);

                // Table rows
                doc.font('Helvetica')
                    .fontSize(9)
                    .fillColor(textDark);

                weftData.forEach((item, index) => {
                    const rowY = doc.y;
                    doc.text(item.count || '-', col1, rowY);
                    doc.text(item.yarnType || '-', col2, rowY);
                    doc.text(item.supplier || '-', col3, rowY);
                    doc.text(item.rate ? `₹${item.rate}` : '-', col4, rowY);
                    doc.text(item.picks || '-', col5, rowY);
                    doc.text(item.total ? `₹${item.total}` : '-', col6, rowY);
                    doc.moveDown(0.8);
                });
            } else {
                doc.fillColor(textLight)
                    .fontSize(10)
                    .font('Helvetica-Oblique')
                    .text('No weft data available');
            }

            doc.moveDown(1);
        }

        // ===== CHARGES SECTION =====
        if (costing.charges_data) {
            doc.fillColor(primaryBrown)
                .fontSize(14)
                .font('Helvetica-Bold')
                .text('Charges & Costs');

            doc.moveDown(0.5);

            const chargesData = typeof costing.charges_data === 'string' ? JSON.parse(costing.charges_data) : costing.charges_data;

            if (chargesData && typeof chargesData === 'object') {
                doc.fillColor(textDark)
                    .fontSize(10)
                    .font('Helvetica');

                Object.entries(chargesData).forEach(([key, value]) => {
                    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    doc.font('Helvetica-Bold').text(`${label}:`, 70, doc.y, { continued: true });
                    doc.font('Helvetica').fillColor(textLight).text(` ₹${value || '0.00'}`, { align: 'left' });
                    doc.fillColor(textDark);
                    doc.moveDown(0.5);
                });
            }

            doc.moveDown(1);
        }

        // ===== PRICING SUMMARY =====
        doc.strokeColor(primaryBrown)
            .lineWidth(2)
            .moveTo(50, doc.y)
            .lineTo(545, doc.y)
            .stroke();

        doc.moveDown(1);

        doc.fillColor(primaryBrown)
            .fontSize(16)
            .font('Helvetica-Bold')
            .text('Pricing Summary', { align: 'center' });

        doc.moveDown(0.5);

        const summaryY = doc.y;
        doc.fillColor(textDark)
            .fontSize(12)
            .font('Helvetica-Bold');

        doc.text('Selling Price:', 200, summaryY);
        doc.text('Profit Percentage:', 200, summaryY + 25);

        doc.fillColor(primaryBrown)
            .fontSize(14);
        doc.text(`₹${costing.selling_price ? parseFloat(costing.selling_price).toFixed(2) : '0.00'}`, 350, summaryY);
        doc.text(`${costing.profit_percentage ? parseFloat(costing.profit_percentage).toFixed(2) : '0'}%`, 350, summaryY + 25);

        // ===== FOOTER =====
        doc.moveDown(3);
        doc.strokeColor(lightBrown)
            .lineWidth(1)
            .moveTo(50, doc.y)
            .lineTo(545, doc.y)
            .stroke();

        doc.moveDown(0.5);
        doc.fillColor(textLight)
            .fontSize(9)
            .font('Helvetica')
            .text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' })
            .text('This is a computer-generated document', { align: 'center' });

        // Finalize PDF
        doc.end();
    } catch (error) {
        console.error('Export PDF error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Error generating PDF',
                error: error.message
            });
        }
    }
};

// ================================================
// EXPORT EXCEL
// ================================================

exports.exportExcel = async (req, res) => {
    try {
        const { id } = req.params;

        // Get costing data
        const query = `
            SELECT * FROM costing_sheets WHERE id = $1
        `;
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Costing sheet not found'
            });
        }

        const costing = result.rows[0];
        const ExcelJS = require('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Costing Sheet');

        // Add headers
        worksheet.columns = [
            { header: 'Field', key: 'field', width: 25 },
            { header: 'Value', key: 'value', width: 40 }
        ];

        // Add data
        worksheet.addRow({ field: 'Order Number', value: costing.order_number || 'N/A' });
        worksheet.addRow({ field: 'Order Length (mtrs)', value: costing.order_length || 'N/A' });
        worksheet.addRow({ field: 'Party Name', value: costing.party_name || 'N/A' });
        worksheet.addRow({ field: 'Broker Name', value: costing.broker_name || 'N/A' });
        worksheet.addRow({ field: 'Quality Type', value: costing.quality_type || 'N/A' });
        worksheet.addRow({ field: 'Sizing Set No', value: costing.sizing_set_no || 'N/A' });
        worksheet.addRow({ field: 'Selling Price (₹)', value: costing.selling_price || '0.00' });
        worksheet.addRow({ field: 'Profit Percentage (%)', value: costing.profit_percentage || '0' });
        worksheet.addRow({ field: 'Status', value: costing.status || 'draft' });
        worksheet.addRow({ field: 'Created At', value: costing.created_at });
        worksheet.addRow({ field: 'Updated At', value: costing.updated_at });

        // Style header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF5D4037' }
        };
        worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=costing-${costing.order_number || id}.xlsx`);

        // Write to response
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Export Excel error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Error generating Excel file',
                error: error.message
            });
        }
    }
};

// ================================================
// EXPORT ALL FUNCTIONS
// ================================================

