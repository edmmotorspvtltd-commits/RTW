/**
 * ============================================================================
 * CENTRALIZED PORTAL - MAIN CODE
 * ============================================================================
 * Entry point for the centralized login portal
 */

/**
 * Main entry point for web app
 */
function doGet(e) {
  try {
    Logger.log('=== PORTAL doGet ===');
    const page = e.parameter.page || '';
    const sessionId = e.parameter.sessionId || e.parameter.session || '';
    
    Logger.log('Page: ' + page);
    Logger.log('SessionId: ' + sessionId);
    
    // If no session, always show login
    if (!sessionId) {
      Logger.log('No session - showing login');
      return serveLogin();
    }
    
    // Validate session
    if (!isValidSession(sessionId)) {
      Logger.log('Invalid session - showing login');
      return serveLogin('Session expired. Please login again.');
    }
    
    // Valid session - show portal
    Logger.log('Valid session - showing portal');
    return servePortal(sessionId);
    
  } catch (error) {
    Logger.log('doGet error: ' + error.toString());
    Logger.log('Error stack: ' + error.stack);
    return serveError(error.message);
  }
}

/**
 * Serve login page - SAME APPROACH AS SORT MASTER
 */
function serveLogin(message) {
  const template = HtmlService.createTemplateFromFile('Login');
  template.message = message || '';
  template.webAppUrl = getWebAppUrl();
  
  return template.evaluate()
    .setTitle('Login - RTWE Portal')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Serve the portal page
 */
function servePortal(sessionId) {
  try {
    Logger.log('=== servePortal START ===');
    Logger.log('SessionId: ' + sessionId);
    
    const session = getSessionData(sessionId);
    Logger.log('Session data: ' + JSON.stringify(session));
    
    if (!session) {
      Logger.log('No session data - redirecting to login');
      return serveLogin('Session expired');
    }
    
    Logger.log('Creating template from Portal.html');
    const template = HtmlService.createTemplateFromFile('Portal');
    template.sessionId = sessionId;
    template.userName = session.name || session.username || 'User';
    template.webAppUrl = getWebAppUrl();
    
    Logger.log('Template created - evaluating');
    const output = template.evaluate()
      .setTitle('RTWE Master Portal')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    
    Logger.log('=== servePortal END ===');
    return output;
      
  } catch (error) {
    Logger.log('servePortal error: ' + error.toString());
    Logger.log('Error stack: ' + error.stack);
    return serveError('Portal error: ' + error.message);
  }
}

/**
 * Serve error page
 */
function serveError(message) {
  const html = HtmlService.createHtmlOutput(`
    <!DOCTYPE html>
    <html>
    <head>
      <base target="_top">
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: #f5f5f5;
        }
        .error-box {
          background: white;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          text-align: center;
          max-width: 500px;
        }
        h1 { color: #d32f2f; }
        button {
          margin-top: 20px;
          padding: 12px 24px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
        }
      </style>
    </head>
    <body>
      <div class="error-box">
        <h1>⚠️ Error</h1>
        <p>${message}</p>
        <button onclick="window.location.reload()">Retry</button>
      </div>
    </body>
    </html>
  `);
  
  return html.setTitle('Error');
}

/**
 * Handle login from portal - called by Login.html
 */
function portalLogin(username, password, rememberMe) {
  try {
    Logger.log('Portal login attempt for: ' + username);
    
    // Use the centralized authentication
    const result = loginUserSecure(username, password, rememberMe);
    
    Logger.log('Login result: ' + JSON.stringify(result));
    
    return result;
    
  } catch (error) {
    Logger.log('Portal login error: ' + error.toString());
    return {
      success: false,
      message: 'Login failed: ' + error.message
    };
  }
}

/**
 * Validate session - used by Login.html for session check
 */
function serverValidateSession(sessionId) {
  try {
    if (!sessionId) return { success: false };
    const session = getSessionData(sessionId);
    return { success: session !== null };
  } catch (e) {
    return { success: false };
  }
}

/**
 * Validate session (simple check)
 */
function isValidSession(sessionId) {
  if (!sessionId) return false;
  const session = getSessionData(sessionId);
  return session !== null;
}

/**
 * Get web app URL
 */
function getWebAppUrl() {
  return ScriptApp.getService().getUrl();
}
