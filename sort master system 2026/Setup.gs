/**
 * ============================================================================
 * SORT MASTER MANAGEMENT SYSTEM 2026
 * Setup File - Creates All Sheets and Initial Data
 * ============================================================================
 * 
 * FIXED VERSION - Deletes existing sheets and recreates everything
 * 
 * @version 1.0
 * @author Sort Master System
 * @date December 25, 2025
 */

/**
 * ============================================================================
 * MAIN SETUP FUNCTION - DELETE ALL + RECREATE
 * ============================================================================
 */
function createAllSheets() {
  Logger.log('========================================');
  Logger.log('STARTING SHEET SETUP');
  Logger.log('========================================');
  
  try {
    // Step 1: Open existing spreadsheet
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    if (!ss) {
      throw new Error('❌ Invalid SPREADSHEET_ID in Config.gs! Please check and update.');
    }
    
    const spreadsheetId = ss.getId();
    
    Logger.log('✓ Opened existing spreadsheet');
    Logger.log('Spreadsheet ID: ' + spreadsheetId);
    Logger.log('URL: ' + ss.getUrl());
    
    // Step 2: DELETE ALL EXISTING SHEETS
    Logger.log('\n🗑️  Deleting all existing sheets...');
    deleteAllSheets(ss);
    Logger.log('✓ All existing sheets deleted');
    
    // Step 3: CREATE ALL SHEETS
    Logger.log('\n📝 Creating sheets...');
    
    createUsersSheet(ss);
    Logger.log('✓ USERS sheet created');
    
    createSessionsSheet(ss);
    Logger.log('✓ SESSIONS sheet created');
    
    createAuditLogSheet(ss);
    Logger.log('✓ AUDIT_LOG sheet created');
    
    createSortMasterSheet(ss);
    Logger.log('✓ SORT_MASTER sheet created');
    
    createWarpDetailsSheet(ss);
    Logger.log('✓ WARP_DETAILS sheet created');
    
    createWeftDetailsSheet(ss);
    Logger.log('✓ WEFT_DETAILS sheet created');
    
    createGreyQualityDetailsSheet(ss);
    Logger.log('✓ GREY_QUALITY_DETAILS sheet created');
    
    createItemMasterSheet(ss);
    Logger.log('✓ ITEM_MASTER sheet created');
    
    createWeaveMasterSheet(ss);
    Logger.log('✓ WEAVE_MASTER sheet created');
    
    createSelvedgeMasterSheet(ss);
    Logger.log('✓ SELVEDGE_MASTER sheet created');
    
    createSystemSettingsSheet(ss);
    Logger.log('✓ SYSTEM_SETTINGS sheet created');
    
    createPendingOrdersSheet(ss);
    Logger.log('✓ Pending order for sort sheet created');
    
    // Step 4: POPULATE MASTER DATA
    Logger.log('\n📊 Populating master data...');
    
    populateItemMaster(ss);
    Logger.log('✓ Item Master populated (55 materials)');
    
    populateWeaveMaster(ss);
    Logger.log('✓ Weave Master populated (8 weaves)');
    
    populateSystemSettings(ss);
    Logger.log('✓ System Settings populated');
    
    createDefaultAdmin(ss);
    Logger.log('✓ Default Admin user created');
    
    // Step 5: SET UP DATA VALIDATIONS
    setupDataValidations(ss);
    Logger.log('✓ Data validations configured');
    
    Logger.log('\n========================================');
    Logger.log('✅ SETUP COMPLETED SUCCESSFULLY!');
    Logger.log('========================================');
    Logger.log('\nSpreadsheet URL:');
    Logger.log(ss.getUrl());
    Logger.log('\n🔑 Default Admin Credentials:');
    Logger.log('Username: admin');
    Logger.log('Password: admin123');
    Logger.log('⚠️  CHANGE PASSWORD AFTER FIRST LOGIN!');
    Logger.log('========================================');
    
    return spreadsheetId;
    
  } catch (error) {
    Logger.log('\n========================================');
    Logger.log('❌ ERROR DURING SETUP');
    Logger.log('========================================');
    Logger.log('Error: ' + error.message);
    Logger.log('Stack: ' + error.stack);
    throw error;
  }
}

/**
 * ============================================================================
 * DELETE ALL SHEETS FUNCTION
 * ============================================================================
 */
function deleteAllSheets(ss) {
  const sheets = ss.getSheets();
  
  Logger.log('Found ' + sheets.length + ' existing sheets');
  
  // Keep at least one sheet (Google Sheets requirement)
  // We'll create a temporary sheet first
  const tempSheet = ss.insertSheet('TEMP_SHEET');
  Logger.log('✓ Created temporary sheet');
  
  // Now delete all other sheets
  for (let i = 0; i < sheets.length; i++) {
    const sheetName = sheets[i].getName();
    
    if (sheetName !== 'TEMP_SHEET') {
      try {
        ss.deleteSheet(sheets[i]);
        Logger.log('  ✓ Deleted: ' + sheetName);
      } catch (error) {
        Logger.log('  ⚠️  Could not delete: ' + sheetName);
      }
    }
  }
  
  Logger.log('✓ All sheets deleted (except temp)');
}

/**
 * ============================================================================
 * SHEET CREATION FUNCTIONS
 * ============================================================================
 */

/**
 * Create USERS sheet
 */
function createUsersSheet(ss) {
  const sheet = ss.insertSheet('USERS');
  
  const headers = [
    'userId', 'userName', 'email', 'customUserId', 'passwordHash',
    'telegramChatId', 'role', 'isActive', 'createdDate', 'createdBy',
    'lastLogin', 'emailNotifications', 'telegramNotifications',
    'rememberMeToken', 'resetToken', 'resetTokenExpiry'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#2C2C2C');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  sheet.setColumnWidth(1, 80);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(3, 200);
  sheet.setColumnWidth(4, 120);
  sheet.setColumnWidth(5, 200);
  sheet.setColumnWidth(6, 120);
  sheet.setColumnWidth(7, 100);
  sheet.setColumnWidth(8, 80);
  
  sheet.setFrozenRows(1);
  
  return sheet;
}

/**
 * Create SESSIONS sheet
 */
function createSessionsSheet(ss) {
  const sheet = ss.insertSheet('SESSIONS');
  
  const headers = [
    'sessionId', 'userId', 'createdAt', 'expiresAt',
    'ipAddress', 'isActive', 'rememberMe'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#2C2C2C');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  sheet.setColumnWidth(1, 250);
  sheet.setColumnWidth(2, 80);
  sheet.setColumnWidth(3, 150);
  sheet.setColumnWidth(4, 150);
  sheet.setColumnWidth(5, 150);
  
  sheet.setFrozenRows(1);
  
  return sheet;
}

/**
 * Create AUDIT_LOG sheet
 */
function createAuditLogSheet(ss) {
  const sheet = ss.insertSheet('AUDIT_LOG');
  
  const headers = [
    'logId', 'userId', 'userName', 'action', 'module',
    'recordId', 'beforeValue', 'afterValue', 'ipAddress',
    'timestamp', 'userAgent'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#2C2C2C');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  sheet.setColumnWidth(1, 80);
  sheet.setColumnWidth(2, 80);
  sheet.setColumnWidth(3, 150);
  sheet.setColumnWidth(7, 300);
  sheet.setColumnWidth(8, 300);
  
  sheet.setFrozenRows(1);
  
  return sheet;
}

/**
 * Create SORT_MASTER sheet
 */
function createSortMasterSheet(ss) {
  const sheet = ss.insertSheet('SORT_MASTER');
  
  const headers = [
    'sortMasterId', 'sortMasterNo', 'rtweNo', 'brokerName', 'quality',
    'fabricType', 'sheddingMechanismId', 'weaveName', 'isExportOrder', 'composition',
    'reed', 'denting', 'finalReed', 'width', 'threadOrGala',
    'reedSpace', 'totalEnds', 'totalPicks', 'pickInsert', 'widthInCms',
    'selvedgeId', 'selvedgeName', 'dents', 'selvedgeWidth', 'endsPerDents',
    'selvedgeEnds', 'selvedgeWidthType', 'beamType', 'selvedgeDrawing', 'paperTubeSizeId',
    'paperTubeSizeName', 'totalWarpPattern', 'totalWeftPattern', 'totalWarpGrmsPerMtr', 'totalWeftGrmsPerMtr',
    'glm', 'gsm', 'glmWithoutWastage', 'gsmWithoutWastage', 'loomType',
    'loomTypeName', 'sizePickUp', 'hsnCode', 'hsnDescription', 'igstPercent',
    'cgstPercent', 'sgstPercent', 'cessPercent', 'actGlm', 'actGsm',
    'onLoom', 'sortDrawing', 'pegPlan', 'printOnBill', 'qualityDetails',
    'displayQuality', 'isMasterQuality', 'masterQuality', 'remark', 'isActive',
    'designPaperImage', 'fabricImage', 'l2l', 'status', 'createdDate',
    'createdBy', 'createdByName', 'modifiedDate', 'modifiedBy', 'modifiedByName'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#2C2C2C');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  headerRange.setWrap(true);
  
  sheet.setColumnWidth(1, 100);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(3, 120);
  sheet.setColumnWidth(4, 150);
  sheet.setColumnWidth(5, 200);
  
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2);
  
  return sheet;
}

/**
 * Create WARP_DETAILS sheet
 */
function createWarpDetailsSheet(ss) {
  const sheet = ss.insertSheet('WARP_DETAILS');
  
  const headers = [
    'warpDetailsId', 'sortMasterId', 'beamTypeId', 'beamTypeName', 'pattern',
    'itemId', 'itemName', 'yarnTypeId', 'yarnTypeName', 'uomId',
    'uomName', 'fabricCountId', 'fabricPlyId', 'yarnVarietyId', 'yarnVarietyName',
    'noOfCounts', 'ply', 'yarnCode', 'englishCount', 'wastePerShrink',
    'ends', 'grmsPerMtr', 'grmsPerMtr_NoShrinkage', 'rowOrder'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#2C2C2C');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2);
  
  return sheet;
}

/**
 * Create WEFT_DETAILS sheet
 */
function createWeftDetailsSheet(ss) {
  const sheet = ss.insertSheet('WEFT_DETAILS');
  
  const headers = [
    'weftDetailsId', 'sortMasterId', 'pattern', 'itemId', 'itemName',
    'yarnTypeId', 'yarnTypeName', 'uomId', 'uomName', 'fabricCountId',
    'fabricPlyId', 'yarnVarietyId', 'yarnVarietyName', 'noOfCounts', 'ply',
    'yarnCode', 'englishCount', 'wastePerShrink', 'picks', 'grmsPerMtr',
    'grmsPerMtr_NoShrinkage', 'rowOrder'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#2C2C2C');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2);
  
  return sheet;
}

/**
 * Create GREY_QUALITY_DETAILS sheet
 */
function createGreyQualityDetailsSheet(ss) {
  const sheet = ss.insertSheet('GREY_QUALITY_DETAILS');
  
  const headers = [
    'greyQualityDetailsId', 'sortMasterId', 'greySortMasterId',
    'sortNumber', 'consumptionPercentage', 'gsm', 'width', 'weave'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#2C2C2C');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  sheet.setFrozenRows(1);
  
  return sheet;
}

/**
 * Create ITEM_MASTER sheet
 */
function createItemMasterSheet(ss) {
  const sheet = ss.insertSheet('ITEM_MASTER');
  
  const headers = [
    'itemId', 'itemName', 'yarnTypeId', 'yarnTypeName', 'uomId',
    'uomName', 'fabricCountId', 'countValue', 'fabricPlyId', 'plyValue',
    'yarnVarietyId', 'yarnVarietyName', 'yarnCode', 'englishCount', 'isActive'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#2C2C2C');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  sheet.setColumnWidth(1, 80);
  sheet.setColumnWidth(2, 150);
  sheet.setColumnWidth(14, 120); // englishCount - CRITICAL!
  
  sheet.setFrozenRows(1);
  
  return sheet;
}

/**
 * Create WEAVE_MASTER sheet
 */
function createWeaveMasterSheet(ss) {
  const sheet = ss.insertSheet('WEAVE_MASTER');
  
  const headers = ['weaveId', 'weaveName', 'isActive'];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#2C2C2C');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  sheet.setFrozenRows(1);
  
  return sheet;
}

/**
 * Create SELVEDGE_MASTER sheet
 */
function createSelvedgeMasterSheet(ss) {
  const sheet = ss.insertSheet('SELVEDGE_MASTER');
  
  const headers = [
    'selvedgeId', 'selvedgeName', 'dents', 'endsPerDents',
    'selvedgeEnds', 'totalSelvedge', 'selvedgeWidth', 'isActive'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#2C2C2C');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  sheet.setFrozenRows(1);
  
  return sheet;
}

/**
 * Create SYSTEM_SETTINGS sheet
 */
function createSystemSettingsSheet(ss) {
  const sheet = ss.insertSheet('SYSTEM_SETTINGS');
  
  const headers = [
    'settingKey', 'settingValue', 'settingType',
    'description', 'modifiedDate', 'modifiedBy'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#2C2C2C');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  sheet.setColumnWidth(1, 200);
  sheet.setColumnWidth(2, 250);
  sheet.setColumnWidth(4, 300);
  
  sheet.setFrozenRows(1);
  
  return sheet;
}

/**
 * Create Pending order for sort sheet
 */
function createPendingOrdersSheet(ss) {
  const sheet = ss.insertSheet('Pending order for sort');
  
  const headers = ['RTWE No', 'Broker Name', 'Quality', 'Date', 'Status'];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#2C2C2C');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  
  sheet.setColumnWidth(1, 120);
  sheet.setColumnWidth(2, 200);
  sheet.setColumnWidth(3, 300);
  sheet.setColumnWidth(4, 120);
  sheet.setColumnWidth(5, 100);
  
  sheet.setFrozenRows(1);
  
  // Add sample pending orders
  const sampleData = [
    ['RTWE02', 'Mr. Devkisan sarda', '66RS/144*72/80DULL*40CO', new Date('2025-12-25'), 'Pending'],
    ['RTWE09', 'Mr. Kewal', '70RS/52*52/21SLB*21SLB', new Date('2025-12-25'), 'Pending'],
    ['RTWE14', 'Shekhar', '63"/52*48/21ZAYKA*21 ZAYKA', new Date('2025-12-25'), 'Pending'],
    ['RTWE07', 'Mr. Kewal', '69RS/108*76/40C*40TENCEL', new Date('2025-12-25'), 'Pending']
  ];
  
  sheet.getRange(2, 1, sampleData.length, sampleData[0].length).setValues(sampleData);
  
  return sheet;
}

/**
 * ============================================================================
 * DATA POPULATION FUNCTIONS
 * ============================================================================
 */

/**
 * Populate ITEM_MASTER with materials
 * Contains all 55 materials from main source code
 */
function populateItemMaster(ss) {
  const sheet = ss.getSheetByName('ITEM_MASTER');
  
  // All materials from main source code (55 items)
  // Format: [itemId, itemName, yarnTypeId, yarnTypeName, uomId, uomName, fabricCountId, countValue, fabricPlyId, plyValue, yarnVarietyId, yarnVarietyName, yarnCode, englishCount, isActive]
  const items = [
    // Cotton Compact (CPT)
    [1, '61CPT', 1, 'Cotton', 1, 'PC', 1, 61, 1, 1, 1, 'Compact', 'CPT', 61.0, true],
    [5, '51CPT', 1, 'Cotton', 1, 'PC', 5, 51, 1, 1, 1, 'Compact', 'CPT', 51.0, true],
    [13, '41 CPT', 1, 'Cotton', 1, 'PC', 13, 41, 1, 1, 1, 'Compact', 'CPT', 41.0, true],
    
    // Cotton Standard (C)
    [2, '30C', 1, 'Cotton', 1, 'PC', 2, 30, 1, 1, 1, 'Standard', 'C', 30.0, true],
    [3, '20C', 1, 'Cotton', 1, 'PC', 3, 20, 1, 1, 1, 'Standard', 'C', 20.0, true],
    [34, '62C', 1, 'Cotton', 1, 'PC', 34, 62, 1, 1, 1, 'Standard', 'C', 62.0, true],
    
    // Cotton (CTN)
    [8, '32CTN', 1, 'Cotton', 1, 'PC', 8, 32, 1, 1, 1, 'Standard', 'CTN', 32.0, true],
    [19, '42 CTN', 1, 'Cotton', 1, 'PC', 19, 42, 1, 1, 1, 'Standard', 'CTN', 42.0, true],
    [21, '2/32 CTN', 1, 'Cotton', 1, 'PC', 21, 32, 2, 2, 1, 'Standard', 'CTN', 16.0, true],
    
    // Cotton (CO)
    [45, '40CO', 1, 'Cotton', 1, 'PC', 45, 40, 1, 1, 1, 'Standard', 'CO', 40.0, true],
    
    // Slub (SLB)
    [4, '21SLB', 3, 'Slub', 1, 'PC', 4, 21, 1, 1, 2, 'Slub', 'SLB', 21.0, true],
    [9, '10 SLB', 3, 'Slub', 1, 'PC', 9, 10, 1, 1, 2, 'Slub', 'SLB', 10.0, true],
    [14, '31SLB', 3, 'Slub', 1, 'PC', 14, 31, 1, 1, 2, 'Slub', 'SLB', 31.0, true],
    [36, '41 SLUB', 3, 'Slub', 1, 'PC', 36, 41, 1, 1, 2, 'Slub', 'SLUB', 41.0, true],
    [42, '16SLB', 3, 'Slub', 1, 'PC', 42, 16, 1, 1, 2, 'Slub', 'SLB', 16.0, true],
    [54, '30.5 SLUB', 3, 'Slub', 1, 'PC', 54, 30.5, 1, 1, 2, 'Slub', 'SLUB', 30.5, true],
    [51, '1/61 1 NE SLUB SLB', 3, 'Slub', 1, 'PC', 51, 61, 1, 1, 2, 'Slub', 'SLB', 61.0, true],
    [53, '1/24 1 SLUB SLUB SLB', 3, 'Slub', 1, 'PC', 53, 24, 1, 1, 2, 'Slub', 'SLB', 24.0, true],
    
    // Lycra (LY / LYC)
    [6, '20 LY', 4, 'Lycra', 1, 'PC', 6, 20, 1, 1, 3, 'Lycra', 'LY', 20.0, true],
    [12, '97 LYC', 4, 'Lycra', 1, 'PC', 12, 97, 1, 1, 3, 'Lycra', 'LYC', 97.0, true],
    [18, '97 SUPER STRETCH LYCRA', 4, 'Lycra', 1, 'PC', 18, 97, 1, 1, 3, 'Super Stretch', 'LYCRA', 97.0, true],
    [22, '42 LYCRA', 4, 'Lycra', 1, 'PC', 22, 42, 1, 1, 3, 'Lycra', 'LYCRA', 42.0, true],
    [24, '51 LYC', 4, 'Lycra', 1, 'PC', 24, 51, 1, 1, 3, 'Lycra', 'LYC', 51.0, true],
    [41, '30LYCRA', 4, 'Lycra', 1, 'PC', 41, 30, 1, 1, 3, 'Lycra', 'LYCRA', 30.0, true],
    [43, '90LYCRA', 4, 'Lycra', 1, 'PC', 43, 90, 1, 1, 3, 'Lycra', 'LYCRA', 90.0, true],
    [44, '240LYCRA', 4, 'Lycra', 1, 'PC', 44, 240, 1, 1, 3, 'Lycra', 'LYCRA', 240.0, true],
    
    // Open End (OE)
    [7, '21OE', 5, 'Open End', 1, 'PC', 7, 21, 1, 1, 4, 'Open End', 'OE', 21.0, true],
    [35, '10OE', 5, 'Open End', 1, 'PC', 35, 10, 1, 1, 4, 'Open End', 'OE', 10.0, true],
    
    // Denier (DEN)
    [10, '80/300', 6, 'Denier', 1, 'PC', 10, 80, 1, 1, 5, 'Denier', 'DEN', 65.625, true],
    [15, '80 DEN', 6, 'Denier', 1, 'PC', 15, 80, 1, 1, 5, 'Denier', 'DEN', 65.625, true],
    [17, '220 DEN', 6, 'Denier', 1, 'PC', 17, 220, 1, 1, 5, 'Denier', 'DEN', 23.86, true],
    [20, '2/63 DEN', 6, 'Denier', 1, 'PC', 20, 63, 2, 2, 5, 'Denier', 'DEN', 41.67, true],
    [23, '75 DEN', 6, 'Denier', 1, 'PC', 23, 75, 1, 1, 5, 'Denier', 'DEN', 70.0, true],
    [28, '80/1000', 6, 'Denier', 1, 'PC', 28, 80, 1, 1, 5, 'Denier', 'DEN', 65.625, true],
    [40, '2/80', 6, 'Denier', 1, 'PC', 40, 80, 2, 2, 5, 'Denier', 'DEN', 33.0, true],
    
    // Polyester Viscose (PV)
    [11, '40PV', 2, 'Polyester', 1, 'PC', 11, 40, 1, 1, 6, 'PV Blend', 'PV', 40.0, true],
    [16, '42PV', 2, 'Polyester', 1, 'PC', 16, 42, 1, 1, 6, 'PV Blend', 'PV', 42.0, true],
    [46, '36PV HM', 2, 'Polyester', 1, 'PC', 46, 36, 1, 1, 6, 'PV HM', 'PV', 36.0, true],
    [47, '45 PV', 2, 'Polyester', 1, 'PC', 47, 45, 1, 1, 6, 'PV Blend', 'PV', 45.0, true],
    [48, '2/40 PV', 2, 'Polyester', 1, 'PC', 48, 40, 2, 2, 6, 'PV Blend', 'PV', 20.0, true],
    
    // Cationic
    [25, '150 CATIONIC', 7, 'Cationic', 1, 'PC', 25, 150, 1, 1, 7, 'Cationic', 'CATIONIC', 35.0, true],
    [33, '80 CATIONIC', 7, 'Cationic', 1, 'PC', 33, 80, 1, 1, 7, 'Cationic', 'CATIONIC', 65.625, true],
    
    // Viscose (VIS)
    [26, '30VIS', 8, 'Viscose', 1, 'PC', 26, 30, 1, 1, 8, 'Viscose', 'VIS', 30.0, true],
    [27, '34 VISCOSE', 8, 'Viscose', 1, 'PC', 27, 34, 1, 1, 8, 'Viscose', 'VISCOSE', 34.0, true],
    [30, '40 VISCOSE', 8, 'Viscose', 1, 'PC', 30, 40, 1, 1, 8, 'Viscose', 'VISCOSE', 40.0, true],
    [39, '21 VISCOSE', 8, 'Viscose', 1, 'PC', 39, 21, 1, 1, 8, 'Viscose', 'VISCOSE', 21.0, true],
    
    // Zari
    [29, '34 ZARI', 9, 'Zari', 1, 'PC', 29, 34, 1, 1, 9, 'Zari', 'ZARI', 34.0, true],
    
    // PSF (Polyester Staple Fiber)
    [31, '2/76 PSF', 10, 'PSF', 1, 'PC', 31, 76, 2, 2, 10, 'PSF', 'PSF', 38.0, true],
    [32, '40 PSF', 10, 'PSF', 1, 'PC', 32, 40, 1, 1, 10, 'PSF', 'PSF', 40.0, true],
    [55, '60 PSF', 10, 'PSF', 1, 'PC', 55, 60, 1, 1, 10, 'PSF', 'PSF', 60.0, true],
    
    // TNC (Tencel)
    [37, '40 TNC', 11, 'Tencel', 1, 'PC', 37, 40, 1, 1, 11, 'Tencel', 'TNC', 40.0, true],
    [46, '40TENCEL', 11, 'Tencel', 1, 'PC', 37, 40, 1, 1, 11, 'Tencel', 'TENCEL', 40.0, true],
    
    // Bright
    [38, '150 BRIGHT', 12, 'Bright', 1, 'PC', 38, 150, 1, 1, 12, 'Bright', 'BRIGHT', 35.0, true],
    
    // Cotlin / Zayka Slub
    [45, '21COTLIN SLUB', 13, 'Cotlin', 1, 'PC', 45, 21, 1, 1, 13, 'Cotlin', 'COTLIN SLUB', 21.0, true],
    [49, '21 ZAYKA SLUB', 14, 'Zayka', 1, 'PC', 49, 21, 1, 1, 14, 'Zayka Slub', 'ZAYKA SLUB', 21.0, true],
    
    // Filatex
    [50, '150 FILATEX', 15, 'Filatex', 1, 'PC', 50, 150, 1, 1, 15, 'Filatex', 'FILATEX', 35.0, true],
    
    // Swan
    [52, '321 SWAN', 16, 'Swan', 1, 'PC', 52, 321, 1, 1, 16, 'Swan', 'SWAN', 16.35, true],
    
    // 80DULL (Special Denier)
    [80, '80DULL', 6, 'Denier', 1, 'PC', 80, 80, 1, 1, 5, 'Dull', 'DULL', 65.625, true]
  ];
  
  if (items.length > 0) {
    sheet.getRange(2, 1, items.length, items[0].length).setValues(items);
  }
  
  return sheet;
}

/**
 * Populate WEAVE_MASTER
 */
function populateWeaveMaster(ss) {
  const sheet = ss.getSheetByName('WEAVE_MASTER');
  
  const weaves = [
    [1, 'DOBBY', true],
    [2, 'TWILL', true],
    [3, 'PLAIN', true],
    [4, 'SATIN', true],
    [5, 'CORD', true],
    [6, 'MATTY', true],
    [7, '2/2 TWILL', true],
    [8, '2/2 MATTY', true]
  ];
  
  sheet.getRange(2, 1, weaves.length, weaves[0].length).setValues(weaves);
  
  return sheet;
}

/**
 * Populate SYSTEM_SETTINGS
 */
function populateSystemSettings(ss) {
  const sheet = ss.getSheetByName('SYSTEM_SETTINGS');
  
  const now = new Date();
  const currentFY = '25-26'; // 2025-2026
  
  const settings = [
    ['COMPANY_NAME', 'RAMRATAN TECHNO WEAVE', 'STRING', 'Company name', now, 1],
    ['CURRENT_FY', currentFY, 'STRING', 'Current financial year', now, 1],
    ['SORT_MASTER_COUNTER', '0', 'NUMBER', 'Sort master counter', now, 1],
    ['EMAIL_NOTIFICATIONS', 'true', 'BOOLEAN', 'Email notifications', now, 1],
    ['TELEGRAM_NOTIFICATIONS', 'true', 'BOOLEAN', 'Telegram notifications', now, 1],
    ['TELEGRAM_BOT_TOKEN', '8398512229:AAGUBN1as8A9SalazravrVMwy7YdG8_JjYo', 'STRING', 'Telegram bot token', now, 1],
    ['SELF_REGISTRATION_ENABLED', 'false', 'BOOLEAN', 'Self registration', now, 1],
    ['ADMIN_EMAIL', 'admin@company.com', 'STRING', 'Admin email', now, 1]
  ];
  
  sheet.getRange(2, 1, settings.length, settings[0].length).setValues(settings);
  
  return sheet;
}

/**
 * Create default admin user
 */
function createDefaultAdmin(ss) {
  const sheet = ss.getSheetByName('USERS');
  const now = new Date();
  
  // Hash password "admin123"
  const password = 'admin123';
  const passwordHash = hashPassword(password);
  
  const adminUser = [
    1, 'Admin User', 'admin@company.com', 'admin', passwordHash,
    '', 'ADMIN', true, now, 1, '', true, true, '', '', ''
  ];
  
  sheet.getRange(2, 1, 1, adminUser.length).setValues([adminUser]);
  
  return sheet;
}

/**
 * Hash password helper
 */
function hashPassword(password) {
  const rawHash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password,
    Utilities.Charset.UTF_8
  );
  
  let hash = '';
  for (let i = 0; i < rawHash.length; i++) {
    let byte = rawHash[i];
    if (byte < 0) byte += 256;
    let byteStr = byte.toString(16);
    if (byteStr.length === 1) byteStr = '0' + byteStr;
    hash += byteStr;
  }
  
  return hash;
}

/**
 * Set up data validations
 */
function setupDataValidations(ss) {
  const usersSheet = ss.getSheetByName('USERS');
  const roleValidation = SpreadsheetApp.newDataValidation()
    .requireValueInList(['ADMIN', 'MANAGER', 'USER', 'VIEWER'], true)
    .setAllowInvalid(false)
    .build();
  
  usersSheet.getRange(2, 7, 1000).setDataValidation(roleValidation);
  
  // Delete temp sheet at the end
  const tempSheet = ss.getSheetByName('TEMP_SHEET');
  if (tempSheet) {
    ss.deleteSheet(tempSheet);
    Logger.log('✓ Deleted temporary sheet');
  }
  
  return true;
}



function fixSessionsSheetHeaders() {
  Logger.log('=== FIXING SESSIONS SHEET ===');
  
  try {
    const sheet = getSheet(SHEET_NAMES.SESSIONS);
    
    // Check if first row has headers
    const firstRow = sheet.getRange(1, 1, 1, 7).getValues()[0];
    
    if (firstRow[0] !== 'sessionId') {
      Logger.log('Headers missing! Adding headers...');
      
      // Insert new row at top
      sheet.insertRowBefore(1);
      
      // Add headers
      sheet.getRange(1, 1, 1, 7).setValues([[
        'sessionId',
        'userId',
        'createdAt',
        'expiresAt',
        'ipAddress',
        'isActive',
        'rememberMe'
      ]]);
      
      // Format headers
      sheet.getRange(1, 1, 1, 7)
        .setFontWeight('bold')
        .setBackground('#5D4037')
        .setFontColor('#FFFFFF');
      
      Logger.log('✅ Headers added successfully!');
      
    } else {
      Logger.log('✅ Headers already present');
    }
    
    // Show current session count
    const dataRows = sheet.getLastRow() - 1; // Exclude header
    Logger.log('Total sessions: ' + dataRows);
    
    Logger.log('=== FIX COMPLETE ===');
    
  } catch (error) {
    Logger.log('❌ Error: ' + error.message);
  }
}





function recreateSessionsSheet() {
  Logger.log('=== RECREATING SESSIONS SHEET ===');
  
  try {
    const sheet = getSheet(SHEET_NAMES.SESSIONS);
    
    // Clear all data
    sheet.clear();
    
    // Add headers
    sheet.appendRow([
      'sessionId',
      'userId', 
      'createdAt',
      'expiresAt',
      'ipAddress',
      'isActive',
      'rememberMe'
    ]);
    
    // Format headers
    sheet.getRange(1, 1, 1, 7)
      .setFontWeight('bold')
      .setBackground('#5D4037')
      .setFontColor('#FFFFFF');
    
    Logger.log('✅ SESSIONS sheet recreated with headers');
    Logger.log('Now try logging in again!');
    
  } catch (error) {
    Logger.log('❌ Error: ' + error.message);
  }
}