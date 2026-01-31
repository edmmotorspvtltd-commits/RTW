// =====================================================
// RAPIER COSTING - ACTION BUTTONS FUNCTIONS
// Add this script before closing </body> tag
// =====================================================

// ===== FUNCTION 1: SAVE TO DATABASE =====
async function saveToDatabase(event) {
    try {
        // Show loading
        const btn = event ? event.target : document.querySelector('button[onclick*="saveToDatabase"]');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '⏳ Saving...';
        }

        // Collect updated data
        const costingData = {
            orderNumber: document.getElementById('costingNumber')?.value || '',
            orderLength: parseFloat(document.getElementById('orderLength')?.value) || 0,
            partyName: document.getElementById('partyName')?.value || '',
            agentName: document.getElementById('agentName')?.value || '',
            qualityType: document.getElementById('qualityType')?.value || '',
            sizingSetNo: document.getElementById('sizingSetNo')?.value || '',

            // Collect warp data from all tabs
            warpData: collectWarpData(),

            // Collect weft data from all tabs
            weftData: collectWeftData(),

            // Optional charges
            chargesData: collectChargesData(),

            // Selling price and profit percentage
            sellingPrice: parseFloat(document.getElementById('yourSellingPrice')?.value) || 0,
            profitPercentage: calculateProfitPercentage(),

            // Add metadata
            updated_at: new Date().toISOString()
        };

        // Debug log
        // Validate required fields
        if (!costingData.orderNumber || !costingData.orderNumber.trim()) {
            showToast('Please fill Order Number!', 'error');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '💾 Save to Database';
            }
            return;
        }

        if (!costingData.orderLength || costingData.orderLength === 0 || isNaN(costingData.orderLength)) {
            showToast('Please fill Order Length with a valid number!', 'error');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '💾 Save to Database';
            }
            return;
        }

        // Send to backend API
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('/api/costing', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(costingData),
            credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
            showToast(`Costing sheet saved successfully! Costing ID: ${result.data.id}`, 'success');
            // Store costing ID for PDF generation
            sessionStorage.setItem('currentCostingId', result.data.id);

            // Redirect to costing management page after 1 second
            setTimeout(() => {
                window.location.href = '/costing-management.html';
            }, 1000);
        } else {
            showToast(`Error: ${result.message || 'Failed to save'}`, 'error');
        }

    } catch (error) {
        console.error('Save error:', error);
        showToast('Failed to save to database. Please try again.', 'error');
    } finally {
        // Re-enable button
        const btn = event ? event.target : document.querySelector('button[onclick*="saveToDatabase"]');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '💾 Save to Database';
        }
    }
}

// Helper: Collect all warp configurations
function collectWarpData() {
    const warpTabs = document.querySelectorAll('[id^="warp-"]');
    const warps = [];

    warpTabs.forEach((tab, index) => {
        // Get all input fields (excluding disabled auto-calculated ones for now)
        const inputs = tab.querySelectorAll('.form-input');

        // Get checkboxes for this warp tab
        const topBeamCheckbox = tab.querySelector(`#topbeam-${index + 1}`);
        const bobinCheckbox = tab.querySelector(`#bobin-${index + 1}`);

        const warpData = {
            warpIndex: index + 1,
            // Input fields (in order as they appear in the form)
            panna: parseFloat(inputs[0]?.value) || 0,
            rsGap: parseFloat(inputs[1]?.value) || 0,
            dbf: parseFloat(inputs[2]?.value) || 0,  // Auto-calculated but still collect
            reed: parseInt(inputs[3]?.value) || 0,
            totalEnds: parseInt(inputs[4]?.value) || 0,  // Auto-calculated but still collect
            warpCount: parseFloat(inputs[5]?.value) || 0,
            rateOfYarn: parseFloat(inputs[6]?.value) || 0,
            rateOfSizing: parseFloat(inputs[7]?.value) || 0,
            warpGLM: parseFloat(inputs[8]?.value) || 0,  // Auto-calculated
            costPerMeter: parseFloat(inputs[9]?.value) || 0,  // Auto-calculated
            yarnRequired: parseFloat(inputs[10]?.value?.replace(/,/g, '')) || 0,  // Auto-calculated, remove commas
            // Checkbox charges
            topBeamCharges: topBeamCheckbox?.checked || false,
            bobinCharges: bobinCheckbox?.checked || false,
            topBeamAmount: 0.50,
            bobinAmount: 0.50
        };

        warps.push(warpData);
    });

    return warps;
}

// Helper: Collect all weft configurations
function collectWeftData() {
    const weftTabs = document.querySelectorAll('[id^="weft-"]');
    const wefts = [];

    weftTabs.forEach((tab, index) => {
        // Get all input fields
        const inputs = tab.querySelectorAll('.form-input');

        const weftData = {
            weftIndex: index + 1,
            // Input fields (in order as they appear in the form)
            rs: parseFloat(inputs[0]?.value) || 0,
            pick: parseInt(inputs[1]?.value) || 0,
            insertion: parseFloat(inputs[2]?.value) || 0,
            weftCount: parseFloat(inputs[3]?.value) || 0,
            rateOfYarn: parseFloat(inputs[4]?.value) || 0,
            percentageOfTotalWeft: parseFloat(inputs[5]?.value) || 0,
            weftConsumption: parseFloat(inputs[6]?.value) || 0,  // Auto-calculated
            costPerMeter: parseFloat(inputs[7]?.value) || 0,  // Auto-calculated
            yarnRequired: parseFloat(inputs[8]?.value?.replace(/,/g, '')) || 0  // Auto-calculated, remove commas
        };

        wefts.push(weftData);
    });

    return wefts;
}

// Helper: Collect charges data
function collectChargesData() {
    return {
        monogram: document.getElementById('monogram')?.checked || false,
        monogramAmount: 1.00,
        butta: document.getElementById('butta')?.checked || false,
        buttaAmount: 2.00,
        jobRatePercent: parseFloat(document.getElementById('jobRatePercent')?.value) || 0
    };
}

// ===== FUNCTION 2: GENERATE PDF =====
async function generatePDF() {
    try {
        const btn = event.target;
        btn.disabled = true;
        btn.innerHTML = '⏳ Generating PDF...';

        // Check if saved
        const costingId = sessionStorage.getItem('currentCostingId');

        if (!costingId) {
            showToast('Please save the costing sheet first before generating PDF!', 'warning');
            btn.disabled = false;
            btn.innerHTML = '📄 Generate PDF';
            return;
        }

        // Call PDF generation API
        const response = await fetch(`/api/costing/${costingId}/pdf`, {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            // Download PDF
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Rapier_Costing_${costingId}_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            showToast('PDF downloaded successfully!', 'success');
        } else {
            const error = await response.json();
            showToast(`PDF generation failed: ${error.message || 'Unknown error'}`, 'error');
        }

    } catch (error) {
        console.error('PDF generation error:', error);
        showToast('Failed to generate PDF. Please try again.', 'error');
    } finally {
        const btn = event.target;
        btn.disabled = false;
        btn.innerHTML = '📄 Generate PDF';
    }
}

// ===== FUNCTION 3: SAVE AS TEMPLATE =====
async function saveAsTemplate() {
    try {
        const templateName = await showInput('Enter a name for this template:', 'e.g., Standard 40s Cotton');

        if (!templateName || templateName.trim() === '') {
            return;
        }

        const description = await showInput('Enter template description (optional):', 'Description...');

        const btn = event.target;
        btn.disabled = true;
        btn.innerHTML = '⏳ Saving Template...';

        // Collect configuration data (no order-specific info)
        const templateData = {
            templateName: templateName.trim(),
            description: description || '',
            warps: collectWarpData(),
            wefts: collectWeftData(),
            optionalCharges: {}
        };

        // Save template
        const response = await fetch('/api/costing/templates', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(templateData),
            credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
            alert(`✅ Template "${templateName}" saved successfully!\\nYou can load it from the templates dropdown.`);
            // Refresh templates list
            loadTemplatesList();
        } else {
            alert(`❌ Error: ${result.message || 'Failed to save template'}`);
        }

    } catch (error) {
        console.error('Template save error:', error);
        alert('❌ Failed to save template. Please try again.');
    } finally {
        const btn = event.target;
        btn.disabled = false;
        btn.innerHTML = '📋 Save as Template';
    }
}

// Helper: Load templates list (for dropdown)
async function loadTemplatesList() {
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('/api/costing/templates', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            credentials: 'include'
        });

        if (response.ok) {
            const result = await response.json();
            // Update templates dropdown if it exists
            const templatesDropdown = document.getElementById('templatesDropdown');
            if (templatesDropdown && result.templates) {
                templatesDropdown.innerHTML = '<option value="">-- Select Template --</option>';
                result.templates.forEach(template => {
                    const option = document.createElement('option');
                    option.value = template.id;
                    option.textContent = template.template_name;
                    templatesDropdown.appendChild(option);
                });
            }
        }
    } catch (error) {
        // Silently fail - templates feature is optional
        }
}

// ===== FUNCTION 4: CLEAR FORM =====
async function clearForm() {
    const confirmed = await showConfirm('Are you sure you want to clear all data? This action cannot be undone.');

    if (!confirmed) {
        return;
    }

    try {
        // Reset all text inputs
        document.querySelectorAll('.form-input:not([disabled])').forEach(input => {
            if (input.type === 'number') {
                input.value = 0;
            } else if (input.type === 'text') {
                input.value = '';
            }
        });

        // Reset calculated fields
        document.querySelectorAll('.auto-calculated').forEach(input => {
            input.value = '0';
        });

        // Remove extra warp tabs (keep only first)
        const warpTabs = document.querySelectorAll('#warpTabs .tab-btn:not(.add-tab-btn)');
        warpTabs.forEach((tab, index) => {
            if (index > 0) {
                const tabId = tab.getAttribute('data-tab');
                const tabContent = document.getElementById(tabId);
                tab.remove();
                if (tabContent) tabContent.remove();
            }
        });

        // Remove extra weft tabs (keep only first)
        const weftTabs = document.querySelectorAll('#weftTabs .tab-btn:not(.add-tab-btn)');
        weftTabs.forEach((tab, index) => {
            if (index > 0) {
                const tabId = tab.getAttribute('data-tab');
                const tabContent = document.getElementById(tabId);
                tab.remove();
                if (tabContent) tabContent.remove();
            }
        });

        // Switch to first tabs
        const firstWarpTab = document.querySelector('#warpTabs .tab-btn:first-child');
        const firstWeftTab = document.querySelector('#weftTabs .tab-btn:first-child');

        if (firstWarpTab) {
            switchTab(document.getElementById('warpTabs'), firstWarpTab.getAttribute('data-tab'));
        }
        if (firstWeftTab) {
            switchTab(document.getElementById('weftTabs'), firstWeftTab.getAttribute('data-tab'));
        }

        // Clear session storage
        sessionStorage.removeItem('currentCostingId');

        showToast('Form cleared successfully!', 'success');

    } catch (error) {
        console.error('Clear form error:', error);
        showToast('Error clearing form. Please refresh the page.', 'error');
    }
}

// ===== EDIT MODE: LOAD EXISTING COSTING =====
let currentCostingId = null;
let isEditMode = false;

async function loadCostingData(costingId) {
    try {
        showToast('Loading costing data...', 'info');

        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`/api/costing/${costingId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${authToken}`
            },
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to load costing data');
        }

        const result = await response.json();

        if (result.success && result.data) {
            const costing = result.data;
            currentCostingId = costingId;
            isEditMode = true;

            // Populate order information
            const orderNumberInput = document.querySelector('[placeholder="ORD-2026-001"]');
            const orderLengthInput = document.querySelector('[value="24000"]');
            const partyNameInput = document.querySelector('[placeholder="Enter party name"]');
            const brokerNameInput = document.querySelector('[placeholder="Enter broker name"]');
            const qualityTypeInput = document.querySelector('[placeholder="Enter quality"]');
            const sizingSetNoInput = document.querySelector('[placeholder="Enter set number"]');

            if (orderNumberInput) orderNumberInput.value = costing.orderNumber || '';
            if (orderLengthInput) orderLengthInput.value = costing.orderLength || 0;
            if (partyNameInput) partyNameInput.value = costing.partyName || '';
            if (brokerNameInput) brokerNameInput.value = costing.brokerName || '';
            if (qualityTypeInput) qualityTypeInput.value = costing.qualityType || '';
            if (sizingSetNoInput) sizingSetNoInput.value = costing.sizingSetNo || '';

            // TODO: Load warp and weft configurations
            // This requires understanding the exact structure of your form
            // You may need to create tabs dynamically and populate them

            // Update page title
            const pageTitle = document.querySelector('.page-title');
            if (pageTitle) {
                pageTitle.textContent = `Edit Costing - ${costing.orderNumber || 'Untitled'}`;
            }

            // Change save button text
            const saveBtn = document.querySelector('button[onclick*="saveToDatabase"]');
            if (saveBtn) {
                saveBtn.innerHTML = '💾 Update Costing';
                saveBtn.setAttribute('onclick', 'updateCosting()');
            }

            // Store costing ID for PDF generation
            sessionStorage.setItem('currentCostingId', costingId);

            showToast('Costing data loaded successfully!', 'success');
        } else {
            throw new Error(result.message || 'Failed to load costing');
        }

    } catch (error) {
        console.error('Load costing error:', error);
        showToast('Failed to load costing data. Redirecting to list...', 'error');
        setTimeout(() => {
            window.location.href = '/costing-management.html';
        }, 2000);
    }
}

// ===== FUNCTION 1: UPDATE COSTING (FOR EDIT MODE) =====
async function updateCosting(event) {
    event.preventDefault();

    // Get costing ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const costingId = urlParams.get('id');

    if (!costingId) {
        showToast('No costing ID found. Please save as new instead.', 'error');
        return;
    }

    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '⏳ Updating...';

    try {
        // Collect all data using the same functions as saveToDatabase
        const costingData = {
            orderNumber: document.getElementById('costingNumber')?.value || '',
            orderLength: parseFloat(document.getElementById('orderLength')?.value) || 0,
            partyName: document.getElementById('partyName')?.value || '',
            agentName: document.getElementById('agentName')?.value || '',
            qualityType: document.getElementById('qualityType')?.value || '',
            sizingSetNo: document.getElementById('sizingSetNo')?.value || '',

            // Collect warp data from all tabs
            warpData: collectWarpData(),

            // Collect weft data from all tabs
            weftData: collectWeftData(),

            // Optional charges
            chargesData: collectChargesData()
        };

        // Validate
        if (!costingData.orderNumber || costingData.orderLength === 0) {
            showToast('Please fill Order Number and Order Length!', 'error');
            btn.disabled = false;
            btn.innerHTML = '💾 Update Costing';
            return;
        }

        // Send update request
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`/api/costing/${costingId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(costingData),
            credentials: 'include'
        });

        const result = await response.json();

        if (result.success) {
            showToast('Costing updated successfully!', 'success');
            setTimeout(() => {
                window.location.href = '/costing-management.html';
            }, 1500);
        } else {
            showToast(`Error: ${result.message || 'Failed to update'}`, 'error');
        }

    } catch (error) {
        console.error('Update error:', error);
        showToast('Failed to update costing. Please try again.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '💾 Update Costing';
    }
}

// ===== CHECK FOR EDIT MODE ON PAGE LOAD =====
async function checkEditMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const costingId = urlParams.get('id');

    if (costingId) {
        // IMPORTANT: Load dropdowns FIRST before loading costing data
        await loadParties();  // Load buyers dropdown
        await loadAgents();   // Load agents dropdown

        // Now load the costing data
        await loadCostingData(costingId);

        // Change button text and function
        const saveBtn = document.querySelector('button[onclick*="saveToDatabase"]');
        if (saveBtn) {
            saveBtn.innerHTML = '💾 Update Costing';
            saveBtn.setAttribute('onclick', 'updateCosting(event)');
        }
    } else {
        // CREATE MODE - Generate new costing number
        await loadCostingNumber();
        await loadParties();  // Load buyers dropdown for create mode
        await loadAgents();   // Load agents dropdown for create mode
    }
}

// Load existing costing data for editing
async function loadCostingData(costingId) {
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch(`/api/costing/${costingId}`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load costing data');
        }

        const result = await response.json();
        const costing = result.data;
        // Populate basic fields
        // Get element references
        const costingNumberEl = document.getElementById('costingNumber');
        const orderLengthEl = document.getElementById('orderLength');
        const qualityTypeEl = document.getElementById('qualityType');
        const sizingSetNoEl = document.getElementById('sizingSetNo');

        if (costingNumberEl) costingNumberEl.value = costing.orderNumber || '';
        if (orderLengthEl) {
            orderLengthEl.value = costing.orderLength || '';
            }
        if (qualityTypeEl) qualityTypeEl.value = costing.qualityType || '';
        if (sizingSetNoEl) sizingSetNoEl.value = costing.sizingSetNo || '';

        // Set dropdown values (dropdowns are already loaded by checkEditMode)
        if (document.getElementById('partyName')) {
            document.getElementById('partyName').value = costing.partyName || '';
            }
        if (document.getElementById('agentName')) {
            document.getElementById('agentName').value = costing.brokerName || '';
            }

        // Parse and populate warp data
        if (costing.warp_data) {
            const warpData = typeof costing.warp_data === 'string'
                ? JSON.parse(costing.warp_data)
                : costing.warp_data;
            populateWarpTabs(warpData);
        }

        // Parse and populate weft data
        if (costing.weft_data) {
            const weftData = typeof costing.weft_data === 'string'
                ? JSON.parse(costing.weft_data)
                : costing.weft_data;
            populateWeftTabs(weftData);
        }

        // Parse and populate charges
        if (costing.charges_data) {
            const chargesData = typeof costing.charges_data === 'string'
                ? JSON.parse(costing.charges_data)
                : costing.charges_data;
            populateCharges(chargesData);
        }

        showToast('Costing loaded for editing', 'success');
    } catch (error) {
        console.error('❌ Error loading costing data:', error);
        showToast('Failed to load costing data', 'error');
    }
}

// Populate warp tabs with existing data
function populateWarpTabs(warpDataArray) {
    if (!Array.isArray(warpDataArray) || warpDataArray.length === 0) return;

    warpDataArray.forEach((warp, index) => {
        // Create additional tabs if needed
        if (index > 0 && typeof addWarpTab === 'function') {
            addWarpTab();
        }

        const tab = document.getElementById(`warp-${index + 1}`);
        if (!tab) return;

        const inputs = tab.querySelectorAll('.form-input');
        if (inputs.length > 0) {
            if (inputs[0]) inputs[0].value = warp.panna || '';
            if (inputs[1]) inputs[1].value = warp.rsGap || '';
            if (inputs[2]) inputs[2].value = warp.dbf || '';
            if (inputs[3]) inputs[3].value = warp.reed || '';
            if (inputs[4]) inputs[4].value = warp.totalEnds || '';
            if (inputs[5]) inputs[5].value = warp.warpCount || '';
            if (inputs[6]) inputs[6].value = warp.rateOfYarn || '';
            if (inputs[7]) inputs[7].value = warp.rateOfSizing || '';
            if (inputs[8]) inputs[8].value = warp.warpGLM || '';
            if (inputs[9]) inputs[9].value = warp.costPerMeter || '';
            if (inputs[10]) inputs[10].value = warp.yarnRequired || '';
        }

        // Set checkboxes
        const topBeamCheckbox = tab.querySelector(`#topbeam-${index + 1}`);
        const bobinCheckbox = tab.querySelector(`#bobin-${index + 1}`);
        if (topBeamCheckbox) topBeamCheckbox.checked = warp.topBeamCharges || false;
        if (bobinCheckbox) bobinCheckbox.checked = warp.bobinCharges || false;
    });
}

// Populate weft tabs with existing data
function populateWeftTabs(weftDataArray) {
    if (!Array.isArray(weftDataArray) || weftDataArray.length === 0) return;

    weftDataArray.forEach((weft, index) => {
        // Create additional tabs if needed
        if (index > 0 && typeof addWeftTab === 'function') {
            addWeftTab();
        }

        const tab = document.getElementById(`weft-${index + 1}`);
        if (!tab) return;

        const inputs = tab.querySelectorAll('.form-input');
        if (inputs.length > 0) {
            if (inputs[0]) inputs[0].value = weft.rs || '';
            if (inputs[1]) inputs[1].value = weft.pick || '';
            if (inputs[2]) inputs[2].value = weft.insertion || '';
            if (inputs[3]) inputs[3].value = weft.weftCount || '';
            if (inputs[4]) inputs[4].value = weft.rateOfYarn || '';
            if (inputs[5]) inputs[5].value = weft.percentageOfTotalWeft || '';
            if (inputs[6]) inputs[6].value = weft.weftConsumption || '';
            if (inputs[7]) inputs[7].value = weft.costPerMeter || '';
            if (inputs[8]) inputs[8].value = weft.yarnRequired || '';
        }
    });
}

// Populate charges with existing data
function populateCharges(chargesData) {
    if (!chargesData) return;

    const monogramCheckbox = document.getElementById('monogram');
    const buttaCheckbox = document.getElementById('butta');
    const jobRateInput = document.getElementById('jobRatePercent');

    if (monogramCheckbox) monogramCheckbox.checked = chargesData.monogram || false;
    if (buttaCheckbox) buttaCheckbox.checked = chargesData.butta || false;
    if (jobRateInput) jobRateInput.value = chargesData.jobRatePercent || '';
}

// Initialize on page load
// ================================================
// Load Costing Number (Auto-generate)
// ================================================

async function loadCostingNumber() {
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('/api/costing/generate-number', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            const result = await response.json();
            const costingNumberInput = document.getElementById('costingNumber');
            if (costingNumberInput && result.data) {
                costingNumberInput.value = result.data.costingNumber;
            }
        }
    } catch (error) {
        console.error('Error loading costing number:', error);
    }
}

// ================================================
// Load Parties Dropdown
// ================================================
// Auto-load parties (domestic buyers) dropdown
async function loadParties() {
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('/api/master/domestic-buyers', {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const result = await response.json();
        if (result.success && result.data) {
            const partySelect = document.getElementById('partyName');
            if (partySelect) {
                // Clear existing options except the first one
                partySelect.innerHTML = '<option value="">Select buyer</option>';

                // Add domestic buyers
                result.data.forEach(buyer => {
                    const option = document.createElement('option');
                    option.value = buyer.buyer_name;
                    option.textContent = buyer.buyer_name;
                    partySelect.appendChild(option);
                    });

                } else {
                console.error('❌ partyName select element not found!');
            }
        } else {
            console.error('❌ API returned success=false or no data:', result);
        }
    } catch (error) {
        console.error('❌ Error loading domestic buyers:', error);
    }
}

// ================================================
// TAB MANAGEMENT FUNCTIONS
// ================================================

let warpTabCount = 1;
let weftTabCount = 1;

/**
 * Add a new warp tab
 */
function addWarpTab() {
    warpTabCount++;
    const warpIndex = warpTabCount;

    // Create tab button
    const tabsContainer = document.getElementById('warpTabs');
    const addButton = tabsContainer.querySelector('.add-tab-btn');

    const newTabBtn = document.createElement('button');
    newTabBtn.className = 'tab-btn';
    newTabBtn.setAttribute('data-tab', `warp-${warpIndex}`);
    newTabBtn.textContent = `Warp ${warpIndex}`;
    newTabBtn.onclick = function () { switchTab(this); };

    tabsContainer.insertBefore(newTabBtn, addButton);

    // Create tab content (clone from warp-1)
    const warp1 = document.getElementById('warp-1');
    const newWarpTab = warp1.cloneNode(true);
    newWarpTab.id = `warp-${warpIndex}`;
    newWarpTab.setAttribute('data-warp-index', warpIndex);
    newWarpTab.classList.remove('active');

    // Clear input values
    const inputs = newWarpTab.querySelectorAll('.form-input:not([disabled])');
    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            input.checked = false;
        } else {
            input.value = '';
        }
    });

    // Update checkbox IDs
    const topBeamCheckbox = newWarpTab.querySelector('[id^="topbeam-"]');
    const bobinCheckbox = newWarpTab.querySelector('[id^="bobin-"]');
    if (topBeamCheckbox) topBeamCheckbox.id = `topbeam-${warpIndex}`;
    if (bobinCheckbox) bobinCheckbox.id = `bobin-${warpIndex}`;

    // Insert after last warp tab
    const lastWarpTab = document.querySelector('[id^="warp-"]:last-of-type');
    lastWarpTab.parentNode.insertBefore(newWarpTab, lastWarpTab.nextSibling);

    // Attach calculation listeners to new tab
    if (typeof attachWarpListeners === 'function') {
        attachWarpListeners(warpIndex);
    }

    // Switch to new tab
    switchTab(newTabBtn);
}

/**
 * Add a new weft tab
 */
function addWeftTab() {
    weftTabCount++;
    const weftIndex = weftTabCount;

    // Create tab button
    const tabsContainer = document.getElementById('weftTabs');
    const addButton = tabsContainer.querySelector('.add-tab-btn');

    const newTabBtn = document.createElement('button');
    newTabBtn.className = 'tab-btn';
    newTabBtn.setAttribute('data-tab', `weft-${weftIndex}`);
    newTabBtn.textContent = `Weft ${weftIndex}`;
    newTabBtn.onclick = function () { switchTab(this); };

    tabsContainer.insertBefore(newTabBtn, addButton);

    // Create tab content (clone from weft-1)
    const weft1 = document.getElementById('weft-1');
    const newWeftTab = weft1.cloneNode(true);
    newWeftTab.id = `weft-${weftIndex}`;
    newWeftTab.setAttribute('data-weft-index', weftIndex);
    newWeftTab.classList.remove('active');

    // Clear input values
    const inputs = newWeftTab.querySelectorAll('.form-input:not([disabled])');
    inputs.forEach(input => {
        if (input.type === 'checkbox') {
            input.checked = false;
        } else {
            input.value = '';
        }
    });

    // Insert after last weft tab
    const lastWeftTab = document.querySelector('[id^="weft-"]:last-of-type');
    lastWeftTab.parentNode.insertBefore(newWeftTab, lastWeftTab.nextSibling);

    // Attach calculation listeners to new tab
    if (typeof attachWeftListeners === 'function') {
        attachWeftListeners(weftIndex);
    }

    // Switch to new tab
    switchTab(newTabBtn);
}

/**
 * Switch between tabs
 */
function switchTab(tabButton) {
    const tabId = tabButton.getAttribute('data-tab');
    const tabsContainer = tabButton.parentElement;

    // Remove active class from all tabs
    tabsContainer.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Add active class to clicked tab
    tabButton.classList.add('active');

    // Hide all tab contents
    const allContents = document.querySelectorAll('.tab-content');
    allContents.forEach(content => {
        content.classList.remove('active');
    });

    // Show selected tab content
    const selectedContent = document.getElementById(tabId);
    if (selectedContent) {
        selectedContent.classList.add('active');
    }
}

// ================================================
// SAVE TO DATABASE
// ================================================
// Auto-load agents dropdown
async function loadAgents() {
    try {
        const authToken = localStorage.getItem('authToken');
        const response = await fetch('/api/master/agents', {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            const result = await response.json();
            const agentSelect = document.getElementById('agentName');
            if (agentSelect && result.data) {
                // Clear existing options except first
                agentSelect.innerHTML = '<option value="">Select agent</option>';

                // Add agents
                result.data.forEach(agent => {
                    const option = document.createElement('option');
                    option.value = agent.name;
                    option.textContent = agent.name;
                    agentSelect.appendChild(option);
                });

                }
        }
    } catch (error) {
        console.error('Error loading agents:', error);
    }
}

document.addEventListener('DOMContentLoaded', async function () {
    // Check if we're in edit mode or create mode
    // This will load dropdowns and data as needed
    await checkEditMode();

    // Load templates list
    loadTemplatesList();

    // Initialize calculation system
    if (typeof initializeCalculations === 'function') {
        initializeCalculations();
    }

    });
