// ============================================
// TELEGRAM
// Auto-organized from original code
// ============================================

function sendTelegramNotification(formData, designDetails, deliveryDate) {
  if (!TELEGRAM_CONFIG.ENABLED) {
    Logger.log('⚠️ Telegram not enabled');
    return;
  }
  
  const message = 
    '🎉 *New Order Confirmed*\n\n' +
    'RTWE: `' + formData.rtweNo + '`\n' +
    'Quality: ' + formData.quality + '\n' +
    'Broker: ' + formData.broker + '\n' +
    'MTR: ' + (formData.totalMTR || 'N/A') + '\n' +
    'Value: ₹' + (formData.totalOrderValue || 'N/A') + '\n\n' +
    '*Designs:*' + designDetails + '\n\n' +
    'Delivery: ' + deliveryDate + '\n\n' +
    '_RTW - Ramratan Techno Weave_';
  
  // Send to all registered Telegram users
  sendTelegramToUsers(message);
}

function sendTelegramMessage(chatId, message) {
  try {
    const url = 'https://api.telegram.org/bot' + TELEGRAM_CONFIG.BOT_TOKEN + '/sendMessage';
    
    const payload = {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown'
    };
    
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      Logger.log('✅ Telegram sent to chat: ' + chatId);
    } else {
      Logger.log('❌ Telegram error: ' + result.description);
    }
    
  } catch (error) {
    Logger.log('Telegram error: ' + error);
  }
}
function sendTelegramDocument(chatId, blob, fileName, caption) {
  if (!TELEGRAM_CONFIG.ENABLED) {
    Logger.log('⚠️ Telegram not enabled');
    return;
  }
  try {
    const url =
      'https://api.telegram.org/bot' + TELEGRAM_CONFIG.BOT_TOKEN + '/sendDocument';

    const formData = {
      chat_id: chatId,
      caption: caption || '',
      parse_mode: 'Markdown'
    };

    const options = {
      method: 'post',
      muteHttpExceptions: true,
      payload: Object.assign(formData, {
        document: blob.setName(fileName)
      })
    };

    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    if (result.ok) {
      Logger.log('✅ Telegram PDF sent to chat: ' + chatId);
    } else {
      Logger.log('❌ Telegram PDF error: ' + result.description);
    }
  } catch (error) {
    Logger.log('Telegram PDF error: ' + error);
  }
}

// ============================================
// EMAIL AUTOMATION - FIXED VERSION
// ============================================

function setupTelegramWebhook() {
  if (!TELEGRAM_CONFIG.ENABLED) {
    SpreadsheetApp.getUi().alert('Telegram not enabled!');
    return;
  }
  
  const webAppUrl = ScriptApp.getService().getUrl();
  const url = 'https://api.telegram.org/bot' + TELEGRAM_CONFIG.BOT_TOKEN + '/setWebhook';
  
  const payload = {
    url: webAppUrl
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const result = JSON.parse(response.getContentText());
  
  if (result.ok) {
    SpreadsheetApp.getUi().alert('✅ Telegram webhook setup complete!');
  } else {
    SpreadsheetApp.getUi().alert('❌ Webhook setup failed:\n\n' + result.description);
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

function viewTelegramUsers() {
  if (!refreshSession()) return;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const teleSheet = ss.getSheetByName('TELEGRAM_USERS');
  if (teleSheet) SpreadsheetApp.setActiveSheet(teleSheet);
}


// ============================================
// INITIALIZATION MESSAGE
// ============================================

/**
 * RTWE COMPLETE SYSTEM v3.0
 * 
 * INSTALLATION:
 * 1. Run: completeSystemSetup()
 * 2. Login with: admin / admin123
 * 3. Configure Twilio (when ready):
 *    - Add ACCOUNT_SID
 *    - Add AUTH_TOKEN
 *    - Set ENABLED = true
 * 4. Setup email triggers via menu
 * 
 * FEATURES:
 * ✅ Secure login with password hashing
 * ✅ User management (create/edit/view)
 * ✅ Email automation (Daily/Weekly/Monthly)
 * ✅ WhatsApp notifications (Twilio)
 * ✅ Voice call alerts (auto-trigger)
 * ✅ Telegram bot integration
 * ✅ QR code generation
 * ✅ Performance dashboard
 * ✅ Advanced search
 * ✅ All existing RTWE features (100% intact)
 * 
 * CODE SIZE: ~3,400 lines
 * ZERO COMPROMISE on existing functionality
 */


// ============================================
// EMERGENCY FIX - RUN THIS IF LOGIN FAILS
// ============================================