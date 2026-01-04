/**
 * RTWE Sales Order Management System
 * Authentication Module
 * 
 * @fileoverview User authentication, session management, and authorization
 * @author Professional Web App Developer
 * @version 1.0.0
 */

// ============================================================================
// AUTHENTICATION CONSTANTS
// ============================================================================

const AUTH_CONFIG = {
  SESSION_TIMEOUT_MINUTES: 480, // 8 hours
  PASSWORD_MIN_LENGTH: 8,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION_MINUTES: 30,
  PASSWORD_SALT: 'RTWE_SECURE_SALT_2025_#@!',
  TOKEN_LENGTH: 64
};

// ============================================================================
// SERVER-SIDE LOGIN/LOGOUT (Called from Client)
// ============================================================================

/**
 * Server-side login handler
 * Called from Login.html via google.script.run
 * @param {string} email - User email
 * @param {string} password - User password
 * @return {object} Login result with sessionId
 */
function serverLogin(email, password) {
  try {
    Logger.log('serverLogin called with email: ' + email);
    
    // Authenticate user
    const authResult = authenticateUser(email, password);
    
    Logger.log('authenticateUser result: ' + JSON.stringify(authResult));
    
    if (!authResult.success) {
      return {
        success: false,
        message: authResult.error || 'Authentication failed'
      };
    }
    
    // Authentication successful - token is the sessionId
    const sessionId = authResult.token;
    
    Logger.log('Login successful - sessionId: ' + sessionId);
    Logger.log('User info: ' + JSON.stringify(authResult.user));
    
    return {
      success: true,
      message: 'Login successful',
      sessionId: sessionId,
      user: {
        user_id: authResult.user.user_id,
        email: authResult.user.email,
        full_name: authResult.user.full_name,
        role: authResult.user.role,
        telegram_chat_id: authResult.user.telegram_chat_id
      }
    };
    
  } catch (error) {
    Logger.log('serverLogin error: ' + error.stack);
    return {
      success: false,
      message: 'Login failed. Please try again. Error: ' + error.message
    };
  }
}

/**
 * Get session data from session token
 * Called from Code.gs when validating sessions
 * @param {string} sessionId - Session token/ID
 * @return {object|null} Session data or null
 */
function getSessionData(sessionId) {
  try {
    Logger.log('getSessionData called with sessionId: ' + sessionId);
    
    if (!sessionId) {
      Logger.log('getSessionData: No sessionId provided');
      return null;
    }
    
    // Validate session
    if (!isValidSession(sessionId)) {
      Logger.log('getSessionData: Session invalid or expired');
      return null;
    }
    
    // Get user from session
    const user = getUserFromToken(sessionId);
    
    if (!user) {
      Logger.log('getSessionData: No user found for session');
      return null;
    }
    
    Logger.log('getSessionData: User found - ' + user.full_name);
    
    // Update session activity
    updateSessionActivity(sessionId);
    
    // Return session data
    return {
      sessionId: sessionId,
      user_id: user.user_id,
      email: user.email,
      name: user.full_name,
      username: user.full_name,
      full_name: user.full_name,
      role: user.role,
      telegram_chat_id: user.telegram_chat_id
    };
    
  } catch (error) {
    Logger.log('getSessionData error: ' + error.stack);
    return null;
  }
}

/**
 * Server-side logout handler
 * Called from Code.gs when user logs out
 * @param {string} sessionId - Session token/ID to destroy
 */
function serverLogout(sessionId) {
  try {
    Logger.log('serverLogout called with sessionId: ' + sessionId);
    
    if (!sessionId) {
      Logger.log('serverLogout: No sessionId provided');
      return;
    }
    
    // Get user info before destroying session (for audit log)
    const user = getUserFromToken(sessionId);
    
    // Destroy the session
    destroySession(sessionId);
    
    // Log logout
    if (user) {
      logAuditTrail(user.user_id, 'LOGOUT', {
        email: user.email
      });
    }
    
    Logger.log('serverLogout: Session destroyed successfully');
    
  } catch (error) {
    Logger.log('serverLogout error: ' + error.stack);
  }
}

// ============================================================================
// USER AUTHENTICATION
// ============================================================================

/**
 * Authenticates user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @return {object} Authentication result with token
 */
function authenticateUser(email, password) {
  try {
    // Validate input
    if (!email || !password) {
      return {
        success: false,
        error: 'Email and password are required'
      };
    }
    
    // Check if user exists
    const user = getUserByEmail(email);
    
    if (!user) {
      // Log failed attempt
      logAuditTrail(null, 'LOGIN_FAILED', {
        email: email,
        reason: 'User not found'
      });
      
      return {
        success: false,
        error: 'Invalid email or password'
      };
    }
    
    // Check if account is active
    if (user.status !== 'Active') {
      logAuditTrail(user.user_id, 'LOGIN_FAILED', {
        email: email,
        reason: 'Account inactive'
      });
      
      return {
        success: false,
        error: 'Account is inactive. Please contact administrator.'
      };
    }
    
    // Check if account is locked
    if (isAccountLocked(user.user_id)) {
      return {
        success: false,
        error: 'Account temporarily locked due to multiple failed login attempts. Please try again later.'
      };
    }
    
    // Verify password
    const passwordHash = hashPassword(password);
    
    if (passwordHash !== user.password_hash) {
      // Increment failed attempts
      incrementFailedLoginAttempts(user.user_id);
      
      logAuditTrail(user.user_id, 'LOGIN_FAILED', {
        email: email,
        reason: 'Invalid password'
      });
      
      const remainingAttempts = AUTH_CONFIG.MAX_LOGIN_ATTEMPTS - getFailedLoginAttempts(user.user_id);
      
      return {
        success: false,
        error: `Invalid email or password. ${remainingAttempts} attempt(s) remaining.`
      };
    }
    
    // Reset failed attempts on successful login
    resetFailedLoginAttempts(user.user_id);
    
    // Create session token
    const token = createSessionToken(user.user_id);
    
    // Update last login time
    updateLastLogin(user.user_id);
    
    // Log successful login
    logAuditTrail(user.user_id, 'LOGIN_SUCCESS', {
      email: email
    });
    
    return {
      success: true,
      token: token,
      user: {
        user_id: user.user_id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        telegram_chat_id: user.telegram_chat_id
      }
    };
    
  } catch (error) {
    Logger.log('authenticateUser error: ' + error.stack);
    return {
      success: false,
      error: 'Authentication failed. Please try again.'
    };
  }
}

/**
 * Creates a new user account
 * @param {object} userData - User data
 * @param {object} createdByUser - User creating the account (optional, for admin creation)
 * @return {object} Result
 */
function createNewUser(userData, createdByUser) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Users');
    
    // Validate input
    if (!userData.email || !userData.password || !userData.full_name) {
      return {
        success: false,
        error: 'Email, password, and full name are required'
      };
    }
    
    // Validate email format
    if (!isValidEmail(userData.email)) {
      return {
        success: false,
        error: 'Invalid email format'
      };
    }
    
    // Validate password strength
    const passwordValidation = validatePassword(userData.password);
    if (!passwordValidation.valid) {
      return {
        success: false,
        error: passwordValidation.error
      };
    }
    
    // Check if user already exists
    if (getUserByEmail(userData.email)) {
      return {
        success: false,
        error: 'Email already registered'
      };
    }
    
    // Generate user ID
    const userId = generateUserId();
    
    // Hash password
    const passwordHash = hashPassword(userData.password);
    
    // Determine role (default to User unless created by admin)
    const role = (createdByUser && createdByUser.role === 'Admin' && userData.role) ? 
                 userData.role : 'User';
    
    const timestamp = new Date();
    
    // Insert user record
    const userRow = [
      userId,                              // user_id
      userData.email,                      // email
      passwordHash,                        // password_hash
      userData.full_name,                  // full_name
      role,                                // role
      userData.telegram_chat_id || '',     // telegram_chat_id
      userData.phone || '',                // phone
      'Active',                            // status
      '',                                  // last_login
      timestamp,                           // created_at
      timestamp,                           // updated_at
      createdByUser ? createdByUser.user_id : 'SELF'  // created_by
    ];
    
    sheet.appendRow(userRow);
    
    // Log audit trail
    logAuditTrail(
      createdByUser ? createdByUser.user_id : userId,
      'USER_CREATED',
      {
        new_user_id: userId,
        email: userData.email,
        role: role
      }
    );
    
    return {
      success: true,
      message: 'User account created successfully',
      user_id: userId
    };
    
  } catch (error) {
    Logger.log('createNewUser error: ' + error.stack);
    return {
      success: false,
      error: 'Failed to create user account: ' + error.message
    };
  }
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

/**
 * Creates a session token for user
 * @param {string} userId - User ID
 * @return {string} Session token
 */
function createSessionToken(userId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Session_Tokens');
  
  // Generate random token
  const token = generateRandomToken(AUTH_CONFIG.TOKEN_LENGTH);
  
  // Set expiration time
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + AUTH_CONFIG.SESSION_TIMEOUT_MINUTES);
  
  const timestamp = new Date();
  
  // Store session
  const sessionRow = [
    token,           // token
    userId,          // user_id
    expiresAt,       // expires_at
    timestamp,       // created_at
    timestamp,       // last_used
    '',              // ip_address (not available in Apps Script)
    ''               // user_agent (not available in Apps Script)
  ];
  
  sheet.appendRow(sessionRow);
  
  Logger.log('Session token created: ' + token + ' for user: ' + userId);
  
  return token;
}

/**
 * Validates session token
 * @param {string} token - Session token
 * @return {boolean} Is valid
 */
function isValidSession(token) {
  if (!token) {
    Logger.log('isValidSession: No token provided');
    return false;
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Session_Tokens');
  const data = sheet.getDataRange().getValues();
  
  const now = new Date();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === token) {
      const expiresAt = new Date(data[i][2]);
      
      if (expiresAt > now) {
        Logger.log('isValidSession: Valid session found');
        return true;
      } else {
        Logger.log('isValidSession: Session expired');
      }
    }
  }
  
  Logger.log('isValidSession: Session not found');
  return false;
}

/**
 * Gets user from session token
 * @param {string} token - Session token
 * @return {object|null} User object or null
 */
function getUserFromToken(token) {
  if (!token) return null;
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sessionSheet = ss.getSheetByName('Session_Tokens');
  const sessionData = sessionSheet.getDataRange().getValues();
  
  const now = new Date();
  
  for (let i = 1; i < sessionData.length; i++) {
    if (sessionData[i][0] === token) {
      const expiresAt = new Date(sessionData[i][2]);
      
      if (expiresAt > now) {
        const userId = sessionData[i][1];
        return getUserById(userId);
      }
    }
  }
  
  return null;
}

/**
 * Updates session last used time
 * @param {string} token - Session token
 */
function updateSessionActivity(token) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Session_Tokens');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === token) {
      sheet.getRange(i + 1, 5).setValue(new Date()); // last_used column
      break;
    }
  }
}

/**
 * Destroys session
 * @param {string} token - Session token
 */
function destroySession(token) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Session_Tokens');
  const data = sheet.getDataRange().getValues();
  
  for (let i = data.length - 1; i > 0; i--) {
    if (data[i][0] === token) {
      sheet.deleteRow(i + 1);
      Logger.log('Session destroyed: ' + token);
      break;
    }
  }
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * Gets user by email
 * @param {string} email - User email
 * @return {object|null} User object or null
 */
function getUserByEmail(email) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === email) { // email column
      return arrayToUserObject(data[i], headers);
    }
  }
  
  return null;
}

/**
 * Gets user by ID
 * @param {string} userId - User ID
 * @return {object|null} User object or null
 */
function getUserById(userId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) { // user_id column
      return arrayToUserObject(data[i], headers);
    }
  }
  
  return null;
}

/**
 * Gets all users
 * @return {Array} Array of user objects
 */
function getAllUsers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const users = [];
  
  for (let i = 1; i < data.length; i++) {
    const user = arrayToUserObject(data[i], headers);
    // Don't include password hash
    delete user.password_hash;
    users.push(user);
  }
  
  return {
    success: true,
    users: users
  };
}

/**
 * Updates user information
 * @param {object} userData - User data to update
 * @param {object} updatingUser - User performing the update
 * @return {object} Result
 */
function updateUser(userData, updatingUser) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Users');
    const data = sheet.getDataRange().getValues();
    
    // Find user row
    let userRow = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userData.user_id) {
        userRow = i + 1;
        break;
      }
    }
    
    if (userRow === -1) {
      return {
        success: false,
        error: 'User not found'
      };
    }
    
    // Update fields
    const timestamp = new Date();
    
    if (userData.full_name) {
      sheet.getRange(userRow, 4).setValue(userData.full_name);
    }
    
    if (userData.role && updatingUser.role === 'Admin') {
      sheet.getRange(userRow, 5).setValue(userData.role);
    }
    
    if (userData.telegram_chat_id !== undefined) {
      sheet.getRange(userRow, 6).setValue(userData.telegram_chat_id);
    }
    
    if (userData.phone !== undefined) {
      sheet.getRange(userRow, 7).setValue(userData.phone);
    }
    
    if (userData.status && updatingUser.role === 'Admin') {
      sheet.getRange(userRow, 8).setValue(userData.status);
    }
    
    // Update timestamp
    sheet.getRange(userRow, 11).setValue(timestamp);
    
    // Log audit trail
    logAuditTrail(updatingUser.user_id, 'USER_UPDATED', {
      target_user_id: userData.user_id,
      changes: userData
    });
    
    return {
      success: true,
      message: 'User updated successfully'
    };
    
  } catch (error) {
    Logger.log('updateUser error: ' + error.stack);
    return {
      success: false,
      error: 'Failed to update user: ' + error.message
    };
  }
}

/**
 * Deletes user
 * @param {string} userId - User ID to delete
 * @param {object} deletingUser - User performing the deletion
 * @return {object} Result
 */
function deleteUser(userId, deletingUser) {
  try {
    if (deletingUser.role !== 'Admin') {
      return {
        success: false,
        error: 'Only administrators can delete users'
      };
    }
    
    // Don't allow deleting self
    if (userId === deletingUser.user_id) {
      return {
        success: false,
        error: 'Cannot delete your own account'
      };
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Users');
    const data = sheet.getDataRange().getValues();
    
    // Find and delete user
    for (let i = data.length - 1; i > 0; i--) {
      if (data[i][0] === userId) {
        sheet.deleteRow(i + 1);
        
        // Log audit trail
        logAuditTrail(deletingUser.user_id, 'USER_DELETED', {
          deleted_user_id: userId,
          email: data[i][1]
        });
        
        return {
          success: true,
          message: 'User deleted successfully'
        };
      }
    }
    
    return {
      success: false,
      error: 'User not found'
    };
    
  } catch (error) {
    Logger.log('deleteUser error: ' + error.stack);
    return {
      success: false,
      error: 'Failed to delete user: ' + error.message
    };
  }
}

/**
 * Updates last login time
 * @param {string} userId - User ID
 */
function updateLastLogin(userId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Users');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === userId) {
      sheet.getRange(i + 1, 9).setValue(new Date()); // last_login column
      break;
    }
  }
}

// ============================================================================
// PASSWORD MANAGEMENT
// ============================================================================

/**
 * Hashes password
 * @param {string} password - Plain text password
 * @return {string} Hashed password
 */
function hashPassword(password) {
  const saltedPassword = password + AUTH_CONFIG.PASSWORD_SALT;
  const rawHash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    saltedPassword
  );
  
  let hash = '';
  for (let i = 0; i < rawHash.length; i++) {
    let byte = rawHash[i];
    if (byte < 0) byte += 256;
    const byteStr = byte.toString(16);
    hash += byteStr.length === 1 ? '0' + byteStr : byteStr;
  }
  
  return hash;
}

/**
 * Validates password strength
 * @param {string} password - Password to validate
 * @return {object} Validation result
 */
function validatePassword(password) {
  if (!password) {
    return {
      valid: false,
      error: 'Password is required'
    };
  }
  
  if (password.length < AUTH_CONFIG.PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      error: `Password must be at least ${AUTH_CONFIG.PASSWORD_MIN_LENGTH} characters long`
    };
  }
  
  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one uppercase letter'
    };
  }
  
  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one lowercase letter'
    };
  }
  
  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one number'
    };
  }
  
  // Check for at least one special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one special character'
    };
  }
  
  return {
    valid: true
  };
}

/**
 * Sends password reset email
 * @param {string} email - User email
 * @return {object} Result
 */
function sendPasswordResetEmail(email) {
  try {
    const user = getUserByEmail(email);
    
    if (!user) {
      // Don't reveal if user exists
      return {
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      };
    }
    
    // Generate reset token
    const resetToken = generateRandomToken(32);
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration
    
    // Store reset token (we'd need a password_reset_tokens sheet)
    // For now, we'll add to session tokens with special prefix
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Session_Tokens');
    
    sheet.appendRow([
      'RESET_' + resetToken,
      user.user_id,
      expiresAt,
      new Date(),
      new Date(),
      '',
      ''
    ]);
    
    // Send email
    const resetLink = getScriptUrl() + '?page=reset-password&token=' + resetToken;
    
    MailApp.sendEmail({
      to: email,
      subject: 'Password Reset - RTWE Sales Order System',
      htmlBody: `
        <h2>Password Reset Request</h2>
        <p>Hello ${user.full_name},</p>
        <p>You requested to reset your password. Click the link below to reset it:</p>
        <p><a href="${resetLink}" style="background:#6B4423;color:white;padding:10px 20px;text-decoration:none;display:inline-block;border-radius:5px;">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>RTWE Sales Order System</p>
      `
    });
    
    return {
      success: true,
      message: 'If the email exists, a password reset link has been sent'
    };
    
  } catch (error) {
    Logger.log('sendPasswordResetEmail error: ' + error.stack);
    return {
      success: false,
      error: 'Failed to send reset email'
    };
  }
}

/**
 * Resets password using token
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @return {object} Result
 */
function resetPassword(token, newPassword) {
  try {
    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return {
        success: false,
        error: passwordValidation.error
      };
    }
    
    // Find reset token
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Session_Tokens');
    const data = sheet.getDataRange().getValues();
    
    const resetTokenKey = 'RESET_' + token;
    let userId = null;
    let rowToDelete = -1;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === resetTokenKey) {
        const expiresAt = new Date(data[i][2]);
        
        if (expiresAt > new Date()) {
          userId = data[i][1];
          rowToDelete = i + 1;
          break;
        }
      }
    }
    
    if (!userId) {
      return {
        success: false,
        error: 'Invalid or expired reset token'
      };
    }
    
    // Update password
    const usersSheet = ss.getSheetByName('Users');
    const usersData = usersSheet.getDataRange().getValues();
    
    for (let i = 1; i < usersData.length; i++) {
      if (usersData[i][0] === userId) {
        const newPasswordHash = hashPassword(newPassword);
        usersSheet.getRange(i + 1, 3).setValue(newPasswordHash); // password_hash column
        usersSheet.getRange(i + 1, 11).setValue(new Date()); // updated_at column
        break;
      }
    }
    
    // Delete reset token
    sheet.deleteRow(rowToDelete);
    
    // Log audit trail
    logAuditTrail(userId, 'PASSWORD_RESET', {});
    
    return {
      success: true,
      message: 'Password reset successfully'
    };
    
  } catch (error) {
    Logger.log('resetPassword error: ' + error.stack);
    return {
      success: false,
      error: 'Failed to reset password'
    };
  }
}

// ============================================================================
// ACCOUNT LOCKOUT
// ============================================================================

/**
 * Checks if account is locked
 * @param {string} userId - User ID
 * @return {boolean} Is locked
 */
function isAccountLocked(userId) {
  const scriptProperties = PropertiesService.getScriptProperties();
  const lockKey = 'LOCK_' + userId;
  const lockData = scriptProperties.getProperty(lockKey);
  
  if (!lockData) return false;
  
  const lockInfo = JSON.parse(lockData);
  const lockUntil = new Date(lockInfo.lockUntil);
  
  if (lockUntil > new Date()) {
    return true;
  }
  
  // Unlock has expired
  scriptProperties.deleteProperty(lockKey);
  return false;
}

/**
 * Gets failed login attempt count
 * @param {string} userId - User ID
 * @return {number} Attempt count
 */
function getFailedLoginAttempts(userId) {
  const scriptProperties = PropertiesService.getScriptProperties();
  const attemptsKey = 'ATTEMPTS_' + userId;
  const attempts = scriptProperties.getProperty(attemptsKey);
  
  return attempts ? parseInt(attempts) : 0;
}

/**
 * Increments failed login attempts
 * @param {string} userId - User ID
 */
function incrementFailedLoginAttempts(userId) {
  const scriptProperties = PropertiesService.getScriptProperties();
  const attemptsKey = 'ATTEMPTS_' + userId;
  const attempts = getFailedLoginAttempts(userId) + 1;
  
  scriptProperties.setProperty(attemptsKey, attempts.toString());
  
  // Lock account if max attempts reached
  if (attempts >= AUTH_CONFIG.MAX_LOGIN_ATTEMPTS) {
    const lockUntil = new Date();
    lockUntil.setMinutes(lockUntil.getMinutes() + AUTH_CONFIG.LOCKOUT_DURATION_MINUTES);
    
    const lockKey = 'LOCK_' + userId;
    scriptProperties.setProperty(lockKey, JSON.stringify({
      lockUntil: lockUntil.toISOString(),
      attempts: attempts
    }));
    
    // Log lockout
    logAuditTrail(userId, 'ACCOUNT_LOCKED', {
      attempts: attempts,
      lockUntil: lockUntil
    });
  }
}

/**
 * Resets failed login attempts
 * @param {string} userId - User ID
 */
function resetFailedLoginAttempts(userId) {
  const scriptProperties = PropertiesService.getScriptProperties();
  const attemptsKey = 'ATTEMPTS_' + userId;
  const lockKey = 'LOCK_' + userId;
  
  scriptProperties.deleteProperty(attemptsKey);
  scriptProperties.deleteProperty(lockKey);
}

// ============================================================================
// AUDIT TRAIL
// ============================================================================

/**
 * Logs audit trail event
 * @param {string} userId - User ID performing action
 * @param {string} action - Action performed
 * @param {object} details - Additional details
 */
function logAuditTrail(userId, action, details) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('Audit_Trail');
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet('Audit_Trail');
      sheet.appendRow([
        'timestamp',
        'user_id',
        'action',
        'details',
        'ip_address'
      ]);
    }
    
    const timestamp = new Date();
    
    sheet.appendRow([
      timestamp,
      userId || 'SYSTEM',
      action,
      JSON.stringify(details),
      '' // IP not available in Apps Script
    ]);
    
  } catch (error) {
    Logger.log('logAuditTrail error: ' + error.stack);
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generates unique user ID
 * @return {string} User ID
 */
function generateUserId() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Users');
  const lastRow = sheet.getLastRow();
  
  if (lastRow === 1) {
    return 'U001';
  }
  
  const lastUserId = sheet.getRange(lastRow, 1).getValue();
  const lastNumber = parseInt(lastUserId.substring(1));
  const newNumber = lastNumber + 1;
  
  return 'U' + newNumber.toString().padStart(3, '0');
}

/**
 * Generates random token
 * @param {number} length - Token length
 * @return {string} Random token
 */
function generateRandomToken(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return token;
}

/**
 * Validates email format
 * @param {string} email - Email to validate
 * @return {boolean} Is valid
 */
function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Converts array to user object
 * @param {Array} arr - Data array
 * @param {Array} headers - Header array
 * @return {object} User object
 */
function arrayToUserObject(arr, headers) {
  const obj = {};
  
  for (let i = 0; i < headers.length; i++) {
    obj[headers[i]] = arr[i];
  }
  
  return obj;
}

/**
 * Gets script URL
 * @return {string} Web app URL
 */
function getScriptUrl() {
  return ScriptApp.getService().getUrl();
}