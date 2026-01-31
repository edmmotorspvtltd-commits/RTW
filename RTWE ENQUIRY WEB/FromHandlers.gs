// ============================================
// FORM HANDLERS - FINAL FIXED VERSION
// ============================================

/**
 * Get master data for form dropdowns
 * FIXED: Correct column indices for MASTER_DATA sheet
 */
function getMasterDataForForm() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(CONFIG.SHEETS.MASTER);
  
  if (!masterSheet) {
    return {
      brokers: [],
      qualities: [],
      buyers: [],
      designs: [],
      yarns: []
    };
  }
  
  const data = masterSheet.getDataRange().getValues();
  
  // FIXED: Correct column indices (0-indexed)
  // MASTER_DATA columns: A=Broker, B=Quality, C=Selvedge, D=Year, E=Month, F=Buyer, G=Design, H=Taga, I=Yarn
  const brokers = getUniqueValues(data, 0);    // Column A (Broker Name)
  const qualities = getUniqueValues(data, 1);  // Column B (Quality)
  const buyers = getUniqueValues(data, 5);     // Column F (Buyer)
  const designs = getUniqueValues(data, 6);    // Column G (Design No)
  const yarns = getUniqueValues(data, 8);      // Column I (Yarn Type)
  
  return {
    brokers: brokers,
    qualities: qualities,
    buyers: buyers,
    designs: designs,
    yarns: yarns
  };
}

/**
 * Helper function to get unique values from column
 */
function getUniqueValues(data, colIndex) {
  const values = [];
  const seen = {};
  
  // Skip header row (start from index 1)
  for (let i = 1; i < data.length; i++) {
    const val = data[i][colIndex];
    if (val && val !== '' && !seen[val]) {
      values.push(val);
      seen[val] = true;
    }
  }
  
  return values.sort();
}

/**
 * Generate new entry data (RTWE, Costing, Date, Time)
 */
function generateNewEntryData() {
  const rtweNo = generateRTWENumber();
  const costingNo = deriveCostingFromRTWE(rtweNo);
  const now = new Date();
  
  return {
    rtweNo: rtweNo,
    costingNo: costingNo,
    enqDate: Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
    enqTime: Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm')
  };
}

/**
 * Get pending approved RTWE list
 */
function getPendingApprovedList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.PENDING_APPROVED);
  
  if (!sheet) return [];
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  
  const rtweList = sheet.getRange(2, 1, lastRow - 1, 1)
    .getValues()
    .flat()
    .filter(val => val !== '');
  
  return rtweList;
}

/**
 * Load pending approved enquiry data
 */
function loadPendingApprovedEnquiryData(rtweNo) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.PENDING_APPROVED);
  
  if (!sheet) throw new Error('PENDING_APPROVED sheet not found');
  
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === rtweNo) {
      return {
        rtweNo: data[i][0],
        costingNo: data[i][1],
        enqDate: formatDateForInput(data[i][2]),
        enqTime: formatTimeForInput(data[i][3]),
        broker: data[i][4],
        quality: data[i][5],
        givenRate: data[i][6],
        orderStatus: 'Approved'
      };
    }
  }
  
  throw new Error('RTWE not found: ' + rtweNo);
}

/**
 * Get edit enquiry list (all RTWEs from all sheets)
 */
function getEditEnquiryList() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = [
    CONFIG.SHEETS.PENDING,
    CONFIG.SHEETS.PENDING_APPROVED,
    CONFIG.SHEETS.CONFIRMED,
    CONFIG.SHEETS.CLOSED
  ];
  
  const rtweList = [];
  
  sheets.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return;
    
    const data = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    
    data.forEach(row => {
      if (row[0] && row[0] !== '') {
        rtweList.push({
          value: row[0] + '|||' + sheetName,
          label: row[0] + ' (' + sheetName + ')'
        });
      }
    });
  });
  
  return rtweList;
}

/**
 * Load edit enquiry data
 */
function loadEditEnquiryData(selectedValue) {
  const parts = selectedValue.split('|||');
  if (parts.length !== 2) throw new Error('Invalid selection');
  
  const rtweNo = parts[0];
  const sheetName = parts[1];
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) throw new Error('Sheet not found: ' + sheetName);
  
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === rtweNo) {
      const formData = {
        rtweNo: data[i][0],
        costingNo: data[i][1],
        enqDate: formatDateForInput(data[i][2]),
        enqTime: formatTimeForInput(data[i][3]),
        broker: data[i][4],
        quality: data[i][5],
        givenRate: data[i][6],
        orderStatus: data[i][7],
        isConfirmed: sheetName === CONFIG.SHEETS.CONFIRMED
      };
      
      // If from confirmed sheet, add approval data
      if (sheetName === CONFIG.SHEETS.CONFIRMED) {
        formData.approvedDate = formatDateForInput(data[i][8]);
        formData.approvedTime = formatTimeForInput(data[i][9]);
        formData.finalRate = data[i][10];
        formData.buyer = data[i][11];
        formData.poNo = data[i][12];
        formData.qualityOrder = data[i][14];
        
        // Design & Taga
        formData.design1 = data[i][15];
        formData.taga1 = data[i][16];
        formData.design2 = data[i][17];
        formData.taga2 = data[i][18];
        formData.design3 = data[i][19];
        formData.taga3 = data[i][20];
        formData.design4 = data[i][21];
        formData.taga4 = data[i][22];
        formData.design5 = data[i][23];
        formData.taga5 = data[i][24];
        formData.design6 = data[i][25];
        formData.taga6 = data[i][26];
        
        formData.countMeter = data[i][28];
        formData.selvedgeName = data[i][31];
        formData.selvedgeEnds = data[i][32];
        formData.selvedgeColor = data[i][33];
        formData.yarnUsed = data[i][34];
        formData.paymentTerms = data[i][36];
        formData.deliveryDate = formatDateForInput(data[i][37]);
        formData.remark = data[i][38];
      }
      
      // Store edit info in properties
      PropertiesService.getScriptProperties().setProperty('EDIT_SOURCE_SHEET', sheetName);
      PropertiesService.getScriptProperties().setProperty('EDIT_RTWE', rtweNo);
      
      return formData;
    }
  }
  
  throw new Error('RTWE not found: ' + rtweNo);
}

/**
 * Submit enquiry form (from HTML)
 */
function submitEnquiryForm(formData) {
  // Check login
  const userProps = PropertiesService.getUserProperties();
  const sessionData = userProps.getProperty('SESSION_DATA');
  
  if (!sessionData) {
    return {
      success: false,
      message: '🔒 LOGIN REQUIRED\n\nYou must login before submitting.'
    };
  }
  
  const session = JSON.parse(sessionData);
  const now = new Date().getTime();
  
  // Check session timeout
  if (now - session.lastActivity > USERS_CONFIG.security.sessionTimeout * 60 * 1000) {
    return {
      success: false,
      message: '⏰ SESSION EXPIRED\n\nPlease login again.'
    };
  }
  
  // Update session
  session.lastActivity = now;
  userProps.setProperty('SESSION_DATA', JSON.stringify(session));
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const entryType = formData.entryType;
    const rtweNo = formData.rtweNo;
    
    let oldSheet = null;
    let isEdit = false;
    
    if (entryType === 'EDIT ENQUIRY') {
      oldSheet = PropertiesService.getScriptProperties().getProperty('EDIT_SOURCE_SHEET');
      isEdit = true;
    } else if (entryType === 'PENDING APPROVED') {
      oldSheet = CONFIG.SHEETS.PENDING_APPROVED;
      isEdit = true;
    }
    
    // Validate duplicates for new entry
    if (entryType === 'NEW ENTRY') {
      const rtweCheck = checkDuplicateRTWE(formData.rtweNo);
      if (rtweCheck.isDuplicate) {
        return {
          success: false,
          message: rtweCheck.message
        };
      }
    }
    
    // Check duplicate PO
    if (formData.orderStatus === 'Approved' && formData.poNo) {
      const poCheck = checkDuplicatePO(formData.poNo);
      if (poCheck.isDuplicate) {
        return {
          success: false,
          message: poCheck.message
        };
      }
    }
    
    // Add created by info
    formData.createdBy = session.name;
    formData.createdByUsername = session.username;
    
    // Determine target sheet
    let targetSheetName;
    
    if (entryType === 'NEW ENTRY') {
      if (formData.orderStatus === 'Pending') {
        targetSheetName = CONFIG.SHEETS.PENDING;
      } else if (formData.orderStatus === 'Approved') {
        targetSheetName = CONFIG.SHEETS.PENDING_APPROVED;
      } else if (formData.orderStatus === 'Canceled') {
        targetSheetName = CONFIG.SHEETS.CLOSED;
      }
    } else if (entryType === 'PENDING APPROVED') {
      targetSheetName = CONFIG.SHEETS.CONFIRMED;
    } else if (entryType === 'EDIT ENQUIRY') {
      if (formData.orderStatus === 'Pending') {
        targetSheetName = CONFIG.SHEETS.PENDING;
      } else if (formData.orderStatus === 'Approved') {
        targetSheetName = CONFIG.SHEETS.CONFIRMED;
      } else if (formData.orderStatus === 'Canceled') {
        targetSheetName = CONFIG.SHEETS.CLOSED;
      }
    }
    
    // Delete from old sheet if editing
    if (isEdit && oldSheet) {
      deleteRecordFromSheet(rtweNo, oldSheet);
      Logger.log('Deleted from old sheet: ' + oldSheet);
    }
    
    // Save to target sheet
    const targetSheet = ss.getSheetByName(targetSheetName);
    saveFormDataToSheet(formData, targetSheet);
    
    // Send notifications if confirmed
    if (targetSheetName === CONFIG.SHEETS.CONFIRMED) {
      try {
        sendOrderConfirmationNotifications(formData);
        updateExternalSheet(formData.rtweNo, 'Approved');
        showPDFShareDialog(formData);
      } catch (notifError) {
        Logger.log('Notification error: ' + notifError);
      }
    }
    
    // Log activity
    logUserActivity(
      session.username,
      'SUBMIT_ENQUIRY',
      'RTWE: ' + formData.rtweNo + ' | Status: ' + formData.orderStatus + ' | Sheet: ' + targetSheetName
    );
    
    return {
      success: true,
      message: '✅ Saved Successfully!\n\nRTWE: ' + formData.rtweNo + '\nStatus: ' + formData.orderStatus + '\nSaved to: ' + targetSheetName
    };
    
  } catch (error) {
    Logger.log('Submit error: ' + error);
    return {
      success: false,
      message: '❌ Error: ' + error.message
    };
  }
}

/**
 * Save form data to sheet
 */
function saveFormDataToSheet(formData, targetSheet) {
  let dataRow;
  
  // Convert designs array to JSON if present
  let designsJson = '';
  if (formData.designs && Array.isArray(formData.designs)) {
    designsJson = JSON.stringify(formData.designs);
    Logger.log('📦 Saving designs as JSON: ' + designsJson);
  }
  
  if (targetSheet.getName() === CONFIG.SHEETS.CONFIRMED) {
    dataRow = [
      formData.rtweNo,
      formData.costingNo,
      formData.enqDate,
      formData.enqTime,
      formData.broker,
      formData.quality,
      formData.givenRate,
      formData.orderStatus,
      formData.approvedDate || '',
      formData.approvedTime || '',
      formData.finalRate || '',
      formData.buyer || '',
      formData.poNo || '',
      '', // SO_NO removed
      formData.qualityOrder || '',
      // Old columns 15-26 (Design1-6, Taga1-6) - kept for backward compatibility
      formData.design1 || '',
      formData.taga1 || '',
      formData.design2 || '',
      formData.taga2 || '',
      formData.design3 || '',
      formData.taga3 || '',
      formData.design4 || '',
      formData.taga4 || '',
      formData.design5 || '',
      formData.taga5 || '',
      formData.design6 || '',
      formData.taga6 || '',
      formData.totalOrderTaga || '',
      formData.countMeter || '',
      formData.totalMTR || '',
      formData.totalOrderValue || '',
      formData.selvedgeName || '',
      formData.selvedgeEnds || '',
      formData.selvedgeColor || '',
      formData.yarnUsed || '',
      formData.sizingBeam || '',
      formData.paymentTerms || '',
      formData.deliveryDate || '',
      formData.remark || '',
      new Date(),
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'HH:mm:ss'),
      formData.createdBy || '',
      formData.createdByUsername || '',
      '', // QR Code placeholder
      designsJson // Column 44 (AQ): NEW designs JSON column
    ];
  } else {
    // For PENDING_DATA and PENDING_APPROVED - use full 44-column structure
    const now = new Date();
    const createdDate = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy');
    const createdTime = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm:ss');
    
    dataRow = new Array(44).fill(''); // Create 44-column array
    dataRow[0] = formData.rtweNo;
    dataRow[1] = formData.costingNo;
    dataRow[2] = formData.enqDate;
    dataRow[3] = formData.enqTime;
    dataRow[4] = formData.broker;
    dataRow[5] = formData.quality;
    dataRow[6] = formData.givenRate;
    dataRow[7] = formData.orderStatus;
    // Columns 8-38 remain empty for now (can be filled later when order is confirmed)
    dataRow[39] = createdDate;                    // Created Date
    dataRow[40] = createdTime;                    // Created Time
    dataRow[41] = formData.createdBy || '';       // Created By (USER NAME)
    dataRow[42] = formData.createdByUsername || '';// User ID (USERNAME)
    dataRow[43] = '';                             // QR Code placeholder
  }
  
  targetSheet.appendRow(dataRow);
  
  const lastRow = targetSheet.getLastRow();
  const lastCol = targetSheet.getLastColumn();
  
  // Apply colors
  let color = '';
  if (targetSheet.getName() === CONFIG.SHEETS.CONFIRMED) {
    color = CONFIG.COLORS.GREEN;
    generateQRCodeForOrder(formData.rtweNo, targetSheet, lastRow);
  } else if (targetSheet.getName() === CONFIG.SHEETS.PENDING || 
             targetSheet.getName() === CONFIG.SHEETS.PENDING_APPROVED) {
    color = CONFIG.COLORS.YELLOW;
  } else if (targetSheet.getName() === CONFIG.SHEETS.CLOSED) {
    color = CONFIG.COLORS.RED;
  }
  
  if (color) {
    targetSheet.getRange(lastRow, 1, 1, lastCol).setBackground(color);
  }
}

/**
 * Format date for HTML input (yyyy-MM-dd)
 */
function formatDateForInput(dateValue) {
  if (!dateValue) return '';
  
  const date = new Date(dateValue);
  if (isNaN(date.getTime())) return '';
  
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

/**
 * Format time for HTML input (HH:mm)
 */
function formatTimeForInput(timeValue) {
  if (!timeValue) return '';
  
  // If it's a date object with time
  if (timeValue instanceof Date) {
    return Utilities.formatDate(timeValue, Session.getScriptTimeZone(), 'HH:mm');
  }
  
  // If it's already a time string
  if (typeof timeValue === 'string') {
    return timeValue.substring(0, 5);
  }
  
  return '';
}

/**
 * Delete record from sheet by RTWE number
 * Added here to ensure it's always available
 */
function deleteRecordFromSheet(rtweNo, sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    Logger.log('Sheet not found: ' + sheetName);
    return;
  }
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === rtweNo) {
      sheet.deleteRow(i + 1);
      Logger.log('✅ Deleted RTWE ' + rtweNo + ' from ' + sheetName + ' (Row ' + (i + 1) + ')');
      return;
    }
  }
  
  Logger.log('⚠️ RTWE ' + rtweNo + ' not found in ' + sheetName);
}