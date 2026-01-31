// ============================================
// EXTERNAL SHEET UPDATE FUNCTIONS
// PDF and Broker functions are in PdfShare.gs
// This file only contains sheet writing utilities
// ============================================

/**
 * Write broker submission to BROKER_SUBMISSIONS sheet
 * This is the ONLY unique function in this file
 * All other broker functions are in PdfShare.gs
 */
function writeBrokerDataToSheet(rtweNo, brokerData, submissionCount) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('BROKER_SUBMISSIONS');
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet('BROKER_SUBMISSIONS');
      
      // Add headers
      const headers = [
        'RTWE No', 
        'Selvedge Name', 
        'Selvedge Notes', 
        'Submitted At',
        'Submission Count',
        'Status'
      ];
      
      sheet.getRange(1, 1, 1, headers.length)
        .setValues([headers])
        .setFontWeight('bold')
        .setBackground('#8b7355')
        .setFontColor('#ffffff');
      
      sheet.setFrozenRows(1);
      sheet.setColumnWidth(1, 120);
      sheet.setColumnWidth(2, 200);
      sheet.setColumnWidth(3, 300);
      sheet.setColumnWidth(4, 180);
      sheet.setColumnWidth(5, 140);
      sheet.setColumnWidth(6, 100);
    }
    
    // Check if RTWE already has a submission
    const data = sheet.getDataRange().getValues();
    let existingRow = -1;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === rtweNo) {
        existingRow = i + 1;
        break;
      }
    }
    
    const timestamp = new Date(brokerData.submittedAt || new Date());
    const formattedTime = Utilities.formatDate(
      timestamp, 
      Session.getScriptTimeZone(), 
      'dd-MMM-yyyy HH:mm:ss'
    );
    
    const rowData = [
      rtweNo,
      brokerData.selvedgeName || '',
      brokerData.selvedgeNotes || '',
      formattedTime,
      submissionCount,
      'Received'
    ];
    
    if (existingRow > 0) {
      // Update existing row
      sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
      sheet.getRange(existingRow, 1, 1, rowData.length).setBackground('#fff8f0');
      Logger.log('✅ Updated existing broker submission row for ' + rtweNo);
    } else {
      // Add new row
      sheet.appendRow(rowData);
      const lastRow = sheet.getLastRow();
      sheet.getRange(lastRow, 1, 1, rowData.length).setBackground('#f5f5f5');
      Logger.log('✅ Added new broker submission row for ' + rtweNo);
    }
    
    return { success: true };
    
  } catch (error) {
    Logger.log('❌ writeBrokerDataToSheet error: ' + error);
    return { success: false, error: error.toString() };
  }
}

// ============================================
// NOTE: All other broker/PDF functions removed
// They are now ONLY in PdfShare.gs:
// - generateBrokerToken()
// - sharePDFfromHTML()
// - sendBrokerEmail()
// - validateBrokerToken()
// - saveBrokerSubmission()
// - getEnquiryForBroker()
// - generateEnquiryPDF()
// ============================================