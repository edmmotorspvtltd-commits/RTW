/**
 * ============================================================================
 * SORT MASTER MANAGEMENT SYSTEM 2026
 * Data Fetch Module
 * ============================================================================
 * 
 * Handles all data retrieval operations from Google Sheets.
 * 
 * @version 1.1 - Fixed serialization issues
 * @author Sort Master System
 * @date December 28, 2025
 */

/**
 * ============================================================================
 * PENDING ORDERS
 * ============================================================================
 */

/**
 * Get pending orders from "Pending order for sort" sheet
 * Shows only orders that don't have a Sort Master yet
 * 
 * @param {Object} filters - Filter options
 * @param {number} page - Page number
 * @param {number} limit - Records per page
 * @return {Object} {orders, total, page, totalPages}
 */
function getPendingOrders(filters, page, limit) {
  try {
    Logger.log('getPendingOrders called from Datafetch.gs');
    
    const pendingSheet = getSheet(SHEET_NAMES.PENDING_ORDERS);
    const pendingData = pendingSheet.getDataRange().getValues();
    
    const sortMasterSheet = getSheet(SHEET_NAMES.SORT_MASTER);
    const sortMasterData = sortMasterSheet.getDataRange().getValues();
    
    // Build set of RTWE numbers that have Sort Masters
    const rtweWithSortMaster = new Set();
    for (let i = 1; i < sortMasterData.length; i++) {
      const rtweNo = sortMasterData[i][2]; // Column C - rtweNo
      if (rtweNo) {
        rtweWithSortMaster.add(rtweNo);
      }
    }
    
    // Get pending orders
    const orders = [];
    
    for (let i = 1; i < pendingData.length; i++) {
      const rtweNo = pendingData[i][0];
      const brokerName = pendingData[i][1];
      const quality = pendingData[i][2];
      const date = pendingData[i][3];
      const status = pendingData[i][4];
      
      // Skip if Sort Master already exists
      if (rtweWithSortMaster.has(rtweNo)) {
        continue;
      }
      
      // Apply filters
      if (filters) {
        if (filters.rtweNo && !rtweNo.toString().includes(filters.rtweNo)) continue;
        if (filters.broker && !brokerName.toLowerCase().includes(filters.broker.toLowerCase())) continue;
        if (filters.quality && !quality.toLowerCase().includes(filters.quality.toLowerCase())) continue;
      }
      
      // Convert Date to string to avoid serialization issues
      let dateStr = '';
      if (date) {
        try {
          dateStr = date instanceof Date ? date.toISOString() : String(date);
        } catch(e) {
          dateStr = String(date);
        }
      }
      
      orders.push({
        rtweNo: String(rtweNo || ''),
        brokerName: String(brokerName || ''),
        quality: String(quality || ''),
        date: dateStr,
        status: 'Pending'
      });
    }
    
    const total = orders.length;
    
    // Apply pagination
    page = page || 1;
    limit = limit || PAGINATION.DEFAULT_PAGE_SIZE;
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = orders.slice(startIndex, endIndex);
    
    const totalPages = Math.ceil(total / limit);
    
    Logger.log('Returning ' + paginatedOrders.length + ' pending orders');
    
    return {
      success: true,
      orders: paginatedOrders,
      total: total,
      page: page,
      totalPages: totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    };
    
  } catch (error) {
    Logger.log('getPendingOrders error: ' + error.message);
    return {
      success: false,
      message: 'Error: ' + error.message,
      orders: [],
      total: 0,
      page: 1,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false
    };
  }
}

/**
 * Get pending order by RTWE number
 * @param {string} rtweNo - RTWE number
 * @return {Object|null} Order object or null
 */
function getPendingOrderByRTWE(rtweNo) {
  try {
    Logger.log('getPendingOrderByRTWE called with: ' + rtweNo);
    
    const sheet = getSheet(SHEET_NAMES.PENDING_ORDERS);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      // Use toString() for comparison to handle type mismatch
      if (data[i][0].toString() === rtweNo.toString()) {
        Logger.log('Found order at row ' + i);
        
        // Convert Date to string to avoid serialization issues
        let dateStr = '';
        if (data[i][3]) {
          try {
            dateStr = data[i][3] instanceof Date ? data[i][3].toISOString() : String(data[i][3]);
          } catch(e) {
            dateStr = String(data[i][3]);
          }
        }
        
        return {
          success: true,
          order: {
            rtweNo: String(data[i][0] || ''),
            brokerName: String(data[i][1] || ''),
            quality: String(data[i][2] || ''),
            date: dateStr,
            status: String(data[i][4] || 'Pending')
          }
        };
      }
    }
    
    Logger.log('Order not found for RTWE: ' + rtweNo);
    return { success: false, message: 'Order not found' };
    
  } catch (error) {
    Logger.log('getPendingOrderByRTWE error: ' + error.message);
    return { success: false, message: 'Error: ' + error.message };
  }
}

/**
 * ============================================================================
 * COMPLETE ORDERS (SORT MASTERS)
 * ============================================================================
 */

/**
 * Get complete orders (Sort Masters) with filters and pagination
 * @param {Object} filters - Filter options
 * @param {number} page - Page number
 * @param {number} limit - Records per page
 * @return {Object} {orders, total, page, totalPages}
 */
function getCompleteOrders(filters, page, limit) {
  try {
    Logger.log('getCompleteOrders called from Datafetch.gs');
    
    const sheet = getSheet(SHEET_NAMES.SORT_MASTER);
    const data = sheet.getDataRange().getValues();
    
    Logger.log('SORT_MASTER total rows: ' + data.length);
    
    // Skip if only header row
    if (data.length <= 1) {
      Logger.log('No data rows found in SORT_MASTER');
      return {
        success: true,
        orders: [],
        total: 0,
        page: 1,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false
      };
    }
    
    const orders = [];
    
    for (let i = 1; i < data.length; i++) {
      const sortMasterId = data[i][0];
      const sortMasterNo = data[i][1];
      const rtweNo = data[i][2];
      const brokerName = data[i][3];
      const quality = data[i][4];
      const glm = data[i][35];
      const gsm = data[i][36];
      const width = data[i][13];
      const finalReed = data[i][12];
      const totalPicks = data[i][17];
      const createdDate = data[i][64];
      const createdByName = data[i][66];
      
      // Skip empty rows
      if (!sortMasterId && !sortMasterNo) {
        Logger.log('Skipping empty row ' + i);
        continue;
      }
      
      Logger.log('Processing row ' + i + ': sortMasterNo=' + sortMasterNo);
      
      // Apply filters
      if (filters) {
        if (filters.sortMasterNo && !sortMasterNo.toString().includes(filters.sortMasterNo)) continue;
        if (filters.rtweNo && !rtweNo.toString().includes(filters.rtweNo)) continue;
        if (filters.broker && !brokerName.toLowerCase().includes(filters.broker.toLowerCase())) continue;
        if (filters.quality && !quality.toLowerCase().includes(filters.quality.toLowerCase())) continue;
      }
      
      // Convert Date to string to avoid serialization issues
      let createdDateStr = '';
      if (createdDate) {
        try {
          createdDateStr = createdDate instanceof Date ? createdDate.toISOString() : String(createdDate);
        } catch(e) {
          createdDateStr = String(createdDate);
        }
      }
      
      orders.push({
        sortMasterId: String(sortMasterId || ''),
        sortMasterNo: String(sortMasterNo || ''),
        rtweNo: String(rtweNo || ''),
        brokerName: String(brokerName || ''),
        quality: String(quality || ''),
        glm: String(glm || ''),
        gsm: String(gsm || ''),
        width: String(width || ''),
        reed: String(finalReed || ''),
        picks: String(totalPicks || ''),
        createdDate: createdDateStr,
        createdBy: String(createdByName || '')
      });
    }
    
    // Sort by created date descending
    orders.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
    
    const total = orders.length;
    
    // Apply pagination
    page = page || 1;
    limit = limit || PAGINATION.DEFAULT_PAGE_SIZE;
    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedOrders = orders.slice(startIndex, endIndex);
    
    const totalPages = Math.ceil(total / limit);
    
    Logger.log('Returning ' + paginatedOrders.length + ' complete orders');
    
    return {
      success: true,
      orders: paginatedOrders,
      total: total,
      page: page,
      totalPages: totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    };
    
  } catch (error) {
    Logger.log('getCompleteOrders error: ' + error.message);
    return {
      success: false,
      message: 'Error: ' + error.message,
      orders: [],
      total: 0,
      page: 1,
      totalPages: 0,
      hasNext: false,
      hasPrevious: false
    };
  }
}

/**
 * ============================================================================
 * SORT MASTER DETAILS
 * ============================================================================
 */

/**
 * Get Sort Master by ID
 * @param {number} sortMasterId - Sort Master ID
 * @return {Object|null} Sort Master object or null
 */
function getSortMasterById(sortMasterId) {
  try {
    Logger.log('getSortMasterById called with: ' + sortMasterId + ' (type: ' + typeof sortMasterId + ')');
    
    const sheet = getSheet(SHEET_NAMES.SORT_MASTER);
    const data = sheet.getDataRange().getValues();
    
    // Convert sortMasterId to string for comparison (handles both number and string inputs)
    const searchId = String(sortMasterId);
    
    for (let i = 1; i < data.length; i++) {
      const rowId = String(data[i][0]);
      if (rowId === searchId) {
        Logger.log('Found Sort Master at row ' + i);
        return buildSortMasterObject(data[i]);
      }
    }
    
    Logger.log('Sort Master not found for ID: ' + sortMasterId);
    return null;
    
  } catch (error) {
    Logger.log('getSortMasterById error: ' + error.message);
    return null;
  }
}

/**
 * Get Sort Master by RTWE number
 * @param {string} rtweNo - RTWE number
 * @return {Object|null} Sort Master object or null
 */
function getSortMasterByRTWE(rtweNo) {
  try {
    const sheet = getSheet(SHEET_NAMES.SORT_MASTER);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][2] === rtweNo) {
        return buildSortMasterObject(data[i]);
      }
    }
    
    return null;
    
  } catch (error) {
    Logger.log('getSortMasterByRTWE error: ' + error.message);
    return null;
  }
}

/**
 * Get Sort Master by Sort Master Number
 * @param {string} sortMasterNo - Sort Master Number
 * @return {Object|null} Sort Master object or null
 */
function getSortMasterByNumber(sortMasterNo) {
  try {
    const sheet = getSheet(SHEET_NAMES.SORT_MASTER);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === sortMasterNo) {
        return buildSortMasterObject(data[i]);
      }
    }
    
    return null;
    
  } catch (error) {
    Logger.log('getSortMasterByNumber error: ' + error.message);
    return null;
  }
}

/**
 * Build Sort Master object from row data - FIXED VERSION
 * Ensures all values are properly serializable (no Date objects, no undefined)
 * @param {Array} row - Row data from sheet
 * @return {Object} Sort Master object
 */
function buildSortMasterObject(row) {
  // Helper function to safely convert dates to ISO strings
  function dateToString(value) {
    if (!value) return '';
    if (value instanceof Date) return value.toISOString();
    return String(value);
  }
  
  // Helper function to safely convert to number
  function toNumber(value) {
    if (value === null || value === undefined || value === '') return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }
  
  // Helper function to safely convert to string
  function toString(value) {
    if (value === null || value === undefined) return '';
    return String(value);
  }
  
  return {
    sortMasterId: toString(row[0]),
    sortMasterNo: toString(row[1]),
    rtweNo: toString(row[2]),
    brokerName: toString(row[3]),
    quality: toString(row[4]),
    fabricType: toString(row[5]),
    sheddingMechanismId: toString(row[6]),
    weaveName: toString(row[7]),
    isExportOrder: toNumber(row[8]),
    composition: toString(row[9]),
    reed: toNumber(row[10]),
    denting: toNumber(row[11]),
    finalReed: toNumber(row[12]),
    width: toNumber(row[13]),
    threadOrGala: toNumber(row[14]),
    reedSpace: toNumber(row[15]),
    totalEnds: toNumber(row[16]),
    totalPicks: toNumber(row[17]),
    pickInsert: toNumber(row[18]),
    widthInCms: toNumber(row[19]),
    selvedgeId: toString(row[20]),
    selvedgeName: toString(row[21]),
    dents: toNumber(row[22]),
    selvedgeWidth: toNumber(row[23]),
    endsPerDents: toNumber(row[24]),
    selvedgeEnds: toNumber(row[25]),
    selvedgeWidthType: toString(row[26]),
    beamType: toString(row[27]),
    selvedgeDrawing: toString(row[28]),
    paperTubeSizeId: toString(row[29]),
    paperTubeSizeName: toString(row[30]),
    totalWarpPattern: toNumber(row[31]),
    totalWeftPattern: toNumber(row[32]),
    totalWarpGrmsPerMtr: toNumber(row[33]),
    totalWeftGrmsPerMtr: toNumber(row[34]),
    glm: toNumber(row[35]),
    gsm: toNumber(row[36]),
    glmWithoutWastage: toNumber(row[37]),
    gsmWithoutWastage: toNumber(row[38]),
    loomType: toString(row[39]),
    loomTypeName: toString(row[40]),
    sizePickUp: toNumber(row[41]),
    hsnCode: toString(row[42]),
    hsnDescription: toString(row[43]),
    igstPercent: toNumber(row[44]),
    cgstPercent: toNumber(row[45]),
    sgstPercent: toNumber(row[46]),
    cessPercent: toNumber(row[47]),
    actGlm: toNumber(row[48]),
    actGsm: toNumber(row[49]),
    onLoom: toString(row[50]),
    sortDrawing: toString(row[51]),
    pegPlan: toString(row[52]),
    printOnBill: row[53] === true || row[53] === 'TRUE',
    qualityDetails: toString(row[54]),
    qualitySortNo: toString(row[55]),
    displayQuality: toString(row[56]),
    isMasterQuality: row[57] === true || row[57] === 'TRUE',
    masterQuality: toString(row[58]),
    remark: toString(row[59]),
    isActive: row[60] === true || row[60] === 'TRUE',
    designPaperImage: toString(row[61]),
    fabricImage: toString(row[62]),
    l2l: toString(row[63]),
    status: toString(row[64]),
    createdDate: dateToString(row[65]),
    createdBy: toString(row[66]),
    createdByName: toString(row[67]),
    modifiedDate: dateToString(row[68]),
    modifiedBy: toString(row[69]),
    modifiedByName: toString(row[70])
  };
}

/**
 * ============================================================================
 * WARP/WEFT DETAILS
 * ============================================================================
 */

/**
 * Get warp details for a Sort Master
 * @param {number} sortMasterId - Sort Master ID
 * @return {Array} Array of warp detail objects
 */
function getWarpDetails(sortMasterId) {
  try {
    const sheet = getSheet(SHEET_NAMES.WARP_DETAILS);
    const data = sheet.getDataRange().getValues();
    
    const warpRows = [];
    const searchId = String(sortMasterId);
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][1]) === searchId) {
        warpRows.push({
          warpDetailsId: String(data[i][0] || ''),
          sortMasterId: String(data[i][1] || ''),
          beamTypeId: String(data[i][2] || ''),
          beamTypeName: String(data[i][3] || ''),
          pattern: parseFloat(data[i][4]) || 0,
          itemId: String(data[i][5] || ''),
          itemName: String(data[i][6] || ''),
          yarnTypeId: String(data[i][7] || ''),
          yarnTypeName: String(data[i][8] || ''),
          uomId: String(data[i][9] || ''),
          uomName: String(data[i][10] || ''),
          fabricCountId: String(data[i][11] || ''),
          fabricPlyId: String(data[i][12] || ''),
          yarnVarietyId: String(data[i][13] || ''),
          yarnVarietyName: String(data[i][14] || ''),
          noOfCounts: parseFloat(data[i][15]) || 0,
          ply: parseFloat(data[i][16]) || 0,
          yarnCode: String(data[i][17] || ''),
          englishCount: parseFloat(data[i][18]) || 0,
          wastePerShrink: parseFloat(data[i][19]) || 0,
          ends: parseFloat(data[i][20]) || 0,
          grmsPerMtr: parseFloat(data[i][21]) || 0,
          grmsPerMtr_NoShrinkage: parseFloat(data[i][22]) || 0,
          rowOrder: parseFloat(data[i][23]) || 0
        });
      }
    }
    
    // Sort by rowOrder
    warpRows.sort((a, b) => a.rowOrder - b.rowOrder);
    
    return warpRows;
    
  } catch (error) {
    Logger.log('getWarpDetails error: ' + error.message);
    return [];
  }
}

/**
 * Get weft details for a Sort Master
 * @param {number} sortMasterId - Sort Master ID
 * @return {Array} Array of weft detail objects
 */
function getWeftDetails(sortMasterId) {
  try {
    const sheet = getSheet(SHEET_NAMES.WEFT_DETAILS);
    const data = sheet.getDataRange().getValues();
    
    const weftRows = [];
    const searchId = String(sortMasterId);
    
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][1]) === searchId) {
        weftRows.push({
          weftDetailsId: String(data[i][0] || ''),
          sortMasterId: String(data[i][1] || ''),
          pattern: parseFloat(data[i][2]) || 0,
          itemId: String(data[i][3] || ''),
          itemName: String(data[i][4] || ''),
          yarnTypeId: String(data[i][5] || ''),
          yarnTypeName: String(data[i][6] || ''),
          uomId: String(data[i][7] || ''),
          uomName: String(data[i][8] || ''),
          fabricCountId: String(data[i][9] || ''),
          fabricPlyId: String(data[i][10] || ''),
          yarnVarietyId: String(data[i][11] || ''),
          yarnVarietyName: String(data[i][12] || ''),
          noOfCounts: parseFloat(data[i][13]) || 0,
          ply: parseFloat(data[i][14]) || 0,
          yarnCode: String(data[i][15] || ''),
          englishCount: parseFloat(data[i][16]) || 0,
          wastePerShrink: parseFloat(data[i][17]) || 0,
          picks: parseFloat(data[i][18]) || 0,
          grmsPerMtr: parseFloat(data[i][19]) || 0,
          grmsPerMtr_NoShrinkage: parseFloat(data[i][20]) || 0,
          rowOrder: parseFloat(data[i][21]) || 0
        });
      }
    }
    
    // Sort by rowOrder
    weftRows.sort((a, b) => a.rowOrder - b.rowOrder);
    
    return weftRows;
    
  } catch (error) {
    Logger.log('getWeftDetails error: ' + error.message);
    return [];
  }
}

/**
 * Get complete Sort Master with warp/weft details
 * @param {number} sortMasterId - Sort Master ID
 * @return {Object|null} Complete Sort Master object or null
 */
function getCompleteSortMaster(sortMasterId) {
  try {
    Logger.log('getCompleteSortMaster called with: ' + sortMasterId);
    
    const sortMaster = getSortMasterById(sortMasterId);
    
    Logger.log('getSortMasterById returned: ' + (sortMaster ? 'object with sortMasterNo: ' + sortMaster.sortMasterNo : 'null'));
    
    if (!sortMaster) {
      Logger.log('Sort Master is null, returning null');
      return null;
    }
    
    sortMaster.warpDetails = getWarpDetails(sortMasterId);
    sortMaster.weftDetails = getWeftDetails(sortMasterId);
    
    Logger.log('Returning sortMaster with ' + (sortMaster.warpDetails ? sortMaster.warpDetails.length : 0) + ' warp rows and ' + (sortMaster.weftDetails ? sortMaster.weftDetails.length : 0) + ' weft rows');
    
    return sortMaster;
    
  } catch (error) {
    Logger.log('getCompleteSortMaster error: ' + error.message);
    return null;
  }
}

/**
 * ============================================================================
 * SEARCH & FILTER
 * ============================================================================
 */

/**
 * Search Sort Masters
 * @param {string} searchText - Search text
 * @param {string} searchBy - Field to search (sortMasterNo, rtweNo, quality, broker)
 * @return {Array} Array of matching Sort Masters
 */
function searchSortMasters(searchText, searchBy) {
  try {
    const sheet = getSheet(SHEET_NAMES.SORT_MASTER);
    const data = sheet.getDataRange().getValues();
    
    const results = [];
    
    for (let i = 1; i < data.length; i++) {
      let match = false;
      
      if (searchBy === 'sortMasterNo') {
        match = data[i][1] && data[i][1].toString().includes(searchText);
      } else if (searchBy === 'rtweNo') {
        match = data[i][2] && data[i][2].toString().includes(searchText);
      } else if (searchBy === 'quality') {
        match = data[i][4] && data[i][4].toLowerCase().includes(searchText.toLowerCase());
      } else if (searchBy === 'broker') {
        match = data[i][3] && data[i][3].toLowerCase().includes(searchText.toLowerCase());
      } else {
        // Search all fields
        match = (data[i][1] && data[i][1].toString().includes(searchText)) ||
                (data[i][2] && data[i][2].toString().includes(searchText)) ||
                (data[i][3] && data[i][3].toLowerCase().includes(searchText.toLowerCase())) ||
                (data[i][4] && data[i][4].toLowerCase().includes(searchText.toLowerCase()));
      }
      
      if (match) {
        results.push(buildSortMasterObject(data[i]));
      }
    }
    
    return results;
    
  } catch (error) {
    Logger.log('searchSortMasters error: ' + error.message);
    return [];
  }
}

/**
 * ============================================================================
 * STATISTICS
 * ============================================================================
 */

/**
 * Get dashboard statistics (legacy version)
 * NOTE: Use getStatistics() in Code.gs instead - this is kept for backwards compatibility
 * @return {Object} Statistics object
 */
function getStatisticsLegacy() {
  try {
    const pendingCount = getPendingOrders({}, 1, 10000).total;
    const completeCount = getCompleteOrders({}, 1, 10000).total;
    
    const activityStats = getActivitySummary();
    
    return {
      pendingOrders: pendingCount,
      completeOrders: completeCount,
      totalOrders: pendingCount + completeCount,
      todayActivity: activityStats.today,
      thisWeekActivity: activityStats.thisWeek,
      thisMonthActivity: activityStats.thisMonth
    };
    
  } catch (error) {
    Logger.log('getStatistics error: ' + error.message);
    return {
      pendingOrders: 0,
      completeOrders: 0,
      totalOrders: 0,
      todayActivity: 0,
      thisWeekActivity: 0,
      thisMonthActivity: 0
    };
  }
}

/**
 * Check if RTWE has Sort Master
 * @param {string} rtweNo - RTWE number
 * @return {boolean} True if Sort Master exists
 */
function checkRTWEExists(rtweNo) {
  const sortMaster = getSortMasterByRTWE(rtweNo);
  return sortMaster !== null;
}