/**
 * ============================================================================
 * RTWE SALE ORDER SYSTEM - PENDING ORDERS HANDLER
 * Server-side Functions for Pending Orders Management
 * Add this to your Auth.gs or SaleOrders.gs file
 * ============================================================================
 */

/**
 * Get all pending sale orders
 * Called from PendingOrders.html
 * @param {string} sessionId - Session ID
 * @return {object} Result with orders array
 */
function getPendingOrders(sessionId) {
  try {
    Logger.log('getPendingOrders called');
    Logger.log('SessionId: ' + sessionId);
    
    // Validate session
    if (!sessionId || !isValidSession(sessionId)) {
      return {
        success: false,
        message: 'Session expired. Please login again.',
        orders: []
      };
    }
    
    // Get user from session
    const user = getUserFromToken(sessionId);
    
    if (!user) {
      return {
        success: false,
        message: 'Invalid session. Please login again.',
        orders: []
      };
    }
    
    Logger.log('User authenticated: ' + user.full_name);
    
    // Get spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Sale_Orders');
    
    if (!sheet) {
      Logger.log('Sale_Orders sheet not found');
      return {
        success: false,
        message: 'Sale_Orders sheet not found',
        orders: []
      };
    }
    
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      Logger.log('No orders found');
      return {
        success: true,
        message: 'No pending orders',
        orders: []
      };
    }
    
    // Get all data
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find column indices
    const colIndices = {};
    headers.forEach((header, index) => {
      colIndices[header] = index;
    });
    
    // Filter pending orders
    const pendingOrders = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const status = row[colIndices['status']] || '';
      
      if (status.toLowerCase() === 'pending') {
        pendingOrders.push({
          soNumber: row[colIndices['so_number']] || '',
          rtweNo: row[colIndices['rtwe_no']] || '',
          date: row[colIndices['date']] ? new Date(row[colIndices['date']]).toISOString().split('T')[0] : '',
          buyer: row[colIndices['buyer']] || '',
          buyerPoNo: row[colIndices['buyer_po_no']] || '',
          consignee: row[colIndices['consignee']] || '',
          agent: row[colIndices['agent']] || '',
          transport: row[colIndices['transport']] || '',
          contractType: row[colIndices['contract_type']] || '',
          contractRoute: row[colIndices['contract_route']] || '',
          soType: row[colIndices['so_type']] || '',
          modeOfShipment: row[colIndices['mode_of_shipment']] || '',
          deliveryDate: row[colIndices['delivery_date']] ? new Date(row[colIndices['delivery_date']]).toISOString().split('T')[0] : '',
          quality: row[colIndices['quality']] || '',
          quantity: row[colIndices['quantity']] || 0,
          rate: row[colIndices['rate']] || 0,
          finalAmount: row[colIndices['final_amount']] || 0,
          status: status,
          createdAt: row[colIndices['created_at']] || '',
          rowIndex: i + 1 // Store row index for future operations
        });
      }
    }
    
    // Sort by date (newest first)
    pendingOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    Logger.log('Found ' + pendingOrders.length + ' pending orders');
    
    return {
      success: true,
      message: 'Pending orders loaded successfully',
      orders: pendingOrders
    };
    
  } catch (error) {
    Logger.log('getPendingOrders error: ' + error.stack);
    return {
      success: false,
      message: 'Failed to load pending orders: ' + error.message,
      orders: []
    };
  }
}

/**
 * Cancel a sale order
 * Called from PendingOrders.html
 * @param {string} soNumber - Sale order number
 * @param {string} reason - Cancellation reason
 * @param {string} sessionId - Session ID
 * @return {object} Result
 */
function cancelSaleOrder(soNumber, reason, sessionId) {
  try {
    Logger.log('cancelSaleOrder called');
    Logger.log('SO Number: ' + soNumber);
    Logger.log('Reason: ' + reason);
    Logger.log('SessionId: ' + sessionId);
    
    // Validate session
    if (!sessionId || !isValidSession(sessionId)) {
      return {
        success: false,
        message: 'Session expired. Please login again.'
      };
    }
    
    // Get user from session
    const user = getUserFromToken(sessionId);
    
    if (!user) {
      return {
        success: false,
        message: 'Invalid session. Please login again.'
      };
    }
    
    Logger.log('User authenticated: ' + user.full_name);
    
    // Validate inputs
    if (!soNumber || !reason) {
      return {
        success: false,
        message: 'SO Number and cancellation reason are required'
      };
    }
    
    // Get spreadsheets
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const saleOrdersSheet = ss.getSheetByName('Sale_Orders');
    const cancelledOrdersSheet = ss.getSheetByName('Cancelled_Orders');
    
    if (!saleOrdersSheet) {
      return {
        success: false,
        message: 'Sale_Orders sheet not found'
      };
    }
    
    if (!cancelledOrdersSheet) {
      return {
        success: false,
        message: 'Cancelled_Orders sheet not found'
      };
    }
    
    // Find the order
    const data = saleOrdersSheet.getDataRange().getValues();
    let orderRow = -1;
    let orderData = null;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === soNumber) { // Assuming so_number is in column A
        orderRow = i + 1;
        orderData = data[i];
        break;
      }
    }
    
    if (orderRow === -1) {
      return {
        success: false,
        message: 'Sale order not found: ' + soNumber
      };
    }
    
    // Check if already cancelled
    const currentStatus = orderData[31] || ''; // Assuming status is column AF (index 31)
    if (currentStatus.toLowerCase() === 'cancelled') {
      return {
        success: false,
        message: 'This order is already cancelled'
      };
    }
    
    const timestamp = new Date();
    
    // Copy to Cancelled_Orders sheet (add cancellation info)
    const cancelledRow = orderData.slice(); // Copy array
    cancelledRow.push(reason); // Add cancellation reason
    cancelledRow.push(user.user_id); // Add cancelled_by
    cancelledRow.push(timestamp); // Add cancelled_at
    
    cancelledOrdersSheet.appendRow(cancelledRow);
    
    // Delete from Sale_Orders
    saleOrdersSheet.deleteRow(orderRow);
    
    Logger.log('Order cancelled successfully');
    
    // Log audit trail
    logAuditTrail(user.user_id, 'SALE_ORDER_CANCELLED', {
      so_number: soNumber,
      reason: reason
    });
    
    return {
      success: true,
      message: 'Sale order cancelled successfully'
    };
    
  } catch (error) {
    Logger.log('cancelSaleOrder error: ' + error.stack);
    return {
      success: false,
      message: 'Failed to cancel order: ' + error.message
    };
  }
}

/**
 * Get complete sale orders
 * Called from CompleteOrders.html
 * @param {string} sessionId - Session ID
 * @return {object} Result with orders array
 */
function getCompleteOrders(sessionId) {
  try {
    Logger.log('getCompleteOrders called');
    Logger.log('SessionId: ' + sessionId);
    
    // Validate session
    if (!sessionId || !isValidSession(sessionId)) {
      return {
        success: false,
        message: 'Session expired. Please login again.',
        orders: []
      };
    }
    
    // Get user from session
    const user = getUserFromToken(sessionId);
    
    if (!user) {
      return {
        success: false,
        message: 'Invalid session. Please login again.',
        orders: []
      };
    }
    
    // Get spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Completed_Orders');
    
    if (!sheet) {
      Logger.log('Completed_Orders sheet not found');
      return {
        success: false,
        message: 'Completed_Orders sheet not found',
        orders: []
      };
    }
    
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return {
        success: true,
        message: 'No completed orders',
        orders: []
      };
    }
    
    // Get all data
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find column indices
    const colIndices = {};
    headers.forEach((header, index) => {
      colIndices[header] = index;
    });
    
    const completeOrders = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      completeOrders.push({
        soNumber: row[colIndices['so_number']] || '',
        date: row[colIndices['date']] ? new Date(row[colIndices['date']]).toISOString().split('T')[0] : '',
        buyer: row[colIndices['buyer']] || '',
        consignee: row[colIndices['consignee']] || '',
        quality: row[colIndices['quality']] || '',
        quantity: row[colIndices['quantity']] || 0,
        finalAmount: row[colIndices['final_amount']] || 0,
        completedAt: row[colIndices['completed_at']] || ''
      });
    }
    
    // Sort by completed date (newest first)
    completeOrders.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    
    Logger.log('Found ' + completeOrders.length + ' completed orders');
    
    return {
      success: true,
      message: 'Complete orders loaded successfully',
      orders: completeOrders
    };
    
  } catch (error) {
    Logger.log('getCompleteOrders error: ' + error.stack);
    return {
      success: false,
      message: 'Failed to load complete orders: ' + error.message,
      orders: []
    };
  }
}

/**
 * Get cancelled sale orders
 * Called from CancelledOrders.html
 * @param {string} sessionId - Session ID
 * @return {object} Result with orders array
 */
function getCancelledOrders(sessionId) {
  try {
    Logger.log('getCancelledOrders called');
    Logger.log('SessionId: ' + sessionId);
    
    // Validate session
    if (!sessionId || !isValidSession(sessionId)) {
      return {
        success: false,
        message: 'Session expired. Please login again.',
        orders: []
      };
    }
    
    // Get user from session
    const user = getUserFromToken(sessionId);
    
    if (!user) {
      return {
        success: false,
        message: 'Invalid session. Please login again.',
        orders: []
      };
    }
    
    // Get spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Cancelled_Orders');
    
    if (!sheet) {
      Logger.log('Cancelled_Orders sheet not found');
      return {
        success: false,
        message: 'Cancelled_Orders sheet not found',
        orders: []
      };
    }
    
    const lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return {
        success: true,
        message: 'No cancelled orders',
        orders: []
      };
    }
    
    // Get all data
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find column indices
    const colIndices = {};
    headers.forEach((header, index) => {
      colIndices[header] = index;
    });
    
    const cancelledOrders = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      cancelledOrders.push({
        soNumber: row[colIndices['so_number']] || '',
        date: row[colIndices['date']] ? new Date(row[colIndices['date']]).toISOString().split('T')[0] : '',
        buyer: row[colIndices['buyer']] || '',
        consignee: row[colIndices['consignee']] || '',
        quality: row[colIndices['quality']] || '',
        quantity: row[colIndices['quantity']] || 0,
        finalAmount: row[colIndices['final_amount']] || 0,
        cancellationReason: row[colIndices['cancellation_reason']] || '',
        cancelledBy: row[colIndices['cancelled_by']] || '',
        cancelledAt: row[colIndices['cancelled_at']] || ''
      });
    }
    
    // Sort by cancelled date (newest first)
    cancelledOrders.sort((a, b) => new Date(b.cancelledAt) - new Date(a.cancelledAt));
    
    Logger.log('Found ' + cancelledOrders.length + ' cancelled orders');
    
    return {
      success: true,
      message: 'Cancelled orders loaded successfully',
      orders: cancelledOrders
    };
    
  } catch (error) {
    Logger.log('getCancelledOrders error: ' + error.stack);
    return {
      success: false,
      message: 'Failed to load cancelled orders: ' + error.message,
      orders: []
    };
  }
}