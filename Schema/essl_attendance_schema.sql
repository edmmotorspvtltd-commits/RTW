-- ============================================
-- RTWE ERP + ESSL Attendance - COMPLETE MERGED SCHEMA
-- Version: 2.0 (Integrated)
-- Created: January 2026
-- 
-- This file combines:
--   - database_migration.sql (12 core tables)
--   - database_migration_enhanced.sql (7 salary/HR tables)
--   - ERP Integration (erp_user_id link to users table)
-- ============================================

-- ============================================
-- SECTION 1: CORE ATTENDANCE TABLES (12)
-- ============================================

-- ============================================
-- 1. DEVICES TABLE
-- Store information about all attendance devices
-- ============================================
CREATE TABLE IF NOT EXISTS devices (
    device_id SERIAL PRIMARY KEY,
    device_serial VARCHAR(50) UNIQUE NOT NULL,
    device_name VARCHAR(100) NOT NULL,
    device_model VARCHAR(50) DEFAULT 'x2008',
    ip_address INET,
    mac_address MACADDR,
    location VARCHAR(200),
    firmware_version VARCHAR(50),
    platform VARCHAR(50),
    face_algorithm VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance')),
    total_capacity INTEGER DEFAULT 3000,
    last_sync_time TIMESTAMP,
    server_port INTEGER DEFAULT 8080,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE devices IS 'Stores all attendance device information';
COMMENT ON COLUMN devices.device_serial IS 'Unique device serial number from manufacturer';

-- ============================================
-- 2. DEPARTMENTS TABLE
-- Organization department structure
-- ============================================
CREATE TABLE IF NOT EXISTS att_departments (
    department_id SERIAL PRIMARY KEY,
    department_code VARCHAR(50) UNIQUE NOT NULL,
    department_name VARCHAR(100) NOT NULL,
    description TEXT,
    manager_id INTEGER,
    parent_department_id INTEGER REFERENCES att_departments(department_id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE att_departments IS 'Organization department hierarchy for attendance';

-- ============================================
-- 3. EMPLOYEES TABLE (WITH ERP INTEGRATION)
-- Master employee data - LINKED TO ERP USERS
-- ============================================
CREATE TABLE IF NOT EXISTS employees (
    employee_id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) UNIQUE NOT NULL,          -- Device User ID (from eSSL device)
    employee_code VARCHAR(50) UNIQUE,
    erp_user_id INTEGER REFERENCES users(id),     -- *** ERP INTEGRATION: Link to ERP users table ***
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    full_name VARCHAR(200),                       -- Will be computed in application
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    department_id INTEGER REFERENCES att_departments(department_id),
    designation VARCHAR(100),
    card_number VARCHAR(50),                      -- RFID Card Number
    device_password VARCHAR(50),
    role VARCHAR(20) DEFAULT 'employee' CHECK (role IN ('employee', 'supervisor', 'manager', 'admin')),
    hire_date DATE,
    termination_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated', 'on_leave')),
    photo_url TEXT,
    address TEXT,
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_termination_after_hire CHECK (termination_date IS NULL OR termination_date >= hire_date)
);

CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_erp_user ON employees(erp_user_id);  -- ERP Integration Index

COMMENT ON TABLE employees IS 'Master employee/user information linked to ERP';
COMMENT ON COLUMN employees.user_id IS 'User ID from attendance device (must match device)';
COMMENT ON COLUMN employees.erp_user_id IS 'Foreign key to ERP users table for login integration';

-- ============================================
-- 4. BIOMETRIC_ENROLLMENTS TABLE
-- Track biometric data enrollment
-- ============================================
CREATE TABLE IF NOT EXISTS biometric_enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(employee_id) ON DELETE CASCADE,
    device_id INTEGER REFERENCES devices(device_id),
    biometric_type VARCHAR(20) NOT NULL CHECK (biometric_type IN ('fingerprint', 'face', 'card', 'password')),
    template_data TEXT,
    finger_index INTEGER CHECK (finger_index BETWEEN 0 AND 9),
    quality_score INTEGER CHECK (quality_score BETWEEN 0 AND 100),
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    
    UNIQUE(employee_id, device_id, biometric_type, finger_index)
);

CREATE INDEX IF NOT EXISTS idx_biometric_employee ON biometric_enrollments(employee_id);
CREATE INDEX IF NOT EXISTS idx_biometric_device ON biometric_enrollments(device_id);

COMMENT ON TABLE biometric_enrollments IS 'Tracks all biometric enrollments per employee per device';

-- ============================================
-- 5. ATTENDANCE_LOGS TABLE (MAIN TABLE)
-- Raw attendance punch records
-- ============================================
CREATE TABLE IF NOT EXISTS attendance_logs (
    log_id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(employee_id),
    device_id INTEGER REFERENCES devices(device_id),
    punch_time TIMESTAMP NOT NULL,
    verify_mode INTEGER NOT NULL,                 -- 1=Finger, 15=Face, 2=Password, 3=Card
    in_out_mode INTEGER DEFAULT 0,                -- 0=In, 1=Out, 2=Break Out, 3=Break In, 4=OT In, 5=OT Out
    work_code INTEGER,
    temperature DECIMAL(4,1),                     -- For temperature screening devices
    mask_status BOOLEAN,                          -- For mask detection devices
    photo_url TEXT,                               -- Captured photo during punch
    sync_status VARCHAR(20) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'failed')),
    raw_data JSONB,                               -- Store raw device data for debugging
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(employee_id, punch_time, device_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance_logs(employee_id, DATE(punch_time));
CREATE INDEX IF NOT EXISTS idx_attendance_punch_time ON attendance_logs(punch_time DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_device ON attendance_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sync_status ON attendance_logs(sync_status);

COMMENT ON TABLE attendance_logs IS 'Raw attendance punch records from devices';
COMMENT ON COLUMN attendance_logs.verify_mode IS '1=Fingerprint, 15=Face, 2=Password, 3=Card';
COMMENT ON COLUMN attendance_logs.in_out_mode IS '0=In, 1=Out, 2=Break Out, 3=Break In, 4=OT In, 5=OT Out';

-- ============================================
-- 6. DAILY_ATTENDANCE TABLE (Processed Data)
-- Daily attendance summary per employee
-- ============================================
CREATE TABLE IF NOT EXISTS daily_attendance (
    daily_id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(employee_id),
    attendance_date DATE NOT NULL,
    first_in TIME,
    last_out TIME,
    total_hours DECIMAL(5,2),
    break_hours DECIMAL(5,2) DEFAULT 0,
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    working_hours DECIMAL(5,2),                   -- Calculated: total_hours - break_hours
    status VARCHAR(20) DEFAULT 'present' CHECK (
        status IN ('present', 'absent', 'half_day', 'leave', 'holiday', 'week_off')
    ),
    is_late BOOLEAN DEFAULT FALSE,
    late_by_minutes INTEGER DEFAULT 0,
    early_out BOOLEAN DEFAULT FALSE,
    early_out_by_minutes INTEGER DEFAULT 0,
    total_punches INTEGER DEFAULT 0,
    shift_hours DECIMAL(5,2),
    remarks TEXT,
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(employee_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_attendance_date ON daily_attendance(attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_attendance_employee ON daily_attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_daily_attendance_status ON daily_attendance(status);

COMMENT ON TABLE daily_attendance IS 'Processed daily attendance summary';

-- ============================================
-- 7. SHIFTS TABLE
-- Shift timing configuration
-- ============================================
CREATE TABLE IF NOT EXISTS shifts (
    shift_id SERIAL PRIMARY KEY,
    shift_name VARCHAR(100) NOT NULL,
    shift_code VARCHAR(50) UNIQUE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    grace_period_minutes INTEGER DEFAULT 15,
    early_out_grace_minutes INTEGER DEFAULT 15,
    half_day_hours DECIMAL(4,2) DEFAULT 4.0,
    full_day_hours DECIMAL(4,2) DEFAULT 8.0,
    break_duration_minutes INTEGER DEFAULT 60,
    is_night_shift BOOLEAN DEFAULT FALSE,
    week_off_days INTEGER[] DEFAULT ARRAY[0],     -- 0=Sunday, 1=Monday, etc.
    is_active BOOLEAN DEFAULT TRUE,
    color_code VARCHAR(7),                        -- For UI display #FF5733
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_shift_hours CHECK (full_day_hours > half_day_hours)
);

CREATE INDEX IF NOT EXISTS idx_shifts_active ON shifts(is_active);

COMMENT ON TABLE shifts IS 'Shift timing configuration';

-- ============================================
-- 8. EMPLOYEE_SHIFTS TABLE
-- Shift assignment to employees
-- ============================================
CREATE TABLE IF NOT EXISTS employee_shifts (
    assignment_id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(employee_id),
    shift_id INTEGER REFERENCES shifts(shift_id),
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    assigned_by INTEGER REFERENCES employees(employee_id),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_shift_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE INDEX IF NOT EXISTS idx_employee_shifts_employee ON employee_shifts(employee_id);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_active ON employee_shifts(is_active);

COMMENT ON TABLE employee_shifts IS 'Shift assignments for employees';

-- ============================================
-- 9. LEAVES TABLE
-- Leave management
-- ============================================
CREATE TABLE IF NOT EXISTS att_leaves (
    leave_id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(employee_id),
    leave_type VARCHAR(50) NOT NULL CHECK (
        leave_type IN ('sick', 'casual', 'earned', 'unpaid', 'maternity', 'paternity', 'compensatory')
    ),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days DECIMAL(3,1),
    is_half_day BOOLEAN DEFAULT FALSE,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN ('pending', 'approved', 'rejected', 'cancelled')
    ),
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by INTEGER REFERENCES employees(employee_id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_leave_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_leaves_employee ON att_leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_leaves_dates ON att_leaves(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_leaves_status ON att_leaves(status);

COMMENT ON TABLE att_leaves IS 'Employee leave applications and approvals';

-- ============================================
-- 10. SYNC_LOGS TABLE
-- Track device synchronization
-- ============================================
CREATE TABLE IF NOT EXISTS sync_logs (
    sync_id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES devices(device_id),
    sync_type VARCHAR(20) NOT NULL CHECK (sync_type IN ('pull', 'push', 'manual')),
    records_synced INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    sync_status VARCHAR(20) DEFAULT 'success' CHECK (
        sync_status IN ('success', 'failed', 'partial', 'in_progress')
    ),
    error_message TEXT,
    sync_started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sync_completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_device ON sync_logs(device_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_date ON sync_logs(sync_started_at DESC);

COMMENT ON TABLE sync_logs IS 'Device synchronization history and logs';

-- ============================================
-- 11. HOLIDAYS TABLE
-- Company holiday calendar
-- ============================================
CREATE TABLE IF NOT EXISTS holidays (
    holiday_id SERIAL PRIMARY KEY,
    holiday_name VARCHAR(100) NOT NULL,
    holiday_date DATE NOT NULL,
    holiday_type VARCHAR(30) DEFAULT 'public' CHECK (
        holiday_type IN ('public', 'restricted', 'optional')
    ),
    is_mandatory BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(holiday_date)
);

CREATE INDEX IF NOT EXISTS idx_holidays_date ON holidays(holiday_date);

COMMENT ON TABLE holidays IS 'Company holiday calendar';

-- ============================================
-- 12. DEVICE_EVENTS TABLE
-- Device monitoring and event logging
-- ============================================
CREATE TABLE IF NOT EXISTS device_events (
    event_id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES devices(device_id),
    event_type VARCHAR(50) NOT NULL CHECK (
        event_type IN ('connection', 'disconnection', 'error', 'reboot', 'config_change', 'sync_start', 'sync_end')
    ),
    event_data JSONB,
    severity VARCHAR(20) DEFAULT 'info' CHECK (
        severity IN ('info', 'warning', 'error', 'critical')
    ),
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_device_events_device ON device_events(device_id);
CREATE INDEX IF NOT EXISTS idx_device_events_date ON device_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_device_events_severity ON device_events(severity);

COMMENT ON TABLE device_events IS 'Device monitoring and event logging';


-- ============================================
-- SECTION 2: SALARY & HR TABLES (7)
-- ============================================

-- ============================================
-- 13. EMPLOYEE BANK DETAILS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS employee_bank_details (
    bank_detail_id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(employee_id) ON DELETE CASCADE UNIQUE,
    account_number VARCHAR(20) NOT NULL,
    account_holder_name VARCHAR(200),
    ifsc_code VARCHAR(11) NOT NULL,
    bank_name VARCHAR(100) NOT NULL,
    branch_name VARCHAR(100),
    account_type VARCHAR(20) DEFAULT 'savings' CHECK (account_type IN ('savings', 'current')),
    pan_number VARCHAR(10),
    aadhar_number VARCHAR(12),
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bank_employee ON employee_bank_details(employee_id);
CREATE INDEX IF NOT EXISTS idx_bank_pan ON employee_bank_details(pan_number);

COMMENT ON TABLE employee_bank_details IS 'Employee bank account information for salary processing';

-- ============================================
-- 14. SALARY STRUCTURE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS salary_structure (
    salary_id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(employee_id) ON DELETE CASCADE,
    basic_salary DECIMAL(10,2) NOT NULL,
    hra DECIMAL(10,2) DEFAULT 0,
    da DECIMAL(10,2) DEFAULT 0,
    medical_allowance DECIMAL(10,2) DEFAULT 0,
    transport_allowance DECIMAL(10,2) DEFAULT 0,
    special_allowance DECIMAL(10,2) DEFAULT 0,
    other_allowances DECIMAL(10,2) DEFAULT 0,
    gross_salary DECIMAL(10,2),                   -- Calculated in application
    pf_deduction DECIMAL(10,2) DEFAULT 0,
    esi_deduction DECIMAL(10,2) DEFAULT 0,
    professional_tax DECIMAL(10,2) DEFAULT 0,
    tds_deduction DECIMAL(10,2) DEFAULT 0,
    other_deductions DECIMAL(10,2) DEFAULT 0,
    total_deductions DECIMAL(10,2),               -- Calculated in application
    net_salary DECIMAL(10,2),                     -- Calculated in application
    per_day_salary DECIMAL(10,2),                 -- Calculated in application
    effective_from DATE NOT NULL,
    effective_to DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_salary_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

CREATE INDEX IF NOT EXISTS idx_salary_employee ON salary_structure(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_active ON salary_structure(is_active);

COMMENT ON TABLE salary_structure IS 'Employee salary structure with day-wise calculation';

-- ============================================
-- 15. MONTHLY SALARY REGISTER TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS monthly_salary_register (
    register_id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(employee_id),
    salary_month DATE NOT NULL,
    total_working_days INTEGER DEFAULT 0,
    present_days INTEGER DEFAULT 0,
    absent_days INTEGER DEFAULT 0,
    leave_days INTEGER DEFAULT 0,
    half_days INTEGER DEFAULT 0,
    paid_days DECIMAL(5,1),                       -- Calculated: present + (half*0.5) + leave
    basic_salary DECIMAL(10,2),
    gross_salary DECIMAL(10,2),
    per_day_salary DECIMAL(10,2),
    earned_salary DECIMAL(10,2),
    total_allowances DECIMAL(10,2) DEFAULT 0,
    total_deductions DECIMAL(10,2) DEFAULT 0,
    advance_deduction DECIMAL(10,2) DEFAULT 0,
    loan_deduction DECIMAL(10,2) DEFAULT 0,
    other_deduction DECIMAL(10,2) DEFAULT 0,
    net_payable DECIMAL(10,2),
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    overtime_amount DECIMAL(10,2) DEFAULT 0,
    bonus DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN ('pending', 'processed', 'paid', 'hold')
    ),
    payment_date DATE,
    payment_mode VARCHAR(20) CHECK (payment_mode IN ('bank_transfer', 'cash', 'cheque', 'upi')),
    transaction_reference VARCHAR(100),
    remarks TEXT,
    processed_by INTEGER REFERENCES employees(employee_id),
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(employee_id, salary_month)
);

CREATE INDEX IF NOT EXISTS idx_salary_register_month ON monthly_salary_register(salary_month DESC);
CREATE INDEX IF NOT EXISTS idx_salary_register_employee ON monthly_salary_register(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_register_status ON monthly_salary_register(status);

COMMENT ON TABLE monthly_salary_register IS 'Monthly salary register with auto-calculated day-wise salary';

-- ============================================
-- 16. ADVANCE SALARY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS advance_salary (
    advance_id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(employee_id),
    advance_amount DECIMAL(10,2) NOT NULL,
    advance_date DATE NOT NULL,
    reason TEXT,
    installments INTEGER DEFAULT 1 CHECK (installments > 0),
    installment_amount DECIMAL(10,2),             -- Calculated in application
    recovered_amount DECIMAL(10,2) DEFAULT 0,
    balance_amount DECIMAL(10,2),                 -- Calculated in application
    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN ('pending', 'approved', 'rejected', 'recovering', 'recovered', 'cancelled')
    ),
    approved_by INTEGER REFERENCES employees(employee_id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    recovery_start_month DATE,
    recovery_end_month DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_advance_employee ON advance_salary(employee_id);
CREATE INDEX IF NOT EXISTS idx_advance_status ON advance_salary(status);

COMMENT ON TABLE advance_salary IS 'Employee advance salary requests and recovery tracking';

-- ============================================
-- 17. ADVANCE RECOVERY SCHEDULE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS advance_recovery_schedule (
    schedule_id SERIAL PRIMARY KEY,
    advance_id INTEGER REFERENCES advance_salary(advance_id) ON DELETE CASCADE,
    employee_id INTEGER REFERENCES employees(employee_id),
    recovery_month DATE NOT NULL,
    scheduled_amount DECIMAL(10,2) NOT NULL,
    recovered_amount DECIMAL(10,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (
        status IN ('pending', 'recovered', 'skipped', 'adjusted')
    ),
    salary_register_id INTEGER REFERENCES monthly_salary_register(register_id),
    recovered_at TIMESTAMP,
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recovery_advance ON advance_recovery_schedule(advance_id);
CREATE INDEX IF NOT EXISTS idx_recovery_employee ON advance_recovery_schedule(employee_id);
CREATE INDEX IF NOT EXISTS idx_recovery_month ON advance_recovery_schedule(recovery_month);

COMMENT ON TABLE advance_recovery_schedule IS 'Monthly advance recovery schedule and tracking';

-- ============================================
-- 18. EMPLOYEE DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS employee_documents (
    document_id SERIAL PRIMARY KEY,
    employee_id INTEGER REFERENCES employees(employee_id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (
        document_type IN (
            'aadhar', 'pan', 'passport', 'driving_license', 
            'voter_id', 'bank_passbook', 'photo', 'resume',
            'education_certificate', 'experience_letter', 
            'relieving_letter', 'salary_slip', 'other'
        )
    ),
    document_name VARCHAR(200) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    document_number VARCHAR(100),
    issue_date DATE,
    expiry_date DATE,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by INTEGER REFERENCES employees(employee_id),
    verified_at TIMESTAMP,
    remarks TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_documents_employee ON employee_documents(employee_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON employee_documents(document_type);

COMMENT ON TABLE employee_documents IS 'Employee document uploads and management';

-- ============================================
-- 19. SALARY PAYMENT HISTORY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS salary_payment_history (
    payment_id SERIAL PRIMARY KEY,
    register_id INTEGER REFERENCES monthly_salary_register(register_id),
    employee_id INTEGER REFERENCES employees(employee_id),
    payment_amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_mode VARCHAR(20) NOT NULL,
    transaction_reference VARCHAR(100),
    bank_detail_id INTEGER REFERENCES employee_bank_details(bank_detail_id),
    status VARCHAR(20) DEFAULT 'success' CHECK (
        status IN ('success', 'failed', 'pending', 'reversed')
    ),
    failure_reason TEXT,
    paid_by INTEGER REFERENCES employees(employee_id),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_register ON salary_payment_history(register_id);
CREATE INDEX IF NOT EXISTS idx_payment_employee ON salary_payment_history(employee_id);
CREATE INDEX IF NOT EXISTS idx_payment_date ON salary_payment_history(payment_date DESC);

COMMENT ON TABLE salary_payment_history IS 'Salary payment transaction history';


-- ============================================
-- SECTION 3: VIEWS
-- ============================================

-- View: Today's Attendance
CREATE OR REPLACE VIEW v_today_attendance AS
SELECT 
    e.employee_id,
    e.employee_code,
    e.full_name,
    e.erp_user_id,
    e.photo_url,
    d.department_name,
    da.first_in,
    da.last_out,
    da.total_hours,
    da.status,
    da.is_late,
    da.late_by_minutes,
    s.shift_name
FROM employees e
LEFT JOIN att_departments d ON e.department_id = d.department_id
LEFT JOIN daily_attendance da ON e.employee_id = da.employee_id 
    AND da.attendance_date = CURRENT_DATE
LEFT JOIN employee_shifts es ON e.employee_id = es.employee_id 
    AND es.is_active = TRUE
    AND (es.effective_to IS NULL OR es.effective_to >= CURRENT_DATE)
LEFT JOIN shifts s ON es.shift_id = s.shift_id
WHERE e.status = 'active';

-- View: Latest Punches Today
CREATE OR REPLACE VIEW v_latest_punches AS
SELECT 
    al.log_id,
    e.employee_code,
    e.full_name,
    e.erp_user_id,
    al.punch_time,
    al.verify_mode,
    al.in_out_mode,
    d.device_name,
    al.photo_url
FROM attendance_logs al
JOIN employees e ON al.employee_id = e.employee_id
JOIN devices d ON al.device_id = d.device_id
WHERE DATE(al.punch_time) = CURRENT_DATE
ORDER BY al.punch_time DESC
LIMIT 50;

-- View: Current Month Attendance Summary
CREATE OR REPLACE VIEW v_current_month_attendance AS
SELECT 
    e.employee_id,
    e.employee_code,
    e.full_name,
    e.erp_user_id,
    d.department_name,
    COUNT(*) FILTER (WHERE da.status = 'present') as present_days,
    COUNT(*) FILTER (WHERE da.status = 'absent') as absent_days,
    COUNT(*) FILTER (WHERE da.status = 'half_day') as half_days,
    COUNT(*) FILTER (WHERE da.status = 'leave') as leave_days,
    COUNT(*) FILTER (WHERE da.is_late = TRUE) as late_days,
    ROUND(COALESCE(AVG(da.working_hours), 0)::numeric, 2) as avg_working_hours,
    ROUND(COALESCE(SUM(da.working_hours), 0)::numeric, 2) as total_working_hours
FROM employees e
LEFT JOIN att_departments d ON e.department_id = d.department_id
LEFT JOIN daily_attendance da ON e.employee_id = da.employee_id
    AND da.attendance_date >= DATE_TRUNC('month', CURRENT_DATE)
    AND da.attendance_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
WHERE e.status = 'active'
GROUP BY e.employee_id, e.employee_code, e.full_name, e.erp_user_id, d.department_name;

-- View: Employee salary summary
CREATE OR REPLACE VIEW v_employee_salary_summary AS
SELECT 
    e.employee_id,
    e.employee_code,
    e.full_name,
    e.erp_user_id,
    d.department_name,
    ss.basic_salary,
    ss.gross_salary,
    ss.total_deductions,
    ss.net_salary,
    ss.per_day_salary,
    COALESCE(adv.balance_amount, 0) as pending_advance,
    ss.effective_from,
    ss.is_active
FROM employees e
LEFT JOIN att_departments d ON e.department_id = d.department_id
LEFT JOIN salary_structure ss ON e.employee_id = ss.employee_id AND ss.is_active = TRUE
LEFT JOIN (
    SELECT employee_id, SUM(balance_amount) as balance_amount
    FROM advance_salary
    WHERE status IN ('approved', 'recovering')
    GROUP BY employee_id
) adv ON e.employee_id = adv.employee_id
WHERE e.status = 'active';

-- View: Pending advances
CREATE OR REPLACE VIEW v_pending_advances AS
SELECT 
    a.*,
    e.employee_code,
    e.full_name,
    e.erp_user_id,
    d.department_name
FROM advance_salary a
JOIN employees e ON a.employee_id = e.employee_id
LEFT JOIN att_departments d ON e.department_id = d.department_id
WHERE a.status IN ('pending', 'approved', 'recovering');


-- ============================================
-- SECTION 4: FUNCTIONS
-- ============================================

-- Function: Calculate working hours between two timestamps
CREATE OR REPLACE FUNCTION calculate_working_hours(
    p_first_in TIME,
    p_last_out TIME,
    p_break_minutes INTEGER DEFAULT 60
) RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_minutes INTEGER;
    working_hours DECIMAL(5,2);
BEGIN
    IF p_first_in IS NULL OR p_last_out IS NULL THEN
        RETURN 0;
    END IF;
    
    total_minutes := EXTRACT(EPOCH FROM (p_last_out - p_first_in)) / 60;
    working_hours := (total_minutes - COALESCE(p_break_minutes, 0)) / 60.0;
    
    RETURN GREATEST(working_hours, 0);
END;
$$ LANGUAGE plpgsql;

-- Function: Update daily attendance from logs
CREATE OR REPLACE FUNCTION process_daily_attendance(p_date DATE)
RETURNS INTEGER AS $$
DECLARE
    v_processed_count INTEGER := 0;
BEGIN
    INSERT INTO daily_attendance (
        employee_id,
        attendance_date,
        first_in,
        last_out,
        total_hours,
        total_punches,
        status,
        processed_at
    )
    SELECT 
        employee_id,
        DATE(punch_time) as attendance_date,
        MIN(punch_time::TIME) as first_in,
        MAX(punch_time::TIME) as last_out,
        EXTRACT(EPOCH FROM (MAX(punch_time) - MIN(punch_time))) / 3600.0 as total_hours,
        COUNT(*) as total_punches,
        'present' as status,
        CURRENT_TIMESTAMP as processed_at
    FROM attendance_logs
    WHERE DATE(punch_time) = p_date
    GROUP BY employee_id, DATE(punch_time)
    ON CONFLICT (employee_id, attendance_date) 
    DO UPDATE SET
        first_in = EXCLUDED.first_in,
        last_out = EXCLUDED.last_out,
        total_hours = EXCLUDED.total_hours,
        total_punches = EXCLUDED.total_punches,
        updated_at = CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS v_processed_count = ROW_COUNT;
    RETURN v_processed_count;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- SECTION 5: TRIGGERS
-- ============================================

-- Trigger function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to relevant tables
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_departments_updated_at ON att_departments;
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON att_departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_attendance_updated_at ON daily_attendance;
CREATE TRIGGER update_daily_attendance_updated_at BEFORE UPDATE ON daily_attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_devices_updated_at ON devices;
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_salary_structure_updated_at ON salary_structure;
CREATE TRIGGER update_salary_structure_updated_at BEFORE UPDATE ON salary_structure
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_salary_register_updated_at ON monthly_salary_register;
CREATE TRIGGER update_salary_register_updated_at BEFORE UPDATE ON monthly_salary_register
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_advance_updated_at ON advance_salary;
CREATE TRIGGER update_advance_updated_at BEFORE UPDATE ON advance_salary
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- SECTION 6: INITIAL DATA SEEDING
-- ============================================

-- Insert your device information
INSERT INTO devices (device_serial, device_name, device_model, ip_address, mac_address, 
    location, firmware_version, platform, face_algorithm, status)
VALUES 
    ('CQIK232281312', 'x2008', 'x2008', '192.168.1.2'::INET, '00:17:61:12:76:22'::MACADDR,
    'Main Entrance', 'ZAM180-NF50VA-Ver3.4.7', 'ZAM180_TFT', 'Face VX3.9', 'active')
ON CONFLICT (device_serial) DO NOTHING;

-- Insert default shifts
INSERT INTO shifts (shift_name, shift_code, start_time, end_time, grace_period_minutes, 
    full_day_hours, break_duration_minutes, is_active)
VALUES 
    ('General Shift', 'GEN', '09:00:00', '18:00:00', 15, 9.0, 60, TRUE),
    ('Morning Shift', 'MORN', '06:00:00', '15:00:00', 15, 9.0, 60, TRUE),
    ('Evening Shift', 'EVE', '15:00:00', '00:00:00', 15, 9.0, 60, TRUE),
    ('Night Shift', 'NIGHT', '22:00:00', '07:00:00', 15, 9.0, 60, TRUE)
ON CONFLICT (shift_code) DO NOTHING;

-- Insert default departments
INSERT INTO att_departments (department_code, department_name, description, is_active)
VALUES 
    ('ADMIN', 'Administration', 'Administration Department', TRUE),
    ('HR', 'Human Resources', 'HR Department', TRUE),
    ('IT', 'Information Technology', 'IT Department', TRUE),
    ('OPS', 'Operations', 'Operations Department', TRUE),
    ('PROD', 'Production', 'Production/Factory Floor', TRUE)
ON CONFLICT (department_code) DO NOTHING;


-- ============================================
-- VERIFICATION
-- ============================================
SELECT 
    'ESSL Attendance Schema created successfully!' as message,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN (
        'devices', 'att_departments', 'employees', 'biometric_enrollments', 
        'attendance_logs', 'daily_attendance', 'shifts', 'employee_shifts',
        'att_leaves', 'sync_logs', 'holidays', 'device_events',
        'employee_bank_details', 'salary_structure', 'monthly_salary_register',
        'advance_salary', 'advance_recovery_schedule', 'employee_documents', 'salary_payment_history'
    )) as tables_created;
