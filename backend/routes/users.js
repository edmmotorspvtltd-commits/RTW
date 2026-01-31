// ================================================================================
//                    USER MANAGEMENT ROUTES
//     CRUD operations for user management with role-based access
// ================================================================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth');
const emailService = require('../services/emailService');

// ================================================================================
// GET /api/users - List all users (Admin only)
// ================================================================================
router.get('/', authenticateToken, requireRole('super_admin', 'company_admin'), async (req, res) => {
    try {
        const { companyId, unitId, role, status, search } = req.query;

        let query = `
            SELECT 
                u.id, u.custom_user_id as username, u.email, u.full_name, u.user_name, u.phone,
                u.role, u.company_id, u.unit_id, u.is_active,
                u.is_email_verified as email_verified, u.last_login_at as last_login,
                u.created_at, u.department,
                c.company_name,
                un.unit_name
            FROM users u
            LEFT JOIN companies c ON u.company_id = c.id
            LEFT JOIN units un ON u.unit_id = un.id
            WHERE 1=1
        `;

        const params = [];
        let paramCount = 0;

        // Filter by company (for company_admin role)
        if (req.user.role === 'company_admin' && req.user.companyId) {
            paramCount++;
            query += ` AND u.company_id = $${paramCount}`;
            params.push(req.user.companyId);
        } else if (companyId) {
            paramCount++;
            query += ` AND u.company_id = $${paramCount}`;
            params.push(companyId);
        }

        // Filter by unit
        if (unitId) {
            paramCount++;
            query += ` AND u.unit_id = $${paramCount}`;
            params.push(unitId);
        }

        // Filter by role
        if (role) {
            paramCount++;
            query += ` AND u.role = $${paramCount}`;
            params.push(role);
        }

        // Filter by status
        if (status) {
            const isActive = status === 'active';
            paramCount++;
            query += ` AND u.is_active = $${paramCount}`;
            params.push(isActive);
        }

        // Search filter
        if (search) {
            paramCount++;
            query += ` AND (u.full_name ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR u.username ILIKE $${paramCount})`;
            params.push(`%${search}%`);
        }

        query += ' ORDER BY u.created_at DESC';

        const result = await pool.query(query, params);

        res.json({
            success: true,
            users: result.rows,
            total: result.rows.length
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users'
        });
    }
});

// ================================================================================
// GET /api/users/me - Get current user profile
// ================================================================================
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT 
                u.id, u.custom_user_id as username, u.email, u.full_name, u.phone,
                u.role, u.company_id, u.unit_id, u.is_active,
                u.is_email_verified as email_verified, u.last_login_at as last_login,
                u.created_at,
                c.company_name,
                un.unit_name
            FROM users u
            LEFT JOIN companies c ON u.company_id = c.id
            LEFT JOIN units un ON u.unit_id = un.id
            WHERE u.id = $1`,
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user profile'
        });
    }
});

// ================================================================================
// POST /api/users - Create new user (Admin only)
// ================================================================================
router.post('/', authenticateToken, requireRole('super_admin', 'company_admin'), async (req, res) => {
    try {
        const {
            username, email, fullName, phone, password,
            role, companyId, unitId,
            emailVerification, twoFactorAuth
        } = req.body;

        // Sanitize companyId and unitId - convert non-numeric values to null
        const sanitizedCompanyId = companyId && !isNaN(parseInt(companyId)) ? parseInt(companyId) : null;
        const sanitizedUnitId = unitId && !isNaN(parseInt(unitId)) ? parseInt(unitId) : null;

        // Validate required fields
        if (!username || !email || !fullName || !password || !role) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // Check if username or email already exists
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE custom_user_id = $1 OR email = $2',
            [username, email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                error: 'Username or email already exists'
            });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Generate verification token if email verification is required
        let verificationToken = null;
        let verificationExpires = null;

        if (emailVerification) {
            verificationToken = crypto.randomBytes(32).toString('hex');
            verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        }

        // Insert user
        const result = await pool.query(
            `INSERT INTO users (
                custom_user_id, email, full_name, phone, password_hash,
                role, company_id, unit_id,
                is_email_verified, reset_token, reset_token_expires,
                is_active, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, NOW())
            RETURNING id, custom_user_id as username, email, full_name, role`,
            [
                username, email, fullName, phone, passwordHash,
                role, sanitizedCompanyId, sanitizedUnitId,
                !emailVerification, // If verification required, mark as not verified
                verificationToken, verificationExpires
            ]
        );

        const newUser = result.rows[0];

        // Send verification email if required
        if (emailVerification && verificationToken) {
            await emailService.sendVerificationEmail(email, fullName, verificationToken);
        }

        // Send welcome email
        await emailService.sendWelcomeEmail(email, fullName, username, password);

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                fullName: newUser.full_name,
                role: newUser.role,
                emailVerificationSent: emailVerification
            }
        });

    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create user'
        });
    }
});

// ================================================================================
// PUT /api/users/:id - Update user (Admin or self)
// ================================================================================
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const {
            fullName, phone, email,
            role, companyId, unitId,
            isActive
        } = req.body;

        // Check permissions: super_admin can edit anyone, others can only edit themselves
        if (req.user.role !== 'super_admin' && req.user.role !== 'company_admin' && req.user.id !== userId) {
            return res.status(403).json({
                success: false,
                error: 'You can only edit your own profile'
            });
        }

        // Build update query dynamically
        const updates = [];
        const params = [];
        let paramCount = 0;

        if (fullName !== undefined) {
            paramCount++;
            updates.push(`full_name = $${paramCount}`);
            params.push(fullName);
        }

        if (phone !== undefined) {
            paramCount++;
            updates.push(`phone = $${paramCount}`);
            params.push(phone);
        }

        if (email !== undefined) {
            paramCount++;
            updates.push(`email = $${paramCount}`);
            params.push(email);
        }

        // Only admins can change these
        if (req.user.role === 'super_admin' || req.user.role === 'company_admin') {
            if (role !== undefined) {
                paramCount++;
                updates.push(`role = $${paramCount}`);
                params.push(role);
            }

            if (companyId !== undefined) {
                paramCount++;
                updates.push(`company_id = $${paramCount}`);
                params.push(companyId);
            }

            if (unitId !== undefined) {
                paramCount++;
                updates.push(`unit_id = $${paramCount}`);
                params.push(unitId);
            }

            if (isActive !== undefined) {
                paramCount++;
                updates.push(`is_active = $${paramCount}`);
                params.push(isActive);
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'No fields to update'
            });
        }

        paramCount++;
        params.push(userId);

        const query = `
            UPDATE users 
            SET ${updates.join(', ')}, updated_at = NOW()
            WHERE id = $${paramCount}
            RETURNING id, custom_user_id as username, email, full_name, role
        `;

        const result = await pool.query(query, params);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User updated successfully',
            user: result.rows[0]
        });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update user'
        });
    }
});

// ================================================================================
// DELETE /api/users/:id - Delete user (Super Admin only)
// ================================================================================
router.delete('/:id', authenticateToken, requireRole('super_admin'), async (req, res) => {
    try {
        const userId = parseInt(req.params.id);

        // Cannot delete yourself
        if (req.user.id === userId) {
            return res.status(400).json({
                success: false,
                error: 'You cannot delete your own account'
            });
        }

        // Soft delete - set is_active to false
        const result = await pool.query(
            `UPDATE users 
             SET is_active = false, updated_at = NOW()
             WHERE id = $1
             RETURNING custom_user_id as username`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User deactivated successfully'
        });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete user'
        });
    }
});

module.exports = router;
