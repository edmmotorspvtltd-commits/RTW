/**
 * ============================================================================
 * SORT MASTER MANAGEMENT SYSTEM 2026
 * Warp Calculations Module
 * ============================================================================
 * 
 * Specialized module for warp-specific calculations including:
 * - Pattern distribution across total ends
 * - Multiple warp material support
 * - Beam type handling
 * - Size pickup calculations
 * 
 * @version 1.0
 * @author Sort Master System
 * @date December 25, 2025
 */

/**
 * ============================================================================
 * BATCH WARP CALCULATIONS
 * ============================================================================
 */

/**
 * Calculate all warp rows at once
 * This is the main function called when warp data changes
 * 
 * @param {number} totalEnds - Total ends (with or without selvedge)
 * @param {Array} warpRows - Array of warp row objects
 * @param {number} sizePickUpPercent - Size pickup percentage (optional)
 * @return {Object} {rows, totalPattern, totalGrms, totalGrms_NoShrinkage}
 */
function calculateAllWarpRows(totalEnds, warpRows, sizePickUpPercent) {
  try {
    if (!warpRows || warpRows.length === 0) {
      return {
        rows: [],
        totalPattern: 0,
        totalGrms: 0,
        totalGrms_NoShrinkage: 0
      };
    }
    
    // Calculate total pattern
    let totalPattern = 0;
    for (let i = 0; i < warpRows.length; i++) {
      totalPattern += parseFloat(warpRows[i].pattern || 0);
    }
    
    if (totalPattern === 0) {
      return {
        rows: [],
        totalPattern: 0,
        totalGrms: 0,
        totalGrms_NoShrinkage: 0
      };
    }
    
    // Calculate each row
    const calculatedRows = [];
    let totalGrms = 0;
    let totalGrms_NoShrinkage = 0;
    
    for (let i = 0; i < warpRows.length; i++) {
      const row = warpRows[i];
      
      const calc = calculateWarpRow({
        pattern: row.pattern,
        totalPattern: totalPattern,
        totalEnds: totalEnds,
        englishCount: row.englishCount,
        shrinkagePercent: row.shrinkage || row.wastePerShrink,
        beamType: row.beamType || row.beamTypeId,
        itemId: row.itemId,
        noOfCounts: row.noOfCounts,
        ply: row.ply,
        yarnCode: row.yarnCode
      });
      
      calculatedRows.push(calc);
      totalGrms += calc.grmsWithShrinkage;
      totalGrms_NoShrinkage += calc.grmsWithoutShrinkage;
    }
    
    // Apply size pickup if specified
    if (sizePickUpPercent && sizePickUpPercent > 0) {
      const sizePickUpFactor = parseFloat(sizePickUpPercent) / 100;
      totalGrms += (totalGrms * sizePickUpFactor);
      totalGrms_NoShrinkage += (totalGrms_NoShrinkage * sizePickUpFactor);
    }
    
    return {
      rows: calculatedRows,
      totalPattern: totalPattern,
      totalGrms: parseFloat(totalGrms.toFixed(3)),
      totalGrms_NoShrinkage: parseFloat(totalGrms_NoShrinkage.toFixed(3))
    };
    
  } catch (error) {
    Logger.log('calculateAllWarpRows error: ' + error.message);
    throw error;
  }
}

/**
 * ============================================================================
 * SINGLE WARP ROW CALCULATION
 * ============================================================================
 */

/**
 * Calculate a single warp row
 * 
 * @param {Object} params - Row parameters
 * @return {Object} Calculated row data
 */
function calculateWarpRow(params) {
  const {
    pattern,
    totalPattern,
    totalEnds,
    englishCount,
    shrinkagePercent,
    beamType,
    itemId,
    noOfCounts,
    ply,
    yarnCode
  } = params;
  
  // Calculate ends for this row
  const endsForRow = (parseFloat(totalEnds) / parseFloat(totalPattern)) * parseFloat(pattern);
  const ends = Math.ceil(endsForRow);
  
  // Calculate base weight (without shrinkage)
  const baseWeight = (ends * CALC_CONSTANTS.WEIGHT_CONVERSION_FACTOR) / parseFloat(englishCount);
  
  // Calculate weight with shrinkage
  const shrinkageFactor = parseFloat(shrinkagePercent || 0) / 100;
  const weightWithShrinkage = baseWeight + (shrinkageFactor * baseWeight);
  
  return {
    pattern: parseFloat(pattern),
    ends: ends,
    grmsWithShrinkage: parseFloat(weightWithShrinkage.toFixed(4)),
    grmsWithoutShrinkage: parseFloat(baseWeight.toFixed(4)),
    beamType: beamType,
    itemId: itemId,
    noOfCounts: noOfCounts,
    ply: ply,
    yarnCode: yarnCode,
    englishCount: englishCount,
    shrinkagePercent: shrinkagePercent
  };
}

/**
 * ============================================================================
 * PATTERN VALIDATION & UTILITIES
 * ============================================================================
 */

/**
 * Validate warp pattern data
 * Checks for:
 * - Required fields
 * - Valid numbers
 * - English count presence
 * - No duplicate beam type + material combinations
 * 
 * @param {Array} warpRows - Array of warp row objects
 * @return {Object} {valid, errors}
 */
function validateWarpData(warpRows) {
  const errors = [];
  
  if (!warpRows || warpRows.length === 0) {
    errors.push('At least one warp row is required');
    return { valid: false, errors: errors };
  }
  
  const beamMaterialCombos = [];
  
  for (let i = 0; i < warpRows.length; i++) {
    const row = warpRows[i];
    const rowNum = i + 1;
    
    // Check required fields
    if (!row.beamType && !row.beamTypeId) {
      errors.push('Row ' + rowNum + ': Beam type is required');
    }
    
    if (!row.pattern || parseFloat(row.pattern) <= 0) {
      errors.push('Row ' + rowNum + ': Pattern must be greater than 0');
    }
    
    if (!row.itemId) {
      errors.push('Row ' + rowNum + ': Material is required');
    }
    
    if (!row.englishCount || parseFloat(row.englishCount) <= 0) {
      errors.push('Row ' + rowNum + ': English count is required and must be greater than 0');
    }
    
    // Check for duplicate beam type + material
    const combo = (row.beamType || row.beamTypeId) + '_' + row.itemId;
    if (beamMaterialCombos.indexOf(combo) >= 0) {
      errors.push('Row ' + rowNum + ': Duplicate beam type + material combination');
    }
    beamMaterialCombos.push(combo);
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Get total pattern from warp rows
 * @param {Array} warpRows - Array of warp row objects
 * @return {number} Total pattern
 */
function getTotalWarpPattern(warpRows) {
  if (!warpRows || warpRows.length === 0) {
    return 0;
  }
  
  let total = 0;
  for (let i = 0; i < warpRows.length; i++) {
    total += parseFloat(warpRows[i].pattern || 0);
  }
  
  return total;
}

/**
 * Get total grams from calculated warp rows
 * @param {Array} calculatedRows - Array of calculated row objects
 * @param {boolean} withShrinkage - Include shrinkage or not
 * @return {number} Total grams per meter
 */
function getTotalWarpGrams(calculatedRows, withShrinkage) {
  if (!calculatedRows || calculatedRows.length === 0) {
    return 0;
  }
  
  let total = 0;
  
  for (let i = 0; i < calculatedRows.length; i++) {
    if (withShrinkage !== false) {
      total += calculatedRows[i].grmsWithShrinkage || 0;
    } else {
      total += calculatedRows[i].grmsWithoutShrinkage || 0;
    }
  }
  
  return parseFloat(total.toFixed(3));
}

/**
 * ============================================================================
 * BEAM TYPE DISTRIBUTION
 * ============================================================================
 */

/**
 * Get warp rows grouped by beam type
 * Useful for analysis and reporting
 * 
 * @param {Array} warpRows - Array of warp row objects
 * @return {Object} Grouped by beam type
 */
function groupWarpByBeamType(warpRows) {
  const grouped = {
    BOTTOM: [],
    TOP: [],
    BOBBIN: [],
    SELVEDGE: []
  };
  
  for (let i = 0; i < warpRows.length; i++) {
    const row = warpRows[i];
    const beamType = row.beamType || row.beamTypeId;
    
    const beamTypeName = BEAM_TYPES[beamType] || 'BOTTOM';
    
    if (grouped[beamTypeName]) {
      grouped[beamTypeName].push(row);
    }
  }
  
  return grouped;
}

/**
 * Calculate total ends by beam type
 * @param {Array} calculatedRows - Calculated warp rows
 * @param {Array} originalRows - Original warp rows (for beam type)
 * @return {Object} Ends by beam type
 */
function getEndsByBeamType(calculatedRows, originalRows) {
  const endsByBeam = {
    BOTTOM: 0,
    TOP: 0,
    BOBBIN: 0,
    SELVEDGE: 0
  };
  
  for (let i = 0; i < calculatedRows.length; i++) {
    const calc = calculatedRows[i];
    const orig = originalRows[i];
    
    const beamType = orig.beamType || orig.beamTypeId;
    const beamTypeName = BEAM_TYPES[beamType] || 'BOTTOM';
    
    if (endsByBeam[beamTypeName] !== undefined) {
      endsByBeam[beamTypeName] += calc.ends;
    }
  }
  
  return endsByBeam;
}

/**
 * ============================================================================
 * SIZE PICKUP CALCULATIONS
 * ============================================================================
 */

/**
 * Apply size pickup to warp weight
 * Size pickup is the extra weight added due to sizing process
 * 
 * @param {number} totalWarpGrms - Total warp grams before size pickup
 * @param {number} sizePickUpPercent - Size pickup percentage
 * @return {number} Total warp grams after size pickup
 */
function applySizePickup(totalWarpGrms, sizePickUpPercent) {
  if (!sizePickUpPercent || parseFloat(sizePickUpPercent) <= 0) {
    return totalWarpGrms;
  }
  
  const pickupFactor = parseFloat(sizePickUpPercent) / 100;
  const totalWithPickup = parseFloat(totalWarpGrms) + (parseFloat(totalWarpGrms) * pickupFactor);
  
  return parseFloat(totalWithPickup.toFixed(3));
}

/**
 * ============================================================================
 * WARP SUMMARY STATISTICS
 * ============================================================================
 */

/**
 * Get comprehensive warp statistics
 * @param {Object} calculatedData - Output from calculateAllWarpRows
 * @param {Array} originalRows - Original warp row data
 * @return {Object} Statistics object
 */
function getWarpStatistics(calculatedData, originalRows) {
  if (!calculatedData || !calculatedData.rows) {
    return {
      totalRows: 0,
      totalPattern: 0,
      totalEnds: 0,
      totalGrmsWithShrinkage: 0,
      totalGrmsWithoutShrinkage: 0,
      averageShrinkage: 0,
      beamTypeDistribution: {},
      materialDistribution: {}
    };
  }
  
  const rows = calculatedData.rows;
  
  // Calculate total ends
  let totalEnds = 0;
  let totalShrinkage = 0;
  const beamTypeCount = {};
  const materialCount = {};
  
  for (let i = 0; i < rows.length; i++) {
    totalEnds += rows[i].ends;
    totalShrinkage += parseFloat(rows[i].shrinkagePercent || 0);
    
    // Count beam types
    const beamType = BEAM_TYPES[originalRows[i].beamType || originalRows[i].beamTypeId] || 'BOTTOM';
    beamTypeCount[beamType] = (beamTypeCount[beamType] || 0) + 1;
    
    // Count materials
    const material = originalRows[i].itemName || 'Unknown';
    materialCount[material] = (materialCount[material] || 0) + 1;
  }
  
  const averageShrinkage = rows.length > 0 ? totalShrinkage / rows.length : 0;
  
  return {
    totalRows: rows.length,
    totalPattern: calculatedData.totalPattern,
    totalEnds: totalEnds,
    totalGrmsWithShrinkage: calculatedData.totalGrms,
    totalGrmsWithoutShrinkage: calculatedData.totalGrms_NoShrinkage,
    averageShrinkage: parseFloat(averageShrinkage.toFixed(2)),
    beamTypeDistribution: beamTypeCount,
    materialDistribution: materialCount
  };
}

/**
 * ============================================================================
 * WARP COMPARISON
 * ============================================================================
 */

/**
 * Compare two warp configurations
 * Useful for analyzing changes or alternatives
 * 
 * @param {Array} warpRows1 - First warp configuration
 * @param {Array} warpRows2 - Second warp configuration
 * @param {number} totalEnds - Total ends for both
 * @return {Object} Comparison results
 */
function compareWarpConfigurations(warpRows1, warpRows2, totalEnds) {
  const calc1 = calculateAllWarpRows(totalEnds, warpRows1);
  const calc2 = calculateAllWarpRows(totalEnds, warpRows2);
  
  const diff = {
    totalPatternDiff: calc2.totalPattern - calc1.totalPattern,
    totalGrmsDiff: calc2.totalGrms - calc1.totalGrms,
    totalGrmsDiff_NoShrinkage: calc2.totalGrms_NoShrinkage - calc1.totalGrms_NoShrinkage,
    percentageChange: ((calc2.totalGrms - calc1.totalGrms) / calc1.totalGrms * 100).toFixed(2) + '%'
  };
  
  return {
    config1: calc1,
    config2: calc2,
    difference: diff
  };
}

/**
 * ============================================================================
 * TESTING
 * ============================================================================
 */

/**
 * Test warp calculations with sample data
 */
function testWarpCalculations() {
  Logger.log('========================================');
  Logger.log('WARP CALCULATIONS TEST');
  Logger.log('========================================');
  
  const sampleWarpRows = [
    {
      beamType: 1, // Bottom
      pattern: 100,
      itemId: 40,
      itemName: '2/80',
      englishCount: 33.0,
      shrinkage: 7.0,
      noOfCounts: 80,
      ply: 2,
      yarnCode: 'DEN'
    }
  ];
  
  const totalEnds = 4536;
  
  // Test validation
  const validation = validateWarpData(sampleWarpRows);
  Logger.log('Validation: ' + (validation.valid ? 'PASSED' : 'FAILED'));
  if (!validation.valid) {
    Logger.log('Errors: ' + validation.errors.join(', '));
  }
  
  // Test calculation
  const result = calculateAllWarpRows(totalEnds, sampleWarpRows);
  
  Logger.log('\nCalculation Results:');
  Logger.log('Total Pattern: ' + result.totalPattern + ' (expected: 100)');
  Logger.log('Total Grams (with shrinkage): ' + result.totalGrms + ' (expected: ~0.087)');
  Logger.log('Total Grams (without shrinkage): ' + result.totalGrms_NoShrinkage + ' (expected: ~0.081)');
  
  // Test with size pickup
  const withSizePickup = applySizePickup(result.totalGrms, 5);
  Logger.log('With 5% size pickup: ' + withSizePickup);
  
  // Test statistics
  const stats = getWarpStatistics(result, sampleWarpRows);
  Logger.log('\nStatistics:');
  Logger.log('Total Rows: ' + stats.totalRows);
  Logger.log('Total Ends: ' + stats.totalEnds);
  Logger.log('Average Shrinkage: ' + stats.averageShrinkage + '%');
  Logger.log('Beam Types: ' + JSON.stringify(stats.beamTypeDistribution));
  
  Logger.log('========================================');
  Logger.log('WARP CALCULATIONS TEST COMPLETE');
  Logger.log('========================================');
}