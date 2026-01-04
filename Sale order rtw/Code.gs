/**
 * ============================================================================
 * RTWE SALE ORDER SYSTEM - CODE.GS (FIXED)
 * Main Web App Entry Point
 * Uses SESSION ID pattern (same as RTWE Enquiry)
 * ============================================================================
 */

// ============================================================================
// GLOBAL CONFIGURATION
// ============================================================================

const APP_CONFIG = {
  APP_NAME: 'RTWE Sales Order System',
  VERSION: '1.0.0',
  TIMEZONE: 'Asia/Kolkata'
};

// ============================================================================
// DEBUG FUNCTION - Run from Apps Script Editor to test dropdown data
// ============================================================================
function testMasterDataDropdowns() {
  Logger.log('');
  Logger.log('╔════════════════════════════════════════════════════════════════╗');
  Logger.log('║           MASTER DATA DROPDOWN TEST - DETAILED                 ║');
  Logger.log('╚════════════════════════════════════════════════════════════════╝');
  
  try {
    // Step 1: Open spreadsheet
    const SPREADSHEET_ID = '14HCylVTboHGsmHoJ-jVm6dQ96e5X7VJv9PYIqfQ439E';
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    Logger.log('');
    Logger.log('✅ Spreadsheet opened: ' + ss.getName());
    
    // Step 2: List all sheets
    const allSheets = ss.getSheets();
    Logger.log('');
    Logger.log('📋 ALL SHEETS IN THIS SPREADSHEET:');
    allSheets.forEach((s, i) => {
      Logger.log('   ' + (i+1) + '. "' + s.getName() + '" - Rows: ' + s.getLastRow() + ', Cols: ' + s.getLastColumn());
    });
    
    // Step 3: Try to find Master sheet
    Logger.log('');
    Logger.log('🔍 SEARCHING FOR MASTER SHEET...');
    
    let sheet = ss.getSheetByName('Master');
    if (sheet) {
      Logger.log('   ✅ Found: "Master"');
    } else {
      Logger.log('   ❌ "Master" not found');
      sheet = ss.getSheetByName('Master_Dropdown');
      if (sheet) Logger.log('   ✅ Found: "Master_Dropdown"');
    }
    if (!sheet) {
      sheet = ss.getSheetByName('Master Data');
      if (sheet) Logger.log('   ✅ Found: "Master Data"');
    }
    
    if (!sheet) {
      Logger.log('');
      Logger.log('❌ ERROR: No Master sheet found!');
      Logger.log('   Please check sheet names above and update getMasterData()');
      return;
    }
    
    // Step 4: Read sheet info
    Logger.log('');
    Logger.log('📊 SHEET DETAILS:');
    Logger.log('   Name: "' + sheet.getName() + '"');
    Logger.log('   Last Row: ' + sheet.getLastRow());
    Logger.log('   Last Column: ' + sheet.getLastColumn());
    
    // Step 5: Read header row (row 1)
    const lastCol = sheet.getLastColumn();
    const lastRow = sheet.getLastRow();
    
    if (lastCol > 0) {
      const headers = sheet.getRange(1, 1, 1, lastCol).getDisplayValues()[0];
      Logger.log('');
      Logger.log('📝 HEADER ROW (Row 1):');
      headers.forEach((h, i) => {
        const colLetter = String.fromCharCode(65 + i);
        Logger.log('   ' + colLetter + ': "' + h + '"');
      });
    }
    
    // Step 6: Read sample data row (row 2)
    if (lastRow >= 2 && lastCol > 0) {
      const sampleRow = sheet.getRange(2, 1, 1, Math.min(lastCol, 13)).getDisplayValues()[0];
      Logger.log('');
      Logger.log('📝 FIRST DATA ROW (Row 2):');
      sampleRow.forEach((val, i) => {
        const colLetter = String.fromCharCode(65 + i);
        Logger.log('   ' + colLetter + ': "' + val + '"');
      });
    } else {
      Logger.log('');
      Logger.log('⚠️ No data rows found (lastRow < 2)');
    }
    
    // Step 7: Count unique values per column
    Logger.log('');
    Logger.log('📊 UNIQUE VALUES PER COLUMN:');
    
    for (let col = 1; col <= Math.min(lastCol, 13); col++) {
      const colLetter = String.fromCharCode(64 + col);
      try {
        const range = sheet.getRange(2, col, lastRow - 1, 1);
        const values = range.getDisplayValues();
        const unique = [];
        values.forEach(row => {
          const val = String(row[0]).trim();
          if (val && val !== '' && !unique.includes(val)) {
            unique.push(val);
          }
        });
        Logger.log('   ' + colLetter + ': ' + unique.length + ' unique values' + 
          (unique.length > 0 ? ' (e.g. "' + unique[0] + '")' : ''));
      } catch (e) {
        Logger.log('   ' + colLetter + ': ERROR - ' + e.message);
      }
    }
    
    Logger.log('');
    Logger.log('╚══════════════════════════════════════════════════════════════╝');
    Logger.log('Test complete!');
    
  } catch (error) {
    Logger.log('');
    Logger.log('❌ CRITICAL ERROR: ' + error.toString());
  }
}

// ============================================================================
// WEB APP ENTRY POINT - doGet
// ============================================================================

function doGet(e) {
  const page = e.parameter.page || 'login';
  // Accept both 'sessionId' and 'session' for compatibility
  const sessionId = e.parameter.sessionId || e.parameter.session;
  
  Logger.log('=== SALE ORDER doGet ===');
  Logger.log('Page: ' + page);
  Logger.log('SessionId: ' + sessionId);
  
  // Public pages (no authentication required)
  const publicPages = ['login', 'signup', 'forgot-password'];
  
  // If not a public page, validate session
  if (!publicPages.includes(page)) {
    if (!sessionId || !isValidSession(sessionId)) {
      Logger.log('Session validation failed - redirecting to login with clear instruction');
      return clearSessionAndRedirectToLogin('Session expired. Please login again.');
    }
    Logger.log('Session validated successfully');
  }
  
  // Route to appropriate page
  switch(page) {
    case 'login':
      if (sessionId && isValidSession(sessionId)) {
        Logger.log('Valid session detected - redirecting to dashboard');
        return serveDashboard(sessionId);
      }
      return serveLogin();
    
    case 'dashboard':
      return serveDashboard(sessionId);
      
    case 'sale-order-form':
      const rtweNo = e.parameter.rtweNo || '';
      return serveSaleOrderForm(sessionId, rtweNo);
      
    case 'pending-orders':
      return servePendingOrders(sessionId);
      
    case 'complete-orders':
      return serveCompleteOrders(sessionId);
      
    case 'cancelled-orders':
      return serveCancelledOrders(sessionId);
      
    case 'logout':
      if (sessionId) {
        serverLogout(sessionId);
      }
      return clearSessionAndRedirectToLogin('Logged out successfully');
      
    default:
      return serveLogin();
  }
}

// ============================================================================
// CLEAR SESSION AND REDIRECT
// ============================================================================

function clearSessionAndRedirectToLogin(message) {
  const scriptUrl = ScriptApp.getService().getUrl();
  const loginUrl = scriptUrl + '?page=login' + (message ? '&message=' + encodeURIComponent(message) : '');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .spinner {
          border: 4px solid rgba(255,255,255,0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        h2 { margin: 0 0 10px 0; }
        p { margin: 0; opacity: 0.9; }
      </style>
    </head>
    <body>
      <div class="spinner"></div>
      <h2>Session Expired</h2>
      <p>Redirecting to login...</p>
      
      <script>
        console.log('Clearing session data...');
        try {
          localStorage.removeItem('saleorder_session');
          localStorage.removeItem('saleorder_userName');
          localStorage.removeItem('saleorder_userId');
          localStorage.removeItem('saleorder_userEmail');
          localStorage.removeItem('saleorder_userRole');
          sessionStorage.clear();
          console.log('Session data cleared successfully');
        } catch (e) {
          console.error('Error clearing storage:', e);
        }
        
        setTimeout(function() {
          window.location.href = '${loginUrl}';
        }, 1000);
      </script>
    </body>
    </html>
  `;
  
  return HtmlService.createHtmlOutput(html)
    .setTitle('Redirecting...')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ============================================================================
// PAGE SERVING FUNCTIONS
// ============================================================================

function serveLogin(message) {
  const template = HtmlService.createTemplateFromFile('Login');
  template.appName = APP_CONFIG.APP_NAME;
  template.message = message || '';
  
  return template.evaluate()
    .setTitle('Login - ' + APP_CONFIG.APP_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

function serveDashboard(sessionId) {
  Logger.log('serveDashboard called with sessionId: ' + sessionId);
  
  const session = getSessionData(sessionId);
  
  if (!session) {
    Logger.log('serveDashboard: Session not found, redirecting to login');
    return clearSessionAndRedirectToLogin('Session expired');
  }
  
  Logger.log('serveDashboard: Serving dashboard for user: ' + session.name);
  
  const template = HtmlService.createTemplateFromFile('Dashboard');
  template.sessionId = sessionId;
  template.userName = session.name || session.username || 'User';
  template.userRole = session.role || 'User';
  template.webAppUrl = ScriptApp.getService().getUrl();
  
  return template.evaluate()
    .setTitle('Dashboard - ' + APP_CONFIG.APP_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

function serveSaleOrderForm(sessionId, rtweNo) {
  const session = getSessionData(sessionId);
  if (!session) {
    return clearSessionAndRedirectToLogin('Session expired');
  }
  
  const template = HtmlService.createTemplateFromFile('SaleOrderForm');
  template.sessionId = sessionId;
  template.userName = session.name || session.username || 'User';
  template.webAppUrl = ScriptApp.getService().getUrl();
  template.prefillRtweNo = rtweNo || '';  // Pass RTWE number for auto-fetch
  
  return template.evaluate()
    .setTitle('New Sale Order - ' + APP_CONFIG.APP_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

function servePendingOrders(sessionId) {
  const session = getSessionData(sessionId);
  if (!session) {
    return clearSessionAndRedirectToLogin('Session expired');
  }
  
  const template = HtmlService.createTemplateFromFile('PendingOrders');
  template.sessionId = sessionId;
  template.userName = session.name || session.username || 'User';
  template.webAppUrl = ScriptApp.getService().getUrl();
  
  return template.evaluate()
    .setTitle('Pending Orders - ' + APP_CONFIG.APP_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

function serveCompleteOrders(sessionId) {
  const session = getSessionData(sessionId);
  if (!session) {
    return clearSessionAndRedirectToLogin('Session expired');
  }
  
  const template = HtmlService.createTemplateFromFile('CompleteOrders');
  template.sessionId = sessionId;
  template.userName = session.name || session.username || 'User';
  template.webAppUrl = ScriptApp.getService().getUrl();
  
  return template.evaluate()
    .setTitle('Complete Orders - ' + APP_CONFIG.APP_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

function serveCancelledOrders(sessionId) {
  const session = getSessionData(sessionId);
  if (!session) {
    return clearSessionAndRedirectToLogin('Session expired');
  }
  
  const template = HtmlService.createTemplateFromFile('CancelledOrders');
  template.sessionId = sessionId;
  template.userName = session.name || session.username || 'User';
  template.webAppUrl = ScriptApp.getService().getUrl();
  
  return template.evaluate()
    .setTitle('Cancelled Orders - ' + APP_CONFIG.APP_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Get master data for dropdowns (ALL OPTIONS)
 * Uses getDisplayValues() for each column to handle formulas and formatting
 */
function getMasterData(sessionId) {
  try {
    Logger.log('=== getMasterData STARTED ===');
    
    // Use specific spreadsheet URL to ensure correct data source
    const SPREADSHEET_ID = '14HCylVTboHGsmHoJ-jVm6dQ96e5X7VJv9PYIqfQ439E';
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    Logger.log('Opened spreadsheet: ' + ss.getName());
    
    // Get the Master sheet
    let sheet = ss.getSheetByName('Master');
    
    if (!sheet) {
      sheet = ss.getSheetByName('Master_Dropdown');
    }
    if (!sheet) {
      sheet = ss.getSheetByName('Master Data');
    }
    
    if (!sheet) {
      Logger.log('ERROR: Master Data sheet not found');
      return { 
        success: false, 
        message: 'Master Data sheet not found',
        data: { agents: [], transport: [], buyers: [], contractTypes: [] } 
      };
    }
    
    Logger.log('Using sheet: "' + sheet.getName() + '"');
    const lastRow = sheet.getLastRow();
    Logger.log('Sheet last row: ' + lastRow);
    
    if (lastRow <= 1) {
      Logger.log('WARNING: Sheet has no data rows');
      return {
        success: true,
        data: { agents: [], transport: [], buyers: [], contractRoutes: [], modesOfShipment: [], paymentTerms: [], deliveryTerms: [], banks: [], consignees: [] }
      };
    }
    
    // Helper to get unique non-empty values from a column using getDisplayValues
    const getColumnData = (colNum) => {
      const range = sheet.getRange(2, colNum, lastRow - 1, 1);
      const values = range.getDisplayValues(); // Gets visible text, not formulas
      const unique = [];
      values.forEach(row => {
        const val = String(row[0]).trim();
        if (val && val !== '' && !unique.includes(val)) {
          unique.push(val);
        }
      });
      return unique;
    };
    
    // Read each column separately using getDisplayValues
    // Column mapping based on Master sheet structure:
    // A=Contract, B=Mode, C=Payment, D=Broker, E=Transport, F=Buyer, G=Delivery, H=SOType, I=GST, J=Fabric, K=UOM, L=Inspection, M=Bank
    
    const contractTypes = getColumnData(1);    // A
    const modesOfShipment = getColumnData(2);  // B
    const paymentTerms = getColumnData(3);     // C
    const agents = getColumnData(4);           // D - Broker/Agent
    const transport = getColumnData(5);        // E
    const buyers = getColumnData(6);           // F
    const deliveryTerms = getColumnData(7);    // G
    const soTypes = getColumnData(8);          // H
    const gstTypes = getColumnData(9);         // I
    const fabricTypes = getColumnData(10);     // J
    const uoms = getColumnData(11);            // K
    const inspectionTypes = getColumnData(12); // L
    const banks = getColumnData(13);           // M
    
    Logger.log('Parsed data counts:');
    Logger.log('  - contractTypes: ' + contractTypes.length);
    Logger.log('  - buyers: ' + buyers.length);
    Logger.log('  - agents: ' + agents.length);
    Logger.log('  - transport: ' + transport.length);
    Logger.log('  - modesOfShipment: ' + modesOfShipment.length);
    
    // Convert to object format for dropdowns
    const toObjArray = (arr) => arr.map(item => ({ value: item, display: item }));

    return {
      success: true,
      data: {
        agents: agents,
        transport: transport,
        buyers: buyers,
        consignees: [...buyers],
        contractRoutes: toObjArray(contractTypes),
        modesOfShipment: toObjArray(modesOfShipment),
        paymentTerms: toObjArray(paymentTerms),
        deliveryTerms: toObjArray(deliveryTerms),
        soTypes: toObjArray(soTypes),
        gstTypes: toObjArray(gstTypes),
        fabricTypes: toObjArray(fabricTypes),
        uoms: toObjArray(uoms),
        inspectionTypes: toObjArray(inspectionTypes),
        banks: toObjArray(banks)
      }
    };
  } catch (error) {
    Logger.log('getMasterData ERROR: ' + error.toString());
    return { 
      success: false, 
      message: error.toString(),
      data: { agents: [], transport: [], buyers: [], contractTypes: [] } 
    };
  }
}