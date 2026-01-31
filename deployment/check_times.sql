SELECT 
    employee_id,
    punch_time,
    punch_time AT TIME ZONE 'UTC' as utc_time,
    punch_time AT TIME ZONE 'Asia/Kolkata' as ist_time,
    in_out_mode,
    status
FROM attendance_logs 
WHERE employee_id = 2 
  AND DATE(punch_time AT TIME ZONE 'Asia/Kolkata') = '2026-01-11'
ORDER BY punch_time;
