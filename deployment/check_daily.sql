SELECT 
    attendance_date,
    employee_id,
    in_time,
    out_time,
    raw_in_time,
    raw_out_time
FROM daily_attendance
WHERE attendance_date IN ('2026-01-11', '2026-01-10')
ORDER BY attendance_date DESC, employee_id
LIMIT 5;
