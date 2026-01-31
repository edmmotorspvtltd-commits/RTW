// ============================================
// PENDING ENQUIRIES MANAGEMENT
// Backend functions for pending enquiries page
// FIXED VERSION - NEVER RETURNS NULL
// ============================================

/**
 * Get all pending enquiries - FIXED TO NEVER THROW OR RETURN NULL
 */
function getPendingEnquiries() {
  try {
    Logger.log('========================================');
    Logger.log('🔍 getPendingEnquiries START');
    Logger.log('Timestamp: ' + new Date().toISOString());
    Logger.log('========================================');
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log('✅ Spreadsheet ID: ' + ss.getId());
    Logger.log('✅ Spreadsheet Name: ' + ss.getName());
    
    // List all sheets
    const allSheets = ss.getSheets().map(s => s.getName());
    Logger.log('📋 All sheets: ' + allSheets.join(', '));
    
    const sheet = ss.getSheetByName('PENDING_DATA');
    
    if (!sheet) {
      Logger.log('❌ PENDING_DATA sheet not found!');
      Logger.log('Available sheets: ' + allSheets.join(', '));
      Logger.log('Returning empty array []');
      return []; // ✅ Return empty array, NOT null, DON'T throw
    }
    
    Logger.log('✅ PENDING_DATA sheet found');
    
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    
    Logger.log('📊 Last Row: ' + lastRow);
    Logger.log('📊 Last Column: ' + lastCol);
    
    if (lastRow <= 1) {
      Logger.log('⚠️ Sheet is empty or only has headers');
      Logger.log('Returning empty array []');
      return []; // ✅ Return empty array
    }
    
    const data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    const headers = data[0];
    
    Logger.log('📋 Headers: ' + JSON.stringify(headers));
    Logger.log('📊 Data rows (excluding header): ' + (data.length - 1));
    
    // DEBUG: Log each header individually
    Logger.log('🔍 DETAILED HEADER ANALYSIS:');
    for (let i = 0; i < headers.length; i++) {
      const h = headers[i];
      Logger.log('  Col ' + (i+1) + ': "' + h + '" (type: ' + typeof h + ', length: ' + String(h).length + ')');
      Logger.log('    Lowercase: "' + String(h).toLowerCase() + '"');
      Logger.log('    Contains "rtwe": ' + String(h).toLowerCase().includes('rtwe'));
    }
    
    // Find column indices - flexible matching
    const cols = {
      rtweNo: headers.findIndex(h => h && String(h).toLowerCase().includes('rtwe')),
      costingNo: headers.findIndex(h => h && String(h).toLowerCase().includes('costing')),
      enqDate: headers.findIndex(h => h && String(h).toLowerCase().includes('enquiry date')),
      enqTime: headers.findIndex(h => h && String(h).toLowerCase().includes('enquiry time')),
      broker: headers.findIndex(h => h && String(h).toLowerCase().includes('broker')),
      quality: headers.findIndex(h => h && String(h).toLowerCase().includes('quality')),
      givenRate: headers.findIndex(h => h && String(h).toLowerCase().includes('given rate')),
      orderStatus: headers.findIndex(h => h && String(h).toLowerCase().includes('order status')),
      createdDate: headers.findIndex(h => h && String(h).toLowerCase().includes('created date')),
      createdTime: headers.findIndex(h => h && String(h).toLowerCase().includes('created time')),
      createdBy: headers.findIndex(h => h && String(h).toLowerCase().includes('created by')),
      userId: headers.findIndex(h => h && String(h).toLowerCase().includes('user id'))
    };
    
    Logger.log('🔍 Column mapping:');
    Logger.log('  RTWE No: Col ' + (cols.rtweNo + 1) + ' (' + headers[cols.rtweNo] + ')');
    Logger.log('  Broker: Col ' + (cols.broker + 1) + ' (' + headers[cols.broker] + ')');
    Logger.log('  Quality: Col ' + (cols.quality + 1) + ' (' + headers[cols.quality] + ')');
    Logger.log('  Enquiry Date: Col ' + (cols.enqDate + 1) + ' (' + headers[cols.enqDate] + ')');
    Logger.log('  Given Rate: Col ' + (cols.givenRate + 1) + ' (' + headers[cols.givenRate] + ')');
    Logger.log('  Created Date: Col ' + (cols.createdDate + 1) + ' (' + headers[cols.createdDate] + ')');
    Logger.log('  Created Time: Col ' + (cols.createdTime + 1) + ' (' + headers[cols.createdTime] + ')');
    Logger.log('  Created By: Col ' + (cols.createdBy + 1) + ' (' + headers[cols.createdBy] + ')');
    Logger.log('  User ID: Col ' + (cols.userId + 1) + ' (' + headers[cols.userId] + ')');
    
    if (cols.rtweNo === -1) {
      Logger.log('❌ RTWE No column not found!');
      Logger.log('Returning empty array []');
      return []; // ✅ Return empty array, DON'T throw
    }
    
    // Build enquiries array
    const enquiries = [];
    
    Logger.log('📝 Processing rows...');
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (!row[cols.rtweNo] || String(row[cols.rtweNo]).trim() === '') {
        Logger.log('  Row ' + (i + 1) + ': SKIPPED (no RTWE No)');
        continue;
      }
      
      const enquiry = {
        rtweNo: String(row[cols.rtweNo] || '').trim(),
        costingNo: cols.costingNo !== -1 ? String(row[cols.costingNo] || '').trim() : '',
        enqDate: cols.enqDate !== -1 ? String(row[cols.enqDate] || '') : '',
        enqTime: cols.enqTime !== -1 ? String(row[cols.enqTime] || '') : '',
        broker: cols.broker !== -1 ? String(row[cols.broker] || '').trim() : '',
        quality: cols.quality !== -1 ? String(row[cols.quality] || '').trim() : '',
        givenRate: cols.givenRate !== -1 ? String(row[cols.givenRate] || '') : '',
        orderStatus: cols.orderStatus !== -1 ? String(row[cols.orderStatus] || '') : '',
        createdDate: cols.createdDate !== -1 ? String(row[cols.createdDate] || '') : '',
        createdTime: cols.createdTime !== -1 ? String(row[cols.createdTime] || '') : '',
        createdBy: cols.createdBy !== -1 ? String(row[cols.createdBy] || '').trim() : '',
        userId: cols.userId !== -1 ? String(row[cols.userId] || '').trim() : ''
      };
      
      enquiries.push(enquiry);
      Logger.log('  Row ' + (i + 1) + ': ✅ ' + enquiry.rtweNo + ' - ' + enquiry.broker);
    }
    
    Logger.log('========================================');
    Logger.log('✅ SUCCESS - Returning ' + enquiries.length + ' enquiries');
    if (enquiries.length > 0) {
      Logger.log('Sample (first enquiry): ' + JSON.stringify(enquiries[0]));
    }
    Logger.log('Final return type: ' + typeof enquiries);
    Logger.log('Is array: ' + Array.isArray(enquiries));
    Logger.log('========================================');
    
    return enquiries; // ✅ ALWAYS returns an array, never null
    
  } catch (error) {
    Logger.log('========================================');
    Logger.log('❌ CRITICAL ERROR in getPendingEnquiries');
    Logger.log('Error message: ' + error.message);
    Logger.log('Error toString: ' + error.toString());
    Logger.log('Stack trace: ' + error.stack);
    Logger.log('Returning empty array [] instead of throwing');
    Logger.log('========================================');
    
    // ✅ CRITICAL: Return empty array even on error, NEVER throw, NEVER return null
    return [];
  }
}

/**
 * Load a specific pending enquiry by RTWE number
 * Called when clicking Approve from Pending Enquiries page
 */
function loadPendingEnquiryData(rtweNo) {
  try {
    Logger.log('🔍 loadPendingEnquiryData called for: ' + rtweNo);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('PENDING_DATA');
    
    if (!sheet) {
      Logger.log('❌ PENDING_DATA sheet not found');
      return null;
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      Logger.log('❌ No data in PENDING_DATA sheet');
      return null;
    }
    
    const headers = data[0];
    
    // Find column indices
    const colMap = {};
    headers.forEach((h, i) => {
      const header = String(h).toLowerCase();
      if (header.includes('rtwe')) colMap.rtweNo = i;
      if (header.includes('costing')) colMap.costingNo = i;
      if (header.includes('enquiry date')) colMap.enqDate = i;
      if (header.includes('enquiry time')) colMap.enqTime = i;
      if (header.includes('broker')) colMap.broker = i;
      if (header.includes('quality')) colMap.quality = i;
      if (header.includes('given rate')) colMap.givenRate = i;
      if (header.includes('order status')) colMap.orderStatus = i;
    });
    
    // Find the matching row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (String(row[colMap.rtweNo]).trim() === String(rtweNo).trim()) {
        Logger.log('✅ Found matching enquiry at row ' + (i + 1));
        
        // Format date and time for display
        let enqDate = row[colMap.enqDate];
        if (enqDate instanceof Date) {
          enqDate = Utilities.formatDate(enqDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        }
        
        let enqTime = row[colMap.enqTime];
        if (enqTime instanceof Date) {
          enqTime = Utilities.formatDate(enqTime, Session.getScriptTimeZone(), 'HH:mm');
        }
        
        const enquiryData = {
          rtweNo: String(row[colMap.rtweNo] || '').trim(),
          costingNo: colMap.costingNo !== undefined ? String(row[colMap.costingNo] || '').trim() : '',
          enqDate: enqDate || '',
          enqTime: enqTime || '',
          broker: colMap.broker !== undefined ? String(row[colMap.broker] || '').trim() : '',
          quality: colMap.quality !== undefined ? String(row[colMap.quality] || '').trim() : '',
          givenRate: colMap.givenRate !== undefined ? String(row[colMap.givenRate] || '') : '',
          orderStatus: colMap.orderStatus !== undefined ? String(row[colMap.orderStatus] || '') : 'Pending'
        };
        
        Logger.log('Returning data: ' + JSON.stringify(enquiryData));
        return enquiryData;
      }
    }
    
    Logger.log('❌ No matching enquiry found for RTWE: ' + rtweNo);
    return null;
    
  } catch (error) {
    Logger.log('❌ loadPendingEnquiryData error: ' + error);
    return null;
  }
}

/**
 * Cancel an enquiry and move to CLOSED sheet
 */
function cancelEnquiry(rtweNo, reason) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const pendingSheet = ss.getSheetByName('PENDING_DATA');
    let cancelledSheet = ss.getSheetByName('ENQUIRY_CLOSED_DATA');
    
    if (!pendingSheet) {
      return { success: false, error: 'PENDING_DATA sheet not found' };
    }
    
    // Create ENQUIRY_CLOSED_DATA sheet if it doesn't exist
    if (!cancelledSheet) {
      cancelledSheet = ss.insertSheet('ENQUIRY_CLOSED_DATA');
      
      // Copy headers from PENDING_DATA and add cancellation columns
      const headers = pendingSheet.getRange(1, 1, 1, pendingSheet.getLastColumn()).getValues()[0];
      headers.push('Cancellation Reason', 'Cancelled Date', 'Cancelled Time');
      
      cancelledSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      cancelledSheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#f44336')
        .setFontColor('#ffffff');
      
      cancelledSheet.setFrozenRows(1);
    }
    
    // Find the enquiry in PENDING_DATA
    const data = pendingSheet.getDataRange().getValues();
    const headers = data[0];
    const rtweNoCol = headers.findIndex(h => h && String(h).toLowerCase().includes('rtwe'));
    
    let foundRow = -1;
    let rowData = null;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][rtweNoCol] === rtweNo) {
        foundRow = i + 1; // +1 for 1-indexed
        rowData = data[i];
        break;
      }
    }
    
    if (foundRow === -1) {
      return { success: false, error: 'Enquiry not found: ' + rtweNo };
    }
    
    // Add cancellation info
    const now = new Date();
    const cancelDate = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd-MM-yyyy');
    const cancelTime = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm:ss');
    
    rowData.push(reason || 'No reason provided', cancelDate, cancelTime);
    
    // Add to ENQUIRY_CLOSED_DATA sheet
    cancelledSheet.appendRow(rowData);
    
    // Delete from PENDING_DATA
    pendingSheet.deleteRow(foundRow);
    
    Logger.log('✅ Enquiry cancelled: ' + rtweNo);
    
    return { 
      success: true, 
      message: 'Enquiry cancelled successfully',
      rtweNo: rtweNo
    };
    
  } catch (error) {
    Logger.log('❌ cancelEnquiry error: ' + error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Serve pending enquiries page
 */
function servePendingEnquiries(sessionId) {
  const session = getSessionData(sessionId);
  
  if (!session) {
    return serveLogin('Session expired. Please login again.');
  }
  
  const template = HtmlService.createTemplateFromFile('PendingEnquiries');
  template.sessionId = sessionId;
  template.userName = session.name || session.userName || 'User';
  
  return template.evaluate()
    .setTitle('Pending Enquiries - RTWE')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

/**
 * TEST FUNCTION - Run this manually to verify the fix
 */
function TEST_getPendingEnquiries() {
  Logger.clear();
  Logger.log('=== MANUAL TEST OF getPendingEnquiries ===\n');
  
  const result = getPendingEnquiries();
  
  Logger.log('\n=== TEST RESULTS ===');
  Logger.log('Return value: ' + JSON.stringify(result));
  Logger.log('Type: ' + typeof result);
  Logger.log('Is Array: ' + Array.isArray(result));
  Logger.log('Is null: ' + (result === null));
  Logger.log('Is undefined: ' + (result === undefined));
  Logger.log('Length: ' + (result ? result.length : 'N/A'));
  Logger.log('=== TEST COMPLETE ===');
  
  return result;
}