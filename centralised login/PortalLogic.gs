/**
 * ============================================================================
 * MASTER PORTAL LOGIC
 * ============================================================================
 * Handles dynamic app links and portal configuration.
 */

/**
 * Get all active app links for the portal based on user role
 */
function getPortalApps(sessionId) {
  try {
    const session = getSessionData(sessionId);
    if (!session) return { success: false, message: 'Session expired' };

    const ss = SpreadsheetApp.openById(CONFIG.MASTER_SPREADSHEET_ID);
    let sheet = ss.getSheetByName('APP_LINKS');
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet('APP_LINKS');
      sheet.appendRow(['App Name', 'Icon', 'URL', 'Status', 'Visibility']);
      sheet.appendRow(['Enquiry System', '📝', ScriptApp.getService().getUrl(), 'Active', 'ALL']);
      sheet.appendRow(['Sales Order', '📦', '', 'Active', 'ALL']);
      sheet.appendRow(['Sort Master', '📊', '', 'Active', 'ALL']);
    }

    const data = sheet.getDataRange().getValues();
    const apps = [];
    
    for (let i = 1; i < data.length; i++) {
      const [name, icon, url, status, visibility] = data[i];
      
      if (status === 'Active') {
        // Simple role-based visibility check
        if (visibility === 'ALL' || session.role === visibility) {
          apps.push({ name, icon, url, id: i });
        }
      }
    }

    return { success: true, apps: apps, isAdmin: session.role === 'OWNER' || session.role === 'ADMIN' };
  } catch (error) {
    Logger.log('getPortalApps error: ' + error.toString());
    return { success: false, message: error.message };
  }
}

/**
 * Update an app link (Admin only)
 */
function updatePortalApp(sessionId, appId, url) {
  try {
    const session = getSessionData(sessionId);
    if (!session || (session.role !== 'OWNER' && session.role !== 'ADMIN')) {
      return { success: false, message: 'Unauthorized' };
    }

    const ss = SpreadsheetApp.openById(CONFIG.MASTER_SPREADSHEET_ID);
    const sheet = ss.getSheetByName('APP_LINKS');
    
    sheet.getRange(appId + 1, 3).setValue(url); // Column C is URL
    
    return { success: true, message: '✅ App link updated successfully!' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Add a new app to the portal (Admin only)
 */
function addNewPortalApp(sessionId, appName, icon, url) {
  try {
    const session = getSessionData(sessionId);
    if (!session || (session.role !== 'OWNER' && session.role !== 'ADMIN')) {
      return { success: false, message: 'Unauthorized' };
    }

    const ss = SpreadsheetApp.openById(CONFIG.MASTER_SPREADSHEET_ID);
    let sheet = ss.getSheetByName('APP_LINKS');
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet('APP_LINKS');
      sheet.appendRow(['App Name', 'Icon', 'URL', 'Status', 'Visibility']);
    }
    
    // Check if app already exists
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === appName) {
        return { success: false, message: 'App already exists!' };
      }
    }
    
    // Add new app
    sheet.appendRow([appName, icon, url || '', 'Active', 'ALL']);
    
    return { success: true, message: `✅ ${appName} added successfully!` };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Delete an app from the portal (Admin only)
 */
function deletePortalApp(sessionId, appId) {
  try {
    const session = getSessionData(sessionId);
    if (!session || (session.role !== 'OWNER' && session.role !== 'ADMIN')) {
      return { success: false, message: 'Unauthorized' };
    }

    const ss = SpreadsheetApp.openById(CONFIG.MASTER_SPREADSHEET_ID);
    const sheet = ss.getSheetByName('APP_LINKS');
    
    sheet.deleteRow(appId + 1);
    
    return { success: true, message: '✅ App deleted successfully!' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * One-time function to add Sales Order to existing portal
 * Run this once from Script Editor
 */
function addSalesOrderToPortal() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.MASTER_SPREADSHEET_ID);
    let sheet = ss.getSheetByName('APP_LINKS');
    
    if (!sheet) {
      Logger.log('APP_LINKS sheet not found!');
      return;
    }
    
    // Check if Sales Order already exists
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === 'Sales Order') {
        Logger.log('Sales Order already exists!');
        return;
      }
    }
    
    // Add Sales Order
    sheet.appendRow(['Sales Order', '📦', '', 'Active', 'ALL']);
    Logger.log('✅ Sales Order added successfully!');
    
  } catch (error) {
    Logger.log('Error: ' + error.message);
  }
}
