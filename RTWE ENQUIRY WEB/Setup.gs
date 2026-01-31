// ============================================
// SETUP.GS - CLEANED VERSION
// Removed: ENQUIRY_FORM, DASHBOARD, SEARCH_DASHBOARD setup
// Keeping: Data sheets, Master data, Notifications setup
// ============================================

function createAllSheetsUpdated() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Only create data storage sheets and master data
  const sheets = [
    [CONFIG.SHEETS.PENDING, '#FFC107'],
    [CONFIG.SHEETS.PENDING_APPROVED, '#FFE599'],
    [CONFIG.SHEETS.CONFIRMED, '#28A745'],
    [CONFIG.SHEETS.CLOSED, '#DC3545'],
    [CONFIG.SHEETS.MASTER, '#9C27B0'],
    [CONFIG.SHEETS.REPORTS, '#9E9E9E'],
    [CONFIG.SHEETS.SETTINGS, '#212121'],
    [CONFIG.SHEETS.PERFORMANCE, '#E91E63']
  ];
  
  sheets.forEach(([name, color]) => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    sheet.setTabColor(color);
  });
  
  Logger.log('✅ Data sheets created (Form, Dashboard, Search sheets excluded)');
}

function setupMasterDataUpdated() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(CONFIG.SHEETS.MASTER);
  
  masterSheet.clear();
  
  masterSheet.getRange('A1:I1').setValues([[
    'Broker Name', 'Quality', 'Selvedge Ends', 'Financial Year', 'Month',
    'Buyer', 'Design No', 'TAGA Values', 'Yarn Type'
  ]])
  .setBackground('#4A90E2')
  .setFontColor('white')
  .setFontWeight('bold');
  
  const brokers = [
    'Mr. Madan Damani',
    'Mr. Devkisan sarda',
    'Mr. Kewal',
    'Broker D',
    'Broker E'
  ];
  masterSheet.getRange(2, 1, brokers.length, 1).setValues(brokers.map(b => [b]));
  
  const qualities = [
    '63"/52*48/21ZAYKA*21 ZAYKA',
    '69RS/108*76/40C*40TENCEL',
    '66RS/144*72/80DULL*40CO',
    '66RS/144*72/80DULL*40PC',
    '67RS/160*82/50*50',
    '70RS/52*52/21SLB*21SLB'
  ];
  masterSheet.getRange(2, 2, qualities.length, 1).setValues(qualities.map(q => [q]));
  
  const selvedgeEnds = [48, 72, 96];
  masterSheet.getRange(2, 3, selvedgeEnds.length, 1).setValues(selvedgeEnds.map(s => [s]));
  
  const years = ['2023-24', '2024-25', '2025-26'];
  masterSheet.getRange(2, 4, years.length, 1).setValues(years.map(y => [y]));
  
  const months = ['April', 'May', 'June', 'July', 'August', 'September', 
                  'October', 'November', 'December', 'January', 'February', 'March'];
  masterSheet.getRange(2, 5, months.length, 1).setValues(months.map(m => [m]));
  
  const buyers = ['RTW', 'Other'];
  masterSheet.getRange(2, 6, buyers.length, 1).setValues(buyers.map(b => [b]));
  
  const yarnTypes = ['Bright', 'PSF'];
  masterSheet.getRange(2, 9, yarnTypes.length, 1).setValues(yarnTypes.map(y => [y]));
  
  masterSheet.autoResizeColumns(1, 9);
  
  Logger.log('✅ Master data setup complete');
}

function setupStorageHeadersUpdated() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const pendingHeaders = [
    'RTWE No', 'Costing Sheet No', 'Enquiry Date', 'Enquiry Time',
    'Broker Name', 'Quality', 'Given Rate', 'Order Status',
    'Created Date', 'Created Time', 'Created By', 'User ID'
  ];
  
  const setupHeaderOnly = (sheetName, headers, bgColor, fontColor) => {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      Logger.log('⚠️ Sheet not found: ' + sheetName);
      return;
    }
    
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      sheet.clear();
    }
    
    sheet.getRange(1, 1, 1, headers.length)
      .setValues([headers])
      .setBackground(bgColor)
      .setFontColor(fontColor || 'black')
      .setFontWeight('bold');
    sheet.setFrozenRows(1);
  };
  
  setupHeaderOnly(CONFIG.SHEETS.PENDING, pendingHeaders, '#FFC107');
  setupHeaderOnly(CONFIG.SHEETS.PENDING_APPROVED, pendingHeaders, '#FFE599');
  setupHeaderOnly(CONFIG.SHEETS.CLOSED, pendingHeaders, '#DC3545', 'white');
  
  const confirmedHeaders = [
    'RTWE No', 'Costing Sheet No', 'Enquiry Date', 'Enquiry Time',
    'Broker Name', 'Quality', 'Given Rate', 'Order Status',
    'Approved Date', 'Approved Time', 'Final Rate', 'Buyer',
    'P/O No', 'S/O No', 'Quality Order',
    'Design1', 'TAGA1', 'Design2', 'TAGA2', 'Design3', 'TAGA3',
    'Design4', 'TAGA4', 'Design5', 'TAGA5', 'Design6', 'TAGA6',
    'Total Order Taga', 'Count Meter', 'Total MTR',
    'Total Order Value',
    'Name of Selvedge', 'Ends of Selvedge', 'Color of Selvedge',
    'Yarn to be Used', 'Sizing Beam Meter', 'Payment Terms',
    'Delivery Date', 'Remark',
    'Created Date', 'Created Time', 'Created By', 'User ID',
    'QR Code'
  ];
  
  const confirmedSheet = ss.getSheetByName(CONFIG.SHEETS.CONFIRMED);
  if (!confirmedSheet) {
    Logger.log('⚠️ ORDER_CONFIRM_DATA sheet not found');
    return;
  }
  
  const lastRowConf = confirmedSheet.getLastRow();
  if (lastRowConf <= 1) {
    confirmedSheet.clear();
  }
  confirmedSheet.getRange(1, 1, 1, confirmedHeaders.length)
    .setValues([confirmedHeaders])
    .setBackground('#28A745')
    .setFontColor('white')
    .setFontWeight('bold');
  confirmedSheet.setFrozenRows(1);
  
  Logger.log('✅ Storage headers setup complete');
}

// ❌ REMOVED: formatEnquiryFormUpdated() - No longer using sheet-based form
// ❌ REMOVED: setupFormValidationsUpdated() - No longer using sheet-based form
// ❌ REMOVED: applyCalculatedFieldFormulas() - No longer using sheet-based form
// ❌ REMOVED: protectCalculatedFields() - No longer using sheet-based form
// ❌ REMOVED: setupAutoTimeFormulas() - No longer using sheet-based form

function applySheetColors() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const colors = {
    [CONFIG.SHEETS.PENDING]: '#FFC107',
    [CONFIG.SHEETS.PENDING_APPROVED]: '#FFE599',
    [CONFIG.SHEETS.CONFIRMED]: '#28A745',
    [CONFIG.SHEETS.CLOSED]: '#DC3545',
    [CONFIG.SHEETS.MASTER]: '#9C27B0',
    [CONFIG.SHEETS.REPORTS]: '#9E9E9E',
    [CONFIG.SHEETS.SETTINGS]: '#212121',
    [CONFIG.SHEETS.PERFORMANCE]: '#E91E63'
  };
  
  Object.keys(colors).forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      sheet.setTabColor(colors[sheetName]);
    }
  });
  
  Logger.log('✅ Sheet colors applied');
}

// ============================================
// NOTIFICATION SYSTEM SETUP
// ============================================

function setupWhatsAppRecipients() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let recipSheet = ss.getSheetByName('WHATSAPP_RECIPIENTS');
  
  if (!recipSheet) {
    recipSheet = ss.insertSheet('WHATSAPP_RECIPIENTS');
    recipSheet.setTabColor('#25D366');
  }
  
  recipSheet.clear();
  recipSheet.getRange('A1:C1').setValues([
    ['Phone Number', 'Name', 'Status']
  ]).setBackground('#25D366').setFontColor('white').setFontWeight('bold');
  
  recipSheet.appendRow([CONFIG.USERS.OWNER_WHATSAPP, 'Shekhar', 'Active']);
  recipSheet.appendRow([CONFIG.USERS.SECONDARY_WHATSAPP, 'Navin', 'Active']);
  
  recipSheet.setFrozenRows(1);
  recipSheet.setColumnWidths(1, 3, 150);
  
  Logger.log('✅ WhatsApp recipients setup');
}

function setupNotificationSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const sheets = [
    {
      name: 'WHATSAPP_REPLIES',
      headers: ['Timestamp', 'Phone', 'Reply', 'Status'],
      color: '#25D366'
    },
    {
      name: 'VOICE_CALL_LOG',
      headers: ['Timestamp', 'Phone', 'Message', 'Status', 'Reason', 'Duration'],
      color: '#FF6B6B'
    },
    {
      name: 'EMAIL_REPORT_HISTORY',
      headers: ['Timestamp', 'Type', 'Recipients', 'Subject', 'Status', 'Error'],
      color: '#4285F4'
    },
    {
      name: 'MESSAGE_TRACKING',
      headers: ['Timestamp', 'Phone', 'Message SID', 'RTWE No', 'Status', 'Call Made', 'Reply Received'],
      color: '#FFA500'
    },
    {
      name: 'TELEGRAM_USERS',
      headers: ['Chat ID', 'Name', 'Username', 'Status', 'Added Date'],
      color: '#0088CC'
    }
  ];
  
  sheets.forEach(sheetConfig => {
    let sheet = ss.getSheetByName(sheetConfig.name);
    
    if (!sheet) {
      sheet = ss.insertSheet(sheetConfig.name);
      sheet.setTabColor(sheetConfig.color);
      
      sheet.getRange(1, 1, 1, sheetConfig.headers.length)
        .setValues([sheetConfig.headers])
        .setBackground(sheetConfig.color)
        .setFontColor('white')
        .setFontWeight('bold');
      
      sheet.setFrozenRows(1);
      sheet.setColumnWidths(1, sheetConfig.headers.length, 150);
    }
  });
  
  Logger.log('✅ Notification sheets setup');
}

function setupPerformanceDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let perfSheet = ss.getSheetByName(CONFIG.SHEETS.PERFORMANCE);
  
  if (!perfSheet) {
    perfSheet = ss.insertSheet(CONFIG.SHEETS.PERFORMANCE);
  }
  
  perfSheet.clear();
  perfSheet.setTabColor('#E91E63');
  
  perfSheet.getRange('A1:J1').merge()
    .setValue('📊 PERFORMANCE ANALYTICS DASHBOARD')
    .setBackground('#E91E63')
    .setFontColor('white')
    .setFontSize(14)
    .setFontWeight('bold')
    .setHorizontalAlignment('center');
  perfSheet.setRowHeight(1, 50);
  
  perfSheet.getRange('A3').setValue('BROKER SCORECARD')
    .setFontWeight('bold')
    .setBackground('#FCE4EC');
  
  perfSheet.getRange('A4:H4').setValues([[
    'Broker Name', 'Total Enquiries', 'Confirmed', 'Conversion %',
    'Total Value', 'Avg Order Size', 'Rating', 'Trend'
  ]]).setFontWeight('bold').setBackground('#F8BBD0');
  
  perfSheet.getRange('A20').setValue('QUALITY PERFORMANCE')
    .setFontWeight('bold')
    .setBackground('#E1BEE7');
  
  perfSheet.getRange('A21:G21').setValues([[
    'Quality', 'Times Ordered', 'Total MTR', 'Total Value',
    'Avg Rate', 'Market Share %', 'Trend'
  ]]).setFontWeight('bold').setBackground('#CE93D8');
  
  perfSheet.getRange('A37').setValue('MONTHLY TRENDS')
    .setFontWeight('bold')
    .setBackground('#C5E1A5');
  
  perfSheet.getRange('A38:E38').setValues([[
    'Month', 'Orders', 'Total MTR', 'Total Value', 'Growth %'
  ]]).setFontWeight('bold').setBackground('#AED581');
  
  Logger.log('✅ Performance dashboard setup');
}

// ❌ REMOVED: setupDashboardSimple() - Using HTML dashboard instead
// ❌ REMOVED: refreshDashboardSimple() - Using HTML dashboard instead
// ❌ REMOVED: setupAdvancedSearchDashboard() - Using HTML search instead

// ============================================
// HELPER FUNCTIONS - REMOVED DUPLICATES
// getSheetData(), asDate(), stripTime() are already defined in Utillities.gs
// ============================================

// ============================================
// COMPLETE SYSTEM SETUP - REMOVED DUPLICATE
// completeSystemSetup() is already defined in Utillities.gs
// ============================================

function checkSystemStatus() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  const requiredSheets = [
    CONFIG.SHEETS.PENDING,
    CONFIG.SHEETS.PENDING_APPROVED,
    CONFIG.SHEETS.CONFIRMED,
    CONFIG.SHEETS.CLOSED,
    CONFIG.SHEETS.MASTER,
    'USER_MANAGEMENT',
    'USER_ACTIVITY_LOG'
  ];
  
  let status = '📊 SYSTEM STATUS CHECK\n\n';
  let allGood = true;
  
  requiredSheets.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      status += '✅ ' + sheetName + '\n';
    } else {
      status += '❌ ' + sheetName + ' - MISSING!\n';
      allGood = false;
    }
  });
  
  status += '\n📝 HTML DIALOGS:\n';
  status += '✅ Enquiry-Form.html (in Apps Script)\n';
  status += '✅ KPI-Dashboard-Complete.html (in Apps Script)\n';
  status += '✅ Search-Dashboard-Complete.html (in Apps Script)\n';
  status += '✅ Settings.html (in Apps Script)\n';
  
  if (allGood) {
    status += '\n✅ All required sheets exist!';
  } else {
    status += '\n⚠️ Some sheets are missing. Run "Complete Setup" to fix.';
  }
  
  ui.alert('System Status', status, ui.ButtonSet.OK);
}

function quickSystemRepair() {
  const ui = SpreadsheetApp.getUi();
  
  const response = ui.alert(
    '🔧 Quick System Repair',
    'This will:\n\n' +
    '✅ Check and create missing sheets\n' +
    '✅ Reset master data\n' +
    '✅ Fix sheet colors\n\n' +
    'Continue?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) {
    return;
  }
  
  try {
    createAllSheetsUpdated();
    setupMasterDataUpdated();
    setupStorageHeadersUpdated();
    applySheetColors();
    
    ui.alert('✅ Repair Complete!', 'System repaired successfully!', ui.ButtonSet.OK);
    
  } catch (error) {
    ui.alert('❌ Repair Error', 'Error: ' + error.message, ui.ButtonSet.OK);
  }
}

function resetSystem() {
  const ui = SpreadsheetApp.getUi();
  
  const response = ui.alert(
    '⚠️ RESET SYSTEM',
    'WARNING: This will DELETE all data!\n\n' +
    'This will:\n' +
    '❌ Clear all enquiry data\n' +
    '❌ Clear all confirmed orders\n' +
    '❌ Reset master data\n' +
    '✅ Keep user accounts\n\n' +
    'Are you ABSOLUTELY SURE?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) {
    ui.alert('Reset canceled.');
    return;
  }
  
  const confirm = ui.alert(
    '⚠️ FINAL WARNING',
    'This action CANNOT be undone!\n\n' +
    'Type YES in the next prompt to confirm.',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (confirm !== ui.Button.OK) {
    ui.alert('Reset canceled.');
    return;
  }
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Clear data sheets (keep headers)
    [CONFIG.SHEETS.PENDING, CONFIG.SHEETS.PENDING_APPROVED, 
     CONFIG.SHEETS.CONFIRMED, CONFIG.SHEETS.CLOSED].forEach(sheetName => {
      const sheet = ss.getSheetByName(sheetName);
      if (sheet && sheet.getLastRow() > 1) {
        sheet.deleteRows(2, sheet.getLastRow() - 1);
      }
    });
    
    // Reset master data
    setupMasterDataUpdated();
    
    ui.alert('✅ System Reset Complete!', 'All data has been cleared.', ui.ButtonSet.OK);
    
  } catch (error) {
    ui.alert('❌ Reset Error', 'Error: ' + error.message, ui.ButtonSet.OK);
  }
}