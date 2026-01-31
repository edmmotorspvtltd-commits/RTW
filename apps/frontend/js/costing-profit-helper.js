/**
 * Calculate profit percentage based on current values
 * @returns {number} Profit percentage
 */
function calculateProfitPercentage() {
    // Get production cost from calculations
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

    // Add charges
    const topBeamCheckboxes = document.querySelectorAll('[id^="topbeam-"]');
    topBeamCheckboxes.forEach(cb => {
        if (cb.checked) additionalCharges += 0.50;
    });

    const bobinCheckboxes = document.querySelectorAll('[id^="bobin-"]');
    bobinCheckboxes.forEach(cb => {
        if (cb.checked) additionalCharges += 0.50;
    });

    const monogramCheckbox = document.getElementById('monogram');
    if (monogramCheckbox?.checked) additionalCharges += 0.50;

    const buttaCheckbox = document.getElementById('butta');
    if (buttaCheckbox?.checked) additionalCharges += 0.50;

    // Add job rate
    const jobRatePercent = parseFloat(document.getElementById('jobRatePercent')?.value) || 0;
    const jobRateCost = (totalWarpCost + totalWeftCost) * (jobRatePercent / 100);

    const productionCost = totalWarpCost + totalWeftCost + additionalCharges + jobRateCost;
    const yourSellingPrice = parseFloat(document.getElementById('yourSellingPrice')?.value) || 0;

    // Calculate profit percentage
    if (productionCost > 0 && yourSellingPrice > 0) {
        const netProfit = yourSellingPrice - productionCost;
        return (netProfit / productionCost) * 100;
    }

    return 0;
}
