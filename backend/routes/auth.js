// ================================================================================
//                    AUTHENTICATION ROUTES
//     JWT-based authentication with email verification and 2FA
// ================================================================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool } = require('../config/database');
const { generateToken, generateRefreshToken, authenticateToken } = require('../middleware/auth');
const emailService = require('../services/emailService');
const twoFactorService = require('../services/twoFactorService');

// ================================================================================
// POST /api/auth/login - User login
// ================================================================================
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username and password are required'
            });
        }

        // Find user by username, email, or custom_user_id
        const result = await pool.query(
            `SELECT * FROM users 
             WHERE (custom_user_id = $1 OR email = $1) 
             AND is_active = true`,
            [username]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        const user = result.rows[0];

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid credentials'
            });
        }

        // Check if email is verified (check both columns for compatibility)
        const isEmailVerified = user.email_verified || user.is_email_verified;
        if (!isEmailVerified) {
            return res.status(403).json({
                success: false,
                error: 'Email not verified',
                requiresVerification: true,
                userId: user.id
            });
        }

        // Check if 2FA is enabled
        if (user.two_factor_enabled) {
            // Return temporary token for 2FA verification
            return res.json({
                success: true,
                requires2FA: true,
                tempUserId: user.id,
                message: 'Please enter your 2FA code'
            });
        }

        // Generate JWT tokens with proper payload
        const tokenPayload = {
            userId: user.id,
            email: user.email,
            role: user.role
        };

        const token = generateToken(tokenPayload, '24h');
        const refreshToken = generateRefreshToken(tokenPayload);

        // Generate session ID and calculate expiry
        const sessionId = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Create session record
        await pool.query(
            `INSERT INTO user_sessions (user_id, session_id, refresh_token, ip_address, user_agent, expires_at)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [user.id, sessionId, refreshToken, req.ip, req.headers['user-agent'], expiresAt]
        );

        // Populate express-session for cookie-based authentication (used by attendance pages)
        if (req.session) {
            req.session.userId = user.id;
            req.session.userName = user.full_name || user.user_name;
            req.session.email = user.email;
            req.session.userRole = user.role;
        }

        // Update last login
        await pool.query(
            'UPDATE users SET last_login_at = NOW() WHERE id = $1',
            [user.id]
        );

        // Return user data and tokens
        res.json({
            success: true,
            token,
            refreshToken,
            user: {
                id: user.id,
                username: user.custom_user_id,
                email: user.email,
                fullName: user.full_name || user.user_name,
                role: user.role,
                companyId: user.company_id,
                unitId: user.unit_id,
                emailVerified: user.email_verified || user.is_email_verified,
                twoFactorEnabled: user.two_factor_enabled
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed. Please try again.'
        });
    }
});

// ================================================================================
// POST /api/auth/verify-2fa - Verify 2FA code during login
// ================================================================================
router.post('/verify-2fa', async (req, res) => {
    try {
        const { userId, code } = req.body;

        if (!userId || !code) {
            return res.status(400).json({
                success: false,
                error: 'User ID and code are required'
            });
        }

        // Get user
        const result = await pool.query(
            'SELECT * FROM users WHERE user_id = $1 AND is_active = true',
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const user = result.rows[0];

        if (!user.two_factor_secret) {
            return res.status(400).json({
                success: false,
                error: '2FA not enabled for this user'
            });
        }

        // Verify TOTP code
        const isValid = twoFactorService.verifyToken(user.two_factor_secret, code);

        if (!isValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid 2FA code'
            });
        }

        // Generate JWT tokens
        const token = generateToken(user);
        const refreshToken = generateRefreshToken(user);

        // Generate session ID and calculate expiry
        const sessionId = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        // Create session
        await pool.query(
            `INSERT INTO user_sessions (user_id, session_id, refresh_token, ip_address, user_agent, expires_at)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [user.user_id, sessionId, refreshToken, req.ip, req.headers['user-agent'], expiresAt]
        );

        // Update last login
        await pool.query(
            'UPDATE users SET last_login = NOW() WHERE user_id = $1',
            [user.user_id]
        );

        res.json({
            success: true,
            token,
            refreshToken,
            user: {
                id: user.user_id,
                username: user.username,
                email: user.email,
                fullName: user.full_name,
                role: user.role,
                companyId: user.company_id,
                unitId: user.unit_id
            }
        });

    } catch (error) {
        console.error('2FA verification error:', error);
        res.status(500).json({
            success: false,
            error: '2FA verification failed'
        });
    }
});

// ================================================================================
// POST /api/auth/logout - User logout
// ================================================================================
router.post('/logout', authenticateToken, async (req, res) => {
    try {
        const refreshToken = req.body.refreshToken;

        if (refreshToken) {
            // Invalidate refresh token
            await pool.query(
                'UPDATE user_sessions SET is_active = false WHERE refresh_token = $1',
                [refreshToken]
            );
        }

        res.json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: 'Logout failed'
        });
    }
});

// ================================================================================
// GET /api/auth/check-session - Check if session is valid
// ================================================================================
router.get('/check-session', authenticateToken, async (req, res) => {
    try {
        // Get user details from database
        const result = await pool.query(
            `SELECT id, custom_user_id, email, user_name, full_name, role, 
                    company_id, unit_id, is_email_verified, email_verified, 
                    two_factor_enabled, department, phone, telegram_chat_id
             FROM users 
             WHERE id = $1 AND is_active = true`,
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found or inactive'
            });
        }

        const user = result.rows[0];

        res.json({
            success: true,
            user: {
                id: user.id,
                username: user.custom_user_id,
                email: user.email,
                fullName: user.full_name || user.user_name,
                role: user.role,
                companyId: user.company_id,
                unitId: user.unit_id,
                emailVerified: user.email_verified || user.is_email_verified,
                twoFactorEnabled: user.two_factor_enabled,
                department: user.department,
                phone: user.phone,
                telegramChatId: user.telegram_chat_id
            }
        });

    } catch (error) {
        console.error('Check session error:', error);
        res.status(500).json({
            success: false,
            error: 'Session check failed'
        });
    }
});

// ================================================================================
// POST /api/auth/verify-email - Verify email address
// ================================================================================
router.post('/verify-email', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({
                success: false,
                error: 'Verification token is required'
            });
        }

        // Find user with this verification token
        const result = await pool.query(
            `SELECT * FROM users 
             WHERE verification_token = $1 
             AND verification_token_expires > NOW()`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Invalid or expired verification token'
            });
        }

        const user = result.rows[0];

        // Mark email as verified
        await pool.query(
            `UPDATE users 
             SET email_verified = true, 
                 verification_token = NULL, 
                 verification_token_expires = NULL 
             WHERE user_id = $1`,
            [user.user_id]
        );

        res.json({
            success: true,
            message: 'Email verified successfully! You can now log in.'
        });

    } catch (error) {
        console.error('Email verification error:', error);
        res.status(500).json({
            success: false,
            error: 'Email verification failed'
        });
    }
});

// ================================================================================
// POST /api/auth/enable-2fa - Enable 2FA for user
// ================================================================================
router.post('/enable-2fa', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Generate 2FA secret
        const secret = twoFactorService.generateSecret(req.user.email);

        // Generate QR code
        const qrCode = await twoFactorService.generateQRCode(
            req.user.email,
            secret.base32
        );

        // Generate backup codes
        const backupCodes = twoFactorService.generateBackupCodes();

        // Save encrypted secret and backup codes to database
        await pool.query(
            `UPDATE users 
             SET two_factor_secret = $1, 
                 two_factor_backup_codes = $2 
             WHERE user_id = $3`,
            [secret.base32, JSON.stringify(backupCodes), userId]
        );

        res.json({
            success: true,
            qrCode,
            secret: secret.base32,
            backupCodes,
            message: 'Scan QR code with your authenticator app'
        });

    } catch (error) {
        console.error('Enable 2FA error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to enable 2FA'
        });
    }
});

// ================================================================================
// POST /api/auth/confirm-2fa - Confirm 2FA setup
// ================================================================================
router.post('/confirm-2fa', authenticateToken, async (req, res) => {
    try {
        const { code } = req.body;
        const userId = req.user.id;

        if (!code) {
            return res.status(400).json({
                success: false,
                error: 'Verification code is required'
            });
        }

        // Get user's secret
        const result = await pool.query(
            'SELECT two_factor_secret FROM users WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0 || !result.rows[0].two_factor_secret) {
            return res.status(400).json({
                success: false,
                error: '2FA not initialized'
            });
        }

        const secret = result.rows[0].two_factor_secret;

        // Verify code
        const isValid = twoFactorService.verifyToken(secret, code);

        if (!isValid) {
            return res.status(401).json({
                success: false,
                error: 'Invalid verification code'
            });
        }

        // Enable 2FA
        await pool.query(
            'UPDATE users SET two_factor_enabled = true WHERE user_id = $1',
            [userId]
        );

        res.json({
            success: true,
            message: '2FA enabled successfully!'
        });

    } catch (error) {
        console.error('Confirm 2FA error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to confirm 2FA'
        });
    }
});

// ================================================================================
// POST /api/auth/disable-2fa - Disable 2FA
// ================================================================================
router.post('/disable-2fa', authenticateToken, async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.user.id;

        if (!password) {
            return res.status(400).json({
                success: false,
                error: 'Password is required to disable 2FA'
            });
        }

        // Verify password
        const result = await pool.query(
            'SELECT password_hash FROM users WHERE user_id = $1',
            [userId]
        );

        const validPassword = await bcrypt.compare(password, result.rows[0].password_hash);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid password'
            });
        }

        // Disable 2FA
        await pool.query(
            `UPDATE users 
             SET two_factor_enabled = false, 
                 two_factor_secret = NULL, 
                 two_factor_backup_codes = NULL 
             WHERE user_id = $1`,
            [userId]
        );

        res.json({
            success: true,
            message: '2FA disabled successfully'
        });

    } catch (error) {
        console.error('Disable 2FA error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to disable 2FA'
        });
    }
});

module.exports = router;
