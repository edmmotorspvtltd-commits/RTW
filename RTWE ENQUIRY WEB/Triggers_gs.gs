// ============================================
// TRIGGERS - COMPLETE FIXED VERSION
// ============================================

function onEdit(e) {
  if (!e) return;
  
  // 🔐 LOGIN GUARD (HARD BLOCK)
  if (!isUserLoggedIn()) {
    const oldVal = (typeof e.oldValue === 'undefined') ? '' : e.oldValue;
    e.range.setValue(oldVal);

    SpreadsheetApp.getActive().toast(
      '🔒 Login required. Edit reverted.',
      'Access Denied',
      4
    );

    return;
  }

  const sheet = e.range.getSheet();
  const sheetName = sheet.getName();
  
  if (sheetName === CONFIG.SHEETS.SEARCH_DASHBOARD) {
    handleSearchDashboardClick(e);
    return;
  }
  
  if (sheetName !== CONFIG.SHEETS.FORM) return;
  
  const editedCell = e.range.getA1Notation();
  
  try {
    if (editedCell === CONFIG.CELLS.ENTRY_TYPE) {
      onEntryTypeChangeFixed();
    }
    
    if (editedCell === CONFIG.CELLS.ORDER_STATUS) {
      onOrderStatusChangeFixed();
    }
    
    if (editedCell === CONFIG.CELLS.SELECT_PENDING_APPROVED) {
      loadPendingApprovedEnquiry();
    }
    
    if (editedCell === CONFIG.CELLS.SELECT_EDIT) {
      loadEditEnquiry();
    }
    
    if (editedCell === CONFIG.CELLS.SEARCH_RTWE) {
      onSearchRTWEChange();
    }

    if (editedCell === CONFIG.CELLS.RTWE_NO) {
      autoSetCostingFromRTWE();
    }
    
    autoAddToMasterData(editedCell, e.range.getValue());
    
    const recalcTriggerCells = [
      CONFIG.CELLS.TAGA1, CONFIG.CELLS.TAGA2, CONFIG.CELLS.TAGA3,
      CONFIG.CELLS.TAGA4, CONFIG.CELLS.TAGA5, CONFIG.CELLS.TAGA6,
      CONFIG.CELLS.COUNT_METER,
      CONFIG.CELLS.FINAL_RATE
    ];
    
    if (recalcTriggerCells.includes(editedCell)) {
      const formSheet = sheet;
      const tTag = formSheet.getRange(CONFIG.CELLS.TOTAL_ORDER_TAGA);
      const tMtr = formSheet.getRange(CONFIG.CELLS.TOTAL_MTR);
      const tVal = formSheet.getRange(CONFIG.CELLS.TOTAL_ORDER_VALUE);
      const siz  = formSheet.getRange(CONFIG.CELLS.SIZING_BEAM);
      
      if (!tTag.getFormula() || !tMtr.getFormula() || !tVal.getFormula() || !siz.getFormula()) {
        applyCalculatedFieldFormulas();
      }
    }
    
  } catch (error) {
    Logger.log('onEdit error: ' + error);
  }
}

function onEntryTypeChangeFixed() {
  const formSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.FORM);
  const entryType = formSheet.getRange(CONFIG.CELLS.ENTRY_TYPE).getValue();
  
  formSheet.getRange(CONFIG.CELLS.SELECT_PENDING_APPROVED).clearContent();
  formSheet.getRange(CONFIG.CELLS.SELECT_EDIT).clearContent();
  formSheet.getRange(CONFIG.CELLS.SEARCH_RTWE).clearContent();
  
  formSheet.hideRows(5, 2);
  formSheet.hideRows(7, 9);
  formSheet.hideRows(17, 30);
  
  SpreadsheetApp.flush();
  
  switch(entryType) {
    case 'NEW ENTRY':
      formSheet.showRows(7, 9);
      SpreadsheetApp.flush();
      handleNewEntryFixed(formSheet);
      break;
      
    case 'PENDING APPROVED':
      formSheet.showRows(5);
      SpreadsheetApp.flush();
      handlePendingApproved(formSheet);
      break;
      
    case 'EDIT ENQUIRY':
      formSheet.showRows(6);
      SpreadsheetApp.flush();
      handleEditEnquiryFixed(formSheet);
      break;
  }
}

function onOrderStatusChangeFixed() {
  const formSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.FORM);
  const status = formSheet.getRange(CONFIG.CELLS.ORDER_STATUS).getValue();
  const entryType = formSheet.getRange(CONFIG.CELLS.ENTRY_TYPE).getValue();
  
  const isPendingApprovedFlow = (entryType === 'PENDING APPROVED');
  const isEditFlow = (entryType === 'EDIT ENQUIRY');
  
  if (status === 'Approved' && (isPendingApprovedFlow || isEditFlow)) {
    formSheet.showRows(17, 30);
    
    const approvedDate = formSheet.getRange(CONFIG.CELLS.APPROVED_DATE).getValue();
    if (!approvedDate) {
      formSheet.getRange(CONFIG.CELLS.APPROVED_DATE).setValue(new Date());
    }
    
    const quality = formSheet.getRange(CONFIG.CELLS.QUALITY).getValue();
    if (quality) {
      formSheet.getRange(CONFIG.CELLS.QUALITY_ORDER).setValue(quality);
    }
    
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'Order details section opened',
      '✅ Approved',
      2
    );
  } else {
    formSheet.hideRows(17, 30);
    
    if (status === 'Pending') {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        'Data will go to PENDING_DATA',
        '⏳ Pending',
        2
      );
    } else if (status === 'Approved' && entryType === 'NEW ENTRY') {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        'Data will go to PENDING_APPROVED',
        '✅ Approved',
        2
      );
    } else if (status === 'Canceled') {
      SpreadsheetApp.getActiveSpreadsheet().toast(
        'Data will go to ENQUIRY_CLOSED_DATA',
        '❌ Canceled',
        2
      );
    }
  }
}

function handleNewEntryFixed(formSheet) {
  clearFormUpdated();
  
  const rtwe = generateRTWENumber();
  formSheet.getRange(CONFIG.CELLS.RTWE_NO).setValue(rtwe);
  formSheet.getRange(CONFIG.CELLS.COSTING_NO).setValue(deriveCostingFromRTWE(rtwe));
  
  formSheet.getRange(CONFIG.CELLS.ENQ_DATE).setValue(new Date());
  formSheet.getRange(CONFIG.CELLS.ORDER_STATUS).setValue('Pending');
  
  formSheet.hideRows(5, 2);
  formSheet.showRows(7, 9);
  
  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Ready for new enquiry entry!',
    '✅ NEW ENTRY Mode',
    3
  );
}

// ============================================
// RTWE NUMBER GENERATION (FIXED!)
// ============================================

function generateRTWENumber() {
  const lock = LockService.getScriptLock();
  const success = lock.tryLock(5000);
  if (!success) {
    throw new Error('RTWE generation lock failed. Try again.');
  }
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let maxNumber = 0;
    
    [CONFIG.SHEETS.PENDING, CONFIG.SHEETS.PENDING_APPROVED, 
     CONFIG.SHEETS.CONFIRMED, CONFIG.SHEETS.CLOSED].forEach(sheetName => {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) return;
      
      const lastRow = sheet.getLastRow();
      
      if (lastRow > 1) {
        const rtweNumbers = sheet.getRange(2, 1, lastRow - 1, 1).getValues()
          .flat()
          .filter(val => val && val.toString().startsWith('RTWE'))
          .map(val => {
            const match = val.toString().match(/RTWE(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
          }); // ✅ FIXED: Added closing bracket
        
        const sheetMax = Math.max(...rtweNumbers, 0);
        maxNumber = Math.max(maxNumber, sheetMax);
      }
    });
    
    const nextNumber = maxNumber + 1;
    const paddedNumber = String(nextNumber).padStart(2, '0');
    
    return 'RTWE' + paddedNumber;
    
  } finally {
    lock.releaseLock();
  }
}

// deriveCostingFromRTWE() - REMOVED: Duplicate of function in Utillities.gs

// ============================================
// EMAIL TRIGGERS SETUP
// ============================================

function setupEmailTriggers() {
  if (!refreshSession()) {
    SpreadsheetApp.getUi().alert('🔒 Please login first!');
    return;
  }
  
  try {
    // Clear existing email triggers
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      const funcName = trigger.getHandlerFunction();
      if (['sendDailyEmailReport', 'sendWeeklyEmailReport', 'sendMonthlyEmailReport'].includes(funcName)) {
        ScriptApp.deleteTrigger(trigger);
        Logger.log('Deleted old trigger: ' + funcName);
      }
    });
    
    // Create new triggers
    ScriptApp.newTrigger('sendDailyEmailReport')
      .timeBased()
      .everyDays(1)
      .atHour(20)
      .create();
    Logger.log('✅ Created daily trigger');
    
    ScriptApp.newTrigger('sendWeeklyEmailReport')
      .timeBased()
      .onWeekDay(ScriptApp.WeekDay.MONDAY)
      .atHour(20)
      .create();
    Logger.log('✅ Created weekly trigger');
    
    ScriptApp.newTrigger('sendMonthlyEmailReport')
      .timeBased()
      .onMonthDay(1)
      .atHour(20)
      .create();
    Logger.log('✅ Created monthly trigger');
    
    SpreadsheetApp.getUi().alert(
      '✅ Email Triggers Setup Complete!',
      'Scheduled reports:\n\n' +
      '📧 Daily Report: Every day at 8:00 PM\n' +
      '📧 Weekly Report: Every Monday at 8:00 PM\n' +
      '📧 Monthly Report: 1st of month at 8:00 PM\n\n' +
      'All times in IST (Indian Standard Time)',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    
  } catch (error) {
    Logger.log('❌ Trigger setup error: ' + error);
    SpreadsheetApp.getUi().alert(
      '❌ Trigger Setup Failed!',
      'Error: ' + error.message,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  }
}

// ============================================
// WHATSAPP RECIPIENT MANAGEMENT
// ============================================

function viewWhatsAppRecipients() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('WHATSAPP_RECIPIENTS');
  
  if (sheet) {
    SpreadsheetApp.setActiveSheet(sheet);
    SpreadsheetApp.getUi().alert('WhatsApp Recipients sheet opened');
  } else {
    SpreadsheetApp.getUi().alert('Recipients sheet not found!');
  }
}

function addWhatsAppRecipient() {
  const ui = SpreadsheetApp.getUi();
  
  const phoneRes = ui.prompt(
    'Add WhatsApp Recipient - Step 1/2',
    'Enter phone number (with country code):\nExample: 919876543210',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (phoneRes.getSelectedButton() !== ui.Button.OK) return;
  
  let phone = phoneRes.getResponseText().trim().replace(/\D/g, '');
  
  if (phone.length < 10) {
    ui.alert('Invalid phone number!');
    return;
  }
  
  const nameRes = ui.prompt(
    'Add WhatsApp Recipient - Step 2/2',
    'Enter name:',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (nameRes.getSelectedButton() !== ui.Button.OK) return;
  const name = nameRes.getResponseText().trim();
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('WHATSAPP_RECIPIENTS');
  
  if (!sheet) {
    ui.alert('Recipients sheet not found!');
    return;
  }
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === phone) {
      ui.alert('This number already exists!');
      return;
    }
  }
  
  if (sheet.getLastRow() >= 8) {
    ui.alert('Maximum 7 recipients allowed!');
    return;
  }
  
  sheet.appendRow([phone, name, 'Active']);
  ui.alert('✅ Recipient added!\n\nPhone: ' + phone + '\nName: ' + name);
}

function removeWhatsAppRecipient() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('WHATSAPP_RECIPIENTS');
  
  if (!sheet) {
    ui.alert('Recipients sheet not found!');
    return;
  }
  
  const data = sheet.getDataRange().getValues();
  const phoneList = [];
  
  for (let i = 1; i < data.length; i++) {
    phoneList.push(data[i][1] + ' (' + data[i][0] + ')');
  }
  
  if (phoneList.length === 0) {
    ui.alert('No recipients to remove!');
    return;
  }
  
  const response = ui.prompt(
    'Remove WhatsApp Recipient',
    'Enter number to remove:\n\n' + phoneList.join('\n'),
    ui.ButtonSet.OK_CANCEL
  );
  
  if (response.getSelectedButton() !== ui.Button.OK) return;
  
  const phoneToRemove = response.getResponseText().trim().replace(/\D/g, '');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === phoneToRemove) {
      sheet.deleteRow(i + 1);
      ui.alert('✅ Recipient removed!');
      return;
    }
  }
  
  ui.alert('Phone number not found!');
}

function sendTestWhatsApp() {
  const ui = SpreadsheetApp.getUi();
  
  if (!TWILIO_CONFIG.ENABLED) {
    ui.alert(
      '⚠️ Twilio Not Configured',
      'Please configure Twilio credentials in the code first.',
      ui.ButtonSet.OK
    );
    return;
  }
  
  const testMessage = 
    '🧪 *Test Message from RTWE System*\n\n' +
    'This is a test notification.\n\n' +
    'If you received this, WhatsApp integration is working!\n\n' +
    '_RTW - Ramratan Techno Weave_';
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('WHATSAPP_RECIPIENTS');
  
  if (!sheet) {
    ui.alert('No recipients configured!');
    return;
  }
  
  const data = sheet.getDataRange().getValues();
  let sent = 0;
  let failed = 0;
  
  for (let i = 1; i < data.length; i++) {
    const phone = data[i][0];
    const status = data[i][2];
    
    if (status === 'Active') {
      const result = sendWhatsAppViaTwilio(phone, testMessage, 'TEST');
      if (result.success) {
        sent++;
      } else {
        failed++;
      }
    }
  }
  
  ui.alert(
    '✅ Test Complete!',
    'Sent: ' + sent + '\nFailed: ' + failed,
    ui.ButtonSet.OK
  );
}

function sendTestVoiceCall() {
  const ui = SpreadsheetApp.getUi();
  
  if (!TWILIO_CONFIG.ENABLED) {
    ui.alert(
      '⚠️ Twilio Not Configured',
      'Please configure Twilio credentials first.',
      ui.ButtonSet.OK
    );
    return;
  }
  
  const response = ui.prompt(
    'Test Voice Call',
    'Enter phone number (with country code):',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (response.getSelectedButton() !== ui.Button.OK) return;
  
  const phone = response.getResponseText().trim().replace(/\D/g, '');
  
  const result = makeTwilioVoiceCall(phone, 'TEST01');
  
  if (result.success) {
    ui.alert('✅ Call initiated!\n\nCheck your phone.');
  } else {
    ui.alert('❌ Call failed!\n\n' + result.error);
  }
}

// ============================================
// TELEGRAM BOT
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

// doPost() - REMOVED: Duplicate of function in Code.gs (main webapp handler)
// The doPost in Code.gs handles both webapp form submissions and Telegram webhooks

function handleTelegramMessage(message) {
  const chatId = message.chat.id;
  const text = (message.text || '').trim();
  
  registerTelegramUser(chatId, message.from);
  
  if (text.startsWith('/')) {
    handleTelegramCommand(chatId, text);
  }
}

function registerTelegramUser(chatId, from) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('TELEGRAM_USERS');
  
  if (!sheet) return;
  
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === chatId.toString()) {
      return;
    }
  }
  
  sheet.appendRow([
    chatId,
    from.first_name + (from.last_name ? ' ' + from.last_name : ''),
    from.username || '',
    'Active',
    new Date()
  ]);
  
  sendTelegramMessage(chatId, 
    '✅ *Welcome to RTWE System!*\n\n' +
    'You will now receive order notifications.\n\n' +
    'Available commands:\n' +
    '/status - Today\'s summary\n' +
    '/pending - Pending orders\n' +
    '/delivery - Today\'s deliveries\n' +
    '/help - Show this message'
  );
}

function handleTelegramCommand(chatId, command) {
  const cmd = command.toLowerCase().split(' ')[0];
  
  switch(cmd) {
    case '/start':
    case '/help':
      sendTelegramMessage(chatId,
        '*RTWE System Commands:*\n\n' +
        '/status - Today\'s summary\n' +
        '/pending - Pending orders\n' +
        '/delivery - Today\'s deliveries\n' +
        '/help - Show this message'
      );
      break;
      
    case '/status':
      const summary = getTodaysSummary();
      sendTelegramMessage(chatId, summary);
      break;
      
    case '/pending':
      const pending = getPendingOrders();
      sendTelegramMessage(chatId, pending);
      break;
      
    case '/delivery':
      const deliveries = getTodaysDeliveries();
      sendTelegramMessage(chatId, deliveries);
      break;
      
    default:
      sendTelegramMessage(chatId, 'Unknown command. Use /help for available commands.');
  }
}

// getTodaysSummary() - REMOVED: Duplicate of function in Utillities.gs
// getPendingOrders() - REMOVED: Duplicate of function in Utillities.gs
// getTodaysDeliveries() - REMOVED: Duplicate of function in Utillities.gs
// These functions are used by handleTelegramCommand and are defined in Utillities.gs