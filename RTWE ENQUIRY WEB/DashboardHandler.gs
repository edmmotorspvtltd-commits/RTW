// ============================================
// DASHBOARD HANDLERS - HTML DASHBOARD SUPPORT
// ============================================

/**
 * Get dashboard statistics (simple counts for Dashboard.html)
 * @param {string} sessionId - The session ID (optional, for authentication)
 */
function getDashboardStats(sessionId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Get all sheets
  const pendingSheet = ss.getSheetByName(CONFIG.SHEETS.PENDING);
  const pendApprSheet = ss.getSheetByName(CONFIG.SHEETS.PENDING_APPROVED);
  const confirmedSheet = ss.getSheetByName(CONFIG.SHEETS.CONFIRMED);
  const closedSheet = ss.getSheetByName(CONFIG.SHEETS.CLOSED);
  
  // Count rows (excluding header)
  const pendingCount = pendingSheet ? Math.max(0, pendingSheet.getLastRow() - 1) : 0;
  const approvedCount = pendApprSheet ? Math.max(0, pendApprSheet.getLastRow() - 1) : 0;
  const confirmedCount = confirmedSheet ? Math.max(0, confirmedSheet.getLastRow() - 1) : 0;
  const closedCount = closedSheet ? Math.max(0, closedSheet.getLastRow() - 1) : 0;
  
  // Calculate today's statistics
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  
  let todayNewEnquiries = 0;
  let todayApproved = 0;
  
  // Count today's new enquiries from PENDING_DATA (column C = index 2 is enqDate)
  if (pendingSheet && pendingSheet.getLastRow() > 1) {
    const pendingData = pendingSheet.getRange(2, 1, pendingSheet.getLastRow() - 1, 10).getValues();
    pendingData.forEach(row => {
      const enqDate = row[2]; // Column C - Enquiry Date
      if (enqDate instanceof Date) {
        if (enqDate >= todayStart && enqDate < todayEnd) {
          todayNewEnquiries++;
        }
      }
    });
  }
  
  // Also count from PENDING_APPROVED for new enquiries created today
  if (pendApprSheet && pendApprSheet.getLastRow() > 1) {
    const pendApprData = pendApprSheet.getRange(2, 1, pendApprSheet.getLastRow() - 1, 15).getValues();
    pendApprData.forEach(row => {
      const enqDate = row[2]; // Column C - Enquiry Date
      if (enqDate instanceof Date) {
        if (enqDate >= todayStart && enqDate < todayEnd) {
          todayNewEnquiries++;
        }
      }
      // Also check for today's approvals (column I/J = index 8/9 is approvedDate)
      const approvedDate = row[8] || row[9]; // Approved Date
      if (approvedDate instanceof Date) {
        if (approvedDate >= todayStart && approvedDate < todayEnd) {
          todayApproved++;
        }
      }
    });
  }
  
  // Count today's approvals from ORDER_CONFIRM_DATA
  if (confirmedSheet && confirmedSheet.getLastRow() > 1) {
    const confirmedData = confirmedSheet.getRange(2, 1, confirmedSheet.getLastRow() - 1, 15).getValues();
    confirmedData.forEach(row => {
      const approvedDate = row[8] || row[9]; // Approved Date (column I/J)
      if (approvedDate instanceof Date) {
        if (approvedDate >= todayStart && approvedDate < todayEnd) {
          todayApproved++;
        }
      }
    });
  }
  
  return {
    pending: pendingCount,
    approved: approvedCount,
    confirmed: confirmedCount,
    closed: closedCount,
    total: pendingCount + approvedCount + confirmedCount + closedCount,
    todayNew: todayNewEnquiries,
    todayApproved: todayApproved
  };
}

/**
 * Get complete dashboard data for KPI Dashboard
 */
function getDashboardData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Get all sheets
  const pendingSheet = ss.getSheetByName(CONFIG.SHEETS.PENDING);
  const pendApprSheet = ss.getSheetByName(CONFIG.SHEETS.PENDING_APPROVED);
  const confirmedSheet = ss.getSheetByName(CONFIG.SHEETS.CONFIRMED);
  const closedSheet = ss.getSheetByName(CONFIG.SHEETS.CLOSED);
  
  // Get data
  const pendingData = getSheetData(pendingSheet);
  const pendApprData = getSheetData(pendApprSheet);
  const confirmedData = getSheetData(confirmedSheet);
  const closedData = getSheetData(closedSheet);
  
  // Calculate KPIs
  const kpis = calculateKPIs(pendingData, pendApprData, confirmedData, closedData);
  
  // Get recent orders (latest 15)
  const recentOrders = getRecentOrders(confirmedData, 15);
  
  // Get monthly data
  const monthlyData = getMonthlyData(confirmedData);
  
  // Get broker performance
  const brokerData = getBrokerPerformance(pendingData, pendApprData, confirmedData, closedData);
  
  // Get quality analysis
  const qualityData = getQualityAnalysis(pendingData, pendApprData, confirmedData, closedData);
  
  // Get alerts
  const alerts = getAlerts(pendingData, confirmedData);
  
  return {
    kpis: kpis,
    recentOrders: recentOrders,
    monthlyData: monthlyData,
    brokerData: brokerData,
    qualityData: qualityData,
    alerts: alerts
  };
}

/**
 * Calculate KPIs
 */
function calculateKPIs(pendingData, pendApprData, confirmedData, closedData) {
  const totalEnquiries = pendingData.length + pendApprData.length + confirmedData.length + closedData.length;
  
  const today = new Date();
  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();
  
  let thisMonthEnq = 0;
  let todayEnq = 0;
  
  [pendingData, pendApprData, confirmedData, closedData].forEach(rows => {
    rows.forEach(r => {
      const d = asDate(r[2]);
      if (!d) return;
      if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) thisMonthEnq++;
      if (d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()) todayEnq++;
    });
  });
  
  let pendingCount = 0;
  pendingData.forEach(r => {
    if (String(r[7]).toLowerCase() === 'pending') pendingCount++;
  });
  
  const approvedCount = confirmedData.length;
  const conversionRate = totalEnquiries > 0 ? ((approvedCount / totalEnquiries) * 100).toFixed(2) : 0;
  
  let totalOrderValue = 0;
  let totalMTR = 0;
  let activeOrders = 0;
  let openOrderValue = 0;
  const todayStrip = stripTime(today);
  
  confirmedData.forEach(r => {
    const val = Number(r[30]) || 0;
    const mtr = Number(r[29]) || 0;
    const del = asDate(r[37]);
    
    totalOrderValue += val;
    totalMTR += mtr;
    
    if (del && stripTime(del) >= todayStrip) {
      activeOrders++;
      openOrderValue += val;
    }
  });
  
  const canceledCount = closedData.length;
  
  return {
    totalEnquiries: totalEnquiries,
    thisMonth: thisMonthEnq,
    today: todayEnq,
    pending: pendingCount,
    approved: approvedCount,
    conversion: conversionRate,
    activeOrders: activeOrders,
    totalOrderValue: totalOrderValue.toFixed(2),
    canceled: canceledCount,
    totalMTR: totalMTR.toFixed(2),
    openOrderValue: openOrderValue.toFixed(2)
  };
}

/**
 * Get recent orders
 */
function getRecentOrders(confirmedData, limit) {
  const sortedConf = confirmedData.slice().sort((a, b) => {
    const da = asDate(a[8]);
    const db = asDate(b[8]);
    return (db ? db.getTime() : 0) - (da ? da.getTime() : 0);
  });
  
  return sortedConf.slice(0, limit).map(r => ({
    rtweNo: r[0] || '',
    costingNo: r[1] || '',
    enqDate: formatDateShort(asDate(r[2])),
    buyer: r[11] || '',
    broker: r[4] || '',
    quality: r[5] || '',
    status: r[7] || '',
    delivery: formatDateShort(asDate(r[37])),
    mtr: r[29] || 0,
    value: r[30] || 0
  }));
}

/**
 * Get monthly data
 */
function getMonthlyData(confirmedData) {
  const monthMap = {};
  
  confirmedData.forEach(r => {
    const d = asDate(r[8]);
    if (!d) return;
    const key = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2);
    if (!monthMap[key]) monthMap[key] = { orders: 0, mtr: 0, value: 0 };
    monthMap[key].orders++;
    monthMap[key].mtr += Number(r[29]) || 0;
    monthMap[key].value += Number(r[30]) || 0;
  });
  
  return Object.keys(monthMap).sort().map(k => ({
    month: k,
    orders: monthMap[k].orders,
    mtr: monthMap[k].mtr.toFixed(2),
    value: monthMap[k].value.toFixed(2)
  }));
}

/**
 * Get broker performance
 */
function getBrokerPerformance(pendingData, pendApprData, confirmedData, closedData) {
  const brokerMap = {};
  
  [pendingData, pendApprData, confirmedData, closedData].forEach(rows => {
    rows.forEach(r => {
      const broker = (r[4] || '').toString().trim();
      if (!broker) return;
      if (!brokerMap[broker]) brokerMap[broker] = { enq: 0, appr: 0, value: 0 };
      brokerMap[broker].enq++;
    });
  });
  
  confirmedData.forEach(r => {
    const broker = (r[4] || '').toString().trim();
    if (!broker) return;
    if (!brokerMap[broker]) brokerMap[broker] = { enq: 0, appr: 0, value: 0 };
    brokerMap[broker].appr++;
    brokerMap[broker].value += Number(r[30]) || 0;
  });
  
  const brokerRows = Object.keys(brokerMap).map(name => {
    const b = brokerMap[name];
    const conv = b.enq > 0 ? ((b.appr / b.enq) * 100).toFixed(1) : 0;
    return {
      broker: name,
      enquiries: b.enq,
      approved: b.appr,
      conversion: conv,
      value: b.value.toFixed(2)
    };
  }).sort((a, b) => parseFloat(b.value) - parseFloat(a.value));
  
  return brokerRows.slice(0, 15);
}

/**
 * Get quality analysis
 */
function getQualityAnalysis(pendingData, pendApprData, confirmedData, closedData) {
  const qualityMap = {};
  
  [pendingData, pendApprData, confirmedData, closedData].forEach(rows => {
    rows.forEach(r => {
      const q = (r[5] || '').toString().trim();
      if (!q) return;
      if (!qualityMap[q]) qualityMap[q] = { enq: 0, appr: 0, mtr: 0, value: 0 };
      qualityMap[q].enq++;
    });
  });
  
  confirmedData.forEach(r => {
    const q = (r[14] || r[5] || '').toString().trim();
    if (!q) return;
    if (!qualityMap[q]) qualityMap[q] = { enq: 0, appr: 0, mtr: 0, value: 0 };
    qualityMap[q].appr++;
    qualityMap[q].mtr += Number(r[29]) || 0;
    qualityMap[q].value += Number(r[30]) || 0;
  });
  
  const totalQualMTR = Object.keys(qualityMap).reduce((sum, q) => sum + qualityMap[q].mtr, 0);
  
  const qualityRows = Object.keys(qualityMap).map(q => {
    const obj = qualityMap[q];
    const share = totalQualMTR > 0 ? ((obj.mtr / totalQualMTR) * 100).toFixed(1) : 0;
    return {
      quality: q,
      enquiries: obj.enq,
      approved: obj.appr,
      mtr: obj.mtr.toFixed(2),
      percentage: share
    };
  }).sort((a, b) => parseFloat(b.mtr) - parseFloat(a.mtr));
  
  return qualityRows.slice(0, 14);
}

/**
 * Get alerts
 */
function getAlerts(pendingData, confirmedData) {
  const alerts = [];
  const today = new Date();
  const todayStrip = stripTime(today);
  const threeDays = new Date(todayStrip.getTime() + 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(todayStrip.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  // Due soon
  confirmedData.forEach(r => {
    const del = asDate(r[37]);
    if (!del) return;
    const dStrip = stripTime(del);
    if (dStrip >= todayStrip && dStrip <= threeDays) {
      const days = Math.round((dStrip.getTime() - todayStrip.getTime()) / (24 * 60 * 60 * 1000));
      alerts.push({
        type: 'Due Soon',
        rtwe: r[0] || '',
        info: r[11] || '',
        days: days + ' days'
      });
    }
  });
  
  // Old pending
  pendingData.forEach(r => {
    const enq = asDate(r[2]);
    if (!enq) return;
    const eStrip = stripTime(enq);
    if (eStrip <= sevenDaysAgo && String(r[7]).toLowerCase() === 'pending') {
      const days = Math.round((todayStrip.getTime() - eStrip.getTime()) / (24 * 60 * 60 * 1000));
      alerts.push({
        type: 'Old Pending',
        rtwe: r[0] || '',
        info: r[4] || '',
        days: days + ' days'
      });
    }
  });
  
  // Overdue
  confirmedData.forEach(r => {
    const del = asDate(r[37]);
    if (!del) return;
    const dStrip = stripTime(del);
    if (dStrip < todayStrip) {
      const days = Math.round((todayStrip.getTime() - dStrip.getTime()) / (24 * 60 * 60 * 1000));
      alerts.push({
        type: 'Overdue',
        rtwe: r[0] || '',
        info: r[11] || '',
        days: days + ' days'
      });
    }
  });
  
  // Missing PO
  confirmedData.forEach(r => {
    if (String(r[7]).toLowerCase() === 'approved' && !(r[12] || '').toString().trim()) {
      alerts.push({
        type: 'Missing PO',
        rtwe: r[0] || '',
        info: r[11] || '',
        days: '-'
      });
    }
  });
  
  return alerts.slice(0, 14);
}

/**
 * Execute advanced search (for Search Dashboard)
 */
function executeAdvancedSearch(filters) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const confirmedSheet = ss.getSheetByName(CONFIG.SHEETS.CONFIRMED);
  
  if (!confirmedSheet) {
    throw new Error('ORDER_CONFIRM_DATA sheet not found');
  }
  
  const lastRow = confirmedSheet.getLastRow();
  if (lastRow < 2) {
    return [];
  }
  
  const allData = confirmedSheet.getRange(2, 1, lastRow - 1, 42).getValues();
  
  // Filter data
  let filteredData = allData.filter(row => {
    // Single date filter
    if (filters.singleDate) {
      const rowDate = asDate(row[2]);
      if (!rowDate || stripTime(rowDate).getTime() !== stripTime(new Date(filters.singleDate)).getTime()) {
        return false;
      }
    }
    
    // Date range filter
    if (filters.dateFrom && filters.dateTo) {
      const rowDate = asDate(row[2]);
      const fromDate = stripTime(new Date(filters.dateFrom));
      const toDate = stripTime(new Date(filters.dateTo));
      if (!rowDate || stripTime(rowDate) < fromDate || stripTime(rowDate) > toDate) {
        return false;
      }
    }
    
    // Broker filter (multi-value)
    if (filters.broker) {
      const brokers = filters.broker.split(',').map(b => b.trim().toLowerCase());
      const rowBroker = String(row[4]).toLowerCase();
      if (!brokers.some(b => rowBroker.includes(b))) {
        return false;
      }
    }
    
    // Quality filter (multi-value)
    if (filters.quality) {
      const qualities = filters.quality.split(',').map(q => q.trim().toLowerCase());
      const rowQuality = String(row[5]).toLowerCase();
      if (!qualities.some(q => rowQuality.includes(q))) {
        return false;
      }
    }
    
    // Buyer filter
    if (filters.buyer) {
      const rowBuyer = String(row[11]).toLowerCase();
      if (!rowBuyer.includes(filters.buyer.toLowerCase())) {
        return false;
      }
    }
    
    // Year filter
    if (filters.year) {
      const rowDate = asDate(row[2]);
      if (!rowDate || rowDate.getFullYear().toString() !== filters.year) {
        return false;
      }
    }
    
    // Status filter (multi-value)
    if (filters.status) {
      const statuses = filters.status.split(',').map(s => s.trim().toLowerCase());
      const rowStatus = String(row[7]).toLowerCase();
      if (!statuses.some(s => rowStatus.includes(s))) {
        return false;
      }
    }
    
    return true;
  });
  
  // Sort data
  filteredData.sort((a, b) => {
    switch(filters.sortBy) {
      case 'Latest First':
        return (asDate(b[2]) || new Date(0)).getTime() - (asDate(a[2]) || new Date(0)).getTime();
      case 'Oldest First':
        return (asDate(a[2]) || new Date(0)).getTime() - (asDate(b[2]) || new Date(0)).getTime();
      case 'Broker A-Z':
        return String(a[4]).localeCompare(String(b[4]));
      case 'Total MTR High-Low':
        return (Number(b[29]) || 0) - (Number(a[29]) || 0);
      default:
        return 0;
    }
  });
  
  // Format results
  return filteredData.map(row => {
    let designDetails = '';
    for (let i = 0; i < 6; i++) {
      const design = row[15 + i * 2];
      const taga = row[16 + i * 2];
      if (design && taga) {
        if (designDetails) designDetails += '\n';
        designDetails += design + ': ' + taga + ' TAGA';
      }
    }
    
    return {
      rtweNo: row[0] || '',
      costingNo: row[1] || '',
      broker: row[4] || '',
      quality: row[5] || '',
      buyer: row[11] || '',
      designDetails: designDetails,
      totalTaga: row[27] || 0,
      totalMTR: row[29] || 0,
      deliveryDate: formatDateShort(asDate(row[37])),
      totalValue: row[30] || 0
    };
  });
}

/**
 * Export search results to PDF (placeholder)
 */
function exportSearchResultsPDF() {
  // This would implement the PDF export logic
  // For now, just return a message
  return {
    success: true,
    message: '✅ PDF export feature will be implemented!\n\nFor now, use the sheet-based search dashboard PDF export.'
  };
}

/**
 * Helper: Format date short
 */
function formatDateShort(date) {
  if (!date) return '';
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'dd-MMM-yyyy');
}