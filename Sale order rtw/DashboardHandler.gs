/**
 * ============================================================================
 * RTWE SALE ORDER SYSTEM - DASHBOARD HANDLER
 * Dashboard Statistics (Simplified - matching RTWE Enquiry pattern)
 * ============================================================================
 */

/**
 * Get dashboard statistics (simple counts like RTWE Enquiry system)
 * @param {string} sessionId - The session ID (optional)
 */
function getDashboardStats(sessionId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Get sheets - "Pending orders RTWE" is the main pending sheet
  const pendingSheet = ss.getSheetByName('Pending orders RTWE');
  const completedSheet = ss.getSheetByName('Completed_Orders');
  const cancelledSheet = ss.getSheetByName('Cancelled_Orders');
  
  // Calculate today's date range
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  
  // Initialize counters
  let pendingCount = 0;
  let todayNew = 0;
  let completeOrders = 0;
  let cancelledOrders = 0;
  let todayCompleted = 0;
  
  // Count pending orders from "Pending orders RTWE" sheet
  // Same logic as getPendingRTWEOrders - skip SO_CREATED and CANCELLED
  if (pendingSheet && pendingSheet.getLastRow() > 1) {
    const data = pendingSheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find column indices
    let rtweNoIdx = -1;
    let statusIdx = -1;
    let dateIdx = -1;
    
    for (let i = 0; i < headers.length; i++) {
      const h = String(headers[i]).toLowerCase().trim();
      if (h.includes('rtwe') && rtweNoIdx === -1) rtweNoIdx = i;
      if ((h.includes('so_status') || h === 'status') && statusIdx === -1) statusIdx = i;
      if ((h.includes('enquiry date') || h.includes('enq date') || h === 'date') && dateIdx === -1) dateIdx = i;
    }
    
    Logger.log('Pending sheet columns - RTWE: ' + rtweNoIdx + ', Status: ' + statusIdx + ', Date: ' + dateIdx);
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Skip if RTWE No is empty
      const rtweNo = rtweNoIdx >= 0 ? String(row[rtweNoIdx] || '').trim() : '';
      if (!rtweNo) continue;
      
      // Skip if already processed (SO_CREATED or CANCELLED)
      const status = statusIdx >= 0 ? String(row[statusIdx] || '').trim().toUpperCase() : '';
      if (status === 'SO_CREATED' || status === 'CANCELLED') continue;
      
      pendingCount++;
      
      // Check if created today
      if (dateIdx >= 0 && row[dateIdx]) {
        const enqDate = row[dateIdx];
        if (enqDate instanceof Date) {
          if (enqDate >= todayStart && enqDate < todayEnd) {
            todayNew++;
          }
        }
      }
    }
  }
  
  Logger.log('Pending count: ' + pendingCount + ', Today new: ' + todayNew);
  
  // Count completed orders (simple row count)
  if (completedSheet && completedSheet.getLastRow() > 1) {
    completeOrders = completedSheet.getLastRow() - 1;
  }
  
  // Count cancelled orders (simple row count)
  if (cancelledSheet && cancelledSheet.getLastRow() > 1) {
    cancelledOrders = cancelledSheet.getLastRow() - 1;
  }
  
  const totalOrders = pendingCount + completeOrders + cancelledOrders;
  
  Logger.log('Complete: ' + completeOrders + ', Cancelled: ' + cancelledOrders + ', Total: ' + totalOrders);
  
  // Return in same format as RTWE Enquiry system
  return {
    pending: pendingCount,
    pendingOrders: pendingCount,
    approved: completeOrders,
    completeOrders: completeOrders,
    closed: cancelledOrders,
    cancelledOrders: cancelledOrders,
    total: totalOrders,
    totalOrders: totalOrders,
    todayNew: todayNew,
    todayCompleted: todayCompleted,
    todayApproved: todayCompleted,
    stillPending: pendingCount
  };
}