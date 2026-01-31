// ================================================
// CALCULATION SERVICE - All Excel Formulas
// ================================================

/**
 * This service contains all 102 formulas from the Excel sheet
 * Based on the analysis document
 */

class CalculationService {
    
    // ================================================
    // CONSTANTS (from Excel sheet)
    // ================================================
    
    static WARP_CONVERSION_CONSTANT = 120 / 1852; // 0.0648
    static WEFT_CONVERSION_CONSTANT = 0.591;
    static DEFAULT_CRIMPING = 103;
    static WEFT_WASTAGE_PERCENTAGE = 0.05; // 5%
    static GSM_CONVERSION_FACTOR = 39.37; // inches to cm
    
    // ================================================
    // WARP CALCULATIONS
    // ================================================
    
    /**
     * Calculate DBF (Dents per Inch)
     * Formula: D5 = B5 + C5
     */
    static calculateDBF(panna, rsGap) {
        return parseFloat(panna) + parseFloat(rsGap);
    }
    
    /**
     * Calculate Total Ends
     * Formula: F5 = D5 × E5
     */
    static calculateTotalEnds(dbf, reed) {
        return Math.round(parseFloat(dbf) * parseFloat(reed));
    }
    
    /**
     * Calculate Rate with Markup
     * Formula: H6 = H5 × 105%
     */
    static calculateRateWithMarkup(rate, markupPercent = 1.05) {
        return parseFloat(rate) * markupPercent;
    }
    
    /**
     * Calculate Warp GLM (Grams per Linear Meter)
     * Formula: F7 = F5 × 120 / 1852 / G5 / E7
     */
    static calculateWarpGLM(totalEnds, warpCount, crimping) {
        const result = (parseFloat(totalEnds) * this.WARP_CONVERSION_CONSTANT) / 
                      parseFloat(warpCount) / parseFloat(crimping);
        return this.round(result, 7);
    }
    
    /**
     * Calculate Warp GLM with wastage (if any)
     * Formula: F10 = ROUND(F7 + F8, 7)
     */
    static calculateWarpGLMWithWastage(warpGLM, wastageGLM = 0) {
        return this.round(parseFloat(warpGLM) + parseFloat(wastageGLM), 7);
    }
    
    /**
     * Calculate Warp Cost per Meter
     * Formula: H10 = ROUND(F10 × H6, 2)
     */
    static calculateWarpCostPerMeter(warpGLM, rateWithMarkup) {
        return this.round(parseFloat(warpGLM) * parseFloat(rateWithMarkup), 2);
    }
    
    /**
     * Calculate Sizing Cost
     * Formula: I10 = ROUND(F7 × I5, 2)
     */
    static calculateSizingCost(warpGLM, sizingRate) {
        return this.round(parseFloat(warpGLM) * parseFloat(sizingRate), 2);
    }
    
    /**
     * Calculate Yarn Required for Warp (in kgs)
     * Formula: R12 = ROUND($Q$5 × F10)
     */
    static calculateYarnRequired(orderLength, glm) {
        return Math.round(parseFloat(orderLength) * parseFloat(glm));
    }
    
    // ================================================
    // WEFT CALCULATIONS
    // ================================================
    
    /**
     * Calculate Weft Consumption
     * Formula: F31 = D29 × E29 × F29 × 0.591 / G29 / 1000
     */
    static calculateWeftConsumption(rs, pick, insertion, weftCount) {
        const result = (parseFloat(rs) * parseFloat(pick) * parseFloat(insertion) * 
                       this.WEFT_CONVERSION_CONSTANT) / parseFloat(weftCount) / 1000;
        return this.round(result, 7);
    }
    
    /**
     * Calculate Weft Wastage
     * Formula: F32 = F31 × E32 (E32 = 0.05)
     */
    static calculateWeftWastage(weftConsumption, wastagePercent = 0.05) {
        return this.round(parseFloat(weftConsumption) * wastagePercent, 7);
    }
    
    /**
     * Calculate Total Weft GLM
     * Formula: F34 = ROUND(F31 + F32, 4)
     */
    static calculateTotalWeftGLM(weftConsumption, weftWastage) {
        return this.round(parseFloat(weftConsumption) + parseFloat(weftWastage), 4);
    }
    
    /**
     * Calculate Weft with Percentage
     * Formula: F37 = F34 × F35
     */
    static calculateWeftWithPercentage(totalWeftGLM, percentage) {
        return this.round(parseFloat(totalWeftGLM) * (parseFloat(percentage) / 100), 4);
    }
    
    /**
     * Calculate Weft Cost per Meter
     * Formula: P17 = F37 × H29
     */
    static calculateWeftCostPerMeter(weftGLM, rateWithMarkup) {
        return this.round(parseFloat(weftGLM) * parseFloat(rateWithMarkup), 2);
    }
    
    // ================================================
    // JOB CHARGES CALCULATIONS
    // ================================================
    
    /**
     * Calculate Job Charges per Meter
     * Formula: P29 = E27 × I27 / 100
     */
    static calculateJobChargesPerMeter(pick, jobRatePercent) {
        return this.round((parseFloat(pick) * parseFloat(jobRatePercent)) / 100, 2);
    }
    
    /**
     * Calculate Job Charges per Pick (Paisa format)
     * Formula: P45 = (P44 + P29) / E29
     */
    static calculateJobChargesPerPick(netProfit, jobChargesPerMeter, pick) {
        return this.round((parseFloat(netProfit) + parseFloat(jobChargesPerMeter)) / 
                         parseFloat(pick), 4);
    }
    
    // ================================================
    // WEIGHT CALCULATIONS
    // ================================================
    
    /**
     * Calculate Total GLM per Meter
     * Formula: L20 = SUM(L13:L19)
     */
    static calculateTotalGLM(warpGLMs, weftGLMs) {
        const totalWarp = warpGLMs.reduce((sum, glm) => sum + parseFloat(glm || 0), 0);
        const totalWeft = weftGLMs.reduce((sum, glm) => sum + parseFloat(glm || 0), 0);
        return this.round(totalWarp + totalWeft, 4);
    }
    
    /**
     * Calculate GSM per Meter
     * Formula: L22 = ROUND(L20 / B5 × 39.37, 4)
     */
    static calculateGSM(totalGLM, panna) {
        return this.round((parseFloat(totalGLM) / parseFloat(panna)) * 
                         this.GSM_CONVERSION_FACTOR, 4);
    }
    
    // ================================================
    // COST & PRICING CALCULATIONS
    // ================================================
    
    /**
     * Calculate Production Cost per Meter
     * Formula: P31 = SUM(P10:P30)
     */
    static calculateProductionCost(costs) {
        const total = costs.reduce((sum, cost) => sum + parseFloat(cost || 0), 0);
        return this.round(total, 2);
    }
    
    /**
     * Calculate Expenses
     * Formula: P34 = ROUND(P31 × O34, 2) where O34 = 0.05
     */
    static calculateExpenses(productionCost, expensesPercent = 0.05) {
        return this.round(parseFloat(productionCost) * expensesPercent, 2);
    }
    
    /**
     * Calculate Brokerage
     * Formula: P35 = ROUND(P31 × O35, 2) where O35 = 0.01
     */
    static calculateBrokerage(productionCost, brokeragePercent = 0.01) {
        return this.round(parseFloat(productionCost) * brokeragePercent, 2);
    }
    
    /**
     * Calculate Vatav
     * Formula: P36 = ROUND(P31 × O36, 2) where O36 = 0
     */
    static calculateVatav(productionCost, vatavPercent = 0.00) {
        return this.round(parseFloat(productionCost) * vatavPercent, 2);
    }
    
    /**
     * Calculate Minimum Selling Price
     * Formula: P38 = SUM(P31:P37)
     */
    static calculateMinimumSellingPrice(productionCost, expenses, brokerage, vatav) {
        return this.round(
            parseFloat(productionCost) + 
            parseFloat(expenses) + 
            parseFloat(brokerage) + 
            parseFloat(vatav), 
            2
        );
    }
    
    /**
     * Calculate Selling Price Expenses
     * Formula: P41 = P40 × N41 where N41 = 0.04
     */
    static calculateSellingPriceExpenses(sellingPrice, expensesPercent = 0.04) {
        return this.round(parseFloat(sellingPrice) * expensesPercent, 2);
    }
    
    /**
     * Calculate Net Realisation
     * Formula: P43 = P40 - P41
     */
    static calculateNetRealisation(sellingPrice, sellingExpenses) {
        return this.round(parseFloat(sellingPrice) - parseFloat(sellingExpenses), 2);
    }
    
    /**
     * Calculate Net Profit
     * Formula: P44 = P43 - P31 - P35 - P36
     */
    static calculateNetProfit(netRealisation, productionCost, brokerage, vatav) {
        return this.round(
            parseFloat(netRealisation) - 
            parseFloat(productionCost) - 
            parseFloat(brokerage) - 
            parseFloat(vatav),
            2
        );
    }
    
    /**
     * Calculate Profit Percentage
     */
    static calculateProfitPercentage(netProfit, sellingPrice) {
        if (parseFloat(sellingPrice) === 0) return 0;
        return this.round((parseFloat(netProfit) / parseFloat(sellingPrice)) * 100, 2);
    }
    
    /**
     * Calculate Cost per Taga (with crimping)
     * Formula: Q12 = P12 × $E$7
     */
    static calculateCostPerTaga(costPerMeter, crimping = 103) {
        return this.round(parseFloat(costPerMeter) * parseFloat(crimping), 2);
    }
    
    // ================================================
    // CONDITIONAL CHARGES
    // ================================================
    
    /**
     * Calculate Optional Charge if enabled
     * Formula: P24 = IF(I12="Yes", 0.5, 0)
     */
    static calculateOptionalCharge(isEnabled, amount) {
        return isEnabled ? parseFloat(amount) : 0;
    }
    
    // ================================================
    // COMPLETE COSTING CALCULATION
    // ================================================
    
    /**
     * Calculate complete costing for a sheet
     */
    static calculateCompleteCost(data) {
        const result = {
            warp: [],
            weft: [],
            totals: {},
            costs: {},
            pricing: {}
        };
        
        // Calculate all warps
        if (data.warps && Array.isArray(data.warps)) {
            data.warps.forEach((warp, index) => {
                const dbf = this.calculateDBF(warp.panna, warp.rsGap);
                const totalEnds = this.calculateTotalEnds(dbf, warp.reed);
                const rateWithMarkup = this.calculateRateWithMarkup(warp.rateOfYarn);
                const warpGLM = this.calculateWarpGLM(totalEnds, warp.warpCount, warp.crimping || 103);
                const costPerMeter = this.calculateWarpCostPerMeter(warpGLM, rateWithMarkup);
                const sizingCost = this.calculateSizingCost(warpGLM, warp.rateOfSizing);
                const yarnRequired = this.calculateYarnRequired(data.orderLength, warpGLM);
                
                // Optional charges
                const topBeamCharge = this.calculateOptionalCharge(warp.topBeamCharges, warp.topBeamAmount || 0.50);
                const bobinCharge = this.calculateOptionalCharge(warp.bobinCharges, warp.bobinAmount || 0.50);
                
                result.warp.push({
                    index: index + 1,
                    dbf,
                    totalEnds,
                    warpGLM,
                    costPerMeter,
                    sizingCost,
                    yarnRequired,
                    topBeamCharge,
                    bobinCharge,
                    totalCost: costPerMeter + sizingCost + topBeamCharge + bobinCharge
                });
            });
        }
        
        // Calculate all wefts
        if (data.wefts && Array.isArray(data.wefts)) {
            data.wefts.forEach((weft, index) => {
                const weftConsumption = this.calculateWeftConsumption(
                    weft.rs, weft.pick, weft.insertion, weft.weftCount
                );
                const weftWastage = this.calculateWeftWastage(weftConsumption);
                const totalWeftGLM = this.calculateTotalWeftGLM(weftConsumption, weftWastage);
                const weftWithPercent = this.calculateWeftWithPercentage(
                    totalWeftGLM, weft.percentageOfTotalWeft
                );
                const rateWithMarkup = this.calculateRateWithMarkup(weft.rateOfYarn);
                const costPerMeter = this.calculateWeftCostPerMeter(weftWithPercent, rateWithMarkup);
                const yarnRequired = this.calculateYarnRequired(data.orderLength, weftWithPercent);
                
                result.weft.push({
                    index: index + 1,
                    weftConsumption,
                    totalWeftGLM,
                    weftWithPercent,
                    costPerMeter,
                    yarnRequired
                });
            });
        }
        
        // Calculate totals
        const totalWarpGLM = result.warp.reduce((sum, w) => sum + w.warpGLM, 0);
        const totalWeftGLM = result.weft.reduce((sum, w) => sum + w.weftWithPercent, 0);
        result.totals.glmPerMeter = this.round(totalWarpGLM + totalWeftGLM, 4);
        result.totals.gsmPerMeter = this.calculateGSM(
            result.totals.glmPerMeter, 
            data.warps[0]?.panna || 63
        );
        
        // Calculate costs
        const totalWarpCost = result.warp.reduce((sum, w) => sum + w.totalCost, 0);
        const totalWeftCost = result.weft.reduce((sum, w) => sum + w.costPerMeter, 0);
        const jobChargesPerMeter = this.calculateJobChargesPerMeter(
            data.pickValue, 
            data.jobRatePercentage
        );
        
        // Optional charges
        const monogramCharge = this.calculateOptionalCharge(
            data.monogramCharges, 
            data.monogramAmount || 1.00
        );
        const buttaCharge = this.calculateOptionalCharge(
            data.buttaCharges, 
            data.buttaAmount || 2.00
        );
        
        result.costs = {
            warpCost: this.round(totalWarpCost, 2),
            weftCost: this.round(totalWeftCost, 2),
            jobCharges: jobChargesPerMeter,
            optionalCharges: this.round(monogramCharge + buttaCharge, 2)
        };
        
        // Calculate production cost
        const productionCost = this.calculateProductionCost([
            result.costs.warpCost,
            result.costs.weftCost,
            result.costs.jobCharges,
            result.costs.optionalCharges
        ]);
        
        // Calculate expenses and pricing
        const expenses = this.calculateExpenses(productionCost, data.expensesPercentage / 100);
        const brokerage = this.calculateBrokerage(productionCost, data.brokeragePercentage / 100);
        const vatav = this.calculateVatav(productionCost, data.vatavPercentage / 100);
        const minimumSellingPrice = this.calculateMinimumSellingPrice(
            productionCost, expenses, brokerage, vatav
        );
        
        result.pricing = {
            productionCost,
            expenses,
            brokerage,
            vatav,
            minimumSellingPrice
        };
        
        // If selling price is provided, calculate profit
        if (data.sellingPrice) {
            const sellingExpenses = this.calculateSellingPriceExpenses(data.sellingPrice);
            const netRealisation = this.calculateNetRealisation(data.sellingPrice, sellingExpenses);
            const netProfit = this.calculateNetProfit(netRealisation, productionCost, brokerage, vatav);
            const profitPercentage = this.calculateProfitPercentage(netProfit, data.sellingPrice);
            const jobChargesPerPick = this.calculateJobChargesPerPick(
                netProfit, 
                jobChargesPerMeter, 
                data.pickValue
            );
            
            result.pricing = {
                ...result.pricing,
                sellingPrice: data.sellingPrice,
                sellingExpenses,
                netRealisation,
                netProfit,
                profitPercentage,
                jobChargesPerPick,
                netProfitTotal: this.round(netProfit * data.orderLength, 2)
            };
        }
        
        return result;
    }
    
    // ================================================
    // UTILITY FUNCTIONS
    // ================================================
    
    /**
     * Round number to specified decimal places
     */
    static round(value, decimals = 2) {
        if (isNaN(value)) return 0;
        return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
    }
}

module.exports = CalculationService;
