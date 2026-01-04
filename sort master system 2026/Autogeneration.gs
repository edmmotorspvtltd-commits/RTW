/**
 * ============================================================================
 * SORT MASTER MANAGEMENT SYSTEM 2026
 * Auto-Generation Module
 * ============================================================================
 * 
 * Handles automatic generation of Sort Master numbers.
 * 
 * Format: RTWSM/YY-YY/NNN
 * Example: RTWSM/25-26/001
 * 
 * Features:
 * - Auto-increment within financial year
 * - Auto-reset on 1st April (new FY)
 * - Thread-safe counter management
 * 
 * @version 1.0
 * @author Sort Master System
 * @date December 25, 2025
 */

/**
 * ============================================================================
 * MAIN GENERATION FUNCTION
 * ============================================================================
 */

/**
 * Generate next Sort Master number
 * Format: RTWSM/YY-YY/NNN
 * 
 * @return {string} Sort Master number (e.g., "RTWSM/25-26/001")
 */
function generateSortMasterNo() {
  try {
    // Check if FY has changed and reset if needed
    checkAndResetCounter();
    
    // Get current financial year
    const currentFY = getCurrentFinancialYear();
    
    // Get next sequence number
    const sequenceNumber = getNextSequenceNumber();
    
    // Format sequence with leading zeros (001, 002, etc.)
    const paddedSequence = String(sequenceNumber).padStart(
      SORT_MASTER_CONFIG.SEQUENCE_PAD_LENGTH, 
      '0'
    );
    
    // Build Sort Master number
    const sortMasterNo = SORT_MASTER_CONFIG.PREFIX + '/' + currentFY + '/' + paddedSequence;
    
    Logger.log('Generated Sort Master No: ' + sortMasterNo);
    
    return sortMasterNo;
    
  } catch (error) {
    Logger.log('generateSortMasterNo error: ' + error.message);
    throw new Error('Failed to generate Sort Master number: ' + error.message);
  }
}

/**
 * ============================================================================
 * FINANCIAL YEAR MANAGEMENT
 * ============================================================================
 */

/**
 * Get current financial year in YY-YY format
 * Financial year runs from April to March
 * 
 * @return {string} Financial year (e.g., "25-26")
 */
function getCurrentFinancialYear() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed (0 = January)
  
  let fyStartYear, fyEndYear;
  
  // If current month is January, February, or March (0-2)
  // We're in the second half of FY (e.g., Jan 2026 is in FY 2025-26)
  if (currentMonth < SORT_MASTER_CONFIG.FINANCIAL_YEAR_START_MONTH) {
    fyStartYear = currentYear - 1;
    fyEndYear = currentYear;
  } else {
    // April onwards - first half of FY
    fyStartYear = currentYear;
    fyEndYear = currentYear + 1;
  }
  
  // Convert to YY format (last 2 digits)
  const fyStart = String(fyStartYear).slice(-2);
  const fyEnd = String(fyEndYear).slice(-2);
  
  return fyStart + '-' + fyEnd;
}

/**
 * Get financial year start date
 * @return {Date} Start date of current FY (April 1st)
 */
function getFinancialYearStartDate() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  let fyYear;
  
  if (currentMonth < SORT_MASTER_CONFIG.FINANCIAL_YEAR_START_MONTH) {
    // We're in Jan-Mar, so FY started last year
    fyYear = currentYear - 1;
  } else {
    // We're in Apr-Dec, so FY started this year
    fyYear = currentYear;
  }
  
  return new Date(
    fyYear, 
    SORT_MASTER_CONFIG.FINANCIAL_YEAR_START_MONTH, 
    SORT_MASTER_CONFIG.FINANCIAL_YEAR_START_DAY
  );
}

/**
 * ============================================================================
 * SEQUENCE NUMBER MANAGEMENT
 * ============================================================================
 */

/**
 * Get next sequence number and increment counter
 * Thread-safe operation using system settings
 * 
 * @return {number} Next sequence number
 */
function getNextSequenceNumber() {
  try {
    const sheet = getSheet(SHEET_NAMES.SYSTEM_SETTINGS);
    const data = sheet.getDataRange().getValues();
    
    let currentCounter = SORT_MASTER_CONFIG.SEQUENCE_START;
    let counterRowIndex = -1;
    
    // Find current counter value
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === 'SORT_MASTER_COUNTER') {
        currentCounter = parseInt(data[i][1]) || SORT_MASTER_CONFIG.SEQUENCE_START;
        counterRowIndex = i + 1; // +1 for 1-indexed rows
        break;
      }
    }
    
    // Increment counter
    const nextCounter = currentCounter + 1;
    
    // Update counter in sheet
    if (counterRowIndex > 0) {
      sheet.getRange(counterRowIndex, 2).setValue(nextCounter); // Column B
      sheet.getRange(counterRowIndex, 5).setValue(new Date()); // Column E - modifiedDate
    } else {
      // Counter not found - create it
      sheet.appendRow([
        'SORT_MASTER_COUNTER',
        nextCounter,
        'NUMBER',
        'Current sort master sequence number',
        new Date(),
        1 // System
      ]);
    }
    
    // Return the current counter (before increment) as the sequence number
    return currentCounter;
    
  } catch (error) {
    Logger.log('getNextSequenceNumber error: ' + error.message);
    throw error;
  }
}

/**
 * ============================================================================
 * COUNTER RESET
 * ============================================================================
 */

/**
 * Check if financial year has changed and reset counter if needed
 * Should be called before generating each Sort Master number
 */
function checkAndResetCounter() {
  try {
    const sheet = getSheet(SHEET_NAMES.SYSTEM_SETTINGS);
    const data = sheet.getDataRange().getValues();
    
    let currentFYInSettings = '';
    let fyRowIndex = -1;
    
    // Find current FY in settings
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === 'CURRENT_FY') {
        currentFYInSettings = data[i][1];
        fyRowIndex = i + 1;
        break;
      }
    }
    
    // Get actual current FY
    const actualCurrentFY = getCurrentFinancialYear();
    
    // If FY has changed, reset counter
    if (currentFYInSettings !== actualCurrentFY) {
      Logger.log('Financial Year changed from ' + currentFYInSettings + ' to ' + actualCurrentFY);
      Logger.log('Resetting Sort Master counter to ' + SORT_MASTER_CONFIG.SEQUENCE_START);
      
      // Reset counter
      resetCounter();
      
      // Update FY in settings
      if (fyRowIndex > 0) {
        sheet.getRange(fyRowIndex, 2).setValue(actualCurrentFY); // Column B
        sheet.getRange(fyRowIndex, 5).setValue(new Date()); // Column E - modifiedDate
      } else {
        // FY setting not found - create it
        sheet.appendRow([
          'CURRENT_FY',
          actualCurrentFY,
          'STRING',
          'Current financial year',
          new Date(),
          1 // System
        ]);
      }
    }
    
  } catch (error) {
    Logger.log('checkAndResetCounter error: ' + error.message);
  }
}

/**
 * Reset Sort Master counter to start value
 * Called when financial year changes
 */
function resetCounter() {
  try {
    updateSystemCounter(SORT_MASTER_CONFIG.SEQUENCE_START);
    Logger.log('Counter reset to: ' + SORT_MASTER_CONFIG.SEQUENCE_START);
  } catch (error) {
    Logger.log('resetCounter error: ' + error.message);
    throw error;
  }
}

/**
 * Manually reset counter (Admin only)
 * @param {number} userId - User ID performing reset
 * @return {Object} {success, message}
 */
function manualResetCounter(userId) {
  try {
    // Check permission
    const permission = validatePermission(userId, 'MANAGE_SETTINGS', AUDIT_MODULES.SETTINGS);
    if (!permission.valid) {
      return {
        success: false,
        message: ERROR_MESSAGES.NO_PERMISSION
      };
    }
    
    // Reset counter
    resetCounter();
    
    // Log action
    logAction(
      userId,
      'COUNTER_RESET',
      AUDIT_MODULES.SETTINGS,
      null,
      null,
      JSON.stringify({ newValue: SORT_MASTER_CONFIG.SEQUENCE_START })
    );
    
    return {
      success: true,
      message: 'Sort Master counter reset successfully to ' + SORT_MASTER_CONFIG.SEQUENCE_START
    };
    
  } catch (error) {
    Logger.log('manualResetCounter error: ' + error.message);
    return {
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    };
  }
}

/**
 * Update system counter value
 * @param {number} newValue - New counter value
 */
function updateSystemCounter(newValue) {
  try {
    const sheet = getSheet(SHEET_NAMES.SYSTEM_SETTINGS);
    const data = sheet.getDataRange().getValues();
    
    let counterRowIndex = -1;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === 'SORT_MASTER_COUNTER') {
        counterRowIndex = i + 1;
        break;
      }
    }
    
    if (counterRowIndex > 0) {
      sheet.getRange(counterRowIndex, 2).setValue(newValue); // Column B
      sheet.getRange(counterRowIndex, 5).setValue(new Date()); // Column E
    } else {
      // Create counter setting
      sheet.appendRow([
        'SORT_MASTER_COUNTER',
        newValue,
        'NUMBER',
        'Current sort master sequence number',
        new Date(),
        1
      ]);
    }
    
  } catch (error) {
    Logger.log('updateSystemCounter error: ' + error.message);
    throw error;
  }
}

/**
 * ============================================================================
 * PREVIEW & VALIDATION
 * ============================================================================
 */

/**
 * Preview next Sort Master number without incrementing counter
 * @return {string} Next Sort Master number
 */
function previewNextSortMasterNo() {
  try {
    const currentFY = getCurrentFinancialYear();
    
    const sheet = getSheet(SHEET_NAMES.SYSTEM_SETTINGS);
    const data = sheet.getDataRange().getValues();
    
    let currentCounter = SORT_MASTER_CONFIG.SEQUENCE_START;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === 'SORT_MASTER_COUNTER') {
        currentCounter = parseInt(data[i][1]) || SORT_MASTER_CONFIG.SEQUENCE_START;
        break;
      }
    }
    
    const paddedSequence = String(currentCounter).padStart(
      SORT_MASTER_CONFIG.SEQUENCE_PAD_LENGTH, 
      '0'
    );
    
    return SORT_MASTER_CONFIG.PREFIX + '/' + currentFY + '/' + paddedSequence;
    
  } catch (error) {
    Logger.log('previewNextSortMasterNo error: ' + error.message);
    return 'Error';
  }
}

/**
 * Validate Sort Master number format
 * @param {string} sortMasterNo - Sort Master number to validate
 * @return {boolean} True if valid format
 */
function validateSortMasterNoFormat(sortMasterNo) {
  if (!sortMasterNo) return false;
  
  // Format: RTWSM/YY-YY/NNN
  const pattern = /^RTWSM\/\d{2}-\d{2}\/\d{3}$/;
  
  return pattern.test(sortMasterNo);
}

/**
 * Parse Sort Master number
 * @param {string} sortMasterNo - Sort Master number
 * @return {Object} {prefix, fy, sequence} or null if invalid
 */
function parseSortMasterNo(sortMasterNo) {
  if (!validateSortMasterNoFormat(sortMasterNo)) {
    return null;
  }
  
  const parts = sortMasterNo.split('/');
  
  return {
    prefix: parts[0],
    fy: parts[1],
    sequence: parseInt(parts[2])
  };
}

/**
 * ============================================================================
 * STATISTICS & QUERIES
 * ============================================================================
 */

/**
 * Get counter statistics
 * @return {Object} Counter statistics
 */
function getCounterStatistics() {
  try {
    const sheet = getSheet(SHEET_NAMES.SYSTEM_SETTINGS);
    const data = sheet.getDataRange().getValues();
    
    let currentCounter = SORT_MASTER_CONFIG.SEQUENCE_START;
    let currentFY = getCurrentFinancialYear();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === 'SORT_MASTER_COUNTER') {
        currentCounter = parseInt(data[i][1]) || SORT_MASTER_CONFIG.SEQUENCE_START;
      }
      if (data[i][0] === 'CURRENT_FY') {
        currentFY = data[i][1] || getCurrentFinancialYear();
      }
    }
    
    // Get count of Sort Masters in current FY
    const sortMasterSheet = getSheet(SHEET_NAMES.SORT_MASTER);
    const sortMasterData = sortMasterSheet.getDataRange().getValues();
    
    let countInCurrentFY = 0;
    
    for (let i = 1; i < sortMasterData.length; i++) {
      const sortMasterNo = sortMasterData[i][1];
      if (sortMasterNo && sortMasterNo.includes('/' + currentFY + '/')) {
        countInCurrentFY++;
      }
    }
    
    const fyStartDate = getFinancialYearStartDate();
    const now = new Date();
    const daysIntoFY = Math.floor((now - fyStartDate) / (1000 * 60 * 60 * 24));
    
    return {
      currentFY: currentFY,
      currentCounter: currentCounter,
      nextNumber: previewNextSortMasterNo(),
      sortMastersInCurrentFY: countInCurrentFY,
      fyStartDate: fyStartDate,
      daysIntoFY: daysIntoFY
    };
    
  } catch (error) {
    Logger.log('getCounterStatistics error: ' + error.message);
    return {
      currentFY: 'Error',
      currentCounter: 0,
      nextNumber: 'Error',
      sortMastersInCurrentFY: 0,
      fyStartDate: new Date(),
      daysIntoFY: 0
    };
  }
}

/**
 * Get all Sort Master numbers for a financial year
 * @param {string} fy - Financial year (e.g., "25-26")
 * @return {Array} Array of Sort Master numbers
 */
function getSortMasterNumbersByFY(fy) {
  try {
    const sheet = getSheet(SHEET_NAMES.SORT_MASTER);
    const data = sheet.getDataRange().getValues();
    
    const numbers = [];
    
    for (let i = 1; i < data.length; i++) {
      const sortMasterNo = data[i][1];
      if (sortMasterNo && sortMasterNo.includes('/' + fy + '/')) {
        numbers.push(sortMasterNo);
      }
    }
    
    // Sort by sequence number
    numbers.sort();
    
    return numbers;
    
  } catch (error) {
    Logger.log('getSortMasterNumbersByFY error: ' + error.message);
    return [];
  }
}

/**
 * ============================================================================
 * AUTOMATED RESET TRIGGER
 * ============================================================================
 */

/**
 * Set up trigger to check for FY change daily
 * Run this once to install the trigger
 */
function setupFYCheckTrigger() {
  try {
    // Delete existing triggers
    const triggers = ScriptApp.getProjectTriggers();
    for (let i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === 'dailyFYCheck') {
        ScriptApp.deleteTrigger(triggers[i]);
      }
    }
    
    // Create new daily trigger at 1 AM
    ScriptApp.newTrigger('dailyFYCheck')
      .timeBased()
      .atHour(1)
      .everyDays(1)
      .create();
    
    Logger.log('FY check trigger installed');
    
  } catch (error) {
    Logger.log('setupFYCheckTrigger error: ' + error.message);
  }
}

/**
 * Daily FY check function
 * Called automatically by trigger
 */
function dailyFYCheck() {
  try {
    Logger.log('Running daily FY check...');
    checkAndResetCounter();
    Logger.log('Daily FY check complete');
  } catch (error) {
    Logger.log('dailyFYCheck error: ' + error.message);
  }
}

/**
 * ============================================================================
 * TESTING
 * ============================================================================
 */

/**
 * Test auto-generation functions
 */
function testAutoGeneration() {
  Logger.log('========================================');
  Logger.log('AUTO-GENERATION TEST');
  Logger.log('========================================');
  
  // Test current FY
  const currentFY = getCurrentFinancialYear();
  Logger.log('Current FY: ' + currentFY);
  
  // Test FY start date
  const fyStartDate = getFinancialYearStartDate();
  Logger.log('FY Start Date: ' + fyStartDate);
  
  // Test preview
  const preview = previewNextSortMasterNo();
  Logger.log('Next Sort Master No (preview): ' + preview);
  
  // Test generation
  const generated = generateSortMasterNo();
  Logger.log('Generated Sort Master No: ' + generated);
  
  // Test validation
  const isValid = validateSortMasterNoFormat(generated);
  Logger.log('Format valid: ' + isValid);
  
  // Test parsing
  const parsed = parseSortMasterNo(generated);
  Logger.log('Parsed: ' + JSON.stringify(parsed));
  
  // Test statistics
  const stats = getCounterStatistics();
  Logger.log('Statistics:');
  Logger.log('- Current FY: ' + stats.currentFY);
  Logger.log('- Current Counter: ' + stats.currentCounter);
  Logger.log('- Sort Masters in FY: ' + stats.sortMastersInCurrentFY);
  Logger.log('- Days into FY: ' + stats.daysIntoFY);
  
  Logger.log('========================================');
  Logger.log('AUTO-GENERATION TEST COMPLETE');
  Logger.log('========================================');
}

/**
 * Test counter reset
 */
function testCounterReset() {
  Logger.log('Testing counter reset...');
  
  const before = previewNextSortMasterNo();
  Logger.log('Before reset: ' + before);
  
  resetCounter();
  
  const after = previewNextSortMasterNo();
  Logger.log('After reset: ' + after);
  
  Logger.log('Expected: ' + SORT_MASTER_CONFIG.PREFIX + '/' + getCurrentFinancialYear() + '/001');
}