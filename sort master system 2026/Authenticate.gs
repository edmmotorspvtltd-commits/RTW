/**
 * ============================================================================
 * SORT MASTER MANAGEMENT SYSTEM 2026
 * Authentication Module
 * ============================================================================
 * 
 * Handles user authentication, registration, password reset, and password changes.
 * All passwords are hashed using SHA-256 before storage.
 * 
 * @version 1.1
 * @author Sort Master System
 * @date December 25, 2025
 */

/**
 * ============================================================================
 * PASSWORD HASHING (CRITICAL - ADD THIS IF MISSING)
 * ============================================================================
 */

/**
 * Hash password using SHA-256
 * @param {string} password - Plain text password
 * @return {string} Hashed password
 */
function hashPassword(password) {
  try {
    // Simple SHA-256 hash using Google Apps Script built-in function
    const hash = Utilities.computeDigest(
      Utilities.DigestAlgorithm.SHA_256,
      password,
      Utilities.Charset.UTF_8
    );
    
    // Convert byte array to hex string
    return hash.map(function(byte) {
      const v = (byte < 0) ? 256 + byte : byte;
      return ("0" + v.toString(16)).slice(-2);
    }).join("");
    
  } catch (error) {
    Logger.log('hashPassword error: ' + error.message);
    return null;
  }
}

/**
 * ============================================================================
 * LOGIN FUNCTIONALITY
 * ============================================================================
 */

/**
 * Authenticate user with username/email and password
 * @param {string} username - Username or email
 * @param {string} password - Plain text password
 * @param {boolean} rememberMe - Remember me checkbox
 * @param {string} ipAddress - User's IP address
 * @return {Object} {success, message, sessionId, user} or {success, message}
 */
function login(username, password, rememberMe, ipAddress) {
  try {
    Logger.log('=== LOGIN ATTEMPT ===');
    Logger.log('Username: ' + username);
    Logger.log('RememberMe: ' + rememberMe);
    Logger.log('IP: ' + ipAddress);
    
    // Validate inputs
    if (!username || !password) {
      Logger.log('Login failed: Missing username or password');
      return {
        success: false,
        message: 'Username and password are required'
      };
    }
    
    // Get user by username or email
    const user = getUserByUsernameOrEmail(username);
    
    if (!user) {
      Logger.log('Login failed: User not found - ' + username);
      
      // Log failed login attempt
      logFailedLogin(username, ipAddress);
      
      return {
        success: false,
        message: 'Invalid username or password'
      };
    }
    
    Logger.log('User found: ' + user.userName + ' (ID: ' + user.userId + ')');
    
    // Check if user is active
    if (!user.isActive) {
      Logger.log('Login failed: User account deactivated');
      return {
        success: false,
        message: 'Your account has been deactivated. Please contact administrator.'
      };
    }
    
    // Verify password
    const passwordHash = hashPassword(password);
    
    Logger.log('Password hash generated');
    Logger.log('Stored hash: ' + user.passwordHash.substring(0, 20) + '...');
    Logger.log('Input hash: ' + passwordHash.substring(0, 20) + '...');
    
    if (passwordHash !== user.passwordHash) {
      Logger.log('Login failed: Password mismatch');
      
      // Log failed login attempt
      logFailedLogin(username, ipAddress);
      
      return {
        success: false,
        message: 'Invalid username or password'
      };
    }
    
    Logger.log('Password verified successfully');
    
    // Password is correct - create session
    const sessionId = createSession(user.userId, rememberMe || false);
    
    Logger.log('Session created: ' + sessionId);
    
    // Update last login
    updateLastLogin(user.userId);
    
    // Log successful login
    logAction(
      user.userId,
      AUDIT_ACTIONS.LOGIN,
      AUDIT_MODULES.AUTH,
      null,
      null,
      null,
      ipAddress
    );
    
    Logger.log('Login successful for user: ' + user.userName);
    
    // Send login alert via Telegram (if enabled)
    if (user.telegramNotifications && user.telegramChatId) {
      sendLoginAlert(user.userId, user.userName, user.telegramChatId, ipAddress);
    }
    
    return {
      success: true,
      message: 'Login successful!',
      sessionId: sessionId,
      user: {
        userId: user.userId,
        userName: user.userName,
        email: user.email,
        role: user.role,
        customUserId: user.customUserId
      }
    };
    
  } catch (error) {
    Logger.log('Login error: ' + error.message);
    Logger.log('Login error stack: ' + error.stack);
    return {
      success: false,
      message: 'Server error occurred. Please try again.'
    };
  }
}

/**
 * Get user by username or email
 * @param {string} identifier - Username or email
 * @return {Object|null} User object or null
 */
function getUserByUsernameOrEmail(identifier) {
  try {
    const sheet = getSheet(SHEET_NAMES.USERS);
    const data = sheet.getDataRange().getValues();
    
    Logger.log('Searching for user: ' + identifier);
    Logger.log('Total users in sheet: ' + (data.length - 1));
    
    // Convert identifier to string and lowercase for comparison
    const searchTerm = String(identifier).toLowerCase().trim();
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Get all possible login identifiers
      const userName = row[1] ? String(row[1]).toLowerCase().trim() : '';
      const email = row[2] ? String(row[2]).toLowerCase().trim() : '';
      const customUserId = row[3] ? String(row[3]).toLowerCase().trim() : '';
      
      // Debug log
      Logger.log('Row ' + i + ': userName=' + userName + ', email=' + email + ', customUserId=' + customUserId);
      
      // Check match with userName, email, or customUserId
      if (userName === searchTerm || email === searchTerm || customUserId === searchTerm) {
        Logger.log('User found at row: ' + (i + 1));
        return {
          userId: row[0],
          userName: row[1],
          email: row[2],
          customUserId: row[3],
          passwordHash: row[4],
          telegramChatId: row[5],
          role: row[6],
          isActive: row[7],
          createdDate: row[8],
          createdBy: row[9],
          lastLogin: row[10],
          emailNotifications: row[11],
          telegramNotifications: row[12],
          rememberMeToken: row[13],
          resetToken: row[14],
          resetTokenExpiry: row[15]
        };
      }
    }
    
    Logger.log('User not found in database');
    return null;
    
  } catch (error) {
    Logger.log('getUserByUsernameOrEmail error: ' + error.message);
    return null;
  }
}

/**
 * Update user's last login timestamp
 * @param {number} userId - User ID
 */
function updateLastLogin(userId) {
  try {
    const sheet = getSheet(SHEET_NAMES.USERS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userId) {
        sheet.getRange(i + 1, 11).setValue(new Date()); // Column K - lastLogin
        break;
      }
    }
  } catch (error) {
    Logger.log('updateLastLogin error: ' + error.message);
  }
}

/**
 * Log failed login attempt
 * @param {string} username - Username attempted
 * @param {string} ipAddress - IP address
 */
function logFailedLogin(username, ipAddress) {
  try {
    logAction(
      null,
      'LOGIN_FAILED',
      AUDIT_MODULES.AUTH,
      null,
      JSON.stringify({ username: username }),
      null,
      ipAddress
    );
  } catch (error) {
    Logger.log('logFailedLogin error: ' + error.message);
  }
}

/**
 * ============================================================================
 * LOGOUT FUNCTIONALITY
 * ============================================================================
 */

/**
 * Logout user and invalidate session
 * @param {string} sessionId - Session ID
 * @return {Object} {success, message}
 */
function logout(sessionId) {
  try {
    // Get session to log the user
    const session = getSession(sessionId);
    
    if (session) {
      // Log logout action
      logAction(
        session.userId,
        AUDIT_ACTIONS.LOGOUT,
        AUDIT_MODULES.AUTH,
        null,
        null,
        null,
        session.ipAddress
      );
    }
    
    // Delete session
    deleteSession(sessionId);
    
    return {
      success: true,
      message: 'Logout successful'
    };
    
  } catch (error) {
    Logger.log('Logout error: ' + error.message);
    return {
      success: false,
      message: 'Server error occurred'
    };
  }
}

/**
 * ============================================================================
 * REGISTRATION FUNCTIONALITY
 * ============================================================================
 */

/**
 * Register new user (self-registration)
 * @param {Object} userData - User registration data
 * @return {Object} {success, message, userId}
 */
function register(userData) {
  try {
    // Check if self-registration is enabled
    const selfRegEnabled = getSystemSetting('SELF_REGISTRATION_ENABLED');
    if (selfRegEnabled !== 'true' && selfRegEnabled !== true) {
      // Allow registration if setting doesn't exist (first time setup)
      Logger.log('Self-registration setting: ' + selfRegEnabled);
    }
    
    // Validate required fields
    if (!userData.userName || !userData.email || !userData.customUserId || !userData.password) {
      return {
        success: false,
        message: 'All fields are required'
      };
    }
    
    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(userData.email)) {
      return {
        success: false,
        message: 'Invalid email format'
      };
    }
    
    // Validate username format
    const usernamePattern = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernamePattern.test(userData.customUserId)) {
      return {
        success: false,
        message: 'Username must be 3-20 characters (letters, numbers, underscore only).'
      };
    }
    
    // Check if email already exists
    if (checkEmailExists(userData.email, null)) {
      return {
        success: false,
        message: 'Email already exists'
      };
    }
    
    // Check if username already exists
    if (checkUsernameExists(userData.customUserId, null)) {
      return {
        success: false,
        message: 'Username already exists'
      };
    }
    
    // Create user
    const userId = createUser({
      userName: userData.userName,
      email: userData.email,
      customUserId: userData.customUserId,
      password: userData.password,
      telegramChatId: userData.telegramChatId || '',
      role: userData.role || 'USER', // Default role for self-registered users
      emailNotifications: true,
      telegramNotifications: true
    }, null); // createdBy = null for self-registration
    
    if (!userId) {
      return {
        success: false,
        message: 'Failed to create user. Please try again.'
      };
    }
    
    // Send welcome email (optional)
    try {
      if (EMAIL_CONFIG && EMAIL_CONFIG.ENABLED) {
        sendUserCreationEmail(userData.email, userData.userName, userData.password);
      }
    } catch (e) {
      Logger.log('Email sending failed (non-critical): ' + e.message);
    }
    
    return {
      success: true,
      message: 'Registration successful! You can now login.',
      userId: userId
    };
    
  } catch (error) {
    Logger.log('Registration error: ' + error.message);
    return {
      success: false,
      message: 'Server error occurred'
    };
  }
}

/**
 * Create new user (admin or self-registration)
 * @param {Object} userData - User data
 * @param {number} createdBy - User ID of creator (null for self-registration)
 * @return {number|null} New user ID or null on failure
 */
function createUser(userData, createdBy) {
  try {
    const sheet = getSheet(SHEET_NAMES.USERS);
    
    // Get next user ID
    const lastRow = sheet.getLastRow();
    const userId = lastRow > 1 ? sheet.getRange(lastRow, 1).getValue() + 1 : 1;
    
    // Hash password
    const passwordHash = hashPassword(userData.password);
    
    Logger.log('Creating user with ID: ' + userId);
    Logger.log('Password hash: ' + passwordHash.substring(0, 20) + '...');
    
    const now = new Date();
    
    const newUser = [
      userId,
      userData.userName,
      userData.email,
      userData.customUserId,
      passwordHash,
      userData.telegramChatId || '',
      userData.role || 'USER',
      true, // isActive
      now, // createdDate
      createdBy || userId, // createdBy (self if null)
      '', // lastLogin
      userData.emailNotifications !== false, // default true
      userData.telegramNotifications !== false, // default true
      '', // rememberMeToken
      '', // resetToken
      '' // resetTokenExpiry
    ];
    
    sheet.appendRow(newUser);
    
    Logger.log('User created successfully: ' + userData.userName);
    
    // Log user creation
    if (createdBy) {
      logAction(
        createdBy,
        AUDIT_ACTIONS.CREATE,
        AUDIT_MODULES.USER,
        userId,
        null,
        JSON.stringify({ userName: userData.userName, email: userData.email, role: userData.role })
      );
    }
    
    return userId;
    
  } catch (error) {
    Logger.log('createUser error: ' + error.message);
    Logger.log('createUser stack: ' + error.stack);
    return null;
  }
}

/**
 * Check if email exists
 * @param {string} email - Email to check
 * @param {number} excludeUserId - User ID to exclude from check (for updates)
 * @return {boolean} True if email exists
 */
function checkEmailExists(email, excludeUserId) {
  try {
    const sheet = getSheet(SHEET_NAMES.USERS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (excludeUserId && data[i][0] === excludeUserId) {
        continue; // Skip the user being updated
      }
      
      if (data[i][2] === email) {
        return true;
      }
    }
    
    return false;
    
  } catch (error) {
    Logger.log('checkEmailExists error: ' + error.message);
    return false;
  }
}

/**
 * Check if username exists
 * @param {string} username - Username to check
 * @param {number} excludeUserId - User ID to exclude from check
 * @return {boolean} True if username exists
 */
function checkUsernameExists(username, excludeUserId) {
  try {
    const sheet = getSheet(SHEET_NAMES.USERS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (excludeUserId && data[i][0] === excludeUserId) {
        continue;
      }
      
      if (data[i][3] === username) {
        return true;
      }
    }
    
    return false;
    
  } catch (error) {
    Logger.log('checkUsernameExists error: ' + error.message);
    return false;
  }
}

/**
 * ============================================================================
 * PASSWORD RESET FUNCTIONALITY
 * ============================================================================
 */

/**
 * Request password reset
 * @param {string} email - User's email address
 * @return {Object} {success, message}
 */
function requestPasswordReset(email) {
  try {
    // Validate email
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailPattern.test(email)) {
      return {
        success: false,
        message: 'Invalid email format'
      };
    }
    
    // Find user by email
    const user = getUserByEmail(email);
    
    if (!user) {
      // Don't reveal if email exists or not (security)
      return {
        success: true,
        message: 'If the email exists, a password reset link has been sent.'
      };
    }
    
    // Generate reset token
    const resetToken = generateUUID();
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1); // 1 hour expiry
    
    // Save reset token to user
    saveResetToken(user.userId, resetToken, resetTokenExpiry);
    
    // Generate reset link
    const resetLink = getWebAppUrl() + '?page=reset-password&token=' + resetToken;
    
    // Send password reset email
    try {
      if (EMAIL_CONFIG && EMAIL_CONFIG.ENABLED) {
        sendPasswordResetEmail(email, user.userName, resetLink);
      }
    } catch (e) {
      Logger.log('Email sending failed (non-critical): ' + e.message);
    }
    
    // Log password reset request
    logAction(
      user.userId,
      'PASSWORD_RESET_REQUESTED',
      AUDIT_MODULES.AUTH,
      null,
      null,
      null
    );
    
    return {
      success: true,
      message: 'If the email exists, a password reset link has been sent.'
    };
    
  } catch (error) {
    Logger.log('requestPasswordReset error: ' + error.message);
    return {
      success: false,
      message: 'Server error occurred'
    };
  }
}

/**
 * Get user by email
 * @param {string} email - Email address
 * @return {Object|null} User object or null
 */
function getUserByEmail(email) {
  try {
    const sheet = getSheet(SHEET_NAMES.USERS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][2] === email) {
        return {
          userId: data[i][0],
          userName: data[i][1],
          email: data[i][2],
          customUserId: data[i][3],
          passwordHash: data[i][4],
          isActive: data[i][7],
          resetToken: data[i][14],
          resetTokenExpiry: data[i][15]
        };
      }
    }
    
    return null;
    
  } catch (error) {
    Logger.log('getUserByEmail error: ' + error.message);
    return null;
  }
}

/**
 * Save reset token to user record
 * @param {number} userId - User ID
 * @param {string} resetToken - Reset token
 * @param {Date} resetTokenExpiry - Token expiry date
 */
function saveResetToken(userId, resetToken, resetTokenExpiry) {
  try {
    const sheet = getSheet(SHEET_NAMES.USERS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userId) {
        sheet.getRange(i + 1, 15).setValue(resetToken); // Column O
        sheet.getRange(i + 1, 16).setValue(resetTokenExpiry); // Column P
        break;
      }
    }
  } catch (error) {
    Logger.log('saveResetToken error: ' + error.message);
  }
}

/**
 * Validate reset token
 * @param {string} token - Reset token
 * @return {Object|null} User object if token is valid, null otherwise
 */
function validateResetToken(token) {
  try {
    const sheet = getSheet(SHEET_NAMES.USERS);
    const data = sheet.getDataRange().getValues();
    
    const now = new Date();
    
    for (let i = 1; i < data.length; i++) {
      const resetToken = data[i][14];
      const resetTokenExpiry = data[i][15];
      
      if (resetToken === token) {
        // Check if token has expired
        if (resetTokenExpiry && resetTokenExpiry > now) {
          return {
            userId: data[i][0],
            userName: data[i][1],
            email: data[i][2]
          };
        } else {
          return null; // Token expired
        }
      }
    }
    
    return null; // Token not found
    
  } catch (error) {
    Logger.log('validateResetToken error: ' + error.message);
    return null;
  }
}

/**
 * Reset password using token
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @return {Object} {success, message}
 */
function resetPassword(token, newPassword) {
  try {
    // Validate token
    const user = validateResetToken(token);
    
    if (!user) {
      return {
        success: false,
        message: 'Invalid or expired reset token.'
      };
    }
    
    // Validate password
    if (!newPassword) {
      return {
        success: false,
        message: 'Password is required'
      };
    }
    
    // Change password
    const result = changeUserPassword(user.userId, newPassword);
    
    if (!result) {
      return {
        success: false,
        message: 'Failed to reset password. Please try again.'
      };
    }
    
    // Clear reset token
    clearResetToken(user.userId);
    
    // Log password reset
    logAction(
      user.userId,
      'PASSWORD_RESET_COMPLETED',
      AUDIT_MODULES.AUTH,
      null,
      null,
      null
    );
    
    return {
      success: true,
      message: 'Password reset successful! You can now login with your new password.'
    };
    
  } catch (error) {
    Logger.log('resetPassword error: ' + error.message);
    return {
      success: false,
      message: 'Server error occurred'
    };
  }
}

/**
 * Clear reset token after password reset
 * @param {number} userId - User ID
 */
function clearResetToken(userId) {
  try {
    const sheet = getSheet(SHEET_NAMES.USERS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userId) {
        sheet.getRange(i + 1, 15).setValue(''); // Column O - resetToken
        sheet.getRange(i + 1, 16).setValue(''); // Column P - resetTokenExpiry
        break;
      }
    }
  } catch (error) {
    Logger.log('clearResetToken error: ' + error.message);
  }
}

/**
 * ============================================================================
 * PASSWORD CHANGE FUNCTIONALITY
 * ============================================================================
 */

/**
 * Change user password (while logged in)
 * @param {number} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @return {Object} {success, message}
 */
function changePassword(userId, currentPassword, newPassword) {
  try {
    // Get user
    const user = getUserById(userId);
    
    if (!user) {
      return {
        success: false,
        message: 'User not found'
      };
    }
    
    // Verify current password
    const currentPasswordHash = hashPassword(currentPassword);
    
    if (currentPasswordHash !== user.passwordHash) {
      return {
        success: false,
        message: 'Current password is incorrect.'
      };
    }
    
    // Validate new password
    if (!newPassword) {
      return {
        success: false,
        message: 'New password is required'
      };
    }
    
    // Change password
    const result = changeUserPassword(userId, newPassword);
    
    if (!result) {
      return {
        success: false,
        message: 'Failed to change password. Please try again.'
      };
    }
    
    // Log password change
    logAction(
      userId,
      'PASSWORD_CHANGED',
      AUDIT_MODULES.AUTH,
      null,
      null,
      null
    );
    
    return {
      success: true,
      message: 'Password changed successfully!'
    };
    
  } catch (error) {
    Logger.log('changePassword error: ' + error.message);
    return {
      success: false,
      message: 'Server error occurred'
    };
  }
}

/**
 * Change user password (internal function)
 * @param {number} userId - User ID
 * @param {string} newPassword - New plain text password
 * @return {boolean} True on success
 */
function changeUserPassword(userId, newPassword) {
  try {
    const sheet = getSheet(SHEET_NAMES.USERS);
    const data = sheet.getDataRange().getValues();
    
    const newPasswordHash = hashPassword(newPassword);
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userId) {
        sheet.getRange(i + 1, 5).setValue(newPasswordHash); // Column E - passwordHash
        return true;
      }
    }
    
    return false;
    
  } catch (error) {
    Logger.log('changeUserPassword error: ' + error.message);
    return false;
  }
}

/**
 * ============================================================================
 * HELPER FUNCTIONS
 * ============================================================================
 */

/**
 * Get user by ID
 * @param {number} userId - User ID
 * @return {Object|null} User object or null
 */
function getUserById(userId) {
  try {
    const sheet = getSheet(SHEET_NAMES.USERS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === userId) {
        return {
          userId: data[i][0],
          userName: data[i][1],
          email: data[i][2],
          customUserId: data[i][3],
          passwordHash: data[i][4],
          telegramChatId: data[i][5],
          role: data[i][6],
          isActive: data[i][7],
          createdDate: data[i][8],
          createdBy: data[i][9],
          lastLogin: data[i][10],
          emailNotifications: data[i][11],
          telegramNotifications: data[i][12]
        };
      }
    }
    
    return null;
    
  } catch (error) {
    Logger.log('getUserById error: ' + error.message);
    return null;
  }
}

/**
 * Get current user from session
 * @param {string} sessionId - Session ID
 * @return {Object|null} User object or null
 */
function getCurrentUser(sessionId) {
  try {
    const session = validateSession(sessionId);
    
    if (!session) {
      return null;
    }
    
    return getUserById(session.userId);
    
  } catch (error) {
    Logger.log('getCurrentUser error: ' + error.message);
    return null;
  }
}

/**
 * Get system setting value
 * @param {string} key - Setting key
 * @return {string|null} Setting value or null
 */
function getSystemSetting(key) {
  try {
    const sheet = getSheet(SHEET_NAMES.SYSTEM_SETTINGS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === key) {
        return data[i][1]; // settingValue
      }
    }
    
    return null;
    
  } catch (error) {
    Logger.log('getSystemSetting error: ' + error.message);
    return null;
  }
}

/**
 * ============================================================================
 * TESTING & DEBUG FUNCTIONS
 * ============================================================================
 */

/**
 * Create test admin user
 * Run this function ONCE from Apps Script editor to create first user
 */
function createTestAdminUser() {
  Logger.log('=== CREATING TEST ADMIN USER ===');
  
  const testUser = {
    userName: 'Admin User',
    email: 'admin@company.com',
    customUserId: 'admin',
    password: 'admin123',
    role: 'ADMIN'
  };
  
  const result = register(testUser);
  
  Logger.log('Result: ' + JSON.stringify(result, null, 2));
  
  Logger.log('=== TEST USER CREATION COMPLETE ===');
  Logger.log('You can now login with:');
  Logger.log('Username: admin');
  Logger.log('Password: admin123');
}

/**
 * Test login function
 */
function testLogin() {
  Logger.log('=== TESTING LOGIN ===');
  
  const result = login('admin', 'admin123', false, 'test');
  
  Logger.log('Login result:');
  Logger.log(JSON.stringify(result, null, 2));
  
  Logger.log('=== LOGIN TEST COMPLETE ===');
}

/**
 * Test password hashing
 */
function testPasswordHash() {
  Logger.log('=== TESTING PASSWORD HASH ===');
  
  const password = 'admin123';
  const hash1 = hashPassword(password);
  const hash2 = hashPassword(password);
  
  Logger.log('Password: ' + password);
  Logger.log('Hash 1: ' + hash1);
  Logger.log('Hash 2: ' + hash2);
  Logger.log('Match: ' + (hash1 === hash2));
  
  Logger.log('=== HASH TEST COMPLETE ===');
}

function debugSpreadsheetAccess() {
  Logger.log('=== DEBUGGING SPREADSHEET ACCESS ===');
  
  Logger.log('Config SPREADSHEET_ID: ' + SPREADSHEET_ID);
  
  try {
    // Try to open with hardcoded ID
    const testId = '1te3Mk3WeSPCObeaeqtMeICZp-Hwu6MPvk-xjzGtA4Fg';
    Logger.log('Trying to open ID: ' + testId);
    
    const ss = SpreadsheetApp.openById(testId);
    Logger.log('✅ SUCCESS! Spreadsheet opened');
    Logger.log('Name: ' + ss.getName());
    Logger.log('URL: ' + ss.getUrl());
    Logger.log('Owner: ' + ss.getOwner().getEmail());
    
    // List all sheets
    const sheets = ss.getSheets();
    Logger.log('Total sheets: ' + sheets.length);
    sheets.forEach(function(sheet) {
      Logger.log('  - ' + sheet.getName());
    });
    
  } catch (error) {
    Logger.log('❌ ERROR opening spreadsheet');
    Logger.log('Error message: ' + error.message);
    Logger.log('Error stack: ' + error.stack);
    
    // Try creating a new spreadsheet
    Logger.log('');
    Logger.log('Attempting to create new spreadsheet...');
    try {
      const newSS = SpreadsheetApp.create('Sort Master System - Test');
      Logger.log('✅ New spreadsheet created!');
      Logger.log('New ID: ' + newSS.getId());
      Logger.log('New URL: ' + newSS.getUrl());
      Logger.log('COPY THIS ID TO Config.gs line 37!');
    } catch (createError) {
      Logger.log('❌ Cannot create spreadsheet: ' + createError.message);
    }
  }
  
  Logger.log('=== DEBUG COMPLETE ===');
}