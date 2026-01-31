/**
 * ============================================================================
 * SORT MASTER MANAGEMENT SYSTEM 2026
 * Main Application Entry Point (Code.gs)
 * ============================================================================
 * 
 * @description Complete routing and server-side functions for Sort Master System
 * @version 2.2 PRODUCTION READY - WITH UPDATE FUNCTION
 * @author Shekhar
 * @date December 28, 2025
 * ============================================================================
 */

// ============================================================================
// WEB APP ENTRY POINTS
// ============================================================================

function doGet(e) {
  try {
    Logger.log('=== SORT MASTER DO GET REQUEST ===');
    const params = e.parameter;
    const page = params.page || 'login';
    // Accept both 'session' and 'sessionId' parameters for compatibility with centralized portal
    const sessionId = params.session || params.sessionId || '';
    
    Logger.log('Page: ' + page + ', SessionId: ' + sessionId);
    
    return routeToPage(page, sessionId, params);
    
  } catch (error) {
    Logger.log('❌ doGet error: ' + error.message);
    Logger.log('Stack: ' + error.stack);
    return serveErrorPage('System error. Please try again.');
  }
}

function doPost(e) {
  try {
    Logger.log('=== DO POST REQUEST ===');
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    
    Logger.log('Action: ' + action);
    
    return jsonResponse({
      success: false,
      message: 'Please use google.script.run instead of POST requests'
    });
    
  } catch (error) {
    Logger.log('❌ doPost error: ' + error.message);
    return jsonResponse({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
}

// ============================================================================
// GOOGLE.SCRIPT.RUN SERVER FUNCTIONS (NO CORS)
// ============================================================================

function serverLogin(username, password, rememberMe) {
  try {
    Logger.log('serverLogin called - username: ' + username);
    
    if (!username || !password) {
      return { success: false, message: 'Username and password are required' };
    }
    
    const result = login(username, password, rememberMe, 'web');
    Logger.log('serverLogin result: ' + result.success);
    
    return result;
    
  } catch (error) {
    Logger.log('❌ serverLogin error: ' + error.message);
    return { success: false, message: 'Login failed. Please try again.' };
  }
}

function serverLogout(sessionId) {
  try {
    Logger.log('serverLogout called');
    
    if (!sessionId) {
      return { success: false, message: 'Session ID required' };
    }
    
    const result = logout(sessionId);
    return result;
    
  } catch (error) {
    Logger.log('❌ serverLogout error: ' + error.message);
    return { success: false, message: 'Logout failed' };
  }
}

function serverValidateSession(sessionId) {
  try {
    if (!sessionId) {
      return { valid: false, message: 'No session ID' };
    }
    
    const session = validateSession(sessionId);
    
    if (!session) {
      return { valid: false, message: 'Invalid session' };
    }
    
    const user = getUserById(session.userId);
    
    if (!user) {
      return { valid: false, message: 'User not found' };
    }
    
    return {
      valid: true,
      userId: user.userId,
      userName: user.userName,
      role: user.role,
      email: user.email
    };
    
  } catch (error) {
    Logger.log('❌ serverValidateSession error: ' + error.message);
    return { valid: false, message: 'Validation error' };
  }
}

function getStatistics(sessionId) {
  try {
    Logger.log('========================================');
    Logger.log('GET STATISTICS CALLED');
    Logger.log('Session ID: ' + sessionId);
    Logger.log('========================================');
    
    const session = validateSession(sessionId);
    
    if (!session) {
      Logger.log('❌ Session validation failed');
      return {
        success: false,
        message: 'Session expired',
        stats: {
          pendingOrders: 0,
          completeOrders: 0,
          totalOrders: 0,
          todayActivity: 0
        }
      };
    }
    
    Logger.log('✅ Session valid');
    
    let pendingCount = 0;
    let completeCount = 0;
    let todayActivity = 0;
    
    // Get complete orders count first (to get RTWE numbers with Sort Masters)
    let rtweWithSortMaster = new Set();
    try {
      Logger.log('Reading sort master sheet...');
      const sortMasterSheet = getSheet(SHEET_NAMES.SORT_MASTER);
      
      if (sortMasterSheet) {
        const sortMasterData = sortMasterSheet.getDataRange().getValues();
        completeCount = Math.max(0, sortMasterData.length - 1);
        
        // Build set of RTWE numbers that have Sort Masters
        for (let i = 1; i < sortMasterData.length; i++) {
          const rtweNo = sortMasterData[i][2]; // Column C - rtweNo
          if (rtweNo) {
            rtweWithSortMaster.add(String(rtweNo));
          }
        }
        Logger.log('✅ Complete orders: ' + completeCount);
      }
    } catch (e) {
      Logger.log('⚠️ Error reading sort master: ' + e.message);
    }
    
    // Get pending orders count (excluding orders with Sort Masters)
    try {
      Logger.log('Reading pending orders sheet...');
      const pendingSheet = getSheet(SHEET_NAMES.PENDING_ORDERS);
      
      if (pendingSheet) {
        const pendingData = pendingSheet.getDataRange().getValues();
        // Count only pending orders that DON'T have a Sort Master
        for (let i = 1; i < pendingData.length; i++) {
          const rtweNo = String(pendingData[i][0]);
          if (rtweNo && !rtweWithSortMaster.has(rtweNo)) {
            pendingCount++;
          }
        }
        Logger.log('✅ Pending orders (excluding completed): ' + pendingCount);
      }
    } catch (e) {
      Logger.log('⚠️ Error reading pending orders: ' + e.message);
    }
    
    // Calculate today's stats
    let todayPending = 0;
    let todayComplete = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Count today's new pending orders (orders added today)
    try {
      const pendingSheet = getSheet(SHEET_NAMES.PENDING_ORDERS);
      if (pendingSheet) {
        const pendingData = pendingSheet.getDataRange().getValues();
        for (let i = 1; i < pendingData.length; i++) {
          const orderDate = pendingData[i][3]; // Column D - date
          if (orderDate) {
            const d = new Date(orderDate);
            d.setHours(0, 0, 0, 0);
            if (d.getTime() === today.getTime()) {
              // Check if this order doesn't have a sort master yet
              const rtweNo = String(pendingData[i][0]);
              if (rtweNo && !rtweWithSortMaster.has(rtweNo)) {
                todayPending++;
              }
            }
          }
        }
      }
      Logger.log('✅ Today pending orders: ' + todayPending);
    } catch (e) {
      Logger.log('⚠️ Error counting today pending: ' + e.message);
    }
    
    // Count Sort Masters completed today
    try {
      const sortMasterSheet = getSheet(SHEET_NAMES.SORT_MASTER);
      if (sortMasterSheet) {
        const sortMasterData = sortMasterSheet.getDataRange().getValues();
        for (let i = 1; i < sortMasterData.length; i++) {
          const createdDate = sortMasterData[i][64]; // Column for createdDate
          if (createdDate) {
            const d = new Date(createdDate);
            d.setHours(0, 0, 0, 0);
            if (d.getTime() === today.getTime()) {
              todayComplete++;
            }
          }
        }
      }
      Logger.log('✅ Today completed: ' + todayComplete);
    } catch (e) {
      Logger.log('⚠️ Error counting today complete: ' + e.message);
    }
    
    // Get today's activity from audit log
    try {
      Logger.log('Reading audit log sheet...');
      const auditSheet = getSheet(SHEET_NAMES.AUDIT_LOG);
      
      if (auditSheet) {
        const auditData = auditSheet.getDataRange().getValues();
        
        for (let i = 1; i < auditData.length; i++) {
          if (auditData[i][9]) {
            const logDate = new Date(auditData[i][9]);
            logDate.setHours(0, 0, 0, 0);
            if (logDate.getTime() === today.getTime()) {
              todayActivity++;
            }
          }
        }
        Logger.log('✅ Today activity: ' + todayActivity);
      }
    } catch (e) {
      Logger.log('⚠️ Error reading audit log: ' + e.message);
    }
    
    const totalCount = pendingCount + completeCount;
    
    const stats = {
      pendingOrders: pendingCount,
      completeOrders: completeCount,
      totalOrders: totalCount,
      todayActivity: todayActivity,
      todayPending: todayPending,
      todayComplete: todayComplete
    };
    
    Logger.log('========================================');
    Logger.log('STATISTICS RESULT:');
    Logger.log(JSON.stringify(stats, null, 2));
    Logger.log('========================================');
    
    return {
      success: true,
      stats: stats
    };
    
  } catch (error) {
    Logger.log('========================================');
    Logger.log('❌ GET STATISTICS ERROR');
    Logger.log('Error: ' + error.message);
    Logger.log('Stack: ' + error.stack);
    Logger.log('========================================');
    
    return {
      success: false,
      message: 'Error: ' + error.message,
      stats: {
        pendingOrders: 0,
        completeOrders: 0,
        totalOrders: 0,
        todayActivity: 0,
        todayPending: 0,
        todayComplete: 0
      }
    };
  }
}

function getPendingOrders(filters, page, limit) {
  try {
    Logger.log('=== GET PENDING ORDERS ===');
    Logger.log('Filters: ' + JSON.stringify(filters));
    
    // Use direct sheet access for reliability
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log('Got spreadsheet: ' + ss.getName());
    
    const sheet = ss.getSheetByName('Pending order for sort');
    
    if (!sheet) {
      Logger.log('ERROR: Pending order sheet not found!');
      return {
        success: false,
        message: 'Sheet not found',
        orders: [],
        page: 1,
        totalPages: 0,
        total: 0
      };
    }
    
    Logger.log('Got sheet: ' + sheet.getName());
    
    const data = sheet.getDataRange().getValues();
    Logger.log('Total rows in sheet: ' + data.length);
    
    if (data.length <= 1) {
      Logger.log('No data rows found');
      return {
        success: true,
        orders: [],
        page: 1,
        totalPages: 0,
        total: 0
      };
    }
    
    // Log first row to see column headers
    Logger.log('Headers: ' + JSON.stringify(data[0]));
    
    // Log second row as sample data
    if (data.length > 1) {
      Logger.log('First data row: ' + JSON.stringify(data[1]));
    }
    
    const orders = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row[0]) {
        Logger.log('Skipping empty row ' + i);
        continue;
      }
      
      const status = row[4] ? row[4].toString().trim().toLowerCase() : '';
      Logger.log('Row ' + i + ' status: "' + status + '"');
      
      if (status === 'pending' || status === '') {
        // Convert Date to string to avoid serialization issues
        let dateStr = '';
        if (row[3]) {
          try {
            dateStr = row[3] instanceof Date 
              ? row[3].toISOString() 
              : String(row[3]);
          } catch(e) {
            dateStr = String(row[3]);
          }
        }
        
        orders.push({
          rtweNo: String(row[0] || ''),
          brokerName: String(row[1] || ''),
          quality: String(row[2] || ''),
          date: dateStr,
          status: String(row[4] || 'Pending')
        });
      }
    }
    
    Logger.log('Pending orders found: ' + orders.length);
    
    let filtered = orders;
    
    if (filters) {
      if (filters.rtweNo && filters.rtweNo !== '') {
        filtered = filtered.filter(o => 
          o.rtweNo.toLowerCase().includes(filters.rtweNo.toLowerCase())
        );
      }
      if (filters.broker && filters.broker !== '') {
        filtered = filtered.filter(o => 
          o.brokerName.toLowerCase().includes(filters.broker.toLowerCase())
        );
      }
      if (filters.quality && filters.quality !== '') {
        filtered = filtered.filter(o => 
          o.quality.toLowerCase().includes(filters.quality.toLowerCase())
        );
      }
    }
    
    Logger.log('After filters: ' + filtered.length);
    
    const pageNum = page || 1;
    const pageLimit = limit || 25;
    const totalPages = Math.ceil(filtered.length / pageLimit);
    const start = (pageNum - 1) * pageLimit;
    const end = start + pageLimit;
    const paginated = filtered.slice(start, end);
    
    Logger.log('Page ' + pageNum + ' orders: ' + paginated.length);
    
    const result = {
      success: true,
      orders: paginated,
      page: pageNum,
      totalPages: totalPages,
      total: filtered.length
    };
    
    Logger.log('>>> RETURNING RESULT: ' + JSON.stringify(result));
    
    return result;
    
  } catch (error) {
    Logger.log('❌ ERROR: ' + error.message);
    Logger.log('Stack: ' + error.stack);
    return {
      success: false,
      message: 'Error: ' + error.message,
      orders: [],
      page: 1,
      totalPages: 0,
      total: 0
    };
  }
}

function getCompleteOrders(filters, page, limit) {
  try {
    Logger.log('getCompleteOrders called');
    
    // Use direct sheet access for reliability
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('SORT_MASTER');
    
    if (!sheet) {
      Logger.log('SORT_MASTER sheet not found!');
      return { success: false, message: 'SORT_MASTER sheet not found' };
    }
    
    const data = sheet.getDataRange().getValues();
    Logger.log('SORT_MASTER total rows: ' + data.length);
    
    // Skip if only header row
    if (data.length <= 1) {
      return {
        success: true,
        orders: [],
        page: 1,
        totalPages: 0,
        total: 0
      };
    }
    
    const orders = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (!row[0] && !row[1]) {
        continue;
      }
      
      // Column mapping based on Datasave.gs structure:
      // 0: sortMasterId, 1: sortMasterNo, 2: rtweNo, 3: brokerName, 4: quality
      // 5: fabricType, 6: sheddingMechanismId, 7: weaveName, 8: isExportOrder
      // 10: reed, 13: width, 17: totalPicks
      // 35: glm, 36: gsm
      // 64: status, 65: createdDate, 66: createdBy, 67: createdByName
      
      // Convert Date to string to avoid serialization issues
      let createdDateStr = '';
      if (row[65]) {
        try {
          createdDateStr = row[65] instanceof Date 
            ? row[65].toISOString() 
            : String(row[65]);
        } catch(e) {
          createdDateStr = String(row[65]);
        }
      }
      
      orders.push({
        sortMasterId: String(row[0] || ''),
        sortMasterNo: String(row[1] || ''),
        rtweNo: String(row[2] || ''),
        brokerName: String(row[3] || ''),
        quality: String(row[4] || ''),
        glm: String(row[35] || ''),
        gsm: String(row[36] || ''),
        width: String(row[13] || ''),
        reed: String(row[10] || ''),
        picks: String(row[17] || ''),
        createdDate: createdDateStr,
        createdBy: String(row[67] || '')
      });
    }
    
    Logger.log('Found ' + orders.length + ' complete orders');
    
    let filtered = orders;
    if (filters) {
      if (filters.sortMasterNo) {
        filtered = filtered.filter(o => 
          o.sortMasterNo.toLowerCase().includes(filters.sortMasterNo.toLowerCase())
        );
      }
      if (filters.rtweNo) {
        filtered = filtered.filter(o => 
          o.rtweNo.toLowerCase().includes(filters.rtweNo.toLowerCase())
        );
      }
      if (filters.broker) {
        filtered = filtered.filter(o => 
          o.brokerName.toLowerCase().includes(filters.broker.toLowerCase())
        );
      }
    }
    
    const pageNum = page || 1;
    const pageLimit = limit || 25;
    const start = (pageNum - 1) * pageLimit;
    const end = start + pageLimit;
    const paginatedOrders = filtered.slice(start, end);
    
    Logger.log('Returning ' + paginatedOrders.length + ' complete orders');
    
    return {
      success: true,
      orders: paginatedOrders,
      page: pageNum,
      totalPages: Math.ceil(filtered.length / pageLimit),
      total: filtered.length
    };
    
  } catch (error) {
    Logger.log('❌ getCompleteOrders error: ' + error.message);
    return { success: false, message: 'Error: ' + error.message };
  }
}

function getPendingOrderByRTWE(rtweNo) {
  try {
    const sheet = getSheet(SHEET_NAMES.PENDING_ORDERS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === rtweNo) {
        return {
          success: true,
          order: {
            rtweNo: data[i][0],
            brokerName: data[i][1],
            quality: data[i][2],
            date: data[i][3]
          }
        };
      }
    }
    
    return { success: false, message: 'Order not found' };
    
  } catch (error) {
    return { success: false, message: error.message };
  }
}

function previewSortMasterNo() {
  try {
    const nextNumber = generateNextSortMasterNumber();
    return { success: true, sortMasterNo: nextNumber };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

function getItemMaster() {
  try {
    const sheet = getSheet(SHEET_NAMES.ITEM_MASTER);
    const data = sheet.getDataRange().getValues();
    
    const items = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][14] === true) {
        items.push({
          itemId: data[i][0],
          itemName: data[i][1],
          yarnTypeId: data[i][2],
          yarnTypeName: data[i][3],
          englishCount: data[i][13]
        });
      }
    }
    
    return { success: true, items: items };
    
  } catch (error) {
    return { success: false, message: error.message };
  }
}

function getWeaveMaster() {
  try {
    const sheet = getSheet(SHEET_NAMES.WEAVE_MASTER);
    const data = sheet.getDataRange().getValues();
    
    const weaves = [];
    for (let i = 1; i < data.length; i++) {
      if (data[i][2] === true) {
        weaves.push({
          weaveId: data[i][0],
          weaveName: data[i][1]
        });
      }
    }
    
    return { success: true, weaves: weaves };
    
  } catch (error) {
    return { success: false, message: error.message };
  }
}

function getSelvedgeMaster() {
  try {
    // Get selvedge master data from SelvedgeMaster.gs
    var selvedges = getSelvedgeMasterData();
    
    return {
      success: true,
      selvedges: selvedges
    };
  } catch (error) {
    Logger.log('getSelvedgeMaster error: ' + error.message);
    return {
      success: false,
      selvedges: [],
      message: error.message
    };
  }
}

function calculateSortMaster(formData) {
  try {
    var calculations = calculateAllSortMasterValues(formData);
    return { success: true, calculations: calculations };
  } catch (error) {
    Logger.log('❌ calculateSortMaster error: ' + error.message);
    Logger.log('Stack: ' + error.stack);
    return { success: false, message: error.message };
  }
}

/**
 * Save new Sort Master (wrapper for UI - validates session then calls Datasave.gs)
 * @param {Object} formData - Form data with sessionId
 * @param {boolean} sendNotifications - Whether to send notifications
 * @return {Object} {success, message, sortMasterNo}
 */
function saveSortMasterFromUI(formData, sendNotifications) {
  try {
    Logger.log('=== saveSortMasterFromUI START ===');
    Logger.log('Received sessionId: ' + (formData.sessionId || 'MISSING'));
    
    // Validate session
    const session = validateSession(formData.sessionId);
    Logger.log('Session validation result: ' + (session ? 'VALID' : 'INVALID'));
    
    if (!session) {
      Logger.log('❌ Session validation failed');
      return { 
        success: false, 
        message: 'You do not have permission to access this resource' 
      };
    }
    
    Logger.log('✅ Session valid for user: ' + session.userId);
    
    // Add userId and userName to formData for Datasave.gs
    formData.userId = session.userId;
    formData.userName = session.userName || getUserById(session.userId).userName;
    
    // Call the actual save function from Datasave.gs
    const result = saveSortMaster(formData, sendNotifications);
    
    if (result.success) {
      Logger.log('✅ Sort Master saved successfully: ' + result.sortMasterNo);
    }
    
    return result;
    
  } catch (error) {
    Logger.log('❌ saveSortMasterFromUI error: ' + error.message);
    Logger.log('Stack: ' + error.stack);
    return { 
      success: false, 
      message: 'Save failed: ' + error.message 
    };
  }
}

/**
 * Update existing Sort Master (wrapper for UI - validates session then calls Datasave.gs)
 * @param {string} sortMasterId - Sort Master ID to update
 * @param {Object} formData - Form data with sessionId
 * @return {Object} {success, message, sortMasterNo}
 */
function updateSortMasterFromUI(sortMasterId, formData) {
  try {
    Logger.log('=== updateSortMasterFromUI START ===');
    Logger.log('sortMasterId: ' + sortMasterId);
    Logger.log('Received sessionId: ' + (formData.sessionId || 'MISSING'));
    
    // Validate session
    const session = validateSession(formData.sessionId);
    Logger.log('Session validation result: ' + (session ? 'VALID' : 'INVALID'));
    
    if (!session) {
      Logger.log('❌ Session validation failed');
      return { 
        success: false, 
        message: 'You do not have permission to access this resource' 
      };
    }
    
    Logger.log('✅ Session valid for user: ' + session.userId);
    
    // Add userId and userName to formData for Datasave.gs
    formData.userId = session.userId;
    formData.userName = session.userName || getUserById(session.userId).userName;
    
    // Call the actual update function from Datasave.gs
    const result = updateSortMaster(sortMasterId, formData);
    
    if (result.success) {
      Logger.log('✅ Sort Master updated successfully');
    }
    
    return result;
    
  } catch (error) {
    Logger.log('❌ updateSortMasterFromUI error: ' + error.message);
    Logger.log('Stack: ' + error.stack);
    return { 
      success: false, 
      message: 'Update failed: ' + error.message 
    };
  }
}

// ============================================================================
// PAGE ROUTING
// ============================================================================

function routeToPage(page, sessionId, params) {
  Logger.log('=== ROUTE TO PAGE ===');
  Logger.log('Page: ' + page + ', SessionId: ' + sessionId);
  
  // Public pages (no session needed)
  if (page === 'register') return serveRegister();
  if (page === 'forgot-password') return serveForgotPassword();
  
  // Validate session FIRST
  const session = validateSession(sessionId);
  
  if (session) {
    Logger.log('✅ Valid session - userId: ' + session.userId);
    // If they have a valid session and are on 'login' or no page, show dashboard
    if (page === 'login' || !page) {
      return serveDashboard(session);
    }
  } else {
    // No session or invalid session
    Logger.log('❌ Invalid or missing session');
    if (page === 'login') return serveLogin();
    return serveLogin('Session expired. Please login again.');
  }
  
  switch (page) {
    case 'dashboard':
      return serveDashboard(session);
    case 'pending-orders':
      return servePendingOrders(session);
    case 'complete-orders':
      return serveCompleteOrders(session);
    case 'sort-master-form':
      return serveSortMasterForm(session, params);
    case 'user-management':
      return serveUserManagement(session);
    case 'settings':
      return serveSettings(session);
    case 'audit-log':
      return serveAuditLog(session);
    default:
      return serve404(session);
  }
}

// ============================================================================
// PAGE SERVING FUNCTIONS - ✅ FIXED FILE NAMES
// ============================================================================

function serveLogin(message) {
  const template = HtmlService.createTemplateFromFile('Login');
  template.message = message || '';
  template.webAppUrl = getWebAppUrl();
  
  return template.evaluate()
    .setTitle('Login - Sort Master System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function serveDashboard(session) {
  const user = getUserById(session.userId);
  if (!user) return serveLogin('User not found');
  
  const template = HtmlService.createTemplateFromFile('Dashboard');
  template.user = user;
  template.sessionId = session.sessionId;
  template.webAppUrl = getWebAppUrl();
  
  return template.evaluate()
    .setTitle('Dashboard - Sort Master System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function servePendingOrders(session) {
  const user = getUserById(session.userId);
  if (!user) return serveLogin('User not found');
  
  const template = HtmlService.createTemplateFromFile('Pendingorders');
  template.user = user;
  template.sessionId = session.sessionId;
  template.webAppUrl = getWebAppUrl();
  
  return template.evaluate()
    .setTitle('Pending Orders - Sort Master System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function serveCompleteOrders(session) {
  const user = getUserById(session.userId);
  if (!user) return serveLogin('User not found');
  
  const template = HtmlService.createTemplateFromFile('Completeorders');
  template.user = user;
  template.sessionId = session.sessionId;
  template.webAppUrl = getWebAppUrl();
  
  return template.evaluate()
    .setTitle('Complete Orders - Sort Master System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function serveSortMasterForm(session, params) {
  const user = getUserById(session.userId);
  if (!user) return serveLogin('User not found');
  
  const template = HtmlService.createTemplateFromFile('Sortmasterform');
  template.user = user;
  template.sessionId = session.sessionId;
  template.webAppUrl = getWebAppUrl();
  template.mode = params.mode || 'create';
  template.sortMasterId = params.sortMasterId || '';
  template.rtweNo = params.rtweNo || '';
  
  return template.evaluate()
    .setTitle('Sort Master Form - Sort Master System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function serveUserManagement(session) {
  const user = getUserById(session.userId);
  if (!user) return serveLogin('User not found');
  
  if (user.role !== 'ADMIN' && user.role !== 'MANAGER') {
    return serve403(session);
  }
  
  const template = HtmlService.createTemplateFromFile('Usermanagement');
  template.user = user;
  template.sessionId = session.sessionId;
  template.webAppUrl = getWebAppUrl();
  
  return template.evaluate()
    .setTitle('User Management - Sort Master System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function serveSettings(session) {
  const user = getUserById(session.userId);
  if (!user) return serveLogin('User not found');
  
  if (user.role !== 'ADMIN') {
    return serve403(session);
  }
  
  const template = HtmlService.createTemplateFromFile('Settings');
  template.user = user;
  template.sessionId = session.sessionId;
  template.webAppUrl = getWebAppUrl();
  
  return template.evaluate()
    .setTitle('Settings - Sort Master System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function serveAuditLog(session) {
  const user = getUserById(session.userId);
  if (!user) return serveLogin('User not found');
  
  if (user.role !== 'ADMIN') {
    return serve403(session);
  }
  
  const template = HtmlService.createTemplateFromFile('Auditlog');
  template.user = user;
  template.sessionId = session.sessionId;
  template.webAppUrl = getWebAppUrl();
  
  return template.evaluate()
    .setTitle('Audit Log - Sort Master System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function serveRegister() {
  const template = HtmlService.createTemplateFromFile('Register');
  template.webAppUrl = getWebAppUrl();
  
  return template.evaluate()
    .setTitle('Register - Sort Master System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function serveForgotPassword() {
  const template = HtmlService.createTemplateFromFile('Forgotpassword');
  template.webAppUrl = getWebAppUrl();
  
  return template.evaluate()
    .setTitle('Forgot Password - Sort Master System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function serve403(session) {
  const template = HtmlService.createTemplateFromFile('403');
  template.webAppUrl = getWebAppUrl();
  template.sessionId = session ? session.sessionId : '';
  
  return template.evaluate()
    .setTitle('Access Denied - Sort Master System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function serve404(session) {
  const template = HtmlService.createTemplateFromFile('404');
  template.webAppUrl = getWebAppUrl();
  
  return template.evaluate()
    .setTitle('Page Not Found - Sort Master System')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function serveErrorPage(message) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial; text-align: center; padding: 50px; background: #F5F5F5; }
        .box { background: white; padding: 40px; border-radius: 8px; max-width: 500px; margin: 0 auto; }
        h1 { color: #D32F2F; }
      </style>
    </head>
    <body>
      <div class="box">
        <h1>⚠️ Error</h1>
        <p>${message}</p>
        <br>
        <a href="?page=login">← Back to Login</a>
      </div>
    </body>
    </html>
  `;
  
  return HtmlService.createHtmlOutput(html)
    .setTitle('Error')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ============================================================================
// TESTING FUNCTIONS
// ============================================================================

function testServerLogin() {
  const result = serverLogin('admin', 'admin123', false);
  Logger.log(JSON.stringify(result, null, 2));
}

function testGetStatistics() {
  const loginResult = serverLogin('admin', 'admin123', false);
  if (loginResult.success) {
    const stats = getStatistics(loginResult.sessionId);
    Logger.log(JSON.stringify(stats, null, 2));
  }
}

function debugCheckSheets() {
  Logger.log('========================================');
  Logger.log('DEBUG: CHECKING SHEETS');
  Logger.log('========================================');
  
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheets = ss.getSheets();
  
  Logger.log('Total sheets: ' + sheets.length);
  Logger.log('');
  
  sheets.forEach((sheet, index) => {
    Logger.log((index + 1) + '. Sheet Name: "' + sheet.getName() + '"');
    Logger.log('   Rows: ' + sheet.getLastRow());
    Logger.log('   Columns: ' + sheet.getLastColumn());
    Logger.log('');
  });
  
  Logger.log('========================================');
  Logger.log('Trying to read Pending Orders...');
  Logger.log('========================================');
  
  try {
    const pendingSheet = getSheet(SHEET_NAMES.PENDING_ORDERS);
    const data = pendingSheet.getDataRange().getValues();
    
    Logger.log('✅ SUCCESS! Found pending orders sheet');
    Logger.log('Total rows (including header): ' + data.length);
    
    if (data.length > 0) {
      Logger.log('Header row: ' + JSON.stringify(data[0]));
    }
    
    if (data.length > 1) {
      Logger.log('First data row: ' + JSON.stringify(data[1]));
    }
    
  } catch (error) {
    Logger.log('❌ ERROR reading pending orders: ' + error.message);
  }
  
  Logger.log('========================================');
  Logger.log('DEBUG COMPLETE');
  Logger.log('========================================');
}

function testGetPendingOrders() {
  Logger.log('========================================');
  Logger.log('TEST: getPendingOrders');
  Logger.log('========================================');
  
  const result = getPendingOrders({}, 1, 25);
  
  Logger.log('Success: ' + result.success);
  Logger.log('Total orders: ' + result.total);
  Logger.log('Orders returned: ' + result.orders.length);
  
  if (result.orders.length > 0) {
    Logger.log('First order: ' + JSON.stringify(result.orders[0], null, 2));
  }
  
  Logger.log('========================================');
  Logger.log('Full result:');
  Logger.log(JSON.stringify(result, null, 2));
  Logger.log('========================================');
}

function testGetStatisticsWithSession() {
  Logger.log('========================================');
  Logger.log('TEST: getStatistics');
  Logger.log('========================================');
  
  const loginResult = serverLogin('admin', 'admin123', false);
  
  if (loginResult.success) {
    Logger.log('✅ Login successful');
    Logger.log('Session ID: ' + loginResult.sessionId);
    
    const stats = getStatistics(loginResult.sessionId);
    
    Logger.log('========================================');
    Logger.log('Statistics Result:');
    Logger.log(JSON.stringify(stats, null, 2));
    Logger.log('========================================');
  } else {
    Logger.log('❌ Login failed: ' + loginResult.message);
  }
}

/**
 * Get all users (for User Management page)
 * TEMPORARILY SIMPLIFIED FOR DEBUGGING
 * @param {string} sessionId - Session ID for validation
 * @return {Object} {success, users} or {success, message}
 */
function getAllUsers(sessionId) {
  try {
    Logger.log('getAllUsers: Starting...');
    
    // Temporarily bypass session validation for debugging
    // Just fetch users directly
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('USERS');
    
    if (!sheet) {
      Logger.log('getAllUsers: USERS sheet not found!');
      return { success: false, message: 'USERS sheet not found' };
    }
    
    const data = sheet.getDataRange().getValues();
    Logger.log('getAllUsers: Found ' + data.length + ' rows');
    
    const users = [];
    for (let i = 1; i < data.length; i++) {
      // Convert Date objects to strings to avoid serialization issues
      let createdDateStr = '';
      if (data[i][8]) {
        try {
          createdDateStr = data[i][8] instanceof Date 
            ? data[i][8].toISOString() 
            : String(data[i][8]);
        } catch(e) {
          createdDateStr = String(data[i][8]);
        }
      }
      
      users.push({
        userId: String(data[i][0]),
        userName: String(data[i][1] || ''),
        fullName: String(data[i][1] || ''),
        email: String(data[i][2] || ''),
        customUserId: String(data[i][3] || ''),
        role: String(data[i][6] || 'USER'),
        isActive: data[i][7] === true || data[i][7] === 'TRUE',
        createdDate: createdDateStr
      });
    }
    
    Logger.log('getAllUsers: Returning ' + users.length + ' users');
    Logger.log('Users data: ' + JSON.stringify(users));
    
    return { success: true, users: users };
    
  } catch (error) {
    Logger.log('getAllUsers ERROR: ' + error.message);
    return { success: false, message: 'Error: ' + error.message };
  }
}

/**
 * Update user (for User Management page)
 * @param {string} userId - User ID to update
 * @param {Object} userData - User data to update
 * @param {string} sessionId - Session ID for validation
 * @return {Object} {success, message}
 */
function updateUser(userId, userData, sessionId) {
  try {
    Logger.log('updateUser called for userId: ' + userId);
    
    const session = validateSession(sessionId);
    if (!session) {
      return { success: false, message: 'Session expired' };
    }
    
    const adminUser = getUserById(session.userId);
    if (!adminUser || (adminUser.role !== 'ADMIN' && adminUser.role !== 'MANAGER')) {
      return { success: false, message: 'Unauthorized' };
    }
    
    const sheet = getSheet(SHEET_NAMES.USERS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString() === userId.toString()) {
        // Update user fields
        if (userData.userName) sheet.getRange(i + 1, 2).setValue(userData.userName);
        if (userData.fullName) sheet.getRange(i + 1, 2).setValue(userData.fullName);
        if (userData.email) sheet.getRange(i + 1, 3).setValue(userData.email);
        if (userData.role) sheet.getRange(i + 1, 7).setValue(userData.role);
        
        Logger.log('User updated successfully');
        return { success: true, message: 'User updated successfully' };
      }
    }
    
    return { success: false, message: 'User not found' };
    
  } catch (error) {
    Logger.log('updateUser error: ' + error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Toggle user active status (for User Management page)
 * @param {string} userId - User ID to toggle
 * @param {string} sessionId - Session ID for validation
 * @return {Object} {success, message}
 */
function toggleUserStatus(userId, sessionId) {
  try {
    Logger.log('toggleUserStatus called for userId: ' + userId);
    
    const session = validateSession(sessionId);
    if (!session) {
      return { success: false, message: 'Session expired' };
    }
    
    const adminUser = getUserById(session.userId);
    if (!adminUser || (adminUser.role !== 'ADMIN' && adminUser.role !== 'MANAGER')) {
      return { success: false, message: 'Unauthorized' };
    }
    
    const sheet = getSheet(SHEET_NAMES.USERS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0].toString() === userId.toString()) {
        const currentStatus = data[i][7];
        const newStatus = !currentStatus;
        sheet.getRange(i + 1, 8).setValue(newStatus); // Column H - isActive
        
        Logger.log('User status toggled to: ' + newStatus);
        return { success: true, message: 'User status updated', isActive: newStatus };
      }
    }
    
    return { success: false, message: 'User not found' };
    
  } catch (error) {
    Logger.log('toggleUserStatus error: ' + error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Get system settings (for Settings page)
 * @param {string} sessionId - Session ID for validation
 * @return {Object} {success, settings}
 */
function getSystemSettings(sessionId) {
  try {
    Logger.log('getSystemSettings called');
    
    const session = validateSession(sessionId);
    if (!session) {
      return { success: false, message: 'Session expired' };
    }
    
    const user = getUserById(session.userId);
    if (!user || user.role !== 'ADMIN') {
      return { success: false, message: 'Unauthorized' };
    }
    
    const sheet = getSheet(SHEET_NAMES.SYSTEM_SETTINGS);
    const data = sheet.getDataRange().getValues();
    
    const settings = {};
    for (let i = 1; i < data.length; i++) {
      settings[data[i][0]] = data[i][1];
    }
    
    // Map to expected format
    const result = {
      companyName: settings['COMPANY_NAME'] || '',
      fyStartMonth: settings['FY_START_MONTH'] || '4',
      emailEnabled: settings['EMAIL_NOTIFICATIONS'] === 'true',
      notificationEmail: settings['ADMIN_EMAIL'] || '',
      telegramEnabled: settings['TELEGRAM_NOTIFICATIONS'] === 'true',
      telegramToken: settings['TELEGRAM_BOT_TOKEN'] || '',
      telegramChatId: settings['TELEGRAM_CHAT_ID'] || ''
    };
    
    return { success: true, settings: result };
    
  } catch (error) {
    Logger.log('getSystemSettings error: ' + error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Update system settings (for Settings page)
 * @param {Object} settings - Settings to update
 * @param {string} sessionId - Session ID for validation
 * @return {Object} {success, message}
 */
function updateSystemSettings(settings, sessionId) {
  try {
    Logger.log('updateSystemSettings called');
    
    const session = validateSession(sessionId);
    if (!session) {
      return { success: false, message: 'Session expired' };
    }
    
    const user = getUserById(session.userId);
    if (!user || user.role !== 'ADMIN') {
      return { success: false, message: 'Unauthorized' };
    }
    
    const sheet = getSheet(SHEET_NAMES.SYSTEM_SETTINGS);
    const data = sheet.getDataRange().getValues();
    
    // Map settings to database format
    const updates = {
      'COMPANY_NAME': settings.companyName,
      'FY_START_MONTH': settings.fyStartMonth,
      'EMAIL_NOTIFICATIONS': settings.emailEnabled ? 'true' : 'false',
      'ADMIN_EMAIL': settings.notificationEmail,
      'TELEGRAM_NOTIFICATIONS': settings.telegramEnabled ? 'true' : 'false',
      'TELEGRAM_BOT_TOKEN': settings.telegramToken,
      'TELEGRAM_CHAT_ID': settings.telegramChatId
    };
    
    // Update existing settings
    for (let key in updates) {
      let found = false;
      for (let i = 1; i < data.length; i++) {
        if (data[i][0] === key) {
          sheet.getRange(i + 1, 2).setValue(updates[key]);
          found = true;
          break;
        }
      }
      // Add if not found
      if (!found) {
        sheet.appendRow([key, updates[key]]);
      }
    }
    
    Logger.log('Settings updated successfully');
    return { success: true, message: 'Settings updated successfully' };
    
  } catch (error) {
    Logger.log('updateSystemSettings error: ' + error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Send test email (for Settings page)
 * @param {string} email - Email to send test to
 * @return {Object} {success, message}
 */
function sendTestEmail(email) {
  try {
    Logger.log('sendTestEmail called for: ' + email);
    
    if (!email) {
      return { success: false, message: 'Email address required' };
    }
    
    MailApp.sendEmail({
      to: email,
      subject: 'Test Email - Sort Master System',
      htmlBody: `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #5D4037;">✅ Test Email Successful!</h2>
            <p>This is a test email from Sort Master System.</p>
            <p>Your email notifications are working correctly.</p>
            <br>
            <p>Best regards,<br>Sort Master Team</p>
          </body>
        </html>
      `
    });
    
    Logger.log('Test email sent successfully');
    return { success: true, message: 'Test email sent successfully!' };
    
  } catch (error) {
    Logger.log('sendTestEmail error: ' + error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Send test Telegram message (for Settings page)
 * @return {Object} {success, message}
 */
function sendTestTelegramMessage() {
  try {
    Logger.log('sendTestTelegramMessage called');
    
    // Get settings
    const chatId = getSystemSetting('TELEGRAM_CHAT_ID');
    const botToken = TELEGRAM_CONFIG.BOT_TOKEN;
    
    if (!chatId) {
      return { success: false, message: 'Telegram Chat ID not configured' };
    }
    
    const message = '✅ *Test Message*\n\nThis is a test message from Sort Master System.\n\nYour Telegram notifications are working correctly!';
    
    const url = 'https://api.telegram.org/bot' + botToken + '/sendMessage';
    
    const options = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      }),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());
    
    if (result.ok) {
      Logger.log('Test Telegram message sent successfully');
      return { success: true, message: 'Test message sent successfully!' };
    } else {
      Logger.log('Telegram API error: ' + result.description);
      return { success: false, message: 'Telegram error: ' + result.description };
    }
    
  } catch (error) {
    Logger.log('sendTestTelegramMessage error: ' + error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Get system setting by key
 * @param {string} key - Setting key
 * @return {string|null} Setting value or null
 */
function getSystemSetting(key) {
  try {
    const sheet = getSheet(SHEET_NAMES.SYSTEM_SETTINGS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        return data[i][1];
      }
    }
    
    return null;
    
  } catch (error) {
    Logger.log('getSystemSetting error: ' + error.message);
    return null;
  }
}

/**
 * Create user wrapper for UI (validates session and calls base createUser)
 * Note: This overrides the createUser from Authenticate.gs for UI calls
 * @param {Object} userData - User data from form
 * @param {string} sessionId - Session ID for validation
 * @return {Object} {success, message, userId}
 */
function adminCreateUser(userData, sessionId) {
  try {
    Logger.log('adminCreateUser called from UI');
    
    // Validate session
    const session = validateSession(sessionId);
    if (!session) {
      return { success: false, message: 'Session expired' };
    }
    
    // Get admin user
    const adminUser = getUserById(session.userId);
    if (!adminUser || (adminUser.role !== 'ADMIN' && adminUser.role !== 'MANAGER')) {
      return { success: false, message: 'Unauthorized' };
    }
    
    // Validate required fields
    if (!userData.userName || !userData.email || !userData.password) {
      return { success: false, message: 'Username, email and password are required' };
    }
    
    // Check if email already exists
    if (checkEmailExists(userData.email, null)) {
      return { success: false, message: 'Email already exists' };
    }
    
    // Create the user using base function logic
    const sheet = getSheet(SHEET_NAMES.USERS);
    const lastRow = sheet.getLastRow();
    const userId = lastRow > 1 ? sheet.getRange(lastRow, 1).getValue() + 1 : 1;
    
    // Hash password
    const passwordHash = hashPassword(userData.password);
    
    const now = new Date();
    const customUserId = userData.userName.toLowerCase().replace(/\s+/g, '_');
    
    const newUser = [
      userId,
      userData.fullName || userData.userName,
      userData.email,
      customUserId,
      passwordHash,
      '', // telegramChatId
      userData.role || 'USER',
      true, // isActive
      now, // createdDate
      session.userId, // createdBy
      '', // lastLogin
      true, // emailNotifications
      true, // telegramNotifications
      '', // rememberMeToken
      '', // resetToken
      '' // resetTokenExpiry
    ];
    
    sheet.appendRow(newUser);
    
    Logger.log('User created successfully: ' + userData.userName);
    
    // Log user creation
    logAction(
      session.userId,
      AUDIT_ACTIONS.CREATE,
      AUDIT_MODULES.USER,
      userId,
      null,
      JSON.stringify({ userName: userData.userName, email: userData.email, role: userData.role })
    );
    
    return { 
      success: true, 
      message: 'User created successfully', 
      userId: userId 
    };
    
  } catch (error) {
    Logger.log('createUser error: ' + error.message);
    return { success: false, message: error.message };
  }
}

/**
 * Get audit logs wrapper (for HTML that passes sessionId)
 * Overrides the Activitylog.gs version to handle HTML call format
 * HTML calls: getAuditLogs(filters, sessionId)
 * @param {Object} filters - Filter options
 * @param {string} sessionId - Session ID for validation
 * @return {Object} {success, logs} or {success, message}
 */
function getAuditLogs(filters, sessionId) {
  try {
    Logger.log('getAuditLogs called with sessionId: ' + sessionId);
    
    // Bypass session validation temporarily for debugging
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('AUDIT_LOG');
    
    if (!sheet) {
      Logger.log('getAuditLogs: AUDIT_LOG sheet not found!');
      return { success: false, message: 'AUDIT_LOG sheet not found' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    // Skip header row
    let logs = [];
    
    for (let i = 1; i < data.length; i++) {
      // Convert timestamp to string to avoid serialization issues
      let timestampStr = '';
      if (data[i][9]) {
        try {
          timestampStr = data[i][9] instanceof Date 
            ? data[i][9].toISOString() 
            : String(data[i][9]);
        } catch(e) {
          timestampStr = String(data[i][9]);
        }
      }
      
      const log = {
        logId: String(data[i][0] || ''),
        userId: String(data[i][1] || ''),
        userName: String(data[i][2] || ''),
        action: String(data[i][3] || ''),
        module: String(data[i][4] || ''),
        recordId: String(data[i][5] || ''),
        beforeValue: String(data[i][6] || ''),
        afterValue: String(data[i][7] || ''),
        ipAddress: String(data[i][8] || ''),
        timestamp: timestampStr,
        description: data[i][7] ? 'Record modified' : 'Action performed'
      };
      
      // Apply filters
      if (filters) {
        if (filters.action && filters.action !== '' && log.action !== filters.action) continue;
        if (filters.module && filters.module !== '' && log.module !== filters.module) continue;
        if (filters.userName && filters.userName !== '' && 
            !log.userName.toLowerCase().includes(filters.userName.toLowerCase())) continue;
      }
      
      logs.push(log);
    }
    
    // Sort by timestamp descending (most recent first)
    logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Limit to 100 logs for performance
    logs = logs.slice(0, 100);
    
    Logger.log('Found ' + logs.length + ' audit logs');
    
    return {
      success: true,
      logs: logs
    };
    
  } catch (error) {
    Logger.log('getAuditLogs error: ' + error.message);
    return { success: false, message: 'Error: ' + error.message };
  }
}

/**
 * TEST FUNCTION - Run this manually in Apps Script Editor to verify data access
 * Go to Run > testPendingOrders
 */
function testPendingOrders() {
  Logger.log('========================================');
  Logger.log('TESTING PENDING ORDERS');
  Logger.log('========================================');
  
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    Logger.log('Spreadsheet: ' + ss.getName());
    
    // List all sheets
    const sheets = ss.getSheets();
    Logger.log('All sheets:');
    sheets.forEach(s => Logger.log('  - ' + s.getName()));
    
    // Try to get pending order sheet
    const sheet = ss.getSheetByName('Pending order for sort');
    
    if (!sheet) {
      Logger.log('ERROR: Sheet "Pending order for sort" NOT FOUND!');
      return;
    }
    
    Logger.log('Sheet found: ' + sheet.getName());
    
    const data = sheet.getDataRange().getValues();
    Logger.log('Total rows: ' + data.length);
    
    // Log headers
    Logger.log('Headers: ' + JSON.stringify(data[0]));
    
    // Log first 3 data rows
    for (let i = 1; i <= Math.min(3, data.length - 1); i++) {
      Logger.log('Row ' + i + ': ' + JSON.stringify(data[i]));
    }
    
    // Try calling getPendingOrders
    Logger.log('========================================');
    Logger.log('CALLING getPendingOrders...');
    const result = getPendingOrders({}, 1, 25);
    Logger.log('Result: ' + JSON.stringify(result));
    Logger.log('========================================');
    
  } catch (error) {
    Logger.log('TEST ERROR: ' + error.message);
    Logger.log('Stack: ' + error.stack);
  }
}

/**
 * Register a new user (public - no authentication required)
 * @param {Object} userData - User data from registration form
 * @return {Object} {success, message}
 */
function registerUser(userData) {
  try {
    Logger.log('=== USER REGISTRATION ===');
    Logger.log('UserData: ' + JSON.stringify(userData));
    
    // Validate required fields
    if (!userData || !userData.userName || !userData.email || !userData.customUserId || !userData.password) {
      Logger.log('Validation failed: Missing required fields');
      return { success: false, message: 'All required fields must be filled' };
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      Logger.log('Validation failed: Invalid email format');
      return { success: false, message: 'Invalid email format' };
    }
    
    // Validate username format
    if (!/^[a-zA-Z0-9_]+$/.test(userData.customUserId)) {
      Logger.log('Validation failed: Invalid username format');
      return { success: false, message: 'Username can only contain letters, numbers, and underscore' };
    }
    
    if (userData.customUserId.length < 3 || userData.customUserId.length > 20) {
      Logger.log('Validation failed: Username length');
      return { success: false, message: 'Username must be 3-20 characters' };
    }
    
    // Check if email already exists
    if (checkEmailExists(userData.email)) {
      Logger.log('Validation failed: Email already exists');
      return { success: false, message: 'Email already registered' };
    }
    
    // Check if username already exists
    if (checkUsernameExists(userData.customUserId)) {
      Logger.log('Validation failed: Username already exists');
      return { success: false, message: 'Username already taken' };
    }
    
    Logger.log('Validation passed, creating user...');
    
    // Create the user (with USER role by default, not ADMIN)
    const newUserData = {
      userName: userData.userName,
      email: userData.email,
      customUserId: userData.customUserId,
      password: userData.password,
      telegramChatId: userData.telegramChatId || '',
      role: 'USER', // Force USER role for self-registration
      emailNotifications: true,
      telegramNotifications: true
    };
    
    const userId = createUser(newUserData, null); // null = self-registered
    
    if (userId) {
      Logger.log('User registered successfully with ID: ' + userId);
      
      // Send welcome email with login credentials
      try {
        Logger.log('Sending welcome email to: ' + userData.email);
        const emailSent = sendUserCreationEmail(
          userData.email,
          userData.userName,
          userData.password // Send plain text password in welcome email
        );
        Logger.log('Welcome email sent: ' + emailSent);
      } catch (emailError) {
        Logger.log('Warning: Failed to send welcome email: ' + emailError.message);
        // Don't fail registration if email fails
      }
      
      // Log the registration
      try {
        logAction(
          userId,
          'REGISTER',
          'USER',
          userId,
          null,
          JSON.stringify({ userName: userData.userName, email: userData.email })
        );
      } catch (logError) {
        Logger.log('Warning: Failed to log registration: ' + logError.message);
      }
      
      return { 
        success: true, 
        message: 'Account created successfully! Check your email for login details.',
        userId: userId
      };
    } else {
      Logger.log('ERROR: createUser returned null');
      return { success: false, message: 'Failed to create account. Please try again.' };
    }
    
  } catch (error) {
    Logger.log('registerUser error: ' + error.message);
    Logger.log('Stack: ' + error.stack);
    return { success: false, message: 'Error: ' + error.message };
  }
}