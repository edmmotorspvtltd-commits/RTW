// ============================================
// PENDING APPROVED MANAGEMENT
// Backend functions for pending approved page
// FIXED VERSION - Uses dynamic column finding
// ============================================

/**
 * Get all pending approved enquiries - FIXED TO USE DYNAMIC COLUMN FINDING
 * Reads from PENDING_APPROVED sheet
 */
function getPendingApprovedEnquiries() {
  try {
    Logger.log('========================================');
    Logger.log('🔍 getPendingApprovedEnquiries START');
    Logger.log('Timestamp: ' + new Date().toISOString());
    Logger.log('========================================');
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log('✅ Spreadsheet ID: ' + ss.getId());
    
    // List all sheets
    const allSheets = ss.getSheets().map(s => s.getName());
    Logger.log('📋 All sheets: ' + allSheets.join(', '));
    
    const sheet = ss.getSheetByName('PENDING_APPROVED');
    
    if (!sheet) {
      Logger.log('❌ PENDING_APPROVED sheet not found!');
      Logger.log('Available sheets: ' + allSheets.join(', '));
      return []; // Return empty array, never null
    }
    
    Logger.log('✅ PENDING_APPROVED sheet found');
    
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    
    Logger.log('📊 Last Row: ' + lastRow);
    Logger.log('📊 Last Column: ' + lastCol);
    
    if (lastRow <= 1) {
      Logger.log('⚠️ Sheet is empty or only has headers');
      return [];
    }
    
    const data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    const headers = data[0];
    
    Logger.log('📋 Headers: ' + JSON.stringify(headers));
    
    // Find column indices dynamically based on header names
    const cols = {
      rtweNo: headers.findIndex(h => h && String(h).toLowerCase().includes('rtwe')),
      costingNo: headers.findIndex(h => h && String(h).toLowerCase().includes('costing')),
      enqDate: headers.findIndex(h => h && String(h).toLowerCase().includes('enquiry date')),
      enqTime: headers.findIndex(h => h && String(h).toLowerCase().includes('enquiry time')),
      broker: headers.findIndex(h => h && String(h).toLowerCase().includes('broker')),
      quality: headers.findIndex(h => h && String(h).toLowerCase() === 'quality'),
      givenRate: headers.findIndex(h => h && String(h).toLowerCase().includes('given rate')),
      orderStatus: headers.findIndex(h => h && String(h).toLowerCase().includes('order status')),
      approvedDate: headers.findIndex(h => h && String(h).toLowerCase().includes('approved date')),
      approvedTime: headers.findIndex(h => h && String(h).toLowerCase().includes('approved time')),
      finalRate: headers.findIndex(h => h && String(h).toLowerCase().includes('final rate')),
      buyer: headers.findIndex(h => h && String(h).toLowerCase().includes('buyer'))
    };
    
    Logger.log('🔍 Column mapping:');
    Logger.log('  RTWE No: Col ' + (cols.rtweNo + 1));
    Logger.log('  Broker: Col ' + (cols.broker + 1));
    Logger.log('  Quality: Col ' + (cols.quality + 1));
    Logger.log('  Buyer: Col ' + (cols.buyer + 1));
    Logger.log('  Final Rate: Col ' + (cols.finalRate + 1));
    
    if (cols.rtweNo === -1) {
      Logger.log('❌ RTWE No column not found!');
      return [];
    }
    
    // Helper functions for safe value conversion
    function safeDateString(value) {
      if (value === null || value === undefined || value === '') return '';
      try {
        if (value instanceof Date) {
          return Utilities.formatDate(value, Session.getScriptTimeZone(), 'dd-MM-yyyy');
        }
        return String(value).trim();
      } catch (e) {
        return String(value || '').trim();
      }
    }
    
    function safeString(value) {
      if (value === null || value === undefined) return '';
      return String(value).trim();
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
      
      // Build enquiry object with safe value access
      const enquiry = {
        rtweNo: safeString(row[cols.rtweNo]),
        costingNo: cols.costingNo !== -1 ? safeString(row[cols.costingNo]) : '',
        enqDate: cols.enqDate !== -1 ? safeDateString(row[cols.enqDate]) : '',
        enqTime: cols.enqTime !== -1 ? safeString(row[cols.enqTime]) : '',
        broker: cols.broker !== -1 ? safeString(row[cols.broker]) : '',
        quality: cols.quality !== -1 ? safeString(row[cols.quality]) : '',
        givenRate: cols.givenRate !== -1 ? safeString(row[cols.givenRate]) : '',
        orderStatus: cols.orderStatus !== -1 ? safeString(row[cols.orderStatus]) || 'Approved' : 'Approved',
        approvedDate: cols.approvedDate !== -1 ? safeDateString(row[cols.approvedDate]) : '',
        approvedTime: cols.approvedTime !== -1 ? safeString(row[cols.approvedTime]) : '',
        finalRate: cols.finalRate !== -1 ? safeString(row[cols.finalRate]) : '',
        buyer: cols.buyer !== -1 ? safeString(row[cols.buyer]) : ''
      };
      
      enquiries.push(enquiry);
      Logger.log('  Row ' + (i + 1) + ': ✅ ' + enquiry.rtweNo + ' - ' + enquiry.buyer + ' - ' + enquiry.broker);
    }
    
    Logger.log('========================================');
    Logger.log('✅ SUCCESS - Returning ' + enquiries.length + ' pending approved enquiries');
    if (enquiries.length > 0) {
      Logger.log('Sample (first enquiry): ' + JSON.stringify(enquiries[0]));
    }
    Logger.log('Final return type: ' + typeof enquiries);
    Logger.log('Is array: ' + Array.isArray(enquiries));
    Logger.log('========================================');
    
    return enquiries; // ALWAYS returns an array, never null
    
  } catch (error) {
    Logger.log('========================================');
    Logger.log('❌ CRITICAL ERROR in getPendingApprovedEnquiries');
    Logger.log('Error message: ' + error.message);
    Logger.log('Error toString: ' + error.toString());
    Logger.log('Stack trace: ' + error.stack);
    Logger.log('Returning empty array [] instead of throwing');
    Logger.log('========================================');
    
    // Return empty array even on error, NEVER throw, NEVER return null
    return [];
  }
}


/**
 * Load a specific pending approved enquiry by RTWE number
 * Used for View and Confirm modes
 */
function loadPendingApprovedEnquiryData(rtweNo) {
  try {
    Logger.log('🔍 loadPendingApprovedEnquiryData called for: ' + rtweNo);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('PENDING_APPROVED');
    
    if (!sheet) {
      Logger.log('❌ PENDING_APPROVED sheet not found');
      return null;
    }
    
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      Logger.log('❌ No data in PENDING_APPROVED sheet');
      return null;
    }
    
    const data = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
    const searchRtwe = String(rtweNo).trim().toUpperCase().replace(/[-\s]/g, '');
    
    Logger.log('🔍 Searching for RTWE: ' + searchRtwe);
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const sheetRtwe = String(row[0] || '').trim().toUpperCase().replace(/[-\s]/g, '');
      
      if (sheetRtwe === searchRtwe || sheetRtwe.includes(searchRtwe) || searchRtwe.includes(sheetRtwe)) {
        Logger.log('✅ Found matching enquiry at row ' + (i + 1));
        
        // Helper function for dates
        function formatDateValue(value) {
          if (!value) return '';
          try {
            if (value instanceof Date) {
              return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
            }
            return String(value);
          } catch (e) {
            return String(value);
          }
        }
        
        // Helper function for time values
        function formatTimeValue(value) {
          if (!value) return '';
          try {
            if (value instanceof Date) {
              return Utilities.formatDate(value, Session.getScriptTimeZone(), 'HH:mm');
            }
            // If it's already a string in HH:mm format, return as is
            return String(value).trim();
          } catch (e) {
            return String(value || '').trim();
          }
        }
        
        function safeString(value) {
          if (value === null || value === undefined) return '';
          return String(value).trim();
        }
        
        // Column mapping based on PENDING_APPROVED sheet structure
        // Note: Column H (index 7) is blank/reserved, orderStatus is at index 8
        const enquiryData = {
          rtweNo: safeString(row[0]),
          costingNo: safeString(row[1]),
          enqDate: formatDateValue(row[2]),
          enqTime: formatTimeValue(row[3]),
          broker: safeString(row[4]),
          quality: safeString(row[5]),
          givenRate: safeString(row[6]),
          // Index 7 is blank/reserved
          orderStatus: safeString(row[8]) || 'Approved',
          approvedDate: formatDateValue(row[9]),
          approvedTime: formatTimeValue(row[10]),
          finalRate: safeString(row[11]),
          buyer: safeString(row[12]),
          poNo: safeString(row[13]),
          qualityOrder: safeString(row[14]),
          design1: safeString(row[15]),
          taga1: safeString(row[16]),
          design2: safeString(row[17]),
          taga2: safeString(row[18]),
          design3: safeString(row[19]),
          taga3: safeString(row[20]),
          design4: safeString(row[21]),
          taga4: safeString(row[22]),
          design5: safeString(row[23]),
          taga5: safeString(row[24]),
          design6: safeString(row[25]),
          taga6: safeString(row[26]),
          countMeter: safeString(row[27]),
          selvedgeName: safeString(row[28]),
          selvedgeEnds: safeString(row[29]),
          selvedgeColor: safeString(row[30]),
          yarnUsed: safeString(row[31]),
          paymentTerms: safeString(row[32]),
          deliveryDate: formatDateValue(row[33]),
          remark: safeString(row[34]),
          totalOrderTaga: safeString(row[35]),
          totalMTR: safeString(row[36]),
          totalOrderValue: safeString(row[37]),
          sizingBeam: safeString(row[38]),
          isPendingApproved: true,
          sourceSheet: 'PENDING_APPROVED'
        };
        
        Logger.log('📦 Returning data for RTWE: ' + enquiryData.rtweNo);
        return enquiryData;
      }
    }
    
    Logger.log('❌ No matching enquiry found for RTWE: ' + rtweNo);
    return null;
    
  } catch (error) {
    Logger.log('❌ loadPendingApprovedEnquiryData error: ' + error.message);
    return null;
  }
}

/**
 * Cancel an approved enquiry and move to CLOSED sheet
 */
function cancelApprovedEnquiry(rtweNo, reason) {
  try {
    Logger.log('🔍 cancelApprovedEnquiry called for: ' + rtweNo);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const approvedSheet = ss.getSheetByName('PENDING_APPROVED');
    let closedSheet = ss.getSheetByName('ENQUIRY_CLOSED_DATA');
    
    if (!approvedSheet) {
      return { success: false, error: 'PENDING_APPROVED sheet not found' };
    }
    
    // Create ENQUIRY_CLOSED_DATA sheet if it doesn't exist
    if (!closedSheet) {
      closedSheet = ss.insertSheet('ENQUIRY_CLOSED_DATA');
      
      const headers = approvedSheet.getRange(1, 1, 1, approvedSheet.getLastColumn()).getValues()[0];
      headers.push('Cancellation Reason', 'Cancelled Date', 'Cancelled Time');
      
      closedSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      closedSheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#f44336')
        .setFontColor('#ffffff');
      
      closedSheet.setFrozenRows(1);
    }
    
    // Find the enquiry in PENDING_APPROVED
    const data = approvedSheet.getDataRange().getValues();
    const searchRtwe = String(rtweNo).trim().toUpperCase().replace(/[-\s]/g, '');
    
    let foundRow = -1;
    let rowData = null;
    
    for (let i = 1; i < data.length; i++) {
      const sheetRtwe = String(data[i][0] || '').trim().toUpperCase().replace(/[-\s]/g, '');
      if (sheetRtwe === searchRtwe) {
        foundRow = i + 1;
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
    closedSheet.appendRow(rowData);
    
    // Delete from PENDING_APPROVED
    approvedSheet.deleteRow(foundRow);
    
    Logger.log('✅ Approved enquiry cancelled: ' + rtweNo);
    
    return { 
      success: true, 
      message: 'Approved enquiry cancelled successfully',
      rtweNo: rtweNo
    };
    
  } catch (error) {
    Logger.log('❌ cancelApprovedEnquiry error: ' + error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Serve pending approved page
 */
function servePendingApproved(sessionId) {
  const session = getSessionData(sessionId);
  
  if (!session) {
    return serveLogin('Session expired. Please login again.');
  }
  
  const template = HtmlService.createTemplateFromFile('PendingApproved');
  template.sessionId = sessionId;
  template.userName = session.name || session.userName || 'User';
  
  return template.evaluate()
    .setTitle('Pending Approved - RTWE')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

/**
 * TEST FUNCTION - Run this manually to verify
 */
function TEST_getPendingApprovedEnquiries() {
  Logger.clear();
  Logger.log('=== MANUAL TEST OF getPendingApprovedEnquiries ===\n');
  
  const result = getPendingApprovedEnquiries();
  
  Logger.log('\n=== TEST RESULTS ===');
  Logger.log('Return value: ' + JSON.stringify(result));
  Logger.log('Type: ' + typeof result);
  Logger.log('Is Array: ' + Array.isArray(result));
  Logger.log('Length: ' + (result ? result.length : 'N/A'));
  Logger.log('=== TEST COMPLETE ===');
  
  return result;
}
