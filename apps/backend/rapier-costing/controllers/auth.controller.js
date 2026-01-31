// ================================================
// Authentication Controller
// ================================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generate JWT token
 */
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

/**
 * Register new user
 */
exports.register = async (req, res) => {
    try {
        const { username, email, password, fullName, companyName, phone } = req.body;
        
        // Check if user exists
        const existingUser = await User.findOne({
            where: {
                $or: [{ email }, { username }]
            }
        });
        
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email or username already exists'
            });
        }
        
        // Create user
        const user = await User.create({
            username,
            email,
            passwordHash: password, // Will be hashed by beforeCreate hook
            fullName,
            companyName,
            phone
        });
        
        // Generate token
        const token = generateToken(user);
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: user.toPublicJSON()
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering user',
            error: error.message
        });
    }
};

/**
 * Login user
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = await User.findOne({ where: { email } });
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // Check if active
        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated'
            });
        }
        
        // Verify password
        const isValidPassword = await user.comparePassword(password);
        
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }
        
        // Update last login
        await user.update({ lastLogin: new Date() });
        
        // Generate token
        const token = generateToken(user);
        
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: user.toPublicJSON()
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging in',
            error: error.message
        });
    }
};

/**
 * Get current user
 */
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            user: user.toPublicJSON()
        });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user',
            error: error.message
        });
    }
};

/**
 * Refresh token
 */
exports.refreshToken = async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token required'
            });
        }
        
        // Verify old token (ignore expiration)
        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            ignoreExpiration: true
        });
        
        // Get user
        const user = await User.findByPk(decoded.id);
        
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
        
        // Generate new token
        const newToken = generateToken(user);
        
        res.json({
            success: true,
            token: newToken
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid token',
            error: error.message
        });
    }
};

/**
 * Logout user
 */
exports.logout = async (req, res) => {
    try {
        // In a production app, you might want to blacklist the token
        res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Error logging out',
            error: error.message
        });
    }
};
