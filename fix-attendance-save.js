// Quick fix for attendance save issue
// This script updates the savePunchEdit function to delete old punches before creating new ones

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'attendance-logs.html');
let content = fs.readFileSync(filePath, 'utf8');

// Find and replace the savePunchEdit function
const oldFunction = /async function savePunchEdit\(\) \{[\s\S]*?catch \(e\) \{[\s\S]*?console\.error\(e\);[\s\S]*?\}[\s\S]*?\}/;

const newFunction = `async function savePunchEdit() {
            const employeeId = document.getElementById('editEmployeeId').value;
            const date = document.getElementById('editDate').value;
            const inTime = document.getElementById('editInTime').value;
            const outTime = document.getElementById('editOutTime').value;
            const remarks = document.getElementById('editRemarks').value;

            if (!inTime || !outTime) {
                showToast('Please fill in both IN and OUT times', 'warning');
                return;
            }

            const inDateTime = \`\${date}T\${inTime}:00\`;
            const outDateTime = \`\${date}T\${outTime}:00\`;

            try {
                // Step 1: Get existing punches for this date
                const logsUrl = \`\${API_BASE}/logs?employee_id=\${employeeId}&start_date=\${date}&end_date=\${date}\`;
                const logsResp = await fetch(logsUrl, { credentials: 'include' });
                const logsData = await logsResp.json();
                
                // Step 2: Delete all existing punches
                if (logsData.success && logsData.data.length > 0) {
                    for (const log of logsData.data) {
                        if (log.status !== 'deleted') {
                            await fetch(\`\${API_BASE}/logs/\${log.log_id}/delete\`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                credentials: 'include',
                                body: JSON.stringify({ remarks: 'Replaced with corrected time' })
                            });
                        }
                    }
                }
                
                // Step 3: Create corrected IN punch
                await fetch(\`\${API_BASE}/logs/manual\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ 
                        employee_id: parseInt(employeeId), 
                        punch_time: inDateTime, 
                        in_out_mode: 0, 
                        remarks: remarks || 'Corrected IN time'
                    })
                });

                // Step 4: Create corrected OUT punch
                await fetch(\`\${API_BASE}/logs/manual\`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ 
                        employee_id: parseInt(employeeId), 
                        punch_time: outDateTime, 
                        in_out_mode: 1, 
                        remarks: remarks || 'Corrected OUT time'
                    })
                });

                showToast('Attendance corrected successfully!', 'success');
                closeEditModal();
                setTimeout(() => loadLogs(), 500);
            } catch (e) {
                showToast('Error: ' + e.message, 'error');
                console.error(e);
            }
        }`;

content = content.replace(oldFunction, newFunction);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed savePunchEdit function!');
