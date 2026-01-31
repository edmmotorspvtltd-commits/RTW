/* =====================================================
   FRONTEND CODE FOR EXCEL IMPORT/EXPORT
   Add this to attendance-employees.html
   ===================================================== */

// ============= STEP 1: ADD BUTTONS TO HEADER (Around line 428) =============
// Find: <div style="display: flex; gap: 10px;">
// Add these two buttons BEFORE "View Device Users" button:

<button class="btn" style="background:#E8EAF6;color:#3F51B5" onclick="downloadTemplate()">📥 Download Template</button>
<button class="btn" style="background:#FFF3E0;color:#E65100" onclick="openImportModal()">📤 Import from Excel</button>


// ============= STEP 2: ADD MODAL HTML (Before closing </body> tag, around line 559) =============
//Add this import modal after the employeeModal div:

    <div class="modal-overlay" id="importModal">
        <div class="modal" style="max-width:600px;">
            <div class="modal-header">
                <h3 class="modal-title">📤 Import Employees from Excel</h3>
                <button class="modal-close" onclick="closeImportModal()">×</button>
            </div>
            <div class="modal-body">
                <div style="background:#E3F2FD;padding:15px;border-radius:8px;margin-bottom:20px;">
                    <h4 style="margin:0 0 10px;color:#1976D2;">📋 Instructions:</h4>
                    <ol style="margin:0;padding-left:20px;color:#666;">
                        <li>Click "Download Template" to get the Excel file</li>
                        <li>Fill in employee details (First Name and Status are required)</li>
                        <li>Employee Code & User ID will be auto-generated</li>
                        <li>Save the file and upload it here</li>
                    </ol>
                </div>
                <div class="form-group">
                    <label>Select Excel File (.xlsx)</label>
                    <input type="file" id="excelFile" accept=".xlsx,.xls" style="padding:10px;border:2px dashed #ddd;border-radius:8px;width:100%;" />
                </div>
                <div id="importProgress" style="display:none;text-align:center;padding:20px;">
                    <div class="spinner"></div>
                    <p id="importStatus">Processing...</p>
                </div>
                <div id="importResults" style="display:none;margin-top:15px;">
                    <!-- Results shown here -->
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn" style="background:#eee" onclick="closeImportModal()">Cancel</button>
                <button class="btn btn-primary" onclick="uploadExcel()">📤 Upload & Import</button>
            </div>
        </div>
    </div>


// ============= STEP 3: ADD JAVASCRIPT FUNCTIONS (Before loadDepartments(); loadEmployees(); around line 928) =============
// Add these functions:

async function downloadTemplate() {
    try {
        showToast('Downloading template...', 'info');
        const response = await fetch(`${API_BASE}/employees/template`, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to download template');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Employee_Import_Template_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showToast('✓ Template downloaded successfully', 'success');
    } catch (error) {
        console.error('Error downloading template:', error);
        showToast('Error downloading template', 'error');
    }
}

function openImportModal() {
    document.getElementById('importModal').classList.add('show');
    document.getElementById('excelFile').value = '';
    document.getElementById('importProgress').style.display = 'none';
    document.getElementById('importResults').style.display = 'none';
}

function closeImportModal() {
    document.getElementById('importModal').classList.remove('show');
}

async function uploadExcel() {
    const fileInput = document.getElementById('excelFile');
    const file = fileInput.files[0];

    if (!file) {
        showToast('Please select an Excel file', 'warning');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);

    document.getElementById('importProgress').style.display = 'block';
    document.getElementById('importResults').style.display = 'none';
    document.getElementById('importStatus').textContent = 'Uploading and processing...';

    try {
        const response = await fetch(`${API_BASE}/employees/import`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });

        const result = await response.json();

        document.getElementById('importProgress').style.display = 'none';

        if (result.success) {
            showImportResults(result);
            loadEmployees(); // Refresh list
        } else {
            showToast(result.error || 'Import failed', 'error');
        }
    } catch (error) {
        console.error('Error uploading file:', error);
        document.getElementById('importProgress').style.display = 'none';
        showToast('Error uploading file', 'error');
    }
}

function showImportResults(result) {
    const resultsDiv = document.getElementById('importResults');
    resultsDiv.style.display = 'block';

    let html = `
        <div style="background:#E8F5E9;padding:15px;border-radius:8px;border-left:4px solid #4CAF50;">
            <p style="margin:0;font-weight:600;color:#2E7D32;">✓ Successfully imported: ${result.imported} employees</p>
        </div>
    `;

    if (result.failed > 0) {
        html += `
            <div style="background:#FFEBEE;padding:15px;border-radius:8px;border-left:4px solid #f44336;margin-top:10px;">
                <p style="margin:0 0 10px;font-weight:600;color:#C62828;">✗ Failed: ${result.failed} rows</p>
                <div style="max-height:150px;overflow-y:auto;">
                    <ul style="margin:0;padding-left:20px;font-size:13px;color:#666;">
        `;

        result.errors.forEach(err => {
            html += `<li>Row ${err.row}: ${err.error}</li>`;
        });

        html += `
                    </ul>
                </div>
            </div>
        `;
    }

    resultsDiv.innerHTML = html;

    showToast(
        `Import complete: ${result.imported} added${result.failed > 0 ? `, ${result.failed} failed` : ''}`,
        result.failed === 0 ? 'success' : 'warning'
    );

    // Auto-close modal after 3 seconds if all successful
    if (result.failed === 0) {
        setTimeout(() => {
            closeImportModal();
        }, 3000);
    }
}

// That's it! Save the file and test the feature.
