// ================================================================================
//                    RTWE ERP - MAIN SERVER
//              Updated with Authentication Routes
// ================================================================================

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
const express = require('express');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const { pool, testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

// ================================================================================
// MIDDLEWARE
// ================================================================================

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    store: new pgSession({
        pool: pool,
        tableName: 'user_sessions_express', // Separate table for express-session
        createTableIfMissing: true
    }),
    secret: process.env.SESSION_SECRET || 'rtwe_erp_super_secret_key_12345',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true,
        secure: false, // Set to true in production with HTTPS
        sameSite: 'lax'
    }
}));

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Prevent caching of HTML pages (security - prevent back button access after logout)
app.use((req, res, next) => {
    // Only apply to HTML pages, not CSS/JS/images
    if (req.path.endsWith('.html') || req.path === '/' || !req.path.includes('.')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
    next();
});

// Log all requests
app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
});

// ================================================================================
// ROUTES
// ================================================================================

// Import route modules
const authRoutes = require('./routes/auth');
const masterRoutes = require('./routes/master');
const usersRoutes = require('./routes/users');
const locationRoutes = require('./routes/location');
const selvedgeRoutes = require('./routes/selvedge');
const salesTargetRoutes = require('./routes/sales_target');
const rateMasterRoutes = require('./routes/rate_master');
const vendorsRoutes = require('./routes/vendors');
const vendorGroupsRoutes = require('./routes/vendor_groups');
const vendorPrefixRoutes = require('./routes/vendor_prefix');
const yarnAdjustRoutes = require('./routes/yarn_adjust');
const attendanceRoutes = require('./routes/attendance');
const attendanceExportRoutes = require('./routes/attendance-export');
const salaryRoutes = require('./routes/salary');

// Company & Units Management Routes
const companyRoutes = require('./routes/company');
const unitsRoutes = require('./routes/units');

// Rapier Costing Routes (integrated in backend)
const rapierCostingRoutes = require('./rapier-costing/routes/costing.routes');
const rapierPartyRoutes = require('./rapier-costing/routes/party.routes');
const rapierBrokerRoutes = require('./rapier-costing/routes/broker.routes');

// Import Device Listener for ESSL Attendance
const deviceListener = require('./services/device-listener');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/master/selvedge', selvedgeRoutes);
app.use('/api/master/sales-target', salesTargetRoutes);
app.use('/api/master/rate', rateMasterRoutes);
app.use('/api/master/vendors', vendorsRoutes);
app.use('/api/master/vendor-groups', vendorGroupsRoutes);
app.use('/api/master/vendor-prefix', vendorPrefixRoutes);
app.use('/api/master/yarn-adjust', yarnAdjustRoutes);

// Attendance Routes (ESSLIntegration)
app.use('/api/attendance', attendanceRoutes);
app.use('/api/attendance/export', attendanceExportRoutes);

// Salary Management Routes
app.use('/api/salary', salaryRoutes);

// Company & Units Management Routes
app.use('/api/company', companyRoutes);
app.use('/api/units', unitsRoutes);

// Rapier Costing Routes (re-enabled for now)
app.use('/api/costing', rapierCostingRoutes);
app.use('/api/costing/parties', rapierPartyRoutes);
app.use('/api/costing/brokers', rapierBrokerRoutes);

// Root route
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>RTWE ERP System</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: Arial, sans-serif;
                    background: linear-gradient(135deg, #D7CCC8 0%, #BCAAA4 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                .container {
                    background: white;
                    border-radius: 12px;
                    padding: 40px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                    text-align: center;
                    max-width: 600px;
                }
                h1 { color: #5D4037; margin-bottom: 20px; }
                .status { 
                    background: #E8F5E9;
                    color: #2E7D32;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 20px 0;
                    font-weight: bold;
                }
                .info { 
                    background: #F5F5F5;
                    padding: 15px;
                    border-radius: 8px;
                    margin: 20px 0;
                    text-align: left;
                }
                .info-item { margin: 10px 0; }
                .label { font-weight: bold; color: #5D4037; }
                .btn {
                    display: inline-block;
                    padding: 12px 30px;
                    background: #5D4037;
                    color: white;
                    text-decoration: none;
                    border-radius: 6px;
                    margin: 10px;
                    font-weight: bold;
                    transition: background 0.3s;
                }
                .btn:hover { background: #4E342E; }
                .links { margin-top: 30px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 RTWE ERP Server Running!</h1>
                
                <div class="status">
                    ✅ Server is Active
                </div>
                
                <div class="info">
                    <div class="info-item">
                        <span class="label">Database:</span> Connected ✅
                    </div>
                    <div class="info-item">
                        <span class="label">Port:</span> ${PORT}
                    </div>
                    <div class="info-item">
                        <span class="label">Environment:</span> ${process.env.NODE_ENV || 'development'}
                    </div>
                </div>
                
                    <div class="links">
                    <h3 style="color: #5D4037; margin-bottom: 15px;">Authentication & Admin</h3>
                    <a href="/Login.html" class="btn">Login</a>
                    <a href="/Register.html" class="btn">Register</a>
                    <a href="/Usermanagement.html" class="btn">User Management</a>
                    
                    <h3 style="color: #5D4037; margin: 20px 0 15px;">Main & Master Data</h3>
                    <a href="/dashboard.html" class="btn">Dashboard</a>
                    <a href="/agents.html" class="btn">Agents</a>
                    <a href="/consignees.html" class="btn">Consignees</a>
                    <a href="/domestic-buyers.html" class="btn">Domestic Buyers</a>
                    <a href="/vendors.html" class="btn">Vendors</a>
                    <a href="/vendor-groups.html" class="btn">Vendor Groups</a>
                    <a href="/vendor-prefix.html" class="btn">Vendor Prefixes</a>
                    <a href="/yarn-adjust.html" class="btn">Yarn Adjust</a>
                    <a href="/godown.html" class="btn">Godown</a>
                    <a href="/insurance.html" class="btn">Insurance</a>
                    <a href="/payment-terms.html" class="btn">Payment Terms</a>
                    <a href="/rate-master.html" class="btn">Rate Master</a>
                    <a href="/sales-target.html" class="btn">Sales Target</a>
                    <a href="/selvedge.html" class="btn">Selvedge</a>
                    <a href="/sourcing-by.html" class="btn">Sourcing By</a>
                    <a href="/stock-types.html" class="btn">Stock Types</a>
                    <a href="/terms-conditions.html" class="btn">Terms & Conditions</a>
                    <a href="/transportation.html" class="btn">Transportation</a>
                </div>
                
                <div style="margin-top: 30px; color: #666; font-size: 14px;">
                    API Endpoints: <br>
                    POST /api/auth/login<br>
                    POST /api/auth/register<br>
                    POST /api/auth/logout<br>
                    POST /api/auth/forgot-password<br>
                    POST /api/auth/reset-password<br>
                    GET /api/auth/check-session
                </div>
            </div>
        </body>
        </html>
    `);
});

// Test route
app.get('/api/test', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as time, current_database() as database');
        res.json({
            success: true,
            message: 'Server and database connected!',
            data: {
                serverTime: result.rows[0].time,
                database: result.rows[0].database,
                environment: process.env.NODE_ENV || 'development'
            }
        });
    } catch (error) {
        res.json({
            success: false,
            message: 'Database connection failed',
            error: error.message
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found: ' + req.originalUrl
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// ================================================================================
// START SERVER
// ================================================================================

async function startServer() {
    try {
        // Test database connection
        await testConnection();

        // Start ESSL Device Listener (ADMS Server on port 8080)
        const ENABLE_DEVICE_LISTENER = process.env.ENABLE_DEVICE_LISTENER !== 'false';
        if (ENABLE_DEVICE_LISTENER) {
            console.log('\n🔌 Starting ESSL Device Listener...');
            deviceListener.start();
        }

        // Start listening
        app.listen(PORT, () => {
            console.log('\n==================================================');
            console.log('🚀 RTWE ERP Server Started!');
            console.log('==================================================');
            console.log(`📍 URL: http://localhost:${PORT}`);
            console.log(`📊 Database: ${process.env.DB_NAME}`);
            console.log(`🔐 Authentication: Enabled`);
            console.log(`🕒 ESSL Device Listener: Port 8080`);
            console.log('==================================================\n');
            console.log('📄 Available Pages:');
            console.log(`   - http://localhost:${PORT}/Login.html`);
            console.log(`   - http://localhost:${PORT}/Register.html`);
            console.log(`   - http://localhost:${PORT}/Usermanagement.html`);
            console.log(`   - http://localhost:${PORT}/dashboard.html`);
            console.log(`   - http://localhost:${PORT}/agents.html`);
            console.log(`   - http://localhost:${PORT}/consignees.html`);
            console.log(`   - http://localhost:${PORT}/domestic-buyers.html`);
            console.log(`   - http://localhost:${PORT}/vendors.html`);
            console.log(`   - http://localhost:${PORT}/vendor-groups.html`);
            console.log(`   - http://localhost:${PORT}/vendor-prefix.html`);
            console.log(`   - http://localhost:${PORT}/yarn-adjust.html`);
            console.log(`   - http://localhost:${PORT}/godown.html`);
            console.log(`   - http://localhost:${PORT}/insurance.html`);
            console.log(`   - http://localhost:${PORT}/payment-terms.html`);
            console.log(`   - http://localhost:${PORT}/rate-master.html`);
            console.log(`   - http://localhost:${PORT}/sales-target.html`);
            console.log(`   - http://localhost:${PORT}/selvedge.html`);
            console.log(`   - http://localhost:${PORT}/sourcing-by.html`);
            console.log(`   - http://localhost:${PORT}/stock-types.html`);
            console.log(`   - http://localhost:${PORT}/terms-conditions.html`);
            console.log(`   - http://localhost:${PORT}/transportation.html`);
            console.log(`   - http://localhost:${PORT}/attendance-dashboard.html`);
            console.log('\n📡 Attendance API Endpoints:');
            console.log('   - GET  /api/attendance/today');
            console.log('   - GET  /api/attendance/logs');
            console.log('   - GET  /api/attendance/employees');
            console.log('   - GET  /api/attendance/reports/dashboard-stats');
            console.log('==================================================');
        });

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;
