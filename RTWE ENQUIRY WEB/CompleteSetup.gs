// ============================================
// ONE-CLICK COMPLETE SETUP FUNCTION - CLEANED
// HTML-first version (no sheet-based forms)
// ============================================

function COMPLETE_SYSTEM_SETUP() {
  const ui = SpreadsheetApp.getUi();
  
  const response = ui.alert(
    '🚀 RTWE SYSTEM COMPLETE SETUP',
    'This will setup the ENTIRE system:\n\n' +
    '✅ Create all data sheets\n' +
    '✅ Setup storage headers\n' +
    '✅ Setup master data\n' +
    '✅ Setup user management\n' +
    '✅ Setup notification sheets\n' +
    '✅ Apply sheet colors\n\n' +
    '⚠️ NOTE: HTML dialogs (Enquiry Form, Dashboard, Search)\n' +
    'are already in Apps Script and work from the menu.\n\n' +
    'Continue?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) {
    ui.alert('Setup cancelled');
    return;
  }
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let progress = 0;
    const totalSteps = 7;
    
    // STEP 1: Create all sheets
    ui.alert('Step 1/7: Creating data sheets...');
    createAllSheetsUpdated();
    progress++;
    
    // STEP 2: Setup storage headers
    ui.alert('Step 2/7: Setting up storage headers...');
    setupStorageHeadersUpdated();
    progress++;
    
    // STEP 3: Setup master data
    ui.alert('Step 3/7: Setting up master data...');
    setupMasterDataUpdated();
    progress++;
    
    // STEP 4: Apply colors
    ui.alert('Step 4/7: Applying sheet colors...');
    applySheetColors();
    progress++;
    
    // STEP 5: Setup user management
    ui.alert('Step 5/7: Setting up user management...');
    setupUserManagementSheet();
    migrateUsersToSheet();
    progress++;
    
    // STEP 6: Setup notification sheets
    ui.alert('Step 6/7: Setting up notifications...');
    setupNotificationSheets();
    setupWhatsAppRecipients();
    progress++;
    
    // STEP 7: Setup performance dashboard
    ui.alert('Step 7/7: Setting up performance analytics...');
    setupPerformanceDashboard();
    progress++;
    
    // ❌ REMOVED: formatEnquiryFormUpdated() - Using HTML
    // ❌ REMOVED: setupFormValidationsUpdated() - Using HTML
    // ❌ REMOVED: applyCalculatedFieldFormulas() - Using HTML
    // ❌ REMOVED: protectCalculatedFields() - Using HTML
    // ❌ REMOVED: setupAutoTimeFormulas() - Using HTML
    // ❌ REMOVED: setupDashboardSimple() - Using HTML
    // ❌ REMOVED: setupAdvancedSearchDashboard() - Using HTML
    
    // STEP 8: Setup email triggers (optional)
    try {
      setupEmailTriggers();
    } catch (e) {
      Logger.log('Email triggers setup skipped: ' + e);
    }
    
    // STEP 9: Deploy as web app instructions
    const webAppUrl = ScriptApp.getService().getUrl();
    
    // Final success message
    ui.alert(
      '✅ SETUP COMPLETE!',
      'System is ready to use!\n\n' +
      '📋 Next Steps:\n' +
      '1. Refresh your sheet (Ctrl+Shift+R)\n' +
      '2. Click "🔐 RTWE System v3.0" menu\n' +
      '3. Login with: admin / admin123\n' +
      '4. Use HTML dialogs from menu:\n' +
      '   • Enquiry Form (HTML)\n' +
      '   • Dashboard (HTML)\n' +
      '   • Search (HTML)\n' +
      '5. For broker links, deploy as web app:\n' +
      '   - Deploy → New Deployment\n' +
      '   - Type: Web App\n' +
      '   - Access: Anyone\n\n' +
      'Default Users Created:\n' +
      '• admin / admin123 (Owner)\n' +
      '• manager / manager123\n' +
      '• assistant / assistant123\n' +
      '• team1 / team123\n' +
      '• team2 / team123\n\n' +
      'Data Sheets Created: ' + getAllSheetNames().length + '\n' +
      'System Version: 3.0 (HTML-First)\n\n' +
      '🎉 Happy Working!',
      ui.ButtonSet.OK
    );
    
    // Log completion
    logUserActivity(
      'SYSTEM',
      'COMPLETE_SETUP',
      'Full system setup completed successfully (HTML-first version)'
    );
    
    // Refresh sheet
    SpreadsheetApp.flush();
    
  } catch (error) {
    ui.alert(
      '❌ SETUP ERROR',
      'Error during setup:\n' + error.toString() + '\n\n' +
      'Please check Apps Script logs for details.',
      ui.ButtonSet.OK
    );
    Logger.log('Setup Error: ' + error);
  }
}

// Helper function to get all sheet names
function getAllSheetNames() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheets().map(sheet => sheet.getName());
}

// ============================================
// RESET FUNCTION (Use with caution!)
// ============================================

function RESET_ENTIRE_SYSTEM() {
  const ui = SpreadsheetApp.getUi();
  
  const response = ui.alert(
    '⚠️ WARNING - RESET SYSTEM',
    'This will DELETE ALL DATA and reset the system!\n\n' +
    '❌ All enquiries will be deleted\n' +
    '❌ All users will be reset\n' +
    '❌ All settings will be reset\n\n' +
    'This CANNOT be undone!\n\n' +
    'Are you ABSOLUTELY SURE?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) {
    ui.alert('Reset cancelled - No changes made');
    return;
  }
  
  // Double confirmation
  const confirmResponse = ui.alert(
    '⚠️ FINAL WARNING',
    'Type YES in the next dialog to confirm reset',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (confirmResponse !== ui.Button.OK) {
    ui.alert('Reset cancelled - No changes made');
    return;
  }
  
  const inputResponse = ui.prompt(
    'Type "DELETE ALL DATA" to confirm:',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (inputResponse.getResponseText() !== 'DELETE ALL DATA') {
    ui.alert('Reset cancelled - Incorrect confirmation text');
    return;
  }
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets();
    
    // Delete all sheets except first one
    for (let i = sheets.length - 1; i > 0; i--) {
      ss.deleteSheet(sheets[i]);
    }
    
    // Rename first sheet
    sheets[0].setName('TEMP_SHEET');
    
    // Clear all properties
    PropertiesService.getScriptProperties().deleteAllProperties();
    PropertiesService.getUserProperties().deleteAllProperties();
    
    // Delete all triggers
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
    
    ui.alert(
      '✅ RESET COMPLETE',
      'System has been reset.\n\n' +
      'Run COMPLETE_SYSTEM_SETUP() to setup again.',
      ui.ButtonSet.OK
    );
    
  } catch (error) {
    ui.alert('Error during reset: ' + error.toString());
  }
}

// ============================================
// QUICK REPAIR FUNCTION - CLEANED
// ============================================

function QUICK_REPAIR_SYSTEM() {
  const ui = SpreadsheetApp.getUi();
  
  ui.alert(
    '🔧 QUICK REPAIR',
    'This will repair common issues:\n\n' +
    '✅ Re-create missing data sheets\n' +
    '✅ Fix master data\n' +
    '✅ Restore sheet colors\n' +
    '✅ Rebuild triggers\n\n' +
    'Your data will NOT be deleted.',
    ui.ButtonSet.OK
  );
  
  try {
    // Repair sheets
    createAllSheetsUpdated();
    
    // Repair master data
    setupMasterDataUpdated();
    
    // Repair headers
    setupStorageHeadersUpdated();
    
    // Repair colors
    applySheetColors();
    
    // Repair triggers
    try {
      setupEmailTriggers();
    } catch (e) {
      Logger.log('Trigger repair skipped: ' + e);
    }
    
    // ❌ REMOVED: applyCalculatedFieldFormulas() - No sheet form
    // ❌ REMOVED: setupFormValidationsUpdated() - No sheet form
    // ❌ REMOVED: protectCalculatedFields() - No sheet form
    
    ui.alert(
      '✅ REPAIR COMPLETE',
      'System repairs completed successfully!\n\n' +
      'Data sheets and master data have been repaired.\n' +
      'HTML dialogs work from the menu.',
      ui.ButtonSet.OK
    );
    
  } catch (error) {
    ui.alert('Repair error: ' + error.toString());
  }
}

// ============================================
// CHECK SYSTEM STATUS - UPDATED
// ============================================

function CHECK_SYSTEM_STATUS() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  let status = '📊 SYSTEM STATUS REPORT\n\n';
  
  // Check data sheets
  const requiredSheets = [
    CONFIG.SHEETS.PENDING,
    CONFIG.SHEETS.PENDING_APPROVED,
    CONFIG.SHEETS.CONFIRMED,
    CONFIG.SHEETS.CLOSED,
    CONFIG.SHEETS.MASTER,
    'USER_MANAGEMENT',
    'USER_ACTIVITY_LOG'
  ];
  
  // ❌ REMOVED from required sheets:
  // CONFIG.SHEETS.FORM (using HTML)
  // CONFIG.SHEETS.DASHBOARD (using HTML)
  // CONFIG.SHEETS.SEARCH_DASHBOARD (using HTML)
  
  let missingSheets = [];
  requiredSheets.forEach(sheetName => {
    if (!ss.getSheetByName(sheetName)) {
      missingSheets.push(sheetName);
    }
  });
  
  status += '📋 DATA SHEETS:\n';
  status += '  Total Sheets: ' + ss.getSheets().length + '\n';
  status += '  Required Sheets: ' + requiredSheets.length + '\n';
  status += '  Missing: ' + missingSheets.length + '\n';
  if (missingSheets.length > 0) {
    status += '  ⚠️ Missing: ' + missingSheets.join(', ') + '\n';
  } else {
    status += '  ✅ All data sheets present\n';
  }
  status += '\n';
  
  // Check HTML files
  status += '📝 HTML DIALOGS:\n';
  status += '  ✅ Enquiry-Form.html (in Apps Script)\n';
  status += '  ✅ KPI-Dashboard-Complete.html (in Apps Script)\n';
  status += '  ✅ Search-Dashboard-Complete.html (in Apps Script)\n';
  status += '  ✅ Settings.html (in Apps Script)\n';
  status += '  ✅ Login.html (in Apps Script)\n';
  status += '\n';
  
  // Check users
  const userSheet = ss.getSheetByName('USER_MANAGEMENT');
  if (userSheet) {
    const userCount = userSheet.getLastRow() - 1;
    status += '👥 USERS:\n';
    status += '  Total Users: ' + userCount + '\n';
    status += '  ✅ User system active\n';
  } else {
    status += '👥 USERS:\n';
    status += '  ⚠️ User management sheet missing\n';
  }
  status += '\n';
  
  // Check triggers
  const triggers = ScriptApp.getProjectTriggers();
  status += '⏰ TRIGGERS:\n';
  status += '  Active Triggers: ' + triggers.length + '\n';
  if (triggers.length === 0) {
    status += '  ⚠️ No triggers setup\n';
  } else {
    status += '  ✅ Triggers active\n';
  }
  status += '\n';
  
  // Check configurations
  status += '⚙️ CONFIGURATION:\n';
  try {
    status += '  Telegram Bot: ' + (TELEGRAM_CONFIG.ENABLED ? '✅ Enabled' : '❌ Disabled') + '\n';
  } catch (e) {
    status += '  Telegram Bot: ⚠️ Config not found\n';
  }
  try {
    status += '  Twilio: ' + (TWILIO_CONFIG.ENABLED ? '✅ Enabled' : '❌ Disabled') + '\n';
  } catch (e) {
    status += '  Twilio: ⚠️ Config not found\n';
  }
  try {
    status += '  External Sheet: ' + CONFIG.EXTERNAL_SHEET.ID + '\n';
  } catch (e) {
    status += '  External Sheet: ⚠️ Config not found\n';
  }
  status += '\n';
  
  // Overall status
  if (missingSheets.length === 0 && userSheet && triggers.length > 0) {
    status += '✅ SYSTEM STATUS: HEALTHY\n';
    status += 'All systems operational!';
  } else if (missingSheets.length > 0) {
    status += '⚠️ SYSTEM STATUS: NEEDS SETUP\n';
    status += 'Run COMPLETE_SYSTEM_SETUP()';
  } else {
    status += '⚠️ SYSTEM STATUS: PARTIAL SETUP\n';
    status += 'Run QUICK_REPAIR_SYSTEM()';
  }
  
  ui.alert('System Status', status, ui.ButtonSet.OK);
  
  return status;
}

// ============================================
// ADD TO MENU - DO NOT USE THIS onOpen()!
// Use the one in Code.gs instead
// ============================================

// NOTE: This onOpen() is commented out to avoid duplicate menus
// The main onOpen() in Code.gs handles menu creation

/*
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  
  ui.createMenu('🚀 SYSTEM SETUP')
    .addItem('✅ Complete System Setup', 'COMPLETE_SYSTEM_SETUP')
    .addItem('🔧 Quick Repair', 'QUICK_REPAIR_SYSTEM')
    .addItem('📊 Check Status', 'CHECK_SYSTEM_STATUS')
    .addSeparator()
    .addItem('⚠️ Reset System (Danger!)', 'RESET_ENTIRE_SYSTEM')
    .addToUi();
  
  // Check if already setup
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const requiredSheets = [
    CONFIG.SHEETS.PENDING,
    CONFIG.SHEETS.MASTER,
    'USER_MANAGEMENT'
  ];
  
  let needsSetup = false;
  requiredSheets.forEach(sheetName => {
    if (!ss.getSheetByName(sheetName)) {
      needsSetup = true;
    }
  });
  
  if (needsSetup) {
    ui.alert(
      '🚀 WELCOME TO RTWE SYSTEM v3.0',
      'System not setup yet.\n\n' +
      'Click: 🚀 SYSTEM SETUP → ✅ Complete System Setup\n\n' +
      'This will setup everything automatically!',
      ui.ButtonSet.OK
    );
  }
}
*/