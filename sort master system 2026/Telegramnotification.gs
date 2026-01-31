/**
 * ============================================================================
 * SORT MASTER MANAGEMENT SYSTEM 2026
 * Telegram Notification Module
 * ============================================================================
 * 
 * Handles Telegram bot notifications via Telegram Bot API.
 * 
 * Bot Token: 8398512229:AAGUBN1as8A9SalazravrVMwy7YdG8_JjYo
 * 
 * @version 1.0
 * @author Sort Master System
 * @date December 25, 2025
 */

/**
 * ============================================================================
 * CORE TELEGRAM FUNCTIONS
 * ============================================================================
 */

/**
 * Send Telegram message
 * @param {string} chatId - Telegram chat ID
 * @param {string} message - Message text
 * @param {Object} options - Additional options (parse_mode, disable_notification)
 * @return {boolean} True if sent successfully
 */
function sendTelegramMessage(chatId, message, options) {
  try {
    if (!TELEGRAM_CONFIG.ENABLED) {
      Logger.log('Telegram notifications are disabled');
      return false;
    }
    
    if (!chatId) {
      Logger.log('Chat ID is required');
      return false;
    }
    
    const url = getTelegramEndpoint('sendMessage');
    
    const payload = {
      chat_id: chatId,
      text: message,
      parse_mode: options && options.parse_mode ? options.parse_mode : 'HTML',
      disable_notification: options && options.disable_notification ? true : false
    };
    
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    const result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      Logger.log('Telegram message sent to chat: ' + chatId);
      return true;
    } else {
      Logger.log('Telegram API error: ' + result.description);
      return false;
    }
    
  } catch (error) {
    Logger.log('sendTelegramMessage error: ' + error.message);
    return false;
  }
}

/**
 * ============================================================================
 * LOGIN ALERTS
 * ============================================================================
 */

/**
 * Send login alert via Telegram
 * @param {number} userId - User ID
 * @param {string} userName - User name
 * @param {string} chatId - Telegram chat ID
 * @param {string} ipAddress - IP address
 * @return {boolean} True if sent successfully
 */
function sendLoginAlert(userId, userName, chatId, ipAddress) {
  try {
    if (!TELEGRAM_CONFIG.ENABLED || !chatId) {
      return false;
    }
    
    const now = new Date();
    const formattedTime = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
    
    const message = `
🔐 <b>Login Alert</b>

<b>User:</b> ${userName}
<b>Time:</b> ${formattedTime}
<b>IP Address:</b> ${ipAddress || 'Unknown'}

Your account was just accessed. If this wasn't you, please contact your administrator immediately.

<i>Sort Master System</i>
    `.trim();
    
    return sendTelegramMessage(chatId, message);
    
  } catch (error) {
    Logger.log('sendLoginAlert error: ' + error.message);
    return false;
  }
}

/**
 * ============================================================================
 * SORT MASTER NOTIFICATIONS
 * ============================================================================
 */

/**
 * Send Sort Master created notification via Telegram
 * @param {string} chatId - Telegram chat ID
 * @param {string} sortMasterNo - Sort Master number
 * @param {string} rtweNo - RTWE number
 * @param {string} quality - Quality description
 * @return {boolean} True if sent successfully
 */
function sendSortMasterCreatedTelegram(chatId, sortMasterNo, rtweNo, quality) {
  try {
    if (!TELEGRAM_CONFIG.ENABLED || !chatId) {
      return false;
    }
    
    const now = new Date();
    const formattedTime = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
    
    const message = `
✅ <b>Sort Master Created</b>

<b>Sort Master No:</b> ${sortMasterNo}
<b>RTWE No:</b> ${rtweNo}
<b>Quality:</b> ${quality}
<b>Created:</b> ${formattedTime}

<i>Sort Master System</i>
    `.trim();
    
    return sendTelegramMessage(chatId, message);
    
  } catch (error) {
    Logger.log('sendSortMasterCreatedTelegram error: ' + error.message);
    return false;
  }
}

/**
 * Send Sort Master updated notification
 * @param {string} chatId - Telegram chat ID
 * @param {string} sortMasterNo - Sort Master number
 * @param {string} userName - User who updated
 * @return {boolean} True if sent successfully
 */
function sendSortMasterUpdatedTelegram(chatId, sortMasterNo, userName) {
  try {
    if (!TELEGRAM_CONFIG.ENABLED || !chatId) {
      return false;
    }
    
    const now = new Date();
    const formattedTime = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
    
    const message = `
✏️ <b>Sort Master Updated</b>

<b>Sort Master No:</b> ${sortMasterNo}
<b>Updated By:</b> ${userName}
<b>Time:</b> ${formattedTime}

<i>Sort Master System</i>
    `.trim();
    
    return sendTelegramMessage(chatId, message);
    
  } catch (error) {
    Logger.log('sendSortMasterUpdatedTelegram error: ' + error.message);
    return false;
  }
}

/**
 * ============================================================================
 * STATUS UPDATES
 * ============================================================================
 */

/**
 * Send status update notification
 * @param {string} chatId - Telegram chat ID
 * @param {string} title - Notification title
 * @param {string} message - Message content
 * @param {string} icon - Emoji icon (optional)
 * @return {boolean} True if sent successfully
 */
function sendStatusUpdate(chatId, title, message, icon) {
  try {
    if (!TELEGRAM_CONFIG.ENABLED || !chatId) {
      return false;
    }
    
    const emoji = icon || '📢';
    
    const fullMessage = `
${emoji} <b>${title}</b>

${message}

<i>Sort Master System</i>
    `.trim();
    
    return sendTelegramMessage(chatId, fullMessage);
    
  } catch (error) {
    Logger.log('sendStatusUpdate error: ' + error.message);
    return false;
  }
}

/**
 * ============================================================================
 * BROADCAST MESSAGES
 * ============================================================================
 */

/**
 * Broadcast message to all users with Telegram enabled
 * @param {string} message - Message to broadcast
 * @param {string} title - Message title (optional)
 * @return {Object} {sent, failed}
 */
function broadcastTelegramMessage(message, title) {
  try {
    if (!TELEGRAM_CONFIG.ENABLED) {
      return { sent: 0, failed: 0 };
    }
    
    // Get all active users with Telegram enabled
    const sheet = getSheet(SHEET_NAMES.USERS);
    const data = sheet.getDataRange().getValues();
    
    let sent = 0;
    let failed = 0;
    
    for (let i = 1; i < data.length; i++) {
      const isActive = data[i][7];
      const telegramNotifications = data[i][12];
      const telegramChatId = data[i][5];
      
      if (isActive && telegramNotifications && telegramChatId) {
        const fullMessage = title ? `<b>${title}</b>\n\n${message}` : message;
        
        const result = sendTelegramMessage(telegramChatId, fullMessage);
        
        if (result) {
          sent++;
        } else {
          failed++;
        }
        
        // Small delay between messages
        Utilities.sleep(100);
      }
    }
    
    Logger.log('Telegram broadcast complete: ' + sent + ' sent, ' + failed + ' failed');
    
    return { sent: sent, failed: failed };
    
  } catch (error) {
    Logger.log('broadcastTelegramMessage error: ' + error.message);
    return { sent: 0, failed: 0 };
  }
}

/**
 * ============================================================================
 * TELEGRAM BOT INFO
 * ============================================================================
 */

/**
 * Get Telegram bot information
 * @return {Object} Bot info or null
 */
function getTelegramBotInfo() {
  try {
    const url = getTelegramEndpoint('getMe');
    
    const response = UrlFetchApp.fetch(url, {
      method: 'get',
      muteHttpExceptions: true
    });
    
    const result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      return result.result;
    } else {
      Logger.log('Failed to get bot info: ' + result.description);
      return null;
    }
    
  } catch (error) {
    Logger.log('getTelegramBotInfo error: ' + error.message);
    return null;
  }
}

/**
 * Get Telegram bot username
 * @return {string} Bot username or empty string
 */
function getTelegramBotUsername() {
  try {
    const info = getTelegramBotInfo();
    return info ? info.username : '';
  } catch (error) {
    Logger.log('getTelegramBotUsername error: ' + error.message);
    return '';
  }
}

/**
 * ============================================================================
 * CHAT ID UTILITIES
 * ============================================================================
 */

/**
 * Get instructions for finding chat ID
 * @return {string} Instructions text
 */
function getChatIdInstructions() {
  const botUsername = getTelegramBotUsername();
  
  return `
To get your Telegram Chat ID:

1. Open Telegram app
2. Search for bot: @${botUsername || 'YourBot'}
3. Send /start to the bot
4. The bot will reply with your Chat ID
5. Copy the Chat ID and paste it in your profile settings

OR

Use this bot to get your Chat ID:
1. Search for @userinfobot in Telegram
2. Send /start
3. It will show your Chat ID
  `.trim();
}

/**
 * ============================================================================
 * MESSAGE FORMATTING
 * ============================================================================
 */

/**
 * Format data as Telegram table
 * @param {Array} headers - Table headers
 * @param {Array} rows - Table rows
 * @return {string} Formatted message
 */
function formatTelegramTable(headers, rows) {
  let message = '<pre>';
  
  // Headers
  message += headers.join(' | ') + '\n';
  message += '-'.repeat(headers.join(' | ').length) + '\n';
  
  // Rows
  for (let i = 0; i < rows.length; i++) {
    message += rows[i].join(' | ') + '\n';
  }
  
  message += '</pre>';
  
  return message;
}

/**
 * Create clickable link for Telegram
 * @param {string} url - URL
 * @param {string} text - Link text
 * @return {string} Formatted link
 */
function createTelegramLink(url, text) {
  return `<a href="${url}">${text}</a>`;
}

/**
 * Escape HTML for Telegram
 * @param {string} text - Text to escape
 * @return {string} Escaped text
 */
function escapeTelegramHTML(text) {
  if (!text) return '';
  
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * ============================================================================
 * WEBHOOK HANDLER (Optional)
 * ============================================================================
 */

/**
 * Handle incoming Telegram webhooks
 * This can be used if you want to receive commands from users
 * 
 * @param {Object} e - Event object from doPost
 * @return {Object} Response
 */
function handleTelegramWebhook(e) {
  try {
    const update = JSON.parse(e.postData.contents);
    
    if (update.message) {
      const chatId = update.message.chat.id;
      const text = update.message.text;
      
      // Handle /start command
      if (text === '/start') {
        const welcomeMessage = `
Welcome to Sort Master System Bot! 🎉

Your Chat ID is: <code>${chatId}</code>

Please save this Chat ID and add it to your profile in the Sort Master System to receive notifications.

<i>Sort Master System</i>
        `.trim();
        
        sendTelegramMessage(chatId, welcomeMessage);
      }
      
      // Handle /help command
      else if (text === '/help') {
        const helpMessage = `
<b>Sort Master Bot Commands:</b>

/start - Get your Chat ID
/help - Show this help message

To receive notifications, add your Chat ID to your profile in the Sort Master System.

<i>Sort Master System</i>
        `.trim();
        
        sendTelegramMessage(chatId, helpMessage);
      }
      
      // Unknown command
      else {
        sendTelegramMessage(chatId, 'Unknown command. Type /help for available commands.');
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    Logger.log('handleTelegramWebhook error: ' + error.message);
    return ContentService.createTextOutput(JSON.stringify({ status: 'error' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Set webhook URL for Telegram bot
 * Run this once to configure webhook
 * @param {string} webhookUrl - Your web app URL
 * @return {boolean} True if successful
 */
function setTelegramWebhook(webhookUrl) {
  try {
    const url = getTelegramEndpoint('setWebhook');
    
    const payload = {
      url: webhookUrl
    };
    
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    
    const result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      Logger.log('Webhook set successfully');
      return true;
    } else {
      Logger.log('Failed to set webhook: ' + result.description);
      return false;
    }
    
  } catch (error) {
    Logger.log('setTelegramWebhook error: ' + error.message);
    return false;
  }
}

/**
 * Delete webhook
 * @return {boolean} True if successful
 */
function deleteTelegramWebhook() {
  try {
    const url = getTelegramEndpoint('deleteWebhook');
    
    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      muteHttpExceptions: true
    });
    
    const result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      Logger.log('Webhook deleted successfully');
      return true;
    } else {
      Logger.log('Failed to delete webhook: ' + result.description);
      return false;
    }
    
  } catch (error) {
    Logger.log('deleteTelegramWebhook error: ' + error.message);
    return false;
  }
}

/**
 * ============================================================================
 * TESTING
 * ============================================================================
 */

/**
 * Test Telegram notifications
 */
function testTelegramNotifications() {
  Logger.log('========================================');
  Logger.log('TELEGRAM NOTIFICATIONS TEST');
  Logger.log('========================================');
  
  // Get bot info
  const botInfo = getTelegramBotInfo();
  if (botInfo) {
    Logger.log('Bot Name: ' + botInfo.first_name);
    Logger.log('Bot Username: @' + botInfo.username);
  } else {
    Logger.log('Failed to get bot info - check bot token');
  }
  
  // Test message (update with real chat ID)
  const testChatId = '123456789'; // Replace with real chat ID
  
  Logger.log('\nSending test message to chat: ' + testChatId);
  
  const result = sendTelegramMessage(
    testChatId,
    '<b>Test Notification</b>\n\nThis is a test message from Sort Master System.\n\n<i>If you received this, Telegram notifications are working!</i>'
  );
  
  Logger.log('Message sent: ' + result);
  
  Logger.log('========================================');
  Logger.log('TELEGRAM NOTIFICATIONS TEST COMPLETE');
  Logger.log('========================================');
}

/**
 * Get chat ID instructions
 */
function showChatIdInstructions() {
  Logger.log(getChatIdInstructions());
}