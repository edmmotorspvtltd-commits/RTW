// ============================================
// UTILITIES - ALL HELPER FUNCTIONS
// ============================================

function completeSystemSetup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  try {
    ui.alert('🚀 Starting Complete Setup v3.0...\n\nThis will create all necessary sheets and configurations.');
    
    createAllSheetsUpdated();
    setupMasterDataUpdated();
    setupStorageHeadersUpdated();
    formatEnquiryFormUpdated();
    setupFormValidationsUpdated();
    applySheetColors();
    setupAutoTimeFormulas();
    protectCalculatedFields();
    
    // New features setup
    setupUserManagementSheet();
    setupWhatsAppRecipients();
    setupPerformanceDashboard();
    setupNotificationSheets();
    
    ui.alert(
      '✅ Setup Complete!',
      'RTWE System v3.0 ready!\n\n' +
      'New Features:\n' +
      '• Secure login with password hashing\n' +
      '• Email automation\n' +
      '• WhatsApp/Voice integration\n' +
      '• Telegram bot\n' +
      '• Performance analytics\n' +
      '• QR code generation\n\n' +
      'Please login to continue.',
      ui.ButtonSet.OK
    );
    
    showLoginDialog();
    
  } catch (error) {
    ui.alert('❌ Setup Error: ' + error.message);
    Logger.log('Setup Error: ' + error);
  }
}


function handlePendingApproved(formSheet) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pendingApprovedSheet = ss.getSheetByName(CONFIG.SHEETS.PENDING_APPROVED);
  
  clearFormUpdated();
  
  formSheet.showRows(5);
  formSheet.hideRows(6);
  
  const lastRow = pendingApprovedSheet.getLastRow();
  if (lastRow > 1) {
    const rtweList = pendingApprovedSheet.getRange(2, 1, lastRow - 1, 1)
      .getValues()
      .flat()
      .filter(val => val !== '');
    
    if (rtweList.length > 0) {
      const cell = formSheet.getRange(CONFIG.CELLS.SELECT_PENDING_APPROVED);
      const rule = SpreadsheetApp.newDataValidation()
        .requireValueInList(rtweList, true)
        .setAllowInvalid(false)
        .build();
      cell.setDataValidation(rule);
      
      SpreadsheetApp.getActiveSpreadsheet().toast(
        rtweList.length + ' pending approved enquiries',
        '📋 PENDING APPROVED Mode',
        3
      );
    } else {
      SpreadsheetApp.getUi().alert(
        'No Pending Approved Enquiries',
        'No enquiries waiting for approval.',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      formSheet.getRange(CONFIG.CELLS.ENTRY_TYPE).setValue('NEW ENTRY');
      handleNewEntryFixed(formSheet);
    }
  } else {
    SpreadsheetApp.getUi().alert(
      'No Pending Approved Enquiries',
      'No enquiries waiting for approval.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    formSheet.getRange(CONFIG.CELLS.ENTRY_TYPE).setValue('NEW ENTRY');
    handleNewEntryFixed(formSheet);
  }
}


function handleEditEnquiryFixed(formSheet) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  clearFormUpdated();
  
  formSheet.hideRows(5);
  formSheet.showRows(6);
  
  const allRTWE = [];
  
  [CONFIG.SHEETS.PENDING, CONFIG.SHEETS.PENDING_APPROVED, CONFIG.SHEETS.CONFIRMED, CONFIG.SHEETS.CLOSED].forEach(sheetName => {
    const sheet = ss.getSheetByName(sheetName);
    const lastRow = sheet.getLastRow();
    
    if (lastRow > 1) {
      const rtweList = sheet.getRange(2, 1, lastRow - 1, 1)
        .getValues()
        .flat()
        .filter(val => val !== '')
        .map(val => val + ' (' + sheetName + ')');
      
      allRTWE.push(...rtweList);
    }
  });
  
  if (allRTWE.length > 0) {
    const cell = formSheet.getRange(CONFIG.CELLS.SELECT_EDIT);
    const rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(allRTWE, true)
      .setAllowInvalid(false)
      .build();
    cell.setDataValidation(rule);
    
    SpreadsheetApp.getActiveSpreadsheet().toast(
      allRTWE.length + ' enquiries available for edit',
      '✏️ EDIT ENQUIRY Mode',
      3
    );
  } else {
    SpreadsheetApp.getUi().alert(
      'No Enquiries to Edit',
      'No enquiries found.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    formSheet.getRange(CONFIG.CELLS.ENTRY_TYPE).setValue('NEW ENTRY');
    handleNewEntryFixed(formSheet);
  }
}


function findSheetByRTWE(rtweNo) {
  if (!rtweNo) return null;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = [
    CONFIG.SHEETS.PENDING,
    CONFIG.SHEETS.PENDING_APPROVED,
    CONFIG.SHEETS.CONFIRMED,
    CONFIG.SHEETS.CLOSED
  ];
  
  for (let sheetName of sheets) {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) continue;
    
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) continue;
    
    const vals = sheet.getRange(2, 1, lastRow - 1, 1).getValues().flat();
    if (vals.includes(rtweNo)) {
      return sheetName;
    }
  }
  return null;
}


function clearFormUpdated() {
  const formSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.FORM);
  if (!formSheet) return;
  
  formSheet.getRange('B4:B6').clearContent();
  formSheet.getRange('B8:B10').clearContent();
  formSheet.getRange('B12:B14').clearContent();
  formSheet.getRange(CONFIG.CELLS.ORDER_STATUS).setValue('Pending');
  formSheet.getRange('B19').clearContent();
  formSheet.getRange('B21:B25').clearContent();
  formSheet.getRange('B26:B31').clearContent();
  formSheet.getRange('C26:C31').clearContent();
  formSheet.getRange('B33').clearContent();
  formSheet.getRange('B36:B39').clearContent();
  formSheet.getRange('B41:B43').clearContent();
  formSheet.getRange('C19:C25').clearContent();
  formSheet.getRange('C33:C43').clearContent();
  formSheet.getRange(CONFIG.CELLS.ENQ_DATE).setValue(new Date());
  
  applyCalculatedFieldFormulas();
  setupAutoTimeFormulas();
}

// ============================================
// SUBMIT FUNCTION (Enhanced with Notifications)
// ============================================


function generateQRCodeForOrder(rtweNo, sheet, row) {
  try {
    const qrData = 'RTWE:' + rtweNo + '|Company:RTW';
    const qrUrl = 'https://chart.googleapis.com/chart?cht=qr&chs=200x200&chl=' + encodeURIComponent(qrData);
    
    const formula = '=IMAGE("' + qrUrl + '", 4, 100, 100)';
    
    sheet.getRange(row, 43).setFormula(formula);
    
    Logger.log('✅ QR code generated for ' + rtweNo);
    
  } catch (error) {
    Logger.log('QR code error: ' + error);
  }
}

// ============================================
// NOTIFICATION SYSTEM - WHATSAPP + VOICE + TELEGRAM
// ============================================


function sendWhatsAppToRecipients(message, rtweNo) {
  if (!TWILIO_CONFIG.ENABLED) {
    Logger.log('⚠️ Twilio not configured - skipping WhatsApp');
    return;
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const recipSheet = ss.getSheetByName('WHATSAPP_RECIPIENTS');
  
  if (!recipSheet) {
    Logger.log('No recipient sheet found');
    return;
  }
  
  const data = recipSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    const phone = data[i][0];
    const name = data[i][1];
    const status = data[i][2];
    
    if (status === 'Active' && phone) {
      try {
        const result = sendWhatsAppViaTwilio(phone, message, rtweNo);
        
        if (result.success) {
          Logger.log('✅ WhatsApp sent to ' + name + ' (' + phone + ')');
        } else {
          Logger.log('❌ WhatsApp failed to ' + name + ': ' + result.error);
        }
      } catch (error) {
        Logger.log('WhatsApp error for ' + phone + ': ' + error);
      }
    }
  }
}


function sendWhatsAppViaTwilio(phone, message, rtweNo) {
  try {
    const url = 'https://api.twilio.com/2010-04-01/Accounts/' +
                TWILIO_CONFIG.ACCOUNT_SID + '/Messages.json';
    
    // Format phone for WhatsApp
    const formattedPhone = 'whatsapp:+' + phone.replace(/\D/g, '');
    
    const payload = {
      From: TWILIO_CONFIG.FROM_WHATSAPP,
      To: formattedPhone,
      Body: message
    };
    
    const options = {
      method: 'post',
      payload: payload,
      headers: {
        Authorization: 'Basic ' + Utilities.base64Encode(
          TWILIO_CONFIG.ACCOUNT_SID + ':' + TWILIO_CONFIG.AUTH_TOKEN
        )
      },
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.sid) {
      Logger.log('✅ WhatsApp sent - SID: ' + result.sid);
      
      // Track message
      trackWhatsAppMessage(phone, result.sid, rtweNo);
      
      // Schedule reply check
      scheduleReplyCheck(phone, result.sid, rtweNo);
      
      return { success: true, sid: result.sid };
    } else {
      Logger.log('❌ Twilio error: ' + JSON.stringify(result));
      return { success: false, error: result.message || 'Unknown error' };
    }
    
  } catch (error) {
    Logger.log('❌ WhatsApp error: ' + error);
    return { success: false, error: error.toString() };
  }
}


function trackWhatsAppMessage(phone, sid, rtweNo) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const trackSheet = ss.getSheetByName('MESSAGE_TRACKING');
  
  if (!trackSheet) return;
  
  trackSheet.appendRow([
    new Date(),
    phone,
    sid,
    rtweNo,
    'Sent',
    'No',
    'No'
  ]);
}


function scheduleReplyCheck(phone, messageSid, rtweNo) {
  const triggerTime = new Date();
  triggerTime.setMinutes(triggerTime.getMinutes() + 10);
  
  // Create trigger
  ScriptApp.newTrigger('checkTwilioReplies')
    .timeBased()
    .at(triggerTime)
    .create();
  
  // Store check data
  const scriptProps = PropertiesService.getScriptProperties();
  const key = 'TWILIO_CHECK_' + messageSid;
  
  scriptProps.setProperty(key, JSON.stringify({
    phone: phone,
    messageSid: messageSid,
    rtweNo: rtweNo,
    sentTime: new Date().getTime(),
    checkTime: triggerTime.getTime()
  }));
  
  Logger.log('⏰ Reply check scheduled for ' + phone);
}


function checkTwilioReplies() {
  const scriptProps = PropertiesService.getScriptProperties();
  const allProps = scriptProps.getProperties();
  
  Object.keys(allProps).forEach(key => {
    if (key.startsWith('TWILIO_CHECK_')) {
      try {
        const data = JSON.parse(allProps[key]);
        
        // Check if reply received
        const hasReply = checkForTwilioReply(data.phone, data.sentTime);
        
        if (!hasReply) {
          Logger.log('❌ No reply from ' + data.phone + ' - Making call');
          makeTwilioVoiceCall(data.phone, data.rtweNo);
          
          // Update tracking
          updateMessageTracking(data.messageSid, true, false);
        } else {
          Logger.log('✅ Reply received from ' + data.phone);
          
          // Update tracking
          updateMessageTracking(data.messageSid, false, true);
        }
        
        // Clean up
        scriptProps.deleteProperty(key);
        
      } catch (error) {
        Logger.log('Reply check error: ' + error);
        scriptProps.deleteProperty(key);
      }
    }
  });
  
  // Delete this trigger
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'checkTwilioReplies') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}


function checkForTwilioReply(phone, sinceTime) {
  try {
    const formattedPhone = 'whatsapp:+' + phone.replace(/\D/g, '');
    
    const url = 'https://api.twilio.com/2010-04-01/Accounts/' +
                TWILIO_CONFIG.ACCOUNT_SID + '/Messages.json' +
                '?From=' + encodeURIComponent(formattedPhone) +
                '&PageSize=20';
    
    const options = {
      method: 'get',
      headers: {
        Authorization: 'Basic ' + Utilities.base64Encode(
          TWILIO_CONFIG.ACCOUNT_SID + ':' + TWILIO_CONFIG.AUTH_TOKEN
        )
      },
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.messages && result.messages.length > 0) {
      for (let i = 0; i < result.messages.length; i++) {
        const msg = result.messages[i];
        const msgTime = new Date(msg.date_created).getTime();
        
        if (msgTime > sinceTime) {
          const body = (msg.body || '').toLowerCase();
          
          // Check for confirmation keywords
          const isConfirmed = TWILIO_CONFIG.CONFIRMATION_KEYWORDS.some(
            keyword => body.includes(keyword)
          );
          
          if (isConfirmed) {
            return true;
          }
        }
      }
    }
    
    return false;
    
  } catch (error) {
    Logger.log('Error checking replies: ' + error);
    return false;
  }
}


function makeTwilioVoiceCall(phone, rtweNo) {
  try {
    const url = 'https://api.twilio.com/2010-04-01/Accounts/' +
                TWILIO_CONFIG.ACCOUNT_SID + '/Calls.json';
    
    const formattedPhone = '+' + phone.replace(/\D/g, '');
    
    // Bilingual TwiML
    const twiml = '<Response>' +
      '<Say voice="woman" language="hi-IN">' +
      'नमस्ते, यह आर टी डब्ल्यू रामरतन टेक्नो वीव से कॉल है। ' +
      'हमने आपको ऑर्डर नंबर ' + rtweNo + ' के बारे में व्हाट्सएप मैसेज भेजा है। ' +
      'कृपया व्हाट्सएप चेक करें और ओके रिप्लाई करें। धन्यवाद।' +
      '</Say>' +
      '<Pause length="1"/>' +
      '<Say voice="woman" language="en-IN">' +
      'Hello, this is a call from RTW Ramratan Techno Weave. ' +
      'We have sent you a WhatsApp message regarding order number ' + rtweNo + '. ' +
      'Please check WhatsApp and reply OK. Thank you.' +
      '</Say>' +
      '</Response>';
    
    const payload = {
      From: TWILIO_CONFIG.FROM_VOICE,
      To: formattedPhone,
      Twiml: twiml
    };
    
    const options = {
      method: 'post',
      payload: payload,
      headers: {
        Authorization: 'Basic ' + Utilities.base64Encode(
          TWILIO_CONFIG.ACCOUNT_SID + ':' + TWILIO_CONFIG.AUTH_TOKEN
        )
      },
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.sid) {
      Logger.log('✅ Voice call made - SID: ' + result.sid);
      
      logVoiceCall(phone, 'Order ' + rtweNo, 'SUCCESS - SID: ' + result.sid);
      
      // Alert admin
      sendAdminAlert('Voice call made to ' + phone + ' for order ' + rtweNo);
      
      return { success: true, sid: result.sid };
    } else {
      Logger.log('❌ Call failed: ' + JSON.stringify(result));
      logVoiceCall(phone, 'Order ' + rtweNo, 'FAILED: ' + result.message);
      
      return { success: false, error: result.message };
    }
    
  } catch (error) {
    Logger.log('❌ Voice call error: ' + error);
    logVoiceCall(phone, 'Order ' + rtweNo, 'ERROR: ' + error);
    
    return { success: false, error: error.toString() };
  }
}


function updateMessageTracking(sid, callMade, replyReceived) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const trackSheet = ss.getSheetByName('MESSAGE_TRACKING');
  
  if (!trackSheet) return;
  
  const data = trackSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] === sid) {
      if (callMade) {
        trackSheet.getRange(i + 1, 6).setValue('Yes');
      }
      if (replyReceived) {
        trackSheet.getRange(i + 1, 7).setValue('Yes');
      }
      break;
    }
  }
}


function logVoiceCall(phone, message, status) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let callLog = ss.getSheetByName('VOICE_CALL_LOG');
  
  if (!callLog) {
    callLog = ss.insertSheet('VOICE_CALL_LOG');
    callLog.getRange('A1:F1').setValues([
      ['Timestamp', 'Phone', 'Message', 'Status', 'Reason', 'Duration']
    ]).setBackground('#FF6B6B').setFontColor('white').setFontWeight('bold');
  }
  
  callLog.appendRow([
    new Date(),
    phone,
    message,
    status,
    'No WhatsApp reply after 10 minutes',
    '-'
  ]);
}


function sendAdminAlert(message) {
  try {
    GmailApp.sendEmail(
      CONFIG.USERS.OWNER_EMAIL,
      '🔔 RTWE System Alert - Voice Call Triggered',
      message
    );
  } catch (error) {
    Logger.log('Admin alert error: ' + error);
  }
}

// ============================================
// TELEGRAM INTEGRATION
// ============================================


function sendTelegramToUsers(message) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const telegramSheet = ss.getSheetByName('TELEGRAM_USERS');
  
  if (!telegramSheet) {
    Logger.log('No Telegram users sheet');
    return;
  }
  
  const data = telegramSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    const chatId = data[i][0];
    const status = data[i][3];
    
    if (status === 'Active' && chatId) {
      sendTelegramMessage(chatId, message);
    }
  }
}


// doPost() - REMOVED: Duplicate of function in Code.gs
// The main doPost handler in Code.gs handles both webapp form submissions and Telegram webhooks


function getTodaysSummary() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const today = stripTime(new Date());
  
  let confirmedToday = 0;
  let pendingToday = 0;
  
  const confirmedSheet = ss.getSheetByName(CONFIG.SHEETS.CONFIRMED);
  if (confirmedSheet) {
    const data = confirmedSheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      const date = asDate(data[i][8]);
      if (date && stripTime(date).getTime() === today.getTime()) {
        confirmedToday++;
      }
    }
  }
  
  const pendingSheet = ss.getSheetByName(CONFIG.SHEETS.PENDING);
  if (pendingSheet) {
    pendingToday = pendingSheet.getLastRow() - 1;
  }
  
  return '*Today\'s Summary*\n\n' +
         '✅ Confirmed: ' + confirmedToday + '\n' +
         '⏳ Pending: ' + pendingToday;
}


function getPendingOrders() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const pendingSheet = ss.getSheetByName(CONFIG.SHEETS.PENDING);
  
  if (!pendingSheet || pendingSheet.getLastRow() < 2) {
    return '✅ No pending orders!';
  }
  
  const data = pendingSheet.getDataRange().getValues();
  let message = '*Pending Orders:*\n\n';
  
  for (let i = 1; i < Math.min(data.length, 11); i++) {
    message += '• ' + data[i][0] + ' - ' + data[i][5] + '\n';
  }
  
  if (data.length > 11) {
    message += '\n_...and ' + (data.length - 11) + ' more_';
  }
  
  return message;
}


function getTodaysDeliveries() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const confirmedSheet = ss.getSheetByName(CONFIG.SHEETS.CONFIRMED);
  
  if (!confirmedSheet) {
    return 'No confirmed orders found.';
  }
  
  const today = stripTime(new Date());
  const data = confirmedSheet.getDataRange().getValues();
  const deliveries = [];
  
  for (let i = 1; i < data.length; i++) {
    const deliveryDate = asDate(data[i][37]);
    if (deliveryDate && stripTime(deliveryDate).getTime() === today.getTime()) {
      deliveries.push(data[i][0] + ' - ' + data[i][11]); // RTWE + Buyer
    }
  }
  
  if (deliveries.length === 0) {
    return '✅ No deliveries scheduled for today!';
  }
  
  return '*Today\'s Deliveries:*\n\n' + deliveries.map(d => '• ' + d).join('\n');
}

// ============================================
// HELPER FUNCTIONS (Same as before)
// ============================================


function deriveCostingFromRTWE(rtwe) {
  if (!rtwe) return '';
  const str = rtwe.toString().toUpperCase();
  const match = str.match(/RTWE0*(\d+)/);
  if (!match) return '';
  const num = parseInt(match[1], 10);
  if (isNaN(num)) return '';
  return 'RTWC' + num;
}


function getSheetData(sheet) {
  if (!sheet) return [];
  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];
  return sheet.getRange(2, 1, lastRow - 1, lastCol).getValues()
    .filter(r => r[0] !== '' && r[0] != null);
}


function asDate(v) {
  if (!v) return null;
  if (Object.prototype.toString.call(v) === '[object Date]') return v;
  try { return new Date(v); } catch (e) { return null; }
}


function stripTime(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

// ============================================
// DASHBOARD FUNCTIONS (Same as before - keeping existing)
// ============================================

// onOpen() - REMOVED: Duplicate of function in Code.gs
// The main onOpen handler in Code.gs handles menu creation and session management

// ============================================
// BUILD FULL MENU (ONLY FOR LOGGED-IN USERS)
// ============================================


function refreshSession() {
  const userProps = PropertiesService.getUserProperties();
  const sessionData = userProps.getProperty('SESSION_DATA');
  
  if (!sessionData) {
    return false;
  }
  
  try {
    const session = JSON.parse(sessionData);
    const now = Date.now();
    
    // Check timeout (15 minutes)
    if (now - session.lastActivity > 15 * 60 * 1000) {
      userProps.deleteProperty('SESSION_DATA');
      
      SpreadsheetApp.getUi().alert(
        '⏱️ Session Expired!',
        'Please login again.',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      
      handleLogout();
      return false;
    }
    
    // Update last activity
    session.lastActivity = now;
    userProps.setProperty('SESSION_DATA', JSON.stringify(session));
    
    return true;
    
  } catch (error) {
    userProps.deleteProperty('SESSION_DATA');
    return false;
  }
}

// ============================================
// SECURE ALL MENU FUNCTIONS
// ============================================


function emergencyLoginFix() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  try {
    // Step 1: Create USER_MANAGEMENT sheet
    let userSheet = ss.getSheetByName('USER_MANAGEMENT');
    
    if (!userSheet) {
      ui.alert('Creating USER_MANAGEMENT sheet...');
      userSheet = ss.insertSheet('USER_MANAGEMENT');
      userSheet.setTabColor('#212121');
      
      // Setup headers
      userSheet.getRange('A1:G1').setValues([[
        'Full Name', 'Username', 'Password Hash', 'Role', 
        'Email', 'Phone', 'Status'
      ]]).setFontWeight('bold')
        .setBackground('#212121')
        .setFontColor('white');
      
      userSheet.setFrozenRows(1);
    }
    
    // Step 2: Check if admin user exists
    const data = userSheet.getDataRange().getValues();
    let adminExists = false;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === 'admin') {
        adminExists = true;
        break;
      }
    }
    
    // Step 3: Add admin if not exists
    if (!adminExists) {
      ui.alert('Creating admin user...');
      
      const hashedPassword = hashPassword('admin123');
      
      userSheet.appendRow([
        'Shekhar (Owner)',
        'admin',
        hashedPassword,
        'OWNER',
        'shekhar.jha@ramratantechnoweave.com',
        '6350095137',
        'Active'
      ]);
    }
    
    // Step 4: Success message
    ui.alert(
      '✅ LOGIN FIX COMPLETE!',
      'You can now login with:\n\n' +
      'Username: admin\n' +
      'Password: admin123\n\n' +
      'Refresh the sheet and try again.',
      ui.ButtonSet.OK
    );
    
    // Step 5: Enable form
    enableForm();
    
  } catch (error) {
    ui.alert('❌ Fix Error: ' + error.message);
    Logger.log('Emergency fix error: ' + error);
  }
}


function nuclearPasswordReset() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Delete old sheet
  const oldSheet = ss.getSheetByName('USER_MANAGEMENT');
  if (oldSheet) {
    ss.deleteSheet(oldSheet);
  }
  
  // Create fresh
  const newSheet = ss.insertSheet('USER_MANAGEMENT');
  newSheet.setTabColor('#212121');
  
  newSheet.getRange('A1:G1').setValues([[
    'Full Name', 'Username', 'Password Hash', 'Role', 'Email', 'Phone', 'Status'
  ]]).setBackground('#212121').setFontColor('white').setFontWeight('bold');
  
  // Hash inline
  const adminHash = Utilities.base64Encode(
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, 'admin123')
  );
  
  newSheet.appendRow([
    'Shekhar (Owner)', 'admin', adminHash, 'OWNER',
    'shekhar.jha@ramratantechnoweave.com', '6350095137', 'Active'
  ]);
  
  // Clear locks
  PropertiesService.getScriptProperties().deleteProperty('LOCK_admin');
  PropertiesService.getScriptProperties().deleteProperty('ATTEMPTS_admin');
  
  SpreadsheetApp.getUi().alert('💣 NUCLEAR RESET DONE!\n\nLogin: admin / admin123');


// ============================================
// HELPER FUNCTIONS - REMOVED DUPLICATES
// getSheetData(), asDate(), stripTime(), deriveCostingFromRTWE()
// are already defined above at lines ~703-733
// ============================================

/**
 * Delete record from sheet by RTWE number
 */
function deleteRecordFromSheet(rtweNo, sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    Logger.log('Sheet not found: ' + sheetName);
    return;
  }
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === rtweNo) {
      sheet.deleteRow(i + 1);
      Logger.log('✅ Deleted RTWE ' + rtweNo + ' from ' + sheetName + ' (Row ' + (i + 1) + ')');
      return;
    }
  }
  
  Logger.log('⚠️ RTWE ' + rtweNo + ' not found in ' + sheetName);
}

/**
 * Check for duplicate RTWE number
 */
function checkDuplicateRTWE(rtweNo) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = [
    CONFIG.SHEETS.PENDING,
    CONFIG.SHEETS.PENDING_APPROVED,
    CONFIG.SHEETS.CONFIRMED,
    CONFIG.SHEETS.CLOSED
  ];
  
  for (let sheetName of sheets) {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) continue;
    
    const data = getSheetData(sheet);
    for (let row of data) {
      if (row[0] === rtweNo) {
        return {
          isDuplicate: true,
          message: '⚠️ DUPLICATE RTWE!\n\nRTWE ' + rtweNo + ' already exists in ' + sheetName + '.\n\nPlease use a different RTWE number.',
          foundIn: sheetName
        };
      }
    }
  }
  
  return {
    isDuplicate: false,
    message: '✅ RTWE number is unique'
  };
}

/**
 * Check for duplicate PO number
 */
function checkDuplicatePO(poNo) {
  if (!poNo || poNo.toString().trim() === '') {
    return {
      isDuplicate: false,
      message: 'No PO number provided'
    };
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const confirmedSheet = ss.getSheetByName(CONFIG.SHEETS.CONFIRMED);
  
  if (!confirmedSheet) {
    return {
      isDuplicate: false,
      message: 'Confirmed sheet not found'
    };
  }
  
  const data = getSheetData(confirmedSheet);
  
  for (let row of data) {
    const existingPO = row[12]; // Column M (PO No)
    if (existingPO && existingPO.toString().trim() === poNo.toString().trim()) {
      const rtweNo = row[0];
      return {
        isDuplicate: true,
        message: '⚠️ DUPLICATE PO NUMBER!\n\nPO ' + poNo + ' already exists for RTWE ' + rtweNo + '.',
        existingRTWE: rtweNo
      };
    }
  }
  
  return {
    isDuplicate: false,
    message: '✅ PO number is unique'
  };
}

/**
 * Clear form fields (for sheet-based form)
 */
function clearFormUpdated() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const formSheet = ss.getSheetByName(CONFIG.SHEETS.FORM);
  if (!formSheet) return;
  
  // Clear all input cells
  const clearCells = [
    CONFIG.CELLS.BROKER,
    CONFIG.CELLS.QUALITY,
    CONFIG.CELLS.GIVEN_RATE,
    CONFIG.CELLS.APPROVED_DATE,
    CONFIG.CELLS.APPROVED_TIME,
    CONFIG.CELLS.FINAL_RATE,
    CONFIG.CELLS.BUYER,
    CONFIG.CELLS.PO_NO,
    CONFIG.CELLS.QUALITY_ORDER,
    CONFIG.CELLS.DESIGN1, CONFIG.CELLS.TAGA1,
    CONFIG.CELLS.DESIGN2, CONFIG.CELLS.TAGA2,
    CONFIG.CELLS.DESIGN3, CONFIG.CELLS.TAGA3,
    CONFIG.CELLS.DESIGN4, CONFIG.CELLS.TAGA4,
    CONFIG.CELLS.DESIGN5, CONFIG.CELLS.TAGA5,
    CONFIG.CELLS.DESIGN6, CONFIG.CELLS.TAGA6,
    CONFIG.CELLS.COUNT_METER,
    CONFIG.CELLS.SELVEDGE_NAME,
    CONFIG.CELLS.SELVEDGE_ENDS,
    CONFIG.CELLS.SELVEDGE_COLOR,
    CONFIG.CELLS.YARN_USED,
    CONFIG.CELLS.SIZING_BEAM,
    CONFIG.CELLS.PAYMENT_TERMS,
    CONFIG.CELLS.DELIVERY_DATE,
    CONFIG.CELLS.REMARK
  ];
  
  clearCells.forEach(cell => {
    if (cell) formSheet.getRange(cell).clearContent();
  });
  
  Logger.log('✅ Form cleared');
}

/**
 * Generate QR code for order
 */
function generateQRCodeForOrder(rtweNo, targetSheet, rowNumber) {
  try {
    const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + 
                  encodeURIComponent('RTWE: ' + rtweNo);
    
    const qrFormula = '=IMAGE("' + qrUrl + '")';
    
    // Assuming QR code is in last column (column 43 for confirmed sheet)
    const qrCol = targetSheet.getLastColumn();
    targetSheet.getRange(rowNumber, qrCol).setFormula(qrFormula);
    
    Logger.log('✅ QR Code generated for ' + rtweNo);
  } catch (error) {
    Logger.log('QR Code generation error: ' + error);
  }
}

/**
 * Get unique values from master data column
 */
function getUniqueValuesFromColumn(columnIndex) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const masterSheet = ss.getSheetByName(CONFIG.SHEETS.MASTER);
  
  if (!masterSheet) return [];
  
  const data = getSheetData(masterSheet);
  const values = [];
  const seen = {};
  
  for (let row of data) {
    const val = row[columnIndex];
    if (val && val !== '' && !seen[val]) {
      values.push(val);
      seen[val] = true;
    }
  }
  
  return values.sort();
}

/**
 * Send Telegram notification (simple version)
 */
function sendTelegramNotificationSimple(message) {
  try {
    if (!TELEGRAM_CONFIG.ENABLED) {
      Logger.log('Telegram not enabled');
      return;
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const telegramSheet = ss.getSheetByName('TELEGRAM_USERS');
    
    if (!telegramSheet) {
      Logger.log('TELEGRAM_USERS sheet not found');
      return;
    }
    
    const data = telegramSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const chatId = data[i][0];
      const status = data[i][3];
      
      if (status === 'Active' && chatId) {
        sendTelegramMessage(chatId, message);
      }
    }
    
    Logger.log('✅ Telegram notifications sent');
  } catch (error) {
    Logger.log('Telegram notification error: ' + error);
  }
}

/**
 * Send Telegram message
 */
function sendTelegramMessage(chatId, text) {
  if (!TELEGRAM_CONFIG.ENABLED) return;
  
  const url = TELEGRAM_CONFIG.API_URL + TELEGRAM_CONFIG.BOT_TOKEN + '/sendMessage';
  
  const payload = {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown'
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    UrlFetchApp.fetch(url, options);
  } catch (error) {
    Logger.log('Telegram send error: ' + error);
  }
}

/**
 * Send Telegram document
 */
function sendTelegramDocument(chatId, blob, filename, caption) {
  if (!TELEGRAM_CONFIG.ENABLED) return;
  
  const url = TELEGRAM_CONFIG.API_URL + TELEGRAM_CONFIG.BOT_TOKEN + '/sendDocument';
  
  const formData = {
    chat_id: chatId,
    document: blob,
    caption: caption || ''
  };
  
  const options = {
    method: 'post',
    payload: formData,
    muteHttpExceptions: true
  };
  
  try {
    UrlFetchApp.fetch(url, options);
  } catch (error) {
    Logger.log('Telegram document send error: ' + error);
  }
}

/**
 * Get enquiry data for broker form
 * DISABLED - Use the version in PdfShare.gs to avoid conflicts
 */
function getEnquiryForBroker_DISABLED_Utillities(rtweNo) {
  // DISABLED - This duplicate was causing conflicts
  Logger.log('⚠️ getEnquiryForBroker_DISABLED_Utillities called');
  return null;
}