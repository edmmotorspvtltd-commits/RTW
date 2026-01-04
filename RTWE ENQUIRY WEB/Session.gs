// ============================================
// SESSION.GS - SESSION MANAGEMENT (FIXED)
// ============================================

/**
 * Check if user is logged in
 */
function isUserLoggedIn() {
  const userProps = PropertiesService.getUserProperties();
  const sessionData = userProps.getProperty('SESSION_DATA');
  
  if (!sessionData) return false;
  
  try {
    const session = JSON.parse(sessionData);
    const now = new Date().getTime();
    
    // Check session timeout (30 minutes)
    if (now - session.lastActivity > 30 * 60 * 1000) {
      userProps.deleteProperty('SESSION_DATA');
      return false;
    }
    
    // Update last activity
    session.lastActivity = now;
    userProps.setProperty('SESSION_DATA', JSON.stringify(session));
    
    return true;
    
  } catch (error) {
    Logger.log('Session check error: ' + error);
    userProps.deleteProperty('SESSION_DATA');
    return false;
  }
}

/**
 * Check for existing valid session (for auto-redirect on login page)
 * Returns session info if valid, null otherwise
 */
function checkExistingSession() {
  const userProps = PropertiesService.getUserProperties();
  const sessionData = userProps.getProperty('SESSION_DATA');
  
  if (!sessionData) return null;
  
  try {
    const session = JSON.parse(sessionData);
    const now = new Date().getTime();
    
    // Check session timeout (30 minutes)
    if (now - session.lastActivity > 30 * 60 * 1000) {
      userProps.deleteProperty('SESSION_DATA');
      return null;
    }
    
    // Update last activity
    session.lastActivity = now;
    userProps.setProperty('SESSION_DATA', JSON.stringify(session));
    
    // Return session info for redirect
    return {
      valid: true,
      sessionId: session.sessionId,
      userName: session.name || session.username,
      role: session.role
    };
    
  } catch (error) {
    Logger.log('checkExistingSession error: ' + error);
    userProps.deleteProperty('SESSION_DATA');
    return null;
  }
}

/**
 * Get current session data
 * @param {string} sessionId - Optional session ID for URL-based validation
 */
function getSessionData(sessionId) {
  if (!sessionId) return null;
  
  const scriptProps = PropertiesService.getScriptProperties();
  const sessionStr = scriptProps.getProperty('SESSION_' + sessionId);
  const now = new Date().getTime();
  const timeoutMs = 30 * 60 * 1000; // 30 mins
  
  // 1. Check local cache (ScriptProperties)
  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr);
      if (now - session.lastActivity < timeoutMs) {
        session.lastActivity = now; // Refresh
        scriptProps.setProperty('SESSION_' + sessionId, JSON.stringify(session));
        return session;
      }
    } catch (e) {
      Logger.log('Local session parse error: ' + e);
    }
  }
  
  // 2. Check MASTER sheet (The "One Truth" for SSO)
  try {
    const ss = SpreadsheetApp.openById(CONFIG.MASTER_SPREADSHEET_ID);
    const sessionSheet = ss.getSheetByName('SESSIONS');
    if (!sessionSheet) return null;
    
    const sessions = sessionSheet.getDataRange().getValues();
    for (let i = 1; i < sessions.length; i++) {
      if (sessions[i][0] === sessionId) { // Column A
        const expiresAt = new Date(sessions[i][3]); // Column D
        const isActive = sessions[i][5]; // Column F
        
        if (isActive && expiresAt > new Date()) {
          // Valid master session! Let's get user details to reconstruct local session
          const userId = sessions[i][1];
          const user = getUserFromMasterSheet(userId);
          
          if (!user) return null;
          
          const sessionData = {
            username: user.username,
            name: user.name,
            role: user.role,
            sessionId: sessionId,
            lastActivity: now
          };
          
          // Sync to local cache
          scriptProps.setProperty('SESSION_' + sessionId, JSON.stringify(sessionData));
          return sessionData;
        }
      }
    }
  } catch (error) {
    Logger.log('Master session validation error: ' + error);
  }
  
  return null;
}

/**
 * Helper to fetch user data from Master USERS sheet
 */
function getUserFromMasterSheet(userId) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.MASTER_SPREADSHEET_ID);
    const userSheet = ss.getSheetByName('USERS');
    const users = userSheet.getDataRange().getValues();
    
    for (let i = 1; i < users.length; i++) {
      if (users[i][0] == userId) {
        return {
          username: users[i][3], // Column D
          name: users[i][1], // Column B
          role: users[i][6]  // Column G
        };
      }
    }
  } catch (e) {
    Logger.log('getUserFromMasterSheet error: ' + e);
  }
  return null;
}

/**
 * Validate session by session ID (for URL-based routing)
 * @param {string} sessionId - The session ID from URL
 */
function isValidSession(sessionId) {
  if (!sessionId) return false;
  
  const session = getSessionData(sessionId);
  return session !== null;
}

/**
 * Update session activity
 */
function updateSessionActivity() {
  const userProps = PropertiesService.getUserProperties();
  const sessionData = userProps.getProperty('SESSION_DATA');
  
  if (!sessionData) return false;
  
  try {
    const session = JSON.parse(sessionData);
    session.lastActivity = new Date().getTime();
    userProps.setProperty('SESSION_DATA', JSON.stringify(session));
    return true;
  } catch (error) {
    Logger.log('Update session error: ' + error);
    return false;
  }
}

/**
 * Clear session
 */
function clearSession() {
  const userProps = PropertiesService.getUserProperties();
  userProps.deleteAllProperties();
}

/**
 * Server-side logout (clears session by sessionId)
 * @param {string} sessionId - The session ID from URL
 */
function serverLogout(sessionId) {
  try {
    // Clear from ScriptProperties
    if (sessionId) {
      const scriptProps = PropertiesService.getScriptProperties();
      scriptProps.deleteProperty('SESSION_' + sessionId);
    }
    
    // Also clear UserProperties
    const userProps = PropertiesService.getUserProperties();
    const sessionData = userProps.getProperty('SESSION_DATA');
    
    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        logUserActivity(session.username || 'unknown', 'LOGOUT', 'User logged out');
      } catch (e) {}
    }
    
    userProps.deleteAllProperties();
    
    return { success: true };
  } catch (error) {
    Logger.log('serverLogout error: ' + error);
    return { success: false, error: error.message };
  }
}

/**
 * Refresh session (used by menu functions)
 */
function refreshSession() {
  const userProps = PropertiesService.getUserProperties();
  const sessionData = userProps.getProperty('SESSION_DATA');
  
  if (!sessionData) {
    return false;
  }
  
  try {
    const session = JSON.parse(sessionData);
    const now = Date.now();
    
    // Check timeout (30 minutes)
    if (now - session.lastActivity > 30 * 60 * 1000) {
      userProps.deleteProperty('SESSION_DATA');
      
      SpreadsheetApp.getUi().alert(
        '⏱️ Session Expired!',
        'Please login again.',
        SpreadsheetApp.getUi().ButtonSet.OK
      );
      
      handleLogout();
      return false;
    }
    
    // Update last activity
    session.lastActivity = now;
    userProps.setProperty('SESSION_DATA', JSON.stringify(session));
    
    return true;
    
  } catch (error) {
    userProps.deleteProperty('SESSION_DATA');
    return false;
  }
}

/**
 * Check if user is an admin
 * @param {string} sessionId - The session ID
 * @returns {boolean} - True if user is admin
 */
function isUserAdmin(sessionId) {
  try {
    const session = getSessionData(sessionId);
    
    if (!session) {
      return false;
    }
    
    // Check if user has admin role
    const role = session.role || '';
    return role.toLowerCase() === 'admin' || role.toLowerCase() === 'administrator';
    
  } catch (error) {
    Logger.log('isUserAdmin error: ' + error);
    return false;
  }
}