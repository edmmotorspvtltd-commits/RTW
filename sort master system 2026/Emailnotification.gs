/**
 * ============================================================================
 * SORT MASTER MANAGEMENT SYSTEM 2026
 * Email Notification Module
 * ============================================================================
 * 
 * Handles all email notifications:
 * - User creation welcome emails
 * - Password reset emails
 * - Sort Master creation notifications
 * - Custom notifications
 * 
 * @version 1.0
 * @author Sort Master System
 * @date December 25, 2025
 */

/**
 * ============================================================================
 * USER CREATION EMAIL
 * ============================================================================
 */

/**
 * Send welcome email to new user
 * @param {string} email - User's email address
 * @param {string} userName - User's name
 * @param {string} password - User's password (plain text)
 * @return {boolean} True if sent successfully
 */
function sendUserCreationEmail(email, userName, password) {
  try {
    if (!EMAIL_CONFIG.ENABLED) {
      Logger.log('Email notifications are disabled');
      return false;
    }
    
    const subject = EMAIL_TEMPLATES.USER_CREATION.subject;
    const htmlBody = EMAIL_TEMPLATES.USER_CREATION.getBody(userName, email, password);
    
    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody,
      name: EMAIL_CONFIG.FROM_NAME,
      replyTo: EMAIL_CONFIG.REPLY_TO
    });
    
    Logger.log('User creation email sent to: ' + email);
    return true;
    
  } catch (error) {
    Logger.log('sendUserCreationEmail error: ' + error.message);
    return false;
  }
}

/**
 * ============================================================================
 * PASSWORD RESET EMAIL
 * ============================================================================
 */

/**
 * Send password reset email
 * @param {string} email - User's email address
 * @param {string} userName - User's name
 * @param {string} resetLink - Password reset link
 * @return {boolean} True if sent successfully
 */
function sendPasswordResetEmail(email, userName, resetLink) {
  try {
    if (!EMAIL_CONFIG.ENABLED) {
      Logger.log('Email notifications are disabled');
      return false;
    }
    
    const subject = EMAIL_TEMPLATES.PASSWORD_RESET.subject;
    const htmlBody = EMAIL_TEMPLATES.PASSWORD_RESET.getBody(userName, resetLink);
    
    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody,
      name: EMAIL_CONFIG.FROM_NAME,
      replyTo: EMAIL_CONFIG.REPLY_TO
    });
    
    Logger.log('Password reset email sent to: ' + email);
    return true;
    
  } catch (error) {
    Logger.log('sendPasswordResetEmail error: ' + error.message);
    return false;
  }
}

/**
 * ============================================================================
 * SORT MASTER CREATION EMAIL
 * ============================================================================
 */

/**
 * Send Sort Master created notification email
 * @param {string} sortMasterNo - Sort Master number
 * @param {string} rtweNo - RTWE number
 * @param {string} quality - Quality description
 * @param {number} glm - GLM value
 * @param {number} gsm - GSM value
 * @param {string} createdBy - Creator's name
 * @return {boolean} True if sent successfully
 */
function sendSortMasterCreatedEmail(sortMasterNo, rtweNo, quality, glm, gsm, createdBy) {
  try {
    if (!EMAIL_CONFIG.ENABLED) {
      Logger.log('Email notifications are disabled');
      return false;
    }
    
    // Get admin email from settings
    const adminEmail = getSystemSetting('ADMIN_EMAIL');
    
    if (!adminEmail || adminEmail === 'admin@company.com') {
      Logger.log('Admin email not configured');
      return false;
    }
    
    const subject = EMAIL_TEMPLATES.SORT_MASTER_CREATED.subject;
    const htmlBody = EMAIL_TEMPLATES.SORT_MASTER_CREATED.getBody(
      sortMasterNo,
      rtweNo,
      quality,
      glm,
      gsm,
      createdBy
    );
    
    MailApp.sendEmail({
      to: adminEmail,
      subject: subject,
      htmlBody: htmlBody,
      name: EMAIL_CONFIG.FROM_NAME,
      replyTo: EMAIL_CONFIG.REPLY_TO
    });
    
    Logger.log('Sort Master creation email sent to: ' + adminEmail);
    return true;
    
  } catch (error) {
    Logger.log('sendSortMasterCreatedEmail error: ' + error.message);
    return false;
  }
}

/**
 * ============================================================================
 * CUSTOM EMAIL TEMPLATES
 * ============================================================================
 */

/**
 * Send custom HTML email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} htmlBody - HTML body content
 * @param {Object} options - Additional options (cc, bcc, attachments)
 * @return {boolean} True if sent successfully
 */
function sendCustomEmail(to, subject, htmlBody, options) {
  try {
    if (!EMAIL_CONFIG.ENABLED) {
      Logger.log('Email notifications are disabled');
      return false;
    }
    
    const emailOptions = {
      to: to,
      subject: subject,
      htmlBody: htmlBody,
      name: EMAIL_CONFIG.FROM_NAME,
      replyTo: EMAIL_CONFIG.REPLY_TO
    };
    
    // Add optional parameters
    if (options) {
      if (options.cc) emailOptions.cc = options.cc;
      if (options.bcc) emailOptions.bcc = options.bcc;
      if (options.attachments) emailOptions.attachments = options.attachments;
    }
    
    MailApp.sendEmail(emailOptions);
    
    Logger.log('Custom email sent to: ' + to);
    return true;
    
  } catch (error) {
    Logger.log('sendCustomEmail error: ' + error.message);
    return false;
  }
}

/**
 * ============================================================================
 * BULK EMAIL
 * ============================================================================
 */

/**
 * Send email to multiple recipients
 * @param {Array} recipients - Array of email addresses
 * @param {string} subject - Email subject
 * @param {string} htmlBody - HTML body content
 * @return {Object} {sent, failed}
 */
function sendBulkEmail(recipients, subject, htmlBody) {
  try {
    if (!EMAIL_CONFIG.ENABLED) {
      Logger.log('Email notifications are disabled');
      return { sent: 0, failed: recipients.length };
    }
    
    let sent = 0;
    let failed = 0;
    
    for (let i = 0; i < recipients.length; i++) {
      try {
        // Check daily quota
        const quotaRemaining = MailApp.getRemainingDailyQuota();
        if (quotaRemaining <= 0) {
          Logger.log('Daily email quota exceeded');
          failed += (recipients.length - i);
          break;
        }
        
        MailApp.sendEmail({
          to: recipients[i],
          subject: subject,
          htmlBody: htmlBody,
          name: EMAIL_CONFIG.FROM_NAME,
          replyTo: EMAIL_CONFIG.REPLY_TO
        });
        
        sent++;
        
        // Add small delay to avoid rate limiting
        Utilities.sleep(100);
        
      } catch (error) {
        Logger.log('Failed to send to ' + recipients[i] + ': ' + error.message);
        failed++;
      }
    }
    
    Logger.log('Bulk email complete: ' + sent + ' sent, ' + failed + ' failed');
    
    return { sent: sent, failed: failed };
    
  } catch (error) {
    Logger.log('sendBulkEmail error: ' + error.message);
    return { sent: 0, failed: recipients.length };
  }
}

/**
 * ============================================================================
 * EMAIL UTILITIES
 * ============================================================================
 */

/**
 * Get remaining email quota for today
 * @return {number} Remaining emails
 */
function getRemainingEmailQuota() {
  try {
    return MailApp.getRemainingDailyQuota();
  } catch (error) {
    Logger.log('getRemainingEmailQuota error: ' + error.message);
    return 0;
  }
}

/**
 * Check if email can be sent
 * @return {boolean} True if emails can be sent
 */
function canSendEmail() {
  if (!EMAIL_CONFIG.ENABLED) {
    return false;
  }
  
  const remaining = getRemainingEmailQuota();
  return remaining > 0;
}

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @return {boolean} True if valid
 */
function isValidEmail(email) {
  return VALIDATION_RULES.EMAIL.test(email);
}

/**
 * ============================================================================
 * EMAIL TEMPLATES - ADDITIONAL
 * ============================================================================
 */

/**
 * Generate generic notification email HTML
 * @param {string} title - Email title
 * @param {string} message - Email message
 * @param {string} actionText - Button text (optional)
 * @param {string} actionUrl - Button URL (optional)
 * @return {string} HTML email
 */
function generateNotificationEmail(title, message, actionText, actionUrl) {
  let html = `
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #F5F5F5;">
        <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #5D4037; margin: 0; font-size: 24px;">Sort Master System</h1>
          </div>
          
          <h2 style="color: #5D4037; font-size: 20px; margin-bottom: 20px;">${title}</h2>
          
          <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">${message}</p>
  `;
  
  if (actionText && actionUrl) {
    html += `
          <div style="text-align: center; margin: 30px 0;">
            <a href="${actionUrl}" style="background: #5D4037; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">${actionText}</a>
          </div>
    `;
  }
  
  html += `
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E0E0E0; color: #666; font-size: 12px; text-align: center;">
            <p>This is an automated message from Sort Master System.</p>
            <p>If you have any questions, please contact your administrator.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  return html;
}

/**
 * Send report email with data table
 * @param {string} to - Recipient email
 * @param {string} reportTitle - Report title
 * @param {Array} headers - Table headers
 * @param {Array} rows - Table rows (2D array)
 * @return {boolean} True if sent successfully
 */
function sendReportEmail(to, reportTitle, headers, rows) {
  try {
    if (!EMAIL_CONFIG.ENABLED) {
      return false;
    }
    
    // Build table HTML
    let tableHtml = '<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">';
    
    // Headers
    tableHtml += '<thead><tr style="background: #5D4037; color: white;">';
    for (let i = 0; i < headers.length; i++) {
      tableHtml += '<th style="padding: 10px; text-align: left; border: 1px solid #ddd;">' + headers[i] + '</th>';
    }
    tableHtml += '</tr></thead>';
    
    // Rows
    tableHtml += '<tbody>';
    for (let i = 0; i < rows.length; i++) {
      const bgColor = i % 2 === 0 ? '#F5F5F5' : 'white';
      tableHtml += '<tr style="background: ' + bgColor + ';">';
      for (let j = 0; j < rows[i].length; j++) {
        tableHtml += '<td style="padding: 8px; border: 1px solid #ddd;">' + rows[i][j] + '</td>';
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table>';
    
    const htmlBody = generateNotificationEmail(
      reportTitle,
      'Please find your requested report below:',
      null,
      null
    ).replace('</p>', '</p>' + tableHtml);
    
    return sendCustomEmail(to, reportTitle, htmlBody);
    
  } catch (error) {
    Logger.log('sendReportEmail error: ' + error.message);
    return false;
  }
}

/**
 * ============================================================================
 * EMAIL QUEUE (For large volumes)
 * ============================================================================
 */

/**
 * Queue email for later sending
 * Useful when quota is exceeded
 * @param {string} to - Recipient
 * @param {string} subject - Subject
 * @param {string} htmlBody - HTML body
 */
function queueEmail(to, subject, htmlBody) {
  try {
    const properties = PropertiesService.getScriptProperties();
    const queue = JSON.parse(properties.getProperty('EMAIL_QUEUE') || '[]');
    
    queue.push({
      to: to,
      subject: subject,
      htmlBody: htmlBody,
      timestamp: new Date().toISOString()
    });
    
    properties.setProperty('EMAIL_QUEUE', JSON.stringify(queue));
    
    Logger.log('Email queued for: ' + to);
    
  } catch (error) {
    Logger.log('queueEmail error: ' + error.message);
  }
}

/**
 * Process queued emails
 * Run this periodically via trigger
 * @return {number} Number of emails sent
 */
function processEmailQueue() {
  try {
    const properties = PropertiesService.getScriptProperties();
    const queue = JSON.parse(properties.getProperty('EMAIL_QUEUE') || '[]');
    
    if (queue.length === 0) {
      Logger.log('Email queue is empty');
      return 0;
    }
    
    let sent = 0;
    const remaining = [];
    
    for (let i = 0; i < queue.length; i++) {
      const quotaRemaining = MailApp.getRemainingDailyQuota();
      
      if (quotaRemaining <= 0) {
        Logger.log('Quota exceeded, stopping queue processing');
        remaining.push(...queue.slice(i));
        break;
      }
      
      try {
        MailApp.sendEmail({
          to: queue[i].to,
          subject: queue[i].subject,
          htmlBody: queue[i].htmlBody,
          name: EMAIL_CONFIG.FROM_NAME,
          replyTo: EMAIL_CONFIG.REPLY_TO
        });
        
        sent++;
        Utilities.sleep(100);
        
      } catch (error) {
        Logger.log('Failed to send queued email: ' + error.message);
        remaining.push(queue[i]);
      }
    }
    
    // Update queue with remaining emails
    properties.setProperty('EMAIL_QUEUE', JSON.stringify(remaining));
    
    Logger.log('Processed email queue: ' + sent + ' sent, ' + remaining.length + ' remaining');
    
    return sent;
    
  } catch (error) {
    Logger.log('processEmailQueue error: ' + error.message);
    return 0;
  }
}

/**
 * Set up trigger to process email queue
 */
function setupEmailQueueTrigger() {
  try {
    // Delete existing triggers
    const triggers = ScriptApp.getProjectTriggers();
    for (let i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === 'processEmailQueue') {
        ScriptApp.deleteTrigger(triggers[i]);
      }
    }
    
    // Create new trigger - every 6 hours
    ScriptApp.newTrigger('processEmailQueue')
      .timeBased()
      .everyHours(6)
      .create();
    
    Logger.log('Email queue trigger installed');
    
  } catch (error) {
    Logger.log('setupEmailQueueTrigger error: ' + error.message);
  }
}

/**
 * ============================================================================
 * TESTING
 * ============================================================================
 */

/**
 * Test email notifications
 */
function testEmailNotifications() {
  Logger.log('========================================');
  Logger.log('EMAIL NOTIFICATIONS TEST');
  Logger.log('========================================');
  
  // Check quota
  const quota = getRemainingEmailQuota();
  Logger.log('Remaining email quota: ' + quota);
  
  // Test user creation email (update with real email)
  const testEmail = 'test@example.com';
  Logger.log('\nSending test user creation email to: ' + testEmail);
  
  const result1 = sendUserCreationEmail(testEmail, 'Test User', 'test123');
  Logger.log('User creation email sent: ' + result1);
  
  // Test custom email
  const customHtml = generateNotificationEmail(
    'Test Notification',
    'This is a test email from Sort Master System.',
    'Visit System',
    getWebAppUrl()
  );
  
  const result2 = sendCustomEmail(testEmail, 'Test Email', customHtml);
  Logger.log('Custom email sent: ' + result2);
  
  Logger.log('========================================');
  Logger.log('EMAIL NOTIFICATIONS TEST COMPLETE');
  Logger.log('========================================');
}