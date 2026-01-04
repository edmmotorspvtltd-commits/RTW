// ============================================
// ACTIVITYLOG
// Auto-organized from original code
// ============================================

function logUserActivity(username, action, details) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = ss.getSheetByName('USER_ACTIVITY_LOG');
    
    if (!logSheet) {
      logSheet = ss.insertSheet('USER_ACTIVITY_LOG');
      logSheet.setTabColor('#000000');
      
      logSheet.getRange('A1:F1').setValues([
        ['Date', 'Time', 'Username', 'Name', 'Action', 'Details']
      ]).setBackground('#000000')
        .setFontColor('white')
        .setFontWeight('bold');
      
      logSheet.setFrozenRows(1);
    }
    
    const user = USERS_CONFIG.users[username];
    const userName = user ? user.name : username;
    
    const logEntry = [
      new Date(),
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'HH:mm:ss'),
      username,
      userName,
      action,
      details
    ];
    
    logSheet.appendRow(logEntry);
    
  } catch (error) {
    Logger.log('Activity log error: ' + error);
  }
}

// ============================================
// INITIAL SETUP (Enhanced)
// ============================================

function viewActivityLog() {
  if (!refreshSession()) return;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const logSheet = ss.getSheetByName('USER_ACTIVITY_LOG');
  if (logSheet) SpreadsheetApp.setActiveSheet(logSheet);
}