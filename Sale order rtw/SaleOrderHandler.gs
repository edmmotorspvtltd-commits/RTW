/**
 * ============================================================================
 * RTWE SALE ORDER SYSTEM - SALE ORDER HANDLER
 * Server-side Sale Order Creation - MULTIPLE ITEMS SUPPORT
 * Each item is saved as a separate row with same SO number
 * ============================================================================
 */

/**
 * Server-side function to create sale order with MULTIPLE ITEMS
 * Called from SaleOrderForm.html
 * @param {object} orderData - Sale order data including items array
 * @param {string} sessionId - Session ID
 * @return {object} Result with success status and SO number
 */
function serverCreateSaleOrder(orderData, sessionId) {
  try {
    Logger.log('serverCreateSaleOrder called');
    Logger.log('SessionId: ' + sessionId);
    Logger.log('Order data: ' + JSON.stringify(orderData));
    
    // Validate session
    if (!sessionId || !isValidSession(sessionId)) {
      return {
        success: false,
        message: 'Session expired. Please login again.'
      };
    }
    
    // Get user from session
    const session = getSessionData(sessionId);
    
    if (!session) {
      return {
        success: false,
        message: 'Invalid session. Please login again.'
      };
    }
    
    Logger.log('User authenticated: ' + session.name);
    
    // Validate required fields
    if (!orderData.date || !orderData.buyer) {
      return {
        success: false,
        message: 'Missing required fields: Date and Buyer are required'
      };
    }
    
    // Validate items
    if (!orderData.items || orderData.items.length === 0) {
      return {
        success: false,
        message: 'Please add at least one item to the order'
      };
    }
    
    // Get spreadsheet
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Sale_Orders');
    
    if (!sheet) {
      return {
        success: false,
        message: 'Sale_Orders sheet not found. Please run setup first.'
      };
    }
    
    // Generate SO Number (same for all items)
    const soNumber = generateSaleOrderNumber();
    const timestamp = new Date();
    
    Logger.log('Generated SO Number: ' + soNumber);
    Logger.log('Number of items: ' + orderData.items.length);
    
    // Save EACH ITEM as a separate row (linked by SO number)
    for (let i = 0; i < orderData.items.length; i++) {
      const item = orderData.items[i];
      
      // Calculate CGST/SGST/IGST based on GST Type
      let cgst = 0, sgst = 0, igst = 0;
      if (orderData.gstType === 'CGST/SGST') {
        cgst = item.gstAmount / 2;
        sgst = item.gstAmount / 2;
      } else if (orderData.gstType === 'IGST') {
        igst = item.gstAmount;
      }
      
      const rowData = [
        // Order Identification
        soNumber,                          // A: so_number (same for all items)
        i + 1,                             // B: item_sno (1, 2, 3...)
        orderData.rtweNo || '',            // C: rtwe_no
        orderData.costingNumber || '',     // D: costing_number
        
        // Order Details
        orderData.date,                    // E: date
        orderData.buyer,                   // F: buyer
        orderData.buyerPoNo || '',         // G: buyer_po_no
        orderData.consignee || '',         // H: consignee
        orderData.agent || '',             // I: agent
        orderData.agentIndentNo || '',     // J: agent_indent_no
        orderData.transport || '',         // K: transport
        
        // Contract & Delivery
        orderData.contractType || 'DOMESTIC', // L: contract_type
        orderData.contractRoute || 'SELF RUNNING', // M: contract_route
        orderData.modeOfShipment || 'ROAD', // N: mode_of_shipment
        orderData.deliveryTerms || 'FOR',  // O: delivery_terms
        orderData.paymentTerms || '',      // P: payment_terms
        orderData.bank || '',              // Q: bank
        orderData.soType || 'BULK',        // R: so_type
        orderData.termsConditions || '',   // S: terms_conditions
        orderData.gstType || '',           // T: gst_type
        
        // Item Details (per row)
        item.fabricType || 'COTTON',       // U: fabric_type
        item.quality,                      // V: quality
        item.design || '',                 // W: design
        item.hsnCode || '',                // X: hsn_code
        item.uom || 'MTR',                 // Y: uom
        item.quantity,                     // Z: quantity
        item.rate,                         // AA: rate
        item.baseAmount,                   // AB: base_amount
        cgst,                              // AC: cgst
        sgst,                              // AD: sgst
        igst,                              // AE: igst
        item.totalAmount,                  // AF: item_total
        item.deliveryDate || '',           // AG: item_delivery_date
        item.pieceLength || '',            // AH: piece_length
        item.noPieces || '',               // AI: no_pieces
        
        // Technical Details (shared across items)
        orderData.warpDetails || '',       // AJ: warp_details
        orderData.weftDetails || '',       // AK: weft_details
        orderData.sizingDetails || '',     // AL: sizing_details
        orderData.weavingDetails || '',    // AM: weaving_details
        orderData.selvedgeName || '',      // AN: selvedge_name
        orderData.selvedgeEnds || '',      // AO: selvedge_ends
        orderData.selvedgeColor || '',     // AP: selvedge_color
        orderData.inspectionType || '',    // AQ: inspection_type
        orderData.finishedQuality || '',   // AR: finished_quality
        orderData.buyerProduct || '',      // AS: buyer_product
        orderData.bonusCommission || '',   // AT: bonus_commission
        orderData.deliveryDate || '',      // AU: delivery_date
        
        // Order Meta
        orderData.remark || '',            // AV: remark
        'Pending',                         // AW: status
        session.username || session.name, // AX: created_by
        timestamp,                         // AY: created_at
        timestamp                          // AZ: updated_at
      ];
      
      sheet.appendRow(rowData);
      Logger.log('Saved item ' + (i + 1) + ': ' + item.quality);
    }
    
    Logger.log('All items saved successfully');
    
    // Log activity
    try {
      logUserActivity(sessionId, 'SALE_ORDER_CREATED', {
        so_number: soNumber,
        buyer: orderData.buyer,
        items_count: orderData.items.length,
        grand_total: orderData.grandTotal
      });
    } catch (e) {
      Logger.log('Activity log error: ' + e);
    }
    
    // Send notification if saveType is 'share'
    if (orderData.saveType === 'share') {
      sendSaleOrderNotification(soNumber, orderData, session);
    }
    
    // ✅ Mark RTWE order as processed (if came from RTWE)
    if (orderData.rtweNo) {
      try {
        markRTWEOrderAsProcessed(orderData.rtweNo, soNumber);
        Logger.log('Marked RTWE ' + orderData.rtweNo + ' as SO_CREATED');
      } catch (e) {
        Logger.log('Failed to mark RTWE as processed: ' + e);
      }
    }
    
    return {
      success: true,
      message: 'Sale order created successfully with ' + orderData.items.length + ' items',
      soNumber: soNumber,
      itemsCount: orderData.items.length,
      grandTotal: orderData.grandTotal
    };
    
  } catch (error) {
    Logger.log('serverCreateSaleOrder error: ' + error.stack);
    return {
      success: false,
      message: 'Failed to create sale order: ' + error.message
    };
  }
}

/**
 * Generate sale order number
 * Format: RTW-SO-NO/25-26/001
 * @return {string} Sale order number
 */
function generateSaleOrderNumber() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Sale_Orders');
  
  // Get current financial year (April to March)
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  
  let fyStart, fyEnd;
  if (currentMonth >= 4) {
    fyStart = currentYear.toString().slice(-2);
    fyEnd = (currentYear + 1).toString().slice(-2);
  } else {
    fyStart = (currentYear - 1).toString().slice(-2);
    fyEnd = currentYear.toString().slice(-2);
  }
  
  const fyString = fyStart + '-' + fyEnd;
  
  // Get last unique SO number
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= 1) {
    return 'RTW-SO-NO/' + fyString + '/001';
  }
  
  // Get all SO numbers and find highest for this FY
  const soNumbers = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
  let maxSeq = 0;
  
  for (let i = 0; i < soNumbers.length; i++) {
    const soNum = soNumbers[i][0];
    if (soNum && typeof soNum === 'string' && soNum.includes(fyString)) {
      const parts = soNum.split('/');
      if (parts.length === 3) {
        const seq = parseInt(parts[2]);
        if (seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
  }
  
  const newSeq = maxSeq + 1;
  return 'RTW-SO-NO/' + fyString + '/' + newSeq.toString().padStart(3, '0');
}

/**
 * Complete a sale order - move all items to Completed_Orders
 * @param {string} soNumber - Sale order number
 * @param {string} sessionId - Session ID
 */
function completeSaleOrder(soNumber, sessionId) {
  try {
    Logger.log('completeSaleOrder called for: ' + soNumber);
    
    // Validate session
    if (!sessionId || !isValidSession(sessionId)) {
      return { success: false, message: 'Session expired' };
    }
    
    const session = getSessionData(sessionId);
    if (!session) {
      return { success: false, message: 'Invalid session' };
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const saleOrdersSheet = ss.getSheetByName('Sale_Orders');
    const completedSheet = ss.getSheetByName('Completed_Orders');
    
    if (!saleOrdersSheet || !completedSheet) {
      return { success: false, message: 'Required sheets not found' };
    }
    
    // Find all rows with this SO number
    const data = saleOrdersSheet.getDataRange().getValues();
    const rowsToMove = [];
    
    // Find rows (skip header)
    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][0] === soNumber) {
        rowsToMove.push(i + 1); // +1 for actual row number
      }
    }
    
    if (rowsToMove.length === 0) {
      return { success: false, message: 'Sale order not found: ' + soNumber };
    }
    
    Logger.log('Found ' + rowsToMove.length + ' items to complete');
    
    // Move rows to completed sheet and delete from sale orders
    const timestamp = new Date();
    
    rowsToMove.forEach(rowNum => {
      const rowData = saleOrdersSheet.getRange(rowNum, 1, 1, saleOrdersSheet.getLastColumn()).getValues()[0];
      
      // Update status and timestamp
      rowData[22] = 'Completed'; // Status column (W)
      rowData[25] = timestamp;   // Updated_at column (Z)
      
      // Add to completed sheet
      completedSheet.appendRow(rowData);
    });
    
    // Delete from sale orders (in reverse order to maintain row numbers)
    rowsToMove.sort((a, b) => b - a);
    rowsToMove.forEach(rowNum => {
      saleOrdersSheet.deleteRow(rowNum);
    });
    
    Logger.log('Sale order completed: ' + soNumber);
    
    return {
      success: true,
      message: 'Sale order completed successfully',
      soNumber: soNumber,
      itemsCompleted: rowsToMove.length
    };
    
  } catch (error) {
    Logger.log('completeSaleOrder error: ' + error.stack);
    return { success: false, message: 'Error: ' + error.message };
  }
}

/**
 * Cancel a sale order - move all items to Cancelled_Orders
 * @param {string} soNumber - Sale order number
 * @param {string} reason - Cancellation reason
 * @param {string} sessionId - Session ID
 */
function cancelSaleOrder(soNumber, reason, sessionId) {
  try {
    Logger.log('cancelSaleOrder called for: ' + soNumber);
    
    // Validate session
    if (!sessionId || !isValidSession(sessionId)) {
      return { success: false, message: 'Session expired' };
    }
    
    const session = getSessionData(sessionId);
    if (!session) {
      return { success: false, message: 'Invalid session' };
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const saleOrdersSheet = ss.getSheetByName('Sale_Orders');
    const cancelledSheet = ss.getSheetByName('Cancelled_Orders');
    
    if (!saleOrdersSheet || !cancelledSheet) {
      return { success: false, message: 'Required sheets not found' };
    }
    
    // Find all rows with this SO number
    const data = saleOrdersSheet.getDataRange().getValues();
    const rowsToMove = [];
    
    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][0] === soNumber) {
        rowsToMove.push(i + 1);
      }
    }
    
    if (rowsToMove.length === 0) {
      return { success: false, message: 'Sale order not found: ' + soNumber };
    }
    
    Logger.log('Found ' + rowsToMove.length + ' items to cancel');
    
    const timestamp = new Date();
    
    rowsToMove.forEach(rowNum => {
      const rowData = saleOrdersSheet.getRange(rowNum, 1, 1, saleOrdersSheet.getLastColumn()).getValues()[0];
      
      // Update status and add cancellation reason
      rowData[21] = reason || 'Cancelled'; // Remark column (V)
      rowData[22] = 'Cancelled';            // Status column (W)
      rowData[25] = timestamp;              // Updated_at column (Z)
      
      cancelledSheet.appendRow(rowData);
    });
    
    // Delete from sale orders
    rowsToMove.sort((a, b) => b - a);
    rowsToMove.forEach(rowNum => {
      saleOrdersSheet.deleteRow(rowNum);
    });
    
    Logger.log('Sale order cancelled: ' + soNumber);
    
    return {
      success: true,
      message: 'Sale order cancelled',
      soNumber: soNumber,
      itemsCancelled: rowsToMove.length
    };
    
  } catch (error) {
    Logger.log('cancelSaleOrder error: ' + error.stack);
    return { success: false, message: 'Error: ' + error.message };
  }
}

/**
 * Send sale order notification
 */
function sendSaleOrderNotification(soNumber, orderData, session) {
  try {
    Logger.log('Sending notification for SO: ' + soNumber);
    // Implement email/Telegram notification here
  } catch (error) {
    Logger.log('sendSaleOrderNotification error: ' + error);
  }
}