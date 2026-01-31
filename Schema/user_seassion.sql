-- ================================================================================
--              COMPLETE CLEAN INSTALL - DROP ALL + CREATE NEW
--              Run this to start completely fresh
-- ================================================================================

-- ================================================================================
-- STEP 1: DROP ALL EXISTING TABLES (IF ANY)
-- ================================================================================

-- Drop tables in correct order (respect foreign key constraints)
DROP TABLE IF EXISTS login_history CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop any old tables from previous attempts
DROP TABLE IF EXISTS sales_orders CASCADE;
DROP TABLE IF EXISTS sales_order_items CASCADE;
DROP TABLE IF EXISTS sales_order_ite CASCADE;
DROP TABLE IF EXISTS sales_order_ad CASCADE;
DROP TABLE IF EXISTS buyers CASCADE;
DROP TABLE IF EXISTS consignees CASCADE;
DROP TABLE IF EXISTS designs CASCADE;
DROP TABLE IF EXISTS qualities CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS clean_expired_sessions() CASCADE;

-- Verify all tables are dropped
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- Should return empty (no tables)

-- ================================================================================
-- STEP 2: CREATE FRESH SCHEMA
-- ================================================================================

-- ================================================================================
-- TABLE 1: USERS
-- ================================================================================

CREATE TABLE users (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Basic User Info (from Register.html)
    user_name VARCHAR(200) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    custom_user_id VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Additional Info
    phone VARCHAR(20),
    telegram_chat_id VARCHAR(100),
    
    -- Role & Permissions
    role VARCHAR(50) DEFAULT 'user',
    department VARCHAR(100),
    permissions JSONB DEFAULT '{}',
    
    -- Account Status
    is_active BOOLEAN DEFAULT true,
    is_email_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP,
    
    -- Security - Password Reset
    reset_token VARCHAR(100),
    reset_token_expires TIMESTAMP,
    
    -- Security - Account Lockout
    failed_login_attempts INTEGER DEFAULT 0,
    last_failed_login TIMESTAMP,
    account_locked_until TIMESTAMP,
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT NOW(),
    created_by INTEGER REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by INTEGER REFERENCES users(id),
    last_login_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_role CHECK (role IN ('admin', 'manager', 'user')),
    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_custom_user_id_format CHECK (custom_user_id ~ '^[a-zA-Z0-9_]{3,50}$')
);

-- Indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_custom_user_id ON users(custom_user_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_reset_token ON users(reset_token);

-- ================================================================================
-- TABLE 2: USER_SESSIONS
-- ================================================================================

CREATE TABLE user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100),
    location JSONB,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    last_activity_at TIMESTAMP DEFAULT NOW(),
    logged_out_at TIMESTAMP
);

-- Indexes for user_sessions table
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_session_id ON user_sessions(session_id);
CREATE INDEX idx_sessions_is_active ON user_sessions(is_active);
CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at);

-- ================================================================================
-- TABLE 3: AUDIT_LOGS
-- ================================================================================

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    user_name VARCHAR(200),
    session_id VARCHAR(255),
    action_type VARCHAR(50) NOT NULL,
    action_category VARCHAR(50),
    action_description TEXT,
    target_table VARCHAR(100),
    target_id VARCHAR(100),
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    http_method VARCHAR(10),
    request_url TEXT,
    request_params JSONB,
    status VARCHAR(20),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for audit_logs table
CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_action_type ON audit_logs(action_type);
CREATE INDEX idx_audit_action_category ON audit_logs(action_category);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_status ON audit_logs(status);
CREATE INDEX idx_audit_target_table ON audit_logs(target_table);

-- ================================================================================
-- TABLE 4: LOGIN_HISTORY
-- ================================================================================

CREATE TABLE login_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    username VARCHAR(255),
    login_status VARCHAR(20) NOT NULL,
    failure_reason VARCHAR(100),
    ip_address VARCHAR(45),
    user_agent TEXT,
    device_type VARCHAR(50),
    browser VARCHAR(100),
    os VARCHAR(100),
    location JSONB,
    attempted_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT chk_login_status CHECK (login_status IN ('SUCCESS', 'FAILED'))
);

-- Indexes for login_history table
CREATE INDEX idx_login_history_user_id ON login_history(user_id);
CREATE INDEX idx_login_history_username ON login_history(username);
CREATE INDEX idx_login_history_status ON login_history(login_status);
CREATE INDEX idx_login_history_attempted_at ON login_history(attempted_at DESC);
CREATE INDEX idx_login_history_ip_address ON login_history(ip_address);

-- ================================================================================
-- FUNCTIONS & TRIGGERS
-- ================================================================================

-- Function: Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at on users table
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function: Clean expired sessions
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_sessions
    WHERE expires_at < NOW()
    AND is_active = false;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ================================================================================
-- INSERT ADMIN USER (YOUR ACCOUNT)
-- ================================================================================

INSERT INTO users (
    user_name,
    email,
    custom_user_id,
    password_hash,
    role,
    phone,
    telegram_chat_id,
    is_active,
    is_email_verified,
    department,
    created_at
) VALUES (
    'Shekhar Jha',
    'shekhar.jha@ramratantechnoweave.com',
    'admin',
    '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa',
    'admin',
    NULL,
    NULL,
    true,
    true,
    'Administration',
    NOW()
);

-- ================================================================================
-- VERIFICATION
-- ================================================================================

-- Check tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Should show:
-- audit_logs
-- login_history
-- user_sessions
-- users

-- Check admin user created
SELECT id, user_name, email, custom_user_id, role, is_active
FROM users
WHERE role = 'admin';

-- Should show:
-- id: 1
-- user_name: Shekhar Jha
-- email: shekhar.jha@ramratantechnoweave.com
-- custom_user_id: admin
-- role: admin
-- is_active: true

-- Check indexes created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Should show 15+ indexes

-- ================================================================================
-- SUCCESS MESSAGE
-- ================================================================================

SELECT 
    '✅ SUCCESS!' as status,
    'All tables created' as message,
    COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

SELECT 
    '✅ ADMIN USER CREATED' as status,
    user_name,
    email,
    custom_user_id,
    role
FROM users
WHERE custom_user_id = 'admin';

-- ================================================================================
-- LOGIN CREDENTIALS
-- ================================================================================

/*
YOUR ADMIN LOGIN:
-----------------
Username: admin
Email: shekhar.jha@ramratantechnoweave.com
Password: admin123
Role: admin

⚠️ IMPORTANT: Change password after first login!

NEXT STEPS:
-----------
1. ✅ Tables created
2. ✅ Admin user created
3. 📝 Create backend routes (auth.js, admin.js)
4. 📝 Update HTML files
5. ✅ Test login
6. 🎉 Working authentication system!
*/

-- ================================================================================
-- END OF SCRIPT
-- ================================================================================