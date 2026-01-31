UPDATE attendance_logs 
SET status = 'active', 
    remarks = 'Restored by admin' 
WHERE status = 'deleted'
RETURNING log_id, employee_id, punch_time, status;
