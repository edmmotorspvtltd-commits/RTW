// Bulk Selection Functions - ADD THIS TO YOUR attendance-employees.html
// Add after line 696 (after deleteEmployee function)

// Bulk Selection Functions
function toggleSelectAll(checked) {
    document.querySelectorAll('.employee-checkbox').forEach(cb => cb.checked = checked);
    updateBulkActions();
}

function updateBulkActions() {
    const selected = document.querySelectorAll('.employee-checkbox:checked');
    const count = selected.length;
    const bulkActionsBar = document.getElementById('bulkActionsBar');
    const selectAllCheckbox = document.getElementById('selectAll');

    if (count > 0) {
        bulkActionsBar.classList.add('show');
        document.getElementById('selectionCount').textContent = `${count} employee${count > 1 ? 's' : ''} selected`;
    } else {
        bulkActionsBar.classList.remove('show');
    }

    // Update select all checkbox
    const total = document.querySelectorAll('.employee-checkbox').length;
    if (selectAllCheckbox) {
        selectAllCheckbox.checked = count === total && total > 0;
        selectAllCheckbox.indeterminate = count > 0 && count < total;
    }
}

function clearSelection() {
    document.querySelectorAll('.employee-checkbox').forEach(cb => cb.checked = false);
    const selectAll = document.getElementById('selectAll');
    if (selectAll) selectAll.checked = false;
    updateBulkActions();
}

function getSelectedIds() {
    return Array.from(document.querySelectorAll('.employee-checkbox:checked'))
        .map(cb => parseInt(cb.dataset.id));
}

async function deleteSelectedEmployees() {
    const selectedIds = getSelectedIds();
    if (selectedIds.length === 0) return;

    const selectedEmployees = selectedIds.map(id => {
        const emp = employees.find(e => e.employee_id === id);
        return emp ? emp.full_name || emp.first_name : 'Unknown';
    });

    const confirmed = await showConfirm('🗑️', 'Delete Multiple Employees',
        `Delete ${selectedIds.length} employee${selectedIds.length > 1 ? 's' : ''}?\n\n${selectedEmployees.slice(0, 5).join(', ')}${selectedIds.length > 5 ? '...' : ''}`);

    if (!confirmed) return;

    showToast(`Deleting ${selectedIds.length} employees...`, 'info');

    let successCount = 0;
    let failCount = 0;

    for (const id of selectedIds) {
        try {
            const r = await fetch(`${API_BASE}/employees/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            const d = await r.json();
            if (d.success) {
                successCount++;
            } else {
                failCount++;
            }
        } catch (e) {
            failCount++;
        }
    }

    if (successCount > 0) {
        showToast(`✓ Deleted ${successCount} employee${successCount > 1 ? 's' : ''}${failCount > 0 ? `, ${failCount} failed` : ''}`, successCount === selectedIds.length ? 'success' : 'warning');
    } else {
        showToast('Failed to delete employees', 'error');
    }

    clearSelection();
    loadEmployees();
}
