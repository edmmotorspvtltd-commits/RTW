// ============================================
// DIAGNOSTIC: Check Telegram Configuration
// Run this to verify everything is correct
// ============================================

function diagnoseTelegramSetup() {
  const ui = SpreadsheetApp.getUi();
  let report = '🔍 TELEGRAM SETUP DIAGNOSTIC\n\n';
  
  // Check 1: TELEGRAM_CONFIG exists
  try {
    if (typeof TELEGRAM_CONFIG === 'undefined') {
      report += '❌ TELEGRAM_CONFIG not found!\n';
      report += 'Action: Add TELEGRAM_CONFIG to Telegram.gs\n\n';
    } else {
      report += '✅ TELEGRAM_CONFIG found\n\n';
      
      // Check 2: Bot token exists
      if (!TELEGRAM_CONFIG.BOT_TOKEN) {
        report += '❌ BOT_TOKEN missing!\n';
        report += 'Action: Add BOT_TOKEN to TELEGRAM_CONFIG\n\n';
      } else {
        report += '✅ BOT_TOKEN configured\n';
        report += 'Token length: ' + TELEGRAM_CONFIG.BOT_TOKEN.length + ' chars\n\n';
        
        // Check 3: Bot token format
        if (TELEGRAM_CONFIG.BOT_TOKEN.indexOf(':') === -1) {
          report += '⚠️ BOT_TOKEN format looks wrong\n';
          report += 'Should be: 123456789:ABCdefGHIjklMNOpqrsTUVwxyz\n\n';
        } else {
          report += '✅ BOT_TOKEN format looks correct\n\n';
        }
      }
      
      // Check 4: Bot enabled
      if (TELEGRAM_CONFIG.ENABLED === false) {
        report += '⚠️ Telegram is DISABLED\n';
        report += 'Action: Set ENABLED: true\n\n';
      } else {
        report += '✅ Telegram is ENABLED\n\n';
      }
    }
  } catch (error) {
    report += '❌ Error checking TELEGRAM_CONFIG: ' + error.message + '\n\n';
  }
  
  // Check 5: Web App URL
  try {
    const webAppUrl = ScriptApp.getService().getUrl();
    
    if (!webAppUrl || webAppUrl === 'null') {
      report += '❌ Web App NOT deployed!\n';
      report += 'Action: Deploy as Web App\n\n';
    } else {
      report += '✅ Web App deployed\n';
      report += 'URL: ' + webAppUrl + '\n\n';
    }
  } catch (error) {
    report += '❌ Error checking Web App: ' + error.message + '\n\n';
  }
  
  // Check 6: Test bot connection
  if (typeof TELEGRAM_CONFIG !== 'undefined' && TELEGRAM_CONFIG.BOT_TOKEN) {
    try {
      report += '🤖 Testing bot connection...\n';
      
      const url = 'https://api.telegram.org/bot' + TELEGRAM_CONFIG.BOT_TOKEN + '/getMe';
      const response = UrlFetchApp.fetch(url);
      const result = JSON.parse(response.getContentText());
      
      if (result.ok) {
        report += '✅ Bot is ACTIVE!\n';
        report += 'Bot Name: ' + result.result.first_name + '\n';
        report += 'Username: @' + result.result.username + '\n';
        report += 'Bot ID: ' + result.result.id + '\n\n';
      } else {
        report += '❌ Bot connection failed!\n';
        report += 'Error: ' + result.description + '\n\n';
      }
    } catch (error) {
      report += '❌ Bot connection error!\n';
      report += 'Error: ' + error.message + '\n';
      report += '\nPossible reasons:\n';
      report += '• Bot token is incorrect\n';
      report += '• Bot was deleted\n';
      report += '• Network error\n\n';
    }
  }
  
  // Check 7: Required functions exist
  const requiredFunctions = [
    'processTelegramMessage',
    'sendTelegramMessage',
    'setupTelegramWebhook'
  ];
  
  report += '📋 Checking required functions:\n';
  
  requiredFunctions.forEach(funcName => {
    if (typeof eval(funcName) === 'function') {
      report += '✅ ' + funcName + '\n';
    } else {
      report += '❌ ' + funcName + ' NOT FOUND\n';
    }
  });
  
  report += '\n';
  
  // Final recommendation
  report += '━━━━━━━━━━━━━━━━━━━━━\n';
  report += '📊 DIAGNOSIS COMPLETE\n';
  report += '━━━━━━━━━━━━━━━━━━━━━\n\n';
  
  if (report.indexOf('❌') > -1) {
    report += '⚠️ Issues found! Fix the items marked with ❌ above.';
  } else {
    report += '✅ All checks passed! Webhook should work.';
  }
  
  Logger.log(report);
  ui.alert('Telegram Setup Diagnostic', report, ui.ButtonSet.OK);
  
  return report;
}

/**
 * Simple test - just try to get bot info
 */
function testBotToken() {
  const ui = SpreadsheetApp.getUi();
  
  if (typeof TELEGRAM_CONFIG === 'undefined' || !TELEGRAM_CONFIG.BOT_TOKEN) {
    ui.alert('❌ Error', 'TELEGRAM_CONFIG or BOT_TOKEN not found!', ui.ButtonSet.OK);
    return;
  }
  
  try {
    const url = 'https://api.telegram.org/bot' + TELEGRAM_CONFIG.BOT_TOKEN + '/getMe';
    const response = UrlFetchApp.fetch(url);
    const result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      ui.alert(
        '✅ Bot Token Valid!',
        'Bot Name: ' + result.result.first_name + '\n' +
        'Username: @' + result.result.username + '\n' +
        'Bot ID: ' + result.result.id,
        ui.ButtonSet.OK
      );
    } else {
      ui.alert(
        '❌ Bot Token Invalid!',
        'Error: ' + result.description,
        ui.ButtonSet.OK
      );
    }
  } catch (error) {
    ui.alert(
      '❌ Connection Error!',
      'Could not connect to Telegram API\n\n' +
      'Error: ' + error.message + '\n\n' +
      'Check your bot token!',
      ui.ButtonSet.OK
    );
  }
}


function checkTelegramFunctions() {
  const functions = [
    'processTelegramMessage',
    'sendTelegramMessage',
    'sendTelegramDocument',
    'handleRTWERequest',
    'getRTWEData',
    'setupTelegramWebhook',
    'isTelegramUserActive'
  ];
  
  let report = 'Function Check:\n\n';
  
  functions.forEach(funcName => {
    try {
      if (typeof eval(funcName) === 'function') {
        report += '✅ ' + funcName + '\n';
      } else {
        report += '❌ ' + funcName + ' NOT FOUND\n';
      }
    } catch (e) {
      report += '❌ ' + funcName + ' ERROR: ' + e + '\n';
    }
  });
  
  Logger.log(report);
  SpreadsheetApp.getUi().alert('Function Check', report, SpreadsheetApp.getUi().ButtonSet.OK);
}




function getWebhookInfo() {
  try {
    const url = 'https://api.telegram.org/bot' + TELEGRAM_CONFIG.BOT_TOKEN + '/getWebhookInfo';
    const response = UrlFetchApp.fetch(url);
    const result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      const info = result.result;
      
      const message = 
        '🔗 Webhook Status\n\n' +
        'URL: ' + info.url + '\n' +
        'Pending: ' + info.pending_update_count + '\n' +
        'Last Error: ' + (info.last_error_message || '✅ None') + '\n' +
        'Last Error Date: ' + (info.last_error_date ? new Date(info.last_error_date * 1000) : 'Never');
      
      Logger.log(message);
      SpreadsheetApp.getUi().alert('Webhook Info', message, SpreadsheetApp.getUi().ButtonSet.OK);
    }
  } catch (error) {
    SpreadsheetApp.getUi().alert('Error', error.message, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

function testProcessMessage() {
  const testMessage = {
    chat: { id: 355267093 },
    from: { username: 'shekhar', first_name: 'Shekhar' },
    text: '/start'
  };
  
  try {
    processTelegramMessage(testMessage);
    SpreadsheetApp.getUi().alert('✅ Test Complete', 'Check Telegram for message!', SpreadsheetApp.getUi().ButtonSet.OK);
  } catch (error) {
    SpreadsheetApp.getUi().alert('❌ Error', error.message + '\n\n' + error.stack, SpreadsheetApp.getUi().ButtonSet.OK);
  }
}