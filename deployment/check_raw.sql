SELECT 
    log_id,
    employee_id,
    punch_time,
    punch_time::text as raw_timestamp,
    in_out_mode,
    status,
    remarks
FROM attendance_logs 
WHERE DATE(punch_time AT TIME ZONE 'Asia/Kolkata') IN ('2026-01-11', '2026-01-10')
  AND status != 'deleted'
ORDER BY punch_time DESC
LIMIT 10;
