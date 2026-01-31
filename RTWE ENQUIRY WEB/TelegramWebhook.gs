// ============================================
// TELEGRAM WEBHOOK SETUP - CORRECTED VERSION
// ✅ Forces /exec URL usage for production
// ============================================

// ============================================
// 🎯 STEP 1: SETUP WEBHOOK (PRODUCTION)
// ============================================

function setupTelegramWebhook() {
  const ui = SpreadsheetApp.getUi();
  
  // ✅ HARDCODED /exec URL - REPLACE WITH YOUR ACTUAL URL
  //const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzSFZ5s_60U4Hrum-BnkxP3r6WXGJUL0-Lzzber227ZYsKMxN4wbIX-GU8qgWE1vGck/exec';//
  
  // Validate TELEGRAM_CONFIG exists
  if (typeof TELEGRAM_CONFIG === 'undefined' || !TELEGRAM_CONFIG.BOT_TOKEN) {
    ui.alert(
      '❌ Configuration Error',
      'TELEGRAM_CONFIG or BOT_TOKEN not found!\n\n' +
      'Please ensure TELEGRAM_CONFIG is defined in your script.',
      ui.ButtonSet.OK
    );
    return;
  }
  
  // ✅ CRITICAL: Verify URL ends with /exec
  if (!WEB_APP_URL.endsWith('/exec')) {
    ui.alert(
      '⚠️ CRITICAL WARNING',
      'URL must end with /exec for production!\n\n' +
      'Current URL: ' + WEB_APP_URL + '\n\n' +
      'Please update WEB_APP_URL in code.',
      ui.ButtonSet.OK
    );
    return;
  }
  
  const token = TELEGRAM_CONFIG.BOT_TOKEN;
  
  Logger.log('============================================');
  Logger.log('🚀 SETTING UP TELEGRAM WEBHOOK');
  Logger.log('============================================');
  Logger.log('Using URL: ' + WEB_APP_URL);
  Logger.log('URL Format: ✅ /exec (Production)');
  Logger.log('============================================');
  
  try {
    // Step 1: Delete old webhook
    Logger.log('Step 1: Deleting old webhook...');
    
    const deleteUrl = 'https://api.telegram.org/bot' + token + '/deleteWebhook';
    const deleteResponse = UrlFetchApp.fetch(deleteUrl, {
      method: 'post',
      muteHttpExceptions: true
    });
    
    const deleteResult = JSON.parse(deleteResponse.getContentText());
    Logger.log('Delete result: ' + JSON.stringify(deleteResult));
    
    // Step 2: Wait 2 seconds for cleanup
    Utilities.sleep(2000);
    
    // Step 3: Set new webhook with /exec URL
    Logger.log('Step 2: Setting new webhook...');
    
    const setUrl = 'https://api.telegram.org/bot' + token + '/setWebhook';
    const setResponse = UrlFetchApp.fetch(setUrl, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        url: WEB_APP_URL,
        drop_pending_updates: true,  // ✅ Clear old pending updates
        max_connections: 40,           // ✅ Optimize for production
        allowed_updates: ['message', 'callback_query']  // ✅ Only needed updates
      }),
      muteHttpExceptions: true
    });
    
    const setResult = JSON.parse(setResponse.getContentText());
    Logger.log('Set webhook result: ' + JSON.stringify(setResult));
    Logger.log('============================================');
    
    if (setResult.ok) {
      ui.alert(
        '✅ WEBHOOK CONFIGURED SUCCESSFULLY!',
        '━━━━━━━━━━━━━━━━━━━━━━━\n' +
        'Webhook URL:\n' + WEB_APP_URL + '\n\n' +
        'Format: ✅ /exec (Production)\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        '🎯 NEXT STEPS:\n\n' +
        '1. Open Telegram\n' +
        '2. Send: /start to your bot\n' +
        '3. Bot should respond instantly!\n\n' +
        '📊 To verify, run: getWebhookInfo()',
        ui.ButtonSet.OK
      );
    } else {
      ui.alert(
        '❌ WEBHOOK SETUP FAILED',
        'Error from Telegram:\n' + setResult.description + '\n\n' +
        '🔍 Common Issues:\n' +
        '• Bot token incorrect\n' +
        '• Web App not deployed\n' +
        '• URL not accessible\n\n' +
        'Check execution log for details.',
        ui.ButtonSet.OK
      );
    }
    
  } catch (error) {
    Logger.log('❌ Setup error: ' + error.message);
    Logger.log('Stack trace: ' + error.stack);
    ui.alert(
      '❌ SETUP ERROR',
      'Error: ' + error.message + '\n\n' +
      'Check View → Logs for details.',
      ui.ButtonSet.OK
    );
  }
}

// ============================================
// 🔍 STEP 2: CHECK WEBHOOK STATUS
// ============================================

function getWebhookInfo() {
  const ui = SpreadsheetApp.getUi();
  
  if (typeof TELEGRAM_CONFIG === 'undefined' || !TELEGRAM_CONFIG.BOT_TOKEN) {
    ui.alert('❌ TELEGRAM_CONFIG not found');
    return;
  }
  
  try {
    const url = 'https://api.telegram.org/bot' + TELEGRAM_CONFIG.BOT_TOKEN + '/getWebhookInfo';
    const response = UrlFetchApp.fetch(url);
    const result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      const info = result.result;
      
      // Analyze status
      const isActive = info.url ? '✅ ACTIVE' : '❌ NOT SET';
      const urlFormat = info.url && info.url.endsWith('/exec') ? '✅ /exec (Correct)' : '❌ /dev (Wrong!)';
      const hasErrors = info.last_error_message ? '❌ YES' : '✅ NO';
      const pendingStatus = info.pending_update_count === 0 ? '✅ 0 (Good)' : '⚠️ ' + info.pending_update_count;
      
      const message = 
        '━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '🔗 TELEGRAM WEBHOOK STATUS\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        'Status: ' + isActive + '\n\n' +
        'Webhook URL:\n' + (info.url || 'Not configured') + '\n\n' +
        'URL Format: ' + urlFormat + '\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━\n' +
        '📊 HEALTH CHECK\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        'Pending Updates: ' + pendingStatus + '\n' +
        'Has Errors: ' + hasErrors + '\n\n' +
        'Last Error:\n' + (info.last_error_message || '✅ None') + '\n\n' +
        'Last Error Time:\n' + 
        (info.last_error_date ? 
          new Date(info.last_error_date * 1000).toLocaleString('en-IN', {timeZone: 'Asia/Kolkata'}) + ' IST' 
          : 'Never') + '\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        (info.url && !info.url.endsWith('/exec') ? 
          '⚠️ ACTION REQUIRED:\n\n' +
          'Webhook using /dev URL!\n\n' +
          'Fix:\n' +
          '1. Run setupTelegramWebhook()\n' +
          '2. This will set /exec URL'
          : 
          info.pending_update_count > 0 ?
            '⚠️ ACTION REQUIRED:\n\n' +
            'Pending updates found!\n\n' +
            'Fix: Run clearPendingUpdates()'
            :
            '✅ WEBHOOK HEALTHY!'
        );
      
      Logger.log(message);
      ui.alert('Telegram Webhook Info', message, ui.ButtonSet.OK);
      
    } else {
      ui.alert('❌ Error', 'Failed to get webhook info', ui.ButtonSet.OK);
    }
    
  } catch (error) {
    Logger.log('Error: ' + error.message);
    ui.alert('❌ Error', error.message, ui.ButtonSet.OK);
  }
}

// ============================================
// 🧹 STEP 3: CLEAR PENDING UPDATES (IF NEEDED)
// ============================================

function clearPendingUpdates() {
  const ui = SpreadsheetApp.getUi();
  
  const confirm = ui.alert(
    '⚠️ Clear Pending Updates',
    'This will drop all pending Telegram updates.\n\n' +
    'Use only if webhook has failed updates.\n\n' +
    'Continue?',
    ui.ButtonSet.YES_NO
  );
  
  if (confirm !== ui.Button.YES) {
    return;
  }
  
  if (typeof TELEGRAM_CONFIG === 'undefined' || !TELEGRAM_CONFIG.BOT_TOKEN) {
    ui.alert('❌ TELEGRAM_CONFIG not found');
    return;
  }
  
  try {
    // ✅ Use hardcoded /exec URL
   // const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzSFZ5s_60U4Hrum-BnkxP3r6WXGJUL0-Lzzber227ZYsKMxN4wbIX-GU8qgWE1vGck/exec';//
    
    const url = 'https://api.telegram.org/bot' + TELEGRAM_CONFIG.BOT_TOKEN + '/setWebhook';
    
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        url: WEB_APP_URL,
        drop_pending_updates: true
      })
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      ui.alert(
        '✅ Success',
        'Pending updates cleared!\n\n' +
        'Webhook reset with /exec URL.\n\n' +
        'Test your bot now.',
        ui.ButtonSet.OK
      );
    } else {
      ui.alert('❌ Failed', result.description, ui.ButtonSet.OK);
    }
    
  } catch (error) {
    ui.alert('❌ Error', error.message, ui.ButtonSet.OK);
  }
}

// ============================================
// 📋 HELPER: GET CURRENT URL (FOR DEBUGGING)
// ============================================

function getCurrentDeploymentURL() {
  const url = ScriptApp.getService().getUrl();
  
  Logger.log('====================================');
  Logger.log('CURRENT DEPLOYMENT URL:');
  Logger.log(url);
  Logger.log('====================================');
  Logger.log('Format: ' + (url && url.endsWith('/exec') ? '✅ /exec' : '⚠️ /dev'));
  
  SpreadsheetApp.getUi().alert(
    '📊 Current Deployment URL',
    'URL:\n' + url + '\n\n' +
    'Format: ' + (url && url.endsWith('/exec') ? '✅ /exec' : '⚠️ /dev') + '\n\n' +
    'Note: This shows the currently executing URL.\n' +
    'For webhook, we use hardcoded /exec URL.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
  
  return url;
}

// ============================================
// 🎯 IMPORTANT NOTES:
// ============================================
/*
1. ✅ HARDCODED URL: 
   - Webhook always uses /exec URL
   - No dependency on ScriptApp.getService().getUrl()
   
2. ✅ PRODUCTION READY:
   - Clears pending updates
   - Optimized max_connections
   - Only receives needed update types
   
3. ✅ ERROR HANDLING:
   - Detailed logging
   - User-friendly alerts
   - Status checking included

4. 🔧 TO USE:
   - Update WEB_APP_URL with your /exec URL
   - Ensure TELEGRAM_CONFIG is defined
   - Run setupTelegramWebhook()
   - Verify with getWebhookInfo()
*/