/**
 * ============================================================================
 * SORT MASTER MANAGEMENT SYSTEM 2026
 * Calculations Module
 * ============================================================================
 * 
 * Contains all textile calculation formulas for Sort Master creation.
 * These calculations are the CORE of the system.
 * 
 * Key Constant: 0.0005905 (textile weight conversion factor)
 * 
 * @version 1.0
 * @author Sort Master System
 * @date December 25, 2025
 */

// ✅ FIX #1: CALC_CONSTANTS Definition - ADDED
var CALC_CONSTANTS = CALC_CONSTANTS || {
  WEIGHT_CONVERSION_FACTOR: 0.0005905,
  INCHES_TO_CM: 2.54,
  INCHES_TO_METERS: 0.0254,
  MM_TO_INCHES: 0.0394,
  
  DECIMAL_PRECISION: {
    FINAL_REED: 2,
    REED_SPACE: 3,
    WIDTH_CM: 2,
    GRMS_PER_MTR: 3,
    GLM: 3,
    GSM: 3,
    TOTAL_ENDS: 0
  }
};

/**
 * ============================================================================
 * REED & WIDTH CALCULATIONS
 * ============================================================================
 */

/**
 * Calculate Final Reed
 * Formula: finalReed = (reed × denting) ÷ 2
 * 
 * @param {number} reed - Base reed value
 * @param {number} denting - Denting value
 * @return {number} Final reed value (2 decimal places)
 */
function calculateFinalReed(reed, denting) {
  if (!reed || !denting) {
    return 0;
  }
  
  var finalReed = (parseFloat(reed) * parseFloat(denting)) / 2;
  return parseFloat(finalReed.toFixed(CALC_CONSTANTS.DECIMAL_PRECISION.FINAL_REED));
}

/**
 * Calculate Reed Space
 * Two formulas based on reedSpaceType:
 * - Type 0 (Simple): reedSpace = width + extraWidth
 * - Type 1 (Complex): reedSpace = ((finalReed + extraWidth) × width) ÷ finalReed
 * 
 * @param {number} width - Fabric width in inches
 * @param {number} extraWidth - Extra width (thread/gala)
 * @param {number} finalReed - Final reed value
 * @param {number} reedSpaceType - 0=Simple, 1=Complex
 * @return {number} Reed space value (2 decimal places)
 */
function calculateReedSpace(width, extraWidth, finalReed, reedSpaceType) {
  // ✅ FIX #3: extraWidth validation fixed - extraWidth can be 0
  if (!width || width === 0) {
    return 0;
  }
  
  // extraWidth defaults to 0 if not provided
  var extra = parseFloat(extraWidth) || 0;
  var w = parseFloat(width);
  var reedSpace = 0;
  
  if (reedSpaceType === 0 || !reedSpaceType) {
    // Simple formula
    reedSpace = w + extra;
  } else {
    // Complex formula
    if (!finalReed || finalReed === 0) {
      return 0;
    }
    reedSpace = ((parseFloat(finalReed) + extra) * w) / parseFloat(finalReed);
  }
  
  return parseFloat(reedSpace.toFixed(CALC_CONSTANTS.DECIMAL_PRECISION.REED_SPACE));
}

/**
 * Calculate Total Ends
 * Formula: totalEnds = reedSpace × finalReed (rounded up)
 * 
 * @param {number} reedSpace - Reed space value
 * @param {number} finalReed - Final reed value
 * @return {number} Total ends (integer, rounded up)
 */
function calculateTotalEnds(reedSpace, finalReed) {
  if (!reedSpace || !finalReed) {
    return 0;
  }
  
  var totalEnds = parseFloat(reedSpace) * parseFloat(finalReed);
  return Math.ceil(totalEnds);
}

/**
 * ============================================================================
 * SELVEDGE CALCULATIONS
 * ============================================================================
 */

/**
 * Calculate Selvedge Ends
 * Two methods based on selvedgeWidthType:
 * - Type 0 (Simple): selvedgeEnds = dents × endsPerDents
 * - Type 1 (Width-based): 
 *   calculatedDents = CEILING((reed ÷ 2 ÷ 25.4) × selvedgeWidth)
 *   selvedgeEnds = calculatedDents × endsPerDents × 2
 * 
 * @param {Object} params - Parameters object
 * @return {Object} {dents, selvedgeEnds, totalEnds}
 */
function calculateSelvedgeEnds(params) {
  var dents = params.dents || 0;
  var endsPerDents = params.endsPerDents || 0;
  var selvedgeWidthType = params.selvedgeWidthType || 0;
  var reed = params.reed || 0;
  var selvedgeWidth = params.selvedgeWidth || 0;
  var baseEnds = params.baseEnds || 0;
  
  var calculatedDents = dents;
  var selvedgeEnds = 0;
  
  if (selvedgeWidthType === 0 || !selvedgeWidthType) {
    // Simple method
    selvedgeEnds = parseFloat(dents) * parseFloat(endsPerDents);
  } else {
    // Width-based method
    if (reed && selvedgeWidth) {
      calculatedDents = Math.ceil((parseFloat(reed) / 2 / 25.4) * parseFloat(selvedgeWidth));
      selvedgeEnds = calculatedDents * parseFloat(endsPerDents) * 2;
    }
  }
  
  var totalEnds = parseFloat(baseEnds) + selvedgeEnds;
  
  return {
    dents: calculatedDents,
    selvedgeEnds: Math.ceil(selvedgeEnds),
    totalEnds: Math.ceil(totalEnds)
  };
}

/**
 * ============================================================================
 * WIDTH CONVERSIONS
 * ============================================================================
 */

/**
 * Convert width from inches to centimeters
 * Formula: widthInCm = widthInInches × 2.54
 * 
 * @param {number} widthInches - Width in inches
 * @return {number} Width in centimeters (3 decimal places)
 */
function convertInchesToCm(widthInches) {
  if (!widthInches) {
    return 0;
  }
  
  var widthCm = parseFloat(widthInches) * CALC_CONSTANTS.INCHES_TO_CM;
  return parseFloat(widthCm.toFixed(CALC_CONSTANTS.DECIMAL_PRECISION.WIDTH_CM));
}

/**
 * Convert width from inches to meters
 * Formula: widthInMeters = widthInInches ÷ 39.37
 * 
 * @param {number} widthInches - Width in inches
 * @return {number} Width in meters (4 decimal places)
 */
function convertInchesToMeters(widthInches) {
  if (!widthInches) {
    return 0;
  }
  
  var widthMeters = parseFloat(widthInches) * CALC_CONSTANTS.INCHES_TO_METERS;
  return parseFloat(widthMeters.toFixed(4));
}

/**
 * ============================================================================
 * WARP WEIGHT CALCULATIONS
 * ============================================================================
 */

/**
 * Calculate weight for a single warp row
 * 
 * Formula:
 * 1. ends = (totalEnds ÷ totalPattern) × pattern (rounded up)
 * 2. baseWeight = (ends × 0.0005905) ÷ englishCount
 * 3. weightWithShrinkage = baseWeight + (shrinkage% × baseWeight)
 * 
 * @param {Object} params - Parameters object
 * @return {Object} {ends, grmsWithShrinkage, grmsWithoutShrinkage}
 */
function calculateWarpWeight(params) {
  var pattern = params.pattern || 0;
  var totalPattern = params.totalPattern || 0;
  var totalEnds = params.totalEnds || 0;
  var englishCount = params.englishCount || 0;
  var wastePerShrink = params.wastePerShrink || 0;
  
  if (!pattern || !totalPattern || !totalEnds || !englishCount) {
    return {
      ends: 0,
      grmsWithShrinkage: 0,
      grmsWithoutShrinkage: 0
    };
  }
  
  // Step 1: Calculate ends for this warp row
  var endsForRow = (parseFloat(totalEnds) / parseFloat(totalPattern)) * parseFloat(pattern);
  var ends = Math.ceil(endsForRow);
  
  // Step 2: Calculate base weight (WITHOUT shrinkage)
  var baseWeight = (ends * CALC_CONSTANTS.WEIGHT_CONVERSION_FACTOR) / parseFloat(englishCount);
  
  // Step 3: Add shrinkage
  var shrinkageFactor = parseFloat(wastePerShrink) / 100;
  var weightWithShrinkage = baseWeight + (shrinkageFactor * baseWeight);
  
  return {
    ends: ends,
    grmsWithShrinkage: parseFloat(weightWithShrinkage.toFixed(CALC_CONSTANTS.DECIMAL_PRECISION.GRMS_PER_MTR)),
    grmsWithoutShrinkage: parseFloat(baseWeight.toFixed(CALC_CONSTANTS.DECIMAL_PRECISION.GRMS_PER_MTR))
  };
}

/**
 * ============================================================================
 * WEFT WEIGHT CALCULATIONS
 * ============================================================================
 */

/**
 * Calculate weight for a single weft row
 * 
 * Formula:
 * 1. picks = (totalPicks ÷ totalPattern) × pattern (rounded up)
 * 2. baseWeight = (reedSpace × picks × 0.0005905) ÷ englishCount
 * 3. weightWithShrinkage = baseWeight + (shrinkage% × baseWeight)
 * 4. If selvedgeWidthType=1: multiply by pickInsert
 * 
 * @param {Object} params - Parameters object
 * @return {Object} {picks, grmsWithShrinkage, grmsWithoutShrinkage}
 */
function calculateWeftWeight(params) {
  var pattern = params.pattern || 0;
  var totalPattern = params.totalPattern || 0;
  var totalPicks = params.totalPicks || 0;
  var reedSpace = params.reedSpace || 0;
  var englishCount = params.englishCount || 0;
  var wastePerShrink = params.wastePerShrink || 0;
  var pickInsert = params.pickInsert || 1;
  var selvedgeWidthType = params.selvedgeWidthType || 0;
  
  if (!pattern || !totalPattern || !totalPicks || !reedSpace || !englishCount) {
    return {
      picks: 0,
      grmsWithShrinkage: 0,
      grmsWithoutShrinkage: 0
    };
  }
  
  // Step 1: Calculate picks for this weft row
  var picksForRow = (parseFloat(totalPicks) / parseFloat(totalPattern)) * parseFloat(pattern);
  var picks = Math.ceil(picksForRow);
  
  // Step 2: Calculate base weight (WITHOUT shrinkage)
  var baseWeight = (parseFloat(reedSpace) * picks * CALC_CONSTANTS.WEIGHT_CONVERSION_FACTOR) / parseFloat(englishCount);
  
  // Step 3: Add shrinkage
  var shrinkageFactor = parseFloat(wastePerShrink) / 100;
  var weightWithShrinkage = baseWeight + (shrinkageFactor * baseWeight);
  
  // Step 4: Apply pick insert if selvedgeWidthType = 1
  if (selvedgeWidthType === 1 && pickInsert) {
    var pickInsertValue = parseFloat(pickInsert);
    weightWithShrinkage *= pickInsertValue;
    baseWeight *= pickInsertValue;
  }
  
  return {
    picks: picks,
    grmsWithShrinkage: parseFloat(weightWithShrinkage.toFixed(CALC_CONSTANTS.DECIMAL_PRECISION.GRMS_PER_MTR)),
    grmsWithoutShrinkage: parseFloat(baseWeight.toFixed(CALC_CONSTANTS.DECIMAL_PRECISION.GRMS_PER_MTR))
  };
}

/**
 * ============================================================================
 * GLM & GSM CALCULATIONS
 * ============================================================================
 */

/**
 * Calculate GLM (Grams per Linear Meter) and GSM (Grams per Square Meter)
 * 
 * Formulas:
 * 1. widthInMeters = widthInInches ÷ 39.37
 * 2. GLM = totalWarpGrms + totalWeftGrms
 * 3. GSM = GLM ÷ widthInMeters
 * 
 * @param {Object} params - Parameters object
 * @return {Object} {widthCm, widthMeters, glm, gsm}
 */
function calculateGLM_GSM(params) {
  var totalWarpGrms = params.totalWarpGrms || 0;
  var totalWeftGrms = params.totalWeftGrms || 0;
  var widthInches = params.widthInches || 0;
  
  if (!widthInches) {
    return {
      widthCm: 0,
      widthMeters: 0,
      glm: 0,
      gsm: 0
    };
  }
  
  // Convert width
  var widthCm = convertInchesToCm(widthInches);
  var widthMeters = convertInchesToMeters(widthInches);
  
  // Calculate GLM (Grams per Linear Meter)
  var glm = parseFloat(totalWarpGrms) + parseFloat(totalWeftGrms);
  
  // Calculate GSM (Grams per Square Meter)
  var gsm = widthMeters !== 0 ? glm / widthMeters : 0;
  
  return {
    widthCm: widthCm,
    widthMeters: parseFloat(widthMeters.toFixed(4)),
    glm: parseFloat(glm.toFixed(CALC_CONSTANTS.DECIMAL_PRECISION.GLM)),
    gsm: parseFloat(gsm.toFixed(CALC_CONSTANTS.DECIMAL_PRECISION.GSM))
  };
}

/**
 * ============================================================================
 * QUALITY STRING GENERATION
 * ============================================================================
 */

/**
 * Generate quality string from specifications
 * 
 * Format: 63" 2/80DENX32CTN 72X72 DOBBY
 * or with pattern: 63" 2/80DENX32CTN (1*1) 72X72 DOBBY
 * 
 * @param {Object} params - Parameters object
 * @return {string} Quality string
 */
function generateQualityString(params) {
  var width = params.width || 0;
  var warpData = params.warpData || [];
  var weftData = params.weftData || [];
  var finalReed = params.finalReed || 0;
  var totalPicks = params.totalPicks || 0;
  var weaveName = params.weaveName || '';
  var showWeftPattern = params.showWeftPattern || false;
  var includePlyInWeft = params.includePlyInWeft || false;
  
  if (!width || !warpData || !weftData || !finalReed || !totalPicks || !weaveName) {
    return '';
  }
  
  // Build warp string
  var warpString = '';
  for (var i = 0; i < warpData.length; i++) {
    var w = warpData[i];
    if (i === 0) {
      warpString += w.count + '/' + w.ply + w.code;
    } else {
      warpString += '+' + w.count + '/' + w.ply + w.code;
    }
  }
  
  // Build weft string
  var weftString = '';
  var patternString = '';
  
  for (var i = 0; i < weftData.length; i++) {
    var w = weftData[i];
    
    if (includePlyInWeft) {
      // Include ply in weft description
      if (i === 0) {
        weftString += w.count + '/' + w.ply + w.code;
      } else {
        weftString += '+' + w.count + '/' + w.ply + w.code;
      }
      
      // Build pattern string
      if (w.pattern) {
        patternString += '(' + w.pattern + '*' + w.ply + ')';
      }
    } else {
      // No ply in weft description
      if (i === 0) {
        weftString += w.count + w.code;
      } else {
        weftString += '+' + w.count + w.code;
      }
    }
  }
  
  // Assemble quality string
  var quality = width + '" ' + warpString + 'X' + weftString;
  
  if (showWeftPattern && patternString) {
    quality += ' ' + patternString;
  }
  
  quality += ' ' + Math.ceil(parseFloat(finalReed)) + 'X' + totalPicks + ' ' + weaveName;
  
  return quality;
}

/**
 * ============================================================================
 * PATTERN DISTRIBUTION
 * ============================================================================
 */

/**
 * Calculate total pattern from array of patterns
 * 
 * @param {Array} patterns - Array of pattern values
 * @return {number} Total pattern sum
 */
function calculateTotalPattern(patterns) {
  if (!patterns || patterns.length === 0) {
    return 0;
  }
  
  var total = 0;
  for (var i = 0; i < patterns.length; i++) {
    total += parseFloat(patterns[i] || 0);
  }
  
  return total;
}

/**
 * Distribute total value across patterns proportionally
 * 
 * @param {number} totalValue - Total value to distribute
 * @param {Array} patterns - Array of pattern values
 * @return {Array} Array of distributed values (rounded up)
 */
function distributeAcrossPatterns(totalValue, patterns) {
  if (!patterns || patterns.length === 0) {
    return [];
  }
  
  var totalPattern = calculateTotalPattern(patterns);
  
  if (totalPattern === 0) {
    return patterns.map(function() { return 0; });
  }
  
  var distributed = [];
  
  for (var i = 0; i < patterns.length; i++) {
    var value = (parseFloat(totalValue) / totalPattern) * parseFloat(patterns[i]);
    distributed.push(Math.ceil(value));
  }
  
  return distributed;
}

/**
 * ============================================================================
 * COMPLETE SORT MASTER CALCULATION
 * ============================================================================
 */

/**
 * Calculate all values for a Sort Master form
 * This is the master calculation function that ties everything together
 * 
 * @param {Object} formData - Complete form data
 * @return {Object} All calculated values
 */
function calculateAllSortMasterValues(formData) {
  try {
    var results = {};
    
    // Step 1: Calculate Final Reed
    results.finalReed = calculateFinalReed(formData.reed, formData.denting);
    
    // Step 2: Calculate Reed Space
    // ✅ FIX: Use threadOrGala (sent by HTML) with fallback to extraWidth
    results.reedSpace = calculateReedSpace(
      formData.width,
      formData.threadOrGala || formData.extraWidth || 0,
      results.finalReed,
      formData.reedSpaceType || 0
    );
    
    // Step 3: Calculate Base Ends
    var baseEnds = calculateTotalEnds(results.reedSpace, results.finalReed);
    
    // Step 4: Calculate Selvedge (if applicable)
    if (formData.hasSelvedge) {
      var selvedge = calculateSelvedgeEnds({
        dents: formData.dents,
        endsPerDents: formData.endsPerDents,
        selvedgeWidthType: formData.selvedgeWidthType || 0,
        reed: formData.reed,
        selvedgeWidth: formData.selvedgeWidth,
        baseEnds: baseEnds
      });
      
      results.dents = selvedge.dents;
      results.selvedgeEnds = selvedge.selvedgeEnds;
      results.totalEnds = selvedge.totalEnds;
    } else {
      results.totalEnds = baseEnds;
      results.selvedgeEnds = 0;
    }
    
    // Step 5: Calculate Warp Details
    var totalWarpGrms = 0;
    var totalWarpGrms_NoShrinkage = 0;
    var warpCalculations = [];
    
    if (formData.warpRows && formData.warpRows.length > 0) {
      var warpPatterns = formData.warpRows.map(function(r) { return r.pattern; });
      results.totalWarpPattern = calculateTotalPattern(warpPatterns);
      
      for (var i = 0; i < formData.warpRows.length; i++) {
        var row = formData.warpRows[i];
        var calc = calculateWarpWeight({
          pattern: row.pattern,
          totalPattern: results.totalWarpPattern,
          totalEnds: results.totalEnds,
          englishCount: row.englishCount,
          wastePerShrink: row.wastePerShrink
        });
        
        warpCalculations.push(calc);
        totalWarpGrms += calc.grmsWithShrinkage;
        totalWarpGrms_NoShrinkage += calc.grmsWithoutShrinkage;
      }
    }
    
    results.warpCalculations = warpCalculations;
    results.totalWarpGrmsPerMtr = parseFloat(totalWarpGrms.toFixed(3));
    results.totalWarpGrmsPerMtr_NoShrinkage = parseFloat(totalWarpGrms_NoShrinkage.toFixed(3));
    
    // Step 6: Calculate Weft Details
    var totalWeftGrms = 0;
    var totalWeftGrms_NoShrinkage = 0;
    var weftCalculations = [];
    
    if (formData.weftRows && formData.weftRows.length > 0) {
      var weftPatterns = formData.weftRows.map(function(r) { return r.pattern; });
      results.totalWeftPattern = calculateTotalPattern(weftPatterns);
      
      for (var i = 0; i < formData.weftRows.length; i++) {
        var row = formData.weftRows[i];
        var calc = calculateWeftWeight({
          pattern: row.pattern,
          totalPattern: results.totalWeftPattern,
          totalPicks: formData.totalPicks,
          reedSpace: results.reedSpace,
          englishCount: row.englishCount,
          wastePerShrink: row.wastePerShrink,
          pickInsert: formData.pickInsert || 1,
          selvedgeWidthType: formData.selvedgeWidthType || 0
        });
        
        weftCalculations.push(calc);
        totalWeftGrms += calc.grmsWithShrinkage;
        totalWeftGrms_NoShrinkage += calc.grmsWithoutShrinkage;
      }
    }
    
    results.weftCalculations = weftCalculations;
    results.totalWeftGrmsPerMtr = parseFloat(totalWeftGrms.toFixed(3));
    results.totalWeftGrmsPerMtr_NoShrinkage = parseFloat(totalWeftGrms_NoShrinkage.toFixed(3));
    
    // Step 7: Calculate GLM/GSM
    var glmGsm_WithShrinkage = calculateGLM_GSM({
      totalWarpGrms: results.totalWarpGrmsPerMtr,
      totalWeftGrms: results.totalWeftGrmsPerMtr,
      widthInches: formData.width
    });
    
    var glmGsm_NoShrinkage = calculateGLM_GSM({
      totalWarpGrms: results.totalWarpGrmsPerMtr_NoShrinkage,
      totalWeftGrms: results.totalWeftGrmsPerMtr_NoShrinkage,
      widthInches: formData.width
    });
    
    results.widthInCms = glmGsm_WithShrinkage.widthCm;
    results.glm = glmGsm_WithShrinkage.glm;
    results.gsm = glmGsm_WithShrinkage.gsm;
    results.glmWithoutShrinkage = glmGsm_NoShrinkage.glm;
    results.gsmWithoutShrinkage = glmGsm_NoShrinkage.gsm;
    
    // Step 8: Generate Quality String (if data available)
    if (formData.warpRows && formData.weftRows && formData.weaveName) {
      var warpData = formData.warpRows.map(function(r) {
        return {
          count: r.noOfCounts || 0,
          ply: r.ply || 1,
          code: r.yarnCode || ''
        };
      });
      
      var weftData = formData.weftRows.map(function(r) {
        return {
          count: r.noOfCounts || 0,
          ply: r.ply || 1,
          code: r.yarnCode || '',
          pattern: r.pattern || 0
        };
      });
      
      results.qualityString = generateQualityString({
        width: formData.width,
        warpData: warpData,
        weftData: weftData,
        finalReed: results.finalReed,
        totalPicks: formData.totalPicks,
        weaveName: formData.weaveName,
        showWeftPattern: formData.showWeftPattern || false,
        includePlyInWeft: formData.includePlyInWeft || false
      });
    }
    
    return results;
    
  } catch (error) {
    Logger.log('calculateAllSortMasterValues error: ' + error.message);
    throw error;
  }
}

// ✅ FIX #4: Missing calculateSortMaster function - ADDED
/**
 * Main server-side calculation function called from HTML
 * This is the entry point for client-side calculation requests
 * 
 * @param {Object} formData - Form data from client
 * @return {Object} {success, calculations, message}
 */
function calculateSortMaster(formData) {
  try {
    // Validate input
    if (!formData) {
      return {
        success: false,
        message: 'No form data provided',
        calculations: null
      };
    }
    
    // Log for debugging
    Logger.log('calculateSortMaster called with data:');
    Logger.log('Reed: ' + formData.reed);
    Logger.log('Denting: ' + formData.denting);
    Logger.log('Width: ' + formData.width);
    Logger.log('Extra Width: ' + formData.extraWidth);
    Logger.log('Picks: ' + formData.picks);
    Logger.log('Total Picks: ' + formData.totalPicks);
    
    // Perform calculations
    var calculations = calculateAllSortMasterValues(formData);
    
    Logger.log('Calculations complete:');
    Logger.log('Final Reed: ' + calculations.finalReed);
    Logger.log('Reed Space: ' + calculations.reedSpace);
    Logger.log('Total Ends: ' + calculations.totalEnds);
    
    return {
      success: true,
      calculations: calculations,
      message: 'Calculations complete'
    };
    
  } catch (error) {
    Logger.log('calculateSortMaster error: ' + error.message);
    Logger.log('Error stack: ' + error.stack);
    return {
      success: false,
      message: error.message,
      calculations: null
    };
  }
}

/**
 * ============================================================================
 * TESTING & VALIDATION
 * ============================================================================
 */

/**
 * Test all calculation functions
 */
function testCalculations() {
  Logger.log('========================================');
  Logger.log('CALCULATIONS TEST');
  Logger.log('========================================');
  
  // Test data from your example
  var testData = {
    reed: 72.0,
    denting: 2.0,
    width: 62.0,
    extraWidth: 1.0,
    picks: 72,
    totalPicks: 72,
    warpRows: [{
      pattern: 100,
      englishCount: 33.0,
      wastePerShrink: 7.0,
      noOfCounts: 80,
      ply: 2,
      yarnCode: 'DEN'
    }],
    weftRows: [{
      pattern: 1,
      englishCount: 32.0,
      wastePerShrink: 5.0,
      noOfCounts: 32,
      ply: 1,
      yarnCode: 'CTN'
    }],
    weaveName: 'DOBBY'
  };
  
  var results = calculateAllSortMasterValues(testData);
  
  Logger.log('Final Reed: ' + results.finalReed + ' (expected: 72.0)');
  Logger.log('Reed Space: ' + results.reedSpace + ' (expected: 63.0)');
  Logger.log('Total Ends: ' + results.totalEnds + ' (expected: 4536)');
  Logger.log('Total Warp Grms: ' + results.totalWarpGrmsPerMtr + ' (expected: 0.087)');
  Logger.log('Total Weft Grms: ' + results.totalWeftGrmsPerMtr + ' (expected: 0.088)');
  Logger.log('GLM: ' + results.glm + ' (expected: 0.175)');
  Logger.log('GSM: ' + results.gsm + ' (expected: 0.111)');
  
  Logger.log('========================================');
  Logger.log('CALCULATIONS TEST COMPLETE');
  Logger.log('========================================');
}