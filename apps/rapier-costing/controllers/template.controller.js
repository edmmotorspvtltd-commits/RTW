const { Pool } = require('pg');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'rapier_costing_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
});

// ================================================
// GET ALL TEMPLATES
// ================================================

exports.getAllTemplates = async (req, res) => {
    try {
        // First, check if table exists and what columns it has
        const query = `
            SELECT 
                id, template_name, created_at
            FROM costing_templates
            ORDER BY created_at DESC
        `;

        const result = await pool.query(query);

        // Convert to camelCase
        const templates = result.rows.map(row => ({
            id: row.id,
            templateName: row.template_name,
            createdAt: row.created_at
        }));

        res.json({
            success: true,
            data: templates
        });
    } catch (error) {
        // If table doesn't exist, return empty array
        if (error.code === '42P01') { // undefined_table
            console.log('⚠️ costing_templates table does not exist yet');
            return res.json({
                success: true,
                data: []
            });
        }

        // If column doesn't exist, return empty array
        if (error.code === '42703') { // undefined_column
            console.log('⚠️ costing_templates table has different schema');
            return res.json({
                success: true,
                data: []
            });
        }

        console.error('Get all templates error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// ================================================
// GET TEMPLATE BY ID
// ================================================

exports.getTemplateById = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                id, uuid, template_name, company_id, 
                order_number, order_length, party_name, broker_name, 
                quality_type, sizing_set_no, warp_data, weft_data, 
                charges_data, selling_price, profit_percentage, 
                created_by, created_at, updated_at
            FROM costing_templates
            WHERE uuid = $1 OR id = $2
        `;

        const result = await pool.query(query, [id, parseInt(id) || 0]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Template not found'
            });
        }

        const row = result.rows[0];
        const template = {
            id: row.id,
            uuid: row.uuid,
            templateName: row.template_name,
            companyId: row.company_id,
            unitId: row.unit_id,
            orderNumber: row.order_number,
            orderLength: row.order_length,
            partyName: row.party_name,
            brokerName: row.broker_name,
            qualityType: row.quality_type,
            sizingSetNo: row.sizing_set_no,
            warpData: row.warp_data,
            weftData: row.weft_data,
            chargesData: row.charges_data,
            sellingPrice: row.selling_price,
            profitPercentage: row.profit_percentage,
            createdBy: row.created_by,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };

        res.json({
            success: true,
            data: template
        });
    } catch (error) {
        console.error('Get template by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching template',
            error: error.message
        });
    }
};

// ================================================
// CREATE TEMPLATE
// ================================================

exports.createTemplate = async (req, res) => {
    try {
        const {
            templateName,
            orderNumber,
            orderLength,
            partyName,
            brokerName,
            qualityType,
            sizingSetNo,
            warpData,
            weftData,
            chargesData,
            sellingPrice,
            profitPercentage
        } = req.body;

        if (!templateName) {
            return res.status(400).json({
                success: false,
                message: 'Template name is required'
            });
        }

        const query = `
            INSERT INTO costing_templates (
                template_name, company_id, unit_id, order_number, order_length, 
                party_name, broker_name, quality_type, sizing_set_no, 
                warp_data, weft_data, charges_data, selling_price, 
                profit_percentage, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING id, uuid, template_name, created_at
        `;

        const values = [
            templateName,
            req.user?.companyId || null,
            req.user?.unitId || null,
            orderNumber || null,
            orderLength || null,
            partyName || null,
            brokerName || null,
            qualityType || null,
            sizingSetNo || null,
            JSON.stringify(warpData || []),
            JSON.stringify(weftData || []),
            JSON.stringify(chargesData || {}),
            sellingPrice || null,
            profitPercentage || null,
            req.user?.id || null
        ];

        const result = await pool.query(query, values);
        const newTemplate = result.rows[0];

        res.status(201).json({
            success: true,
            message: 'Template created successfully',
            data: {
                id: newTemplate.id,
                uuid: newTemplate.uuid,
                templateName: newTemplate.template_name,
                createdAt: newTemplate.created_at
            }
        });
    } catch (error) {
        console.error('Create template error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating template',
            error: error.message
        });
    }
};

// ================================================
// UPDATE TEMPLATE
// ================================================

exports.updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Build dynamic update query
        const fields = [];
        const values = [];
        let paramCount = 1;

        const fieldMapping = {
            templateName: 'template_name',
            orderNumber: 'order_number',
            orderLength: 'order_length',
            partyName: 'party_name',
            brokerName: 'broker_name',
            qualityType: 'quality_type',
            sizingSetNo: 'sizing_set_no',
            warpData: 'warp_data',
            weftData: 'weft_data',
            chargesData: 'charges_data',
            sellingPrice: 'selling_price',
            profitPercentage: 'profit_percentage'
        };

        for (const [camelKey, snakeKey] of Object.entries(fieldMapping)) {
            if (updateData[camelKey] !== undefined) {
                // For JSONB fields, stringify the data
                if (['warpData', 'weftData', 'chargesData'].includes(camelKey)) {
                    fields.push(`${snakeKey} = $${paramCount++}`);
                    values.push(JSON.stringify(updateData[camelKey]));
                } else {
                    fields.push(`${snakeKey} = $${paramCount++}`);
                    values.push(updateData[camelKey]);
                }
            }
        }

        if (fields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        // Add updated_at
        fields.push(`updated_at = CURRENT_TIMESTAMP`);

        // Add WHERE clause parameter
        values.push(id);

        const query = `
            UPDATE costing_templates 
            SET ${fields.join(', ')}
            WHERE uuid = $${paramCount} OR id = $${paramCount}
            RETURNING id, uuid, template_name, updated_at
        `;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Template not found'
            });
        }

        res.json({
            success: true,
            message: 'Template updated successfully',
            data: {
                id: result.rows[0].id,
                uuid: result.rows[0].uuid,
                templateName: result.rows[0].template_name,
                updatedAt: result.rows[0].updated_at
            }
        });
    } catch (error) {
        console.error('Update template error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating template',
            error: error.message
        });
    }
};

// ================================================
// DELETE TEMPLATE
// ================================================

exports.deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            DELETE FROM costing_templates 
            WHERE uuid = $1 OR id = $2
            RETURNING id, template_name
        `;

        const result = await pool.query(query, [id, parseInt(id) || 0]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Template not found'
            });
        }

        res.json({
            success: true,
            message: 'Template deleted successfully',
            data: {
                id: result.rows[0].id,
                templateName: result.rows[0].template_name
            }
        });
    } catch (error) {
        console.error('Delete template error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting template',
            error: error.message
        });
    }
};
