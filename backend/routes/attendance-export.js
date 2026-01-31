// ================================================================================
//                    ATTENDANCE EXPORT ROUTES
//              Excel and PDF Export Functionality
// ================================================================================

const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const { validateSession } = require('../middleware/auth');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// ================================================================================
// EXCEL EXPORT
// ================================================================================

// GET /api/attendance/export/excel - Export attendance data to Excel
router.get('/excel', validateSession, async (req, res) => {
    try {
        const { start_date, end_date, employee_id, format = 'logs' } = req.query;

        let data = [];

        if (format === 'daily') {
            // Export daily summary
            let query = `
                SELECT da.*, e.full_name, e.employee_code, d.department_name
                FROM daily_attendance da
                JOIN employees e ON da.employee_id = e.employee_id
                LEFT JOIN att_departments d ON e.department_id = d.department_id
                WHERE 1=1
            `;
            const params = [];
            let paramIndex = 1;

            if (start_date) {
                query += ` AND da.attendance_date >= $${paramIndex++}`;
                params.push(start_date);
            }
            if (end_date) {
                query += ` AND da.attendance_date <= $${paramIndex++}`;
                params.push(end_date);
            }
            if (employee_id) {
                query += ` AND da.employee_id = $${paramIndex++}`;
                params.push(employee_id);
            }

            query += ' ORDER BY da.attendance_date DESC, e.full_name';
            const result = await pool.query(query, params);
            data = result.rows;
        } else {
            // Export all punch logs (excluding deleted)
            let query = `
                SELECT al.*, e.full_name, e.employee_code, d.device_name
                FROM attendance_logs al
                JOIN employees e ON al.employee_id = e.employee_id
                JOIN devices d ON al.device_id = d.device_id
                WHERE al.status != 'deleted'
            `;
            const params = [];
            let paramIndex = 1;

            if (start_date) {
                query += ` AND DATE(al.punch_time) >= $${paramIndex++}`;
                params.push(start_date);
            }
            if (end_date) {
                query += ` AND DATE(al.punch_time) <= $${paramIndex++}`;
                params.push(end_date);
            }
            if (employee_id) {
                query += ` AND al.employee_id = $${paramIndex++}`;
                params.push(employee_id);
            }

            query += ' ORDER BY al.punch_time DESC';
            const result = await pool.query(query, params);
            data = result.rows;
        }

        // Create Excel workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Attendance Report');

        // Add Company Header
        worksheet.mergeCells('A1:G1');
        worksheet.getCell('A1').value = 'RTWE TEXTILE - ATTENDANCE REPORT';
        worksheet.getCell('A1').font = { size: 16, bold: true };
        worksheet.getCell('A1').alignment = { horizontal: 'center' };

        // Add Date Range
        worksheet.mergeCells('A2:G2');
        worksheet.getCell('A2').value = `Period: ${start_date || 'All'} to ${end_date || 'All'}`;
        worksheet.getCell('A2').font = { size: 12 };
        worksheet.getCell('A2').alignment = { horizontal: 'center' };

        worksheet.addRow([]);

        if (format === 'daily') {
            // Daily summary format
            worksheet.columns = [
                { header: 'Date', key: 'attendance_date', width: 15 },
                { header: 'Employee Code', key: 'employee_code', width: 20 },
                { header: 'Employee Name', key: 'full_name', width: 25 },
                { header: 'Department', key: 'department_name', width: 20 },
                { header: 'First IN', key: 'first_in', width: 12 },
                { header: 'Last OUT', key: 'last_out', width: 12 },
                { header: 'Total Hours', key: 'total_hours', width: 12 },
                { header: 'Status', key: 'status', width: 12 }
            ];

            data.forEach(row => {
                worksheet.addRow({
                    attendance_date: row.attendance_date,
                    employee_code: row.employee_code,
                    full_name: row.full_name,
                    department_name: row.department_name,
                    first_in: row.first_in,
                    last_out: row.last_out,
                    total_hours: row.total_hours,
                    status: row.status
                });
            });
        } else {
            // Punch logs format
            worksheet.columns = [
                { header: 'Date/Time', key: 'punch_time', width: 20 },
                { header: 'Employee Code', key: 'employee_code', width: 20 },
                { header: 'Employee Name', key: 'full_name', width: 25 },
                { header: 'Device', key: 'device_name', width: 20 },
                { header: 'IN/OUT', key: 'in_out_mode', width: 10 },
                { header: 'Status', key: 'status', width: 12 },
                { header: 'Remarks', key: 'remarks', width: 30 }
            ];

            data.forEach(row => {
                worksheet.addRow({
                    punch_time: row.punch_time,
                    employee_code: row.employee_code,
                    full_name: row.full_name,
                    device_name: row.device_name,
                    in_out_mode: row.in_out_mode === 0 ? 'IN' : 'OUT',
                    status: row.status,
                    remarks: row.remarks
                });
            });
        }

        // Style header row
        const headerRow = worksheet.getRow(4);
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD7CCC8' }
        };

        // Set response headers
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=attendance_${Date.now()}.xlsx`);

        // Send file
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error exporting to Excel:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ================================================================================
// PDF EXPORT
// ================================================================================

// GET /api/attendance/export/pdf - Export attendance data to PDF
router.get('/pdf', validateSession, async (req, res) => {
    try {
        const { start_date, end_date, employee_id, format = 'logs' } = req.query;

        let data = [];

        if (format === 'daily') {
            // Export daily summary
            let query = `
                SELECT da.*, e.full_name, e.employee_code, d.department_name
                FROM daily_attendance da
                JOIN employees e ON da.employee_id = e.employee_id
                LEFT JOIN att_departments d ON e.department_id = d.department_id
                WHERE 1=1
            `;
            const params = [];
            let paramIndex = 1;

            if (start_date) {
                query += ` AND da.attendance_date >= $${paramIndex++}`;
                params.push(start_date);
            }
            if (end_date) {
                query += ` AND da.attendance_date <= $${paramIndex++}`;
                params.push(end_date);
            }
            if (employee_id) {
                query += ` AND da.employee_id = $${paramIndex++}`;
                params.push(employee_id);
            }

            query += ' ORDER BY da.attendance_date DESC, e.full_name';
            const result = await pool.query(query, params);
            data = result.rows;
        } else {
            // Export all punch logs
            let query = `
                SELECT al.*, e.full_name, e.employee_code, d.device_name
                FROM attendance_logs al
                JOIN employees e ON al.employee_id = e.employee_id
                JOIN devices d ON al.device_id = d.device_id
                WHERE al.status != 'deleted'
            `;
            const params = [];
            let paramIndex = 1;

            if (start_date) {
                query += ` AND DATE(al.punch_time) >= $${paramIndex++}`;
                params.push(start_date);
            }
            if (end_date) {
                query += ` AND DATE(al.punch_time) <= $${paramIndex++}`;
                params.push(end_date);
            }
            if (employee_id) {
                query += ` AND al.employee_id = $${paramIndex++}`;
                params.push(employee_id);
            }

            query += ' ORDER BY al.punch_time DESC LIMIT 1000'; // Limit for PDF
            const result = await pool.query(query, params);
            data = result.rows;
        }

        // Create PDF document
        const doc = new PDFDocument({ margin: 50 });

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=attendance_${Date.now()}.pdf`);

        // Pipe PDF to response
        doc.pipe(res);

        // Add Company Header
        doc.fontSize(20).font('Helvetica-Bold').text('RTWE TEXTILE', { align: 'center' });
        doc.fontSize(16).font('Helvetica').text('Attendance Report', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Period: ${start_date || 'All'} to ${end_date || 'All'}`, { align: 'center' });
        doc.moveDown(2);

        // Table data
        const tableTop = 150;
        let y = tableTop;

        if (format === 'daily') {
            // Daily summary table
            doc.fontSize(8).font('Helvetica-Bold');
            doc.text('Date', 50, y);
            doc.text('Employee', 120, y);
            doc.text('Department', 240, y);
            doc.text('First IN', 340, y);
            doc.text('Last OUT', 400, y);
            doc.text('Hours', 460, y);
            doc.text('Status', 510, y);

            y += 20;
            doc.font('Helvetica');

            data.slice(0, 30).forEach(row => { // Limit to 30 rows for PDF
                doc.fontSize(7);
                doc.text(row.attendance_date || '-', 50, y, { width: 65 });
                doc.text(row.full_name || '-', 120, y, { width: 115 });
                doc.text(row.department_name || '-', 240, y, { width: 95 });
                doc.text(row.first_in || '-', 340, y, { width: 55 });
                doc.text(row.last_out || '-', 400, y, { width: 55 });
                doc.text(row.total_hours ? row.total_hours.toString() : '-', 460, y, { width: 45 });
                doc.text(row.status || '-', 510, y, { width: 50 });
                y += 20;

                if (y > 700) { // New page
                    doc.addPage();
                    y = 50;
                }
            });
        } else {
            // Punch logs table
            doc.fontSize(8).font('Helvetica-Bold');
            doc.text('Date/Time', 50, y);
            doc.text('Employee', 150, y);
            doc.text('Device', 280, y);
            doc.text('IN/OUT', 380, y);
            doc.text('Status', 440, y);

            y += 20;
            doc.font('Helvetica');

            data.slice(0, 50).forEach(row => {
                doc.fontSize(7);
                const punchTime = new Date(row.punch_time).toLocaleString('en-IN');
                doc.text(punchTime, 50, y, { width: 95 });
                doc.text(row.full_name || '-', 150, y, { width: 125 });
                doc.text(row.device_name || '-', 280, y, { width: 95 });
                doc.text(row.in_out_mode === 0 ? 'IN' : 'OUT', 380, y, { width: 55 });
                doc.text(row.status || '-', 440, y, { width: 80 });
                y += 20;

                if (y > 700) {
                    doc.addPage();
                    y = 50;
                }
            });
        }

        // Finalize PDF
        doc.end();

    } catch (error) {
        console.error('Error exporting to PDF:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
