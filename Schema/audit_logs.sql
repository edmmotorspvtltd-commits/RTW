-- ================================================================================
--                    RTWE ERP - AUTHENTICATION DATABASE SCHEMA
--              Complete Schema for Login, Register, User Management & Audit
-- ================================================================================
-- 
-- Based on your HTML files:
-- - Login.html
-- - Register.html
-- - Forgotpassword.html
-- - Resetpassword.html
-- - Usermanagement.html
-- - Auditlog.html
--
-- This schema creates 4 core tables for complete authentication system
--
-- ================================================================================

-- ================================================================================
-- TABLE 1: USERS
-- ================================================================================
-- Purpose: Store all user accounts
-- Features: Password hashing, roles, account lockout, email verification, reset tokens
-- ================================================================================

CREATE TABLE users (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Basic User Info (from Register.html)
    user_name VARCHAR(200) NOT NULL,                    -- Full name (e.g., "John Doe")
    email VARCHAR(255) UNIQUE NOT NULL,                 -- Email address (unique, for login)
    custom_user_id VARCHAR(50) UNIQUE NOT NULL,         -- Username (e.g., "john_doe")
    password_hash VARCHAR(255) NOT NULL,                -- Hashed password (bcrypt)
    
    -- Additional Info
    phone VARCHAR(20),                                  -- Phone number
    telegram_chat_id VARCHAR(100),                      -- Telegram Chat ID for notifications
    
    -- Role & Permissions
    role VARCHAR(50) DEFAULT 'user',                    -- Role: 'admin', 'manager', 'user'
    department VARCHAR(100),                            -- Department (optional)
    permissions JSONB DEFAULT '{}',                     -- Custom permissions (JSON)
    
    -- Account Status
    is_active BOOLEAN DEFAULT true,                     -- Account active/inactive
    is_email_verified BOOLEAN DEFAULT false,            -- Email verified flag
    email_verified_at TIMESTAMP,                        -- When email was verified
    
    -- Security - Password Reset
    reset_token VARCHAR(100),                           -- Password reset token
    reset_token_expires TIMESTAMP,                      -- Token expiry (1 hour)
    
    -- Security - Account Lockout (after failed login attempts)
    failed_login_attempts INTEGER DEFAULT 0,            -- Failed login count
    last_failed_login TIMESTAMP,                        -- Last failed attempt
    account_locked_until TIMESTAMP,                     -- Lock expires at
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT NOW(),                 -- Account created date
    created_by INTEGER REFERENCES users(id),            -- Who created this user
    updated_at TIMESTAMP DEFAULT NOW(),                 -- Last update
    updated_by INTEGER REFERENCES users(id),            -- Who updated
    last_login_at TIMESTAMP,                            -- Last successful login
    
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
-- Purpose: Manage user login sessions
-- Features: Session tracking, device info, IP address, expiry
-- ================================================================================

CREATE TABLE user_sessions (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- Session Info
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE NOT NULL,            -- Unique session identifier
    
    -- Device & Location Info
    ip_address VARCHAR(45),                             -- IPv4 or IPv6
    user_agent TEXT,                                    -- Browser user agent string
    device_type VARCHAR(50),                            -- 'desktop', 'mobile', 'tablet'
    browser VARCHAR(100),                               -- Browser name and version
    os VARCHAR(100),                                    -- Operating system
    location JSONB,                                     -- Location data (optional)
    
    -- Session Status
    is_active BOOLEAN DEFAULT true,                     -- Session active/inactive
    expires_at TIMESTAMP NOT NULL,                      -- Session expiry (24 hours default)
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),                 -- Session created
    last_activity_at TIMESTAMP DEFAULT NOW(),           -- Last activity
    logged_out_at TIMESTAMP                             -- When user logged out
);

-- Indexes for user_sessions table
CREATE INDEX idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_sessions_session_id ON user_sessions(session_id);
CREATE INDEX idx_sessions_is_active ON user_sessions(is_active);
CREATE INDEX idx_sessions_expires_at ON user_sessions(expires_at);

-- ================================================================================
-- TABLE 3: AUDIT_LOGS
-- ================================================================================
-- Purpose: Track all system actions (from Auditlog.html)
-- Features: Complete audit trail, JSON storage for changes, filterable
-- ================================================================================

CREATE TABLE audit_logs (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- User Info
    user_id INTEGER REFERENCES users(id),               -- Who performed the action
    user_name VARCHAR(200),                             -- Username (denormalized)
    session_id VARCHAR(255),                            -- Session identifier
    
    -- Action Details
    action_type VARCHAR(50) NOT NULL,                   -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT'
    action_category VARCHAR(50),                        -- 'USER', 'SORT_MASTER', 'SETTINGS', etc.
    action_description TEXT,                            -- Human-readable description
    
    -- Target Info
    target_table VARCHAR(100),                          -- Table affected (e.g., 'users')
    target_id VARCHAR(100),                             -- Record ID affected
    
    -- Change Tracking (JSON)
    old_values JSONB,                                   -- Before values (for UPDATE/DELETE)
    new_values JSONB,                                   -- After values (for CREATE/UPDATE)
    
    -- Request Info
    ip_address VARCHAR(45),                             -- IP address of request
    user_agent TEXT,                                    -- Browser/client info
    http_method VARCHAR(10),                            -- GET, POST, PUT, DELETE
    request_url TEXT,                                   -- API endpoint called
    request_params JSONB,                               -- Request parameters
    
    -- Result
    status VARCHAR(20),                                 -- 'SUCCESS', 'FAILED', 'ERROR'
    error_message TEXT,                                 -- Error details (if failed)
    
    -- Timestamp
    created_at TIMESTAMP DEFAULT NOW()                  -- When action occurred
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
-- Purpose: Track all login attempts (successful and failed)
-- Features: Track failures, detect brute force, security monitoring
-- ================================================================================

CREATE TABLE login_history (
    -- Primary Key
    id SERIAL PRIMARY KEY,
    
    -- User Info
    user_id INTEGER REFERENCES users(id),               -- User who attempted login
    username VARCHAR(255),                              -- Username/email used (even if wrong)
    
    -- Login Result
    login_status VARCHAR(20) NOT NULL,                  -- 'SUCCESS', 'FAILED'
    failure_reason VARCHAR(100),                        -- 'INVALID_PASSWORD', 'ACCOUNT_LOCKED', 'USER_NOT_FOUND'
    
    -- Device & Location Info
    ip_address VARCHAR(45),                             -- IP address
    user_agent TEXT,                                    -- Browser info
    device_type VARCHAR(50),                            -- 'desktop', 'mobile', 'tablet'
    browser VARCHAR(100),                               -- Browser name
    os VARCHAR(100),                                    -- Operating system
    location JSONB,                                     -- Location data (optional)
    
    -- Timestamp
    attempted_at TIMESTAMP DEFAULT NOW(),               -- When login was attempted
    
    -- Constraints
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

-- Function: Clean expired sessions (optional - run periodically)
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
-- INITIAL DATA - CREATE ADMIN USER
-- ================================================================================

-- Insert default admin user
-- Username: admin
-- Email: admin@rtwe.com
-- Password: admin123 (hashed with bcrypt)
-- Note: Change password immediately after first login!

INSERT INTO users (
    user_name,
    email,
    custom_user_id,
    password_hash,
    role,
    is_active,
    is_email_verified
) VALUES (
    'System Administrator',
    'admin@rtwe.com',
    'admin',
    '$2b$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', -- Password: admin123
    'admin',
    true,
    true
);

-- ================================================================================
-- VERIFICATION QUERIES
-- ================================================================================

-- Check all tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check admin user created
SELECT id, user_name, email, custom_user_id, role, is_active
FROM users
WHERE role = 'admin';

-- Check indexes created
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ================================================================================
-- SAMPLE QUERIES FOR TESTING
-- ================================================================================

-- Get all active users
SELECT id, user_name, email, custom_user_id, role, created_at
FROM users
WHERE is_active = true
ORDER BY created_at DESC;

-- Get user login history
SELECT 
    lh.attempted_at,
    u.user_name,
    lh.login_status,
    lh.failure_reason,
    lh.ip_address,
    lh.browser
FROM login_history lh
LEFT JOIN users u ON lh.user_id = u.id
ORDER BY lh.attempted_at DESC
LIMIT 20;

-- Get recent audit logs
SELECT 
    al.created_at,
    al.user_name,
    al.action_type,
    al.action_category,
    al.action_description,
    al.status
FROM audit_logs al
ORDER BY al.created_at DESC
LIMIT 50;

-- Get active sessions
SELECT 
    us.session_id,
    u.user_name,
    u.email,
    us.ip_address,
    us.device_type,
    us.browser,
    us.created_at,
    us.last_activity_at,
    us.expires_at
FROM user_sessions us
JOIN users u ON us.user_id = u.id
WHERE us.is_active = true
AND us.expires_at > NOW()
ORDER BY us.last_activity_at DESC;

-- Get failed login attempts by IP
SELECT 
    ip_address,
    COUNT(*) as failed_attempts,
    MAX(attempted_at) as last_attempt
FROM login_history
WHERE login_status = 'FAILED'
AND attempted_at > NOW() - INTERVAL '24 hours'
GROUP BY ip_address
HAVING COUNT(*) > 3
ORDER BY failed_attempts DESC;

-- Check locked accounts
SELECT 
    id,
    user_name,
    email,
    failed_login_attempts,
    account_locked_until
FROM users
WHERE account_locked_until > NOW()
ORDER BY account_locked_until DESC;

-- ================================================================================
-- MAINTENANCE QUERIES
-- ================================================================================

-- Clean expired sessions (manual run)
SELECT clean_expired_sessions();

-- Reset failed login attempts for a user
UPDATE users
SET 
    failed_login_attempts = 0,
    account_locked_until = NULL,
    last_failed_login = NULL
WHERE email = 'user@example.com';

-- Manually expire a session
UPDATE user_sessions
SET 
    is_active = false,
    logged_out_at = NOW()
WHERE session_id = 'your-session-id-here';

-- Delete old audit logs (older than 90 days)
DELETE FROM audit_logs
WHERE created_at < NOW() - INTERVAL '90 days';

-- Delete old login history (older than 90 days)
DELETE FROM login_history
WHERE attempted_at < NOW() - INTERVAL '90 days';

-- ================================================================================
-- SECURITY NOTES
-- ================================================================================

/*
IMPORTANT SECURITY CONSIDERATIONS:

1. PASSWORD HASHING:
   - Always use bcrypt with salt rounds >= 10
   - Never store plain text passwords
   - Default admin password MUST be changed

2. SESSION SECURITY:
   - Sessions expire after 24 hours
   - Store session_id in httpOnly cookies
   - Use HTTPS in production
   - Implement CSRF tokens

3. ACCOUNT LOCKOUT:
   - Account locks after 5 failed attempts
   - Lock duration: 30 minutes
   - Can be manually unlocked by admin

4. PASSWORD RESET:
   - Reset tokens expire after 1 hour
   - Tokens are single-use
   - Invalidate all sessions on password change

5. AUDIT LOGGING:
   - All authentication events logged
   - All data changes tracked
   - Store IP address and device info
   - Regular log cleanup recommended

6. DATA RETENTION:
   - Keep audit logs for 90 days minimum
   - Archive old logs if needed
   - Clean expired sessions daily

7. PERMISSIONS:
   - Use role-based access control
   - Principle of least privilege
   - Regular permission audits
*/

-- ================================================================================
-- END OF SCHEMA
-- ================================================================================