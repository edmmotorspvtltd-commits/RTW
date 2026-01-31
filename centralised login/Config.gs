/**
 * ============================================================================
 * CENTRALIZED PORTAL - CONFIGURATION
 * ============================================================================
 * Shared configuration for the portal
 */

/**
 * Master spreadsheet ID (same as RTWE Enquiry and Sort Master)
 */
const CONFIG = {
  MASTER_SPREADSHEET_ID: '1te3Mk3WeSPCObeaeqtMeICZp-Hwu6MPvk-xjzGtA4Fg'
};

/**
 * Get session data from master spreadsheet
 */
function getSessionData(sessionId) {
  if (!sessionId) return null;
  
  try {
    const ss = SpreadsheetApp.openById(CONFIG.MASTER_SPREADSHEET_ID);
    const sessionSheet = ss.getSheetByName('SESSIONS');
    if (!sessionSheet) return null;
    
    const sessions = sessionSheet.getDataRange().getValues();
    for (let i = 1; i < sessions.length; i++) {
      if (sessions[i][0] === sessionId) { // Column A - sessionId
        const expiresAt = new Date(sessions[i][3]); // Column D - expiresAt
        const isActive = sessions[i][5]; // Column F - isActive
        
        if (isActive && expiresAt > new Date()) {
          // Valid session! Get user details
          const userId = sessions[i][1]; // Column B - userId
          const user = getUserFromMasterSheet(userId);
          
          if (!user) return null;
          
          return {
            username: user.username,
            name: user.name,
            role: user.role,
            sessionId: sessionId,
            lastActivity: new Date().getTime()
          };
        }
      }
    }
  } catch (error) {
    Logger.log('getSessionData error: ' + error.toString());
  }
  
  return null;
}

/**
 * Get user from master USERS sheet
 */
function getUserFromMasterSheet(userId) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.MASTER_SPREADSHEET_ID);
    const userSheet = ss.getSheetByName('USERS');
    const users = userSheet.getDataRange().getValues();
    
    for (let i = 1; i < users.length; i++) {
      if (users[i][0] == userId) {
        return {
          username: users[i][3], // Column D - customUserId
          name: users[i][1],      // Column B - userName
          role: users[i][6]       // Column G - role
        };
      }
    }
  } catch (e) {
    Logger.log('getUserFromMasterSheet error: ' + e.toString());
  }
  return null;
}

/**
 * Login user and create session
 */
function loginUserSecure(username, password, remember) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.MASTER_SPREADSHEET_ID);
    
    // 1. Authenticate using MASTER sheet
    const userSheet = ss.getSheetByName('USERS');
    if (!userSheet) throw new Error('Master USERS sheet not found');
    
    const data = userSheet.getDataRange().getValues();
    const inputHash = hashPasswordHex(password);
    
    let authenticatedUser = null;
    
    for (let i = 1; i < data.length; i++) {
      const dbUsername = String(data[i][3]); // Column D: customUserId
      const dbPasswordHash = String(data[i][4]); // Column E: passwordHash
      const status = data[i][7]; // Column H: isActive
      
      if (dbUsername === username && dbPasswordHash === inputHash) {
        if (status !== true && status !== 'Active' && status !== 'true') {
          return { success: false, message: '❌ Account inactive. Contact administrator.' };
        }
        authenticatedUser = {
          userId: data[i][0],
          name: data[i][1],
          username: dbUsername,
          role: data[i][6],
          email: data[i][2]
        };
        break;
      }
    }
    
    if (!authenticatedUser) {
      return { success: false, message: '❌ Invalid username or password!' };
    }
    
    // 2. Create Session in SESSIONS sheet
    const sessionSheet = ss.getSheetByName('SESSIONS');
    if (!sessionSheet) throw new Error('Master SESSIONS sheet not found');
    
    const sessionId = Utilities.getUuid();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (remember ? 30 * 24 * 60 * 60 * 1000 : 15 * 60 * 1000));
    
    sessionSheet.appendRow([
      sessionId,
      authenticatedUser.userId,
      now,
      expiresAt,
      '', // IP
      true, // isActive
      remember || false
    ]);
    
    return {
      success: true,
      message: '✅ Login Successful! Welcome ' + authenticatedUser.name,
      sessionId: sessionId
    };
    
  } catch (error) {
    Logger.log('Login error: ' + error.toString());
    return { success: false, message: '❌ System Error: ' + error.message };
  }
}

/**
 * Hash password using SHA-256 (hex format)
 */
function hashPasswordHex(password) {
  const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
  return hash.map(function(byte) {
    const v = (byte < 0) ? 256 + byte : byte;
    return ("0" + v.toString(16)).slice(-2);
  }).join("");
}
