-- ================================================================================
-- MIGRATION: Add JWT Authentication Columns to Existing Users Table
-- ================================================================================

-- Step 1: Add missing columns
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS full_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS company_id INTEGER,
ADD COLUMN IF NOT EXISTS unit_id INTEGER,
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255),
ADD COLUMN IF NOT EXISTS two_factor_backup_codes TEXT,
ADD COLUMN IF NOT EXISTS verification_token VARCHAR(100),
ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMP,
ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500);

-- Step 2: Drop existing role constraint
ALTER TABLE public.users
DROP CONSTRAINT IF EXISTS chk_role;

-- Step 3: Add new role constraint with additional roles
ALTER TABLE public.users
ADD CONSTRAINT chk_role CHECK (
    role IN ('super_admin', 'company_admin', 'unit_manager', 'manager', 'employee', 'admin', 'user')
);

-- Step 4: Sync is_email_verified with new email_verified column
UPDATE public.users
SET email_verified = is_email_verified
WHERE email_verified IS NULL;

-- Step 5: Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_unit_id ON public.users(unit_id);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON public.users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_two_factor_enabled ON public.users(two_factor_enabled);

-- Step 6: Verify migration
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'
AND column_name IN (
    'full_name', 'company_id', 'unit_id', 'email_verified',
    'two_factor_enabled', 'two_factor_secret', 'verification_token'
)
ORDER BY column_name;

-- ================================================================================
-- VERIFICATION QUERIES
-- ================================================================================

-- Check role constraint
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname = 'chk_role';

-- Count existing users
SELECT COUNT(*) AS total_users FROM public.users;

-- ================================================================================
-- SUCCESS MESSAGE
-- ================================================================================
-- If you see the columns listed above, migration is successful!
-- You can now create the super admin user.
-- ================================================================================
