/**
 * ============================================================================
 * SORT MASTER MANAGEMENT SYSTEM 2026
 * Form Handlers Module
 * ============================================================================
 * 
 * Handles all form submissions and AJAX requests from HTML pages.
 * Routes requests to appropriate service functions.
 * 
 * @version 1.0
 * @author Sort Master System
 * @date December 25, 2025
 */

/**
 * ============================================================================
 * SORT MASTER FORM HANDLERS
 * ============================================================================
 */

/**
 * Handle Sort Master form submission
 * @param {Object} data - Form data with action
 * @return {Object} {success, message, sortMasterId, sortMasterNo}
 */
function handleSortMasterSubmission(data) {
  try {
    const action = data.action;
    const formData = data.formData;
    const sessionId = data.sessionId;
    
    // Validate session
    const session = validateSession(sessionId);
    if (!session) {
      return {
        success: false,
        message: ERROR_MESSAGES.SESSION_EXPIRED
      };
    }
    
    // Add user info to form data
    const user = getUserById(session.userId);
    formData.userId = user.userId;
    formData.userName = user.userName;
    
    // Route based on action
    if (action === 'save') {
      // Save without notifications
      return saveSortMaster(formData, false);
      
    } else if (action === 'saveAndShare') {
      // Save with notifications
      return saveSortMaster(formData, true);
      
    } else if (action === 'update') {
      // Update existing Sort Master
      return updateSortMaster(formData.sortMasterId, formData);
      
    } else {
      return {
        success: false,
        message: 'Invalid action'
      };
    }
    
  } catch (error) {
    Logger.log('handleSortMasterSubmission error: ' + error.message);
    return {
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    };
  }
}

/**
 * Handle get Sort Master by ID
 * @param {Object} data - Request data
 * @return {Object} {success, sortMaster}
 */
function handleGetSortMasterById(data) {
  try {
    const sessionId = data.sessionId;
    const sortMasterId = data.sortMasterId;
    
    // Validate session
    const session = validateSession(sessionId);
    if (!session) {
      return {
        success: false,
        message: ERROR_MESSAGES.SESSION_EXPIRED
      };
    }
    
    // Get complete Sort Master with warp/weft
    const sortMaster = getCompleteSortMaster(sortMasterId);
    
    if (!sortMaster) {
      return {
        success: false,
        message: 'Sort Master not found'
      };
    }
    
    // Log view action
    logView(session.userId, AUDIT_MODULES.SORT_MASTER, sortMasterId);
    
    return {
      success: true,
      sortMaster: sortMaster
    };
    
  } catch (error) {
    Logger.log('handleGetSortMasterById error: ' + error.message);
    return {
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    };
  }
}

/**
 * ============================================================================
 * DATA FETCH HANDLERS
 * ============================================================================
 */

/**
 * Handle get pending orders request
 * @param {Object} data - Request data
 * @return {Object} {success, orders, total, page, totalPages}
 */
function handleGetPendingOrdersRequest(data) {
  try {
    const sessionId = data.sessionId;
    const filters = data.filters || {};
    const page = data.page || 1;
    const limit = data.limit || 25;
    
    // Validate session
    const session = validateSession(sessionId);
    if (!session) {
      return {
        success: false,
        message: ERROR_MESSAGES.SESSION_EXPIRED
      };
    }
    
    const result = getPendingOrders(filters, page, limit);
    
    return {
      success: true,
      orders: result.orders,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      hasNext: result.hasNext,
      hasPrevious: result.hasPrevious
    };
    
  } catch (error) {
    Logger.log('handleGetPendingOrdersRequest error: ' + error.message);
    return {
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    };
  }
}

/**
 * Handle get complete orders request
 * @param {Object} data - Request data
 * @return {Object} {success, orders, total, page, totalPages}
 */
function handleGetCompleteOrdersRequest(data) {
  try {
    const sessionId = data.sessionId;
    const filters = data.filters || {};
    const page = data.page || 1;
    const limit = data.limit || 25;
    
    // Validate session
    const session = validateSession(sessionId);
    if (!session) {
      return {
        success: false,
        message: ERROR_MESSAGES.SESSION_EXPIRED
      };
    }
    
    const result = getCompleteOrders(filters, page, limit);
    
    return {
      success: true,
      orders: result.orders,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      hasNext: result.hasNext,
      hasPrevious: result.hasPrevious
    };
    
  } catch (error) {
    Logger.log('handleGetCompleteOrdersRequest error: ' + error.message);
    return {
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    };
  }
}

/**
 * Handle get pending order by RTWE
 * @param {Object} data - Request data
 * @return {Object} {success, order}
 */
function handleGetPendingOrderByRTWE(data) {
  try {
    const sessionId = data.sessionId;
    const rtweNo = data.rtweNo;
    
    // Validate session
    const session = validateSession(sessionId);
    if (!session) {
      return {
        success: false,
        message: ERROR_MESSAGES.SESSION_EXPIRED
      };
    }
    
    const order = getPendingOrderByRTWE(rtweNo);
    
    if (!order) {
      return {
        success: false,
        message: 'Order not found'
      };
    }
    
    return {
      success: true,
      order: order
    };
    
  } catch (error) {
    Logger.log('handleGetPendingOrderByRTWE error: ' + error.message);
    return {
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    };
  }
}

/**
 * ============================================================================
 * MASTER DATA HANDLERS
 * ============================================================================
 */

/**
 * Handle get item master data
 * @param {Object} data - Request data
 * @return {Object} {success, items}
 */
function handleGetItemMaster(data) {
  try {
    const sessionId = data.sessionId;
    
    // Validate session
    const session = validateSession(sessionId);
    if (!session) {
      return {
        success: false,
        message: ERROR_MESSAGES.SESSION_EXPIRED
      };
    }
    
    const items = getItemMasterForDropdown();
    
    return {
      success: true,
      items: items
    };
    
  } catch (error) {
    Logger.log('handleGetItemMaster error: ' + error.message);
    return {
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    };
  }
}

/**
 * Handle get weave master data
 * @param {Object} data - Request data
 * @return {Object} {success, weaves}
 */
function handleGetWeaveMaster(data) {
  try {
    const sessionId = data.sessionId;
    
    // Validate session
    const session = validateSession(sessionId);
    if (!session) {
      return {
        success: false,
        message: ERROR_MESSAGES.SESSION_EXPIRED
      };
    }
    
    const weaves = getWeaveMasterForDropdown();
    
    return {
      success: true,
      weaves: weaves
    };
    
  } catch (error) {
    Logger.log('handleGetWeaveMaster error: ' + error.message);
    return {
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    };
  }
}

/**
 * ============================================================================
 * USER MANAGEMENT HANDLERS
 * ============================================================================
 */

/**
 * Handle get all users (Admin only)
 * @param {Object} data - Request data
 * @return {Object} {success, users}
 */
function handleGetAllUsers(data) {
  try {
    const sessionId = data.sessionId;
    
    // Validate session
    const session = validateSession(sessionId);
    if (!session) {
      return {
        success: false,
        message: ERROR_MESSAGES.SESSION_EXPIRED
      };
    }
    
    // Check permission
    const permission = validatePermission(session.userId, 'MANAGE_USERS', AUDIT_MODULES.USER);
    if (!permission.valid) {
      return {
        success: false,
        message: ERROR_MESSAGES.NO_PERMISSION
      };
    }
    
    // Get all users
    const sheet = getSheet(SHEET_NAMES.USERS);
    const data = sheet.getDataRange().getValues();
    
    const users = [];
    
    for (let i = 1; i < data.length; i++) {
      users.push({
        userId: data[i][0],
        userName: data[i][1],
        email: data[i][2],
        customUserId: data[i][3],
        role: data[i][6],
        isActive: data[i][7],
        createdDate: data[i][8],
        lastLogin: data[i][10]
      });
    }
    
    return {
      success: true,
      users: users
    };
    
  } catch (error) {
    Logger.log('handleGetAllUsers error: ' + error.message);
    return {
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    };
  }
}

/**
 * Handle create user (Admin only)
 * @param {Object} data - Request data
 * @return {Object} {success, message, userId}
 */
function handleCreateUser(data) {
  try {
    const sessionId = data.sessionId;
    const userData = data.userData;
    
    // Validate session
    const session = validateSession(sessionId);
    if (!session) {
      return {
        success: false,
        message: ERROR_MESSAGES.SESSION_EXPIRED
      };
    }
    
    // Check permission
    const permission = validatePermission(session.userId, 'MANAGE_USERS', AUDIT_MODULES.USER);
    if (!permission.valid) {
      return {
        success: false,
        message: ERROR_MESSAGES.NO_PERMISSION
      };
    }
    
    // Validate user data
    const validation = validateUserForm(userData, false);
    if (!validation.valid) {
      return {
        success: false,
        message: 'Validation failed: ' + validation.errors.join(', '),
        errors: validation.errors
      };
    }
    
    // Check if email exists
    if (checkEmailExists(userData.email, null)) {
      return {
        success: false,
        message: ERROR_MESSAGES.EMAIL_EXISTS
      };
    }
    
    // Check if username exists
    if (checkUsernameExists(userData.customUserId, null)) {
      return {
        success: false,
        message: ERROR_MESSAGES.USERNAME_EXISTS
      };
    }
    
    // Create user
    const userId = createUser(userData, session.userId);
    
    if (!userId) {
      return {
        success: false,
        message: 'Failed to create user'
      };
    }
    
    // Send welcome email
    if (EMAIL_CONFIG.ENABLED && userData.emailNotifications) {
      sendUserCreationEmail(userData.email, userData.userName, userData.password);
    }
    
    return {
      success: true,
      message: SUCCESS_MESSAGES.USER_CREATED,
      userId: userId
    };
    
  } catch (error) {
    Logger.log('handleCreateUser error: ' + error.message);
    return {
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    };
  }
}

/**
 * ============================================================================
 * STATISTICS HANDLERS
 * ============================================================================
 */

/**
 * Handle get dashboard statistics
 * @param {Object} data - Request data
 * @return {Object} {success, stats}
 */
function handleGetStatistics(data) {
  try {
    const sessionId = data.sessionId;
    
    // Validate session
    const session = validateSession(sessionId);
    if (!session) {
      return {
        success: false,
        message: ERROR_MESSAGES.SESSION_EXPIRED
      };
    }
    
    const stats = getStatistics();
    
    return {
      success: true,
      stats: stats
    };
    
  } catch (error) {
    Logger.log('handleGetStatistics error: ' + error.message);
    return {
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    };
  }
}

/**
 * ============================================================================
 * SEARCH HANDLERS
 * ============================================================================
 */

/**
 * Handle search Sort Masters
 * @param {Object} data - Request data
 * @return {Object} {success, results}
 */
function handleSearchSortMasters(data) {
  try {
    const sessionId = data.sessionId;
    const searchText = data.searchText;
    const searchBy = data.searchBy;
    
    // Validate session
    const session = validateSession(sessionId);
    if (!session) {
      return {
        success: false,
        message: ERROR_MESSAGES.SESSION_EXPIRED
      };
    }
    
    const results = searchSortMasters(searchText, searchBy);
    
    return {
      success: true,
      results: results
    };
    
  } catch (error) {
    Logger.log('handleSearchSortMasters error: ' + error.message);
    return {
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    };
  }
}

/**
 * ============================================================================
 * CALCULATION HANDLERS
 * ============================================================================
 */

/**
 * Handle calculate Sort Master values (real-time)
 * @param {Object} data - Form data
 * @return {Object} {success, calculations}
 */
function handleCalculateSortMaster(data) {
  try {
    const formData = data.formData;
    
    const calculations = calculateAllSortMasterValues(formData);
    
    return {
      success: true,
      calculations: calculations
    };
    
  } catch (error) {
    Logger.log('handleCalculateSortMaster error: ' + error.message);
    return {
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    };
  }
}

/**
 * ============================================================================
 * UTILITY HANDLERS
 * ============================================================================
 */

/**
 * Handle preview next Sort Master number
 * @param {Object} data - Request data
 * @return {Object} {success, sortMasterNo}
 */
function handlePreviewSortMasterNo(data) {
  try {
    const sessionId = data.sessionId;
    
    // Validate session
    const session = validateSession(sessionId);
    if (!session) {
      return {
        success: false,
        message: ERROR_MESSAGES.SESSION_EXPIRED
      };
    }
    
    const sortMasterNo = previewNextSortMasterNo();
    
    return {
      success: true,
      sortMasterNo: sortMasterNo
    };
    
  } catch (error) {
    Logger.log('handlePreviewSortMasterNo error: ' + error.message);
    return {
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    };
  }
}

/**
 * Handle check if RTWE exists
 * @param {Object} data - Request data
 * @return {Object} {success, exists}
 */
function handleCheckRTWEExists(data) {
  try {
    const sessionId = data.sessionId;
    const rtweNo = data.rtweNo;
    
    // Validate session
    const session = validateSession(sessionId);
    if (!session) {
      return {
        success: false,
        message: ERROR_MESSAGES.SESSION_EXPIRED
      };
    }
    
    const exists = checkRTWEExists(rtweNo);
    
    return {
      success: true,
      exists: exists
    };
    
  } catch (error) {
    Logger.log('handleCheckRTWEExists error: ' + error.message);
    return {
      success: false,
      message: ERROR_MESSAGES.SERVER_ERROR
    };
  }
}