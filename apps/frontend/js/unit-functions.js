// ========== UNIT VIEW & EDIT FUNCTIONS ==========

async function viewUnit(unitId) {
    try {
        const res = await fetch(`/api/company/units/${unitId}`, { credentials: 'include' });
        const data = await res.json();

        if (data.success && data.unit) {
            const u = data.unit;
            const content = `
                <div style="padding: 10px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
                        <div>
                            <strong style="color: #666;">Unit Code:</strong>
                            <div style="margin-top: 5px;">${u.unit_code || '-'}</div>
                        </div>
                        <div>
                            <strong style="color: #666;">Unit Name:</strong>
                            <div style="margin-top: 5px;">${u.unit_name || '-'}</div>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
                        <div>
                            <strong style="color: #666;">Type:</strong>
                            <div style="margin-top: 5px;">${u.unit_type || '-'}</div>
                        </div>
                        <div>
                            <strong style="color: #666;">Location:</strong>
                            <div style="margin-top: 5px;">${u.location || '-'}</div>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
                        <div>
                            <strong style="color: #666;">Manager:</strong>
                            <div style="margin-top: 5px;">${u.manager_name || '-'}</div>
                        </div>
                        <div>
                            <strong style="color: #666;">Manager Email:</strong>
                            <div style="margin-top: 5px;">${u.manager_email || '-'}</div>
                        </div>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
                        <div>
                            <strong style="color: #666;">Manager Phone:</strong>
                            <div style="margin-top: 5px;">${u.manager_phone || '-'}</div>
                        </div>
                        <div>
                            <strong style="color: #666;">Status:</strong>
                            <div style="margin-top: 5px;">
                                <span style="padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; background: ${u.is_active ? '#d4edda' : '#f8d7da'}; color: ${u.is_active ? '#155724' : '#721c24'};">
                                    ${u.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            showCustomModal('👁️ Unit Details', 'View unit information', content);
        } else {
            showToast('Unit not found', 'error');
        }
    } catch (error) {
        console.error('Error loading unit:', error);
        showToast('Error loading unit details', 'error');
    }
}

async function editUnit(unitId) {
    try {
        const res = await fetch(`/api/company/units/${unitId}`, { credentials: 'include' });
        const data = await res.json();

        if (data.success && data.unit) {
            const u = data.unit;
            const form = `
                <form id="editUnitForm" style="padding: 10px;">
                    <input type="hidden" id="editUnitId" value="${u.id}">
                    <input type="hidden" id="editUnitCompanyId" value="${u.company_id}">
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Unit Code *</label>
                            <input type="text" id="editUnitCode" value="${u.unit_code || ''}" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Unit Name *</label>
                            <input type="text" id="editUnitName" value="${u.unit_name || ''}" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Unit Type *</label>
                            <select id="editUnitType" required style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                                <option value="">Select Type</option>
                                <option value="manufacturing" ${u.unit_type === 'manufacturing' ? 'selected' : ''}>Manufacturing</option>
                                <option value="processing" ${u.unit_type === 'processing' ? 'selected' : ''}>Processing</option>
                                <option value="warehouse" ${u.unit_type === 'warehouse' ? 'selected' : ''}>Warehouse</option>
                                <option value="office" ${u.unit_type === 'office' ? 'selected' : ''}>Office</option>
                                <option value="other" ${u.unit_type === 'other' ? 'selected' : ''}>Other</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Location</label>
                            <input type="text" id="editUnitLocation" value="${u.location || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px;">
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Manager Name</label>
                            <input type="text" id="editUnitManager" value="${u.manager_name || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                        <div>
                            <label style="display: block; margin-bottom: 5px; font-weight: 500;">Manager Email</label>
                            <input type="email" id="editUnitManagerEmail" value="${u.manager_email || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                        </div>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Manager Phone</label>
                        <input type="tel" id="editUnitManagerPhone" value="${u.manager_phone || ''}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" id="editUnitActive" ${u.is_active ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
                            <span style="font-weight: 500;">Active</span>
                        </label>
                    </div>
                </form>
            `;

            showCustomModal('✏️ Edit Unit', 'Update unit information', form, saveUnitChanges);
        } else {
            showToast('Unit not found', 'error');
        }
    } catch (error) {
        console.error('Error loading unit:', error);
        showToast('Error loading unit details', 'error');
    }
}

async function saveUnitChanges() {
    const unitId = document.getElementById('editUnitId').value;
    const companyId = document.getElementById('editUnitCompanyId').value;

    const unitData = {
        unit_code: document.getElementById('editUnitCode').value,
        unit_name: document.getElementById('editUnitName').value,
        unit_type: document.getElementById('editUnitType').value,
        location: document.getElementById('editUnitLocation').value,
        manager_name: document.getElementById('editUnitManager').value,
        manager_email: document.getElementById('editUnitManagerEmail').value,
        manager_phone: document.getElementById('editUnitManagerPhone').value,
        is_active: document.getElementById('editUnitActive').checked
    };

    try {
        const res = await fetch(`/api/company/${companyId}/units/${unitId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(unitData)
        });

        const data = await res.json();

        if (data.success) {
            showToast('Unit updated successfully!', 'success');
            closeCustomModal();
            loadUnits(companyId); // Reload units for this company
        } else {
            showToast(data.message || 'Failed to update unit', 'error');
        }
    } catch (error) {
        console.error('Error updating unit:', error);
        showToast('Error updating unit', 'error');
    }
}

// Custom modal helper functions
function showCustomModal(title, subtitle, content, confirmCallback = null) {
    const modal = document.getElementById('confirmModal');
    document.getElementById('confirmIcon').textContent = title.split(' ')[0];
    document.getElementById('confirmTitle').textContent = title.substring(title.indexOf(' ') + 1);
    document.getElementById('confirmSubtitle').textContent = subtitle;
    document.getElementById('confirmMessage').innerHTML = content;
    document.getElementById('confirmDetails').innerHTML = '';

    const confirmBtn = document.getElementById('confirmButton');
    if (confirmCallback) {
        confirmBtn.style.display = 'block';
        confirmBtn.textContent = '💾 Save Changes';
        confirmBtn.onclick = confirmCallback;
    } else {
        confirmBtn.style.display = 'none';
    }

    modal.classList.add('active');
}

function closeCustomModal() {
    document.getElementById('confirmModal').classList.remove('active');
}
