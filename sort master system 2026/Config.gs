/**
 * ============================================================================
 * SORT MASTER MANAGEMENT SYSTEM 2026
 * Configuration File
 * ============================================================================
 * 
 * This file contains all system-wide configuration settings, constants,
 * and master data that the application needs to function.
 * 
 * IMPORTANT: Update SPREADSHEET_ID after running Setup.gs
 * 
 * @version 1.0
 * @author Sort Master System
 * @date December 25, 2025
 */

// ============================================================================
// SPREADSHEET CONFIGURATION
// ============================================================================

/**
 * Main spreadsheet ID
 * IMPORTANT: Update this after running createAllSheets() in Setup.gs
 * 
 * To get your Spreadsheet ID:
 * 1. Run Setup.gs > createAllSheets()
 * 2. Open the created spreadsheet
 * 3. Copy the ID from URL: https://docs.google.com/spreadsheets/d/1te3Mk3WeSPCObeaeqtMeICZp-Hwu6MPvk-xjzGtA4Fg/edit?gid=857898211#gid=857898211
 * 4. Paste it here
 */
var SPREADSHEET_ID = '1te3Mk3WeSPCObeaeqtMeICZp-Hwu6MPvk-xjzGtA4Fg'; // ⚠️ UPDATE THIS!

/**
 * Get the active spreadsheet
 * @return {Spreadsheet} The main spreadsheet object
 */
/**
 * Get the active spreadsheet
 * @return {Spreadsheet} The main spreadsheet object
 */
function getSpreadsheet() {
  try {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (error) {
    Logger.log('Error opening spreadsheet: ' + error.message);
    Logger.log('SPREADSHEET_ID: ' + SPREADSHEET_ID);
    throw new Error('Could not open spreadsheet. Please check SPREADSHEET_ID in Config.gs');
  }
}

// ============================================================================
// SHEET NAMES
// ============================================================================

var SHEET_NAMES = {
  USERS: 'USERS',
  SESSIONS: 'SESSIONS',
  AUDIT_LOG: 'AUDIT_LOG',
  SORT_MASTER: 'SORT_MASTER',
  WARP_DETAILS: 'WARP_DETAILS',
  WEFT_DETAILS: 'WEFT_DETAILS',
  GREY_QUALITY_DETAILS: 'GREY_QUALITY_DETAILS',
  ITEM_MASTER: 'ITEM_MASTER',
  WEAVE_MASTER: 'WEAVE_MASTER',
  SELVEDGE_MASTER: 'SELVEDGE_MASTER',
  SYSTEM_SETTINGS: 'SYSTEM_SETTINGS',
  PENDING_ORDERS: 'Pending order for sort'
};

/**
 * Get a specific sheet by name
 * @param {string} sheetName - Name of the sheet from SHEET_NAMES
 * @return {Sheet} The requested sheet object
 */
function getSheet(sheetName) {
  try {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      throw new Error('Sheet not found: ' + sheetName);
    }
    return sheet;
  } catch (error) {
    Logger.log('Error getting sheet ' + sheetName + ': ' + error.message);
    throw error;
  }
}

// ============================================================================
// USER ROLES
// ============================================================================

var USER_ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  USER: 'USER',
  DATA_ENTRY: 'DATA_ENTRY'
};

/**
 * Role permissions mapping
 * Defines what each role can do
 */
var ROLE_PERMISSIONS = {
  ADMIN: {
    canCreate: true,
    canEdit: true,
    canDelete: true,
    canView: true,
    canManageUsers: true,
    canViewAuditLog: true,
    canManageSettings: true
  },
  MANAGER: {
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canView: true,
    canManageUsers: false,
    canViewAuditLog: false,
    canManageSettings: false
  },
  USER: {
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canView: true,
    canManageUsers: false,
    canViewAuditLog: false,
    canManageSettings: false
  },
  DATA_ENTRY: {
    canCreate: true,
    canEdit: true,
    canDelete: false,
    canView: true,
    canManageUsers: false,
    canViewAuditLog: false,
    canManageSettings: false
  }
};

/**
 * Check if user has permission for an action
 * @param {string} role - User role
 * @param {string} permission - Permission to check (e.g., 'canDelete')
 * @return {boolean} True if user has permission
 */
function hasPermission(role, permission) {
  if (!ROLE_PERMISSIONS[role]) {
    return false;
  }
  return ROLE_PERMISSIONS[role][permission] || false;
}

// ============================================================================
// SESSION CONFIGURATION
// ============================================================================

var SESSION_CONFIG = {
  STANDARD_DURATION: 30 * 60 * 1000, // 30 minutes in milliseconds (auto-logout when "Keep me logged in" is unchecked)
  REMEMBER_ME_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds (when "Keep me logged in" is checked)
  CLEANUP_INTERVAL: 24 * 60 * 60 * 1000 // Run cleanup once per day
};

// ============================================================================
// TELEGRAM CONFIGURATION
// ============================================================================

var TELEGRAM_CONFIG = {
  BOT_TOKEN: '8398512229:AAGUBN1as8A9SalazravrVMwy7YdG8_JjYo',
  API_URL: 'https://api.telegram.org/bot',
  ENABLED: true
};

/**
 * Get Telegram API endpoint
 * @param {string} method - API method name (e.g., 'sendMessage')
 * @return {string} Full API endpoint URL
 */
function getTelegramEndpoint(method) {
  return TELEGRAM_CONFIG.API_URL + TELEGRAM_CONFIG.BOT_TOKEN + '/' + method;
}

// ============================================================================
// EMAIL CONFIGURATION
// ============================================================================

var EMAIL_CONFIG = {
  FROM_NAME: 'Sort Master System',
  REPLY_TO: 'noreply@sortmaster.com', // Update with your email
  ENABLED: true,
  DAILY_QUOTA: 100 // Gmail free tier limit
};

/**
 * Email templates
 */
var EMAIL_TEMPLATES = {
  USER_CREATION: {
    subject: 'Welcome to Sort Master System',
    getBody: function(userName, email, password) {
      const loginUrl = getWebAppUrl() + '?page=login';
      return `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="background: #5D4037; color: white; padding: 30px; text-align: center;">
                <h1 style="margin: 0;">Sort Master System</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Textile ERP Management</p>
              </div>
              <div style="padding: 30px;">
                <h2 style="color: #5D4037; margin-top: 0;">Welcome, ${userName}! 👋</h2>
                <p>Your account has been successfully created. You can now access the Sort Master System.</p>
                
                <div style="background: #F5F5F5; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #5D4037;">
                  <h3 style="margin-top: 0; color: #5D4037;">🔐 Your Login Credentials</h3>
                  <table style="width: 100%;">
                    <tr>
                      <td style="padding: 8px 0;"><strong>Email:</strong></td>
                      <td style="padding: 8px 0;">${email}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0;"><strong>Password:</strong></td>
                      <td style="padding: 8px 0;">${password}</td>
                    </tr>
                  </table>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${loginUrl}" style="background: #5D4037; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">🚀 Login to Sort Master</a>
                </div>
                
                <div style="background: #E8F5E9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px;"><strong>📋 Login URL (copy if button doesn't work):</strong></p>
                  <p style="margin: 10px 0 0 0; word-break: break-all; font-size: 13px; color: #1565C0;">${loginUrl}</p>
                </div>
                
                <p style="color: #C62828; font-weight: bold;">⚠️ Important: Please change your password after first login for security.</p>
                
                <hr style="border: none; border-top: 1px solid #E0E0E0; margin: 25px 0;">
                <p style="color: #666; font-size: 13px;">Best regards,<br><strong>Sort Master Team</strong></p>
              </div>
            </div>
          </body>
        </html>
      `;
    }
  },
  
  PASSWORD_RESET: {
    subject: 'Reset Your Password - Sort Master System',
    getBody: function(userName, resetLink) {
      return `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #5D4037;">Password Reset Request</h2>
            <p>Dear ${userName},</p>
            <p>We received a request to reset your password.</p>
            <div style="background: #F5F5F5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p>Click the button below to reset your password:</p>
              <a href="${resetLink}" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Reset Password</a>
            </div>
            <p><strong>Note:</strong> This link will expire in 1 hour.</p>
            <p>If you didn't request this, please ignore this email.</p>
            <br>
            <p>Best regards,<br>Sort Master Team</p>
          </body>
        </html>
      `;
    }
  },
  
  SORT_MASTER_CREATED: {
    subject: 'Sort Master Created Successfully',
    getBody: function(sortMasterNo, rtweNo, quality, glm, gsm, createdBy) {
      return `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #5D4037;">Sort Master Created</h2>
            <p>A new Sort Master has been created successfully.</p>
            <div style="background: #F5F5F5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Sort Master Details:</strong></p>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 5px;"><strong>Sort Master No:</strong></td>
                  <td style="padding: 5px;">${sortMasterNo}</td>
                </tr>
                <tr>
                  <td style="padding: 5px;"><strong>RTWE No:</strong></td>
                  <td style="padding: 5px;">${rtweNo}</td>
                </tr>
                <tr>
                  <td style="padding: 5px;"><strong>Quality:</strong></td>
                  <td style="padding: 5px;">${quality}</td>
                </tr>
                <tr>
                  <td style="padding: 5px;"><strong>GLM:</strong></td>
                  <td style="padding: 5px;">${glm}</td>
                </tr>
                <tr>
                  <td style="padding: 5px;"><strong>GSM:</strong></td>
                  <td style="padding: 5px;">${gsm}</td>
                </tr>
                <tr>
                  <td style="padding: 5px;"><strong>Created By:</strong></td>
                  <td style="padding: 5px;">${createdBy}</td>
                </tr>
              </table>
            </div>
            <p>View complete details in the system.</p>
            <br>
            <p>Best regards,<br>Sort Master Team</p>
          </body>
        </html>
      `;
    }
  }
};

// ============================================================================
// SORT MASTER CONFIGURATION
// ============================================================================

var SORT_MASTER_CONFIG = {
  PREFIX: 'RTWSM',
  SEQUENCE_START: 1,
  SEQUENCE_PAD_LENGTH: 3, // 001, 002, 003...
  FINANCIAL_YEAR_START_MONTH: 3, // April (0-indexed, so 3 = April)
  FINANCIAL_YEAR_START_DAY: 1
};

/**
 * Get current financial year in YY-YY format
 * @return {string} Financial year (e.g., "25-26")
 */
function getCurrentFinancialYear() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  let fyStartYear, fyEndYear;
  
  // If current month is before April (0-3), we're in previous FY
  if (currentMonth < SORT_MASTER_CONFIG.FINANCIAL_YEAR_START_MONTH) {
    fyStartYear = currentYear - 1;
    fyEndYear = currentYear;
  } else {
    fyStartYear = currentYear;
    fyEndYear = currentYear + 1;
  }
  
  // Convert to YY format
  const fyStart = String(fyStartYear).slice(-2);
  const fyEnd = String(fyEndYear).slice(-2);
  
  return fyStart + '-' + fyEnd;
}

// ============================================================================
// AUDIT LOG CONFIGURATION
// ============================================================================

var AUDIT_ACTIONS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  CREATE: 'CREATE',
  EDIT: 'EDIT',
  DELETE: 'DELETE',
  VIEW: 'VIEW'
};

var AUDIT_MODULES = {
  SORT_MASTER: 'SORT_MASTER',
  USER: 'USER',
  SETTINGS: 'SETTINGS',
  AUTH: 'AUTH'
};

// ============================================================================
// CALCULATION CONSTANTS
// ============================================================================

var CALC_CONSTANTS = {
  // Textile weight conversion factor
  // Converts (ends/picks × length) to weight in grams
  WEIGHT_CONVERSION_FACTOR: 0.0005905,
  
  // Unit conversions
  INCHES_TO_CM: 2.54,
  INCHES_TO_METERS: 1 / 39.37,
  
  // Decimal precision
  DECIMAL_PRECISION: {
    FINAL_REED: 2,
    REED_SPACE: 2,
    WIDTH_CM: 3,
    GRMS_PER_MTR: 4,
    GLM: 3,
    GSM: 3
  }
};

// ============================================================================
// FABRIC TYPES
// ============================================================================

var FABRIC_TYPES = {
  1: 'Finished',
  2: 'Grey'
};

// ============================================================================
// EXPORT ORDER TYPES
// ============================================================================

var EXPORT_ORDER_TYPES = {
  0: 'Domestic',
  1: 'Export',
  2: 'Both'
};

// ============================================================================
// LOOM TYPES
// ============================================================================

var LOOM_TYPES = {
  1: 'AIRJET',
  2: 'RAPPIER'
};

// ============================================================================
// BEAM TYPES
// ============================================================================

var BEAM_TYPES = {
  1: 'Bottom',
  2: 'Top',
  3: 'Bobbin',
  4: 'Selvedge'
};

// ============================================================================
// WEAVE MASTER DATA
// ============================================================================

var WEAVE_DATA = [
  { id: 1, name: 'DOBBY' },
  { id: 2, name: 'TWILL' },
  { id: 3, name: 'PLAIN' },
  { id: 4, name: 'SATIN' },
  { id: 5, name: 'CORD' },
  { id: 6, name: 'MATTY' },
  { id: 7, name: '2/2 TWILL' },
  { id: 8, name: '2/2 MATTY' }
];

// ============================================================================
// ITEM MASTER DATA (MATERIALS/YARNS)
// ============================================================================

/**
 * Material master data
 * 55+ yarn/material options with English Count for weight calculations
 */
var ITEM_MASTER_DATA = [
  // Cotton (CTN) Materials
  { id: 1, name: '61CPT', yarnTypeId: 1, yarnTypeName: 'Cotton', yarnCode: 'CPT', countValue: 61, plyValue: 1, englishCount: 61.0 },
  { id: 2, name: '30C', yarnTypeId: 1, yarnTypeName: 'Cotton', yarnCode: 'C', countValue: 30, plyValue: 1, englishCount: 30.0 },
  { id: 3, name: '20C', yarnTypeId: 1, yarnTypeName: 'Cotton', yarnCode: 'C', countValue: 20, plyValue: 1, englishCount: 20.0 },
  { id: 4, name: '21SLB', yarnTypeId: 3, yarnTypeName: 'Slub', yarnCode: 'SLB', countValue: 21, plyValue: 1, englishCount: 21.0 },
  { id: 5, name: '24COMB', yarnTypeId: 1, yarnTypeName: 'Cotton', yarnCode: 'COMB', countValue: 24, plyValue: 1, englishCount: 24.0 },
  { id: 6, name: '30COMB', yarnTypeId: 1, yarnTypeName: 'Cotton', yarnCode: 'COMB', countValue: 30, plyValue: 1, englishCount: 30.0 },
  { id: 7, name: '28CTN', yarnTypeId: 1, yarnTypeName: 'Cotton', yarnCode: 'CTN', countValue: 28, plyValue: 1, englishCount: 28.0 },
  { id: 8, name: '32CTN', yarnTypeId: 1, yarnTypeName: 'Cotton', yarnCode: 'CTN', countValue: 32, plyValue: 1, englishCount: 32.0 },
  { id: 9, name: '34CTN', yarnTypeId: 1, yarnTypeName: 'Cotton', yarnCode: 'CTN', countValue: 34, plyValue: 1, englishCount: 34.0 },
  { id: 10, name: '36CTN', yarnTypeId: 1, yarnTypeName: 'Cotton', yarnCode: 'CTN', countValue: 36, plyValue: 1, englishCount: 36.0 },
  
  // Polyester (PV) Materials
  { id: 11, name: '40PV', yarnTypeId: 2, yarnTypeName: 'Polyester', yarnCode: 'PV', countValue: 40, plyValue: 1, englishCount: 40.0 },
  { id: 12, name: '50PV', yarnTypeId: 2, yarnTypeName: 'Polyester', yarnCode: 'PV', countValue: 50, plyValue: 1, englishCount: 50.0 },
  { id: 13, name: '60PV', yarnTypeId: 2, yarnTypeName: 'Polyester', yarnCode: 'PV', countValue: 60, plyValue: 1, englishCount: 60.0 },
  { id: 14, name: '75PV', yarnTypeId: 2, yarnTypeName: 'Polyester', yarnCode: 'PV', countValue: 75, plyValue: 1, englishCount: 75.0 },
  { id: 15, name: '100PV', yarnTypeId: 2, yarnTypeName: 'Polyester', yarnCode: 'PV', countValue: 100, plyValue: 1, englishCount: 100.0 },
  
  // Denier (DEN) Materials
  { id: 40, name: '2/80', yarnTypeId: 5, yarnTypeName: 'Denier', yarnCode: 'DEN', countValue: 80, plyValue: 2, englishCount: 33.0 },
  { id: 41, name: '2/100', yarnTypeId: 5, yarnTypeName: 'Denier', yarnCode: 'DEN', countValue: 100, plyValue: 2, englishCount: 41.0 },
  { id: 42, name: '2/120', yarnTypeId: 5, yarnTypeName: 'Denier', yarnCode: 'DEN', countValue: 120, plyValue: 2, englishCount: 49.0 },
  { id: 43, name: '150DEN', yarnTypeId: 5, yarnTypeName: 'Denier', yarnCode: 'DEN', countValue: 150, plyValue: 1, englishCount: 150.0 },
  
  // Blended Materials
  { id: 50, name: '2/60 PC', yarnTypeId: 6, yarnTypeName: 'Poly-Cotton', yarnCode: 'PC', countValue: 60, plyValue: 2, englishCount: 30.0 },
  { id: 51, name: '40PC', yarnTypeId: 6, yarnTypeName: 'Poly-Cotton', yarnCode: 'PC', countValue: 40, plyValue: 1, englishCount: 40.0 },
  
  // Add more materials as needed (total 55+)
  // ... (remaining materials follow same pattern)
];

/**
 * Get item by ID from master data
 * @param {number} itemId - Item ID
 * @return {Object|null} Item object or null if not found
 */
function getItemMasterById(itemId) {
  return ITEM_MASTER_DATA.find(item => item.id === itemId) || null;
}

// ============================================================================
// SELVEDGE MASTER DATA
// ============================================================================

/**
 * 57 Selvedge options
 */
var SELVEDGE_DATA = [
  'Select',
  '2/40X40/2 INCH',
  '2/60X60/2 INCH',
  '30X30/1 INCH',
  '40X40/1 INCH',
  '60X60/1 INCH',
  'DOBBY SELVEDGE',
  'PLAIN SELVEDGE',
  'TWILL SELVEDGE',
  // Add remaining 48 selvedge options...
];

// ============================================================================
// SYSTEM SETTINGS DEFAULTS
// ============================================================================

var SYSTEM_SETTINGS_DEFAULTS = {
  COMPANY_NAME: 'RAMRATAN TECHNO WEAVE',
  CURRENT_FY: getCurrentFinancialYear(),
  SORT_MASTER_COUNTER: 0,
  EMAIL_NOTIFICATIONS: 'true',
  TELEGRAM_NOTIFICATIONS: 'true',
  TELEGRAM_BOT_TOKEN: TELEGRAM_CONFIG.BOT_TOKEN,
  SELF_REGISTRATION_ENABLED: 'true',
  ADMIN_EMAIL: 'admin@company.com' // Update this
};

// ============================================================================
// WEB APP CONFIGURATION
// ============================================================================

/**
 * Get the web app URL
 * @return {string} Web app URL
 */
function getWebAppUrl() {
  return ScriptApp.getService().getUrl();
}

/**
 * Get deployed web app URL (for production)
 * @return {string} Deployed web app URL
 */
function getDeployedWebAppUrl() {
  // This will be the deployment URL after deploying as web app
  // Update after deployment
  return 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

var VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  PASSWORD_MIN_LENGTH: 1, // No password policy as per requirement
  SORT_NUMBER: /^[A-Z0-9\/\-]+$/,
  HSN_CODE: /^[0-9]{4,8}$/
};

// ============================================================================
// PAGINATION SETTINGS
// ============================================================================

var PAGINATION = {
  DEFAULT_PAGE_SIZE: 25,
  MAX_PAGE_SIZE: 100
};

// ============================================================================
// STATUS VALUES
// ============================================================================

var STATUS = {
  PENDING: 'Pending',
  COMPLETE: 'Complete',
  ACTIVE: 'Active',
  INACTIVE: 'Inactive'
};

// ============================================================================
// ERROR MESSAGES
// ============================================================================

var ERROR_MESSAGES = {
  SESSION_EXPIRED: 'Your session has expired. Please login again.',
  UNAUTHORIZED: 'You do not have permission to perform this action.',
  INVALID_CREDENTIALS: 'Invalid username or password.',
  USER_NOT_FOUND: 'User not found.',
  EMAIL_EXISTS: 'Email already exists.',
  USERNAME_EXISTS: 'Username already exists.',
  SORT_NUMBER_EXISTS: 'Sort Number with this quality already exists.',
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Invalid email address.',
  INVALID_NUMBER: 'Invalid number.',
  SERVER_ERROR: 'An error occurred. Please try again.',
  NO_PERMISSION: 'You do not have permission to access this resource.'
};

// ============================================================================
// SUCCESS MESSAGES
// ============================================================================

var SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful!',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  USER_CREATED: 'User created successfully.',
  USER_UPDATED: 'User updated successfully.',
  USER_DELETED: 'User deleted successfully.',
  SORT_MASTER_CREATED: 'Sort Master created successfully.',
  SORT_MASTER_UPDATED: 'Sort Master updated successfully.',
  SORT_MASTER_DELETED: 'Sort Master deleted successfully.',
  PASSWORD_RESET_SENT: 'Password reset link sent to your email.',
  PASSWORD_CHANGED: 'Password changed successfully.',
  SETTINGS_UPDATED: 'Settings updated successfully.'
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate UUID v4
 * @return {string} UUID string
 */
function generateUUID() {
  return Utilities.getUuid();
}

/**
 * Get current timestamp
 * @return {Date} Current date/time
 */
function getCurrentTimestamp() {
  return new Date();
}

/**
 * Hash password using SHA-256
 * @param {string} password - Plain text password
 * @return {string} Hashed password
 */
function hashPassword(password) {
  const rawHash = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password,
    Utilities.Charset.UTF_8
  );
  
  let hash = '';
  for (let i = 0; i < rawHash.length; i++) {
    let byte = rawHash[i];
    if (byte < 0) byte += 256;
    let byteStr = byte.toString(16);
    if (byteStr.length === 1) byteStr = '0' + byteStr;
    hash += byteStr;
  }
  
  return hash;
}

/**
 * Log to spreadsheet (for debugging)
 * @param {string} message - Message to log
 * @param {string} level - Log level (INFO, ERROR, WARNING)
 */
function logToSheet(message, level) {
  level = level || 'INFO';
  Logger.log('[' + level + '] ' + message);
  // Can also write to a LOG sheet if needed
}

// ============================================================================
// EXPORT CONFIGURATION
// ============================================================================

/**
 * Test configuration
 * Run this to verify all settings are correct
 */
function testConfiguration() {
  Logger.log('========================================');
  Logger.log('CONFIGURATION TEST');
  Logger.log('========================================');
  
  try {
    Logger.log('Spreadsheet ID: ' + SPREADSHEET_ID);
    Logger.log('Financial Year: ' + getCurrentFinancialYear());
    Logger.log('Web App URL: ' + getWebAppUrl());
    Logger.log('Telegram Enabled: ' + TELEGRAM_CONFIG.ENABLED);
    Logger.log('Email Enabled: ' + EMAIL_CONFIG.ENABLED);
    
    // Test spreadsheet access
    const ss = getSpreadsheet();
    Logger.log('Spreadsheet Name: ' + ss.getName());
    
    Logger.log('========================================');
    Logger.log('CONFIGURATION TEST PASSED ✓');
    Logger.log('========================================');
    
    return true;
  } catch (error) {
    Logger.log('========================================');
    Logger.log('CONFIGURATION TEST FAILED ✗');
    Logger.log('Error: ' + error.message);
    Logger.log('========================================');
    
    return false;
  }
}

function createTestUser() {
  const userData = {
    userName: 'Admin User',
    email: 'admin@company.com',
    customUserId: 'admin',
    password: 'admin123',
    role: 'ADMIN'
  };
  
  const result = register(userData);
  Logger.log(result);
}

function testSpreadsheetAccess() {
  Logger.log('=== TESTING SPREADSHEET ACCESS ===');
  
  try {
    Logger.log('Spreadsheet ID: ' + SPREADSHEET_ID);
    
    const ss = getSpreadsheet();
    Logger.log('✅ Spreadsheet opened successfully!');
    Logger.log('Spreadsheet Name: ' + ss.getName());
    Logger.log('Number of Sheets: ' + ss.getSheets().length);
    
    // Try to get Users sheet
    const usersSheet = getSheet(SHEET_NAMES.USERS);
    Logger.log('✅ Users sheet found!');
    Logger.log('Users sheet rows: ' + usersSheet.getLastRow());
    
    Logger.log('=== TEST PASSED ===');
    
  } catch (error) {
    Logger.log('❌ TEST FAILED');
    Logger.log('Error: ' + error.message);
  }
}