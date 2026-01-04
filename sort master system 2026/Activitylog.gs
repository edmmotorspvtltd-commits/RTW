/**
 * ============================================================================
 * SORT MASTER MANAGEMENT SYSTEM 2026
 * Activity Log Module (Audit Log)
 * ============================================================================
 * 
 * Tracks all user actions in the system:
 * - Login/Logout
 * - Create/Edit/Delete operations
 * - View operations
 * - Before/After values for edits
 * 
 * @version 1.0
 * @author Sort Master System
 * @date December 25, 2025
 */

/**
 * ============================================================================
 * LOG ACTION (MAIN FUNCTION)
 * ============================================================================
 */

/**
 * Log any action to the audit log
 * @param {number} userId - User ID performing action
 * @param {string} action - Action type (LOGIN, LOGOUT, CREATE, EDIT, DELETE, VIEW)
 * @param {string} module - Module name (SORT_MASTER, USER, SETTINGS, AUTH)
 * @param {number} recordId - ID of affected record (optional)
 * @param {string} beforeValue - JSON string of before state (optional)
 * @param {string} afterValue - JSON string of after state (optional)
 * @param {string} ipAddress - User's IP address (optional)
 * @param {string} userAgent - User's browser agent (optional)
 * @return {number|null} Log ID or null on failure
 */
function logAction(userId, action, module, recordId, beforeValue, afterValue, ipAddress, userAgent) {
  try {
    const sheet = getSheet(SHEET_NAMES.AUDIT_LOG);
    
    // Get next log ID
    const lastRow = sheet.getLastRow();
    const logId = lastRow > 1 ? sheet.getRange(lastRow, 1).getValue() + 1 : 1;
    
    // Get user name
    let userName = 'System';
    if (userId) {
      const user = getUserById(userId);
      if (user) {
        userName = user.userName;
      }
    }
    
    const timestamp = new Date();
    
    const logEntry = [
      logId,
      userId || '',
      userName,
      action,
      module,
      recordId || '',
      beforeValue || '',
      afterValue || '',
      ipAddress || '',
      timestamp,
      userAgent || ''
    ];
    
    sheet.appendRow(logEntry);
    
    return logId;
    
  } catch (error) {
    Logger.log('logAction error: ' + error.message);
    return null;
  }
}

/**
 * ============================================================================
 * SPECIFIC LOG FUNCTIONS
 * ============================================================================
 */

/**
 * Log user login
 * @param {number} userId - User ID
 * @param {string} ipAddress - IP address
 * @param {string} userAgent - Browser user agent
 * @return {number|null} Log ID
 */
function logLogin(userId, ipAddress, userAgent) {
  return logAction(
    userId,
    AUDIT_ACTIONS.LOGIN,
    AUDIT_MODULES.AUTH,
    null,
    null,
    null,
    ipAddress,
    userAgent
  );
}

/**
 * Log user logout
 * @param {number} userId - User ID
 * @param {string} ipAddress - IP address
 * @return {number|null} Log ID
 */
function logLogout(userId, ipAddress) {
  return logAction(
    userId,
    AUDIT_ACTIONS.LOGOUT,
    AUDIT_MODULES.AUTH,
    null,
    null,
    null,
    ipAddress
  );
}

/**
 * Log record creation
 * @param {number} userId - User ID
 * @param {string} module - Module name
 * @param {number} recordId - Created record ID
 * @param {Object} data - Created data
 * @return {number|null} Log ID
 */
function logCreate(userId, module, recordId, data) {
  return logAction(
    userId,
    AUDIT_ACTIONS.CREATE,
    module,
    recordId,
    null,
    JSON.stringify(data)
  );
}

/**
 * Log record edit
 * @param {number} userId - User ID
 * @param {string} module - Module name
 * @param {number} recordId - Edited record ID
 * @param {Object} beforeData - Data before edit
 * @param {Object} afterData - Data after edit
 * @return {number|null} Log ID
 */
function logEdit(userId, module, recordId, beforeData, afterData) {
  return logAction(
    userId,
    AUDIT_ACTIONS.EDIT,
    module,
    recordId,
    JSON.stringify(beforeData),
    JSON.stringify(afterData)
  );
}

/**
 * Log record deletion
 * @param {number} userId - User ID
 * @param {string} module - Module name
 * @param {number} recordId - Deleted record ID
 * @param {Object} data - Deleted data
 * @return {number|null} Log ID
 */
function logDelete(userId, module, recordId, data) {
  return logAction(
    userId,
    AUDIT_ACTIONS.DELETE,
    module,
    recordId,
    JSON.stringify(data),
    null
  );
}

/**
 * Log record view
 * @param {number} userId - User ID
 * @param {string} module - Module name
 * @param {number} recordId - Viewed record ID
 * @return {number|null} Log ID
 */
function logView(userId, module, recordId) {
  return logAction(
    userId,
    AUDIT_ACTIONS.VIEW,
    module,
    recordId,
    null,
    null
  );
}

/**
 * ============================================================================
 * QUERY AUDIT LOGS
 * ============================================================================
 */

/**
 * Get audit logs with filters and pagination
 * @param {Object} filters - Filter options
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Records per page
 * @return {Object} {logs, total, page, totalPages}
 */
function getAuditLogs(filters, page, limit) {
  try {
    const sheet = getSheet(SHEET_NAMES.AUDIT_LOG);
    const data = sheet.getDataRange().getValues();
    
    // Skip header row
    let logs = [];
    
    for (let i = 1; i < data.length; i++) {
      const log = {
        logId: data[i][0],
        userId: data[i][1],
        userName: data[i][2],
        action: data[i][3],
        module: data[i][4],
        recordId: data[i][5],
        beforeValue: data[i][6],
        afterValue: data[i][7],
        ipAddress: data[i][8],
        timestamp: data[i][9],
        userAgent: data[i][10]
      };
      
      // Apply filters
      if (filters) {
        if (filters.userId && log.userId !== filters.userId) continue;
        if (filters.action && log.action !== filters.action) continue;
        if (filters.module && log.module !== filters.module) continue;
        if (filters.recordId && log.recordId !== filters.recordId) continue;
        
        if (filters.dateFrom) {
          const dateFrom = new Date(filters.dateFrom);
          if (log.timestamp < dateFrom) continue;
        }
        
        if (filters.dateTo) {
          const dateTo = new Date(filters.dateTo);
          dateTo.setHours(23, 59, 59, 999);
          if (log.timestamp > dateTo) continue;
        }
      }
      
      logs.push(log);
    }
    
    // Sort by timestamp descending (most recent first)
    logs.sort((a, b) => b.timestamp - a.timestamp);
    
    const total = logs.length;
    
    // Apply pagination
    page = page || 1;
    limit = limit || PAGINATION.DEFAULT_PAGE_SIZE;
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedLogs = logs.slice(startIndex, endIndex);
    
    const totalPages = Math.ceil(total / limit);
    
    return {
      logs: paginatedLogs,
      total: total,
      page: page,
      totalPages: totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    };
    
  } catch (error) {
    Logger.log('getAuditLogs error: ' + error.message);
    return {
      logs: [],
      total: 0,
      page: 1,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false
    };
  }
}

/**
 * Get audit log by ID
 * @param {number} logId - Log ID
 * @return {Object|null} Log object or null
 */
function getAuditLogById(logId) {
  try {
    const sheet = getSheet(SHEET_NAMES.AUDIT_LOG);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === logId) {
        return {
          logId: data[i][0],
          userId: data[i][1],
          userName: data[i][2],
          action: data[i][3],
          module: data[i][4],
          recordId: data[i][5],
          beforeValue: data[i][6],
          afterValue: data[i][7],
          ipAddress: data[i][8],
          timestamp: data[i][9],
          userAgent: data[i][10]
        };
      }
    }
    
    return null;
    
  } catch (error) {
    Logger.log('getAuditLogById error: ' + error.message);
    return null;
  }
}

/**
 * Get recent logs for a user
 * @param {number} userId - User ID
 * @param {number} limit - Number of logs to retrieve
 * @return {Array} Array of log objects
 */
function getRecentUserLogs(userId, limit) {
  const filters = { userId: userId };
  const result = getAuditLogs(filters, 1, limit || 10);
  return result.logs;
}

/**
 * Get recent logs for a module
 * @param {string} module - Module name
 * @param {number} limit - Number of logs to retrieve
 * @return {Array} Array of log objects
 */
function getRecentModuleLogs(module, limit) {
  const filters = { module: module };
  const result = getAuditLogs(filters, 1, limit || 10);
  return result.logs;
}

/**
 * Get logs for a specific record
 * @param {string} module - Module name
 * @param {number} recordId - Record ID
 * @return {Array} Array of log objects
 */
function getRecordLogs(module, recordId) {
  const filters = { module: module, recordId: recordId };
  const result = getAuditLogs(filters, 1, 1000); // Get all logs for record
  return result.logs;
}

/**
 * ============================================================================
 * DELETE AUDIT LOGS
 * ============================================================================
 */

/**
 * Delete audit log by ID (Admin only)
 * @param {number} logId - Log ID to delete
 * @param {number} userId - User ID performing deletion
 * @return {Object} {success, message}
 */
function deleteAuditLog(logId, userId) {
  try {
    // Check permission
    const permission = validatePermission(userId, 'MANAGE_SETTINGS', AUDIT_MODULES.SETTINGS);
    if (!permission.valid) {
      return {
        success: false,
        message: ERROR_MESSAGES.NO_PERMISSION
      };
    }
    
    const sheet = getSheet(SHEET_NAMES.AUDIT_LOG);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === logId) {
        // Log the deletion before deleting
        const logData = {
          logId: data[i][0],
          action: data[i][3],
          module: data[i][4],
          timestamp: data[i][9]
        };
        
        logAction(
          userId,
          'AUDIT_LOG_DELETED',
          AUDIT_MODULES.SETTINGS,
          logId,
          JSON.stringify(logData),
          null
        );
        
        // Delete the row
        sheet.deleteRow(i + 1);
        
        return {
          success: true,
          message: 'Audit log deleted successfully'
        };
      }
    }
    
    return {
      success: false,
      message: 'Audit log not found'
    };
    
  } catch (error) {
    Logger.log('deleteAuditLog error: ' + error.message);
    return {
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    };
  }
}

/**
 * Delete old audit logs (older than specified days)
 * @param {number} daysOld - Delete logs older than this many days
 * @param {number} userId - User ID performing deletion
 * @return {Object} {success, message, deletedCount}
 */
function deleteOldAuditLogs(daysOld, userId) {
  try {
    // Check permission
    const permission = validatePermission(userId, 'MANAGE_SETTINGS', AUDIT_MODULES.SETTINGS);
    if (!permission.valid) {
      return {
        success: false,
        message: ERROR_MESSAGES.NO_PERMISSION,
        deletedCount: 0
      };
    }
    
    const sheet = getSheet(SHEET_NAMES.AUDIT_LOG);
    const data = sheet.getDataRange().getValues();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const rowsToDelete = [];
    
    for (let i = 1; i < data.length; i++) {
      const timestamp = data[i][9];
      
      if (timestamp < cutoffDate) {
        rowsToDelete.push(i + 1);
      }
    }
    
    // Delete rows in reverse order
    for (let i = rowsToDelete.length - 1; i >= 0; i--) {
      sheet.deleteRow(rowsToDelete[i]);
    }
    
    // Log the bulk deletion
    logAction(
      userId,
      'AUDIT_LOGS_BULK_DELETED',
      AUDIT_MODULES.SETTINGS,
      null,
      null,
      JSON.stringify({ daysOld: daysOld, deletedCount: rowsToDelete.length })
    );
    
    return {
      success: true,
      message: 'Deleted ' + rowsToDelete.length + ' old audit logs',
      deletedCount: rowsToDelete.length
    };
    
  } catch (error) {
    Logger.log('deleteOldAuditLogs error: ' + error.message);
    return {
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR,
      deletedCount: 0
    };
  }
}

/**
 * ============================================================================
 * EXPORT AUDIT LOGS
 * ============================================================================
 */

/**
 * Export audit logs to CSV format
 * @param {Object} filters - Filter options
 * @param {string} format - Export format ('csv' or 'json')
 * @return {string} CSV or JSON string
 */
function exportAuditLogs(filters, format) {
  try {
    const result = getAuditLogs(filters, 1, 10000); // Get all matching logs
    const logs = result.logs;
    
    if (format === 'json') {
      return JSON.stringify(logs, null, 2);
    }
    
    // Default: CSV format
    let csv = 'Log ID,User ID,User Name,Action,Module,Record ID,IP Address,Timestamp,Before Value,After Value\n';
    
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      
      csv += log.logId + ',';
      csv += (log.userId || '') + ',';
      csv += '"' + (log.userName || '') + '",';
      csv += log.action + ',';
      csv += log.module + ',';
      csv += (log.recordId || '') + ',';
      csv += '"' + (log.ipAddress || '') + '",';
      csv += log.timestamp + ',';
      csv += '"' + (log.beforeValue || '').replace(/"/g, '""') + '",';
      csv += '"' + (log.afterValue || '').replace(/"/g, '""') + '"';
      csv += '\n';
    }
    
    return csv;
    
  } catch (error) {
    Logger.log('exportAuditLogs error: ' + error.message);
    return '';
  }
}

/**
 * ============================================================================
 * STATISTICS
 * ============================================================================
 */

/**
 * Get audit log statistics
 * @param {Object} filters - Filter options (optional)
 * @return {Object} Statistics object
 */
function getLogStatistics(filters) {
  try {
    const result = getAuditLogs(filters, 1, 100000);
    const logs = result.logs;
    
    const stats = {
      totalLogs: logs.length,
      byAction: {},
      byModule: {},
      byUser: {},
      todayCount: 0,
      thisWeekCount: 0,
      thisMonthCount: 0
    };
    
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      
      // Count by action
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
      
      // Count by module
      stats.byModule[log.module] = (stats.byModule[log.module] || 0) + 1;
      
      // Count by user
      const userName = log.userName || 'Unknown';
      stats.byUser[userName] = (stats.byUser[userName] || 0) + 1;
      
      // Time-based counts
      const timestamp = new Date(log.timestamp);
      
      if (timestamp >= todayStart) {
        stats.todayCount++;
      }
      
      if (timestamp >= weekStart) {
        stats.thisWeekCount++;
      }
      
      if (timestamp >= monthStart) {
        stats.thisMonthCount++;
      }
    }
    
    return stats;
    
  } catch (error) {
    Logger.log('getLogStatistics error: ' + error.message);
    return {
      totalLogs: 0,
      byAction: {},
      byModule: {},
      byUser: {},
      todayCount: 0,
      thisWeekCount: 0,
      thisMonthCount: 0
    };
  }
}

/**
 * Get activity summary for dashboard
 * @return {Object} Activity summary
 */
function getActivitySummary() {
  const stats = getLogStatistics();
  
  return {
    today: stats.todayCount,
    thisWeek: stats.thisWeekCount,
    thisMonth: stats.thisMonthCount,
    topActions: getTopItems(stats.byAction, 5),
    topUsers: getTopItems(stats.byUser, 5)
  };
}

/**
 * Get top N items from object
 * @param {Object} obj - Object with counts
 * @param {number} n - Number of top items to return
 * @return {Array} Array of {name, count} objects
 */
function getTopItems(obj, n) {
  const items = [];
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      items.push({ name: key, count: obj[key] });
    }
  }
  
  items.sort((a, b) => b.count - a.count);
  
  return items.slice(0, n);
}

/**
 * ============================================================================
 * TESTING
 * ============================================================================
 */

/**
 * Test audit log functions
 */
function testAuditLog() {
  Logger.log('========================================');
  Logger.log('AUDIT LOG TEST');
  Logger.log('========================================');
  
  // Test login log
  const loginLogId = logLogin(1, '192.168.1.1', 'Mozilla/5.0');
  Logger.log('✓ Login logged: ' + loginLogId);
  
  // Test create log
  const createLogId = logCreate(1, AUDIT_MODULES.SORT_MASTER, 1, { sortNo: 'RTWSM/25-26/001' });
  Logger.log('✓ Create logged: ' + createLogId);
  
  // Test edit log
  const editLogId = logEdit(1, AUDIT_MODULES.SORT_MASTER, 1, { status: 'Pending' }, { status: 'Complete' });
  Logger.log('✓ Edit logged: ' + editLogId);
  
  // Test query logs
  const logs = getAuditLogs({ userId: 1 }, 1, 10);
  Logger.log('✓ Retrieved ' + logs.total + ' logs for user 1');
  
  // Test statistics
  const stats = getLogStatistics();
  Logger.log('✓ Total logs: ' + stats.totalLogs);
  Logger.log('✓ Today: ' + stats.todayCount);
  
  Logger.log('========================================');
  Logger.log('AUDIT LOG TEST COMPLETE');
  Logger.log('========================================');
}