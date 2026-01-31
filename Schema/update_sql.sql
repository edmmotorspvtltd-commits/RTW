-- Add missing columns for JWT authentication
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
-- Update role constraint to include new roles
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS chk_role;
ALTER TABLE public.users ADD CONSTRAINT chk_role CHECK (
    role IN ('super_admin', 'company_admin', 'unit_manager', 'manager', 'employee', 'admin', 'user')
);
-- Sync email verification columns
UPDATE public.users SET email_verified = is_email_verified WHERE email_verified IS NULL;
-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_unit_id ON public.users(unit_id);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON public.users(email_verified);