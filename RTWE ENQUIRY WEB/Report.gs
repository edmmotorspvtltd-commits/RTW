// ============================================
// REPORTS - ALL FUNCTIONS FROM ORIGINAL
// ============================================

function sendDailyEmailReport() {
  try {
    Logger.log('Starting daily email report...');
    
    const report = generateDailyReport();
    const today = new Date();
    const dateStr = Utilities.formatDate(today, Session.getScriptTimeZone(), 'dd-MMM-yyyy');
    const subject = 'RTWE Daily Summary - ' + dateStr;
    
    // Send to recipients
    const recipients = EMAIL_CONFIG.DAILY.recipients;
    
    recipients.forEach(email => {
      try {
        GmailApp.sendEmail(
          email,
          subject,
          report,
          {
            name: 'RTWE System'
          }
        );
        Logger.log('✅ Daily email sent to: ' + email);
      } catch (emailError) {
        Logger.log('❌ Failed to send to ' + email + ': ' + emailError);
      }
    });
    
    logEmailReport('DAILY', recipients.join(', '), 'SUCCESS');
    
    Logger.log('✅ Daily email report completed');
    
  } catch (error) {
    Logger.log('❌ Daily email error: ' + error);
    logEmailReport('DAILY', 'ERROR', 'FAILED: ' + error.message);
    
    // Send error alert to owner
    try {
      GmailApp.sendEmail(
        CONFIG.USERS.OWNER_EMAIL,
        '❌ RTWE System - Daily Email Failed',
        'Error occurred while sending daily email report:\n\n' + error.message + '\n\n' + error.stack
      );
    } catch (alertError) {
      Logger.log('Failed to send error alert: ' + alertError);
    }
  }
}

function sendWeeklyEmailReport() {
  try {
    Logger.log('Starting weekly email report...');
    
    const report = generateWeeklyReport();
    const today = new Date();
    const weekNum = Utilities.formatDate(today, Session.getScriptTimeZone(), 'w');
    const subject = 'RTWE Weekly Report - Week ' + weekNum;
    
    const recipients = EMAIL_CONFIG.WEEKLY.recipients;
    
    recipients.forEach(email => {
      try {
        GmailApp.sendEmail(
          email,
          subject,
          report,
          {
            name: 'RTWE System'
          }
        );
        Logger.log('✅ Weekly email sent to: ' + email);
      } catch (emailError) {
        Logger.log('❌ Failed to send to ' + email + ': ' + emailError);
      }
    });
    
    logEmailReport('WEEKLY', recipients.join(', '), 'SUCCESS');
    
    Logger.log('✅ Weekly email report completed');
    
  } catch (error) {
    Logger.log('❌ Weekly email error: ' + error);
    logEmailReport('WEEKLY', 'ERROR', 'FAILED: ' + error.message);
    
    try {
      GmailApp.sendEmail(
        CONFIG.USERS.OWNER_EMAIL,
        '❌ RTWE System - Weekly Email Failed',
        'Error occurred:\n\n' + error.message
      );
    } catch (alertError) {
      Logger.log('Failed to send error alert: ' + alertError);
    }
  }
}

function sendMonthlyEmailReport() {
  try {
    Logger.log('Starting monthly email report...');
    
    const report = generateMonthlyReport();
    const today = new Date();
    const month = Utilities.formatDate(today, Session.getScriptTimeZone(), 'MMMM');
    const year = Utilities.formatDate(today, Session.getScriptTimeZone(), 'yyyy');
    const subject = 'RTWE Monthly Report - ' + month + ' ' + year;
    
    const recipients = EMAIL_CONFIG.MONTHLY.recipients;
    
    recipients.forEach(email => {
      try {
        GmailApp.sendEmail(
          email,
          subject,
          report,
          {
            name: 'RTWE System'
          }
        );
        Logger.log('✅ Monthly email sent to: ' + email);
      } catch (emailError) {
        Logger.log('❌ Failed to send to ' + email + ': ' + emailError);
      }
    });
    
    logEmailReport('MONTHLY', recipients.join(', '), 'SUCCESS');
    
    Logger.log('✅ Monthly email report completed');
    
  } catch (error) {
    Logger.log('❌ Monthly email error: ' + error);
    logEmailReport('MONTHLY', 'ERROR', 'FAILED: ' + error.message);
    
    try {
      GmailApp.sendEmail(
        CONFIG.USERS.OWNER_EMAIL,
        '❌ RTWE System - Monthly Email Failed',
        'Error occurred:\n\n' + error.message
      );
    } catch (alertError) {
      Logger.log('Failed to send error alert: ' + alertError);
    }
  }
}

// ============================================
// EMAIL REPORT GENERATORS - FIXED
// ============================================

function generateDailyReport() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const today = new Date();
    const todayStrip = stripTime(today);
    
    let confirmedToday = 0;
    let canceledToday = 0;
    let pendingToday = 0;
    let pendingApprovedToday = 0;
    
    // Count from CONFIRMED sheet
    const confirmedSheet = ss.getSheetByName(CONFIG.SHEETS.CONFIRMED);
    if (confirmedSheet && confirmedSheet.getLastRow() > 1) {
      const data = confirmedSheet.getDataRange().getValues();
      
      for (let i = 1; i < data.length; i++) {
        const approvedDate = asDate(data[i][8]); // Column I - Approved Date
        if (approvedDate && stripTime(approvedDate).getTime() === todayStrip.getTime()) {
          confirmedToday++;
        }
      }
    }
    
    // Count from CLOSED sheet
    const closedSheet = ss.getSheetByName(CONFIG.SHEETS.CLOSED);
    if (closedSheet && closedSheet.getLastRow() > 1) {
      const data = closedSheet.getDataRange().getValues();
      
      for (let i = 1; i < data.length; i++) {
        const enqDate = asDate(data[i][2]); // Column C - Enquiry Date
        if (enqDate && stripTime(enqDate).getTime() === todayStrip.getTime()) {
          canceledToday++;
        }
      }
    }
    
    // Count from PENDING sheet
    const pendingSheet = ss.getSheetByName(CONFIG.SHEETS.PENDING);
    if (pendingSheet && pendingSheet.getLastRow() > 1) {
      const data = pendingSheet.getDataRange().getValues();
      
      for (let i = 1; i < data.length; i++) {
        const enqDate = asDate(data[i][2]);
        if (enqDate && stripTime(enqDate).getTime() === todayStrip.getTime()) {
          pendingToday++;
        }
      }
    }
    
    // Count from PENDING_APPROVED sheet
    const pendApprSheet = ss.getSheetByName(CONFIG.SHEETS.PENDING_APPROVED);
    if (pendApprSheet && pendApprSheet.getLastRow() > 1) {
      const data = pendApprSheet.getDataRange().getValues();
      
      for (let i = 1; i < data.length; i++) {
        const enqDate = asDate(data[i][2]);
        if (enqDate && stripTime(enqDate).getTime() === todayStrip.getTime()) {
          pendingApprovedToday++;
        }
      }
    }
    
    const totalActivity = confirmedToday + canceledToday + pendingToday + pendingApprovedToday;
    
    const report = 
      '═══════════════════════════════════\n' +
      '   RTWE DAILY SUMMARY REPORT\n' +
      '═══════════════════════════════════\n\n' +
      'Date: ' + Utilities.formatDate(today, Session.getScriptTimeZone(), 'dd-MMM-yyyy (EEEE)') + '\n\n' +
      '📊 ORDER STATUS TODAY:\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
      '✅ Confirmed Orders: ' + confirmedToday + '\n' +
      '❌ Canceled Orders: ' + canceledToday + '\n' +
      '⏳ Pending Orders: ' + pendingToday + '\n' +
      '📋 Pending Approved: ' + pendingApprovedToday + '\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
      '📈 Total Activity: ' + totalActivity + ' orders\n\n' +
      '═══════════════════════════════════\n' +
      'This is an automated daily report.\n' +
      'Generated by RTWE System v3.0\n\n' +
      CONFIG.USERS.COMPANY_NAME + '\n' +
      CONFIG.USERS.COMPANY_CITY + '\n' +
      '═══════════════════════════════════';
    
    return report;
    
  } catch (error) {
    Logger.log('Error generating daily report: ' + error);
    return 'Error generating daily report: ' + error.message;
  }
}

function generateWeeklyReport() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    let confirmedWeek = 0;
    let canceledWeek = 0;
    let totalValue = 0;
    let totalMTR = 0;
    const brokers = {};
    
    const confirmedSheet = ss.getSheetByName(CONFIG.SHEETS.CONFIRMED);
    if (confirmedSheet && confirmedSheet.getLastRow() > 1) {
      const data = confirmedSheet.getDataRange().getValues();
      
      for (let i = 1; i < data.length; i++) {
        const approvedDate = asDate(data[i][8]);
        
        if (approvedDate && approvedDate >= weekAgo && approvedDate <= today) {
          confirmedWeek++;
          
          const orderValue = Number(data[i][30]) || 0;
          const mtr = Number(data[i][29]) || 0;
          totalValue += orderValue;
          totalMTR += mtr;
          
          const broker = String(data[i][4] || 'Unknown');
          brokers[broker] = (brokers[broker] || 0) + 1;
        }
      }
    }
    
    const closedSheet = ss.getSheetByName(CONFIG.SHEETS.CLOSED);
    if (closedSheet && closedSheet.getLastRow() > 1) {
      const data = closedSheet.getDataRange().getValues();
      
      for (let i = 1; i < data.length; i++) {
        const enqDate = asDate(data[i][2]);
        if (enqDate && enqDate >= weekAgo && enqDate <= today) {
          canceledWeek++;
        }
      }
    }
    
    let brokerSummary = '';
    const topBrokers = Object.keys(brokers)
      .sort((a, b) => brokers[b] - brokers[a])
      .slice(0, 5);
    
    topBrokers.forEach(broker => {
      brokerSummary += '• ' + broker + ': ' + brokers[broker] + ' orders\n';
    });
    
    const avgOrderValue = confirmedWeek > 0 ? (totalValue / confirmedWeek) : 0;
    
    const report = 
      '═══════════════════════════════════\n' +
      '   RTWE WEEKLY REPORT\n' +
      '═══════════════════════════════════\n\n' +
      'Week Period:\n' +
      Utilities.formatDate(weekAgo, Session.getScriptTimeZone(), 'dd-MMM-yyyy') + ' to ' +
      Utilities.formatDate(today, Session.getScriptTimeZone(), 'dd-MMM-yyyy') + '\n\n' +
      '📊 WEEKLY SUMMARY:\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
      '✅ Confirmed Orders: ' + confirmedWeek + '\n' +
      '❌ Canceled Orders: ' + canceledWeek + '\n' +
      '💰 Total Order Value: ₹' + totalValue.toLocaleString('en-IN', {maximumFractionDigits: 2}) + '\n' +
      '📏 Total MTR: ' + totalMTR.toLocaleString('en-IN', {maximumFractionDigits: 2}) + '\n' +
      '📈 Average Order Value: ₹' + avgOrderValue.toLocaleString('en-IN', {maximumFractionDigits: 2}) + '\n\n' +
      '🏆 TOP BROKERS THIS WEEK:\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
      (brokerSummary || '• No data available\n') + '\n' +
      '═══════════════════════════════════\n' +
      'Login to view detailed analytics.\n\n' +
      'Generated by RTWE System v3.0\n' +
      CONFIG.USERS.COMPANY_NAME + ', ' + CONFIG.USERS.COMPANY_CITY + '\n' +
      '═══════════════════════════════════';
    
    return report;
    
  } catch (error) {
    Logger.log('Error generating weekly report: ' + error);
    return 'Error generating weekly report: ' + error.message;
  }
}

function generateMonthlyReport() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    let confirmedMonth = 0;
    let totalValue = 0;
    let totalMTR = 0;
    let totalTAGA = 0;
    const qualities = {};
    
    const confirmedSheet = ss.getSheetByName(CONFIG.SHEETS.CONFIRMED);
    if (confirmedSheet && confirmedSheet.getLastRow() > 1) {
      const data = confirmedSheet.getDataRange().getValues();
      
      for (let i = 1; i < data.length; i++) {
        const approvedDate = asDate(data[i][8]);
        
        if (approvedDate && approvedDate >= firstDay && approvedDate <= lastDay) {
          confirmedMonth++;
          
          totalValue += Number(data[i][30]) || 0;
          totalMTR += Number(data[i][29]) || 0;
          totalTAGA += Number(data[i][27]) || 0;
          
          const quality = String(data[i][5] || 'Unknown');
          qualities[quality] = (qualities[quality] || 0) + 1;
        }
      }
    }
    
    let qualitySummary = '';
    const topQualities = Object.keys(qualities)
      .sort((a, b) => qualities[b] - qualities[a])
      .slice(0, 5);
    
    topQualities.forEach(quality => {
      qualitySummary += '• ' + quality + ': ' + qualities[quality] + ' orders\n';
    });
    
    const avgOrderValue = confirmedMonth > 0 ? (totalValue / confirmedMonth) : 0;
    const avgMTRPerOrder = confirmedMonth > 0 ? (totalMTR / confirmedMonth) : 0;
    
    const report = 
      '═══════════════════════════════════\n' +
      '   RTWE MONTHLY REPORT + KPI\n' +
      '═══════════════════════════════════\n\n' +
      'Month: ' + Utilities.formatDate(today, Session.getScriptTimeZone(), 'MMMM yyyy') + '\n' +
      'Period: ' + Utilities.formatDate(firstDay, Session.getScriptTimeZone(), 'dd-MMM') + 
      ' to ' + Utilities.formatDate(lastDay, Session.getScriptTimeZone(), 'dd-MMM-yyyy') + '\n\n' +
      '📊 KEY PERFORMANCE INDICATORS:\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
      '✅ Total Orders: ' + confirmedMonth + '\n' +
      '💰 Total Revenue: ₹' + totalValue.toLocaleString('en-IN', {maximumFractionDigits: 2}) + '\n' +
      '📏 Total MTR: ' + totalMTR.toLocaleString('en-IN', {maximumFractionDigits: 2}) + '\n' +
      '🎯 Total TAGA: ' + totalTAGA.toLocaleString('en-IN') + '\n' +
      '📈 Avg Order Value: ₹' + avgOrderValue.toLocaleString('en-IN', {maximumFractionDigits: 2}) + '\n' +
      '📊 Avg MTR/Order: ' + avgMTRPerOrder.toLocaleString('en-IN', {maximumFractionDigits: 2}) + '\n\n' +
      '🏆 TOP QUALITIES THIS MONTH:\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
      (qualitySummary || '• No data available\n') + '\n' +
      '═══════════════════════════════════\n' +
      'Login to view complete dashboard:\n' +
      '• Broker Performance\n' +
      '• Quality Analysis\n' +
      '• Monthly Trends\n' +
      '• Payment Analytics\n\n' +
      'Generated by RTWE System v3.0\n' +
      CONFIG.USERS.COMPANY_NAME + ', ' + CONFIG.USERS.COMPANY_CITY + '\n' +
      '═══════════════════════════════════';
    
    return report;
    
  } catch (error) {
    Logger.log('Error generating monthly report: ' + error);
    return 'Error generating monthly report: ' + error.message;
  }
}

// ============================================
// EMAIL LOGGING - FIXED
// ============================================

function logEmailReport(type, recipients, status) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = ss.getSheetByName('EMAIL_REPORT_HISTORY');
    
    if (!logSheet) {
      logSheet = ss.insertSheet('EMAIL_REPORT_HISTORY');
      logSheet.getRange('A1:F1').setValues([[
        'Timestamp', 'Type', 'Recipients', 'Subject', 'Status', 'Error'
      ]]).setFontWeight('bold')
        .setBackground('#4A90E2')
        .setFontColor('white');
      logSheet.setFrozenRows(1);
    }
    
    const subject = type + ' Report - ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd-MMM-yyyy');
    const errorMsg = status.startsWith('FAILED') ? status : '';
    
    logSheet.appendRow([
      new Date(),
      type,
      recipients,
      subject,
      status,
      errorMsg
    ]);
    
    // Format date column
    const lastRow = logSheet.getLastRow();
    logSheet.getRange(lastRow, 1).setNumberFormat('dd-mmm-yyyy hh:mm:ss');
    
  } catch (error) {
    Logger.log('Error logging email report: ' + error);
  }
}

// ============================================
// TEST EMAIL FUNCTION - FIXED
// ============================================