// ============================================
// AUTHENTICATION.GS - COMPLETELY FIXED
// ============================================

function loginUserSecure(username, password, remember) {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.MASTER_SPREADSHEET_ID);
    const scriptProps = PropertiesService.getScriptProperties();
    const userProps = PropertiesService.getUserProperties();
    
    // 1. Authenticate using MASTER sheet
    const userSheet = ss.getSheetByName('USERS');
    if (!userSheet) throw new Error('Master USERS sheet not found');
    
    const data = userSheet.getDataRange().getValues();
    const inputHash = hashPasswordHex(password); // Match Sort Master hashing
    
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
          role: data[i][6], // Column G: role
          email: data[i][2] // Column C: email
        };
        break;
      }
    }
    
    if (!authenticatedUser) {
      return { success: false, message: '❌ Invalid username or password!' };
    }
    
    // 2. Create Session in SESSIONS sheet (SSO Authority)
    const sessionSheet = ss.getSheetByName('SESSIONS');
    if (!sessionSheet) throw new Error('Master SESSIONS sheet not found');
    
    const sessionId = Utilities.getUuid();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + (15 * 60 * 1000)); // 15 mins default
    
    sessionSheet.appendRow([
      sessionId,
      authenticatedUser.userId,
      now,
      expiresAt,
      '', // IP
      true, // isActive
      remember || false
    ]);
    
    // 3. Local session for RTWE redirects
    const sessionData = {
      username: authenticatedUser.username,
      name: authenticatedUser.name,
      role: authenticatedUser.role,
      sessionId: sessionId,
      loginTime: now.getTime(),
      lastActivity: now.getTime()
    };
    
    userProps.setProperty('SESSION_DATA', JSON.stringify(sessionData));
    scriptProps.setProperty('SESSION_' + sessionId, JSON.stringify(sessionData));
    
    return {
      success: true,
      message: '✅ Login Successful! Welcome ' + authenticatedUser.name,
      sessionId: sessionId,
      session: sessionData
    };
    
  } catch (error) {
    Logger.log('Login error: ' + error.toString());
    return { success: false, message: '❌ System Error: ' + error.message };
  }
}

/**
 * Match Sort Master Hex Hashing
 */
function hashPasswordHex(password) {
  const hash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, password, Utilities.Charset.UTF_8);
  return hash.map(function(byte) {
    const v = (byte < 0) ? 256 + byte : byte;
    return ("0" + v.toString(16)).slice(-2);
  }).join("");
}

/**
 * Support for Login.html checkSession
 */
function checkSession(sessionId) {
  const session = getSessionData(sessionId);
  if (session) {
    return { valid: true };
  }
  return { valid: false };
}
  
  return {
    success: false,
    message: '❌ Invalid username or password!'
  };
}

function logoutUser() {
  try {
    const userProps = PropertiesService.getUserProperties();
    const sessionData = userProps.getProperty('SESSION_DATA');
    
    if (sessionData) {
      const session = JSON.parse(sessionData);
      logUserActivity(session.username, 'LOGOUT', 'User logged out');
    }
    
    userProps.deleteAllProperties();
    
    return {
      success: true,
      message: '✅ Logged out successfully!'
    };
  } catch (error) {
    return {
      success: true,
      message: '✅ Logged out!'
    };
  }
}

function isUserLoggedIn() {
  try {
    const userProps = PropertiesService.getUserProperties();
    const sessionData = userProps.getProperty('SESSION_DATA');
    
    if (!sessionData) return false;
    
    const session = JSON.parse(sessionData);
    const now = new Date().getTime();
    
    if (now - session.lastActivity > USERS_CONFIG.security.sessionTimeout * 60 * 1000) {
      userProps.deleteAllProperties();
      return false;
    }
    
    session.lastActivity = now;
    userProps.setProperty('SESSION_DATA', JSON.stringify(session));
    
    return true;
  } catch (error) {
    Logger.log('isUserLoggedIn error: ' + error);
    return false;
  }
}

function getCurrentUser() {
  try {
    const userProps = PropertiesService.getUserProperties();
    const sessionData = userProps.getProperty('SESSION_DATA');
    
    if (!sessionData) return null;
    
    const session = JSON.parse(sessionData);
    const now = new Date().getTime();
    
    if (now - session.lastActivity > USERS_CONFIG.security.sessionTimeout * 60 * 1000) {
      userProps.deleteAllProperties();
      return null;
    }
    
    return session;
  } catch (error) {
    Logger.log('getCurrentUser error: ' + error);
    return null;
  }
}

function hashPassword(password) {
  try {
    const raw = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      password
    );
    return Utilities.base64Encode(raw);
  } catch (e) {
    Logger.log('Hash error: ' + e);
    return password;
  }
}

function showLoginDialog() {
  const html = HtmlService.createHtmlOutputFromFile('Login')
    .setWidth(420)
    .setHeight(560);
  
  SpreadsheetApp.getUi().showModalDialog(html, '🔐 RTWE Login');
}

function showLoginStatus() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const formSheet = ss.getSheetByName(CONFIG.SHEETS.FORM);
    
    if (!formSheet) return;
    
    const userProps = PropertiesService.getUserProperties();
    const sessionData = userProps.getProperty('SESSION_DATA');
    
    if (!sessionData) {
      formSheet.getRange('F1').setValue('🔒 NOT LOGGED IN')
        .setBackground('#FF0000')
        .setFontColor('#FFFFFF')
        .setFontWeight('bold')
        .setFontSize(12)
        .setHorizontalAlignment('center');
    } else {
      const session = JSON.parse(sessionData);
      formSheet.getRange('F1').setValue('✅ ' + session.name)
        .setBackground('#00AA00')
        .setFontColor('#FFFFFF')
        .setFontWeight('bold')
        .setFontSize(12)
        .setHorizontalAlignment('center');
    }
  } catch (error) {
    Logger.log('showLoginStatus error: ' + error);
  }
}

// ✅ NEW FUNCTION: Refresh menu after successful login
function refreshMenuAfterLogin() {
  try {
    // Small delay to ensure session is saved
    Utilities.sleep(500);
    
    const ui = SpreadsheetApp.getUi();
    
    // Build full menu
    buildFullMenu(ui);
    
    // Enable form
    enableForm();
    
    // Show login status
    showLoginStatus();
    
    // Reset form to initial state
    resetFormToInitial();
    
    // Show success toast
    SpreadsheetApp.getActiveSpreadsheet().toast(
      'Full menu access granted! You can now use all features.',
      '✅ Login Successful',
      5
    );
    
    // Force UI refresh
    SpreadsheetApp.flush();
    
    return {
      success: true,
      message: 'Menu refreshed successfully'
    };
    
  } catch (error) {
    Logger.log('refreshMenuAfterLogin error: ' + error);
    return {
      success: false,
      message: 'Error refreshing menu: ' + error.message
    };
  }
}