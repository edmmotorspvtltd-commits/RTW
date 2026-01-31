// ============================================
// AUTOGENERATION
// Auto-organized from original code
// ============================================

function generateRTWENumber() {
  const lock = LockService.getScriptLock();
  const success = lock.tryLock(5000);
  if (!success) {
    throw new Error('RTWE generation lock failed. Try again.');
  }
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let maxNumber = 0;
    
    [CONFIG.SHEETS.PENDING, CONFIG.SHEETS.PENDING_APPROVED, 
     CONFIG.SHEETS.CONFIRMED, CONFIG.SHEETS.CLOSED].forEach(sheetName => {
      const sheet = ss.getSheetByName(sheetName);
      const lastRow = sheet.getLastRow();
      
      if (lastRow > 1) {
        const rtweNumbers = sheet.getRange(2, 1, lastRow - 1, 1).getValues()
          .flat()
          .filter(val => val && val.toString().startsWith('RTWE'))
          .map(val => {
            const match = val.toString().match(/RTWE(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
          });
        
        if (rtweNumbers.length > 0) {
          maxNumber = Math.max(maxNumber, ...rtweNumbers);
        }
      }
    });
    
    return 'RTWE' + String(maxNumber + 1).padStart(2, '0');
  } finally {
    lock.releaseLock();
  }
}