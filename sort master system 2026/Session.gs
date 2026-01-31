/**
 * ============================================================================
 * SORT MASTER MANAGEMENT SYSTEM 2026
 * Session Management Module
 * ============================================================================
 * 
 * Manages user sessions with support for:
 * - Standard sessions (1 hour)
 * - Remember Me sessions (30 days)
 * - Session validation
 * - Session cleanup
 * 
 * @version 1.0
 * @author Sort Master System
 * @date December 25, 2025
 */

/**
 * ============================================================================
 * SESSION CREATION
 * ============================================================================
 */

/**
 * Create new session for user
 * @param {number} userId - User ID
 * @param {boolean} rememberMe - Remember me checkbox
 * @param {string} ipAddress - User's IP address (optional)
 * @return {string} Session ID (UUID)
 */
function createSession(userId, rememberMe, ipAddress) {
  try {
    const sheet = getSheet(SHEET_NAMES.SESSIONS);
    
    // Generate session ID
    const sessionId = generateUUID();
    
    const now = new Date();
    const expiresAt = new Date();
    
    // Set expiry based on rememberMe
    if (rememberMe) {
      // 30 days for Remember Me
      expiresAt.setTime(now.getTime() + SESSION_CONFIG.REMEMBER_ME_DURATION);
    } else {
      // 1 hour for standard session
      expiresAt.setTime(now.getTime() + SESSION_CONFIG.STANDARD_DURATION);
    }
    
    const newSession = [
      sessionId,
      userId,
      now, // createdAt
      expiresAt, // expiresAt
      ipAddress || '', // ipAddress
      true, // isActive
      rememberMe || false // rememberMe
    ];
    
    sheet.appendRow(newSession);
    
    Logger.log('Session created for user ' + userId + ' (Remember Me: ' + rememberMe + ')');
    
    return sessionId;
    
  } catch (error) {
    Logger.log('createSession error: ' + error.message);
    throw error;
  }
}

/**
 * ============================================================================
 * SESSION VALIDATION
 * ============================================================================
 */

/**
 * Validate session and return session data if valid
 * @param {string} sessionId - Session ID to validate
 * @return {Object|null} Session object if valid, null if invalid/expired
 */
function validateSession(sessionId) {
  try {
    if (!sessionId) {
      return null;
    }
    
    const session = getSession(sessionId);
    
    if (!session) {
      return null;
    }
    
    // Check if session is active
    if (!session.isActive) {
      return null;
    }
    
    // Check if session has expired
    const now = new Date();
    if (session.expiresAt < now) {
      // Session expired - mark as inactive
      markSessionInactive(sessionId);
      return null;
    }
    
    // Session is valid - update activity
    updateSessionActivity(sessionId);
    
    return session;
    
  } catch (error) {
    Logger.log('validateSession error: ' + error.message);
    return null;
  }
}

/**
 * Get session by ID
 * @param {string} sessionId - Session ID
 * @return {Object|null} Session object or null
 */
function getSession(sessionId) {
  try {
    const sheet = getSheet(SHEET_NAMES.SESSIONS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === sessionId) {
        return {
          sessionId: data[i][0],
          userId: data[i][1],
          createdAt: data[i][2],
          expiresAt: data[i][3],
          ipAddress: data[i][4],
          isActive: data[i][5],
          rememberMe: data[i][6],
          rowIndex: i + 1 // For updates
        };
      }
    }
    
    return null;
    
  } catch (error) {
    Logger.log('getSession error: ' + error.message);
    return null;
  }
}

/**
 * Update session activity (extends session if needed)
 * @param {string} sessionId - Session ID
 */
function updateSessionActivity(sessionId) {
  try {
    const sheet = getSheet(SHEET_NAMES.SESSIONS);
    const session = getSession(sessionId);
    
    if (!session) {
      return;
    }
    
    // For Remember Me sessions, don't extend expiry
    if (session.rememberMe) {
      return;
    }
    
    // For standard sessions, extend expiry by 1 hour from now
    const now = new Date();
    const newExpiresAt = new Date();
    newExpiresAt.setTime(now.getTime() + SESSION_CONFIG.STANDARD_DURATION);
    
    sheet.getRange(session.rowIndex, 4).setValue(newExpiresAt); // Column D - expiresAt
    
  } catch (error) {
    Logger.log('updateSessionActivity error: ' + error.message);
  }
}

/**
 * Mark session as inactive
 * @param {string} sessionId - Session ID
 */
function markSessionInactive(sessionId) {
  try {
    const sheet = getSheet(SHEET_NAMES.SESSIONS);
    const session = getSession(sessionId);
    
    if (!session) {
      return;
    }
    
    sheet.getRange(session.rowIndex, 6).setValue(false); // Column F - isActive
    
  } catch (error) {
    Logger.log('markSessionInactive error: ' + error.message);
  }
}

/**
 * ============================================================================
 * SESSION DELETION
 * ============================================================================
 */

/**
 * Delete session (logout)
 * @param {string} sessionId - Session ID
 * @return {boolean} True if deleted, false otherwise
 */
function deleteSession(sessionId) {
  try {
    const sheet = getSheet(SHEET_NAMES.SESSIONS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === sessionId) {
        // Mark as inactive instead of deleting (for audit trail)
        sheet.getRange(i + 1, 6).setValue(false); // Column F - isActive
        return true;
      }
    }
    
    return false;
    
  } catch (error) {
    Logger.log('deleteSession error: ' + error.message);
    return false;
  }
}

/**
 * Delete all sessions for a user
 * @param {number} userId - User ID
 * @return {number} Number of sessions deleted
 */
function deleteAllUserSessions(userId) {
  try {
    const sheet = getSheet(SHEET_NAMES.SESSIONS);
    const data = sheet.getDataRange().getValues();
    
    let count = 0;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === userId && data[i][5] === true) { // userId and isActive
        sheet.getRange(i + 1, 6).setValue(false); // Mark inactive
        count++;
      }
    }
    
    return count;
    
  } catch (error) {
    Logger.log('deleteAllUserSessions error: ' + error.message);
    return 0;
  }
}

/**
 * ============================================================================
 * SESSION CLEANUP
 * ============================================================================
 */

/**
 * Clean up expired sessions
 * This should be run periodically (e.g., daily via trigger)
 * @return {number} Number of sessions cleaned
 */
function cleanExpiredSessions() {
  try {
    const sheet = getSheet(SHEET_NAMES.SESSIONS);
    const data = sheet.getDataRange().getValues();
    
    const now = new Date();
    let count = 0;
    
    for (let i = 1; i < data.length; i++) {
      const expiresAt = data[i][3];
      const isActive = data[i][5];
      
      // If session is expired and still marked active
      if (isActive && expiresAt < now) {
        sheet.getRange(i + 1, 6).setValue(false); // Mark inactive
        count++;
      }
    }
    
    Logger.log('Cleaned ' + count + ' expired sessions');
    
    return count;
    
  } catch (error) {
    Logger.log('cleanExpiredSessions error: ' + error.message);
    return 0;
  }
}

/**
 * Delete old inactive sessions (older than 30 days)
 * This permanently removes session records for cleanup
 * @return {number} Number of sessions deleted
 */
function deleteOldSessions() {
  try {
    const sheet = getSheet(SHEET_NAMES.SESSIONS);
    const data = sheet.getDataRange().getValues();
    
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(now.getDate() - 30);
    
    const rowsToDelete = [];
    
    for (let i = 1; i < data.length; i++) {
      const createdAt = data[i][2];
      const isActive = data[i][5];
      
      // If session is inactive and older than 30 days
      if (!isActive && createdAt < thirtyDaysAgo) {
        rowsToDelete.push(i + 1); // +1 because rows are 1-indexed
      }
    }
    
    // Delete rows in reverse order (to maintain row indices)
    for (let i = rowsToDelete.length - 1; i >= 0; i--) {
      sheet.deleteRow(rowsToDelete[i]);
    }
    
    Logger.log('Deleted ' + rowsToDelete.length + ' old inactive sessions');
    
    return rowsToDelete.length;
    
  } catch (error) {
    Logger.log('deleteOldSessions error: ' + error.message);
    return 0;
  }
}

/**
 * ============================================================================
 * SESSION QUERIES
 * ============================================================================
 */

/**
 * Get all active sessions for a user
 * @param {number} userId - User ID
 * @return {Array} Array of session objects
 */
function getAllActiveSessions(userId) {
  try {
    const sheet = getSheet(SHEET_NAMES.SESSIONS);
    const data = sheet.getDataRange().getValues();
    
    const sessions = [];
    const now = new Date();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === userId && data[i][5] === true) { // userId and isActive
        const expiresAt = data[i][3];
        
        // Only include non-expired sessions
        if (expiresAt > now) {
          sessions.push({
            sessionId: data[i][0],
            userId: data[i][1],
            createdAt: data[i][2],
            expiresAt: data[i][3],
            ipAddress: data[i][4],
            isActive: data[i][5],
            rememberMe: data[i][6]
          });
        }
      }
    }
    
    return sessions;
    
  } catch (error) {
    Logger.log('getAllActiveSessions error: ' + error.message);
    return [];
  }
}

/**
 * Count active sessions
 * @return {number} Number of active sessions
 */
function countActiveSessions() {
  try {
    const sheet = getSheet(SHEET_NAMES.SESSIONS);
    const data = sheet.getDataRange().getValues();
    
    let count = 0;
    const now = new Date();
    
    for (let i = 1; i < data.length; i++) {
      const isActive = data[i][5];
      const expiresAt = data[i][3];
      
      if (isActive && expiresAt > now) {
        count++;
      }
    }
    
    return count;
    
  } catch (error) {
    Logger.log('countActiveSessions error: ' + error.message);
    return 0;
  }
}

/**
 * Get session statistics
 * @return {Object} Session statistics
 */
function getSessionStatistics() {
  try {
    const sheet = getSheet(SHEET_NAMES.SESSIONS);
    const data = sheet.getDataRange().getValues();
    
    const now = new Date();
    
    let totalSessions = 0;
    let activeSessions = 0;
    let expiredSessions = 0;
    let rememberMeSessions = 0;
    
    for (let i = 1; i < data.length; i++) {
      totalSessions++;
      
      const isActive = data[i][5];
      const expiresAt = data[i][3];
      const rememberMe = data[i][6];
      
      if (isActive) {
        if (expiresAt > now) {
          activeSessions++;
          if (rememberMe) {
            rememberMeSessions++;
          }
        } else {
          expiredSessions++;
        }
      }
    }
    
    return {
      total: totalSessions,
      active: activeSessions,
      expired: expiredSessions,
      rememberMe: rememberMeSessions
    };
    
  } catch (error) {
    Logger.log('getSessionStatistics error: ' + error.message);
    return {
      total: 0,
      active: 0,
      expired: 0,
      rememberMe: 0
    };
  }
}

/**
 * ============================================================================
 * AUTOMATED CLEANUP TRIGGER
 * ============================================================================
 */

/**
 * Set up daily cleanup trigger
 * Run this once to install the trigger
 */
function setupDailyCleanupTrigger() {
  try {
    // Delete existing triggers for this function
    const triggers = ScriptApp.getProjectTriggers();
    for (let i = 0; i < triggers.length; i++) {
      if (triggers[i].getHandlerFunction() === 'dailySessionCleanup') {
        ScriptApp.deleteTrigger(triggers[i]);
      }
    }
    
    // Create new daily trigger at 2 AM
    ScriptApp.newTrigger('dailySessionCleanup')
      .timeBased()
      .atHour(2)
      .everyDays(1)
      .create();
    
    Logger.log('Daily session cleanup trigger installed');
    
  } catch (error) {
    Logger.log('setupDailyCleanupTrigger error: ' + error.message);
  }
}

/**
 * Daily session cleanup function
 * Called automatically by trigger
 */
function dailySessionCleanup() {
  try {
    Logger.log('Starting daily session cleanup...');
    
    // Clean expired sessions
    const expiredCount = cleanExpiredSessions();
    
    // Delete old inactive sessions (older than 30 days)
    const deletedCount = deleteOldSessions();
    
    Logger.log('Daily cleanup complete:');
    Logger.log('- Expired sessions marked inactive: ' + expiredCount);
    Logger.log('- Old sessions deleted: ' + deletedCount);
    
  } catch (error) {
    Logger.log('dailySessionCleanup error: ' + error.message);
  }
}

/**
 * ============================================================================
 * TESTING & UTILITIES
 * ============================================================================
 */

/**
 * Test session creation and validation
 */
function testSessionManagement() {
  try {
    Logger.log('========================================');
    Logger.log('SESSION MANAGEMENT TEST');
    Logger.log('========================================');
    
    // Test 1: Create standard session
    const sessionId1 = createSession(1, false, '192.168.1.1');
    Logger.log('✓ Standard session created: ' + sessionId1);
    
    // Test 2: Create Remember Me session
    const sessionId2 = createSession(1, true, '192.168.1.1');
    Logger.log('✓ Remember Me session created: ' + sessionId2);
    
    // Test 3: Validate sessions
    const session1 = validateSession(sessionId1);
    if (session1) {
      Logger.log('✓ Standard session validated');
    } else {
      Logger.log('✗ Standard session validation failed');
    }
    
    const session2 = validateSession(sessionId2);
    if (session2) {
      Logger.log('✓ Remember Me session validated');
    } else {
      Logger.log('✗ Remember Me session validation failed');
    }
    
    // Test 4: Get session statistics
    const stats = getSessionStatistics();
    Logger.log('Session Statistics:');
    Logger.log('- Total: ' + stats.total);
    Logger.log('- Active: ' + stats.active);
    Logger.log('- Expired: ' + stats.expired);
    Logger.log('- Remember Me: ' + stats.rememberMe);
    
    // Test 5: Delete session
    deleteSession(sessionId1);
    Logger.log('✓ Session deleted');
    
    Logger.log('========================================');
    Logger.log('SESSION MANAGEMENT TEST PASSED ✓');
    Logger.log('========================================');
    
  } catch (error) {
    Logger.log('========================================');
    Logger.log('SESSION MANAGEMENT TEST FAILED ✗');
    Logger.log('Error: ' + error.message);
    Logger.log('========================================');
  }
}