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
