/**
 * Test function to verify portal setup
 * Run this from the Apps Script editor to check if everything is configured correctly
 */
function testPortalSetup() {
  Logger.log('=== PORTAL SETUP TEST ===');
  
  // Test 1: Check CONFIG
  try {
    Logger.log('CONFIG.MASTER_SPREADSHEET_ID: ' + CONFIG.MASTER_SPREADSHEET_ID);
    Logger.log('✅ CONFIG is defined');
  } catch (e) {
    Logger.log('❌ CONFIG error: ' + e.toString());
  }
  
  // Test 2: Check if we can access the spreadsheet
  try {
    const ss = SpreadsheetApp.openById(CONFIG.MASTER_SPREADSHEET_ID);
    Logger.log('✅ Spreadsheet accessible: ' + ss.getName());
  } catch (e) {
    Logger.log('❌ Spreadsheet access error: ' + e.toString());
  }
  
  // Test 3: Check if USERS sheet exists
  try {
    const ss = SpreadsheetApp.openById(CONFIG.MASTER_SPREADSHEET_ID);
    const userSheet = ss.getSheetByName('USERS');
    if (userSheet) {
      Logger.log('✅ USERS sheet found with ' + (userSheet.getLastRow() - 1) + ' users');
    } else {
      Logger.log('❌ USERS sheet not found');
    }
  } catch (e) {
    Logger.log('❌ USERS sheet error: ' + e.toString());
  }
  
  // Test 4: Check if SESSIONS sheet exists
  try {
    const ss = SpreadsheetApp.openById(CONFIG.MASTER_SPREADSHEET_ID);
    const sessionSheet = ss.getSheetByName('SESSIONS');
    if (sessionSheet) {
      Logger.log('✅ SESSIONS sheet found');
    } else {
      Logger.log('❌ SESSIONS sheet not found');
    }
  } catch (e) {
    Logger.log('❌ SESSIONS sheet error: ' + e.toString());
  }
  
  // Test 5: Test login function
  try {
    // Try to login with test credentials (replace with actual username/password)
    const result = loginUserSecure('admin', 'admin123', false);
    Logger.log('Login test result: ' + JSON.stringify(result));
  } catch (e) {
    Logger.log('❌ Login test error: ' + e.toString());
  }
  
  Logger.log('=== TEST COMPLETE ===');
}

/**
 * Simple test to serve a basic HTML page
 * This will help verify if the web app deployment is working
 */
function testServeHTML() {
  const html = HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Portal Test</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          text-align: center;
        }
        .success {
          color: green;
          font-size: 24px;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="success">✅ Portal Web App is Working!</div>
      <p>If you see this message, the web app deployment is successful.</p>
      <p>Web App URL: ${ScriptApp.getService().getUrl()}</p>
    </body>
    </html>
  `);
  
  return html;
}
