-- ================================================================================
-- CREATE SUPER ADMIN - ADAPTED FOR EXISTING SCHEMA
-- Execute AFTER running add_jwt_auth_columns.sql
-- ================================================================================

-- Insert super admin with existing table structure
INSERT INTO public.users (
    user_name,
    email,
    custom_user_id,
    password_hash,
    phone,
    role,
    full_name,
    company_id,
    unit_id,
    is_active,
    is_email_verified,
    email_verified,
    two_factor_enabled,
    created_at,
    updated_at
) VALUES (
    'System Administrator',                                     -- user_name
    'admin@rtwe.com',                                          -- email
    'admin',                                                    -- custom_user_id
    '$2b$10$xqKVh7WdLzV5QxJZH0P8AOs0Y.z8PxGX2ZK6uGZHvqYjH3r7VKr3u',  -- password_hash for "Admin@123456"
    '+91-9876543210',                                          -- phone
    'super_admin',                                             -- role
    'System Administrator',                                     -- full_name
    NULL,                                                      -- company_id (super admin has no restriction)
    NULL,                                                      -- unit_id (super admin has no restriction)
    true,                                                      -- is_active
    true,                                                      -- is_email_verified
    true,                                                      -- email_verified
    false,                                                     -- two_factor_enabled (can enable later)
    NOW(),                                                     -- created_at
    NOW()                                                      -- updated_at
)
ON CONFLICT (email) DO NOTHING
RETURNING id, user_name, email, custom_user_id, role;

-- Verify super admin created
SELECT 
    id,
    user_name,
    email,
    custom_user_id,
    role,
    is_active,
    is_email_verified,
    email_verified,
    created_at
FROM public.users
WHERE email = 'admin@rtwe.com';

-- ================================================================================
-- LOGIN CREDENTIALS:
-- ================================================================================
-- Email/Username: admin@rtwe.com  (or custom_user_id: 'admin')
-- Password: Admin@123456
-- URL: http://localhost:3000/Login.html
-- ================================================================================
