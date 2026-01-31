-- Check what employee IDs exist
SELECT DISTINCT employee_id, 
       DATE(punch_time AT TIME ZONE 'Asia/Kolkata') as punch_date,
       MIN(punch_time) as first_punch,
       MAX(punch_time) as last_punch
FROM attendance_logs 
WHERE DATE(punch_time AT TIME ZONE 'Asia/Kolkata') >= '2026-01-10'
GROUP BY employee_id, DATE(punch_time AT TIME ZONE 'Asia/Kolkata')
ORDER BY punch_date DESC, employee_id;
