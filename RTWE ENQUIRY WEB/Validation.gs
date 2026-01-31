// ============================================
// VALIDATION
// Auto-organized from original code
// ============================================

function validateRequiredFieldsFixed() {
  const formSheet =
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.FORM);

  const status = formSheet.getRange(CONFIG.CELLS.ORDER_STATUS).getValue();
  const entryType = formSheet.getRange(CONFIG.CELLS.ENTRY_TYPE).getValue();

  const required = [
    { cell: CONFIG.CELLS.RTWE_NO,      name: 'RTWE Number' },
    { cell: CONFIG.CELLS.ENQ_DATE,     name: 'Enquiry Date' },
    { cell: CONFIG.CELLS.BROKER,       name: 'Broker Name' },
    { cell: CONFIG.CELLS.QUALITY,      name: 'Quality' },
    { cell: CONFIG.CELLS.GIVEN_RATE,   name: 'Given Rate' },
    { cell: CONFIG.CELLS.ORDER_STATUS, name: 'Order Status' }
  ];

  // Sirf tab order details mandatory:
  // 1) Entry Type = PENDING APPROVED  (approval ke time)
  // 2) Entry Type = EDIT ENQUIRY      (jab Approved karke CONFIRMED me bhejna hai)
  const needsOrderDetails =
    status === 'Approved' &&
    (entryType === 'PENDING APPROVED' || entryType === 'EDIT ENQUIRY');

  if (needsOrderDetails) {
    required.push(
      { cell: CONFIG.CELLS.FINAL_RATE, name: 'Final Rate' },
      { cell: CONFIG.CELLS.BUYER,      name: 'Buyer' },
      { cell: CONFIG.CELLS.PO_NO,      name: 'P/O Number' }
    );
  }

  const missing = [];
  required.forEach(field => {
    const value = formSheet.getRange(field.cell).getValue();
    if (!value || value === '') {
      missing.push(field.name);
    }
  });

  if (missing.length > 0) {
    SpreadsheetApp.getUi().alert(
      '⚠️ Required Fields Missing',
      'Please fill:\n\n• ' + missing.join('\n• '),
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return false;
  }

  return true;
}


function checkDuplicateRTWE(rtweNo) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = [
    CONFIG.SHEETS.PENDING,
    CONFIG.SHEETS.PENDING_APPROVED,
    CONFIG.SHEETS.CONFIRMED,
    CONFIG.SHEETS.CLOSED
  ];
  
  for (let sheetName of sheets) {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) continue;
    
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) continue;
    
    const rtweNumbers = sheet.getRange(2, 1, lastRow - 1, 1)
      .getValues()
      .flat()
      .filter(val => val !== '');
    
    if (rtweNumbers.includes(rtweNo)) {
      return {
        isDuplicate: true,
        foundIn: sheetName,
        message: '⚠️ Duplicate RTWE Number!\n\nRTWE ' + rtweNo + ' already exists in ' + sheetName + '.'
      };
    }
  }
  
  return { isDuplicate: false };
}

function checkDuplicatePO(poNo) {
  if (!poNo || poNo === '') return { isDuplicate: false };
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.SHEETS.CONFIRMED);
  
  if (!sheet) return { isDuplicate: false };
  
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return { isDuplicate: false };
  
  const poNumbers = sheet.getRange(2, 13, lastRow - 1, 1)
    .getValues()
    .flat()
    .filter(val => val !== '');
  
  if (poNumbers.includes(poNo)) {
    return {
      isDuplicate: true,
      message: '⚠️ Duplicate PO Number!\n\nP/O Number ' + poNo + ' already exists.'
    };
  }
  
  return { isDuplicate: false };
}