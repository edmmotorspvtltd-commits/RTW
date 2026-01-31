/**
 * Backend Calculation Helper for Rapier Costing
 * Calculates all derived values from raw warp/weft/charges data
 * Mirrors frontend calculation logic
 */

/**
 * Calculate all costing values from raw data
 * @param {Object} params - Input parameters
 * @returns {Object} - All calculated values
 */
function calculateCostingValues(params) {
    const {
        orderLength = 0,
        warpData = [],
        weftData = [],
        chargesData = {},
        sellingPrice = 0
    } = params;

    // Initialize totals
    let totalWarpCost = 0;
    let totalWeftCost = 0;
    let totalWarpYarn = 0;
    let totalWeftYarn = 0;
    let warpGLMTotal = 0;
    let weftGLMTotal = 0;

    // Calculate warp totals
    warpData.forEach(warp => {
        const panna = parseFloat(warp.panna) || 0;
        const rsGap = parseFloat(warp.rsGap) || 0;
        const reed = parseFloat(warp.reed) || 0;
        const warpCount = parseFloat(warp.warpCount) || 0;
        const rateOfYarn = parseFloat(warp.rateOfYarn) || 0;
        const rateOfSizing = parseFloat(warp.rateOfSizing) || 0;

        // DBF = Panna + RS Gap
        const dbf = panna + rsGap;

        // Total Ends = DBF × Reed
        const totalEnds = dbf * reed;

        // Warp GLM = (Total Ends × 1.10) / (Warp Count × 590.5)
        const warpGLM = warpCount > 0 ? (totalEnds * 1.10) / (warpCount * 590.5) : 0;

        // Cost per Meter = (Warp GLM × Rate of Yarn) + Rate of Sizing
        const costPerMeter = (warpGLM * rateOfYarn) + rateOfSizing;

        // Yarn Required = (Warp GLM × Order Length) / 1000
        const yarnRequired = (warpGLM * orderLength) / 1000;

        totalWarpCost += costPerMeter;
        totalWarpYarn += yarnRequired;
        warpGLMTotal += warpGLM;
    });

    // Calculate weft totals
    weftData.forEach(weft => {
        const rs = parseFloat(weft.rs) || 0;
        const pick = parseFloat(weft.pick) || 0;
        const insertion = parseFloat(weft.insertion) || 0;
        const weftCount = parseFloat(weft.weftCount) || 0;
        const rateOfYarn = parseFloat(weft.rateOfYarn) || 0;
        const percentOfTotalWeft = parseFloat(weft.percentOfTotalWeft) || 100;

        // Weft GLM = (RS × Pick × Insertion × 1.10) / (Weft Count × 590.5)
        const weftGLM = weftCount > 0 ? (rs * pick * insertion * 1.10) / (weftCount * 590.5) : 0;

        // Cost per Meter = Weft GLM × Rate of Yarn
        const costPerMeter = weftGLM * rateOfYarn;

        // Yarn Required = (Weft GLM × Order Length × % of Total Weft) / (1000 × 100)
        const yarnRequired = (weftGLM * orderLength * percentOfTotalWeft) / (1000 * 100);

        totalWeftCost += costPerMeter;
        totalWeftYarn += yarnRequired;
        weftGLMTotal += weftGLM;
    });

    // Calculate additional charges
    let additionalCharges = 0;

    // Monogram and Butta charges
    if (chargesData.monogram) additionalCharges += 0.50;
    if (chargesData.butta) additionalCharges += 0.50;

    // Top beam and bobin charges (from warp data)
    warpData.forEach(warp => {
        if (warp.topBeam) additionalCharges += 0.50;
        if (warp.bobin) additionalCharges += 0.50;
    });

    // Job rate calculation
    const jobRatePercent = parseFloat(chargesData.jobRatePercent) || 0;
    const jobRateCost = (totalWarpCost + totalWeftCost) * (jobRatePercent / 100);

    // Expenses calculation
    const expensesPercent = parseFloat(chargesData.expensesPercent) || 0;
    const expensesCost = (totalWarpCost + totalWeftCost) * (expensesPercent / 100);

    // Brokerage calculation
    const brokeragePercent = parseFloat(chargesData.brokeragePercent) || 0;
    const brokerageCost = (totalWarpCost + totalWeftCost) * (brokeragePercent / 100);

    // Production Cost = Warp + Weft + Additional Charges + Job Rate + Expenses + Brokerage
    const productionCost = totalWarpCost + totalWeftCost + additionalCharges + jobRateCost + expensesCost + brokerageCost;

    // Minimum Selling Price (15% markup)
    const minimumSellingPrice = productionCost * 1.15;

    // Use provided selling price or minimum
    const finalSellingPrice = sellingPrice > 0 ? sellingPrice : minimumSellingPrice;

    // Net Profit = Selling Price - Production Cost
    const netProfit = finalSellingPrice - productionCost;

    // Profit Percentage = (Net Profit / Production Cost) × 100
    const profitPercentage = productionCost > 0 ? (netProfit / productionCost) * 100 : 0;

    // GLM per meter (total)
    const glmPerMeter = warpGLMTotal + weftGLMTotal;

    // Total yarn required
    const totalYarnRequired = totalWarpYarn + totalWeftYarn;

    // Return all calculated values
    return {
        // Warp totals
        totalWarpCost: parseFloat(totalWarpCost.toFixed(2)),
        totalWarpYarn: parseFloat(totalWarpYarn.toFixed(2)),
        warpGLMTotal: parseFloat(warpGLMTotal.toFixed(4)),

        // Weft totals
        totalWeftCost: parseFloat(totalWeftCost.toFixed(2)),
        totalWeftYarn: parseFloat(totalWeftYarn.toFixed(2)),
        weftGLMTotal: parseFloat(weftGLMTotal.toFixed(4)),

        // Combined totals
        glmPerMeter: parseFloat(glmPerMeter.toFixed(4)),
        totalYarnRequired: parseFloat(totalYarnRequired.toFixed(2)),

        // Charges
        additionalCharges: parseFloat(additionalCharges.toFixed(2)),
        jobRatePercentage: parseFloat(jobRatePercent.toFixed(2)),
        jobChargesPerMtr: parseFloat(jobRateCost.toFixed(2)),
        expensesPercentage: parseFloat(expensesPercent.toFixed(2)),
        expensesPerMtr: parseFloat(expensesCost.toFixed(2)),
        brokeragePercentage: parseFloat(brokeragePercent.toFixed(2)),
        brokeragePerMtr: parseFloat(brokerageCost.toFixed(2)),

        // Final calculations
        productionCost: parseFloat(productionCost.toFixed(2)),
        minimumSellingPrice: parseFloat(minimumSellingPrice.toFixed(2)),
        sellingPrice: parseFloat(finalSellingPrice.toFixed(2)),
        netProfitPerMtr: parseFloat(netProfit.toFixed(2)),
        profitPercentage: parseFloat(profitPercentage.toFixed(2)),

        // Per order totals
        netWarpTotal: parseFloat((totalWarpCost * orderLength).toFixed(2)),
        netWeftTotal: parseFloat((totalWeftCost * orderLength).toFixed(2)),
        totalProductionCost: parseFloat((productionCost * orderLength).toFixed(2)),
        totalNetProfit: parseFloat((netProfit * orderLength).toFixed(2))
    };
}

module.exports = {
    calculateCostingValues
};
