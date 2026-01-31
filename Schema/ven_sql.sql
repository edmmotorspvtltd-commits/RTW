-- First, check if vendor_groups table needs the group_name column
ALTER TABLE vendor_groups ADD COLUMN IF NOT EXISTS group_name VARCHAR(255);
ALTER TABLE vendor_groups ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Check if vendors table needs vendor_group_id column
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS vendor_group_id INTEGER;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS vendor_code VARCHAR(50);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(255);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS gst_number VARCHAR(20);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS pincode VARCHAR(10);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- If vendor_groups has 'name' column instead of 'group_name', rename it
ALTER TABLE vendor_groups RENAME COLUMN name TO group_name;