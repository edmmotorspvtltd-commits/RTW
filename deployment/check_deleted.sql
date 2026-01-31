SELECT log_id, employee_id, punch_time, in_out_mode, status, edited_at
FROM attendance_logs 
WHERE status = 'deleted' 
  AND edited_at > NOW() - INTERVAL '2 hours'
ORDER BY edited_at DESC;
