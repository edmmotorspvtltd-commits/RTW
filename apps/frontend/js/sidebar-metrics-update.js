// Simple direct update function for sidebar metrics
// Add this to rapier-costing.html in a <script> tag

function updateSidebarMetrics() {
    // Get the selling price from input
    const sellingPriceInput = document.getElementById('yourSellingPrice');
    if (!sellingPriceInput) return;

    const yourSellingPrice = parseFloat(sellingPriceInput.value) || 0;

    // Calculate totals from warp and weft
    let totalWarpCost = 0;
    let totalWeftCost = 0;
    let additionalCharges = 0;

    // Sum warp costs
    document.querySelectorAll('[id^="warp-"]').forEach(tab => {
        const inputs = tab.querySelectorAll('.form-input');
        const costPerMeter = parseFloat(inputs[5]?.value) || 0;
        totalWarpCost += costPerMeter;
    });

    // Sum weft costs
    document.querySelectorAll('[id^="weft-"]').forEach(tab => {
        const inputs = tab.querySelectorAll('.form-input');
        const costPerMeter = parseFloat(inputs[7]?.value) || 0;
        totalWeftCost += costPerMeter;
    });

    // Add checkbox charges
    document.querySelectorAll('[id^="topbeam-"]:checked, [id^="bobin-"]:checked').forEach(() => {
        additionalCharges += 0.50;
    });

    if (document.getElementById('monogram')?.checked) additionalCharges += 0.50;
    if (document.getElementById('butta')?.checked) additionalCharges += 0.50;

    // Job rate
    const jobRatePercent = parseFloat(document.getElementById('jobRatePercent')?.value) || 0;
    const jobRateCost = (totalWarpCost + totalWeftCost) * (jobRatePercent / 100);

    // Production cost
    const productionCost = totalWarpCost + totalWeftCost + additionalCharges + jobRateCost;

    // Minimum selling price (15% markup)
    const minimumSellingPrice = productionCost * 1.15;

    // Net profit
    const netProfit = yourSellingPrice - productionCost;
    const profitPercentage = productionCost > 0 ? (netProfit / productionCost) * 100 : 0;

    // Update all metric cards directly
    const metricCards = document.querySelectorAll('.metric-card');

    metricCards.forEach(card => {
        const label = card.querySelector('.metric-label');
        const value = card.querySelector('.metric-value');

        if (!label || !value) return;

        const labelText = label.textContent.toUpperCase();

        if (labelText.includes('PRODUCTION COST')) {
            value.innerHTML = `₹${productionCost.toFixed(2)}<span class="metric-unit">/mtr</span>`;
        } else if (labelText.includes('MINIMUM SELLING PRICE')) {
            value.innerHTML = `₹${minimumSellingPrice.toFixed(2)}<span class="metric-unit">/mtr</span>`;
        } else if (labelText.includes('YOUR SELLING PRICE') && !labelText.includes('ENTER')) {
            // Only update display card, not the input card
            if (!card.querySelector('input')) {
                value.innerHTML = `₹${yourSellingPrice.toFixed(2)}<span class="metric-unit">/mtr</span>`;
            }
        } else if (labelText.includes('NET PROFIT')) {
            value.innerHTML = `₹${netProfit.toFixed(2)}<span class="metric-unit">/mtr</span>`;

            // Update margin percentage
            const marginEl = card.querySelector('.metric-change');
            if (marginEl) {
                marginEl.textContent = `↑ ${Math.abs(profitPercentage).toFixed(2)}% Margin`;
                marginEl.className = profitPercentage >= 0 ? 'metric-change positive' : 'metric-change negative';
            }
        }
    });

    // Update the percentage in the purple input card
    const purpleCard = document.querySelector('[style*="linear-gradient(135deg, #667eea"]');
    if (purpleCard) {
        const percentText = purpleCard.querySelector('div[style*="-69.12%"]') ||
            purpleCard.querySelectorAll('div')[purpleCard.querySelectorAll('div').length - 2];
        if (percentText && !percentText.textContent.includes('Calculations')) {
            percentText.textContent = profitPercentage >= 0 ?
                `+${profitPercentage.toFixed(2)}%` :
                `${profitPercentage.toFixed(2)}%`;
            percentText.style.color = 'white';
            percentText.style.fontSize = '16px';
            percentText.style.fontWeight = '700';
            percentText.style.textAlign = 'center';
        }
    }
}

// Replace the old calculateCostSummary function
window.calculateCostSummary = updateSidebarMetrics;
