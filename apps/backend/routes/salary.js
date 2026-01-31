// ================================================================================
//                    SALARY MANAGEMENT ROUTES
//     Employee Salary, Advances, Bank Details & Documents Management
// ================================================================================

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { pool } = require('../config/database');
const { validateSession } = require('../middleware/auth');

// ================================================================================
// FILE UPLOAD CONFIGURATION
// ================================================================================
const uploadDir = path.join(__dirname, '../../uploads/documents');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC, DOCX, JPG, PNG files are allowed'));
        }
    }
});

// ================================================================================
// SALARY STRUCTURE ROUTES
// ================================================================================

// GET /api/salary/structure - Get all salary structures
router.get('/structure', validateSession, async (req, res) => {
    try {
        const { is_active } = req.query;
        let query = `
            SELECT ss.*, e.full_name, e.employee_code
            FROM salary_structure ss
            JOIN employees e ON ss.employee_id = e.employee_id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (is_active === 'true') {
            query += ` AND ss.is_active = TRUE`;
        }

        query += ' ORDER BY e.full_name';

        const result = await pool.query(query, params);
        res.json({ success: true, count: result.rows.length, data: result.rows });
    } catch (error) {
        console.error('Error fetching salary structures:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/salary/structure - Create or update salary structure
router.post('/structure', validateSession, async (req, res) => {
    try {
        const {
            employee_id, basic_salary, hra, da, medical_allowance,
            transport_allowance, special_allowance, other_allowances,
            pf_deduction, esi_deduction, professional_tax, tds_deduction,
            other_deductions, effective_from
        } = req.body;

        // Calculate computed fields
        const gross_salary = parseFloat(basic_salary || 0) + parseFloat(hra || 0) +
            parseFloat(da || 0) + parseFloat(medical_allowance || 0) +
            parseFloat(transport_allowance || 0) + parseFloat(special_allowance || 0) +
            parseFloat(other_allowances || 0);

        const total_deductions = parseFloat(pf_deduction || 0) + parseFloat(esi_deduction || 0) +
            parseFloat(professional_tax || 0) + parseFloat(tds_deduction || 0) +
            parseFloat(other_deductions || 0);

        const net_salary = gross_salary - total_deductions;
        const per_day_salary = gross_salary / 30;

        // Deactivate previous salary structure for this employee
        // Set effective_to to one day before the new effective_from to avoid constraint violation
        const effectiveToDate = new Date(effective_from);
        effectiveToDate.setDate(effectiveToDate.getDate() - 1);
        const effectiveToStr = effectiveToDate.toISOString().split('T')[0];

        await pool.query(
            `UPDATE salary_structure SET is_active = FALSE, effective_to = $1 
             WHERE employee_id = $2 AND is_active = TRUE AND effective_from <= $1`,
            [effectiveToStr, employee_id]
        );

        const result = await pool.query(`
            INSERT INTO salary_structure (
                employee_id, basic_salary, hra, da, medical_allowance,
                transport_allowance, special_allowance, other_allowances,
                gross_salary, pf_deduction, esi_deduction, professional_tax,
                tds_deduction, other_deductions, total_deductions, net_salary,
                per_day_salary, effective_from, is_active
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, TRUE)
            RETURNING *
        `, [employee_id, basic_salary, hra || 0, da || 0, medical_allowance || 0,
            transport_allowance || 0, special_allowance || 0, other_allowances || 0,
            gross_salary, pf_deduction || 0, esi_deduction || 0, professional_tax || 0,
            tds_deduction || 0, other_deductions || 0, total_deductions, net_salary,
            per_day_salary, effective_from]);

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error saving salary structure:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/salary/structure/:id - Update existing salary structure
router.put('/structure/:id', validateSession, async (req, res) => {
    try {
        const { id } = req.params;
        const {
            basic_salary, hra, da, medical_allowance,
            transport_allowance, special_allowance, other_allowances,
            pf_deduction, esi_deduction, professional_tax, tds_deduction,
            other_deductions, effective_from
        } = req.body;

        // Calculate computed fields
        const gross_salary = parseFloat(basic_salary || 0) + parseFloat(hra || 0) +
            parseFloat(da || 0) + parseFloat(medical_allowance || 0) +
            parseFloat(transport_allowance || 0) + parseFloat(special_allowance || 0) +
            parseFloat(other_allowances || 0);

        const total_deductions = parseFloat(pf_deduction || 0) + parseFloat(esi_deduction || 0) +
            parseFloat(professional_tax || 0) + parseFloat(tds_deduction || 0) +
            parseFloat(other_deductions || 0);

        const net_salary = gross_salary - total_deductions;
        const per_day_salary = gross_salary / 30;

        const result = await pool.query(`
            UPDATE salary_structure SET
                basic_salary = $1, hra = $2, da = $3, medical_allowance = $4,
                transport_allowance = $5, special_allowance = $6, other_allowances = $7,
                gross_salary = $8, pf_deduction = $9, esi_deduction = $10, professional_tax = $11,
                tds_deduction = $12, other_deductions = $13, total_deductions = $14, net_salary = $15,
                per_day_salary = $16, effective_from = $17, updated_at = NOW()
            WHERE salary_id = $18
            RETURNING *
        `, [basic_salary, hra || 0, da || 0, medical_allowance || 0,
            transport_allowance || 0, special_allowance || 0, other_allowances || 0,
            gross_salary, pf_deduction || 0, esi_deduction || 0, professional_tax || 0,
            tds_deduction || 0, other_deductions || 0, total_deductions, net_salary,
            per_day_salary, effective_from, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Salary structure not found' });
        }

        res.json({ success: true, data: result.rows[0], message: 'Salary structure updated' });
    } catch (error) {
        console.error('Error updating salary structure:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/salary/structure/:id - Deactivate salary structure
router.delete('/structure/:id', validateSession, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `UPDATE salary_structure SET is_active = FALSE, effective_to = CURRENT_DATE WHERE salary_id = $1 RETURNING *`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Salary structure not found' });
        }
        res.json({ success: true, message: 'Salary structure deactivated' });
    } catch (error) {
        console.error('Error deactivating salary structure:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ================================================================================
// MONTHLY SALARY ROUTES
// ================================================================================

// GET /api/salary/monthly - Get monthly salary register
router.get('/monthly', validateSession, async (req, res) => {
    try {
        const { month, year } = req.query;
        const salaryMonth = `${year}-${month}-01`;

        const result = await pool.query(`
            SELECT msr.*, e.full_name, e.employee_code
            FROM monthly_salary_register msr
            JOIN employees e ON msr.employee_id = e.employee_id
            WHERE DATE_TRUNC('month', msr.salary_month) = DATE_TRUNC('month', $1::DATE)
            ORDER BY e.full_name
        `, [salaryMonth]);

        res.json({ success: true, count: result.rows.length, data: result.rows });
    } catch (error) {
        console.error('Error fetching monthly salary:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/salary/process-month - Process salary for a month
router.post('/process-month', validateSession, async (req, res) => {
    try {
        const { month, year } = req.body;
        const salaryMonth = new Date(`${year}-${month}-01`);
        let processedCount = 0;

        // Get all active employees with salary structures
        const employees = await pool.query(`
            SELECT e.employee_id, ss.*
            FROM employees e
            JOIN salary_structure ss ON e.employee_id = ss.employee_id AND ss.is_active = TRUE
            WHERE e.status = 'active'
        `);

        for (const emp of employees.rows) {
            // Get attendance summary for the month - use attendance_logs directly
            // Count distinct dates with attendance as present days
            const attendanceResult = await pool.query(`
                SELECT 
                    COUNT(DISTINCT DATE(punch_time)) as present_days,
                    0 as absent_days,
                    0 as half_days,
                    0 as leave_days,
                    0 as overtime_hours
                FROM attendance_logs
                WHERE employee_id = $1
                    AND DATE_TRUNC('month', DATE(punch_time)) = DATE_TRUNC('month', $2::DATE)
            `, [emp.employee_id, salaryMonth]);

            const att = attendanceResult.rows[0];
            console.log(`[Salary] Employee ${emp.employee_id}: Present days = ${att.present_days}`);
            const paidDays = parseFloat(att.present_days || 0) +
                (parseFloat(att.half_days || 0) * 0.5) +
                parseFloat(att.leave_days || 0);

            const earnedSalary = emp.per_day_salary * paidDays;

            // Get advance deductions for this month
            const advanceResult = await pool.query(`
                SELECT COALESCE(SUM(scheduled_amount), 0) as advance_deduction
                FROM advance_recovery_schedule
                WHERE employee_id = $1
                    AND recovery_month = DATE_TRUNC('month', $2::DATE)
                    AND status = 'pending'
            `, [emp.employee_id, salaryMonth]);

            const advanceDeduction = parseFloat(advanceResult.rows[0].advance_deduction || 0);
            const netPayable = earnedSalary - emp.total_deductions - advanceDeduction;

            // Insert or update salary register
            await pool.query(`
                INSERT INTO monthly_salary_register (
                    employee_id, salary_month, total_working_days,
                    present_days, absent_days, leave_days, half_days, paid_days,
                    basic_salary, gross_salary, per_day_salary,
                    earned_salary, total_allowances, total_deductions,
                    advance_deduction, net_payable, overtime_hours,
                    status, processed_at
                ) VALUES ($1, $2, 30, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 'processed', NOW())
                ON CONFLICT (employee_id, salary_month)
                DO UPDATE SET
                    present_days = EXCLUDED.present_days,
                    absent_days = EXCLUDED.absent_days,
                    leave_days = EXCLUDED.leave_days,
                    half_days = EXCLUDED.half_days,
                    paid_days = EXCLUDED.paid_days,
                    earned_salary = EXCLUDED.earned_salary,
                    advance_deduction = EXCLUDED.advance_deduction,
                    net_payable = EXCLUDED.net_payable,
                    overtime_hours = EXCLUDED.overtime_hours,
                    status = 'processed',
                    updated_at = NOW()
            `, [emp.employee_id, salaryMonth,
            att.present_days || 0, att.absent_days || 0, att.leave_days || 0, att.half_days || 0, paidDays,
            emp.basic_salary, emp.gross_salary, emp.per_day_salary,
                earnedSalary, emp.gross_salary - emp.basic_salary, emp.total_deductions,
                advanceDeduction, netPayable, att.overtime_hours || 0]);

            processedCount++;
        }

        res.json({
            success: true,
            message: `Processed salary for ${processedCount} employees for ${month}/${year}`
        });
    } catch (error) {
        console.error('Error processing monthly salary:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/salary/mark-paid - Mark salary as paid
router.post('/mark-paid', validateSession, async (req, res) => {
    try {
        const { register_id, payment_mode, transaction_reference, payment_date } = req.body;

        const result = await pool.query(`
            UPDATE monthly_salary_register
            SET status = 'paid', payment_date = $1, payment_mode = $2, 
                transaction_reference = $3, updated_at = NOW()
            WHERE register_id = $4
            RETURNING *
        `, [payment_date, payment_mode, transaction_reference, register_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Salary record not found' });
        }

        // Mark advance recovery as recovered for this month
        await pool.query(`
            UPDATE advance_recovery_schedule
            SET status = 'recovered', recovered_at = NOW(), 
                recovered_amount = scheduled_amount, salary_register_id = $1
            WHERE employee_id = $2 
                AND recovery_month = DATE_TRUNC('month', $3::DATE)
                AND status = 'pending'
        `, [register_id, result.rows[0].employee_id, result.rows[0].salary_month]);

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error marking salary as paid:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/salary/mark-unpaid - Revert salary status from paid to processed
router.post('/mark-unpaid', validateSession, async (req, res) => {
    try {
        const { register_id } = req.body;

        const result = await pool.query(`
            UPDATE monthly_salary_register
            SET status = 'processed', payment_date = NULL, payment_mode = NULL, 
                transaction_reference = NULL, updated_at = NOW()
            WHERE register_id = $1
            RETURNING *
        `, [register_id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Salary record not found' });
        }

        // Revert advance recovery to pending for this month
        await pool.query(`
            UPDATE advance_recovery_schedule
            SET status = 'pending', recovered_at = NULL, 
                recovered_amount = 0, salary_register_id = NULL
            WHERE employee_id = $1 
                AND recovery_month = DATE_TRUNC('month', $2::DATE)
                AND status = 'recovered'
        `, [result.rows[0].employee_id, result.rows[0].salary_month]);

        res.json({ success: true, message: 'Salary marked as unpaid', data: result.rows[0] });
    } catch (error) {
        console.error('Error marking salary as unpaid:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ================================================================================
// ADVANCE ROUTES
// ================================================================================

// GET /api/salary/advances - Get all advances
router.get('/advances', validateSession, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.*, e.full_name, e.employee_code
            FROM advance_salary a
            JOIN employees e ON a.employee_id = e.employee_id
            ORDER BY a.created_at DESC
        `);
        res.json({ success: true, count: result.rows.length, data: result.rows });
    } catch (error) {
        console.error('Error fetching advances:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/salary/advances - Create advance request
router.post('/advances', validateSession, async (req, res) => {
    try {
        const { employee_id, advance_amount, advance_date, reason, installments, recovery_start_month } = req.body;
        const installment_amount = parseFloat(advance_amount) / parseInt(installments);
        const balance_amount = parseFloat(advance_amount);

        const result = await pool.query(`
            INSERT INTO advance_salary (
                employee_id, advance_amount, advance_date, reason, 
                installments, installment_amount, balance_amount, 
                recovery_start_month, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
            RETURNING *
        `, [employee_id, advance_amount, advance_date, reason, installments,
            installment_amount, balance_amount, recovery_start_month]);

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error creating advance:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/salary/advances/:id/approve - Approve advance
router.put('/advances/:id/approve', validateSession, async (req, res) => {
    try {
        const { id } = req.params;
        const { approved_by } = req.body;

        // Update advance status
        const result = await pool.query(`
            UPDATE advance_salary
            SET status = 'approved', approved_by = $1, approved_at = NOW()
            WHERE advance_id = $2
            RETURNING *
        `, [approved_by || 1, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Advance not found' });
        }

        const adv = result.rows[0];

        // Create recovery schedule
        let month = new Date(adv.recovery_start_month);
        for (let i = 0; i < adv.installments; i++) {
            await pool.query(`
                INSERT INTO advance_recovery_schedule (
                    advance_id, employee_id, recovery_month, scheduled_amount, status
                ) VALUES ($1, $2, $3, $4, 'pending')
            `, [id, adv.employee_id, month.toISOString().split('T')[0], adv.installment_amount]);
            month.setMonth(month.getMonth() + 1);
        }

        res.json({ success: true, message: 'Advance approved and recovery schedule created', data: result.rows[0] });
    } catch (error) {
        console.error('Error approving advance:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/salary/advances/:id/reject - Reject advance
router.put('/advances/:id/reject', validateSession, async (req, res) => {
    try {
        const { id } = req.params;
        const { rejection_reason } = req.body;

        const result = await pool.query(`
            UPDATE advance_salary
            SET status = 'rejected', rejection_reason = $1, updated_at = NOW()
            WHERE advance_id = $2
            RETURNING *
        `, [rejection_reason, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Advance not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error rejecting advance:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// GET /api/salary/advances/:id/recovery-schedule - Get recovery schedule
router.get('/advances/:id/recovery-schedule', validateSession, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(`
            SELECT * FROM advance_recovery_schedule
            WHERE advance_id = $1
            ORDER BY recovery_month
        `, [id]);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching recovery schedule:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ================================================================================
// BANK DETAILS ROUTES
// ================================================================================

// GET /api/salary/bank-details/:employeeId - Get employee bank details
router.get('/bank-details/:employeeId', validateSession, async (req, res) => {
    try {
        const { employeeId } = req.params;
        const result = await pool.query(
            `SELECT * FROM employee_bank_details WHERE employee_id = $1`,
            [employeeId]
        );
        res.json({ success: true, data: result.rows[0] || null });
    } catch (error) {
        console.error('Error fetching bank details:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/salary/bank-details - Save or update bank details
router.post('/bank-details', validateSession, async (req, res) => {
    try {
        const {
            employee_id, account_number, account_holder_name, ifsc_code,
            bank_name, branch_name, account_type, pan_number, aadhar_number
        } = req.body;

        const result = await pool.query(`
            INSERT INTO employee_bank_details (
                employee_id, account_number, account_holder_name, ifsc_code,
                bank_name, branch_name, account_type, pan_number, aadhar_number
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (employee_id) DO UPDATE SET
                account_number = EXCLUDED.account_number,
                account_holder_name = EXCLUDED.account_holder_name,
                ifsc_code = EXCLUDED.ifsc_code,
                bank_name = EXCLUDED.bank_name,
                branch_name = EXCLUDED.branch_name,
                account_type = EXCLUDED.account_type,
                pan_number = EXCLUDED.pan_number,
                aadhar_number = EXCLUDED.aadhar_number,
                updated_at = NOW()
            RETURNING *
        `, [employee_id, account_number, account_holder_name, ifsc_code,
            bank_name, branch_name, account_type || 'savings', pan_number, aadhar_number]);

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error saving bank details:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ================================================================================
// DOCUMENTS ROUTES
// ================================================================================

// GET /api/salary/documents/:employeeId - Get employee documents
router.get('/documents/:employeeId', validateSession, async (req, res) => {
    try {
        const { employeeId } = req.params;
        const result = await pool.query(
            `SELECT * FROM employee_documents WHERE employee_id = $1 ORDER BY uploaded_at DESC`,
            [employeeId]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// POST /api/salary/documents/upload - Upload document
router.post('/documents/upload', validateSession, upload.single('document'), async (req, res) => {
    try {
        const { employee_id, document_type, document_number, issue_date, expiry_date, remarks } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const result = await pool.query(`
            INSERT INTO employee_documents (
                employee_id, document_type, document_name, file_path, file_type,
                file_size, document_number, issue_date, expiry_date, remarks
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `, [employee_id, document_type, file.originalname, file.filename, file.mimetype,
            file.size, document_number, issue_date || null, expiry_date || null, remarks]);

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error uploading document:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// PUT /api/salary/documents/:id - Update document metadata
router.put('/documents/:id', validateSession, async (req, res) => {
    try {
        const { id } = req.params;
        const { document_type, document_number, issue_date, expiry_date, remarks } = req.body;

        const result = await pool.query(`
            UPDATE employee_documents
            SET document_type = $1, document_number = $2, issue_date = $3, 
                expiry_date = $4, remarks = $5, updated_at = NOW()
            WHERE document_id = $6
            RETURNING *
        `, [document_type, document_number, issue_date, expiry_date, remarks, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Document not found' });
        }

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error updating document:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// DELETE /api/salary/documents/:id - Delete document
router.delete('/documents/:id', validateSession, async (req, res) => {
    try {
        const { id } = req.params;

        // Get file path first
        const doc = await pool.query('SELECT file_path FROM employee_documents WHERE document_id = $1', [id]);
        if (doc.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Document not found' });
        }

        // Delete file from disk
        const filePath = path.join(uploadDir, doc.rows[0].file_path);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Delete from database
        await pool.query('DELETE FROM employee_documents WHERE document_id = $1', [id]);

        res.json({ success: true, message: 'Document deleted' });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Serve uploaded documents
router.get('/documents/file/:filename', validateSession, (req, res) => {
    const filePath = path.join(uploadDir, req.params.filename);
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).json({ success: false, error: 'File not found' });
    }
});

module.exports = router;
