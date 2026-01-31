// ============================================
// SEARCH & DASHBOARD - ALL FUNCTIONS
// Complete Search Dashboard + KPI Dashboard
// ============================================

function setupAdvancedSearchDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  try {
    let searchSheet = ss.getSheetByName(CONFIG.SHEETS.SEARCH_DASHBOARD);
    
    if (!searchSheet) {
      searchSheet = ss.insertSheet(CONFIG.SHEETS.SEARCH_DASHBOARD);
    }
    
    searchSheet.clear();
    searchSheet.clearFormats();
    searchSheet.setTabColor('#00BCD4');
    
    searchSheet.setColumnWidth(1, 80);
    searchSheet.setColumnWidth(2, 80);
    searchSheet.setColumnWidth(3, 120);
    searchSheet.setColumnWidth(4, 150);
    searchSheet.setColumnWidth(5, 100);
    searchSheet.setColumnWidth(6, 200);
    searchSheet.setColumnWidth(7, 80);
    searchSheet.setColumnWidth(8, 80);
    searchSheet.setColumnWidth(9, 100);
    searchSheet.setColumnWidth(10, 100);
    
    searchSheet.getRange('A1:J1').merge()
      .setValue('🔍 ADVANCED SEARCH DASHBOARD')
      .setBackground('#00BCD4')
      .setFontColor('white')
      .setFontSize(14)
      .setFontWeight('bold')
      .setHorizontalAlignment('center');
    searchSheet.setRowHeight(1, 50);
    
    searchSheet.getRange('A3').setValue('QUICK FILTERS:')
      .setFontWeight('bold')
      .setBackground('#E0F7FA');
    
    const quickFilters = ['📅 Today', '📅 This Week', '📅 This Month', '📅 Last Month', '📅 This Year'];
    quickFilters.forEach((label, i) => {
      searchSheet.getRange(3, 2 + i)
        .setValue(label)
        .setBackground('#4DD0E1')
        .setFontColor('white')
        .setFontWeight('bold')
        .setHorizontalAlignment('center');
    });
    
    searchSheet.getRange('A5').setValue('DATE SEARCH:')
      .setFontWeight('bold')
      .setBackground('#E0F7FA');
    searchSheet.getRange('B5').setValue('Single Date:')
      .setBackground('#F5F5F5');
    searchSheet.getRange('C5').setBackground('#FFFDE7');
    searchSheet.getRange('E5').setValue('OR Date Range:')
      .setBackground('#F5F5F5');
    searchSheet.getRange('F5').setValue('From:')
      .setBackground('#F5F5F5');
    searchSheet.getRange('G5').setBackground('#FFFDE7');
    searchSheet.getRange('H5').setValue('To:')
      .setBackground('#F5F5F5');
    searchSheet.getRange('I5').setBackground('#FFFDE7');
    
    searchSheet.getRange('A7').setValue('BROKER:')
      .setFontWeight('bold')
      .setBackground('#E0F7FA');
    searchSheet.getRange('C7:J7').merge()
      .setBackground('#FFFDE7');
    
    searchSheet.getRange('A8').setValue('QUALITY:')
      .setFontWeight('bold')
      .setBackground('#E0F7FA');
    searchSheet.getRange('C8:J8').merge()
      .setBackground('#FFFDE7');
    
    searchSheet.getRange('A9').setValue('BUYER:')
      .setFontWeight('bold')
      .setBackground('#E0F7FA');
    searchSheet.getRange('C9:J9').merge()
      .setBackground('#FFFDE7');
    
    searchSheet.getRange('A10').setValue('YEAR:')
      .setFontWeight('bold')
      .setBackground('#E0F7FA');
    searchSheet.getRange('C10').setBackground('#FFFDE7');
    
    searchSheet.getRange('E10').setValue('STATUS:')
      .setFontWeight('bold')
      .setBackground('#E0F7FA');
    searchSheet.getRange('G10:J10').merge()
      .setBackground('#FFFDE7');
    
    searchSheet.getRange('A12').setValue('SORT BY:')
      .setFontWeight('bold')
      .setBackground('#E0F7FA');
    searchSheet.getRange('C12').setBackground('#FFFDE7');
    const sortRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['Latest First', 'Oldest First', 'Broker A-Z', 'Total MTR High-Low'], true)
      .setAllowInvalid(false)
      .build();
    searchSheet.getRange('C12').setDataValidation(sortRule).setValue('Latest First');
    
    searchSheet.getRange('A14').setValue('🔍 SEARCH')
      .setBackground('#00838F')
      .setFontColor('white')
      .setFontWeight('bold')
      .setHorizontalAlignment('center');
    
    searchSheet.getRange('C14').setValue('🗑️ CLEAR')
      .setBackground('#F44336')
      .setFontColor('white')
      .setFontWeight('bold')
      .setHorizontalAlignment('center');
    
    searchSheet.setRowHeight(14, 40);
    
    searchSheet.getRange('A16:J16').setValues([[
      'RTWE No', 'RTWC No', 'Broker', 'Quality', 'Buyer',
      'Design Details', 'Total TAGA', 'Total MTR', 'Delivery Date', 'Total Order Value'
    ]])
      .setBackground('#00838F')
      .setFontColor('white')
      .setFontWeight('bold')
      .setHorizontalAlignment('center')
      .setBorder(true, true, true, true, true, true);
    
    searchSheet.getRange('A17:J17').merge()
      .setValue('Fill at least ONE filter above and click SEARCH button')
      .setBackground('#FFF9C4')
      .setFontStyle('italic')
      .setHorizontalAlignment('center');
    
    ui.alert('✅ Search Dashboard Setup Complete!');
    SpreadsheetApp.setActiveSheet(searchSheet);
    
  } catch (error) {
    ui.alert('❌ Setup Error:\n\n' + error.message);
    Logger.log('Search Dashboard Setup Error: ' + error);
  }
}

function searchDashboardExecute() {

  if (!refreshSession()) {
    SpreadsheetApp.getUi().alert('🔒 Session expired! Please login.');
    showLoginDialog();
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  const searchSheet = ss.getSheetByName(CONFIG.SHEETS.SEARCH_DASHBOARD);

  
  if (!searchSheet) {
    ui.alert('⚠️ Dashboard not found!\n\nPlease run "Setup Search Dashboard" first.');
    return;
  }
  
  try {
    const singleDate = searchSheet.getRange('C5').getValue();
    const dateFrom = searchSheet.getRange('G5').getValue();
    const dateTo = searchSheet.getRange('I5').getValue();
    const brokerFilter = String(searchSheet.getRange('C7:J7').getValue()).trim();
    const qualityFilter = String(searchSheet.getRange('C8:J8').getValue()).trim();
    const buyerFilter = String(searchSheet.getRange('C9:J9').getValue()).trim();
    const yearFilter = String(searchSheet.getRange('C10').getValue()).trim();
    const statusFilter = String(searchSheet.getRange('G10:J10').getValue()).trim();
    const sortBy = searchSheet.getRange('C12').getValue() || 'Latest First';
    
    if (!singleDate && !dateFrom && !dateTo && !brokerFilter && !qualityFilter && 
        !buyerFilter && !yearFilter && !statusFilter) {
      ui.alert('⚠️ No Filters!\n\nPlease fill at least ONE filter.');
      return;
    }
    
    const confirmedSheet = ss.getSheetByName(CONFIG.SHEETS.CONFIRMED);
    if (!confirmedSheet) {
      ui.alert('❌ ORDER_CONFIRM_DATA sheet not found!');
      return;
    }
    
    const lastRow = confirmedSheet.getLastRow();
    if (lastRow < 2) {
      ui.alert('ℹ️ No data!');
      return;
    }
    
    const allData = confirmedSheet.getRange(2, 1, lastRow - 1, 42).getValues();
    
    let filteredData = allData.filter(row => {
      if (singleDate) {
        const rowDate = asDate(row[2]);
        if (!rowDate || stripTime(rowDate).getTime() !== stripTime(asDate(singleDate)).getTime()) {
          return false;
        }
      }
      
      if (dateFrom && dateTo) {
        const rowDate = asDate(row[2]);
        const fromDate = stripTime(asDate(dateFrom));
        const toDate = stripTime(asDate(dateTo));
        if (!rowDate || stripTime(rowDate) < fromDate || stripTime(rowDate) > toDate) {
          return false;
        }
      }
      
      if (brokerFilter) {
        const brokers = brokerFilter.split(',').map(b => b.trim().toLowerCase());
        const rowBroker = String(row[4]).toLowerCase();
        if (!brokers.some(b => rowBroker.includes(b))) {
          return false;
        }
      }
      
      if (qualityFilter) {
        const qualities = qualityFilter.split(',').map(q => q.trim().toLowerCase());
        const rowQuality = String(row[5]).toLowerCase();
        if (!qualities.some(q => rowQuality.includes(q))) {
          return false;
        }
      }
      
      if (buyerFilter) {
        const rowBuyer = String(row[11]).toLowerCase();
        if (!rowBuyer.includes
        (buyerFilter.toLowerCase())) {
          return false;
        }
      }
      
      if (yearFilter) {
        const rowDate = asDate(row[2]);
        if (!rowDate || rowDate.getFullYear().toString() !== yearFilter) {
          return false;
        }
      }
      
      if (statusFilter) {
        const statuses = statusFilter.split(',').map(s => s.trim().toLowerCase());
        const rowStatus = String(row[7]).toLowerCase();
        if (!statuses.some(s => rowStatus.includes(s))) {
          return false;
        }
      }
      
      return true;
    });
    
    if (filteredData.length === 0) {
      searchSheet.getRange('A17:J1000').clearContent();
      searchSheet.getRange('A17:J17').merge()
        .setValue('No results found')
        .setBackground('#FFCDD2')
        .setHorizontalAlignment('center');
      ui.alert('ℹ️ No results found!');
      return;
    }
    
    filteredData.sort((a, b) => {
      switch(sortBy) {
        case 'Latest First':
          return (asDate(b[2]) || new Date(0)).getTime() - (asDate(a[2]) || new Date(0)).getTime();
        case 'Oldest First':
          return (asDate(a[2]) || new Date(0)).getTime() - (asDate(b[2]) || new Date(0)).getTime();
        case 'Broker A-Z':
          return String(a[4]).localeCompare(String(b[4]));
        case 'Total MTR High-Low':
          return (Number(b[29]) || 0) - (Number(a[29]) || 0);
        default:
          return 0;
      }
    });
    
    const results = filteredData.map(row => {
      let designDetails = '';
      for (let i = 0; i < 6; i++) {
        const design = row[15 + i * 2];
        const taga = row[16 + i * 2];
        if (design && taga) {
          if (designDetails) designDetails += '\n';
          designDetails += design + ': ' + taga + ' TAGA';
        }
      }
      
      return [
        row[0],
        row[1],
        row[4],
        row[5],
        row[11] || '',
        designDetails,
        row[27] || 0,
        row[29] || 0,
        asDate(row[37]),
        row[30] || 0
      ];
    });
    
    searchSheet.getRange('A17:J1000').clearContent();
    
    const startRow = 17;
    searchSheet.getRange(startRow, 1, results.length, 10).setValues(results);
    
    searchSheet.getRange(startRow, 1, results.length, 10)
      .setBorder(true, true, true, true, true, true);
    
    for (let i = 0; i < results.length; i++) {
      const bgColor = i % 2 === 0 ? '#F5F5F5' : '#FFFFFF';
      searchSheet.getRange(startRow + i, 1, 1, 10).setBackground(bgColor);
    }
    
    searchSheet.getRange(startRow, 7, results.length, 1).setNumberFormat('#,##0');
    searchSheet.getRange(startRow, 8, results.length, 1).setNumberFormat('#,##0.00');
    searchSheet.getRange(startRow, 9, results.length, 1).setNumberFormat('dd-mmm-yyyy');
    searchSheet.getRange(startRow, 10, results.length, 1).setNumberFormat('#,##0.00');
    
    searchSheet.getRange(startRow, 6, results.length, 1).setWrap(true);
    
    const summaryRow = startRow + results.length;
    const totalTAGA = results.reduce((sum, r) => sum + (Number(r[6]) || 0), 0);
    const totalMTR = results.reduce((sum, r) => sum + (Number(r[7]) || 0), 0);
    const totalValue = results.reduce((sum, r) => sum + (Number(r[9]) || 0), 0);
    
    searchSheet.getRange(summaryRow, 1, 1, 6).merge()
      .setValue('SUMMARY: Total Records: ' + results.length)
      .setBackground('#FFF9C4')
      .setFontWeight('bold');
    
    searchSheet.getRange(summaryRow, 7).setValue(totalTAGA)
      .setBackground('#FFF9C4')
      .setFontWeight('bold')
      .setNumberFormat('#,##0');
    
    searchSheet.getRange(summaryRow, 8).setValue(totalMTR)
      .setBackground('#FFF9C4')
      .setFontWeight('bold')
      .setNumberFormat('#,##0.00');
    
    searchSheet.getRange(summaryRow, 9).setValue('Total:')
      .setBackground('#FFF9C4')
      .setFontWeight('bold');
    
    searchSheet.getRange(summaryRow, 10).setValue(totalValue)
      .setBackground('#FFF9C4')
      .setFontWeight('bold')
      .setNumberFormat('#,##0.00');
    
    searchSheet.getRange(summaryRow, 1, 1, 10)
      .setBorder(true, true, true, true, true, true, 'black', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    
    ui.alert('✅ Search Complete!\n\n' + results.length + ' records found!');
    
  } catch (error) {
    ui.alert('❌ Search Error:\n\n' + error.message);
    Logger.log('Search Error: ' + error);
  }
}

function clearSearchDashboard() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const searchSheet = ss.getSheetByName(CONFIG.SHEETS.SEARCH_DASHBOARD);
  
  if (!searchSheet) {
    SpreadsheetApp.getUi().alert('⚠️ Dashboard not found!');
    return;
  }
  
  searchSheet.getRange('C5').clearContent();
  searchSheet.getRange('G5').clearContent();
  searchSheet.getRange('I5').clearContent();
  searchSheet.getRange('C7:J7').clearContent();
  searchSheet.getRange('C8:J8').clearContent();
  searchSheet.getRange('C9:J9').clearContent();
  searchSheet.getRange('C10').clearContent();
  searchSheet.getRange('G10:J10').clearContent();
  searchSheet.getRange('C12').setValue('Latest First');
  
  searchSheet.getRange('A17:J1000').clearContent();
  
  searchSheet.getRange('A17:J17').merge()
    .setValue('Fill at least ONE filter above and click SEARCH button')
    .setBackground('#FFF9C4')
    .setFontStyle('italic')
    .setHorizontalAlignment('center');
  
  SpreadsheetApp.getActiveSpreadsheet().toast('All filters cleared!', '🧹 Cleared', 2);
}

function handleSearchDashboardClick(e) {
  if (!e || !e.range) return;
  
  const sheet = e.range.getSheet();
  if (sheet.getName() !== CONFIG.SHEETS.SEARCH_DASHBOARD) return;
  
  const row = e.range.getRow();
  const col = e.range.getColumn();
  
  if (row === 14 && col === 1) {
    searchDashboardExecute();
  }
  
  if (row === 14 && col === 3) {
    clearSearchDashboard();
  }
  
  if (row === 3 && col >= 2 && col <= 6) {
    const filters = ['Today', 'This Week', 'This Month', 'Last Month', 'This Year'];
    quickDateFilter(filters[col - 2]);
  }
}

function quickDateFilter(filterType) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const searchSheet = ss.getSheetByName(CONFIG.SHEETS.SEARCH_DASHBOARD);
  
  if (!searchSheet) return;
  
  const today = new Date();
  let fromDate = null;
  let toDate = today;
  
  switch(filterType) {
    case 'Today':
      searchSheet.getRange('C5').setValue(today);
      searchSheet.getRange('G5').clearContent();
      searchSheet.getRange('I5').clearContent();
      ss.toast('Today\'s date set!', '📅 Today', 2);
      return;
      
    case 'This Week':
      const dayOfWeek = today.getDay();
      fromDate = new Date(today.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
      break;
      
    case 'This Month':
      fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
      
    case 'Last Month':
      fromDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      toDate = new Date(today.getFullYear(), today.getMonth(), 0);
      break;
      
    case 'This Year':
      fromDate = new Date(today.getFullYear(), 0, 1);
      break;
  }
  
  searchSheet.getRange('C5').clearContent();
  searchSheet.getRange('G5').setValue(fromDate);
  searchSheet.getRange('I5').setValue(toDate);
  
  ss.toast('Date range set', '📅 ' + filterType, 2);
}


// ============================================
// SEARCH DASHBOARD - PDF EXPORT
// ============================================
function createSearchDashboardPdf_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = CONFIG.SHEETS.SEARCH_DASHBOARD || 'SEARCH_DASHBOARD';
  const sourceSheet = ss.getSheetByName(sheetName);
  if (!sourceSheet) {
    throw new Error('Search Dashboard sheet not found: ' + sheetName);
  }

  const lastRow = sourceSheet.getLastRow();
  const lastCol = sourceSheet.getLastColumn();
  if (lastRow <= 16) {
    throw new Error('No search results found. Run SEARCH first.');
  }

  const tempSs = SpreadsheetApp.create('RTWE_Search_Dashboard_PDF_TEMP');
  const tempFirstSheet = tempSs.getSheets()[0];

  const copied = sourceSheet.copyTo(tempSs);
  tempSs.setActiveSheet(copied);
  tempSs.moveActiveSheet(1);
  tempSs.deleteSheet(tempFirstSheet);

  const now = new Date();
  const dateStr = Utilities.formatDate(
    now,
    Session.getScriptTimeZone(),
    'dd-MMM-yyyy_HH-mm'
  );
  const pdfName = 'RTWE_Search_Dashboard_' + dateStr + '.pdf';

  const pdfBlob = tempSs.getAs(MimeType.PDF).setName(pdfName);

  DriveApp.getFileById(tempSs.getId()).setTrashed(true);

  return pdfBlob;
}

function emailSearchDashboardPdf() {
  if (!refreshSession()) {
    SpreadsheetApp.getUi().alert('🔒 Session expired! Please login.');
    showLoginDialog();
    return;
  }

  const ui = SpreadsheetApp.getUi();
  const emailPrompt = ui.prompt(
    '📤 Send Search Dashboard PDF',
    'Enter email ID(s).\nFor multiple emails, use comma (,):',
    ui.ButtonSet.OK_CANCEL
  );

  if (emailPrompt.getSelectedButton() !== ui.Button.OK) {
    ui.alert('❌ Email sending cancelled.');
    return;
  }

  const emailInput = emailPrompt.getResponseText().trim();
  if (!emailInput) {
    ui.alert('❌ No email entered. Process cancelled.');
    return;
  }

  const recipients = emailInput
    .split(',')
    .map(e => e.trim())
    .filter(e => e);

  try {
    const pdfBlob = createSearchDashboardPdf_();

    const now = new Date();
    const dateStr = Utilities.formatDate(
      now,
      Session.getScriptTimeZone(),
      'dd-MMM-yyyy HH:mm'
    );

    const subject = 'RTWE Search Dashboard Result - ' + dateStr;
    const body =
      'Attached PDF contains the current RTWE Advanced Search Dashboard result.\n\n' +
      'Generated from: SEARCH_DASHBOARD\n' +
      'Time: ' +
      dateStr +
      '\n\nRTWE System v3.0';

    GmailApp.sendEmail(recipients.join(','), subject, body, {
      attachments: [pdfBlob],
      name: 'RTWE System'
    });

    ui.alert(
      '✅ Search Dashboard PDF sent successfully to:\n\n' +
        recipients.join(', ')
    );
  } catch (error) {
    Logger.log('❌ emailSearchDashboardPdf error: ' + error);
    ui.alert('❌ Failed to send email:\n\n' + error.message);
  }
}


function telegramSearchDashboardPdf() {
  if (!refreshSession()) {
    SpreadsheetApp.getUi().alert('🔒 Session expired! Please login.');
    showLoginDialog();
    return;
  }

  try {
    const pdfBlob = createSearchDashboardPdf_();

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const telegramSheet = ss.getSheetByName('TELEGRAM_USERS');
    if (!telegramSheet) {
      throw new Error('TELEGRAM_USERS sheet not found.');
    }

    const data = telegramSheet.getDataRange().getValues();
    if (data.length <= 1) {
      throw new Error('No Telegram users registered.');
    }

    const now = new Date();
    const dateStr = Utilities.formatDate(
      now,
      Session.getScriptTimeZone(),
      'dd-MMM-yyyy HH:mm'
    );
    const fileName = pdfBlob.getName();
    const caption =
      '📊 *RTWE Advanced Search Dashboard*\n' +
      '_Result exported as PDF_\n' +
      'Time: `' +
      dateStr +
      '`';

    for (let i = 1; i < data.length; i++) {
      const chatId = data[i][0];
      const status = data[i][3];
      if (status === 'Active' && chatId) {
        sendTelegramDocument(chatId, pdfBlob.copyBlob(), fileName, caption);
      }
    }

    SpreadsheetApp.getUi().alert('✅ Search Dashboard PDF sent on Telegram!');
  } catch (error) {
    Logger.log('❌ telegramSearchDashboardPdf error: ' + error);
    SpreadsheetApp.getUi().alert(
      '❌ Failed to send PDF on Telegram:\n\n' + error.message
    );
  }
}

function sendSearchDashboardPdfAll() {
  if (!refreshSession()) {
    SpreadsheetApp.getUi().alert('🔒 Session expired! Please login.');
    showLoginDialog();
    return;
  }

  try {
    const pdfBlob = createSearchDashboardPdf_();

    const recipients = [
      CONFIG.USERS.OWNER_EMAIL,
      CONFIG.USERS.SECONDARY_EMAIL
    ].filter(String);

    const now = new Date();
    const dateStr = Utilities.formatDate(
      now,
      Session.getScriptTimeZone(),
      'dd-MMM-yyyy HH:mm'
    );
    const subject = 'RTWE Search Dashboard Result - ' + dateStr;
    const body =
      'Attached PDF contains the current RTWE Advanced Search Dashboard result.\n\n' +
      'Time: ' +
      dateStr +
      '\n\nRTWE System v3.0';

    if (recipients.length > 0) {
      GmailApp.sendEmail(recipients.join(','), subject, body, {
        attachments: [pdfBlob],
        name: 'RTWE System'
      });
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const telegramSheet = ss.getSheetByName('TELEGRAM_USERS');
    if (telegramSheet && TELEGRAM_CONFIG.ENABLED) {
      const data = telegramSheet.getDataRange().getValues();
      const caption =
        '📊 *RTWE Advanced Search Dashboard*\n' +
        '_PDF shared via system_\n' +
        'Time: `' +
        dateStr +
        '`';
      const fileName = pdfBlob.getName();

      for (let i = 1; i < data.length; i++) {
        const chatId = data[i][0];
        const status = data[i][3];
        if (status === 'Active' && chatId) {
          sendTelegramDocument(chatId, pdfBlob.copyBlob(), fileName, caption);
        }
      }
    }

    SpreadsheetApp.getUi().alert(
      '✅ Search Dashboard PDF sent via Email and Telegram!'
    );
  } catch (error) {
    Logger.log('❌ sendSearchDashboardPdfAll error: ' + error);
    SpreadsheetApp.getUi().alert(
      '❌ Failed to send Search Dashboard PDF:\n\n' + error.message
    );
  }
}

// ============================================
// MENU SYSTEM
// ============================================

// ============================================
// SECURE MENU SYSTEM - SHOWS ONLY AFTER LOGIN
// ============================================


// ============================================
// KPI / PERFORMANCE DASHBOARD
// ============================================

// setupPerformanceDashboard() - REMOVED: Duplicate of function in Setup.gs

// ============================================
// CORE WORKFLOW - onEdit (Same as before)
// ============================================


// ============================================
// SIMPLE DASHBOARD
// ============================================

function setupDashboardSimple() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  try {
    const dashName = CONFIG.SHEETS.DASHBOARD || 'DASHBOARD';
    let dashSheet = ss.getSheetByName(dashName);
    
    if (!dashSheet) {
      dashSheet = ss.insertSheet(dashName);
    }
    
    dashSheet.clear();
    dashSheet.clearFormats();
    
    dashSheet.setTabColor('#FF9800');
    dashSheet.setColumnWidths(1, 10, 100);
    
    dashSheet.getRange('A1').setValue('RTWE ENQUIRY → ORDER DASHBOARD')
      .setFontSize(14)
      .setFontWeight('bold')
      .setBackground('#4A90E2')
      .setFontColor('white');
    
    dashSheet.getRange('J1').setValue('Last Refreshed: (not yet)')
      .setFontSize(9)
      .setFontStyle('italic');
    
    dashSheet.getRange('A3').setValue('TOP KPIs')
      .setFontWeight('bold')
      .setBackground('#EEEEEE');
    
    const kpiLabels = [
      'Total Enquiries',
      'This Month',
      'Today',
      'Pending',
      'Approved',
      'Conversion %',
      'Active Orders',
      'Total Order Value',
      'Canceled',
      'Total MTR',
      'Open Order Value'
    ];
    
    kpiLabels.forEach((label, i) => {
      dashSheet.getRange(4 + i, 1).setValue(label)
        .setBackground('#F9F9F9')
        .setFontWeight('bold');
      dashSheet.getRange(4 + i, 2).setBackground('#FFFFFF');
    });
    
    dashSheet.getRange('A16').setValue('ORDER STATUS OVERVIEW (Recent Orders)')
      .setFontWeight('bold')
      .setBackground('#E3F2FD');
    
    dashSheet.getRange('A17:J17').setValues([[
      'RTWE No', 'Costing No', 'Enq Date', 'Buyer', 'Broker',
      'Quality', 'Status', 'Delivery', 'MTR', 'Value'
    ]])
      .setFontWeight('bold')
      .setBackground('#BBDEFB');
    
    dashSheet.getRange('A33').setValue('FINANCIAL SUMMARY (MONTH-WISE)')
      .setFontWeight('bold')
      .setBackground('#E8F5E9');
    
    dashSheet.getRange('A34:D34').setValues([
      ['Month', 'Approved Orders', 'Total MTR', 'Total Value']
    ])
      .setFontWeight('bold')
      .setBackground('#C8E6C9');
    
    dashSheet.getRange('F33').setValue('BROKER PERFORMANCE')
      .setFontWeight('bold')
      .setBackground('#FFF3E0');
    
    dashSheet.getRange('F34:J34').setValues([
      ['Broker', 'Enquiries', 'Approved', 'Conv %', 'Value']
    ])
      .setFontWeight('bold')
      .setBackground('#FFE0B2');
    
    dashSheet.getRange('A50').setValue('QUALITY ANALYSIS')
      .setFontWeight('bold')
      .setBackground('#F3E5F5');
    
    dashSheet.getRange('A51:F51').setValues([
      ['Quality', 'Enquiries', 'Approved', 'MTR', 'Value', '% MTR']
    ])
      .setFontWeight('bold')
      .setBackground('#E1BEE7');
    
    dashSheet.getRange('H50').setValue('ALERTS')
      .setFontWeight('bold')
      .setBackground('#FFCDD2');
    
    dashSheet.getRange('H51:K51').setValues([
      ['Type', 'RTWE', 'Info', 'Days']
    ])
      .setFontWeight('bold')
      .setBackground('#EF9A9A');
    
    dashSheet.getRange('A3:B14').setBorder(true, true, true, true, true, true);
    dashSheet.getRange('A17:J32').setBorder(true, true, true, true, true, true);
    dashSheet.getRange('A34:D49').setBorder(true, true, true, true, true, true);
    dashSheet.getRange('F34:J49').setBorder(true, true, true, true, true, true);
    dashSheet.getRange('A51:F65').setBorder(true, true, true, true, true, true);
    dashSheet.getRange('H51:K65').setBorder(true, true, true, true, true, true);
    
    refreshDashboardSimple();
    
    ui.alert('✅ Dashboard Setup Complete!');
    
  } catch (error) {
    ui.alert('❌ Setup Error:\n\n' + error.message);
    Logger.log('Setup Dashboard Error: ' + error);
  }
}

function refreshDashboardSimple() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dashSheet = ss.getSheetByName(CONFIG.SHEETS.DASHBOARD || 'DASHBOARD');
  if (!dashSheet) {
    SpreadsheetApp.getUi().alert('Dashboard not found! Run "Setup Dashboard" first.');
    return;
  }
  if (!refreshSession()) {
  SpreadsheetApp.getUi().alert('🔒 Session expired! Please login.');
  showLoginDialog();
  return;
}

  const now = new Date();
  const tz = Session.getScriptTimeZone();
  const stamp = 'Last Refreshed: ' + Utilities.formatDate(now, tz, 'dd-MMM-yyyy HH:mm:ss');
  dashSheet.getRange('J1').setValue(stamp);
  
  const pendingSheet = ss.getSheetByName(CONFIG.SHEETS.PENDING);
  const pendApprSheet = ss.getSheetByName(CONFIG.SHEETS.PENDING_APPROVED);
  const confirmedSheet = ss.getSheetByName(CONFIG.SHEETS.CONFIRMED);
  const closedSheet = ss.getSheetByName(CONFIG.SHEETS.CLOSED);
  
  const pendingData = getSheetData(pendingSheet);
  const pendApprData = getSheetData(pendApprSheet);
  const confirmedData = getSheetData(confirmedSheet);
  const closedData = getSheetData(closedSheet);
  
  const totalEnquiries = pendingData.length + pendApprData.length + confirmedData.length + closedData.length;
  
  const today = new Date();
  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();
  
  let thisMonthEnq = 0;
  let todayEnq = 0;
  
  [pendingData, pendApprData, confirmedData, closedData].forEach(rows => {
    rows.forEach(r => {
      const d = asDate(r[2]);
      if (!d) return;
      if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) thisMonthEnq++;
      if (d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()) todayEnq++;
    });
  });
  
  let pendingCount = 0;
  pendingData.forEach(r => {
    if (String(r[7]).toLowerCase() === 'pending') pendingCount++;
  });
  
  const approvedCount = confirmedData.length;
  const conversionRate = totalEnquiries > 0 ? (approvedCount / totalEnquiries) * 100 : 0;
  
  let totalOrderValue = 0;
  let totalMTR = 0;
  let activeOrders = 0;
  let openOrderValue = 0;
  const todayStrip = stripTime(today);
  
  confirmedData.forEach(r => {
    const val = Number(r[30]);
    const mtr = Number(r[29]);
    const del = asDate(r[37]);
    
    if (!isNaN(val)) totalOrderValue += val;
    if (!isNaN(mtr)) totalMTR += mtr;
    
    if (del && stripTime(del) >= todayStrip) {
      activeOrders++;
      if (!isNaN(val)) openOrderValue += val;
    }
  });
  
  const canceledCount = closedData.length;
  
  const kpiValues = [
    totalEnquiries,
    thisMonthEnq,
    todayEnq,
    pendingCount,
    approvedCount,
    conversionRate.toFixed(2) + '%',
    activeOrders,
    totalOrderValue.toFixed(2),
    canceledCount,
    totalMTR.toFixed(2),
    openOrderValue.toFixed(2)
  ];
  
  kpiValues.forEach((val, i) => {
    dashSheet.getRange(4 + i, 2).setValue(val);
  });
  
  dashSheet.getRange('A18:J32').clearContent();
  
  const sortedConf = confirmedData.slice().sort((a, b) => {
    const da = asDate(a[8]);
    const db = asDate(b[8]);
    return (db ? db.getTime() : 0) - (da ? da.getTime() : 0);
  });
  
  const recentRows = sortedConf.slice(0, 15).map(r => [
    r[0], r[1], asDate(r[2]), r[11] || '', r[4],
    r[5], r[7], asDate(r[37]), Number(r[29]) || '', Number(r[30]) || ''
  ]);
  
  if (recentRows.length > 0) {
    dashSheet.getRange(18, 1, recentRows.length, 10).setValues(recentRows);
    dashSheet.getRange(18, 3, recentRows.length, 1).setNumberFormat('dd-mmm-yyyy');
    dashSheet.getRange(18, 8, recentRows.length, 1).setNumberFormat('dd-mmm-yyyy');
    dashSheet.getRange(18, 9, recentRows.length, 2).setNumberFormat('#,##0.00');
  }
  
  const monthMap = {};
  confirmedData.forEach(r => {
    const d = asDate(r[8]);
    if (!d) return;
    const key = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2);
    if (!monthMap[key]) monthMap[key] = { orders: 0, mtr: 0, value: 0 };
    monthMap[key].orders++;
    monthMap[key].mtr += Number(r[29]) || 0;
    monthMap[key].value += Number(r[30]) || 0;
  });
  
  const monthRows = Object.keys(monthMap).sort().map(k => {
    const obj = monthMap[k];
    return [k, obj.orders, obj.mtr, obj.value];
  });
  
  dashSheet.getRange('A35:D49').clearContent();
  if (monthRows.length > 0) {
    dashSheet.getRange(35, 1, monthRows.length, 4).setValues(monthRows);
    dashSheet.getRange(35, 3, monthRows.length, 2).setNumberFormat('#,##0.00');
  }
  
  const brokerMap = {};
  
  [pendingData, pendApprData, confirmedData, closedData].forEach(rows => {
    rows.forEach(r => {
      const broker = (r[4] || '').toString().trim();
      if (!broker) return;
      if (!brokerMap[broker]) brokerMap[broker] = { enq: 0, appr: 0, value: 0 };
      brokerMap[broker].enq++;
    });
  });
  
  confirmedData.forEach(r => {
    const broker = (r[4] || '').toString().trim();
    if (!broker) return;
    if (!brokerMap[broker]) brokerMap[broker] = { enq: 0, appr: 0, value: 0 };
    brokerMap[broker].appr++;
    brokerMap[broker].value += Number(r[30]) || 0;
  });
  
  const brokerRows = Object.keys(brokerMap).map(name => {
    const b = brokerMap[name];
    const conv = b.enq > 0 ? (b.appr / b.enq) * 100 : 0;
    return [name, b.enq, b.appr, conv, b.value];
  }).sort((a, b) => b[4] - a[4]);
  
  dashSheet.getRange('F35:J49').clearContent();
  if (brokerRows.length > 0) {
    const limited = brokerRows.slice(0, 15);
    dashSheet.getRange(35, 6, limited.length, 5).setValues(limited);
    dashSheet.getRange(35, 8, limited.length, 1).setNumberFormat('0.0"%"');
    dashSheet.getRange(35, 10, limited.length, 1).setNumberFormat('#,##0.00');
  }
  
  const qualityMap = {};
  
  [pendingData, pendApprData, confirmedData, closedData].forEach(rows => {
    rows.forEach(r => {
      const q = (r[5] || '').toString().trim();
      if (!q) return;
      if (!qualityMap[q]) qualityMap[q] = { enq: 0, appr: 0, mtr: 0, value: 0 };
      qualityMap[q].enq++;
    });
  });
  
  confirmedData.forEach(r => {
    const q = (r[14] || r[5] || '').toString().trim();
    if (!q) return;
    if (!qualityMap[q]) qualityMap[q] = { enq: 0, appr: 0, mtr: 0, value: 0 };
    qualityMap[q].appr++;
    qualityMap[q].mtr += Number(r[29]) || 0;
    qualityMap[q].value += Number(r[30]) || 0;
  });
  
  const totalQualMTR = Object.keys(qualityMap).reduce((sum, q) => sum + qualityMap[q].mtr, 0);
  
  const qualityRows = Object.keys(qualityMap).map(q => {
    const obj = qualityMap[q];
    const share = totalQualMTR > 0 ? (obj.mtr / totalQualMTR) * 100 : 0;
    return [q, obj.enq, obj.appr, obj.mtr, obj.value, share];
  }).sort((a, b) => b[3] - a[3]);
  
  dashSheet.getRange('A52:F65').clearContent();
  if (qualityRows.length > 0) {
    const limited = qualityRows.slice(0, 14);
    dashSheet.getRange(52, 1, limited.length, 6).setValues(limited);
    dashSheet.getRange(52, 4, limited.length, 2).setNumberFormat('#,##0.00');
    dashSheet.getRange(52, 6, limited.length, 1).setNumberFormat('0.0"%"');
  }
  
  const alerts = [];
  const threeDays = new Date(todayStrip.getTime() + 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(todayStrip.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  confirmedData.forEach(r => {
    const del = asDate(r[37]);
    if (!del) return;
    const dStrip = stripTime(del);
    if (dStrip >= todayStrip && dStrip <= threeDays) {
      const days = Math.round((dStrip.getTime() - todayStrip.getTime()) / (24 * 60 * 60 * 1000));
      alerts.push(['Due Soon', r[0], r[11] || '', days + ' days']);
    }
  });
  
  pendingData.forEach(r => {
    const enq = asDate(r[2]);
    if (!enq) return;
    const eStrip = stripTime(enq);
    if (eStrip <= sevenDaysAgo && String(r[7]).toLowerCase() === 'pending') {
      const days = Math.round((todayStrip.getTime() - eStrip.getTime()) / (24 * 60 * 60 * 1000));
      alerts.push(['Old Pending', r[0], r[4] || '', days + ' days']);
    }
  });
  
  confirmedData.forEach(r => {
    const del = asDate(r[37]);
    if (!del) return;
    const dStrip = stripTime(del);
    if (dStrip < todayStrip) {
      const days = Math.round((todayStrip.getTime() - dStrip.getTime()) / (24 * 60 * 60 * 1000));
      alerts.push(['Overdue', r[0], r[11] || '', days + ' days']);
    }
  });
  
  confirmedData.forEach(r => {
    if (String(r[7]).toLowerCase() === 'approved' && !(r[12] || '').toString().trim()) {
      alerts.push(['Missing PO', r[0], r[11] || '', '-']);
    }
  });
  
  dashSheet.getRange('H52:K65').clearContent();
  if (alerts.length > 0) {
    const limited = alerts.slice(0, 14);
    dashSheet.getRange(52, 8, limited.length, 4).setValues(limited);
  }
  
  SpreadsheetApp.getActiveSpreadsheet().toast('✅ Dashboard Refreshed!', 'Success', 2);
}

// ============================================
// SEARCH DASHBOARD (Same as before - keeping existing)
// ============================================

/**
 * Advanced Search function for HTML SearchDashboard.html
 * Called via google.script.run.advancedSearch(filters, sessionId)
 */
function advancedSearch(filters, sessionId) {
  // Validate session
  const session = getSessionData(sessionId);
  if (!session) {
    throw new Error('Session expired. Please login again.');
  }
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const confirmedSheet = ss.getSheetByName(CONFIG.SHEETS.CONFIRMED);
    
    if (!confirmedSheet) {
      return [];
    }
    
    const lastRow = confirmedSheet.getLastRow();
    if (lastRow < 2) {
      return [];
    }
    
    const allData = confirmedSheet.getRange(2, 1, lastRow - 1, 42).getValues();
    
    let filteredData = allData.filter(row => {
      // Single date filter
      if (filters.singleDate) {
        const rowDate = asDate(row[2]);
        const filterDate = new Date(filters.singleDate);
        if (!rowDate || stripTime(rowDate).getTime() !== stripTime(filterDate).getTime()) {
          return false;
        }
      }
      
      // Date range filter
      if (filters.dateFrom && filters.dateTo) {
        const rowDate = asDate(row[2]);
        const fromDate = stripTime(new Date(filters.dateFrom));
        const toDate = stripTime(new Date(filters.dateTo));
        if (!rowDate || stripTime(rowDate) < fromDate || stripTime(rowDate) > toDate) {
          return false;
        }
      }
      
      // Broker filter
      if (filters.broker) {
        const brokers = filters.broker.split(',').map(b => b.trim().toLowerCase());
        const rowBroker = String(row[4]).toLowerCase();
        if (!brokers.some(b => rowBroker.includes(b))) {
          return false;
        }
      }
      
      // Quality filter
      if (filters.quality) {
        const qualities = filters.quality.split(',').map(q => q.trim().toLowerCase());
        const rowQuality = String(row[5]).toLowerCase();
        if (!qualities.some(q => rowQuality.includes(q))) {
          return false;
        }
      }
      
      // Buyer filter
      if (filters.buyer) {
        const rowBuyer = String(row[11]).toLowerCase();
        if (!rowBuyer.includes(filters.buyer.toLowerCase())) {
          return false;
        }
      }
      
      // Year filter
      if (filters.year) {
        const rowDate = asDate(row[2]);
        if (!rowDate || rowDate.getFullYear().toString() !== filters.year) {
          return false;
        }
      }
      
      // Status filter
      if (filters.status) {
        const statuses = filters.status.split(',').map(s => s.trim().toLowerCase());
        const rowStatus = String(row[7]).toLowerCase();
        if (!statuses.some(s => rowStatus.includes(s))) {
          return false;
        }
      }
      
      return true;
    });
    
    // Sort results
    const sortBy = filters.sortBy || 'latest';
    filteredData.sort((a, b) => {
      switch(sortBy) {
        case 'latest':
          return (asDate(b[2]) || new Date(0)).getTime() - (asDate(a[2]) || new Date(0)).getTime();
        case 'oldest':
          return (asDate(a[2]) || new Date(0)).getTime() - (asDate(b[2]) || new Date(0)).getTime();
        case 'rtwe':
          return String(a[0]).localeCompare(String(b[0]));
        case 'value':
          return (Number(b[30]) || 0) - (Number(a[30]) || 0);
        default:
          return 0;
      }
    });
    
    // Map to result format
    const results = filteredData.map(row => {
      const rowDate = asDate(row[2]);
      return {
        rtweNo: row[0],
        costingNo: row[1],
        enqDate: rowDate ? Utilities.formatDate(rowDate, Session.getScriptTimeZone(), 'dd-MM-yyyy') : '',
        broker: row[4],
        quality: row[5],
        buyer: row[11] || '',
        status: row[7],
        value: row[30] || 0
      };
    });
    
    return results;
    
  } catch (error) {
    Logger.log('advancedSearch error: ' + error);
    throw new Error('Search failed: ' + error.message);
  }
}

// Helper function if not already defined
function asDate(val) {
  if (!val) return null;
  if (val instanceof Date) return val;
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  } catch(e) {
    return null;
  }
}

function stripTime(date) {
  if (!date) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}