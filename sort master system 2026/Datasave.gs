/**
 * ============================================================================
 * SORT MASTER MANAGEMENT SYSTEM 2026
 * Data Save Module
 * ============================================================================
 * 
 * Handles all data saving operations to Google Sheets.
 * Main function: saveSortMaster() - saves complete Sort Master with warp/weft
 * 
 * @version 1.0
 * @author Sort Master System
 * @date December 25, 2025
 */

/**
 * ============================================================================
 * MAIN SAVE FUNCTION
 * ============================================================================
 */

/**
 * Save Sort Master with all details
 * @param {Object} formData - Complete form data
 * @param {boolean} sendNotifications - Send email/Telegram notifications
 * @return {Object} {success, message, sortMasterId, sortMasterNo}
 */
function saveSortMaster(formData, sendNotifications) {
  try {
    // Validate form data
    const validation = validateSortMasterForm(formData);
    if (!validation.valid) {
      return {
        success: false,
        message: 'Validation failed: ' + validation.errors.join(', '),
        errors: validation.errors
      };
    }
    
    // Generate Sort Master number
    const sortMasterNo = generateSortMasterNo();
    
    // Calculate all values
    const calculations = calculateAllSortMasterValues(formData);
    
    // Get next Sort Master ID
    const sortMasterSheet = getSheet(SHEET_NAMES.SORT_MASTER);
    const lastRow = sortMasterSheet.getLastRow();
    const sortMasterId = lastRow > 1 ? sortMasterSheet.getRange(lastRow, 1).getValue() + 1 : 1;
    
    const now = new Date();
    
    // Build Sort Master row
    const sortMasterRow = [
      sortMasterId, // sortMasterId
      sortMasterNo, // sortMasterNo
      formData.rtweNo, // rtweNo
      formData.brokerName, // brokerName
      formData.quality || calculations.qualityString, // quality
      formData.fabricType, // fabricType
      formData.sheddingMechanismId, // sheddingMechanismId
      formData.weaveName, // weaveName
      formData.isExportOrder, // isExportOrder
      formData.composition, // composition
      formData.reed, // reed
      formData.denting, // denting
      calculations.finalReed, // finalReed
      formData.width, // width
      formData.threadOrGala, // threadOrGala (extraWidth)
      calculations.reedSpace, // reedSpace
      calculations.totalEnds, // totalEnds
      formData.totalPicks, // totalPicks
      formData.pickInsert || 1, // pickInsert
      calculations.widthInCms, // widthInCms
      formData.selvedgeId || '', // selvedgeId
      formData.selvedgeName || '', // selvedgeName
      formData.dents || '', // dents
      formData.selvedgeWidth || '', // selvedgeWidth
      formData.endsPerDents || '', // endsPerDents
      calculations.selvedgeEnds || 0, // selvedgeEnds
      formData.selvedgeWidthType || 0, // selvedgeWidthType
      formData.beamType || '', // beamType
      formData.selvedgeDrawing || '', // selvedgeDrawing
      formData.paperTubeSizeId || '', // paperTubeSizeId
      formData.paperTubeSizeName || '', // paperTubeSizeName
      calculations.totalWarpPattern || 0, // totalWarpPattern
      calculations.totalWeftPattern || 0, // totalWeftPattern
      calculations.totalWarpGrmsPerMtr || 0, // totalWarpGrmsPerMtr
      calculations.totalWeftGrmsPerMtr || 0, // totalWeftGrmsPerMtr
      calculations.glm || 0, // glm (with shrinkage)
      calculations.gsm || 0, // gsm (with shrinkage)
      calculations.glmWithoutWastage || 0, // glmWithoutWastage
      calculations.gsmWithoutWastage || 0, // gsmWithoutWastage
      formData.loomType || '', // loomType
      formData.loomTypeName || '', // loomTypeName
      formData.sizePickUp || 0, // sizePickUp
      formData.hsnCode || '', // hsnCode
      formData.hsnDescription || '', // hsnDescription
      formData.igstPercent || 0, // igstPercent
      formData.cgstPercent || 0, // cgstPercent
      formData.sgstPercent || 0, // sgstPercent
      formData.cessPercent || 0, // cessPercent
      formData.actGlm || 0, // actGlm
      formData.actGsm || 0, // actGsm
      formData.onLoom || '', // onLoom
      formData.sortDrawing || '', // sortDrawing
      formData.pegPlan || '', // pegPlan
      formData.printOnBill || calculations.qualityString, // printOnBill
      formData.qualityDetails || '', // qualityDetails
      formData.qualitySortNo || (formData.qualityDetails || '').replace(/[^0-9]/g, ''), // qualitySortNo - numeric only
      calculations.qualityString || '', // displayQuality
      formData.isMasterQuality || false, // isMasterQuality
      formData.masterQuality || '', // masterQuality
      formData.remark || '', // remark
      true, // isActive
      formData.designPaperImage || '', // designPaperImage
      formData.fabricImage || '', // fabricImage
      formData.l2l || '', // l2l
      STATUS.COMPLETE, // status
      now, // createdDate
      formData.userId, // createdBy
      formData.userName, // createdByName
      '', // modifiedDate
      '', // modifiedBy
      '' // modifiedByName
    ];
    
    // Save Sort Master
    sortMasterSheet.appendRow(sortMasterRow);
    
    Logger.log('Sort Master saved: ' + sortMasterNo + ' (ID: ' + sortMasterId + ')');
    
    // Save warp details
    if (formData.warpRows && formData.warpRows.length > 0) {
      saveWarpDetails(sortMasterId, formData.warpRows, calculations.warpCalculations);
    }
    
    // Save weft details
    if (formData.weftRows && formData.weftRows.length > 0) {
      saveWeftDetails(sortMasterId, formData.weftRows, calculations.weftCalculations);
    }
    
    // Log action
    logCreate(
      formData.userId,
      AUDIT_MODULES.SORT_MASTER,
      sortMasterId,
      { sortMasterNo: sortMasterNo, rtweNo: formData.rtweNo }
    );
    
    // Send notifications if requested
    if (sendNotifications) {
      sendSortMasterNotifications(sortMasterId, sortMasterNo, formData);
    }
    
    return {
      success: true,
      message: SUCCESS_MESSAGES.SORT_MASTER_CREATED,
      sortMasterId: sortMasterId,
      sortMasterNo: sortMasterNo
    };
    
  } catch (error) {
    Logger.log('saveSortMaster error: ' + error.message);
    Logger.log('Stack: ' + error.stack);
    return {
      success: false,
      message: 'Error saving Sort Master: ' + error.message
    };
  }
}

/**
 * ============================================================================
 * WARP DETAILS SAVE
 * ============================================================================
 */

/**
 * Save warp details for a Sort Master
 * @param {number} sortMasterId - Sort Master ID
 * @param {Array} warpRows - Array of warp row data
 * @param {Array} calculations - Array of calculated warp data
 * @return {number} Number of rows saved
 */
function saveWarpDetails(sortMasterId, warpRows, calculations) {
  try {
    const sheet = getSheet(SHEET_NAMES.WARP_DETAILS);
    
    const lastRow = sheet.getLastRow();
    let warpDetailsId = lastRow > 1 ? sheet.getRange(lastRow, 1).getValue() + 1 : 1;
    
    for (let i = 0; i < warpRows.length; i++) {
      const row = warpRows[i];
      const calc = calculations && calculations[i] ? calculations[i] : {};
      
      const warpDetailRow = [
        warpDetailsId++, // warpDetailsId
        sortMasterId, // sortMasterId
        row.beamTypeId || row.beamType, // beamTypeId
        row.beamTypeName || BEAM_TYPES[row.beamTypeId] || '', // beamTypeName
        row.pattern, // pattern
        row.itemId, // itemId
        row.itemName, // itemName
        row.yarnTypeId, // yarnTypeId
        row.yarnTypeName, // yarnTypeName
        row.uomId, // uomId
        row.uomName, // uomName
        row.fabricCountId, // fabricCountId
        row.fabricPlyId, // fabricPlyId
        row.yarnVarietyId, // yarnVarietyId
        row.yarnVarietyName, // yarnVarietyName
        row.noOfCounts, // noOfCounts
        row.ply, // ply
        row.yarnCode, // yarnCode
        row.englishCount, // englishCount
        row.wastePerShrink || row.shrinkage || 0, // wastePerShrink
        calc.ends || 0, // ends
        calc.grmsWithShrinkage || 0, // grmsPerMtr
        calc.grmsWithoutShrinkage || 0, // grmsPerMtr_NoShrinkage
        i + 1 // rowOrder
      ];
      
      sheet.appendRow(warpDetailRow);
    }
    
    Logger.log('Saved ' + warpRows.length + ' warp detail rows');
    
    return warpRows.length;
    
  } catch (error) {
    Logger.log('saveWarpDetails error: ' + error.message);
    throw error;
  }
}

/**
 * ============================================================================
 * WEFT DETAILS SAVE
 * ============================================================================
 */

/**
 * Save weft details for a Sort Master
 * @param {number} sortMasterId - Sort Master ID
 * @param {Array} weftRows - Array of weft row data
 * @param {Array} calculations - Array of calculated weft data
 * @return {number} Number of rows saved
 */
function saveWeftDetails(sortMasterId, weftRows, calculations) {
  try {
    const sheet = getSheet(SHEET_NAMES.WEFT_DETAILS);
    
    const lastRow = sheet.getLastRow();
    let weftDetailsId = lastRow > 1 ? sheet.getRange(lastRow, 1).getValue() + 1 : 1;
    
    for (let i = 0; i < weftRows.length; i++) {
      const row = weftRows[i];
      const calc = calculations && calculations[i] ? calculations[i] : {};
      
      const weftDetailRow = [
        weftDetailsId++, // weftDetailsId
        sortMasterId, // sortMasterId
        row.pattern, // pattern
        row.itemId, // itemId
        row.itemName, // itemName
        row.yarnTypeId, // yarnTypeId
        row.yarnTypeName, // yarnTypeName
        row.uomId, // uomId
        row.uomName, // uomName
        row.fabricCountId, // fabricCountId
        row.fabricPlyId, // fabricPlyId
        row.yarnVarietyId, // yarnVarietyId
        row.yarnVarietyName, // yarnVarietyName
        row.noOfCounts, // noOfCounts
        row.ply, // ply
        row.yarnCode, // yarnCode
        row.englishCount, // englishCount
        row.wastePerShrink || row.shrinkage || 0, // wastePerShrink
        calc.picks || 0, // picks
        calc.grmsWithShrinkage || 0, // grmsPerMtr
        calc.grmsWithoutShrinkage || 0, // grmsPerMtr_NoShrinkage
        i + 1 // rowOrder
      ];
      
      sheet.appendRow(weftDetailRow);
    }
    
    Logger.log('Saved ' + weftRows.length + ' weft detail rows');
    
    return weftRows.length;
    
  } catch (error) {
    Logger.log('saveWeftDetails error: ' + error.message);
    throw error;
  }
}

/**
 * ============================================================================
 * UPDATE FUNCTIONS
 * ============================================================================
 */

/**
 * Update existing Sort Master
 * @param {number} sortMasterId - Sort Master ID
 * @param {Object} formData - Updated form data
 * @return {Object} {success, message}
 */
function updateSortMaster(sortMasterId, formData) {
  try {
    // Check permission
    const permission = validatePermission(formData.userId, 'EDIT', AUDIT_MODULES.SORT_MASTER);
    if (!permission.valid) {
      return {
        success: false,
        message: ERROR_MESSAGES.NO_PERMISSION
      };
    }
    
    // Get existing Sort Master for audit log
    const existingSortMaster = getSortMasterById(sortMasterId);
    if (!existingSortMaster) {
      return {
        success: false,
        message: 'Sort Master not found'
      };
    }
    
    // Validate form data
    const validation = validateSortMasterForm(formData);
    if (!validation.valid) {
      return {
        success: false,
        message: 'Validation failed: ' + validation.errors.join(', '),
        errors: validation.errors
      };
    }
    
    // Recalculate values
    const calculations = calculateAllSortMasterValues(formData);
    
    // Find row index
    const sheet = getSheet(SHEET_NAMES.SORT_MASTER);
    const data = sheet.getDataRange().getValues();
    
    // Find row index - convert both to strings for comparison
    const searchId = String(sortMasterId);
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === searchId) {
        rowIndex = i + 1;
        break;
      }
    }
    
    if (rowIndex === -1) {
      return {
        success: false,
        message: 'Sort Master not found in sheet'
      };
    }
    
    const now = new Date();
    
    // Get existing row data to preserve sortMasterId, sortMasterNo, and created fields
    const existingRow = data[rowIndex - 1];
    
    // Build update array for columns C onwards (index 2 to 70)
    // Columns A & B (sortMasterId, sortMasterNo) are preserved
    const updateRow = [
      formData.rtweNo, // C - rtweNo (index 2)
      formData.brokerName, // D - brokerName
      formData.quality || calculations.qualityString, // E - quality
      formData.fabricType, // F - fabricType
      formData.sheddingMechanismId || formData.weaveId, // G - sheddingMechanismId
      formData.weaveName, // H - weaveName
      formData.isExportOrder, // I - isExportOrder
      formData.composition, // J - composition
      formData.reed, // K - reed
      formData.denting, // L - denting
      calculations.finalReed, // M - finalReed
      formData.width, // N - width
      formData.threadOrGala || formData.extraWidth || 0, // O - threadOrGala
      calculations.reedSpace, // P - reedSpace
      calculations.totalEnds, // Q - totalEnds
      formData.totalPicks, // R - totalPicks
      formData.pickInsert || 1, // S - pickInsert
      calculations.widthInCms, // T - widthInCms
      formData.selvedgeId || '', // U - selvedgeId
      formData.selvedgeName || '', // V - selvedgeName
      formData.dents || formData.multiDents || '', // W - dents
      formData.selvedgeWidth || formData.dentsWidth || '', // X - selvedgeWidth
      formData.endsPerDents || formData.endsPerDent || '', // Y - endsPerDents
      calculations.selvedgeEnds || formData.selvedgeEnds || 0, // Z - selvedgeEnds
      formData.selvedgeWidthType || 0, // AA - selvedgeWidthType
      formData.beamType || formData.beamTypeMain || '', // AB - beamType
      formData.selvedgeDrawing || '', // AC - selvedgeDrawing
      formData.paperTubeSizeId || formData.paperTubeSize || '', // AD - paperTubeSizeId
      formData.paperTubeSizeName || formData.paperTubeSize || '', // AE - paperTubeSizeName
      calculations.totalWarpPattern || 0, // AF - totalWarpPattern
      calculations.totalWeftPattern || 0, // AG - totalWeftPattern
      calculations.totalWarpGrmsPerMtr || 0, // AH - totalWarpGrmsPerMtr
      calculations.totalWeftGrmsPerMtr || 0, // AI - totalWeftGrmsPerMtr
      calculations.glm || 0, // AJ - glm
      calculations.gsm || 0, // AK - gsm
      calculations.glmWithoutWastage || 0, // AL - glmWithoutWastage
      calculations.gsmWithoutWastage || 0, // AM - gsmWithoutWastage
      formData.loomType || '', // AN - loomType
      formData.loomTypeName || '', // AO - loomTypeName
      formData.sizePickUp || formData.sizePickup || 0, // AP - sizePickUp
      formData.hsnCode || formData.hsnNumber || '', // AQ - hsnCode
      formData.hsnDescription || '', // AR - hsnDescription
      formData.igstPercent || formData.igst || 0, // AS - igstPercent
      formData.cgstPercent || formData.cgst || 0, // AT - cgstPercent
      formData.sgstPercent || formData.sgst || 0, // AU - sgstPercent
      formData.cessPercent || 0, // AV - cessPercent
      formData.actGlm || 0, // AW - actGlm
      formData.actGsm || 0, // AX - actGsm
      formData.onLoom || '', // AY - onLoom
      formData.sortDrawing || formData.drawing || '', // AZ - sortDrawing
      formData.pegPlan || '', // BA - pegPlan
      formData.printOnBill || calculations.qualityString, // BB - printOnBill
      formData.qualityDetails || '', // BC - qualityDetails
      formData.qualitySortNo || (formData.qualityDetails || '').replace(/[^0-9]/g, ''), // BD - qualitySortNo
      calculations.qualityString || '', // BE - displayQuality
      formData.isMasterQuality || false, // BF - isMasterQuality
      formData.masterQuality || '', // BG - masterQuality
      formData.remark || '', // BH - remark
      true, // BI - isActive
      formData.designPaperImage || existingRow[61] || '', // BJ - designPaperImage (preserve if not changed)
      formData.fabricImage || existingRow[62] || '', // BK - fabricImage (preserve if not changed)
      formData.l2l || '', // BL - l2l
      STATUS.COMPLETE, // BM - status
      existingRow[65], // BN - createdDate (PRESERVE)
      existingRow[66], // BO - createdBy (PRESERVE)
      existingRow[67], // BP - createdByName (PRESERVE)
      now, // BQ - modifiedDate
      formData.userId, // BR - modifiedBy
      formData.userName // BS - modifiedByName
    ];
    
    // Set values for columns C onwards (row is 1-indexed, columns are also 1-indexed)
    sheet.getRange(rowIndex, 3, 1, updateRow.length).setValues([updateRow]);
    
    Logger.log('Updated Sort Master row at index: ' + rowIndex);
    
    // Delete existing warp/weft details
    deleteWarpDetailsBySortMaster(sortMasterId);
    deleteWeftDetailsBySortMaster(sortMasterId);
    
    // Save new warp/weft details
    if (formData.warpRows && formData.warpRows.length > 0) {
      saveWarpDetails(sortMasterId, formData.warpRows, calculations.warpCalculations);
    }
    
    if (formData.weftRows && formData.weftRows.length > 0) {
      saveWeftDetails(sortMasterId, formData.weftRows, calculations.weftCalculations);
    }
    
    // Log edit action
    logEdit(
      formData.userId,
      AUDIT_MODULES.SORT_MASTER,
      sortMasterId,
      existingSortMaster,
      formData
    );
    
    return {
      success: true,
      message: SUCCESS_MESSAGES.SORT_MASTER_UPDATED
    };
    
  } catch (error) {
    Logger.log('updateSortMaster error: ' + error.message);
    return {
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    };
  }
}

/**
 * Delete warp details for a Sort Master
 * @param {number} sortMasterId - Sort Master ID
 */
function deleteWarpDetailsBySortMaster(sortMasterId) {
  try {
    const sheet = getSheet(SHEET_NAMES.WARP_DETAILS);
    const data = sheet.getDataRange().getValues();
    
    const rowsToDelete = [];
    const searchId = String(sortMasterId);
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][1]) === searchId) {
        rowsToDelete.push(i + 1);
      }
    }
    
    // Delete in reverse order
    for (let i = rowsToDelete.length - 1; i >= 0; i--) {
      sheet.deleteRow(rowsToDelete[i]);
    }
    
  } catch (error) {
    Logger.log('deleteWarpDetailsBySortMaster error: ' + error.message);
  }
}

/**
 * Delete weft details for a Sort Master
 * @param {number} sortMasterId - Sort Master ID
 */
function deleteWeftDetailsBySortMaster(sortMasterId) {
  try {
    const sheet = getSheet(SHEET_NAMES.WEFT_DETAILS);
    const data = sheet.getDataRange().getValues();
    
    const rowsToDelete = [];
    const searchId = String(sortMasterId);
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][1]) === searchId) {
        rowsToDelete.push(i + 1);
      }
    }
    
    // Delete in reverse order
    for (let i = rowsToDelete.length - 1; i >= 0; i--) {
      sheet.deleteRow(rowsToDelete[i]);
    }
    
  } catch (error) {
    Logger.log('deleteWeftDetailsBySortMaster error: ' + error.message);
  }
}

/**
 * ============================================================================
 * DELETE FUNCTIONS
 * ============================================================================
 */

/**
 * Delete Sort Master (Admin only)
 * @param {number} sortMasterId - Sort Master ID
 * @param {number} userId - User ID performing deletion
 * @return {Object} {success, message}
 */
function deleteSortMaster(sortMasterId, userId) {
  try {
    // Check permission
    const permission = validatePermission(userId, 'DELETE', AUDIT_MODULES.SORT_MASTER);
    if (!permission.valid) {
      return {
        success: false,
        message: ERROR_MESSAGES.NO_PERMISSION
      };
    }
    
    // Get Sort Master for audit log
    const sortMaster = getSortMasterById(sortMasterId);
    if (!sortMaster) {
      return {
        success: false,
        message: 'Sort Master not found'
      };
    }
    
    // Delete warp/weft details first
    deleteWarpDetailsBySortMaster(sortMasterId);
    deleteWeftDetailsBySortMaster(sortMasterId);
    
    // Delete Sort Master
    const sheet = getSheet(SHEET_NAMES.SORT_MASTER);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === sortMasterId) {
        sheet.deleteRow(i + 1);
        break;
      }
    }
    
    // Log deletion
    logDelete(userId, AUDIT_MODULES.SORT_MASTER, sortMasterId, sortMaster);
    
    return {
      success: true,
      message: SUCCESS_MESSAGES.SORT_MASTER_DELETED
    };
    
  } catch (error) {
    Logger.log('deleteSortMaster error: ' + error.message);
    return {
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    };
  }
}

/**
 * ============================================================================
 * NOTIFICATIONS
 * ============================================================================
 */

/**
 * Send notifications for Sort Master creation
 * @param {number} sortMasterId - Sort Master ID
 * @param {string} sortMasterNo - Sort Master number
 * @param {Object} formData - Form data
 */
function sendSortMasterNotifications(sortMasterId, sortMasterNo, formData) {
  try {
    const sortMaster = getSortMasterById(sortMasterId);
    
    if (!sortMaster) {
      Logger.log('Sort Master not found for notifications');
      return;
    }
    
    // Get user for email
    const user = getUserById(formData.userId);
    
    // Send email if enabled
    if (EMAIL_CONFIG.ENABLED && user && user.emailNotifications) {
      sendSortMasterCreatedEmail(
        sortMasterNo,
        formData.rtweNo,
        formData.quality,
        sortMaster.glm,
        sortMaster.gsm,
        formData.userName
      );
    }
    
    // Send Telegram if enabled
    if (TELEGRAM_CONFIG.ENABLED && user && user.telegramNotifications && user.telegramChatId) {
      sendSortMasterCreatedTelegram(
        user.telegramChatId,
        sortMasterNo,
        formData.rtweNo,
        formData.quality
      );
    }
    
  } catch (error) {
    Logger.log('sendSortMasterNotifications error: ' + error.message);
    // Don't throw - notifications are optional
  }
}