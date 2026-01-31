/**
 * ============================================================================
 * RTWE SALE ORDER SYSTEM - SESSION.GS
 * Session Management (Same pattern as RTWE Enquiry)
 * ============================================================================
 */

// ============================================================================
// SESSION FUNCTIONS
// ============================================================================

/**
 * Get session data by sessionId
 */
function getSessionData(sessionId) {
  Logger.log('getSessionData called with: ' + sessionId);
  
  if (!sessionId) {
    Logger.log('getSessionData: No sessionId provided');
    return null;
  }
  
  const scriptProps = PropertiesService.getScriptProperties();
  const sessionKey = 'SESSION_' + sessionId;
  const sessionStr = scriptProps.getProperty(sessionKey);
  
  Logger.log('getSessionData: Looking for key: ' + sessionKey);
  Logger.log('getSessionData: Found session string: ' + (sessionStr ? 'YES' : 'NO'));
  
  const now = new Date().getTime();
  const timeoutMs = 30 * 60 * 1000; // 30 minutes
  
  if (sessionStr) {
    try {
      const session = JSON.parse(sessionStr);
      Logger.log('getSessionData: Session parsed, lastActivity: ' + session.lastActivity);
      
      if (now - session.lastActivity < timeoutMs) {
        // Refresh session
        session.lastActivity = now;
        scriptProps.setProperty(sessionKey, JSON.stringify(session));
        Logger.log('getSessionData: Session valid, returning user: ' + session.name);
        return session;
      } else {
        // Session expired
        Logger.log('getSessionData: Session expired');
        scriptProps.deleteProperty(sessionKey);
      }
    } catch (e) {
      Logger.log('getSessionData: Parse error: ' + e);
    }
  } else {
    Logger.log('getSessionData: Session NOT FOUND in ScriptProperties');
  }
  
  return null;
}

/**
 * Check if session is valid
 */
function isValidSession(sessionId) {
  if (!sessionId) return false;
  return getSessionData(sessionId) !== null;
}

/**
 * Create a new session
 */
function createSession(user) {
  const sessionId = Utilities.getUuid();
  const now = new Date().getTime();
  
  const sessionData = {
    username: user.email || user.username,
    name: user.full_name || user.name || 'User',
    role: user.role || 'User',
    sessionId: sessionId,
    lastActivity: now
  };
  
  // Store in ScriptProperties
  const scriptProps = PropertiesService.getScriptProperties();
  scriptProps.setProperty('SESSION_' + sessionId, JSON.stringify(sessionData));
  
  // Log activity
  logUserActivity(sessionData.username, sessionData.name, 'LOGIN', 'Secure login successful');
  
  return sessionId;
}

/**
 * Logout - clear session
 */
function serverLogout(sessionId) {
  try {
    if (sessionId) {
      const scriptProps = PropertiesService.getScriptProperties();
      const sessionStr = scriptProps.getProperty('SESSION_' + sessionId);
      
      if (sessionStr) {
        try {
          const session = JSON.parse(sessionStr);
          logUserActivity(session.username, session.name, 'LOGOUT', 'User logged out');
        } catch (e) {}
      }
      
      scriptProps.deleteProperty('SESSION_' + sessionId);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// LOGIN FUNCTIONS
// ============================================================================

/**
 * Server login - called from Login.html
 */
function serverLogin(email, password) {
  try {
    Logger.log('serverLogin: ' + email);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const userSheet = ss.getSheetByName('Users');
    
    if (!userSheet) {
      return { success: false, message: 'Users sheet not found. Run Setup first.' };
    }
    
    if (userSheet.getLastRow() < 2) {
      return { success: false, message: 'No users found. Run Setup first.' };
    }
    
    const users = userSheet.getDataRange().getValues();
    const headers = users[0];
    
    // Find column indices
    const emailIndex = headers.indexOf('email');
    const passwordIndex = headers.indexOf('password');
    const nameIndex = headers.indexOf('full_name');
    const roleIndex = headers.indexOf('role');
    const statusIndex = headers.indexOf('status');
    
    for (let i = 1; i < users.length; i++) {
      if (users[i][emailIndex] === email && users[i][passwordIndex] === password) {
        // Check if user is active
        if (statusIndex >= 0 && users[i][statusIndex] === 'Inactive') {
          return { success: false, message: 'Account is inactive. Contact admin.' };
        }
        
        const user = {
          email: users[i][emailIndex],
          full_name: users[i][nameIndex] || 'User',
          role: users[i][roleIndex] || 'User'
        };
        
        // Create session
        const sessionId = createSession(user);
        
        Logger.log('Login successful, sessionId: ' + sessionId);
        
        return {
          success: true,
          sessionId: sessionId,
          user: user
        };
      }
    }
    
    return { success: false, message: 'Invalid email or password' };
    
  } catch (error) {
    Logger.log('serverLogin error: ' + error);
    return { success: false, message: error.message };
  }
}

/**
 * Test login for development
 */
function serverTestLogin() {
  return serverLogin('admin@rtwe.com', 'Admin@123');
}

// ============================================================================
// ACTIVITY LOGGING
// ============================================================================

/**
 * Log user activity (same as RTWE Enquiry)
 */
function logUserActivity(username, name, action, details) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('USER_ACTIVITY_LOG');
    
    // Create sheet if not exists
    if (!sheet) {
      sheet = ss.insertSheet('USER_ACTIVITY_LOG');
      sheet.appendRow(['Date', 'Time', 'Username', 'Name', 'Action', 'Details']);
      sheet.getRange(1, 1, 1, 6).setBackground('#6B4423').setFontColor('white').setFontWeight('bold');
    }
    
    const now = new Date();
    const date = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy');
    const time = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm:ss');
    
    sheet.appendRow([date, time, username, name, action, details]);
    
  } catch (error) {
    Logger.log('logUserActivity error: ' + error);
  }
}
