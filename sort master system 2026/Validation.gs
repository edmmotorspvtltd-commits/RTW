/**
 * ============================================================================
 * SORT MASTER MANAGEMENT SYSTEM 2026
 * Validation Module
 * ============================================================================
 * 
 * Handles all input validation, data sanitization, and permission checking.
 * 
 * @version 1.0
 * @author Sort Master System
 * @date December 25, 2025
 */

/**
 * ============================================================================
 * SORT MASTER FORM VALIDATION
 * ============================================================================
 */

/**
 * Validate Sort Master form data
 * @param {Object} formData - Form data object
 * @return {Object} {valid, errors}
 */
function validateSortMasterForm(formData) {
  const errors = [];
  
  try {
    // Required basic fields
    if (!formData.rtweNo || formData.rtweNo.trim() === '') {
      errors.push('RTWE No is required');
    }
    
    if (!formData.brokerName || formData.brokerName.trim() === '') {
      errors.push('Broker Name is required');
    }
    
    if (!formData.fabricType) {
      errors.push('Fabric Type is required');
    }
    
    if (!formData.sheddingMechanismId) {
      errors.push('Weave is required');
    }
    
    if (!formData.isExportOrder && formData.isExportOrder !== 0) {
      errors.push('Create For is required');
    }
    
    // Reed & Width validation
    if (!formData.reed || parseFloat(formData.reed) <= 0) {
      errors.push('Reed must be greater than 0');
    }
    
    if (!formData.denting || parseFloat(formData.denting) <= 0) {
      errors.push('Denting must be greater than 0');
    }
    
    if (!formData.width || parseFloat(formData.width) <= 0) {
      errors.push('Width must be greater than 0');
    }
    
    if (!formData.totalPicks || parseInt(formData.totalPicks) <= 0) {
      errors.push('Total Picks must be greater than 0');
    }
    
    // Warp validation
    if (!formData.warpRows || formData.warpRows.length === 0) {
      errors.push('At least one warp row is required');
    } else {
      const warpValidation = validateWarpRows(formData.warpRows);
      if (!warpValidation.valid) {
        errors.push(...warpValidation.errors);
      }
    }
    
    // Weft validation
    if (!formData.weftRows || formData.weftRows.length === 0) {
      errors.push('At least one weft row is required');
    } else {
      const weftValidation = validateWeftRows(formData.weftRows);
      if (!weftValidation.valid) {
        errors.push(...weftValidation.errors);
      }
    }
    
    // HSN validation
    if (formData.hsnCode && !VALIDATION_RULES.HSN_CODE.test(formData.hsnCode)) {
      errors.push('HSN Code must be 4-8 digits');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
    
  } catch (error) {
    Logger.log('validateSortMasterForm error: ' + error.message);
    return {
      valid: false,
      errors: ['Validation error: ' + error.message]
    };
  }
}

/**
 * Validate warp rows
 * @param {Array} warpRows - Array of warp row objects
 * @return {Object} {valid, errors}
 */
function validateWarpRows(warpRows) {
  const errors = [];
  
  for (let i = 0; i < warpRows.length; i++) {
    const row = warpRows[i];
    const rowNum = i + 1;
    
    if (!row.beamTypeId && !row.beamType) {
      errors.push('Warp Row ' + rowNum + ': Beam Type is required');
    }
    
    if (!row.pattern || parseFloat(row.pattern) <= 0) {
      errors.push('Warp Row ' + rowNum + ': Pattern must be greater than 0');
    }
    
    if (!row.itemId) {
      errors.push('Warp Row ' + rowNum + ': Material is required');
    }
    
    if (!row.englishCount || parseFloat(row.englishCount) <= 0) {
      errors.push('Warp Row ' + rowNum + ': English Count is required');
    }
    
    if (row.wastePerShrink !== undefined && row.wastePerShrink !== null) {
      if (parseFloat(row.wastePerShrink) < 0 || parseFloat(row.wastePerShrink) > 100) {
        errors.push('Warp Row ' + rowNum + ': Shrinkage must be between 0 and 100');
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Validate weft rows
 * @param {Array} weftRows - Array of weft row objects
 * @return {Object} {valid, errors}
 */
function validateWeftRows(weftRows) {
  const errors = [];
  
  for (let i = 0; i < weftRows.length; i++) {
    const row = weftRows[i];
    const rowNum = i + 1;
    
    if (!row.pattern || parseFloat(row.pattern) <= 0) {
      errors.push('Weft Row ' + rowNum + ': Pattern must be greater than 0');
    }
    
    if (!row.itemId) {
      errors.push('Weft Row ' + rowNum + ': Material is required');
    }
    
    if (!row.englishCount || parseFloat(row.englishCount) <= 0) {
      errors.push('Weft Row ' + rowNum + ': English Count is required');
    }
    
    if (row.wastePerShrink !== undefined && row.wastePerShrink !== null) {
      if (parseFloat(row.wastePerShrink) < 0 || parseFloat(row.wastePerShrink) > 100) {
        errors.push('Weft Row ' + rowNum + ': Shrinkage must be between 0 and 100');
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * ============================================================================
 * USER FORM VALIDATION
 * ============================================================================
 */

/**
 * Validate user form data
 * @param {Object} userData - User form data
 * @param {boolean} isEdit - Is this an edit operation?
 * @return {Object} {valid, errors}
 */
function validateUserForm(userData, isEdit) {
  const errors = [];
  
  try {
    // Required fields
    if (!userData.userName || userData.userName.trim() === '') {
      errors.push('Name is required');
    }
    
    if (!userData.email || userData.email.trim() === '') {
      errors.push('Email is required');
    } else if (!VALIDATION_RULES.EMAIL.test(userData.email)) {
      errors.push(ERROR_MESSAGES.INVALID_EMAIL);
    }
    
    if (!userData.customUserId || userData.customUserId.trim() === '') {
      errors.push('Username is required');
    } else if (!VALIDATION_RULES.USERNAME.test(userData.customUserId)) {
      errors.push('Username must be 3-20 characters (letters, numbers, underscore only)');
    }
    
    // Password validation (only for new users)
    if (!isEdit && (!userData.password || userData.password.trim() === '')) {
      errors.push('Password is required');
    }
    
    // Role validation
    if (!userData.role) {
      errors.push('Role is required');
    } else if (!USER_ROLES[userData.role]) {
      errors.push('Invalid role');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
    
  } catch (error) {
    Logger.log('validateUserForm error: ' + error.message);
    return {
      valid: false,
      errors: ['Validation error: ' + error.message]
    };
  }
}

/**
 * ============================================================================
 * FIELD-SPECIFIC VALIDATION
 * ============================================================================
 */

/**
 * Validate email format
 * @param {string} email - Email address
 * @return {boolean} True if valid
 */
function validateEmail(email) {
  if (!email) return false;
  return VALIDATION_RULES.EMAIL.test(email);
}

/**
 * Validate number field
 * @param {any} value - Value to validate
 * @param {number} min - Minimum value (optional)
 * @param {number} max - Maximum value (optional)
 * @return {Object} {valid, error}
 */
function validateNumber(value, min, max) {
  if (value === '' || value === null || value === undefined) {
    return { valid: false, error: 'Value is required' };
  }
  
  const num = parseFloat(value);
  
  if (isNaN(num)) {
    return { valid: false, error: ERROR_MESSAGES.INVALID_NUMBER };
  }
  
  if (min !== undefined && num < min) {
    return { valid: false, error: 'Value must be at least ' + min };
  }
  
  if (max !== undefined && num > max) {
    return { valid: false, error: 'Value must be at most ' + max };
  }
  
  return { valid: true, error: null };
}

/**
 * Validate required field
 * @param {any} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @return {Object} {valid, error}
 */
function validateRequired(value, fieldName) {
  if (value === '' || value === null || value === undefined) {
    return { 
      valid: false, 
      error: fieldName + ' is required' 
    };
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    return { 
      valid: false, 
      error: fieldName + ' is required' 
    };
  }
  
  return { valid: true, error: null };
}

/**
 * ============================================================================
 * UNIQUENESS VALIDATION
 * ============================================================================
 */

/**
 * Check if email is unique
 * @param {string} email - Email to check
 * @param {number} excludeUserId - User ID to exclude (for updates)
 * @return {boolean} True if email is available
 */
function checkUniqueEmail(email, excludeUserId) {
  return !checkEmailExists(email, excludeUserId);
}

/**
 * Check if username is unique
 * @param {string} username - Username to check
 * @param {number} excludeUserId - User ID to exclude (for updates)
 * @return {boolean} True if username is available
 */
function checkUniqueUsername(username, excludeUserId) {
  return !checkUsernameExists(username, excludeUserId);
}

/**
 * Check if sort number with quality is unique
 * @param {string} sortNo - Sort Master No
 * @param {string} quality - Quality
 * @param {number} reedSpace - Reed space
 * @param {number} excludeSortMasterId - Sort Master ID to exclude (for updates)
 * @return {boolean} True if combination is unique
 */
function checkUniqueSortNumber(sortNo, quality, reedSpace, excludeSortMasterId) {
  try {
    const sheet = getSheet(SHEET_NAMES.SORT_MASTER);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (excludeSortMasterId && data[i][0] === excludeSortMasterId) {
        continue;
      }
      
      const existingSortNo = data[i][1];
      const existingQuality = data[i][4];
      const existingReedSpace = data[i][15];
      
      // Check if combination matches
      if (existingSortNo === sortNo && 
          existingQuality === quality && 
          existingReedSpace === reedSpace) {
        return false;
      }
    }
    
    return true;
    
  } catch (error) {
    Logger.log('checkUniqueSortNumber error: ' + error.message);
    return false;
  }
}

/**
 * ============================================================================
 * INPUT SANITIZATION
 * ============================================================================
 */

/**
 * Sanitize HTML input to prevent XSS
 * @param {string} input - Input string
 * @return {string} Sanitized string
 */
function sanitizeInput(input) {
  if (!input || typeof input !== 'string') {
    return input;
  }
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize object recursively
 * @param {Object} obj - Object to sanitize
 * @return {Object} Sanitized object
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const sanitized = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'string') {
        sanitized[key] = sanitizeInput(obj[key]);
      } else if (typeof obj[key] === 'object') {
        sanitized[key] = sanitizeObject(obj[key]);
      } else {
        sanitized[key] = obj[key];
      }
    }
  }
  
  return sanitized;
}

/**
 * ============================================================================
 * PERMISSION VALIDATION
 * ============================================================================
 */

/**
 * Validate user permission for an action
 * @param {number} userId - User ID
 * @param {string} action - Action to perform
 * @param {string} module - Module name
 * @return {Object} {valid, error, user}
 */
function validatePermission(userId, action, module) {
  try {
    const user = getUserById(userId);
    
    if (!user) {
      return {
        valid: false,
        error: ERROR_MESSAGES.USER_NOT_FOUND,
        user: null
      };
    }
    
    if (!user.isActive) {
      return {
        valid: false,
        error: 'Your account has been deactivated.',
        user: null
      };
    }
    
    const role = user.role;
    
    // Map actions to permission keys
    let permissionKey = '';
    
    switch (action) {
      case 'CREATE':
        permissionKey = 'canCreate';
        break;
      case 'EDIT':
        permissionKey = 'canEdit';
        break;
      case 'DELETE':
        permissionKey = 'canDelete';
        break;
      case 'VIEW':
        permissionKey = 'canView';
        break;
      case 'MANAGE_USERS':
        permissionKey = 'canManageUsers';
        break;
      case 'VIEW_AUDIT_LOG':
        permissionKey = 'canViewAuditLog';
        break;
      case 'MANAGE_SETTINGS':
        permissionKey = 'canManageSettings';
        break;
      default:
        permissionKey = 'canView'; // Default to view permission
    }
    
    const hasPermission = ROLE_PERMISSIONS[role] && ROLE_PERMISSIONS[role][permissionKey];
    
    if (!hasPermission) {
      return {
        valid: false,
        error: ERROR_MESSAGES.NO_PERMISSION,
        user: user
      };
    }
    
    return {
      valid: true,
      error: null,
      user: user
    };
    
  } catch (error) {
    Logger.log('validatePermission error: ' + error.message);
    return {
      valid: false,
      error: ERROR_MESSAGES.SERVER_ERROR,
      user: null
    };
  }
}

/**
 * Check if user can perform action
 * @param {string} sessionId - Session ID
 * @param {string} action - Action to perform
 * @param {string} module - Module name
 * @return {Object} {allowed, user, error}
 */
function checkPermission(sessionId, action, module) {
  // Validate session
  const session = validateSession(sessionId);
  
  if (!session) {
    return {
      allowed: false,
      user: null,
      error: ERROR_MESSAGES.SESSION_EXPIRED
    };
  }
  
  // Validate permission
  const permission = validatePermission(session.userId, action, module);
  
  return {
    allowed: permission.valid,
    user: permission.user,
    error: permission.error
  };
}

/**
 * ============================================================================
 * BATCH VALIDATION
 * ============================================================================
 */

/**
 * Validate multiple fields at once
 * @param {Object} fields - Object with field values
 * @param {Object} rules - Validation rules for each field
 * @return {Object} {valid, errors}
 */
function validateFields(fields, rules) {
  const errors = {};
  
  for (const fieldName in rules) {
    if (rules.hasOwnProperty(fieldName)) {
      const rule = rules[fieldName];
      const value = fields[fieldName];
      
      // Check required
      if (rule.required) {
        const requiredCheck = validateRequired(value, fieldName);
        if (!requiredCheck.valid) {
          errors[fieldName] = requiredCheck.error;
          continue;
        }
      }
      
      // Check type
      if (rule.type === 'number' && value !== undefined && value !== null && value !== '') {
        const numberCheck = validateNumber(value, rule.min, rule.max);
        if (!numberCheck.valid) {
          errors[fieldName] = numberCheck.error;
        }
      }
      
      if (rule.type === 'email' && value) {
        if (!validateEmail(value)) {
          errors[fieldName] = ERROR_MESSAGES.INVALID_EMAIL;
        }
      }
      
      // Custom validator
      if (rule.validator && typeof rule.validator === 'function') {
        const customCheck = rule.validator(value);
        if (!customCheck.valid) {
          errors[fieldName] = customCheck.error;
        }
      }
    }
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors: errors
  };
}

/**
 * ============================================================================
 * TESTING
 * ============================================================================
 */

/**
 * Test validation functions
 */
function testValidation() {
  Logger.log('========================================');
  Logger.log('VALIDATION TEST');
  Logger.log('========================================');
  
  // Test email validation
  Logger.log('Email "test@example.com": ' + validateEmail('test@example.com'));
  Logger.log('Email "invalid": ' + validateEmail('invalid'));
  
  // Test number validation
  const numCheck1 = validateNumber(50, 0, 100);
  Logger.log('Number 50 (0-100): ' + numCheck1.valid);
  
  const numCheck2 = validateNumber(150, 0, 100);
  Logger.log('Number 150 (0-100): ' + numCheck2.valid + ' - ' + numCheck2.error);
  
  // Test required validation
  const reqCheck1 = validateRequired('value', 'Field');
  Logger.log('Required "value": ' + reqCheck1.valid);
  
  const reqCheck2 = validateRequired('', 'Field');
  Logger.log('Required "": ' + reqCheck2.valid + ' - ' + reqCheck2.error);
  
  // Test sanitization
  const dirty = '<script>alert("XSS")</script>';
  const clean = sanitizeInput(dirty);
  Logger.log('Sanitize: ' + dirty + ' → ' + clean);
  
  Logger.log('========================================');
  Logger.log('VALIDATION TEST COMPLETE');
  Logger.log('========================================');
}

function validateSession(sessionId) {
  try {
    if (!sessionId) {
      Logger.log('validateSession: No session ID');
      return null;
    }
    
    Logger.log('validateSession: Validating ' + sessionId);
    
    const session = getSession(sessionId);
    
    if (!session) {
      Logger.log('validateSession: Session not found');
      return null;
    }
    
    // Check if session is active
    if (!session.isActive) {
      Logger.log('validateSession: Session inactive');
      return null;
    }
    
    // Check if session has expired
    const now = new Date();
    if (session.expiresAt < now) {
      Logger.log('validateSession: Session expired');
      markSessionInactive(sessionId);
      return null;
    }
    
    // Session is valid - update activity
    updateSessionActivity(sessionId);
    
    Logger.log('validateSession: Session VALID for user ' + session.userId);
    
    // ✅ FIX: Add 'valid' property
    return {
      valid: true,
      sessionId: session.sessionId,
      userId: session.userId,
      isActive: session.isActive,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      ipAddress: session.ipAddress,
      rememberMe: session.rememberMe
    };
    
  } catch (error) {
    Logger.log('validateSession error: ' + error.message);
    return null;
  }
}
