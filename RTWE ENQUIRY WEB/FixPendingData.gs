/**
 * Fix existing PENDING_DATA records to add user tracking information
 * Run this function once to populate Created Date, Created Time, Created By, and User ID
 * for existing records that don't have this information
 */
function fixPendingDataUserTracking() {
  try {
    Logger.log('========================================');
    Logger.log('🔧 FIXING PENDING_DATA USER TRACKING');
    Logger.log('========================================');
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('PENDING_DATA');
    
    if (!sheet) {
      Logger.log('❌ PENDING_DATA sheet not found');
      return { success: false, message: 'PENDING_DATA sheet not found' };
    }
    
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    
    Logger.log('📊 Sheet has ' + lastRow + ' rows and ' + lastCol + ' columns');
    
    if (lastRow <= 1) {
      Logger.log('⚠️ No data to fix');
      return { success: true, message: 'No data to fix' };
    }
    
    // Get all data
    const data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    const headers = data[0];
    
    Logger.log('📋 Headers: ' + JSON.stringify(headers));
    
    // Find column indices
    const cols = {
      rtweNo: headers.findIndex(h => h && String(h).toLowerCase().includes('rtwe')),
      createdDate: headers.findIndex(h => h && String(h).toLowerCase().includes('created date')),
      createdTime: headers.findIndex(h => h && String(h).toLowerCase().includes('created time')),
      createdBy: headers.findIndex(h => h && String(h).toLowerCase().includes('created by')),
      userId: headers.findIndex(h => h && String(h).toLowerCase().includes('user id'))
    };
    
    Logger.log('🔍 Column indices:');
    Logger.log('  Created Date: ' + (cols.createdDate + 1));
    Logger.log('  Created Time: ' + (cols.createdTime + 1));
    Logger.log('  Created By: ' + (cols.createdBy + 1));
    Logger.log('  User ID: ' + (cols.userId + 1));
    
    if (cols.createdDate === -1 || cols.createdTime === -1 || cols.createdBy === -1 || cols.userId === -1) {
      Logger.log('❌ Required columns not found');
      return { success: false, message: 'Required columns not found in PENDING_DATA sheet' };
    }
    
    // Get current user session to use as default
    const userProps = PropertiesService.getUserProperties();
    const sessionData = userProps.getProperty('SESSION_DATA');
    let defaultUser = 'System';
    let defaultUserId = 'system';
    
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        defaultUser = session.name || 'System';
        defaultUserId = session.username || 'system';
      } catch (e) {
        Logger.log('⚠️ Could not parse session data, using default');
      }
    }
    
    Logger.log('📝 Default user: ' + defaultUser + ' (' + defaultUserId + ')');
    
    // Process each row
    let fixedCount = 0;
    const now = new Date();
    const defaultDate = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy');
    const defaultTime = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm:ss');
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const rowNum = i + 1;
      
      // Skip if RTWE No is empty
      if (!row[cols.rtweNo] || String(row[cols.rtweNo]).trim() === '') {
        Logger.log('  Row ' + rowNum + ': SKIPPED (no RTWE No)');
        continue;
      }
      
      // Check if user tracking data is missing
      const needsFix = !row[cols.createdDate] || !row[cols.createdTime] || 
                       !row[cols.createdBy] || !row[cols.userId];
      
      if (needsFix) {
        // Update the cells
        if (!row[cols.createdDate]) {
          sheet.getRange(rowNum, cols.createdDate + 1).setValue(defaultDate);
        }
        if (!row[cols.createdTime]) {
          sheet.getRange(rowNum, cols.createdTime + 1).setValue(defaultTime);
        }
        if (!row[cols.createdBy]) {
          sheet.getRange(rowNum, cols.createdBy + 1).setValue(defaultUser);
        }
        if (!row[cols.userId]) {
          sheet.getRange(rowNum, cols.userId + 1).setValue(defaultUserId);
        }
        
        fixedCount++;
        Logger.log('  Row ' + rowNum + ': ✅ FIXED - ' + row[cols.rtweNo]);
      } else {
        Logger.log('  Row ' + rowNum + ': ⏭️ SKIPPED (already has data) - ' + row[cols.rtweNo]);
      }
    }
    
    Logger.log('========================================');
    Logger.log('✅ COMPLETED - Fixed ' + fixedCount + ' rows');
    Logger.log('========================================');
    
    return {
      success: true,
      message: 'Successfully fixed ' + fixedCount + ' rows in PENDING_DATA',
      fixedCount: fixedCount
    };
    
  } catch (error) {
    Logger.log('❌ ERROR: ' + error.message);
    Logger.log('Stack: ' + error.stack);
    return {
      success: false,
      message: 'Error: ' + error.message
    };
  }
}

/**
 * Create a custom menu to run the fix
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🔧 Data Fixes')
    .addItem('Fix Pending Data User Tracking', 'fixPendingDataUserTracking')
    .addToUi();
}
