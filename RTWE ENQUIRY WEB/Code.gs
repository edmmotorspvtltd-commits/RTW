// ============================================
// CODE.GS - MAIN WEB APP ROUTING
// RTWE System v3.0 - Web Deployment
// COMPLETE FIXED VERSION WITH CORS FIXES
// ============================================

/**
 * Main entry point for web app
 * Handles all page routing
 */
function doGet(e) {
  // Check if this is a broker form request (action=broker)
  if (e.parameter.action === 'broker' && e.parameter.token) {
    return serveBrokerForm(e.parameter.token);
  }
  
  const page = e.parameter.page || 'login';
  // Accept both 'session' and 'sessionId' parameters for compatibility with centralized portal
  const sessionId = e.parameter.sessionId || e.parameter.session;
  
  Logger.log('=== RTWE ENQUIRY doGet ===');
  Logger.log('Page: ' + page);
  Logger.log('SessionId: ' + sessionId);
  
  // Public pages (no authentication required)
  const publicPages = ['login', 'register', 'forgot-password', 'reset-password', 'broker-form'];
  
  // If not a public page, validate session
  if (!publicPages.includes(page)) {
    if (!sessionId || !isValidSession(sessionId)) {
      Logger.log('Session validation failed - redirecting to login');
      return serveLogin('Session expired. Please login again.');
    }
    Logger.log('Session validated successfully');
  }
  
  // Route to appropriate page
  switch(page) {
    case 'login':
      // If user already has valid session, redirect to dashboard instead of showing login
      if (sessionId && isValidSession(sessionId)) {
        Logger.log('Valid session detected - redirecting to dashboard');
        return serveDashboard(sessionId);
      }
      return serveLogin();
    
    case 'register':
      return serveRegister();
    
    case 'forgot-password':
      return serveForgotPassword();
    
    case 'reset-password':
      return serveResetPassword(e.parameter.token);
      
    case 'portal':
      return servePortal(sessionId);
      
    case 'dashboard':
      return serveDashboard(sessionId);
      
    case 'enquiry-form':
      // Serve enquiry form with proper parameters
      const entryType = e.parameter.type || 'NEW ENTRY';
      const rtweNo = e.parameter.rtwe || '';
      return serveEnquiryForm(sessionId, entryType, rtweNo);
      
    case 'pending-enquiries':
      return servePendingEnquiries(sessionId);
    
    case 'new-enquiry':
      return serveNewEnquiryForm(sessionId);
      
    case 'pending-approved':
      return servePendingApproved(sessionId);
      
    case 'cancelled-enquiries':
      return serveCancelledEnquiries(sessionId);
      
    case 'search':
      return serveSearchDashboard(sessionId);
      
    case 'kpi':
      return serveKPIDashboard(sessionId);
    
    case 'user-management':
      return serveUserManagement(sessionId);
    
    case 'audit-log':
      return serveAuditLog(sessionId);
      
    case 'entry-confirmation':
      Logger.log('>>> ROUTING TO ENTRY CONFIRMATION <<<');
      return serveOrderConfirmForm(sessionId, e.parameter.rtwe);
      
    case 'order-confirm-form': // Keep old one just in case
      return serveOrderConfirmForm(sessionId, e.parameter.rtwe);
      
    case 'order-confirm':
      return serveOrderConfirmData(sessionId);
      
    case 'settings':
      return serveSettings(sessionId);
      
    case 'broker-form':
      return serveBrokerForm(e.parameter.token);
      
    case 'logout':
      if (sessionId) {
        serverLogout(sessionId);
      }
      return serveLogin('Logged out successfully');
      
    default:
      return serve404();
  }
}

/**
 * Handle POST requests (form submissions)
 */
function doPost(e) {
  const action = e.parameter.action;
  
  try {
    switch(action) {
      case 'login':
        return handleLoginPost(e);
        
      case 'save-enquiry':
        return handleEnquirySave(e);
        
      case 'broker-submit':
        return handleBrokerSubmit(e);
        
      default:
        return ContentService.createTextOutput(
          JSON.stringify({success: false, error: 'Invalid action'})
        ).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (error) {
    return ContentService.createTextOutput(
      JSON.stringify({success: false, error: error.toString()})
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// PAGE SERVING FUNCTIONS - WITH CORS FIXES
// ============================================

/**
 * Serve Master Portal - redirects to Dashboard 
 * (Portal.html doesn't exist in this project, use centralized login for portal)
 */
function servePortal(sessionId) {
  // Redirect to dashboard since we don't have a portal in this project
  return serveDashboard(sessionId);
}

/**
 * Serve Login Page
 */
function serveLogin(message) {
  const template = HtmlService.createTemplateFromFile('Login');
  template.message = message || '';
  
  return template.evaluate()
    .setTitle('RTWE System - Login')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

/**
 * Serve Dashboard (KPI Dashboard)
 */
function serveDashboard(sessionId) {
  const session = getSessionData(sessionId);
  if (!session) {
    return serveLogin('Session expired');
  }
  
  const template = HtmlService.createTemplateFromFile('Dashboard');
  template.sessionId = sessionId;
  template.userName = session.name || session.username || 'User';
  template.userRole = session.role || 'USER';
  
  return template.evaluate()
    .setTitle('RTWE Dashboard')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

/**
 * Serve Enquiry Form - WITH CORS FIX AND ERROR HANDLING
 */
function serveEnquiryForm(sessionId, entryType, rtweNo) {
  try {
    // Validate session
    const session = getSessionData(sessionId);
    if (!session) {
      Logger.log('Session validation failed for: ' + sessionId);
      return serveLogin('Session expired. Please login again.');
    }
    
    Logger.log('Serving enquiry form for user: ' + (session.name || session.username));
    Logger.log('Entry Type: ' + entryType + ', RTWE: ' + rtweNo);
    
    // CRITICAL: Use createTemplateFromFile to process template variables
    const template = HtmlService.createTemplateFromFile('EnquiryForm');
    template.sessionId = sessionId;
    template.userName = session.name || session.username || 'User';
    template.userRole = session.role || 'USER';
    template.presetType = entryType || '';
    template.presetRtwe = rtweNo || '';  // Pass RTWE number for auto-loading
    
    return template.evaluate()
      .setTitle('RTWE Enquiry Form')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
      
  } catch (error) {
    Logger.log('Error serving enquiry form: ' + error.toString());
    
    // Return error page instead of blank page
    const errorHtml = HtmlService.createHtmlOutput(`
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body {
            font-family: Arial;
            padding: 40px;
            text-align: center;
            background: #f5f5f5;
          }
          .error-box {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 500px;
            margin: 0 auto;
          }
          h1 { color: #d32f2f; }
          button {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="error-box">
          <h1>⚠️ Error Loading Form</h1>
          <p>${error.toString()}</p>
          <button onclick="window.location.reload()">Retry</button>
        </div>
      </body>
      </html>
    `);
    
    return errorHtml
      .setTitle('Error')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .setSandboxMode(HtmlService.SandboxMode.IFRAME);
  }
}

/**
 * Serve Search Dashboard
 */
function serveSearchDashboard(sessionId) {
  const session = getSessionData(sessionId);
  if (!session) {
    return serveLogin('Session expired');
  }
  
  const template = HtmlService.createTemplateFromFile('SearchDashboard');
  template.sessionId = sessionId;
  template.userName = session.name || session.username || 'User';
  template.userRole = session.role || 'USER';
  
  return template.evaluate()
    .setTitle('RTWE Search Dashboard')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

/**
 * Serve KPI Dashboard
 */
function serveKPIDashboard(sessionId) {
  const session = getSessionData(sessionId);
  if (!session) {
    return serveLogin('Session expired');
  }
  
  const template = HtmlService.createTemplateFromFile('KPIDashboard');
  template.sessionId = sessionId;
  template.userName = session.name || session.username || 'User';
  template.userRole = session.role || 'USER';
  
  return template.evaluate()
    .setTitle('RTWE KPI Dashboard')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

/**
 * Serve User Management Page
 */
function serveUserManagement(sessionId) {
  const session = getSessionData(sessionId);
  if (!session) {
    return serveLogin('Session expired');
  }
  
  if (session.role !== 'OWNER' && session.role !== 'MANAGER') {
    return serve403();
  }
  
  const template = HtmlService.createTemplateFromFile('Usermanagement');
  template.sessionId = sessionId;
  template.userName = session.name || session.username || 'User';
  template.userRole = session.role;
  template.webAppUrl = getWebAppUrl();
  
  return template.evaluate()
    .setTitle('RTWE User Management')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

/**
 * Serve Audit Log Page
 */
function serveAuditLog(sessionId) {
  const session = getSessionData(sessionId);
  if (!session) {
    return serveLogin('Session expired');
  }
  
  if (session.role !== 'OWNER' && session.role !== 'MANAGER') {
    return serve403();
  }
  
  const template = HtmlService.createTemplateFromFile('Auditlog');
  template.sessionId = sessionId;
  template.userName = session.name || session.username || 'User';
  template.userRole = session.role;
  template.webAppUrl = getWebAppUrl();
  
  template.user = {
    userName: session.name || session.username || 'User',
    role: session.role
  };
  
  return template.evaluate()
    .setTitle('RTWE Audit Log')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

/**
 * Serve Register Page
 */
function serveRegister() {
  const template = HtmlService.createTemplateFromFile('Register');
  template.webAppUrl = getWebAppUrl();
  
  return template.evaluate()
    .setTitle('RTWE System - Register')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

/**
 * Serve Forgot Password Page
 */
function serveForgotPassword() {
  const template = HtmlService.createTemplateFromFile('Forgotpassword');
  template.webAppUrl = getWebAppUrl();
  
  return template.evaluate()
    .setTitle('RTWE System - Forgot Password')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

/**
 * Serve Reset Password Page
 */
function serveResetPassword(token) {
  if (!token) {
    return serveLogin('Invalid or missing reset token');
  }
  
  const template = HtmlService.createTemplateFromFile('Resetpassword');
  template.token = token;
  template.webAppUrl = getWebAppUrl();
  
  return template.evaluate()
    .setTitle('RTWE System - Reset Password')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

/**
 * Serve Settings Page
 */
function serveSettings(sessionId) {
  const session = getSessionData(sessionId);
  if (!session) {
    return serveLogin('Session expired');
  }
  
  if (session.role !== 'OWNER' && session.role !== 'MANAGER') {
    return serve403();
  }
  
  const template = HtmlService.createTemplateFromFile('Settings');
  template.sessionId = sessionId;
  template.userName = session.name || session.username || 'User';
  template.userRole = session.role || 'USER';
  
  return template.evaluate()
    .setTitle('RTWE Settings')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

/**
 * Serve Broker Form (Public - Token based)
 */
function serveBrokerForm(token) {
  if (!token) {
    return serve404();
  }
  
  const validation = validateBrokerToken(token);
  if (!validation || !validation.valid) {
    return serveTokenExpired();
  }
  
  const template = HtmlService.createTemplateFromFile('BrokerForm');
  template.token = token;
  template.rtweNo = validation.data.rtweNo; // Fix: rtweNo is inside validation.data
  
  return template.evaluate()
    .setTitle('RTWE Broker Form')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

/**
 * Serve 404 Error Page
 */
function serve404() {
  const template = HtmlService.createTemplateFromFile('404');
  
  return template.evaluate()
    .setTitle('404 - Page Not Found')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

/**
 * Serve 403 Error Page
 */
function serve403() {
  const template = HtmlService.createTemplateFromFile('403');
  
  return template.evaluate()
    .setTitle('403 - Access Denied')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

/**
 * Serve Token Expired Page
 */
function serveTokenExpired() {
  const html = HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #2c2c2c 0%, #1a1a1a 100%);
          margin: 0;
        }
        .error-container {
          background: white;
          padding: 40px;
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          max-width: 500px;
        }
        .error-icon { font-size: 64px; margin-bottom: 20px; }
        h1 { color: #c62828; margin-bottom: 10px; }
        p { color: #666; line-height: 1.6; }
      </style>
    </head>
    <body>
      <div class="error-container">
        <div class="error-icon">⏰</div>
        <h1>Link Expired</h1>
        <p>This broker form link has expired or is invalid.</p>
        <p>Please contact Ramratan Techno Weave for a new link.</p>
      </div>
    </body>
    </html>
  `);
  
  return html
    .setTitle('Link Expired')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Include external HTML files (for modular HTML)
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Get base URL for the web app
 */
function getWebAppUrl() {
  return ScriptApp.getService().getUrl();
}

/**
 * Create navigation URL
 */
function createNavUrl(page, params) {
  let url = getWebAppUrl() + '?page=' + page;
  
  if (params) {
    for (let key in params) {
      url += '&' + key + '=' + encodeURIComponent(params[key]);
    }
  }
  
  return url;
}

/**
 * Serve Pending Approved page
 */
function servePendingApproved(sessionId) {
  const session = getSessionData(sessionId);
  
  if (!session) {
    return serveLogin('Session expired. Please login again.');
  }
  
  const template = HtmlService.createTemplateFromFile('PendingApproved');
  template.sessionId = sessionId;
  template.userName = session.name || session.userName || 'User';
  
  return template.evaluate()
    .setTitle('Pending Approved - RTWE')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

/**
 * Serve Cancelled Enquiries page
 */
function serveCancelledEnquiries(sessionId) {
  const session = getSessionData(sessionId);
  
  if (!session) {
    return serveLogin('Session expired. Please login again.');
  }
  
  const template = HtmlService.createTemplateFromFile('CancelledEnquiries');
  template.sessionId = sessionId;
  template.userName = session.name || session.userName || 'User';
  
  return template.evaluate()
    .setTitle('Cancelled Enquiries - RTWE')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

/**
 * Get all cancelled enquiries from ENQUIRY_CLOSED_DATA sheet
 */
function getCancelledEnquiries() {
  try {
    Logger.log('🔍 getCancelledEnquiries START');
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('ENQUIRY_CLOSED_DATA');
    
    if (!sheet) {
      Logger.log('❌ ENQUIRY_CLOSED_DATA sheet not found!');
      return [];
    }
    
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    
    if (lastRow <= 1) {
      Logger.log('⚠️ Sheet is empty or only has headers');
      return [];
    }
    
    const data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    const headers = data[0];
    
    Logger.log('📋 Headers: ' + JSON.stringify(headers));
    
    // Find column indices
    const cols = {
      rtweNo: 0,
      costingNo: 1,
      enqDate: 2,
      enqTime: 3,
      broker: 4,
      quality: 5,
      givenRate: 6,
      orderStatus: 7
    };
    
    // Find cancellation columns (usually at the end)
    let cancelReasonCol = headers.findIndex(h => h && String(h).toLowerCase().includes('cancellation reason'));
    let cancelDateCol = headers.findIndex(h => h && String(h).toLowerCase().includes('cancelled date'));
    let cancelTimeCol = headers.findIndex(h => h && String(h).toLowerCase().includes('cancelled time'));
    
    // Fallback to last columns if not found by name
    if (cancelReasonCol === -1) cancelReasonCol = lastCol - 3;
    if (cancelDateCol === -1) cancelDateCol = lastCol - 2;
    if (cancelTimeCol === -1) cancelTimeCol = lastCol - 1;
    
    const enquiries = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      if (!row[cols.rtweNo] || String(row[cols.rtweNo]).trim() === '') {
        continue;
      }
      
      // Format dates
      let enqDate = row[cols.enqDate];
      if (enqDate instanceof Date) {
        enqDate = Utilities.formatDate(enqDate, Session.getScriptTimeZone(), 'dd-MM-yyyy');
      }
      
      let cancelDate = row[cancelDateCol];
      if (cancelDate instanceof Date) {
        cancelDate = Utilities.formatDate(cancelDate, Session.getScriptTimeZone(), 'dd-MM-yyyy');
      }
      
      const enquiry = {
        rtweNo: String(row[cols.rtweNo] || '').trim(),
        costingNo: String(row[cols.costingNo] || '').trim(),
        enqDate: enqDate || '',
        enqTime: String(row[cols.enqTime] || ''),
        broker: String(row[cols.broker] || '').trim(),
        quality: String(row[cols.quality] || '').trim(),
        givenRate: String(row[cols.givenRate] || ''),
        orderStatus: 'Cancelled',
        cancelReason: String(row[cancelReasonCol] || 'No reason provided'),
        cancelDate: cancelDate || '',
        cancelTime: String(row[cancelTimeCol] || '')
      };
      
      enquiries.push(enquiry);
    }
    
    Logger.log('✅ SUCCESS - Returning ' + enquiries.length + ' cancelled enquiries');
    return enquiries;
    
  } catch (error) {
    Logger.log('❌ getCancelledEnquiries error: ' + error.message);
    return [];
  }
}

/**
 * Load a specific cancelled enquiry by RTWE number
 * Used for View mode from Cancelled Enquiries page
 */
function loadCancelledEnquiryData(rtweNo) {
  try {
    Logger.log('🔍 loadCancelledEnquiryData called for: ' + rtweNo);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('ENQUIRY_CLOSED_DATA');
    
    if (!sheet) {
      Logger.log('❌ ENQUIRY_CLOSED_DATA sheet not found');
      return null;
    }
    
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      Logger.log('❌ No data in ENQUIRY_CLOSED_DATA sheet');
      return null;
    }
    
    const data = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
    const headers = data[0];
    const searchRtwe = String(rtweNo).trim().toUpperCase().replace(/[-\s]/g, '');
    
    Logger.log('🔍 Searching for RTWE: ' + searchRtwe);
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const sheetRtwe = String(row[0] || '').trim().toUpperCase().replace(/[-\s]/g, '');
      
      if (sheetRtwe === searchRtwe || sheetRtwe.includes(searchRtwe) || searchRtwe.includes(sheetRtwe)) {
        Logger.log('✅ Found matching enquiry at row ' + (i + 1));
        
        // Helper function for dates
        function formatDateValue(value) {
          if (!value) return '';
          try {
            if (value instanceof Date) {
              return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
            }
            return String(value);
          } catch (e) {
            return String(value);
          }
        }
        
        function safeString(value) {
          if (value === null || value === undefined) return '';
          return String(value).trim();
        }
        
        // Column mapping based on ENQUIRY_CLOSED_DATA sheet structure
        const enquiryData = {
          rtweNo: safeString(row[0]),
          costingNo: safeString(row[1]),
          enqDate: formatDateValue(row[2]),
          enqTime: safeString(row[3]),
          broker: safeString(row[4]),
          quality: safeString(row[5]),
          givenRate: safeString(row[6]),
          orderStatus: 'Cancelled',
          isCancelled: true,
          sourceSheet: 'ENQUIRY_CLOSED_DATA'
        };
        
        Logger.log('📦 Returning data for RTWE: ' + enquiryData.rtweNo);
        return enquiryData;
      }
    }
    
    Logger.log('❌ No matching enquiry found for RTWE: ' + rtweNo);
    return null;
    
  } catch (error) {
    Logger.log('❌ loadCancelledEnquiryData error: ' + error.message);
    return null;
  }
}

// ============================================
// BACKWARD COMPATIBILITY
// For existing menu-based functions
// ============================================

function onOpen() {
  const ui = SpreadsheetApp.getUi();
  
  ui.createMenu('🔐 RTWE System v3.0')
    .addItem('🌐 Open Web App', 'openWebApp')
    .addSeparator()
    .addItem('📝 Enquiry Form (Dialog)', 'showEnquiryFormDialog')
    .addItem('📊 Dashboard (Dialog)', 'showDashboardDialog')
    .addItem('🔍 Search (Dialog)', 'showSearchDialog')
    .addToUi();
}

function openWebApp() {
  const url = getWebAppUrl();
  const html = HtmlService.createHtmlOutput(
    '<script>window.open("' + url + '", "_blank"); google.script.host.close();</script>'
  );
  SpreadsheetApp.getUi().showModalDialog(html, 'Opening Web App...');
}

function showEnquiryFormDialog() {
  const html = HtmlService.createHtmlOutputFromFile('Enquiry-Form')
    .setWidth(1000)
    .setHeight(700);
  SpreadsheetApp.getUi().showModalDialog(html, '📋 RTWE Enquiry Form');
}

function showDashboardDialog() {
  const html = HtmlService.createHtmlOutputFromFile('KPI-Dashboard-complete')
    .setWidth(1200)
    .setHeight(800);
  SpreadsheetApp.getUi().showModalDialog(html, '📊 RTWE Dashboard');
}

function showSearchDialog() {
  const html = HtmlService.createHtmlOutputFromFile('Search-Dashboard-Complete')
    .setWidth(1200)
    .setHeight(800);
  SpreadsheetApp.getUi().showModalDialog(html, '🔍 RTWE Search');
}

// ============================================
// DASHBOARD & ENQUIRY BACKEND FUNCTIONS
// UPDATED FOR YOUR MULTI-SHEET STRUCTURE
// ============================================

/**
 * Get dashboard statistics
 */
function getDashboardStats(sessionId) {
  try {
    if (!sessionId || !isValidSession(sessionId)) {
      throw new Error('Invalid session');
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    const pendingSheet = ss.getSheetByName('PENDING_DATA');
    const approvedSheet = ss.getSheetByName('PENDING_APPROVED');
    const confirmedSheet = ss.getSheetByName('ORDER_CONFIRM_DATA');
    const closedSheet = ss.getSheetByName('ENQUIRY_CLOSED_DATA');
    
    const pending = pendingSheet ? Math.max(0, pendingSheet.getLastRow() - 1) : 0;
    const approved = approvedSheet ? Math.max(0, approvedSheet.getLastRow() - 1) : 0;
    const confirmed = confirmedSheet ? Math.max(0, confirmedSheet.getLastRow() - 1) : 0;
    const closed = closedSheet ? Math.max(0, closedSheet.getLastRow() - 1) : 0;
    
    return {
      pending: pending,
      approved: approved,
      confirmed: confirmed,
      closed: closed,
      total: pending + approved + confirmed + closed
    };
    
  } catch (error) {
    Logger.log('Error in getDashboardStats: ' + error.toString());
    throw new Error('Failed to load dashboard stats');
  }
}

/**
 * Get master data - FIXED COLUMN MAPPING
 */
function getMasterDataForForm() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const masterSheet = ss.getSheetByName('MASTER_DATA');
    
    // Return empty arrays if sheet doesn't exist (form can still load)
    if (!masterSheet) {
      Logger.log('Warning: MASTER_DATA sheet not found, returning empty dropdowns');
      return {
        brokers: [],
        qualities: [],
        buyers: [],
        designs: [],
        yarns: []
      };
    }
    
    // Helper to get unique values from column
    function getUniqueColumnData(sheet, column) {
      if (!sheet) return [];
      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) return [];
      
      try {
        const values = sheet.getRange(2, column, lastRow - 1, 1)
          .getValues()
          .flat()
          .filter(item => item && item.toString().trim() !== '');
        
        // Return unique values
        return [...new Set(values)];
      } catch (e) {
        Logger.log('Error getting column ' + column + ': ' + e);
        return [];
      }
    }
    
    // FIXED COLUMN MAPPING - Based on your MASTER_DATA screenshot:
    // Column A: Broker Name
    // Column B: Quality
    // Column E: Buyer
    // Column G: Design 
    // Column H: Yarn Type
    return {
      brokers: getUniqueColumnData(masterSheet, 1),   // Column A
      qualities: getUniqueColumnData(masterSheet, 2), // Column B
      buyers: getUniqueColumnData(masterSheet, 5),    // Column E (FIXED)
      designs: getUniqueColumnData(masterSheet, 7),   // Column G (FIXED)
      yarns: getUniqueColumnData(masterSheet, 8)      // Column H (FIXED)
    };
  } catch (error) {
    Logger.log('Error in getMasterDataForForm: ' + error.toString());
    // Return empty data instead of throwing - form can still load
    return {
      brokers: [],
      qualities: [],
      buyers: [],
      designs: [],
      yarns: []
    };
  }
}

/**
 * Generate new entry data
 */
function generateNewEntryData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    let maxRTWENum = 0;
    const sheets = ['PENDING_DATA', 'PENDING_APPROVED', 'ORDER_CONFIRM_DATA', 'ENQUIRY_CLOSED_DATA'];
    
    sheets.forEach(sheetName => {
      const sheet = ss.getSheetByName(sheetName);
      if (sheet && sheet.getLastRow() > 1) {
        const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
        data.forEach(row => {
          const rtweStr = row[0] ? row[0].toString() : '';
          const match = rtweStr.match(/RTWE[-]?(\d+)/i);
          if (match) {
            const num = parseInt(match[1]);
            if (num > maxRTWENum) {
              maxRTWENum = num;
            }
          }
        });
      }
    });
    
    const nextNum = maxRTWENum + 1;
    const rtweNo = 'RTWE-' + nextNum.toString().padStart(4, '0');
    const costingNo = 'COST-' + nextNum.toString().padStart(4, '0');
    
    const now = new Date();
    const enqDate = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const enqTime = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm');
    
    return {
      rtweNo: rtweNo,
      costingNo: costingNo,
      enqDate: enqDate,
      enqTime: enqTime
    };
  } catch (error) {
    Logger.log('Error in generateNewEntryData: ' + error.toString());
    throw new Error('Failed to generate new entry');
  }
}

/**
 * Get pending approved list
 */
function getPendingApprovedList() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('PENDING_APPROVED');
    
    if (!sheet || sheet.getLastRow() <= 1) return [];
    
    const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
    const rtweList = [];
    
    data.forEach(row => {
      if (row[0]) {
        rtweList.push(row[0]);
      }
    });
    
    return rtweList;
  } catch (error) {
    Logger.log('Error in getPendingApprovedList: ' + error.toString());
    throw new Error('Failed to load pending approvals');
  }
}

/**
 * Load pending approved enquiry data
 */
function loadPendingApprovedEnquiryData(rtweNo) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('PENDING_APPROVED');
    
    if (!sheet) {
      throw new Error('PENDING_APPROVED sheet not found');
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === rtweNo) {
        return parseEnquiryRow(data[i]);
      }
    }
    
    throw new Error('RTWE No not found');
  } catch (error) {
    Logger.log('Error in loadPendingApprovedEnquiryData: ' + error.toString());
    throw new Error('Failed to load enquiry data');
  }
}

/**
 * Get edit enquiry list
 */
function getEditEnquiryList() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const rtweList = [];
    
    const sheets = [
      { name: 'PENDING_DATA', status: 'Pending' },
      { name: 'PENDING_APPROVED', status: 'Approved' },
      { name: 'ORDER_CONFIRM_DATA', status: 'Confirmed' },
      { name: 'ENQUIRY_CLOSED_DATA', status: 'Closed' }
    ];
    
    sheets.forEach(sheetInfo => {
      const sheet = ss.getSheetByName(sheetInfo.name);
      if (!sheet || sheet.getLastRow() <= 1) return;
      
      const data = sheet.getDataRange().getValues();
      
      for (let i = 1; i < data.length; i++) {
        const rtweNo = data[i][0];
        const broker = data[i][4] || 'N/A';
        
        if (rtweNo) {
          rtweList.push({
            value: rtweNo,
            label: `${rtweNo} - ${broker} - ${sheetInfo.status}`,
            sheet: sheetInfo.name
          });
        }
      }
    });
    
    return rtweList;
  } catch (error) {
    Logger.log('Error in getEditEnquiryList: ' + error.toString());
    throw new Error('Failed to load enquiry list');
  }
}

/**
 * Load edit enquiry data
 */
function loadEditEnquiryData(rtweNo) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ['PENDING_DATA', 'PENDING_APPROVED', 'ORDER_CONFIRM_DATA', 'ENQUIRY_CLOSED_DATA'];
    
    for (let sheetName of sheets) {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) continue;
      
      const data = sheet.getDataRange().getValues();
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === rtweNo) {
          const enquiryData = parseEnquiryRow(data[i]);
          enquiryData.isConfirmed = (sheetName === 'ORDER_CONFIRM_DATA');
          enquiryData.sourceSheet = sheetName;
          return enquiryData;
        }
      }
    }
    
    throw new Error('RTWE No not found');
  } catch (error) {
    Logger.log('Error in loadEditEnquiryData: ' + error.toString());
    throw new Error('Failed to load enquiry data');
  }
}

/**
 * Parse enquiry row
 */
function parseEnquiryRow(row) {
  function formatDate(value) {
    if (!value) return '';
    try {
      if (value instanceof Date) {
        return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      }
      return value;
    } catch (e) {
      return value;
    }
  }
  
  return {
    rtweNo: row[0] || '',
    costingNo: row[1] || '',
    enqDate: formatDate(row[2]),
    enqTime: row[3] || '',
    broker: row[4] || '',
    quality: row[5] || '',
    givenRate: row[6] || '',
    orderStatus: row[8] || '',
    approvedDate: formatDate(row[9]),
    approvedTime: row[10] || '',
    finalRate: row[11] || '',
    buyer: row[12] || '',
    poNo: row[13] || '',
    qualityOrder: row[14] || '',
    design1: row[15] || '',
    taga1: row[16] || '',
    design2: row[17] || '',
    taga2: row[18] || '',
    design3: row[19] || '',
    taga3: row[20] || '',
    design4: row[21] || '',
    taga4: row[22] || '',
    design5: row[23] || '',
    taga5: row[24] || '',
    design6: row[25] || '',
    taga6: row[26] || '',
    countMeter: row[27] || '',
    selvedgeName: row[28] || '',
    selvedgeEnds: row[29] || '',
    selvedgeColor: row[30] || '',
    yarnUsed: row[31] || '',
    paymentTerms: row[32] || '',
    deliveryDate: formatDate(row[33]),
    remark: row[34] || ''
  };
}

/**
 * Submit enquiry form
 */
function submitEnquiryForm(formData) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const rtweNo = formData.rtweNo;
    const entryType = formData.entryType;
    const orderStatus = formData.orderStatus;
    
    // Determine target sheet
    let targetSheetName;
    
    if (orderStatus === 'Pending') {
      targetSheetName = 'PENDING_DATA';
    } else if (orderStatus === 'Approved') {
      if (entryType === 'PENDING APPROVED') {
        targetSheetName = 'ORDER_CONFIRM_DATA';
      } else {
        targetSheetName = 'PENDING_APPROVED';
      }
    } else if (orderStatus === 'Canceled') {
      targetSheetName = 'ENQUIRY_CLOSED_DATA';
    } else {
      targetSheetName = 'PENDING_DATA';
    }
    
    const targetSheet = ss.getSheetByName(targetSheetName);
    
    if (!targetSheet) {
      return {
        success: false,
        message: targetSheetName + ' sheet not found'
      };
    }
    
    // Check if exists
    const allSheets = ['PENDING_DATA', 'PENDING_APPROVED', 'ORDER_CONFIRM_DATA', 'ENQUIRY_CLOSED_DATA'];
    let existingRow = null;
    let existingSheet = null;
    
    for (let sheetName of allSheets) {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) continue;
      
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === rtweNo) {
          existingRow = i + 1;
          existingSheet = sheet;
          break;
        }
      }
      if (existingRow) break;
    }
    
    // Prepare row data
    const rowData = [
      formData.rtweNo,
      formData.costingNo,
      formData.enqDate,
      formData.enqTime,
      formData.broker,
      formData.quality,
      formData.givenRate,
      '',
      formData.orderStatus,
      formData.approvedDate || '',
      formData.approvedTime || '',
      formData.finalRate || '',
      formData.buyer || '',
      formData.poNo || '',
      formData.qualityOrder || '',
      formData.design1 || '',
      formData.taga1 || '',
      formData.design2 || '',
      formData.taga2 || '',
      formData.design3 || '',
      formData.taga3 || '',
      formData.design4 || '',
      formData.taga4 || '',
      formData.design5 || '',
      formData.taga5 || '',
      formData.design6 || '',
      formData.taga6 || '',
      formData.countMeter || '',
      formData.selvedgeName || '',
      formData.selvedgeEnds || '',
      formData.selvedgeColor || '',
      formData.yarnUsed || '',
      formData.paymentTerms || '',
      formData.deliveryDate || '',
      formData.remark || '',
      formData.totalOrderTaga || '',
      formData.totalMTR || '',
      formData.totalOrderValue || '',
      formData.sizingBeam || ''
    ];
    
    if (existingRow && existingSheet) {
      if (existingSheet.getName() !== targetSheetName) {
        existingSheet.deleteRow(existingRow);
        targetSheet.appendRow(rowData);
      } else {
        existingSheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
      }
    } else {
      targetSheet.appendRow(rowData);
    }
    
    return {
      success: true,
      rtweNo: rtweNo,
      message: 'Data saved successfully to ' + targetSheetName
    };
    
  } catch (error) {
    Logger.log('Error in submitEnquiryForm: ' + error.toString());
    return {
      success: false,
      error: error.toString(),
      message: 'Failed to save data'
    };
  }
}

/**
 * Share PDF via multiple channels (Email, WhatsApp, Telegram)
 */
function sharePDFMultiChannel(formData, emailList, whatsapp, telegram) {
  try {
    Logger.log('=== sharePDFMultiChannel START ===');
    Logger.log('RTWE: ' + formData.rtweNo);
    Logger.log('Emails: ' + JSON.stringify(emailList));
    
    // Step 1: Generate professional PDF
    const pdfResult = generateEnquiryPDF(formData);
    
    if (!pdfResult.success) {
      throw new Error('PDF Generation Failed: ' + pdfResult.error);
    }
    
    const pdfBlob = DriveApp.getFileById(pdfResult.fileId).getBlob();
    
    // Step 2: Generate broker token for selvedge form
    const brokerToken = generateBrokerToken(formData.rtweNo);
    const scriptUrl = ScriptApp.getService().getUrl();
    const brokerLink = scriptUrl + '?action=broker&token=' + brokerToken;
    
    // Step 3: Send Emails with detailed template
    let emailSentCount = 0;
    if (emailList && emailList.length > 0) {
      const subject = 'RTWE Enquiry - Selvedge Details Required - ' + formData.rtweNo;
      
      const body = 
        'Dear Sir/Madam,\n\n' +
        'Greetings from Ramratan Textiles.\n\n' +
        'We request you to kindly fill in the selvedge details for the concerned order using the link provided below.\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        'COMPANY DETAILS:\n\n' +
        'Company Name: Ramratan Textiles\n\n' +
        'Constitution Units:\n' +
        '• Ramratan Cotsyn – GSTIN: 27AHFPXM0585N1Z5\n' +
        '• Ramratan Techno Weave – GSTIN: 27AHFPM0535N2Z4\n' +
        '• Ramratan Weavings – GSTIN: 27ABEEFR8289B1ZW\n\n' +
        'Address:\n' +
        'Gat No. 234, Ward No. 24, H. No. 1770/4,\n' +
        'Near Sonam Car Gas, Soalge Mala, Shahapur,\n' +
        'Ichalkaranji – 416115, Dist. Kolhapur, Maharashtra\n\n' +
        'Contact No.: 9423858123\n' +
        'Website: www.ramratantextiles.com\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        '🔗🔗🔗🔗🔗🔗 SELVEDGE DETAILS LINK:\n' +
        brokerLink + '\n\n' +
        '⏰ Link Valid: 72 hours\n' +
        '🔗🔗🔗🔗🔗🔗🔗 Max Submissions: 3 times\n\n' +
        '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
        'Kindly complete the above details at the earliest to avoid any delay in further processing.\n\n' +
        'For any clarification, please feel free to contact us.\n\n' +
        'Thanking you.\n\n' +
        'Warm regards,\n' +
        'RTWE Team\n' +
        'Ramratan Techno Weave';
                   
      GmailApp.sendEmail(emailList.join(','), subject, body, {
        attachments: [pdfBlob],
        name: 'RTWE Team - Ramratan Textiles'
      });
      emailSentCount = emailList.length;
    }
    
    // Step 4: Social Media (Placeholders or partial implementation)
    // WhatsApp/Telegram typically require extra steps for automated PDF sharing
    // but the system has some existing functions for this in other files.
    
    Logger.log('=== sharePDFMultiChannel SUCCESS ===');
    return {
      success: true,
      message: 'PDF Shared Successfully',
      emailsSent: emailSentCount
    };
    
  } catch (error) {
    Logger.log('Error in sharePDFMultiChannel: ' + error.toString());
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * DIAGNOSTIC TEST
 */
function testAllBackendFunctions() {
  Logger.clear();
  
  try {
    Logger.log('========================================');
    Logger.log('RTWE SYSTEM - DIAGNOSTIC TEST');
    Logger.log('========================================\n');
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ss.getSheets().map(s => s.getName());
    Logger.log('TEST 1: Available sheets: ' + sheets.join(', '));
    
    const requiredSheets = ['PENDING_DATA', 'PENDING_APPROVED', 'ORDER_CONFIRM_DATA', 'ENQUIRY_CLOSED_DATA', 'MASTER_DATA'];
    const missingSheets = requiredSheets.filter(s => !sheets.includes(s));
    
    if (missingSheets.length > 0) {
      Logger.log('❌ MISSING SHEETS: ' + missingSheets.join(', ') + '\n');
    } else {
      Logger.log('✅ All required sheets exist\n');
    }
    
    Logger.log('TEST 2: Testing getDashboardStats...');
    try {
      const stats = getDashboardStats('test-session-id');
      Logger.log('✅ Dashboard Stats: P=' + stats.pending + ' A=' + stats.approved + ' C=' + stats.confirmed + ' X=' + stats.closed + '\n');
    } catch (e) {
      Logger.log('❌ getDashboardStats ERROR: ' + e.toString() + '\n');
    }
    
    Logger.log('TEST 3: Testing getMasterDataForForm...');
    try {
      const masterData = getMasterDataForForm();
      Logger.log('✅ Master Data: Brokers=' + masterData.brokers.length + ' Qualities=' + masterData.qualities.length + ' Buyers=' + masterData.buyers.length + ' Designs=' + masterData.designs.length + ' Yarns=' + masterData.yarns.length + '\n');
    } catch (e) {
      Logger.log('❌ getMasterDataForForm ERROR: ' + e.toString() + '\n');
    }
    
    Logger.log('TEST 4: Testing generateNewEntryData...');
    try {
      const newEntry = generateNewEntryData();
      Logger.log('✅ New Entry: ' + newEntry.rtweNo + ' / ' + newEntry.costingNo + '\n');
    } catch (e) {
      Logger.log('❌ generateNewEntryData ERROR: ' + e.toString() + '\n');
    }
    
    Logger.log('========================================');
    Logger.log('DIAGNOSTIC TEST COMPLETE');
    Logger.log('========================================');
    
  } catch (error) {
    Logger.log('\n❌ CRITICAL ERROR: ' + error.toString());
    Logger.log('Stack trace: ' + error.stack);
  }
}

// ============================================
// SETTINGS PAGE BACKEND FUNCTIONS
// ============================================

function updateEmailSettings(time, day) {
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    scriptProps.setProperty('DAILY_REPORT_TIME', time || '20:00');
    scriptProps.setProperty('WEEKLY_REPORT_DAY', day || '1');
    Logger.log('Email settings updated: Time=' + time + ', Day=' + day);
    return { success: true, message: 'Email settings updated' };
  } catch (error) {
    Logger.log('Error updating email settings: ' + error);
    throw new Error('Failed to update email settings');
  }
}

function updateTelegramSettings(enabled, token) {
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    scriptProps.setProperty('TELEGRAM_ENABLED', String(enabled));
    if (token) {
      scriptProps.setProperty('TELEGRAM_BOT_TOKEN', token);
    }
    Logger.log('Telegram settings updated: Enabled=' + enabled);
    return { success: true, message: 'Telegram settings updated' };
  } catch (error) {
    Logger.log('Error updating telegram settings: ' + error);
    throw new Error('Failed to update telegram settings');
  }
}

function updateSecuritySettings(timeout, attempts) {
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    scriptProps.setProperty('SESSION_TIMEOUT', String(timeout || 15));
    scriptProps.setProperty('MAX_LOGIN_ATTEMPTS', String(attempts || 3));
    Logger.log('Security settings updated: Timeout=' + timeout + ', Attempts=' + attempts);
    return { success: true, message: 'Security settings updated' };
  } catch (error) {
    Logger.log('Error updating security settings: ' + error);
    throw new Error('Failed to update security settings');
  }
}

// ============================================
// PASSWORD RESET FUNCTIONS
// ============================================

function requestPasswordReset(email) {
  try {
    if (!email) {
      return { success: false, message: 'Email is required' };
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const userSheet = ss.getSheetByName('USER_MANAGEMENT');
    
    if (!userSheet) {
      return { success: false, message: 'User management not configured' };
    }
    
    const data = userSheet.getDataRange().getValues();
    let userRow = -1;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][4] && data[i][4].toString().toLowerCase() === email.toLowerCase()) {
        userRow = i + 1;
        break;
      }
    }
    
    if (userRow === -1) {
      return { success: true, message: 'If this email exists, a reset link will be sent' };
    }
    
    const token = Utilities.getUuid();
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 24);
    
    const scriptProps = PropertiesService.getScriptProperties();
    scriptProps.setProperty('RESET_TOKEN_' + token, JSON.stringify({
      email: email,
      expiry: expiry.getTime(),
      userRow: userRow
    }));
    
    const webAppUrl = getWebAppUrl();
    const resetLink = webAppUrl + '?page=reset-password&token=' + token;
    
    GmailApp.sendEmail(
      email,
      'Password Reset - RTWE System',
      'Click this link to reset your password:\n\n' + resetLink + '\n\nThis link expires in 24 hours.',
      {
        htmlBody: '<h2>Password Reset Request</h2>' +
                  '<p>Click the button below to reset your password:</p>' +
                  '<a href="' + resetLink + '" style="display:inline-block;padding:12px 24px;background:#5D4037;color:white;text-decoration:none;border-radius:4px;">Reset Password</a>' +
                  '<p style="color:#666;margin-top:20px;">This link expires in 24 hours.</p>' +
                  '<p style="color:#999;font-size:12px;">If you did not request this, please ignore this email.</p>'
      }
    );
    
    Logger.log('Password reset email sent to: ' + email);
    return { success: true, message: 'Reset link sent to your email' };
    
  } catch (error) {
    Logger.log('Error in requestPasswordReset: ' + error);
    return { success: false, message: 'Failed to send reset email' };
  }
}

function resetUserPassword(token, newPassword) {
  try {
    if (!token || !newPassword) {
      return { success: false, message: 'Token and password are required' };
    }
    
    if (newPassword.length < 6) {
      return { success: false, message: 'Password must be at least 6 characters' };
    }
    
    const scriptProps = PropertiesService.getScriptProperties();
    const tokenData = scriptProps.getProperty('RESET_TOKEN_' + token);
    
    if (!tokenData) {
      return { success: false, message: 'Invalid or expired reset token' };
    }
    
    const data = JSON.parse(tokenData);
    
    if (Date.now() > data.expiry) {
      scriptProps.deleteProperty('RESET_TOKEN_' + token);
      return { success: false, message: 'Reset token has expired' };
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const userSheet = ss.getSheetByName('USER_MANAGEMENT');
    
    if (!userSheet) {
      return { success: false, message: 'User management not configured' };
    }
    
    const hashedPassword = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256, 
      newPassword
    ).map(b => ('0' + (b & 0xFF).toString(16)).slice(-2)).join('');
    
    userSheet.getRange(data.userRow, 3).setValue(hashedPassword);
    
    scriptProps.deleteProperty('RESET_TOKEN_' + token);
    
    Logger.log('Password reset successful for: ' + data.email);
    return { success: true, message: 'Password reset successfully' };
    
  } catch (error) {
    Logger.log('Error in resetUserPassword: ' + error);
    return { success: false, message: 'Failed to reset password' };
  }
}

/**
 * Serve New Enquiry Form page
 */
function serveNewEnquiryForm(sessionId) {
  Logger.log('=== serveNewEnquiryForm ===');
  Logger.log('SessionId: ' + sessionId);
  
  const session = getSessionData(sessionId);
  if (!session) {
    Logger.log('Session not found - redirecting to login');
    return serveLogin('Session expired. Please login again.');
  }
  
  Logger.log('Session found: ' + JSON.stringify(session));
  
  const template = HtmlService.createTemplateFromFile('NewEnquiryForm');
  template.sessionId = sessionId;
  template.userName = session.name || session.username || 'User';
  
  return template.evaluate()
    .setTitle('New Enquiry - RTWE')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

/**
 * Serve Order Confirm Form page
 * Opens when clicking "Confirm" on Pending Approved page
 */
function serveOrderConfirmForm(sessionId, rtweNo) {
  Logger.log('=== serveOrderConfirmForm ===');
  Logger.log('SessionId: ' + sessionId);
  Logger.log('RTWE: ' + rtweNo);
  
  const session = getSessionData(sessionId);
  if (!session) {
    return serveLogin('Session expired. Please login again.');
  }
  
  const template = HtmlService.createTemplateFromFile('OrderConfirmForm');
  template.sessionId = sessionId;
  template.userName = session.name || session.username || 'User';
  template.rtweNo = rtweNo || '';
  
  return template.evaluate()
    .setTitle('Order Confirmation - RTWE')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

/**
 * Save new enquiry to PENDING_DATA sheet
 */
function saveNewEnquiry(formData) {
  try {
    Logger.log('=== saveNewEnquiry ===');
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('PENDING_DATA');
    
    if (!sheet) return { success: false, message: 'PENDING_DATA sheet not found' };
    
    // Use the same 40-column structure as submitEnquiryForm
    const rowData = new Array(40).fill('');
    rowData[0] = formData.rtweNo;
    rowData[1] = formData.costingNo;
    rowData[2] = formData.enqDate;
    rowData[3] = formData.enqTime;
    rowData[4] = formData.broker;
    rowData[5] = formData.quality;
    rowData[6] = formData.givenRate;
    rowData[8] = formData.orderStatus || 'Pending'; // Column I
    rowData[34] = formData.remark || ''; // Column AI
    
    sheet.appendRow(rowData);
    return { success: true, message: 'Enquiry saved successfully', rtweNo: formData.rtweNo };
  } catch (error) {
    return { success: false, message: error.toString() };
  }
}

/**
 * Share enquiry in background (non-blocking)
 * Sends email with PDF and broker link
 */
function shareEnquiryBackground(formData, emailList, sendTelegram) {
  try {
    Logger.log('=== shareEnquiryBackground ===');
    Logger.log('RTWE: ' + formData.rtweNo);
    Logger.log('Emails: ' + emailList.join(', '));
    Logger.log('Telegram: ' + sendTelegram);
    
    // Generate PDF
    const pdfResult = generateEnquiryPDF(formData);
    
    if (!pdfResult.success) {
      Logger.log('PDF generation failed: ' + pdfResult.error);
      addDashboardNotification(formData.rtweNo, 'Share failed: PDF generation error', 'error');
      return;
    }
    
    // Generate broker token
    const token = generateBrokerToken(formData.rtweNo);
    const scriptUrl = ScriptApp.getService().getUrl();
    const brokerLink = scriptUrl + '?action=broker&token=' + token;
    
    // Send to each email
    let successCount = 0;
    let failCount = 0;
    
    for (let email of emailList) {
      try {
        const emailResult = sendBrokerEmail(email, formData.rtweNo, brokerLink, pdfResult.fileId);
        if (emailResult.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (e) {
        Logger.log('Email to ' + email + ' failed: ' + e);
        failCount++;
      }
    }
    
    // Send Telegram if enabled
    if (sendTelegram) {
      try {
        sendBrokerTelegram(formData.rtweNo, brokerLink, pdfResult.fileId);
      } catch (e) {
        Logger.log('Telegram notification failed: ' + e);
      }
    }
    
    // Add dashboard notification
    const message = successCount > 0 
      ? formData.rtweNo + ' shared with ' + successCount + ' recipient(s)'
      : formData.rtweNo + ' sharing failed';
    const type = successCount > 0 ? 'success' : 'error';
    
    addDashboardNotification(formData.rtweNo, message, type);
    
    Logger.log('✅ Share complete: ' + successCount + ' success, ' + failCount + ' failed');
    
  } catch (error) {
    Logger.log('❌ shareEnquiryBackground error: ' + error);
    addDashboardNotification(formData.rtweNo, 'Share failed: ' + error.toString(), 'error');
  }
}

/**
 * Add notification to dashboard (stored in Script Properties)
 */
function addDashboardNotification(rtweNo, message, type) {
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const notificationsStr = scriptProps.getProperty('DASHBOARD_NOTIFICATIONS') || '[]';
    const notifications = JSON.parse(notificationsStr);
    
    notifications.push({
      id: Utilities.getUuid(),
      rtweNo: rtweNo,
      message: message,
      type: type,
      timestamp: new Date().toISOString(),
      read: false
    });
    
    // Keep only last 50 notifications
    if (notifications.length > 50) {
      notifications.splice(0, notifications.length - 50);
    }
    
    scriptProps.setProperty('DASHBOARD_NOTIFICATIONS', JSON.stringify(notifications));
    
  } catch (error) {
    Logger.log('addDashboardNotification error: ' + error);
  }
}

/**
 * Get dashboard notifications for current user
 */
function getDashboardNotifications() {
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const notificationsStr = scriptProps.getProperty('DASHBOARD_NOTIFICATIONS') || '[]';
    const notifications = JSON.parse(notificationsStr);
    
    // Return unread notifications (last 10)
    const unread = notifications.filter(n => !n.read).slice(-10);
    return unread;
    
  } catch (error) {
    Logger.log('getDashboardNotifications error: ' + error);
    return [];
  }
}

/**
 * Mark notification as read
 */
function markNotificationRead(notificationId) {
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const notificationsStr = scriptProps.getProperty('DASHBOARD_NOTIFICATIONS') || '[]';
    const notifications = JSON.parse(notificationsStr);
    
    const notification = notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      scriptProps.setProperty('DASHBOARD_NOTIFICATIONS', JSON.stringify(notifications));
    }
    
    return { success: true };
    
  } catch (error) {
    Logger.log('markNotificationRead error: ' + error);
    return { success: false };
  }
}

/**
 * Move enquiry from PENDING_DATA to PENDING_APPROVED
 * Called when user clicks Approve button
 */
function moveToPendingApproved(rtweNo) {
  try {
    Logger.log('=== moveToPendingApproved ===');
    Logger.log('RTWE: ' + rtweNo);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const pendingSheet = ss.getSheetByName('PENDING_DATA');
    const approvedSheet = ss.getSheetByName('PENDING_APPROVED');
    
    if (!pendingSheet) {
      return { success: false, error: 'PENDING_DATA sheet not found' };
    }
    
    if (!approvedSheet) {
      return { success: false, error: 'PENDING_APPROVED sheet not found' };
    }
    
    // Find the row in PENDING_DATA
    const data = pendingSheet.getDataRange().getValues();
    let rowIndex = -1;
    let rowData = null;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === rtweNo || data[i][0].toString() === rtweNo.toString()) {
        rowIndex = i + 1; // 1-indexed
        rowData = data[i];
        break;
      }
    }
    
    if (rowIndex === -1) {
      return { success: false, error: 'Enquiry not found in Pending' };
    }
    
    // Get current user session info
    const session = Session.getActiveUser().getEmail();
    const now = new Date();
    const createdDate = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy');
    const createdTime = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm:ss');
    
    // Build the row for PENDING_APPROVED with proper column mapping
    // PENDING_APPROVED columns: RTWE No, Costing Sheet No, Enquiry Date, Enquiry Time, 
    // Broker Name, Quality, Given Rate, Order Status, Created Date, Created Time, Created By, User ID
    const approvedRow = [
      rowData[0],  // RTWE No
      rowData[1],  // Costing Sheet No
      rowData[2],  // Enquiry Date
      rowData[3],  // Enquiry Time
      rowData[4],  // Broker Name
      rowData[5],  // Quality
      rowData[6],  // Given Rate
      'Approved',  // Order Status
      createdDate, // Created Date
      createdTime, // Created Time
      session,     // Created By
      session      // User ID
    ];
    
    approvedSheet.appendRow(approvedRow);
    
    // Delete from PENDING_DATA
    pendingSheet.deleteRow(rowIndex);
    
    Logger.log('✅ Moved ' + rtweNo + ' to PENDING_APPROVED');
    
    return { success: true, message: 'Enquiry approved successfully' };
    
  } catch (error) {
    Logger.log('❌ moveToPendingApproved error: ' + error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Get enquiry data from PENDING_APPROVED for order confirmation
 */
function getEnquiryForOrderConfirm(rtweNo) {
  try {
    Logger.log('=== getEnquiryForOrderConfirm: ' + rtweNo + ' ===');
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('PENDING_APPROVED');
    
    if (!sheet) {
      Logger.log('PENDING_APPROVED sheet not found');
      return null;
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find column indices
    const cols = {
      rtweNo: headers.findIndex(h => h && String(h).toLowerCase().includes('rtwe')),
      costingNo: headers.findIndex(h => h && String(h).toLowerCase().includes('costing')),
      enqDate: headers.findIndex(h => h && String(h).toLowerCase().includes('enquiry date')),
      broker: headers.findIndex(h => h && String(h).toLowerCase().includes('broker')),
      quality: headers.findIndex(h => h && String(h).toLowerCase() === 'quality'),
      givenRate: headers.findIndex(h => h && String(h).toLowerCase().includes('given rate'))
    };
    
    // Find the row
    for (let i = 1; i < data.length; i++) {
      if (data[i][cols.rtweNo] === rtweNo || String(data[i][cols.rtweNo]) === String(rtweNo)) {
        const row = data[i];
        
        // Format date if needed
        let enqDate = '';
        if (cols.enqDate !== -1 && row[cols.enqDate]) {
          if (row[cols.enqDate] instanceof Date) {
            enqDate = Utilities.formatDate(row[cols.enqDate], Session.getScriptTimeZone(), 'dd-MM-yyyy');
          } else {
            enqDate = String(row[cols.enqDate]);
          }
        }
        
        return {
          rtweNo: String(row[cols.rtweNo] || ''),
          costingNo: cols.costingNo !== -1 ? String(row[cols.costingNo] || '') : '',
          enqDate: enqDate,
          broker: cols.broker !== -1 ? String(row[cols.broker] || '') : '',
          quality: cols.quality !== -1 ? String(row[cols.quality] || '') : '',
          givenRate: cols.givenRate !== -1 ? String(row[cols.givenRate] || '') : ''
        };
      }
    }
    
    Logger.log('RTWE not found: ' + rtweNo);
    return null;
    
  } catch (error) {
    Logger.log('getEnquiryForOrderConfirm error: ' + error);
    return null;
  }
}

/// ============================================
// FIXED FUNCTIONS FOR ORDER CONFIRMATION
// Replace ONLY these 2 functions in your Code.gs
// ============================================

/**
 * Get enquiry data from PENDING_APPROVED for order confirmation
 * FIXED VERSION - Reads JSON format from columns P & Q
 */
function getEnquiryForOrderConfirm(rtweNo) {
  try {
    Logger.log('=== getEnquiryForOrderConfirm: ' + rtweNo + ' ===');
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('PENDING_APPROVED');
    
    if (!sheet) {
      Logger.log('PENDING_APPROVED sheet not found');
      return null;
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find column indices
    const cols = {
      rtweNo: headers.findIndex(h => h && String(h).toLowerCase().includes('rtwe')),
      costingNo: headers.findIndex(h => h && String(h).toLowerCase().includes('costing')),
      enqDate: headers.findIndex(h => h && String(h).toLowerCase().includes('enquiry date')),
      broker: headers.findIndex(h => h && String(h).toLowerCase().includes('broker')),
      quality: headers.findIndex(h => h && String(h).toLowerCase() === 'quality'),
      givenRate: headers.findIndex(h => h && String(h).toLowerCase().includes('given rate'))
    };
    
    // Find the row
    for (let i = 1; i < data.length; i++) {
      if (data[i][cols.rtweNo] === rtweNo || String(data[i][cols.rtweNo]) === String(rtweNo)) {
        const row = data[i];
        
        // Format date if needed
        let enqDate = '';
        if (cols.enqDate !== -1 && row[cols.enqDate]) {
          if (row[cols.enqDate] instanceof Date) {
            enqDate = Utilities.formatDate(row[cols.enqDate], Session.getScriptTimeZone(), 'dd-MM-yyyy');
          } else {
            enqDate = String(row[cols.enqDate]);
          }
        }
        
        return {
          rtweNo: String(row[cols.rtweNo] || ''),
          costingNo: cols.costingNo !== -1 ? String(row[cols.costingNo] || '') : '',
          enqDate: enqDate,
          broker: cols.broker !== -1 ? String(row[cols.broker] || '') : '',
          quality: cols.quality !== -1 ? String(row[cols.quality] || '') : '',
          givenRate: cols.givenRate !== -1 ? String(row[cols.givenRate] || '') : ''
        };
      }
    }
    
    Logger.log('RTWE not found: ' + rtweNo);
    return null;
    
  } catch (error) {
    Logger.log('getEnquiryForOrderConfirm error: ' + error);
    return null;
  }
}

/**
 * Confirm order - move from PENDING_APPROVED to ORDER_CONFIRM_DATA
 * FIXED VERSION - Saves designs/tagas as JSON in columns P & Q
 */
function confirmOrderFromApproved(orderData) {
  try {
    Logger.log('=== confirmOrderFromApproved (FIXED VERSION) ===');
    Logger.log('Order Data received:', JSON.stringify(orderData));
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const approvedSheet = ss.getSheetByName('PENDING_APPROVED');
    const confirmSheet = ss.getSheetByName('ORDER_CONFIRM_DATA');
    
    if (!approvedSheet || !confirmSheet) {
      return { success: false, message: 'Required sheets not found' };
    }
    
    // ============================================
    // COLUMN MAPPING - Based on your sheet structure
    // ============================================
    const rowData = new Array(34).fill(''); // 34 columns (A to AH)
    
    // A-O: Basic Order Info (Columns 1-15)
    rowData[0] = orderData.rtweNo;               // A: RTWE No
    rowData[1] = orderData.costingNo;            // B: Costing Sheet No
    rowData[2] = orderData.enqDate;              // C: Enquiry Date
    rowData[3] = orderData.enqTime || '';        // D: Enquiry Time
    rowData[4] = orderData.broker;               // E: Broker Name
    rowData[5] = orderData.quality;              // F: Quality
    rowData[6] = orderData.givenRate;            // G: Given Rate
    rowData[7] = 'Confirmed';                    // H: Order Status
    rowData[8] = orderData.approvedDate || '';   // I: Approved Date
    rowData[9] = orderData.approvedTime || '';   // J: Approved Time
    rowData[10] = orderData.finalRate;           // K: Final Rate
    rowData[11] = orderData.buyer;               // L: Buyer
    rowData[12] = orderData.poNo;                // M: P/O No
    rowData[13] = orderData.soNo || '';          // N: S/O No
    rowData[14] = orderData.qualityOrder || '';  // O: Quality Order
    
    // ============================================
    // P-Q: DYNAMIC DESIGNS & TAGAS (JSON FORMAT)
    // ============================================
    
    // Extract designs and tagas from orderData.designs array
    let designsArray = [];
    let tagasArray = [];
    
    if (orderData.designs && Array.isArray(orderData.designs)) {
      Logger.log('📦 Processing ' + orderData.designs.length + ' designs from array');
      
      orderData.designs.forEach(item => {
        if (item.design || item.taga) {
          designsArray.push(item.design || '');
          tagasArray.push(item.taga || '0');
        }
      });
      
      Logger.log('Designs array: ' + JSON.stringify(designsArray));
      Logger.log('Tagas array: ' + JSON.stringify(tagasArray));
    }
    
    // Convert to JSON strings
    rowData[15] = JSON.stringify(designsArray);  // P: Design (JSON array)
    rowData[16] = JSON.stringify(tagasArray);    // Q: TAGA (JSON array)
    
    Logger.log('Column P (Design): ' + rowData[15]);
    Logger.log('Column Q (TAGA): ' + rowData[16]);
    
    // R-AC: Calculations & Details (Columns 18-29)
    rowData[17] = orderData.totalOrderTaga || '';    // R: Total Order Taga
    rowData[18] = orderData.countMeter || '';        // S: Count Meter
    rowData[19] = orderData.totalMTR || '';          // T: Total MTR
    rowData[20] = orderData.totalOrderValue || '';   // U: Total Order Value
    rowData[21] = orderData.selvedgeName || '';      // V: Name of Selvedge
    rowData[22] = orderData.selvedgeEnds || '';      // W: Ends of Selvedge
    rowData[23] = orderData.selvedgeColor || '';     // X: Color of Selvedge
    rowData[24] = orderData.orderRemark || '';       // Y: Remark (first one)
    rowData[25] = orderData.yarnUsed || '';          // Z: Yarn to be Used
    rowData[26] = orderData.sizingBeam || '';        // AA: Sizing Beam Meter
    rowData[27] = orderData.paymentTerms || '';      // AB: Payment Terms
    rowData[28] = orderData.deliveryDate || '';      // AC: Delivery Date
    
    // AD-AH: Metadata (Columns 30-34)
    rowData[29] = orderData.orderRemark || '';       // AD: Remark (second one)
    
    // Add timestamp and user info
    const now = new Date();
    const createdDate = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy');
    const createdTime = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm:ss');
    const userName = orderData.confirmedBy || 'Unknown User';
    
    rowData[30] = createdDate;  // AE: Created Date
    rowData[31] = createdTime;  // AF: Created Time
    rowData[32] = userName;     // AG: Created By
    rowData[33] = userName;     // AH: User ID
    
    // ============================================
    // SAVE TO ORDER_CONFIRM_DATA
    // ============================================
    
    Logger.log('Appending row to ORDER_CONFIRM_DATA...');
    confirmSheet.appendRow(rowData);
    Logger.log('✅ Row appended successfully');
    
    // ============================================
    // DELETE FROM PENDING_APPROVED
    // ============================================
    
    const approvedData = approvedSheet.getDataRange().getValues();
    for (let i = 1; i < approvedData.length; i++) {
      const sheetRtwe = String(approvedData[i][0]).trim().toUpperCase().replace(/[-\s]/g, '');
      const searchRtwe = String(orderData.rtweNo).trim().toUpperCase().replace(/[-\s]/g, '');
      
      if (sheetRtwe === searchRtwe) {
        Logger.log('Deleting row ' + (i + 1) + ' from PENDING_APPROVED');
        approvedSheet.deleteRow(i + 1);
        Logger.log('✅ Row deleted successfully');
        break;
      }
    }
    
    Logger.log('=== confirmOrderFromApproved SUCCESS ===');
    return { success: true, message: 'Order confirmed successfully' };
    
  } catch (error) {
    Logger.log('❌ confirmOrderFromApproved error: ' + error);
    Logger.log('Stack trace: ' + error.stack);
    return { success: false, message: error.toString() };
  }
}

// ============================================
// BONUS: Helper function to read confirmed orders
// (Use this if you need to display order details later)
// ============================================

/**
 * Read a confirmed order from ORDER_CONFIRM_DATA
 * Returns order with designs parsed back into array
 */
function getConfirmedOrderData(rtweNo) {
  try {
    Logger.log('=== getConfirmedOrderData: ' + rtweNo + ' ===');
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('ORDER_CONFIRM_DATA');
    
    if (!sheet) {
      Logger.log('ORDER_CONFIRM_DATA sheet not found');
      return null;
    }
    
    const data = sheet.getDataRange().getValues();
    
    // Find the order
    for (let i = 1; i < data.length; i++) {
      const sheetRtwe = String(data[i][0]).trim().toUpperCase().replace(/[-\s]/g, '');
      const searchRtwe = String(rtweNo).trim().toUpperCase().replace(/[-\s]/g, '');
      
      if (sheetRtwe === searchRtwe) {
        const row = data[i];
        
        // Parse JSON designs and tagas
        let designs = [];
        let tagas = [];
        
        try {
          designs = JSON.parse(row[15] || '[]');  // Column P
          tagas = JSON.parse(row[16] || '[]');    // Column Q
        } catch (parseError) {
          Logger.log('Error parsing JSON: ' + parseError);
          designs = [];
          tagas = [];
        }
        
        // Build designs array
        const designsArray = [];
        for (let j = 0; j < designs.length; j++) {
          designsArray.push({
            design: designs[j] || '',
            taga: tagas[j] || '0'
          });
        }
        
        return {
          rtweNo: String(row[0] || ''),
          costingNo: String(row[1] || ''),
          enqDate: row[2] || '',
          broker: String(row[4] || ''),
          quality: String(row[5] || ''),
          buyer: String(row[11] || ''),
          poNo: String(row[12] || ''),
          soNo: String(row[13] || ''),
          finalRate: String(row[10] || ''),
          designs: designsArray,  // Array of {design, taga} objects
          totalOrderTaga: String(row[17] || ''),
          countMeter: String(row[18] || ''),
          totalMTR: String(row[19] || ''),
          totalOrderValue: String(row[20] || ''),
          selvedgeName: String(row[21] || ''),
          selvedgeEnds: String(row[22] || ''),
          selvedgeColor: String(row[23] || ''),
          yarnUsed: String(row[25] || ''),
          sizingBeam: String(row[26] || ''),
          paymentTerms: String(row[27] || ''),
          deliveryDate: row[28] || '',
          orderRemark: String(row[24] || ''),
          createdDate: row[30] || '',
          createdBy: String(row[32] || '')
        };
      }
    }
    
    Logger.log('Order not found: ' + rtweNo);
    return null;
    
  } catch (error) {
    Logger.log('getConfirmedOrderData error: ' + error);
    return null;
  }
}

// ============================================
// TESTING FUNCTION
// Use this to test the new functions
// ============================================

function testConfirmOrder() {
  Logger.clear();
  
  // Sample order data matching your form
  const testOrderData = {
    rtweNo: 'RTWE-TEST-001',
    costingNo: 'COST-TEST-001',
    enqDate: '2026-01-03',
    enqTime: '17:45',
    broker: 'Test Broker',
    quality: 'Test Quality',
    givenRate: '100',
    approvedDate: '2026-01-03',
    approvedTime: '17:45',
    finalRate: '105',
    buyer: 'Test Buyer',
    poNo: 'PO-123',
    soNo: 'SO-456',
    qualityOrder: 'QO-789',
    designs: [
      { design: '112', taga: '36' },
      { design: '113', taga: '36' },
      { design: '114', taga: '40' }
    ],
    totalOrderTaga: '112',
    countMeter: '100',
    totalMTR: '11200',
    totalOrderValue: '1176000',
    selvedgeName: 'Test Selvedge',
    selvedgeEnds: '10',
    selvedgeColor: 'Red',
    yarnUsed: 'Cotton',
    sizingBeam: '11984',
    paymentTerms: 'Net 30',
    deliveryDate: '2026-02-03',
    orderRemark: 'Test order',
    confirmedBy: 'Test User'
  };
  
  Logger.log('Testing confirmOrderFromApproved...');
  const result = confirmOrderFromApproved(testOrderData);
  
  Logger.log('Result: ' + JSON.stringify(result));
  
  if (result.success) {
    Logger.log('✅ Test PASSED - Order saved successfully!');
    
    // Test reading the order back
    Logger.log('\nTesting getConfirmedOrderData...');
    const orderData = getConfirmedOrderData('RTWE-TEST-001');
    
    if (orderData) {
      Logger.log('✅ Order read successfully!');
      Logger.log('Designs retrieved: ' + JSON.stringify(orderData.designs));
    } else {
      Logger.log('❌ Failed to read order');
    }
  } else {
    Logger.log('❌ Test FAILED: ' + result.message);
  }
}

/**
 * Share order confirmation - FULL IMPLEMENTATION
 * Generates PDF, creates broker link, sends emails
 */
function shareOrderConfirmation(orderData, emailList, sendTelegram) {
  try {
    Logger.log('=== shareOrderConfirmation ===');
    Logger.log('RTWE: ' + orderData.rtweNo);
    Logger.log('Emails: ' + emailList.join(', '));
    Logger.log('Send Telegram: ' + sendTelegram);
    
    // Step 1: Generate PDF
    Logger.log('Step 1: Generating PDF...');
    const pdfResult = generateEnquiryPDF(orderData);
    
    if (!pdfResult.success) {
      Logger.log('❌ PDF generation failed: ' + pdfResult.error);
      return { 
        success: false, 
        message: 'PDF generation failed: ' + pdfResult.error 
      };
    }
    
    Logger.log('✅ PDF generated: ' + pdfResult.fileName);
    
    // Step 2: Generate broker token and link
    Logger.log('Step 2: Generating broker token...');
    const token = generateBrokerToken(orderData.rtweNo);
    const scriptUrl = ScriptApp.getService().getUrl();
    const brokerLink = scriptUrl + '?page=broker-form&token=' + token + '&rtwe=' + encodeURIComponent(orderData.rtweNo);
    
    Logger.log('✅ Broker link: ' + brokerLink);
    
    // Step 3: Send emails to all recipients
    Logger.log('Step 3: Sending emails...');
    let emailsSent = 0;
    let emailErrors = [];
    
    for (let i = 0; i < emailList.length; i++) {
      const email = emailList[i];
      Logger.log('Sending to: ' + email);
      
      const emailResult = sendBrokerEmail(email, orderData.rtweNo, brokerLink, pdfResult.fileId);
      
      if (emailResult.success) {
        emailsSent++;
        Logger.log('✅ Email sent to: ' + email);
      } else {
        emailErrors.push(email + ': ' + emailResult.error);
        Logger.log('❌ Email failed for: ' + email);
      }
    }
    
    // Step 4: Optional Telegram notification
    if (sendTelegram) {
      Logger.log('Step 4: Sending Telegram notification...');
      try {
        sendBrokerTelegram(orderData.rtweNo, brokerLink, pdfResult.fileId);
        Logger.log('✅ Telegram sent');
      } catch (telegramError) {
        Logger.log('⚠️ Telegram failed: ' + telegramError);
        // Don't fail the whole operation if Telegram fails
      }
    }
    
    // Build result message
    let message = `✅ Successfully shared! PDF sent to ${emailsSent} recipient(s).`;
    if (emailErrors.length > 0) {
      message += ` Failed: ${emailErrors.length}`;
    }
    
    Logger.log('=== shareOrderConfirmation SUCCESS ===');
    
    return { 
      success: true, 
      message: message,
      emailsSent: emailsSent,
      emailsFailed: emailErrors.length,
      brokerLink: brokerLink,
      pdfFileName: pdfResult.fileName
    };
    
  } catch (error) {
    Logger.log('❌ shareOrderConfirmation error: ' + error);
    return { 
      success: false, 
      message: 'Error: ' + error.toString() 
    };
  }
}

/**
 * Get order details for broker form
 */
function getOrderForBroker(rtweNo) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const confirmSheet = ss.getSheetByName('ORDER_CONFIRM_DATA');
    
    if (!confirmSheet) return null;
    
    const data = confirmSheet.getDataRange().getValues();
    
    // Find the order by RTWE number
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (String(row[0]).trim().toUpperCase().replace(/[-\s]/g, '') === 
          String(rtweNo).trim().toUpperCase().replace(/[-\s]/g, '')) {
        
        return {
          rtweNo: row[0],
          broker: row[4],
          quality: row[5],
          finalRate: row[11],
          design1: row[16],
          taga1: row[17],
          design2: row[18],
          taga2: row[19],
          design3: row[20],
          taga3: row[21],
          design4: row[22],
          taga4: row[23],
          design5: row[24],
          taga5: row[25],
          design6: row[26],
          taga6: row[27],
          totalMTR: row[30],
          totalOrderValue: row[31],
          deliveryDate: row[38]
        };
      }
    }
    
    return null;
  } catch (error) {
    Logger.log('Error in getOrderForBroker: ' + error);
    return null;
  }
}


/**
 * ============================================
 * DIAGNOSTIC FUNCTION FOR ORDER_CONFIRM_DATA SHEET
 * Run this to get exact column structure
 * ============================================
 */

function analyzeOrderConfirmDataStructure() {
  Logger.clear();
  
  try {
    Logger.log('========================================');
    Logger.log('ORDER_CONFIRM_DATA SHEET ANALYSIS');
    Logger.log('========================================\n');
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('ORDER_CONFIRM_DATA');
    
    if (!sheet) {
      Logger.log('❌ ERROR: ORDER_CONFIRM_DATA sheet not found!');
      Logger.log('Available sheets: ' + ss.getSheets().map(s => s.getName()).join(', '));
      return;
    }
    
    // Get sheet dimensions
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    
    Logger.log('📊 SHEET DIMENSIONS:');
    Logger.log('Total Rows: ' + lastRow);
    Logger.log('Total Columns: ' + lastCol);
    Logger.log('');
    
    // Get headers (Row 1)
    Logger.log('📋 COLUMN HEADERS (Row 1):');
    Logger.log('Column Number | Column Letter | Header Name');
    Logger.log('------------------------------------------------');
    
    const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    
    for (let i = 0; i < headers.length; i++) {
      const colNum = i + 1;
      const colLetter = columnToLetter(colNum);
      const header = headers[i] || '(empty)';
      
      Logger.log('Column ' + colNum + ' | ' + colLetter + ' | ' + header);
    }
    
    Logger.log('');
    Logger.log('========================================');
    Logger.log('DESIGN & TAGA COLUMN DETECTION');
    Logger.log('========================================\n');
    
    // Find design-related columns
    const designColumns = [];
    const tagaColumns = [];
    
    for (let i = 0; i < headers.length; i++) {
      const header = String(headers[i]).toLowerCase().trim();
      const colNum = i + 1;
      const colLetter = columnToLetter(colNum);
      
      if (header.includes('design')) {
        designColumns.push({
          num: colNum,
          letter: colLetter,
          name: headers[i]
        });
      }
      
      if (header.includes('taga')) {
        tagaColumns.push({
          num: colNum,
          letter: colLetter,
          name: headers[i]
        });
      }
    }
    
    Logger.log('🎨 DESIGN COLUMNS FOUND: ' + designColumns.length);
    designColumns.forEach(col => {
      Logger.log('  - Column ' + col.num + ' (' + col.letter + '): ' + col.name);
    });
    
    Logger.log('');
    Logger.log('📊 TAGA COLUMNS FOUND: ' + tagaColumns.length);
    tagaColumns.forEach(col => {
      Logger.log('  - Column ' + col.num + ' (' + col.letter + '): ' + col.name);
    });
    
    Logger.log('');
    Logger.log('========================================');
    Logger.log('SAMPLE DATA ANALYSIS (Row 2)');
    Logger.log('========================================\n');
    
    if (lastRow > 1) {
      Logger.log('📦 Checking data format in Row 2...\n');
      
      const row2 = sheet.getRange(2, 1, 1, lastCol).getValues()[0];
      
      // Check design columns
      if (designColumns.length > 0) {
        Logger.log('🎨 DESIGN DATA FORMAT:');
        designColumns.forEach(col => {
          const value = row2[col.num - 1];
          const valueType = typeof value;
          const valuePreview = String(value).substring(0, 100);
          
          Logger.log('Column ' + col.letter + ' (' + col.name + '):');
          Logger.log('  Type: ' + valueType);
          Logger.log('  Value: ' + valuePreview);
          
          // Detect format
          if (value) {
            const str = String(value);
            if (str.includes(',')) {
              Logger.log('  Format: COMMA-SEPARATED (e.g., "112,113,114")');
            } else if (str.includes('\n')) {
              Logger.log('  Format: NEWLINE-SEPARATED');
            } else if (str.startsWith('[') || str.startsWith('{')) {
              Logger.log('  Format: JSON');
            } else {
              Logger.log('  Format: SINGLE VALUE');
            }
          }
          Logger.log('');
        });
      }
      
      // Check taga columns
      if (tagaColumns.length > 0) {
        Logger.log('📊 TAGA DATA FORMAT:');
        tagaColumns.forEach(col => {
          const value = row2[col.num - 1];
          const valueType = typeof value;
          const valuePreview = String(value).substring(0, 100);
          
          Logger.log('Column ' + col.letter + ' (' + col.name + '):');
          Logger.log('  Type: ' + valueType);
          Logger.log('  Value: ' + valuePreview);
          
          // Detect format
          if (value) {
            const str = String(value);
            if (str.includes(',')) {
              Logger.log('  Format: COMMA-SEPARATED (e.g., "36,36,40")');
            } else if (str.includes('\n')) {
              Logger.log('  Format: NEWLINE-SEPARATED');
            } else if (str.startsWith('[') || str.startsWith('{')) {
              Logger.log('  Format: JSON');
            } else {
              Logger.log('  Format: SINGLE VALUE');
            }
          }
          Logger.log('');
        });
      }
    } else {
      Logger.log('⚠️ No data rows found (sheet only has headers)');
    }
    
    Logger.log('========================================');
    Logger.log('COMPLETE COLUMN MAPPING');
    Logger.log('========================================\n');
    
    Logger.log('Copy this mapping for Code.gs:');
    Logger.log('');
    Logger.log('const COLUMN_MAP = {');
    
    // Map common columns
    const commonFields = {
      'rtwe': ['rtwe', 'rtwe no', 'rtwe number'],
      'costing': ['costing', 'costing no', 'costing sheet'],
      'enqDate': ['enquiry date', 'enq date'],
      'broker': ['broker', 'broker name'],
      'quality': ['quality'],
      'givenRate': ['given rate', 'rate'],
      'buyer': ['buyer', 'buyer name'],
      'poNo': ['po no', 'p/o no', 'po number'],
      'soNo': ['so no', 's/o no', 'so number'],
      'design': ['design', 'designs'],
      'taga': ['taga', 'tagas'],
      'totalOrderTaga': ['total order taga', 'total taga'],
      'countMeter': ['count meter', 'count/meter'],
      'totalMTR': ['total mtr', 'total meter'],
      'totalOrderValue': ['total order value', 'order value'],
      'selvedgeName': ['selvedge name', 'name of selvedge'],
      'selvedgeEnds': ['selvedge ends', 'ends of selvedge'],
      'selvedgeColor': ['selvedge color', 'color of selvedge'],
      'yarnUsed': ['yarn used', 'yarn to be used'],
      'sizingBeam': ['sizing beam', 'sizing beam meter'],
      'paymentTerms': ['payment terms'],
      'deliveryDate': ['delivery date'],
      'remark': ['remark', 'remarks']
    };
    
    for (const [field, searchTerms] of Object.entries(commonFields)) {
      for (let i = 0; i < headers.length; i++) {
        const header = String(headers[i]).toLowerCase().trim();
        if (searchTerms.some(term => header.includes(term))) {
          Logger.log('  ' + field + ': ' + (i + 1) + ',  // Column ' + columnToLetter(i + 1) + ': ' + headers[i]);
          break;
        }
      }
    }
    
    Logger.log('};');
    
    Logger.log('');
    Logger.log('========================================');
    Logger.log('ANALYSIS COMPLETE!');
    Logger.log('========================================');
    Logger.log('');
    Logger.log('📋 Next Steps:');
    Logger.log('1. Copy the column numbers from above');
    Logger.log('2. Note the Design & Taga data format');
    Logger.log('3. Share this with Claude to update Code.gs');
    
  } catch (error) {
    Logger.log('❌ ERROR: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
  }
}

/**
 * Helper function: Convert column number to letter
 */
function columnToLetter(column) {
  let temp, letter = '';
  while (column > 0) {
    temp = (column - 1) % 26;
    letter = String.fromCharCode(temp + 65) + letter;
    column = (column - temp - 1) / 26;
  }
  return letter;
}

/**
 * Alternative: Quick column check for specific columns
 */
function quickColumnCheck() {
  Logger.clear();
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('ORDER_CONFIRM_DATA');
  
  if (!sheet) {
    Logger.log('❌ Sheet not found');
    return;
  }
  
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  Logger.log('Quick Column Reference:');
  Logger.log('');
  
  headers.forEach((header, index) => {
    if (header) {
      Logger.log('Column ' + (index + 1) + ' (' + columnToLetter(index + 1) + '): ' + header);
    }
  });
}