function myFunction() {
  
}
// ============================================
// EMAIL
// Auto-organized from original code
// ============================================

function sendTestEmail() {
  if (!refreshSession()) {
    SpreadsheetApp.getUi().alert('🔒 Please login first!');
    return;
  }
  
  try {
    const testReport = 
      '═══════════════════════════════════\n' +
      '🧪 TEST EMAIL FROM RTWE SYSTEM\n' +
      '═══════════════════════════════════\n\n' +
      'This is a test email to verify that\n' +
      'email automation is working correctly.\n\n' +
      'If you received this email, the\n' +
      'integration is working perfectly!\n\n' +
      '✅ Email Service: Active\n' +
      '✅ Configuration: Valid\n' +
      '✅ Delivery: Successful\n\n' +
      '═══════════════════════════════════\n' +
      'Sent: ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd-MMM-yyyy HH:mm:ss') + '\n\n' +
      CONFIG.USERS.COMPANY_NAME + '\n' +
      CONFIG.USERS.COMPANY_CITY + '\n' +
      '═══════════════════════════════════';
    
    GmailApp.sendEmail(
      CONFIG.USERS.OWNER_EMAIL,
      '🧪 RTWE System - Test Email',
      testReport,
      {
        name: 'RTWE System'
      }
    );
    
    logEmailReport('TEST', CONFIG.USERS.OWNER_EMAIL, 'SUCCESS');
    
    SpreadsheetApp.getUi().alert(
      '✅ Test Email Sent!',
      'Check your inbox:\n' + CONFIG.USERS.OWNER_EMAIL + '\n\n' +
      'If not received in 1 minute, check spam folder.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
    Logger.log('✅ Test email sent successfully');
    
  } catch (error) {
    Logger.log('❌ Test email error: ' + error);
    logEmailReport('TEST', CONFIG.USERS.OWNER_EMAIL, 'FAILED: ' + error.message);
    
    SpreadsheetApp.getUi().alert(
      '❌ Email Failed!',
      'Error: ' + error.message + '\n\n' +
      'Check:\n' +
      '1. Gmail service is authorized\n' +
      '2. Email address is correct\n' +
      '3. Script has Gmail permissions',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

// ============================================
// SETUP EMAIL TRIGGERS - FIXED
// ============================================

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

function viewEmailHistory() {
  if (!refreshSession()) return;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const histSheet = ss.getSheetByName('EMAIL_REPORT_HISTORY');
  if (histSheet) SpreadsheetApp.setActiveSheet(histSheet);
}