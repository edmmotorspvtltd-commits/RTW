/**
 * ============================================================================
 * KPI DASHBOARD BACKEND FUNCTIONS - FIXED VERSION
 * ============================================================================
 * Functions to support KPIDashboard.html
 */

/**
 * Get KPI Dashboard Data
 * Called by KPIDashboard.html
 * FIXED: Use correct sheet names and column indices
 */
function getKPIDashboardData(sessionId) {
  try {
    Logger.log('========================================');
    Logger.log('🔍 getKPIDashboardData called');
    Logger.log('========================================');
    
    // Validate session
    const session = getSessionData(sessionId);
    if (!session) {
      throw new Error('Invalid session');
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // FIXED: Use correct sheet names (same as getDashboardStats in Code.gs)
    const pendingData = getSheetDataForKPI(ss, 'PENDING_DATA');
    const approvedData = getSheetDataForKPI(ss, 'PENDING_APPROVED');
    const confirmedData = getSheetDataForKPI(ss, 'ORDER_CONFIRM_DATA');
    const closedData = getSheetDataForKPI(ss, 'ENQUIRY_CLOSED_DATA');
    
    Logger.log('📊 Data counts:');
    Logger.log('  Pending: ' + pendingData.length);
    Logger.log('  Approved: ' + approvedData.length);
    Logger.log('  Confirmed: ' + confirmedData.length);
    Logger.log('  Closed: ' + closedData.length);
    
    // Combine all data
    const allData = [
      ...pendingData,
      ...approvedData,
      ...confirmedData,
      ...closedData
    ];

    // Calculate KPIs
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    let totalEnquiries = allData.length;
    let thisMonth = 0;
    let todayCount = 0;
    let pending = pendingData.length;
    let approved = approvedData.length;
    let activeOrders = confirmedData.length;
    let totalValue = 0;
    let totalMTR = 0;
    let openValue = 0;
    
    // COLUMN INDICES - 0-based (array indices)
    // These work for PENDING_DATA, PENDING_APPROVED, and ORDER_CONFIRM_DATA
    // All sheets have the same structure (44 columns)
    const COL_RTWE_NO = 0;        // Column A (1)
    const COL_COSTING_NO = 1;     // Column B (2)
    const COL_ENQ_DATE = 2;       // Column C (3)
    const COL_ENQ_TIME = 3;       // Column D (4)
    const COL_BROKER = 4;         // Column E (5)
    const COL_QUALITY = 5;        // Column F (6)
    const COL_GIVEN_RATE = 6;     // Column G (7)
    const COL_BUYER = 11;         // Column L (12) - Only in ORDER_CONFIRM_DATA
    const COL_TOTAL_MTR = 29;     // Column AD (30)
    const COL_TOTAL_VALUE = 30;   // Column AE (31)
    const COL_DELIVERY = 37;      // Column AL (38)
    
    Logger.log('📊 Processing data...');
    
    // Calculate metrics from ALL data
    allData.forEach(row => {
      // Parse enquiry date
      const enqDate = parseDateValue(row[COL_ENQ_DATE]);
      
      if (enqDate) {
        if (enqDate >= thisMonthStart) thisMonth++;
        if (enqDate >= today) todayCount++;
      }
      
      // Sum up values (handle both number and string formats)
      const orderValue = parseFloat(String(row[COL_TOTAL_VALUE]).replace(/[^0-9.-]/g, '')) || 0;
      const mtr = parseFloat(String(row[COL_TOTAL_MTR]).replace(/[^0-9.-]/g, '')) || 0;
      
      totalValue += orderValue;
      totalMTR += mtr;
    });
    
    Logger.log(`  Total Value calculated: ₹${totalValue}`);
    Logger.log(`  Total MTR calculated: ${totalMTR}`);
    
    // Calculate open value from pending and approved sheets only
    [...pendingData, ...approvedData].forEach(row => {
      const orderValue = parseFloat(String(row[COL_TOTAL_VALUE]).replace(/[^0-9.-]/g, '')) || 0;
      openValue += orderValue;
    });
    
    // Calculate conversion rate
    const conversion = totalEnquiries > 0 
      ? Math.round((confirmedData.length / totalEnquiries) * 100) 
      : 0;
    
    // Get recent orders from ALL sheets (not just confirmed)
    // Show the most recent 10 enquiries regardless of status
    const allEnquiries = allData
      .map(row => {
        const enqDate = parseDateValue(row[COL_ENQ_DATE]);
        return {
          rtweNo: row[COL_RTWE_NO] || '-',
          costingNo: row[COL_COSTING_NO] || '-',
          enqDate: formatDateValue(row[COL_ENQ_DATE]),
          enqDateObj: enqDate,
          buyer: row[COL_BUYER] || '-',
          broker: row[COL_BROKER] || '-',
          quality: row[COL_QUALITY] || '-',
          status: 'Enquiry',
          delivery: formatDateValue(row[COL_DELIVERY]),
          mtr: row[COL_TOTAL_MTR] || '-',
          value: parseFloat(String(row[COL_TOTAL_VALUE]).replace(/[^0-9.-]/g, '')) || 0
        };
      })
      .sort((a, b) => {
        // Sort by date descending (newest first)
        if (!a.enqDateObj) return 1;
        if (!b.enqDateObj) return -1;
        return b.enqDateObj - a.enqDateObj;
      })
      .slice(0, 10)
      .map(({ enqDateObj, ...rest }) => rest); // Remove the date object used for sorting
    
    // Get broker performance from ALL enquiries
    Logger.log('📊 Calculating broker performance...');
    const brokerStats = {};
    
    allData.forEach(row => {
      const broker = String(row[COL_BROKER] || '').trim();
      if (!broker || broker === 'Unknown') return;
      
      const value = parseFloat(String(row[COL_TOTAL_VALUE]).replace(/[^0-9.-]/g, '')) || 0;
      
      if (!brokerStats[broker]) {
        brokerStats[broker] = { orders: 0, value: 0 };
      }
      brokerStats[broker].orders++;
      brokerStats[broker].value += value;
    });
    
    const brokerPerformance = Object.keys(brokerStats)
      .map(broker => ({
        broker: broker,
        orders: brokerStats[broker].orders,
        value: Math.round(brokerStats[broker].value)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Show top 10 brokers
    
    Logger.log(`  Found ${brokerPerformance.length} brokers`);
    
    // Get monthly summary from ALL enquiries (last 12 months)
    Logger.log('📊 Calculating monthly summary...');
    const monthlyStats = {};
    
    allData.forEach(row => {
      const enqDate = parseDateValue(row[COL_ENQ_DATE]);
      if (enqDate) {
        const monthKey = enqDate.getFullYear() + '-' + String(enqDate.getMonth() + 1).padStart(2, '0');
        const monthName = enqDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        const value = parseFloat(String(row[COL_TOTAL_VALUE]).replace(/[^0-9.-]/g, '')) || 0;
        
        if (!monthlyStats[monthKey]) {
          monthlyStats[monthKey] = { month: monthName, orders: 0, value: 0 };
        }
        monthlyStats[monthKey].orders++;
        monthlyStats[monthKey].value += value;
      }
    });
    
    const monthlySummary = Object.keys(monthlyStats)
      .map(key => ({
        month: monthlyStats[key].month,
        orders: monthlyStats[key].orders,
        value: Math.round(monthlyStats[key].value)
      }))
      .sort((a, b) => b.month.localeCompare(a.month))
      .slice(0, 12); // Show last 12 months
    
    Logger.log(`  Found ${monthlySummary.length} months with data`);
    
    const result = {
      totalEnquiries: totalEnquiries,
      thisMonth: thisMonth,
      today: todayCount,
      pending: pending,
      approved: approved,
      conversion: conversion,
      activeOrders: activeOrders,
      totalValue: Math.round(totalValue),
      totalMTR: Math.round(totalMTR),
      openValue: Math.round(openValue),
      recentOrders: allEnquiries, // Changed from recentOrders to allEnquiries
      brokerPerformance: brokerPerformance,
      monthlySummary: monthlySummary
    };
    
    Logger.log('📊 KPI Summary:');
    Logger.log('  Total Enquiries: ' + result.totalEnquiries);
    Logger.log('  This Month: ' + result.thisMonth);
    Logger.log('  Pending: ' + result.pending);
    Logger.log('  Approved: ' + result.approved);
    Logger.log('  Active Orders: ' + result.activeOrders);
    Logger.log('  Total Value: ₹' + result.totalValue);
    Logger.log('========================================');
    
    return result;
    
  } catch (error) {
    Logger.log('========================================');
    Logger.log('❌ getKPIDashboardData error: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    Logger.log('========================================');
    throw error;
  }
}

/**
 * Helper: Get sheet data for KPI (unique name to avoid conflicts)
 */
function getSheetDataForKPI(ss, sheetName) {
  try {
    const sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      Logger.log('⚠️ Sheet not found: ' + sheetName);
      return [];
    }
    
    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      Logger.log('⚠️ Sheet empty: ' + sheetName);
      return [];
    }
    
    const data = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
    return data;
  } catch (e) {
    Logger.log('getSheetDataForKPI error for ' + sheetName + ': ' + e.toString());
    return [];
  }
}

/**
 * Helper: Parse date value (unique name to avoid conflicts)
 */
function parseDateValue(dateValue) {
  if (!dateValue) return null;
  
  try {
    if (dateValue instanceof Date) {
      return dateValue;
    }
    
    // Try parsing string date
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date;
    }
  } catch (e) {
    // Ignore parse errors
  }
  
  return null;
}

/**
 * Helper: Format date value (unique name to avoid conflicts)
 */
function formatDateValue(dateValue) {
  const date = parseDateValue(dateValue);
  if (!date) return '-';
  
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Test function to verify KPI data loading
 */
function testKPIDashboard() {
  Logger.clear();
  Logger.log('========================================');
  Logger.log('🧪 TESTING KPI Dashboard Data Loading');
  Logger.log('========================================');
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Test each sheet
  const sheets = ['PENDING_DATA', 'PENDING_APPROVED', 'ORDER_CONFIRM_DATA', 'ENQUIRY_CLOSED_DATA'];
  
  sheets.forEach(sheetName => {
    const data = getSheetDataForKPI(ss, sheetName);
    Logger.log(sheetName + ': ' + data.length + ' rows');
    
    if (data.length > 0) {
      Logger.log('  First row RTWE: ' + data[0][0]);
      Logger.log('  First row Broker: ' + data[0][4]);
      Logger.log('  First row Total Value: ' + data[0][30]);
    }
  });
  
  Logger.log('========================================');
}

