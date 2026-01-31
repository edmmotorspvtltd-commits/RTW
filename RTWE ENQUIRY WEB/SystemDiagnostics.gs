// ============================================
// COMPLETE SYSTEM DIAGNOSTICS
// Run this to check EVERYTHING
// ============================================

function DIAGNOSE_COMPLETE_SYSTEM() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  ui.alert(
    '🔍 SYSTEM DIAGNOSTICS',
    'Starting complete system check...\n\n' +
    'This will check:\n' +
    '✓ All sheets and structure\n' +
    '✓ All configurations\n' +
    '✓ All functions\n' +
    '✓ All formulas\n' +
    '✓ All triggers\n' +
    '✓ All permissions\n' +
    '✓ All integrations\n\n' +
    'Please wait...',
    ui.ButtonSet.OK
  );
  
  const startTime = new Date();
  let report = [];
  let errorCount = 0;
  let warningCount = 0;
  let successCount = 0;
  
  // ============================================
  // 1. CHECK SHEETS
  // ============================================
  report.push('═══════════════════════════════════════════');
  report.push('📊 SHEET STRUCTURE CHECK');
  report.push('═══════════════════════════════════════════');
  
  const requiredSheets = {
    'ENQUIRY_FORM': 'Main entry form',
    'PENDING_DATA': 'Pending enquiries storage',
    'PENDING_APPROVED': 'Pending approved storage',
    'ORDER_CONFIRM_DATA': 'Confirmed orders storage',
    'ENQUIRY_CLOSED_DATA': 'Closed enquiries storage',
    'MASTER_DATA': 'All data combined',
    'DASHBOARD': 'Main dashboard',
    'SEARCH_DASHBOARD': 'Search interface',
    'PERFORMANCE_ANALYTICS': 'KPI metrics',
    'USER_MANAGEMENT': 'User database',
    'ACTIVITY_LOG': 'Activity tracking',
    'TELEGRAM_USERS': 'Telegram integration',
    'WHATSAPP_RECIPIENTS': 'WhatsApp contacts'
  };
  
  Object.keys(requiredSheets).forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      report.push('✅ ' + sheetName + ' - EXISTS');
      
      // Check if sheet has data
      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn();
      
      if (lastRow > 0 && lastCol > 0) {
        report.push('   ├─ Rows: ' + lastRow + ' | Columns: ' + lastCol);
        successCount++;
      } else {
        report.push('   ├─ ⚠️ EMPTY SHEET');
        warningCount++;
      }
    } else {
      report.push('❌ ' + sheetName + ' - MISSING!');
      report.push('   └─ Purpose: ' + requiredSheets[sheetName]);
      errorCount++;
    }
  });
  
  report.push('');
  
  // ============================================
  // 2. CHECK ENQUIRY FORM STRUCTURE
  // ============================================
  report.push('═══════════════════════════════════════════');
  report.push('📝 ENQUIRY FORM VALIDATION');
  report.push('═══════════════════════════════════════════');
  
  const formSheet = ss.getSheetByName('ENQUIRY_FORM');
  if (formSheet) {
    const requiredCells = {
      'B3': 'Entry Type',
      'B8': 'RTWE No',
      'B9': 'Costing No',
      'B10': 'Enquiry Date',
      'B11': 'Enquiry Time',
      'B12': 'Broker',
      'B13': 'Quality',
      'B14': 'Given Rate',
      'B15': 'Order Status',
      'B19': 'Approved Date',
      'B20': 'Approved Time',
      'B21': 'Final Rate',
      'B22': 'Buyer',
      'B23': 'P/O No',
      // B24 SO_NO removed
      'B25': 'Quality Order',
      'B32': 'Total Order Taga',
      'B33': 'Count Meter',
      'B34': 'Total MTR',
      'B35': 'Total Order Value',
      'B36': 'Selvedge Name',
      'B41': 'Payment Terms',
      'B42': 'Delivery Date',
      'B43': 'Remark'
    };
    
    Object.keys(requiredCells).forEach(cell => {
      try {
        const value = formSheet.getRange(cell).getValue();
        report.push('✅ Cell ' + cell + ' (' + requiredCells[cell] + ')');
        successCount++;
      } catch (e) {
        report.push('❌ Cell ' + cell + ' - ERROR: ' + e.message);
        errorCount++;
      }
    });
    
    // Check for SO_NO field (should NOT exist)
    const b24Value = formSheet.getRange('B24').getValue();
    if (b24Value && b24Value.toString().includes('SO')) {
      report.push('⚠️ WARNING: SO_NO field found at B24 (should be removed)');
      warningCount++;
    } else {
      report.push('✅ SO_NO field correctly removed from B24');
      successCount++;
    }
    
  } else {
    report.push('❌ ENQUIRY_FORM not found - Cannot check fields');
    errorCount++;
  }
  
  report.push('');
  
  // ============================================
  // 3. CHECK CONFIGURATIONS
  // ============================================
  report.push('═══════════════════════════════════════════');
  report.push('⚙️ CONFIGURATION CHECK');
  report.push('═══════════════════════════════════════════');
  
  try {
    // Check CONFIG object
    if (typeof CONFIG !== 'undefined') {
      report.push('✅ CONFIG object exists');
      
      // Check if SO_NO is removed
      if (CONFIG.CELLS.SO_NO) {
        report.push('❌ CONFIG.CELLS.SO_NO still exists (should be removed)');
        errorCount++;
      } else {
        report.push('✅ CONFIG.CELLS.SO_NO correctly removed');
        successCount++;
      }
      
      // Check external sheet config
      if (CONFIG.EXTERNAL_SHEET && CONFIG.EXTERNAL_SHEET.ID) {
        report.push('✅ External sheet configured: ' + CONFIG.EXTERNAL_SHEET.ID);
        successCount++;
      } else {
        report.push('⚠️ External sheet not configured');
        warningCount++;
      }
      
      // Check sheet names
      const sheetConfigs = ['FORM', 'PENDING', 'PENDING_APPROVED', 'CONFIRMED', 'CLOSED'];
      sheetConfigs.forEach(key => {
        if (CONFIG.SHEETS[key]) {
          report.push('✅ CONFIG.SHEETS.' + key + ' = ' + CONFIG.SHEETS[key]);
          successCount++;
        } else {
          report.push('❌ CONFIG.SHEETS.' + key + ' missing');
          errorCount++;
        }
      });
      
    } else {
      report.push('❌ CONFIG object not found');
      errorCount++;
    }
    
    // Check TELEGRAM_CONFIG
    if (typeof TELEGRAM_CONFIG !== 'undefined') {
      report.push('✅ TELEGRAM_CONFIG exists');
      report.push('   ├─ Enabled: ' + TELEGRAM_CONFIG.ENABLED);
      report.push('   └─ Bot Token: ' + (TELEGRAM_CONFIG.BOT_TOKEN ? 'Set' : 'Missing'));
      successCount++;
    } else {
      report.push('⚠️ TELEGRAM_CONFIG not found');
      warningCount++;
    }
    
    // Check EMAIL_CONFIG
    if (typeof EMAIL_CONFIG !== 'undefined') {
      report.push('✅ EMAIL_CONFIG exists');
      successCount++;
    } else {
      report.push('⚠️ EMAIL_CONFIG not found');
      warningCount++;
    }
    
    // Check USERS_CONFIG
    if (typeof USERS_CONFIG !== 'undefined') {
      report.push('✅ USERS_CONFIG exists');
      const userCount = Object.keys(USERS_CONFIG.users || {}).length;
      report.push('   └─ Default users: ' + userCount);
      successCount++;
    } else {
      report.push('❌ USERS_CONFIG not found');
      errorCount++;
    }
    
  } catch (e) {
    report.push('❌ Configuration check error: ' + e.message);
    errorCount++;
  }
  
  report.push('');
  
  // ============================================
  // 4. CHECK CRITICAL FUNCTIONS
  // ============================================
  report.push('═══════════════════════════════════════════');
  report.push('🔧 FUNCTION AVAILABILITY CHECK');
  report.push('═══════════════════════════════════════════');
  
  const criticalFunctions = [
    'loginUserSecure',
    'submitEnquirySecure',
    'generateRTWENumber',
    'validateRequiredFieldsFixed',
    'collectFormDataUpdated',
    'saveDataToSheetUpdated',
    'setupStorageHeadersUpdated',
    'formatEnquiryFormUpdated',
    'createAllSheetsUpdated',
    'sendTelegramNotification',
    'sendEmailNotification',
    'generateEnquiryPDF',
    'generateBrokerToken',
    'updateExternalSheet',
    'showPDFShareDialog',
    'COMPLETE_SYSTEM_SETUP'
  ];
  
  criticalFunctions.forEach(funcName => {
    try {
      if (typeof eval(funcName) === 'function') {
        report.push('✅ ' + funcName + '() - Available');
        successCount++;
      } else {
        report.push('❌ ' + funcName + '() - NOT A FUNCTION');
        errorCount++;
      }
    } catch (e) {
      report.push('❌ ' + funcName + '() - Missing or Error');
      errorCount++;
    }
  });
  
  report.push('');
  
  // ============================================
  // 5. CHECK DATA INTEGRITY
  // ============================================
  report.push('═══════════════════════════════════════════');
  report.push('💾 DATA INTEGRITY CHECK');
  report.push('═══════════════════════════════════════════');
  
  const dataSheets = ['PENDING_DATA', 'PENDING_APPROVED', 'ORDER_CONFIRM_DATA', 'ENQUIRY_CLOSED_DATA'];
  
  dataSheets.forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    if (sheet) {
      const lastRow = sheet.getLastRow();
      const lastCol = sheet.getLastColumn();
      
      if (lastRow > 1) {
        // Check for duplicate RTWE numbers
        const rtweCol = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        const rtweNumbers = rtweCol.map(row => row[0]).filter(val => val);
        const uniqueRTWE = [...new Set(rtweNumbers)];
        
        if (rtweNumbers.length !== uniqueRTWE.length) {
          report.push('⚠️ ' + sheetName + ' - Duplicate RTWE numbers found');
          report.push('   ├─ Total: ' + rtweNumbers.length);
          report.push('   └─ Unique: ' + uniqueRTWE.length);
          warningCount++;
        } else {
          report.push('✅ ' + sheetName + ' - No duplicates (' + rtweNumbers.length + ' records)');
          successCount++;
        }
      } else {
        report.push('ℹ️ ' + sheetName + ' - Empty (no data yet)');
      }
    }
  });
  
  report.push('');
  
  // ============================================
  // 6. CHECK FORMULAS
  // ============================================
  report.push('═══════════════════════════════════════════');
  report.push('📐 FORMULA CHECK');
  report.push('═══════════════════════════════════════════');
  
  if (formSheet) {
    const formulaCells = {
      'B32': 'Total Order Taga',
      'B34': 'Total MTR',
      'B35': 'Total Order Value'
    };
    
    Object.keys(formulaCells).forEach(cell => {
      try {
        const formula = formSheet.getRange(cell).getFormula();
        if (formula) {
          report.push('✅ ' + cell + ' (' + formulaCells[cell] + ') - Has Formula');
          report.push('   └─ ' + formula);
          successCount++;
        } else {
          report.push('⚠️ ' + cell + ' (' + formulaCells[cell] + ') - No Formula');
          warningCount++;
        }
      } catch (e) {
        report.push('❌ ' + cell + ' - Error: ' + e.message);
        errorCount++;
      }
    });
  }
  
  report.push('');
  
  // ============================================
  // 7. CHECK TRIGGERS
  // ============================================
  report.push('═══════════════════════════════════════════');
  report.push('⏰ TRIGGERS CHECK');
  report.push('═══════════════════════════════════════════');
  
  try {
    const triggers = ScriptApp.getProjectTriggers();
    
    if (triggers.length > 0) {
      report.push('✅ Total Triggers: ' + triggers.length);
      
      triggers.forEach(trigger => {
        const handlerName = trigger.getHandlerFunction();
        const eventType = trigger.getEventType();
        report.push('   ├─ ' + handlerName + ' (' + eventType + ')');
      });
      successCount++;
    } else {
      report.push('⚠️ No triggers found');
      report.push('   └─ Email reports may not work');
      warningCount++;
    }
  } catch (e) {
    report.push('❌ Trigger check error: ' + e.message);
    errorCount++;
  }
  
  report.push('');
  
  // ============================================
  // 8. CHECK USERS
  // ============================================
  report.push('═══════════════════════════════════════════');
  report.push('👥 USER MANAGEMENT CHECK');
  report.push('═══════════════════════════════════════════');
  
  const userSheet = ss.getSheetByName('USER_MANAGEMENT');
  if (userSheet) {
    const lastRow = userSheet.getLastRow();
    
    if (lastRow > 1) {
      report.push('✅ Users found: ' + (lastRow - 1));
      
      // Check for admin user
      const usernames = userSheet.getRange(2, 1, lastRow - 1, 1).getValues();
      const hasAdmin = usernames.some(row => row[0] === 'admin');
      
      if (hasAdmin) {
        report.push('   ✅ Admin user exists');
        successCount++;
      } else {
        report.push('   ❌ Admin user missing');
        errorCount++;
      }
    } else {
      report.push('⚠️ No users found - Run COMPLETE_SYSTEM_SETUP()');
      warningCount++;
    }
  } else {
    report.push('❌ USER_MANAGEMENT sheet missing');
    errorCount++;
  }
  
  report.push('');
  
  // ============================================
  // 9. CHECK EXTERNAL INTEGRATIONS
  // ============================================
  report.push('═══════════════════════════════════════════');
  report.push('🔗 EXTERNAL INTEGRATIONS CHECK');
  report.push('═══════════════════════════════════════════');
  
  // Check external sheet access
  if (CONFIG && CONFIG.EXTERNAL_SHEET && CONFIG.EXTERNAL_SHEET.ID) {
    try {
      const externalSS = SpreadsheetApp.openById(CONFIG.EXTERNAL_SHEET.ID);
      report.push('✅ External sheet accessible');
      report.push('   └─ ID: ' + CONFIG.EXTERNAL_SHEET.ID);
      successCount++;
    } catch (e) {
      report.push('❌ External sheet access error');
      report.push('   ├─ ID: ' + CONFIG.EXTERNAL_SHEET.ID);
      report.push('   └─ Error: ' + e.message);
      errorCount++;
    }
  }
  
  // Check Telegram
  if (TELEGRAM_CONFIG && TELEGRAM_CONFIG.ENABLED) {
    report.push('✅ Telegram integration enabled');
    if (TELEGRAM_CONFIG.BOT_TOKEN) {
      report.push('   ✅ Bot token configured');
      successCount++;
    } else {
      report.push('   ⚠️ Bot token missing');
      warningCount++;
    }
  } else {
    report.push('ℹ️ Telegram integration disabled');
  }
  
  report.push('');
  
  // ============================================
  // 10. CHECK SCRIPT PROPERTIES
  // ============================================
  report.push('═══════════════════════════════════════════');
  report.push('🔐 SCRIPT PROPERTIES CHECK');
  report.push('═══════════════════════════════════════════');
  
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const allProps = scriptProps.getProperties();
    const propCount = Object.keys(allProps).length;
    
    report.push('ℹ️ Stored properties: ' + propCount);
    
    // Check for broker tokens
    const brokerTokens = Object.keys(allProps).filter(key => key.startsWith('BROKER_TOKEN_'));
    if (brokerTokens.length > 0) {
      report.push('   ├─ Broker tokens: ' + brokerTokens.length);
    }
    
    // Check for broker data
    const brokerData = Object.keys(allProps).filter(key => key.startsWith('BROKER_DATA_'));
    if (brokerData.length > 0) {
      report.push('   └─ Broker submissions: ' + brokerData.length);
    }
    
  } catch (e) {
    report.push('❌ Script properties error: ' + e.message);
    errorCount++;
  }
  
  report.push('');
  
  // ============================================
  // 11. CHECK PERMISSIONS
  // ============================================
  report.push('═══════════════════════════════════════════');
  report.push('🔒 PERMISSIONS CHECK');
  report.push('═══════════════════════════════════════════');
  
  try {
    // Check Gmail permission
    try {
      GmailApp.getAliases();
      report.push('✅ Gmail API - Accessible');
      successCount++;
    } catch (e) {
      report.push('⚠️ Gmail API - Not authorized');
      warningCount++;
    }
    
    // Check Drive permission
    try {
      DriveApp.getRootFolder();
      report.push('✅ Drive API - Accessible');
      successCount++;
    } catch (e) {
      report.push('⚠️ Drive API - Not authorized');
      warningCount++;
    }
    
    // Check Calendar permission (if using triggers)
    try {
      CalendarApp.getAllCalendars();
      report.push('✅ Calendar API - Accessible');
      successCount++;
    } catch (e) {
      report.push('ℹ️ Calendar API - Not needed');
    }
    
  } catch (e) {
    report.push('❌ Permission check error: ' + e.message);
    errorCount++;
  }
  
  report.push('');
  
  // ============================================
  // 12. SYSTEM HEALTH SUMMARY
  // ============================================
  const endTime = new Date();
  const duration = (endTime - startTime) / 1000;
  
  report.push('═══════════════════════════════════════════');
  report.push('📊 DIAGNOSTIC SUMMARY');
  report.push('═══════════════════════════════════════════');
  report.push('');
  report.push('✅ Passed: ' + successCount);
  report.push('⚠️ Warnings: ' + warningCount);
  report.push('❌ Errors: ' + errorCount);
  report.push('');
  report.push('Duration: ' + duration + ' seconds');
  report.push('Timestamp: ' + new Date().toLocaleString());
  report.push('');
  
  // Overall status
  let overallStatus = '';
  let statusIcon = '';
  let recommendations = [];
  
  if (errorCount === 0 && warningCount === 0) {
    overallStatus = 'EXCELLENT - System fully operational';
    statusIcon = '🟢';
  } else if (errorCount === 0 && warningCount < 5) {
    overallStatus = 'GOOD - Minor warnings only';
    statusIcon = '🟡';
    recommendations.push('Review warnings above');
  } else if (errorCount < 5) {
    overallStatus = 'NEEDS ATTENTION - Some errors found';
    statusIcon = '🟠';
    recommendations.push('Fix critical errors first');
    recommendations.push('Run QUICK_REPAIR_SYSTEM()');
  } else {
    overallStatus = 'CRITICAL - Major issues detected';
    statusIcon = '🔴';
    recommendations.push('System may not function properly');
    recommendations.push('Run COMPLETE_SYSTEM_SETUP()');
    recommendations.push('Check Apps Script logs');
  }
  
  report.push(statusIcon + ' OVERALL STATUS: ' + overallStatus);
  report.push('');
  
  if (recommendations.length > 0) {
    report.push('💡 RECOMMENDATIONS:');
    recommendations.forEach(rec => {
      report.push('   • ' + rec);
    });
    report.push('');
  }
  
  report.push('═══════════════════════════════════════════');
  
  // Display report
  const reportText = report.join('\n');
  
  // Save to ACTIVITY_LOG
  try {
    logUserActivity('SYSTEM', 'DIAGNOSTICS', 'Errors: ' + errorCount + ' | Warnings: ' + warningCount);
  } catch (e) {
    Logger.log('Could not log diagnostics: ' + e);
  }
  
  // Show in dialog
  const htmlReport = '<pre style="font-family: monospace; font-size: 11px; white-space: pre-wrap;">' + 
                     reportText + '</pre>';
  
  const html = HtmlService.createHtmlOutput(htmlReport)
    .setWidth(800)
    .setHeight(600)
    .setTitle('System Diagnostics Report');
  
  ui.showModalDialog(html, 'System Diagnostics Report');
  
  // Also log to console
  Logger.log(reportText);
  
  // Return summary
  return {
    success: errorCount === 0,
    errors: errorCount,
    warnings: warningCount,
    passed: successCount,
    status: overallStatus,
    report: reportText
  };
}

// Quick diagnostics (faster, less detailed)
function QUICK_DIAGNOSTIC() {
  const ui = SpreadsheetApp.getUi();
  
  let issues = [];
  
  // Quick checks
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Check critical sheets
  if (!ss.getSheetByName('ENQUIRY_FORM')) issues.push('❌ ENQUIRY_FORM missing');
  if (!ss.getSheetByName('PENDING_DATA')) issues.push('❌ PENDING_DATA missing');
  if (!ss.getSheetByName('ORDER_CONFIRM_DATA')) issues.push('❌ ORDER_CONFIRM_DATA missing');
  
  // Check CONFIG
  if (typeof CONFIG === 'undefined') issues.push('❌ CONFIG not loaded');
  if (CONFIG && CONFIG.CELLS && CONFIG.CELLS.SO_NO) issues.push('⚠️ SO_NO still in CONFIG');
  
  // Check critical functions
  try {
    if (typeof submitEnquirySecure !== 'function') issues.push('❌ submitEnquirySecure missing');
  } catch (e) {
    issues.push('❌ submitEnquirySecure error');
  }
  
  let message = '';
  if (issues.length === 0) {
    message = '✅ QUICK CHECK PASSED\n\nNo critical issues found.\n\nRun DIAGNOSE_COMPLETE_SYSTEM() for detailed analysis.';
  } else {
    message = '⚠️ ISSUES FOUND (' + issues.length + '):\n\n' + issues.join('\n') + '\n\nRun DIAGNOSE_COMPLETE_SYSTEM() for details.';
  }
  
  ui.alert('Quick Diagnostic', message, ui.ButtonSet.OK);
}