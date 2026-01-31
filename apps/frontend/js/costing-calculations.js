// ================================================
// CALCULATION FUNCTIONS
// ================================================

/**
 * Calculate warp values for a specific warp tab
 * @param {number} warpIndex - The index of the warp tab (1-based)
 */
function calculateWarp(warpIndex) {
    const warpTab = document.getElementById(`warp-${warpIndex}`);
    if (!warpTab) return;

    const inputs = warpTab.querySelectorAll('.form-input');

    // Get input values
    const panna = parseFloat(inputs[0]?.value) || 0;
    const rsGap = parseFloat(inputs[1]?.value) || 0;
    const reed = parseFloat(inputs[3]?.value) || 0;
    const warpCount = parseFloat(inputs[5]?.value) || 0;
    const rateOfYarn = parseFloat(inputs[6]?.value) || 0;
    const rateOfSizing = parseFloat(inputs[7]?.value) || 0;

    // Get order length from main form
    const orderLength = parseFloat(document.getElementById('orderLength')?.value) || 0;

    // Calculate DBF (Auto) = Panna + RS Gap
    const dbf = panna + rsGap;
    if (inputs[2]) inputs[2].value = dbf.toFixed(2);

    // Calculate Total Ends (Auto) = DBF × Reed
    const totalEnds = dbf * reed;
    if (inputs[4]) inputs[4].value = Math.round(totalEnds);

    // Calculate Warp GLM (Auto) = (Total Ends × 1.10) / (Warp Count × 590.5)
    const warpGLM = warpCount > 0 ? (totalEnds * 1.10) / (warpCount * 590.5) : 0;
    if (inputs[8]) inputs[8].value = warpGLM.toFixed(4);

    // Calculate Cost per Meter (₹) = (Warp GLM × Rate of Yarn) + Rate of Sizing
    const costPerMeter = (warpGLM * rateOfYarn) + rateOfSizing;
    if (inputs[9]) inputs[9].value = costPerMeter.toFixed(2);

    // Calculate Yarn Required (kgs) = (Warp GLM × Order Length) / 1000
    const yarnRequired = (warpGLM * orderLength) / 1000;
    if (inputs[10]) inputs[10].value = yarnRequired.toFixed(2);

    // Recalculate summary after warp calculation
    calculateCostingSummary();
}

/**
 * Calculate weft values for a specific weft tab
 * @param {number} weftIndex - The index of the weft tab (1-based)
 */
function calculateWeft(weftIndex) {
    const weftTab = document.getElementById(`weft-${weftIndex}`);
    if (!weftTab) return;

    const inputs = weftTab.querySelectorAll('.form-input');

    // Get input values
    const rs = parseFloat(inputs[0]?.value) || 0;
    const pick = parseFloat(inputs[1]?.value) || 0;
    const insertion = parseFloat(inputs[2]?.value) || 0;
    const weftCount = parseFloat(inputs[3]?.value) || 0;
    const rateOfYarn = parseFloat(inputs[4]?.value) || 0;
    const percentOfTotalWeft = parseFloat(inputs[5]?.value) || 100;

    // Get order length from main form
    const orderLength = parseFloat(document.getElementById('orderLength')?.value) || 0;

    // Calculate Weft GLM (Auto) = (RS × Pick × Insertion × 1.10) / (Weft Count × 590.5)
    const weftGLM = weftCount > 0 ? (rs * pick * insertion * 1.10) / (weftCount * 590.5) : 0;
    if (inputs[6]) inputs[6].value = weftGLM.toFixed(4);

    // Calculate Cost per Meter (₹) = Weft GLM × Rate of Yarn
    const costPerMeter = weftGLM * rateOfYarn;
    if (inputs[7]) inputs[7].value = costPerMeter.toFixed(2);

    // Calculate Yarn Required (kgs) = (Weft GLM × Order Length × % of Total Weft) / (1000 × 100)
    const yarnRequired = (weftGLM * orderLength * percentOfTotalWeft) / (1000 * 100);
    if (inputs[8]) inputs[8].value = yarnRequired.toFixed(2);

    // Recalculate summary after weft calculation
    calculateCostingSummary();
}

/**
 * Calculate overall costing summary
 */
function calculateCostingSummary() {
    let totalWarpCost = 0;
    let totalWeftCost = 0;
    let additionalCharges = 0;

    // Sum all warp costs
    const warpTabs = document.querySelectorAll('[id^="warp-"]');
    warpTabs.forEach(tab => {
        const inputs = tab.querySelectorAll('.form-input');
        const costPerMeter = parseFloat(inputs[9]?.value) || 0;
        totalWarpCost += costPerMeter;
    });

    // Sum all weft costs
    const weftTabs = document.querySelectorAll('[id^="weft-"]');
    weftTabs.forEach(tab => {
        const inputs = tab.querySelectorAll('.form-input');
        const costPerMeter = parseFloat(inputs[7]?.value) || 0;
        totalWeftCost += costPerMeter;
    });

    // Add charges (checkboxes)
    const topBeamCheckboxes = document.querySelectorAll('[id^="topbeam-"]');
    topBeamCheckboxes.forEach(cb => {
        if (cb.checked) additionalCharges += 0.50;
    });

    const bobinCheckboxes = document.querySelectorAll('[id^="bobin-"]');
    bobinCheckboxes.forEach(cb => {
        if (cb.checked) additionalCharges += 0.50;
    });

    // Add monogram and butta charges
    const monogramCheckbox = document.getElementById('monogram');
    if (monogramCheckbox?.checked) additionalCharges += 0.50;

    const buttaCheckbox = document.getElementById('butta');
    if (buttaCheckbox?.checked) additionalCharges += 0.50;

    // Add job rate percentage
    const jobRatePercent = parseFloat(document.getElementById('jobRatePercent')?.value) || 0;
    const jobRateCost = (totalWarpCost + totalWeftCost) * (jobRatePercent / 100);

    // Calculate Production Cost
    const productionCost = totalWarpCost + totalWeftCost + additionalCharges + jobRateCost;

    // Calculate Minimum Selling Price (15% markup)
    const minimumSellingPrice = productionCost * 1.15;

    // Get user's selling price
    const yourSellingPrice = parseFloat(document.getElementById('yourSellingPrice')?.value) || minimumSellingPrice;

    // Calculate Net Profit
    const netProfit = yourSellingPrice - productionCost;
    const profitPercentage = productionCost > 0 ? (netProfit / productionCost) * 100 : 0;

    // Update Cost Summary panel
    updateCostSummaryDisplay(productionCost, minimumSellingPrice, yourSellingPrice, netProfit, profitPercentage);
}

/**
 * Update the Cost Summary display panel
 */
function updateCostSummaryDisplay(productionCost, minimumSellingPrice, yourSellingPrice, netProfit, profitPercentage) {
    // Helper function to find and update value by label text
    function updateValueByLabel(labelText, value, isPercentage = false) {
        // Find all elements that might contain the label
        const allElements = document.querySelectorAll('*');

        for (let el of allElements) {
            // Check if this element's text content contains the label
            const textContent = el.textContent || '';

            if (textContent.includes(labelText)) {
                // Look for value elements within or near this element
                const parent = el.closest('.card, .metric-card, .summary-item, .cost-item');
                if (parent) {
                    // Try to find the value element
                    const valueEl = parent.querySelector('.metric-value, .value, .amount, span:last-child, div:last-child');
                    if (valueEl && valueEl !== el) {
                        const formattedValue = isPercentage ?
                            `${value.toFixed(2)}%` :
                            `₹${value.toFixed(2)}`;

                        // Only update if it's a leaf node (no children or only text)
                        if (valueEl.children.length === 0 || valueEl.querySelector('span, div') === null) {
                            valueEl.textContent = formattedValue;
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    // Try multiple label variations for each value
    updateValueByLabel('PRODUCTION COST', productionCost) ||
        updateValueByLabel('Production Cost', productionCost);

    updateValueByLabel('MINIMUM SELLING PRICE', minimumSellingPrice) ||
        updateValueByLabel('Minimum Selling Price', minimumSellingPrice);

    // NOTE: Do NOT update 'Your Selling Price' - it's a user input field, not a display field!
    // The user enters their selling price manually in the input field

    updateValueByLabel('NET PROFIT', netProfit) ||
        updateValueByLabel('Net Profit', netProfit);

    // Update profit percentage if there's a separate element for it
    updateValueByLabel('Margin', profitPercentage, true) ||
        updateValueByLabel('Profit %', profitPercentage, true);
}

/**
 * Recalculate all warp and weft tabs
 */
function recalculateAll() {
    // Recalculate all warp tabs
    const warpTabs = document.querySelectorAll('[id^="warp-"]');
    warpTabs.forEach((tab, index) => {
        calculateWarp(index + 1);
    });

    // Recalculate all weft tabs
    const weftTabs = document.querySelectorAll('[id^="weft-"]');
    weftTabs.forEach((tab, index) => {
        calculateWeft(index + 1);
    });

    // Recalculate summary
    calculateCostingSummary();
}

/**
 * Attach event listeners to warp inputs
 */
function attachWarpListeners(warpIndex) {
    const warpTab = document.getElementById(`warp-${warpIndex}`);
    if (!warpTab) return;

    const inputs = warpTab.querySelectorAll('.form-input:not([disabled])');
    inputs.forEach(input => {
        input.addEventListener('input', () => calculateWarp(warpIndex));
    });

    // Also attach to checkboxes
    const topBeamCheckbox = document.getElementById(`topbeam-${warpIndex}`);
    const bobinCheckbox = document.getElementById(`bobin-${warpIndex}`);

    if (topBeamCheckbox) topBeamCheckbox.addEventListener('change', () => calculateWarp(warpIndex));
    if (bobinCheckbox) bobinCheckbox.addEventListener('change', () => calculateWarp(warpIndex));
}

/**
 * Attach event listeners to weft inputs
 */
function attachWeftListeners(weftIndex) {
    const weftTab = document.getElementById(`weft-${weftIndex}`);
    if (!weftTab) return;

    const inputs = weftTab.querySelectorAll('.form-input:not([disabled])');
    inputs.forEach(input => {
        input.addEventListener('input', () => calculateWeft(weftIndex));
    });
}

/**
 * Initialize calculation system
 */
function initializeCalculations() {
    // Attach listeners to order length (affects all calculations)
    const orderLengthInput = document.getElementById('orderLength');
    if (orderLengthInput) {
        orderLengthInput.addEventListener('input', recalculateAll);
    }

    // Attach listeners to initial warp tab
    attachWarpListeners(1);

    // Attach listeners to initial weft tab
    attachWeftListeners(1);

    // Attach listeners to charges
    const monogramCheckbox = document.getElementById('monogram');
    const buttaCheckbox = document.getElementById('butta');
    const jobRateInput = document.getElementById('jobRatePercent');
    const yourSellingPriceInput = document.getElementById('yourSellingPrice');

    if (monogramCheckbox) monogramCheckbox.addEventListener('change', calculateCostingSummary);
    if (buttaCheckbox) buttaCheckbox.addEventListener('change', calculateCostingSummary);
    if (jobRateInput) jobRateInput.addEventListener('input', calculateCostingSummary);

    // IMPORTANT: Add listener to Your Selling Price input
    if (yourSellingPriceInput) {
        yourSellingPriceInput.addEventListener('input', calculateCostingSummary);
    } else {
        console.warn('⚠️ Your Selling Price input not found!');
    }

    // Initial calculation
    recalculateAll();

}
