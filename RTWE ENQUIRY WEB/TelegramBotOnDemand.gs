// ============================================
// TELEGRAM BOT - RTWE DETAILS ON DEMAND
// Add this to your Telegram.gs file
// ============================================

/**
 * Handle incoming Telegram messages
 * This processes commands like: "RTWE15" or "details RTWE15"
 */
function processTelegramMessage(message) {
  try {
    const chatId = message.chat.id;
    const text = message.text || '';
    const username = message.from.username || message.from.first_name || 'User';
    
    Logger.log('Message from ' + username + ': ' + text);
    
    // Check if user is registered
    if (!isTelegramUserActive(chatId)) {
      sendTelegramMessage(chatId, 
        '❌ You are not authorized to use this bot.\n\n' +
        'Please contact admin to register your Telegram account.\n\n' +
        '📞 Contact: 9423858123'
      );
      return;
    }
    
    // Commands
    const lowerText = text.toLowerCase().trim();
    
    // Help command
    if (lowerText === '/start' || lowerText === '/help' || lowerText === 'help') {
      sendHelpMessage(chatId);
      return;
    }
    
    // Check for RTWE pattern
    const rtwePattern = /RTWE\d+/i;
    const match = text.match(rtwePattern);
    
    if (match) {
      const rtweNo = match[0].toUpperCase();
      handleRTWEDetailsRequest(chatId, rtweNo, username);
      return;
    }
    
    // List all RTWEs
    if (lowerText === 'list' || lowerText === 'all' || lowerText === '/list') {
      sendRTWEList(chatId);
      return;
    }
    
    // Latest RTWE
    if (lowerText === 'latest' || lowerText === 'recent' || lowerText === '/latest') {
      sendLatestRTWEs(chatId);
      return;
    }
    
    // Pending RTWEs
    if (lowerText === 'pending' || lowerText === '/pending') {
      sendPendingRTWEs(chatId);
      return;
    }
    
    // Search by broker
    if (lowerText.startsWith('broker ')) {
      const brokerName = text.substring(7).trim();
      searchByBroker(chatId, brokerName);
      return;
    }
    
    // Default response
    sendTelegramMessage(chatId, 
      '❓ I didn\'t understand that.\n\n' +
      'Try:\n' +
      '• RTWE15 - Get details\n' +
      '• latest - Recent orders\n' +
      '• pending - Pending orders\n' +
      '• list - All RTWEs\n' +
      '• broker [name] - Search by broker\n' +
      '• help - Show all commands'
    );
    
  } catch (error) {
    Logger.log('❌ processTelegramMessage error: ' + error);
  }
}

/**
 * Send help message
 */
function sendHelpMessage(chatId) {
  const helpText = 
    '🤖 *RTWE Bot Commands*\n\n' +
    '📋 *Get Details:*\n' +
    '• `RTWE15` - Get PDF with details\n' +
    '• `details RTWE15` - Same as above\n\n' +
    '📊 *Lists:*\n' +
    '• `latest` - Last 10 RTWEs\n' +
    '• `pending` - Pending orders\n' +
    '• `list` - All RTWEs\n\n' +
    '🔍 *Search:*\n' +
    '• `broker Mr. Kewal` - Search by broker\n\n' +
    '💡 *Examples:*\n' +
    '• Just type: RTWE15\n' +
    '• Or: details RTWE15\n' +
    '• Or: pending\n\n' +
    '📞 *Support:* 9423858123';
  
  sendTelegramMessage(chatId, helpText, true);
}

/**
 * Handle RTWE details request
 */
function handleRTWEDetailsRequest(chatId, rtweNo, username) {
  try {
    sendTelegramMessage(chatId, '⏳ Fetching details for ' + rtweNo + '...');
    
    // Get RTWE data from sheets
    const rtweData = getRTWEData(rtweNo);
    
    if (!rtweData) {
      sendTelegramMessage(chatId, 
        '❌ *RTWE Not Found*\n\n' +
        'RTWE No: `' + rtweNo + '`\n\n' +
        'This RTWE does not exist in the system.\n\n' +
        'Try:\n' +
        '• `latest` - See recent RTWEs\n' +
        '• `list` - See all RTWEs',
        true
      );
      return;
    }
    
    // Generate PDF
    sendTelegramMessage(chatId, '📄 Generating PDF...');
    
    const pdfResult = generateEnquiryPDF(rtweData);
    
    if (!pdfResult.success) {
      sendTelegramMessage(chatId, '❌ Error generating PDF: ' + pdfResult.error);
      return;
    }
    
    // Send summary text
    const summary = formatRTWESummary(rtweData);
    sendTelegramMessage(chatId, summary, true);
    
    // Send PDF
    const file = DriveApp.getFileById(pdfResult.fileId);
    const pdfBlob = file.getBlob();
    
    sendTelegramDocument(
      chatId, 
      pdfBlob, 
      pdfResult.fileName,
      '📋 Complete details for ' + rtweNo
    );
    
    // Log activity
    logTelegramActivity(chatId, username, 'RTWE_DETAILS_REQUEST', rtweNo);
    
    Logger.log('✅ Sent ' + rtweNo + ' details to ' + username);
    
  } catch (error) {
    Logger.log('❌ handleRTWEDetailsRequest error: ' + error);
    sendTelegramMessage(chatId, '❌ Error: ' + error.message);
  }
}

/**
 * Get RTWE data from all sheets
 */
function getRTWEData(rtweNo) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = [
      'PENDING_DATA',
      'PENDING_APPROVED',
      'ORDER_CONFIRM_DATA',
      'ENQUIRY_CLOSED_DATA'
    ];
    
    for (let sheetName of sheets) {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) continue;
      
      const data = sheet.getDataRange().getValues();
      const headers = data[0];
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === rtweNo) {
          // Found the RTWE - create object
          const rtweData = {};
          
          for (let j = 0; j < headers.length; j++) {
            const key = headers[j].toString().trim();
            const value = data[i][j];
            
            // Map common fields
            if (key === 'RTWE No') rtweData.rtweNo = value;
            else if (key === 'Costing Sheet No') rtweData.costingNo = value;
            else if (key === 'Enquiry Date') rtweData.enqDate = value;
            else if (key === 'Enquiry Time') rtweData.enqTime = value;
            else if (key === 'Broker Name') rtweData.broker = value;
            else if (key === 'Quality') rtweData.quality = value;
            else if (key === 'Given Rate') rtweData.givenRate = value;
            else if (key === 'Order Status') rtweData.orderStatus = value;
            else if (key === 'Approved Date') rtweData.approvedDate = value;
            else if (key === 'Final Rate') rtweData.finalRate = value;
            else if (key === 'Buyer') rtweData.buyer = value;
            else if (key === 'P/O No') rtweData.poNo = value;
            else if (key === 'Total Order Taga') rtweData.totalOrderTaga = value;
            else if (key === 'Total MTR') rtweData.totalMTR = value;
            else if (key === 'Total Order Value') rtweData.totalOrderValue = value;
            else if (key === 'Delivery Date') rtweData.deliveryDate = value;
            else if (key === 'Name of Selvedge') rtweData.selvedgeName = value;
            else if (key === 'Remark') rtweData.remark = value;
          }
          
          rtweData.sheetName = sheetName;
          return rtweData;
        }
      }
    }
    
    return null;
    
  } catch (error) {
    Logger.log('❌ getRTWEData error: ' + error);
    return null;
  }
}

/**
 * Format RTWE summary for Telegram
 */
function formatRTWESummary(rtweData) {
  let summary = 
    '📋 *RTWE DETAILS*\n\n' +
    '🔢 *RTWE No:* `' + (rtweData.rtweNo || 'N/A') + '`\n' +
    '📄 *Costing No:* `' + (rtweData.costingNo || 'N/A') + '`\n' +
    '📅 *Date:* ' + (rtweData.enqDate || 'N/A') + '\n' +
    '🤝 *Broker:* ' + (rtweData.broker || 'N/A') + '\n' +
    '🧵 *Quality:* ' + (rtweData.quality || 'N/A') + '\n' +
    '💰 *Given Rate:* ₹' + (rtweData.givenRate || 'N/A') + '\n' +
    '📊 *Status:* ' + (rtweData.orderStatus || 'N/A') + '\n';
  
  if (rtweData.orderStatus === 'Approved' && rtweData.buyer) {
    summary += '\n' +
      '✅ *APPROVED ORDER*\n' +
      '👤 *Buyer:* ' + (rtweData.buyer || 'N/A') + '\n' +
      '📝 *P/O No:* ' + (rtweData.poNo || 'N/A') + '\n' +
      '💵 *Final Rate:* ₹' + (rtweData.finalRate || 'N/A') + '\n' +
      '📏 *Total MTR:* ' + (rtweData.totalMTR || 'N/A') + '\n' +
      '💰 *Order Value:* ₹' + (rtweData.totalOrderValue || 'N/A') + '\n' +
      '🚚 *Delivery:* ' + (rtweData.deliveryDate || 'N/A') + '\n';
  }
  
  if (rtweData.selvedgeName) {
    summary += '🧵 *Selvedge:* ' + rtweData.selvedgeName + '\n';
  }
  
  if (rtweData.remark) {
    summary += '\n📝 *Remark:* ' + rtweData.remark + '\n';
  }
  
  summary += '\n📄 *PDF attached below*⬇️';
  
  return summary;
}

/**
 * Send list of recent RTWEs
 */
function sendLatestRTWEs(chatId) {
  try {
    sendTelegramMessage(chatId, '⏳ Fetching latest RTWEs...');
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ['ORDER_CONFIRM_DATA', 'PENDING_APPROVED', 'PENDING_DATA'];
    
    const allRTWEs = [];
    
    for (let sheetName of sheets) {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) continue;
      
      const data = sheet.getDataRange().getValues();
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0]) {
          allRTWEs.push({
            rtwe: data[i][0],
            date: data[i][2] || 'N/A',
            broker: data[i][4] || 'N/A',
            status: data[i][7] || 'N/A',
            sheet: sheetName
          });
        }
      }
    }
    
    // Sort by RTWE number (latest first)
    allRTWEs.sort((a, b) => {
      const numA = parseInt(a.rtwe.replace('RTWE', ''));
      const numB = parseInt(b.rtwe.replace('RTWE', ''));
      return numB - numA;
    });
    
    // Take latest 10
    const latest = allRTWEs.slice(0, 10);
    
    if (latest.length === 0) {
      sendTelegramMessage(chatId, '❌ No RTWEs found in system');
      return;
    }
    
    let message = '📊 *Latest 10 RTWEs*\n\n';
    
    latest.forEach(item => {
      message += 
        '🔹 `' + item.rtwe + '`\n' +
        '   📅 ' + item.date + '\n' +
        '   🤝 ' + item.broker + '\n' +
        '   📊 ' + item.status + '\n\n';
    });
    
    message += '💡 Type any RTWE number to get details\n';
    message += 'Example: `RTWE15`';
    
    sendTelegramMessage(chatId, message, true);
    
  } catch (error) {
    Logger.log('❌ sendLatestRTWEs error: ' + error);
    sendTelegramMessage(chatId, '❌ Error: ' + error.message);
  }
}

/**
 * Send pending RTWEs
 */
function sendPendingRTWEs(chatId) {
  try {
    sendTelegramMessage(chatId, '⏳ Fetching pending orders...');
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const pendingSheet = ss.getSheetByName('PENDING_DATA');
    
    if (!pendingSheet) {
      sendTelegramMessage(chatId, '❌ Pending data sheet not found');
      return;
    }
    
    const data = pendingSheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      sendTelegramMessage(chatId, '✅ No pending orders!');
      return;
    }
    
    let message = '⏰ *Pending Orders*\n\n';
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        message += 
          '🔹 `' + data[i][0] + '`\n' +
          '   📅 ' + (data[i][2] || 'N/A') + '\n' +
          '   🤝 ' + (data[i][4] || 'N/A') + '\n' +
          '   💰 ₹' + (data[i][6] || 'N/A') + '\n\n';
      }
    }
    
    message += '\n📊 Total Pending: ' + (data.length - 1) + '\n';
    message += '💡 Type RTWE number for details';
    
    sendTelegramMessage(chatId, message, true);
    
  } catch (error) {
    Logger.log('❌ sendPendingRTWEs error: ' + error);
    sendTelegramMessage(chatId, '❌ Error: ' + error.message);
  }
}

/**
 * Search by broker name
 */
function searchByBroker(chatId, brokerName) {
  try {
    sendTelegramMessage(chatId, '🔍 Searching for broker: ' + brokerName);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ['ORDER_CONFIRM_DATA', 'PENDING_APPROVED', 'PENDING_DATA'];
    
    const results = [];
    
    for (let sheetName of sheets) {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) continue;
      
      const data = sheet.getDataRange().getValues();
      
      for (let i = 1; i < data.length; i++) {
        const rtwe = data[i][0];
        const broker = data[i][4] || '';
        
        if (rtwe && broker.toLowerCase().includes(brokerName.toLowerCase())) {
          results.push({
            rtwe: rtwe,
            date: data[i][2] || 'N/A',
            broker: broker,
            quality: data[i][5] || 'N/A',
            rate: data[i][6] || 'N/A',
            status: data[i][7] || 'N/A'
          });
        }
      }
    }
    
    if (results.length === 0) {
      sendTelegramMessage(chatId, 
        '❌ No orders found for broker: ' + brokerName + '\n\n' +
        'Try:\n' +
        '• Check spelling\n' +
        '• Use partial name\n' +
        '• Type `list` to see all'
      );
      return;
    }
    
    let message = '🔍 *Search Results*\n';
    message += '🤝 Broker: ' + brokerName + '\n';
    message += '📊 Found: ' + results.length + ' orders\n\n';
    
    results.slice(0, 10).forEach(item => {
      message += 
        '🔹 `' + item.rtwe + '`\n' +
        '   📅 ' + item.date + '\n' +
        '   🧵 ' + item.quality + '\n' +
        '   💰 ₹' + item.rate + '\n' +
        '   📊 ' + item.status + '\n\n';
    });
    
    if (results.length > 10) {
      message += '... and ' + (results.length - 10) + ' more\n\n';
    }
    
    message += '💡 Type RTWE number for details';
    
    sendTelegramMessage(chatId, message, true);
    
  } catch (error) {
    Logger.log('❌ searchByBroker error: ' + error);
    sendTelegramMessage(chatId, '❌ Error: ' + error.message);
  }
}

/**
 * Check if Telegram user is active
 */
function isTelegramUserActive(chatId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const telegramSheet = ss.getSheetByName('TELEGRAM_USERS');
    
    if (!telegramSheet) return false;
    
    const data = telegramSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] == chatId && data[i][3] === 'Active') {
        return true;
      }
    }
    
    return false;
    
  } catch (error) {
    Logger.log('❌ isTelegramUserActive error: ' + error);
    return false;
  }
}

/**
 * Log Telegram activity
 */
function logTelegramActivity(chatId, username, action, details) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let logSheet = ss.getSheetByName('TELEGRAM_ACTIVITY_LOG');
    
    if (!logSheet) {
      logSheet = ss.insertSheet('TELEGRAM_ACTIVITY_LOG');
      logSheet.getRange(1, 1, 1, 5).setValues([
        ['Timestamp', 'Chat ID', 'Username', 'Action', 'Details']
      ]);
      logSheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#4a86e8');
    }
    
    const timestamp = new Date();
    
    logSheet.appendRow([
      timestamp,
      chatId,
      username,
      action,
      details
    ]);
    
  } catch (error) {
    Logger.log('❌ logTelegramActivity error: ' + error);
  }
}

/**
 * Send list of all RTWEs
 */
function sendRTWEList(chatId) {
  try {
    sendTelegramMessage(chatId, '⏳ Fetching all RTWEs...');
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ['ORDER_CONFIRM_DATA', 'PENDING_APPROVED', 'PENDING_DATA'];
    
    let message = '📊 *All RTWEs in System*\n\n';
    let total = 0;
    
    for (let sheetName of sheets) {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) continue;
      
      const data = sheet.getDataRange().getValues();
      const count = data.length - 1;
      
      if (count > 0) {
        total += count;
        
        let statusEmoji = '📋';
        if (sheetName === 'ORDER_CONFIRM_DATA') statusEmoji = '✅';
        else if (sheetName === 'PENDING_APPROVED') statusEmoji = '⏳';
        else if (sheetName === 'PENDING_DATA') statusEmoji = '⏰';
        
        message += statusEmoji + ' *' + sheetName.replace('_', ' ') + ':* ' + count + '\n';
      }
    }
    
    message += '\n📊 *Total:* ' + total + ' orders\n\n';
    message += '💡 Commands:\n';
    message += '• `latest` - Recent 10\n';
    message += '• `pending` - Pending orders\n';
    message += '• `RTWE15` - Get details\n';
    message += '• `broker [name]` - Search by broker';
    
    sendTelegramMessage(chatId, message, true);
    
  } catch (error) {
    Logger.log('❌ sendRTWEList error: ' + error);
    sendTelegramMessage(chatId, '❌ Error: ' + error.message);
  }
}