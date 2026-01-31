/**
 * ============================================================
 * AUTHENTICATION MIDDLEWARE
 * ============================================================
 * Handles JWT authentication, session validation, and authorization
 * ============================================================
 */

const jwt = require('jsonwebtoken');
const db = require('../config/database');

/**
 * Verify JWT token and authenticate user
 */
const authenticateToken = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token required'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user details from database
        const userResult = await db.query(
            `SELECT id, custom_user_id, email, user_name, full_name, role, 
                    company_id, unit_id, is_active, is_email_verified, email_verified,
                    two_factor_enabled, department, phone, telegram_chat_id,
                    account_locked_until
             FROM users 
             WHERE id = $1`,
            [decoded.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = userResult.rows[0];

        // Check if user is active
        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Account is inactive. Please contact administrator.'
            });
        }

        // Check if account is locked
        if (user.account_locked_until && new Date(user.account_locked_until) > new Date()) {
            return res.status(403).json({
                success: false,
                message: 'Account is temporarily locked due to multiple failed login attempts'
            });
        }

        // Attach user to request
        req.user = {
            id: user.id,
            userId: user.id,
            fullName: user.full_name || user.user_name,
            email: user.email,
            username: user.custom_user_id,
            role: user.role,
            companyId: user.company_id,
            unitId: user.unit_id,
            emailVerified: user.email_verified || user.is_email_verified,
            twoFactorEnabled: user.two_factor_enabled,
            department: user.department,
            phone: user.phone,
            telegramChatId: user.telegram_chat_id
        };

        req.sessionToken = token;

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        console.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication failed'
        });
    }
};

/**
 * Require email verification
 */
const requireEmailVerification = (req, res, next) => {
    if (process.env.EMAIL_VERIFICATION_REQUIRED === 'true') {
        if (!req.user.emailVerified) {
            return res.status(403).json({
                success: false,
                message: 'Email verification required. Please verify your email to continue.',
                requiresEmailVerification: true
            });
        }
    }
    next();
};

/**
 * Check if user has specific role(s)
 * @param {string|array} roles - Required role(s)
 */
const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        const userRole = req.user.role;
        const allowedRoles = Array.isArray(roles[0]) ? roles[0] : roles;

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions',
                required: allowedRoles,
                current: userRole
            });
        }

        next();
    };
};

/**
 * Check if user can access specific company
 */
const requireCompanyAccess = (req, res, next) => {
    const companyId = parseInt(req.params.companyId || req.body.companyId || req.query.companyId);

    if (!companyId) {
        return res.status(400).json({
            success: false,
            message: 'Company ID required'
        });
    }

    // Super admin can access all companies
    if (req.user.role === 'super_admin') {
        return next();
    }

    // Check if user belongs to this company
    if (req.user.companyId !== companyId) {
        return res.status(403).json({
            success: false,
            message: 'Access denied to this company'
        });
    }

    next();
};

/**
 * Check if user can access specific unit
 */
const requireUnitAccess = (req, res, next) => {
    const unitId = parseInt(req.params.unitId || req.body.unitId || req.query.unitId);

    if (!unitId) {
        return res.status(400).json({
            success: false,
            message: 'Unit ID required'
        });
    }

    // Super admin and users with all units access can access any unit
    if (req.user.role === 'super_admin' || req.user.canAccessAllUnits) {
        return next();
    }

    // Check if user belongs to this unit
    if (req.user.unitId !== unitId) {
        return res.status(403).json({
            success: false,
            message: 'Access denied to this unit'
        });
    }

    next();
};

/**
 * Check if user has specific permission for a module
 * @param {string} module - Module name
 * @param {string} action - Action name (view, create, edit, delete, export)
 */
const requirePermission = (module, action) => {
    return async (req, res, next) => {
        try {
            // Super admin has all permissions
            if (req.user.role === 'super_admin') {
                return next();
            }

            // Check user permissions
            const permissionCheck = await db.query(
                `SELECT can_${action} FROM user_permissions 
                 WHERE user_id = $1 AND module_name = $2`,
                [req.user.id, module]
            );

            if (permissionCheck.rows.length === 0 || !permissionCheck.rows[0][`can_${action}`]) {
                return res.status(403).json({
                    success: false,
                    message: `You don't have permission to ${action} ${module}`
                });
            }

            next();
        } catch (error) {
            console.error('Permission check error:', error);
            return res.status(500).json({
                success: false,
                message: 'Permission check failed'
            });
        }
    };
};

/**
 * Optional authentication (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return next();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const userResult = await db.query(
            `SELECT u.*, c.company_name, un.unit_name 
             FROM users u
             LEFT JOIN companies c ON u.company_id = c.id
             LEFT JOIN units un ON u.unit_id = un.id
             WHERE u.id = $1 AND u.deleted_at IS NULL AND u.status = 'active'`,
            [decoded.userId]
        );

        if (userResult.rows.length > 0) {
            const user = userResult.rows[0];
            req.user = {
                id: user.id,
                employeeId: user.employee_id,
                fullName: user.full_name,
                email: user.email,
                username: user.username,
                role: user.role,
                companyId: user.company_id,
                companyName: user.company_name,
                unitId: user.unit_id,
                unitName: user.unit_name,
                canAccessAllUnits: user.can_access_all_units
            };
        }

        next();
    } catch (error) {
        // Don't fail on error, just continue without user
        next();
    }
};

/**
 * Rate limiting check (to be used with express-rate-limit)
 */
const checkRateLimit = (req, res, next) => {
    // This will be handled by express-rate-limit middleware
    // This is just a placeholder for custom logic if needed
    next();
};

/**
 * IP whitelist check (optional)
 */
const checkIPWhitelist = (req, res, next) => {
    if (process.env.IP_WHITELIST) {
        const allowedIPs = process.env.IP_WHITELIST.split(',');
        const clientIP = req.ip || req.connection.remoteAddress;

        if (!allowedIPs.includes(clientIP)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied from this IP address'
            });
        }
    }
    next();
};

/**
 * Generate JWT token
 * @param {object} payload - Token payload
 * @param {string} expiresIn - Token expiration
 * @returns {string} JWT token
 */
const generateToken = (payload, expiresIn = process.env.JWT_EXPIRES_IN) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Generate refresh token
 * @param {object} payload - Token payload
 * @returns {string} Refresh token
 */
const generateRefreshToken = (payload) => {
    return jwt.sign(
        payload,
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );
};

/**
 * Verify refresh token
 * @param {string} token - Refresh token
 * @returns {object} Decoded token
 */
const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

/**
 * Create user session
 * @param {number} userId - User ID
 * @param {string} token - Session token
 * @param {object} req - Express request object
 * @returns {Promise} Session creation result
 */
const createSession = async (userId, token, req) => {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    return await db.query(
        `INSERT INTO user_sessions (user_id, session_token, ip_address, user_agent, expires_at)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
            userId,
            token,
            req.ip || req.connection.remoteAddress,
            req.get('user-agent'),
            expiresAt
        ]
    );
};

/**
 * Invalidate session
 * @param {string} token - Session token
 * @param {string} reason - Logout reason
 * @returns {Promise} Invalidation result
 */
const invalidateSession = async (token, reason = 'manual') => {
    return await db.query(
        `UPDATE user_sessions 
         SET is_active = false, logout_at = NOW(), logout_reason = $2
         WHERE session_token = $1`,
        [token, reason]
    );
};

/**
 * Invalidate all user sessions
 * @param {number} userId - User ID
 * @param {string} reason - Logout reason
 * @returns {Promise} Invalidation result
 */
const invalidateAllUserSessions = async (userId, reason = 'forced') => {
    return await db.query(
        `UPDATE user_sessions 
         SET is_active = false, logout_at = NOW(), logout_reason = $2
         WHERE user_id = $1 AND is_active = true`,
        [userId, reason]
    );
};

/**
 * Clean expired sessions
 * @returns {Promise} Cleanup result
 */
const cleanExpiredSessions = async () => {
    return await db.query(
        `UPDATE user_sessions 
         SET is_active = false, logout_at = NOW(), logout_reason = 'timeout'
         WHERE is_active = true AND expires_at < NOW()`
    );
};

/**
 * Hybrid authentication - supports both JWT and express-session
 * Checks express-session first (for backward compatibility), then JWT
 */
const validateSession = async (req, res, next) => {
    // Check express-session first (backward compatibility for attendance system)
    if (req.session && req.session.userId) {
        // Session exists - populate req.user for consistency
        req.user = {
            id: req.session.userId,
            fullName: req.session.userName,
            email: req.session.email,
            username: req.session.userName,
            role: req.session.userRole || 'user'
        };
        req.userId = req.session.userId;
        req.userName = req.session.userName;
        req.userRole = req.session.userRole;
        return next();
    }

    // No session - try JWT authentication
    return authenticateToken(req, res, next);
};

module.exports = {
    authenticateToken,
    validateSession, // Hybrid authentication (session + JWT)
    requireEmailVerification,
    requireRole,
    requireCompanyAccess,
    requireUnitAccess,
    requirePermission,
    optionalAuth,
    checkRateLimit,
    checkIPWhitelist,
    generateToken,
    generateRefreshToken,
    verifyRefreshToken,
    createSession,
    invalidateSession,
    invalidateAllUserSessions,
    cleanExpiredSessions
};
