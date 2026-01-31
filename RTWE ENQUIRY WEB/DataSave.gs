// ============================================
// DATAFETCH
// Auto-organized from original code
// ============================================

function loadPendingApprovedEnquiry() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const formSheet = ss.getSheetByName(CONFIG.SHEETS.FORM);
  const pendingApprovedSheet = ss.getSheetByName(CONFIG.SHEETS.PENDING_APPROVED);
  
  const selectedRTWE = formSheet.getRange(CONFIG.CELLS.SELECT_PENDING_APPROVED).getValue();
  if (!selectedRTWE) return;
  
  const data = pendingApprovedSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === selectedRTWE) {
      formSheet.getRange(CONFIG.CELLS.RTWE_NO).setValue(data[i][0]);
      formSheet.getRange(CONFIG.CELLS.COSTING_NO).setValue(data[i][1]);
      formSheet.getRange(CONFIG.CELLS.ENQ_DATE).setValue(data[i][2]);
      formSheet.getRange(CONFIG.CELLS.ENQ_TIME).setValue(data[i][3]);
      formSheet.getRange(CONFIG.CELLS.BROKER).setValue(data[i][4]);
      formSheet.getRange(CONFIG.CELLS.QUALITY).setValue(data[i][5]);
      formSheet.getRange(CONFIG.CELLS.GIVEN_RATE).setValue(data[i][6]);
      formSheet.getRange(CONFIG.CELLS.ORDER_STATUS).setValue('Approved');
      
      formSheet.showRows(7, 9);
      formSheet.showRows(17, 30);
      
      formSheet.getRange(CONFIG.CELLS.APPROVED_DATE).setValue(new Date());
      formSheet.getRange(CONFIG.CELLS.QUALITY_ORDER).setValue(data[i][5]);
      
      SpreadsheetApp.getActiveSpreadsheet().toast(
        'Enquiry loaded! Fill order details and submit.',
        '✅ Ready',
        3
      );
      
      break;
    }
  }
}