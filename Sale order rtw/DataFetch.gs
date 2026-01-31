/**
 * ============================================================================
 * RTWE SALE ORDER SYSTEM - DATA FETCH
 * Get order lists for display pages
 * MULTI-ITEM SUPPORT: Groups items by SO number
 * ============================================================================
 */

/**
 * Get pending orders list - GROUPED BY SO NUMBER
 * Returns orders with their items as an array (ALL FIELDS)
 */
function getPendingOrders(sessionId) {
  try {
    Logger.log('getPendingOrders called');
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Sale_Orders');
    
    if (!sheet || sheet.getLastRow() < 2) {
      return { success: true, data: [] };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Group items by SO number
    const ordersMap = {};
    
    for (let i = 1; i < data.length; i++) {
      const row = {};
      headers.forEach((header, index) => {
        row[header] = data[i][index];
      });
      
      // Only include pending orders
      if (row.status && row.status !== 'Pending') continue;
      
      const soNumber = row.so_number;
      
      if (!ordersMap[soNumber]) {
        // First item for this SO - create order object with ALL FIELDS
        ordersMap[soNumber] = {
          // Order Identification
          so_number: soNumber,
          rtwe_no: row.rtwe_no,
          costing_number: row.costing_number,
          
          // Order Details
          date: row.date,
          buyer: row.buyer,
          buyer_po_no: row.buyer_po_no,
          consignee: row.consignee,
          agent: row.agent,
          agent_indent_no: row.agent_indent_no,
          transport: row.transport,
          
          // Contract & Delivery
          contract_type: row.contract_type,
          contract_route: row.contract_route,
          mode_of_shipment: row.mode_of_shipment,
          delivery_terms: row.delivery_terms,
          payment_terms: row.payment_terms,
          bank: row.bank,
          so_type: row.so_type,
          terms_conditions: row.terms_conditions,
          gst_type: row.gst_type,
          
          // Technical Details
          warp_details: row.warp_details,
          weft_details: row.weft_details,
          sizing_details: row.sizing_details,
          weaving_details: row.weaving_details,
          selvedge_name: row.selvedge_name,
          selvedge_ends: row.selvedge_ends,
          selvedge_color: row.selvedge_color,
          inspection_type: row.inspection_type,
          finished_quality: row.finished_quality,
          buyer_product: row.buyer_product,
          bonus_commission: row.bonus_commission,
          delivery_date: row.delivery_date,
          
          // Order Meta
          remark: row.remark,
          status: row.status,
          created_by: row.created_by,
          created_at: row.created_at,
          
          // Items & Totals
          items: [],
          total_qty: 0,
          total_base: 0,
          total_cgst: 0,
          total_sgst: 0,
          total_igst: 0,
          grand_total: 0
        };
      }
      
      // Add item to this order with ALL item fields
      ordersMap[soNumber].items.push({
        item_sno: row.item_sno,
        fabric_type: row.fabric_type,
        quality: row.quality,
        design: row.design,
        hsn_code: row.hsn_code,
        uom: row.uom,
        quantity: parseFloat(row.quantity) || 0,
        rate: parseFloat(row.rate) || 0,
        base_amount: parseFloat(row.base_amount) || 0,
        cgst: parseFloat(row.cgst) || 0,
        sgst: parseFloat(row.sgst) || 0,
        igst: parseFloat(row.igst) || 0,
        item_total: parseFloat(row.item_total) || 0,
        item_delivery_date: row.item_delivery_date,
        piece_length: row.piece_length,
        no_pieces: row.no_pieces
      });
      
      // Update totals
      ordersMap[soNumber].total_qty += parseFloat(row.quantity) || 0;
      ordersMap[soNumber].total_base += parseFloat(row.base_amount) || 0;
      ordersMap[soNumber].total_cgst += parseFloat(row.cgst) || 0;
      ordersMap[soNumber].total_sgst += parseFloat(row.sgst) || 0;
      ordersMap[soNumber].total_igst += parseFloat(row.igst) || 0;
      ordersMap[soNumber].grand_total += parseFloat(row.item_total) || 0;
    }
    
    // Convert to array
    const orders = Object.values(ordersMap);
    
    Logger.log('Returning ' + orders.length + ' grouped orders');
    return { success: true, data: orders };
    
  } catch (error) {
    Logger.log('getPendingOrders error: ' + error);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Get completed orders list - GROUPED BY SO NUMBER
 */
function getCompletedOrders(sessionId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Completed_Orders');
    
    if (!sheet || sheet.getLastRow() < 2) {
      return { success: true, data: [] };
    }
    
    return groupOrdersBySONumber(sheet);
    
  } catch (error) {
    Logger.log('getCompletedOrders error: ' + error);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Get cancelled orders list - GROUPED BY SO NUMBER
 */
function getCancelledOrders(sessionId) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Cancelled_Orders');
    
    if (!sheet || sheet.getLastRow() < 2) {
      return { success: true, data: [] };
    }
    
    return groupOrdersBySONumber(sheet);
    
  } catch (error) {
    Logger.log('getCancelledOrders error: ' + error);
    return { success: false, data: [], error: error.message };
  }
}

/**
 * Helper: Group all rows in a sheet by SO number (ALL FIELDS)
 */
function groupOrdersBySONumber(sheet) {
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  
  const ordersMap = {};
  
  for (let i = 1; i < data.length; i++) {
    const row = {};
    headers.forEach((header, index) => {
      row[header] = data[i][index];
    });
    
    const soNumber = row.so_number;
    
    if (!ordersMap[soNumber]) {
      ordersMap[soNumber] = {
        // Order Identification
        so_number: soNumber,
        rtwe_no: row.rtwe_no,
        costing_number: row.costing_number,
        
        // Order Details
        date: row.date,
        buyer: row.buyer,
        buyer_po_no: row.buyer_po_no,
        consignee: row.consignee,
        agent: row.agent,
        agent_indent_no: row.agent_indent_no,
        transport: row.transport,
        
        // Contract & Delivery
        contract_type: row.contract_type,
        contract_route: row.contract_route,
        mode_of_shipment: row.mode_of_shipment,
        delivery_terms: row.delivery_terms,
        payment_terms: row.payment_terms,
        bank: row.bank,
        so_type: row.so_type,
        terms_conditions: row.terms_conditions,
        gst_type: row.gst_type,
        
        // Technical Details
        warp_details: row.warp_details,
        weft_details: row.weft_details,
        sizing_details: row.sizing_details,
        weaving_details: row.weaving_details,
        selvedge_name: row.selvedge_name,
        selvedge_ends: row.selvedge_ends,
        selvedge_color: row.selvedge_color,
        inspection_type: row.inspection_type,
        finished_quality: row.finished_quality,
        buyer_product: row.buyer_product,
        bonus_commission: row.bonus_commission,
        delivery_date: row.delivery_date,
        
        // Order Meta
        remark: row.remark,
        status: row.status,
        created_by: row.created_by,
        created_at: row.created_at,
        
        // Items & Totals
        items: [],
        total_qty: 0,
        total_base: 0,
        total_cgst: 0,
        total_sgst: 0,
        total_igst: 0,
        grand_total: 0
      };
    }
    
    ordersMap[soNumber].items.push({
      item_sno: row.item_sno,
      fabric_type: row.fabric_type,
      quality: row.quality,
      design: row.design,
      hsn_code: row.hsn_code,
      uom: row.uom,
      quantity: parseFloat(row.quantity) || 0,
      rate: parseFloat(row.rate) || 0,
      base_amount: parseFloat(row.base_amount) || 0,
      cgst: parseFloat(row.cgst) || 0,
      sgst: parseFloat(row.sgst) || 0,
      igst: parseFloat(row.igst) || 0,
      item_total: parseFloat(row.item_total) || 0,
      item_delivery_date: row.item_delivery_date,
      piece_length: row.piece_length,
      no_pieces: row.no_pieces
    });
    
    ordersMap[soNumber].total_qty += parseFloat(row.quantity) || 0;
    ordersMap[soNumber].total_base += parseFloat(row.base_amount) || 0;
    ordersMap[soNumber].total_cgst += parseFloat(row.cgst) || 0;
    ordersMap[soNumber].total_sgst += parseFloat(row.sgst) || 0;
    ordersMap[soNumber].total_igst += parseFloat(row.igst) || 0;
    ordersMap[soNumber].grand_total += parseFloat(row.item_total) || 0;
  }
  
  return { success: true, data: Object.values(ordersMap) };
}

/**
 * Get single order by SO Number - WITH ALL ITEMS
 */
function getOrderBySONumber(soNumber, sessionId) {
  try {
    Logger.log('getOrderBySONumber: ' + soNumber);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Check Sale_Orders first
    let sheet = ss.getSheetByName('Sale_Orders');
    let result = findOrderWithItems(sheet, soNumber);
    if (result) return { success: true, data: result, status: 'Pending' };
    
    // Check Completed_Orders
    sheet = ss.getSheetByName('Completed_Orders');
    result = findOrderWithItems(sheet, soNumber);
    if (result) return { success: true, data: result, status: 'Completed' };
    
    // Check Cancelled_Orders
    sheet = ss.getSheetByName('Cancelled_Orders');
    result = findOrderWithItems(sheet, soNumber);
    if (result) return { success: true, data: result, status: 'Cancelled' };
    
    return { success: false, message: 'Order not found: ' + soNumber };
    
  } catch (error) {
    Logger.log('getOrderBySONumber error: ' + error);
    return { success: false, message: error.message };
  }
}

/**
 * Helper: Find order with all items by SO number (ALL FIELDS)
 */
function findOrderWithItems(sheet, soNumber) {
  if (!sheet || sheet.getLastRow() < 2) return null;
  
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const soIndex = headers.indexOf('so_number');
  
  if (soIndex === -1) return null;
  
  let order = null;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][soIndex] !== soNumber) continue;
    
    const row = {};
    headers.forEach((header, index) => {
      row[header] = data[i][index];
    });
    
    if (!order) {
      // First item - create order object with ALL FIELDS
      order = {
        // Order Identification
        so_number: soNumber,
        rtwe_no: row.rtwe_no,
        costing_number: row.costing_number,
        
        // Order Details
        date: row.date,
        buyer: row.buyer,
        buyer_po_no: row.buyer_po_no,
        consignee: row.consignee,
        agent: row.agent,
        agent_indent_no: row.agent_indent_no,
        transport: row.transport,
        
        // Contract & Delivery
        contract_type: row.contract_type,
        contract_route: row.contract_route,
        mode_of_shipment: row.mode_of_shipment,
        delivery_terms: row.delivery_terms,
        payment_terms: row.payment_terms,
        bank: row.bank,
        so_type: row.so_type,
        terms_conditions: row.terms_conditions,
        gst_type: row.gst_type,
        
        // Technical Details
        warp_details: row.warp_details,
        weft_details: row.weft_details,
        sizing_details: row.sizing_details,
        weaving_details: row.weaving_details,
        selvedge_name: row.selvedge_name,
        selvedge_ends: row.selvedge_ends,
        selvedge_color: row.selvedge_color,
        inspection_type: row.inspection_type,
        finished_quality: row.finished_quality,
        buyer_product: row.buyer_product,
        bonus_commission: row.bonus_commission,
        delivery_date: row.delivery_date,
        
        // Order Meta
        remark: row.remark,
        status: row.status,
        created_by: row.created_by,
        created_at: row.created_at,
        
        // Items & Totals
        items: [],
        total_qty: 0,
        total_base: 0,
        total_cgst: 0,
        total_sgst: 0,
        total_igst: 0,
        grand_total: 0
      };
    }
    
    // Add item with ALL fields
    order.items.push({
      item_sno: row.item_sno,
      fabric_type: row.fabric_type,
      quality: row.quality,
      design: row.design,
      hsn_code: row.hsn_code,
      uom: row.uom,
      quantity: parseFloat(row.quantity) || 0,
      rate: parseFloat(row.rate) || 0,
      base_amount: parseFloat(row.base_amount) || 0,
      cgst: parseFloat(row.cgst) || 0,
      sgst: parseFloat(row.sgst) || 0,
      igst: parseFloat(row.igst) || 0,
      item_total: parseFloat(row.item_total) || 0,
      item_delivery_date: row.item_delivery_date,
      piece_length: row.piece_length,
      no_pieces: row.no_pieces
    });
    
    order.total_qty += parseFloat(row.quantity) || 0;
    order.total_base += parseFloat(row.base_amount) || 0;
    order.total_cgst += parseFloat(row.cgst) || 0;
    order.total_sgst += parseFloat(row.sgst) || 0;
    order.total_igst += parseFloat(row.igst) || 0;
    order.grand_total += parseFloat(row.item_total) || 0;
  }
  
  return order;
}

/**
 * Add new master data (buyer, consignee, agent, transport)
 */
/**
 * Add new master data (Agent/Buyer/Consignee)
 * Writes to single 'Master_Data' sheet
 */
function addMasterData(type, value, sessionId) {
  try {
    // Validate session
    const session = getSessionData(sessionId);
    if (!session) {
      return { success: false, message: 'Session expired' };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = null;
    const sheets = ss.getSheets();
    
    // Fuzzy search for Master Data sheet (CONTAINS logic)
    for (const s of sheets) {
      const cleanName = s.getName().toLowerCase().replace(/[^a-z0-9]/g, '');
      // Use INCLUDES to match "Master Data dropdown" etc.
      if (cleanName.includes('masterdata') || cleanName.includes('master')) {
        sheet = s;
        break;
      }
    }
    
    // Fallback specific attempts if fuzzy fails
    if (!sheet) sheet = ss.getSheetByName('Master Data dropdown');
    if (!sheet) sheet = ss.getSheetByName('Master_Data');
    if (!sheet) sheet = ss.getSheetByName('Master Data');
    
    if (!sheet) {
      return { success: false, message: 'Master Data sheet not found' };
    }

    const valueStr = String(value).trim();
    if (!valueStr) return { success: false, message: 'Value cannot be empty' };

    // Determine target column (1-based index)
    let targetCol = 0;
    
    // Mapping based on new single sheet structure:
    // D(4): Broker name (Agents)
    // F(6): Buyer name (Buyers/Consignees)
    
    if (type === 'agent') {
      targetCol = 4; // Column D
    } else if (type === 'buyer' || type === 'consignee') {
      targetCol = 6; // Column F
    } else if (type === 'transport') {
      targetCol = 5; // Column E
    } else {
      return { success: false, message: 'Unknown type: ' + type };
    }
    
    // Check for duplicates in that specific column
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const existingData = sheet.getRange(2, targetCol, lastRow - 1, 1).getValues();
      const exists = existingData.flat().some(v => String(v).toLowerCase().trim() === valueStr.toLowerCase());
      
      if (exists) {
        return { success: false, message: 'Entry already exists!' };
      }
    }
    
    // Find the first empty row in THAT specific column
    // Strategy: Find the last row *for this specific column*
    
    let lastRowInCol = 1;
    if (lastRow > 1) {
      const colValues = sheet.getRange(1, targetCol, lastRow, 1).getValues();
      for (let i = colValues.length - 1; i >= 0; i--) {
        if (colValues[i][0] !== "" && colValues[i][0] != null) {
          lastRowInCol = i + 1;
          break;
        }
      }
    }
    
    let insertRow = lastRowInCol + 1;
    
    // Write value
    sheet.getRange(insertRow, targetCol).setValue(valueStr);
    
    try {
      logUserActivity(sessionId, 'ADD_MASTER', 'Added ' + type + ': ' + valueStr);
    } catch(e) {}
    
    return { success: true, message: 'Added successfully!', value: valueStr };

  } catch (error) {
    Logger.log('addMasterData error: ' + error);
    return { success: false, message: error.toString() };
  }
}

// ============================================================================
// PENDING RTWE ORDERS (From imported RTWE Enquiry data)
// Sheet: "Pending orders RTWE"
// ============================================================================

/**
 * Get pending RTWE orders from "Pending orders RTWE" sheet
 * Filters out orders already converted to Sale Orders (status = 'SO_CREATED' or 'CANCELLED')
 */
function getPendingRTWEOrders(sessionId) {
  try {
    Logger.log('getPendingRTWEOrders called');
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Pending orders RTWE');
    
    if (!sheet) {
      Logger.log('Sheet "Pending orders RTWE" not found');
      return { success: false, data: [], message: 'Pending orders RTWE sheet not found' };
    }
    
    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      return { success: true, data: [] };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    Logger.log('Headers: ' + JSON.stringify(headers));
    
    // Find column indices dynamically
    const cols = {
      rtweNo: findColumnIndex(headers, ['rtwe', 'rtwe no', 'rtwe_no']),
      costingNo: findColumnIndex(headers, ['costing', 'costing no', 'costing sheet']),
      enqDate: findColumnIndex(headers, ['enquiry date', 'enq date', 'date']),
      broker: findColumnIndex(headers, ['broker', 'broker name']),
      quality: findColumnIndex(headers, ['quality']),
      givenRate: findColumnIndex(headers, ['given rate']),
      finalRate: findColumnIndex(headers, ['final rate']),
      buyer: findColumnIndex(headers, ['buyer']),
      poNo: findColumnIndex(headers, ['p/o', 'po no', 'po']),
      totalMTR: findColumnIndex(headers, ['total mtr', 'totalmtr']),
      totalOrderValue: findColumnIndex(headers, ['total order value', 'order value']),
      status: findColumnIndex(headers, ['so_status', 'status', 'sale order status'])
    };
    
    Logger.log('Column mapping: ' + JSON.stringify(cols));
    
    const orders = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Skip if RTWE No is empty
      const rtweNo = cols.rtweNo !== -1 ? String(row[cols.rtweNo] || '').trim() : '';
      if (!rtweNo) continue;
      
      // Skip if already processed (SO_CREATED or CANCELLED)
      const status = cols.status !== -1 ? String(row[cols.status] || '').trim().toUpperCase() : '';
      if (status === 'SO_CREATED' || status === 'CANCELLED') continue;
      
      orders.push({
        rowIndex: i + 1, // Sheet row number (1-indexed)
        rtweNo: rtweNo,
        costingNo: cols.costingNo !== -1 ? String(row[cols.costingNo] || '') : '',
        enqDate: cols.enqDate !== -1 ? formatDateValue(row[cols.enqDate]) : '',
        broker: cols.broker !== -1 ? String(row[cols.broker] || '') : '',
        quality: cols.quality !== -1 ? String(row[cols.quality] || '') : '',
        givenRate: cols.givenRate !== -1 ? String(row[cols.givenRate] || '') : '',
        finalRate: cols.finalRate !== -1 ? String(row[cols.finalRate] || '') : '',
        buyer: cols.buyer !== -1 ? String(row[cols.buyer] || '') : '',
        poNo: cols.poNo !== -1 ? String(row[cols.poNo] || '') : '',
        totalMTR: cols.totalMTR !== -1 ? String(row[cols.totalMTR] || '') : '',
        totalOrderValue: cols.totalOrderValue !== -1 ? String(row[cols.totalOrderValue] || '') : ''
      });
    }
    
    Logger.log('Returning ' + orders.length + ' pending RTWE orders');
    return { success: true, data: orders };
    
  } catch (error) {
    Logger.log('getPendingRTWEOrders error: ' + error.stack);
    return { success: false, data: [], message: error.message };
  }
}

/**
 * Get full details of a pending RTWE order by RTWE No
 */
function getPendingRTWEOrderDetails(rtweNo, sessionId) {
  try {
    Logger.log('getPendingRTWEOrderDetails called for: ' + rtweNo);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Pending orders RTWE');
    
    if (!sheet) {
      return null;
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Normalize search
    const searchRtwe = String(rtweNo).trim().toUpperCase().replace(/[-\s]/g, '');
    
    for (let i = 1; i < data.length; i++) {
      const sheetRtwe = String(data[i][0] || '').trim().toUpperCase().replace(/[-\s]/g, '');
      
      if (sheetRtwe === searchRtwe || sheetRtwe.includes(searchRtwe) || searchRtwe.includes(sheetRtwe)) {
        const row = data[i];
        
        // Build full details object - matching ORDER_CONFIRM_DATA structure
        return {
          rowIndex: i + 1,
          rtweNo: safeString(row[0]),
          costingNo: safeString(row[1]),
          enqDate: formatDateValue(row[2]),
          enqTime: safeString(row[3]),
          broker: safeString(row[4]),
          quality: safeString(row[5]),
          givenRate: safeString(row[6]),
          orderStatus: safeString(row[7]) || 'Confirmed',
          approvedDate: formatDateValue(row[8]),
          approvedTime: safeString(row[9]),
          finalRate: safeString(row[10]),
          buyer: safeString(row[11]),
          poNo: safeString(row[12]),
          qualityOrder: safeString(row[14]),
          design1: safeString(row[15]),
          taga1: safeString(row[16]),
          design2: safeString(row[17]),
          taga2: safeString(row[18]),
          design3: safeString(row[19]),
          taga3: safeString(row[20]),
          design4: safeString(row[21]),
          taga4: safeString(row[22]),
          design5: safeString(row[23]),
          taga5: safeString(row[24]),
          design6: safeString(row[25]),
          taga6: safeString(row[26]),
          totalOrderTaga: safeString(row[27]),
          countMeter: safeString(row[28]),
          totalMTR: safeString(row[29]),
          totalOrderValue: safeString(row[30]),
          selvedgeName: safeString(row[31]),
          selvedgeEnds: safeString(row[32]),
          selvedgeColor: safeString(row[33]),
          yarnUsed: safeString(row[34]),
          sizingBeam: safeString(row[35]),
          paymentTerms: safeString(row[36]),
          deliveryDate: formatDateValue(row[37]),
          remark: safeString(row[38])
        };
      }
    }
    
    Logger.log('RTWE order not found: ' + rtweNo);
    return null;
    
  } catch (error) {
    Logger.log('getPendingRTWEOrderDetails error: ' + error.stack);
    return null;
  }
}

/**
 * Cancel a pending RTWE order - move to cancelled status
 */
function cancelPendingRTWEOrder(rtweNo, reason, sessionId) {
  try {
    Logger.log('cancelPendingRTWEOrder called for: ' + rtweNo);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Pending orders RTWE');
    
    if (!sheet) {
      return { success: false, message: 'Sheet not found' };
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find status column (or last column if not found)
    let statusCol = findColumnIndex(headers, ['so_status', 'status', 'sale order status']);
    if (statusCol === -1) {
      // Add status column if not exists
      statusCol = headers.length;
      sheet.getRange(1, statusCol + 1).setValue('so_status');
    }
    
    // Find the row
    const searchRtwe = String(rtweNo).trim().toUpperCase().replace(/[-\s]/g, '');
    
    for (let i = 1; i < data.length; i++) {
      const sheetRtwe = String(data[i][0] || '').trim().toUpperCase().replace(/[-\s]/g, '');
      
      if (sheetRtwe === searchRtwe || sheetRtwe.includes(searchRtwe)) {
        // Update status to CANCELLED and add reason
        sheet.getRange(i + 1, statusCol + 1).setValue('CANCELLED');
        
        // Find remark column and append reason
        const remarkCol = findColumnIndex(headers, ['remark', 'remarks']);
        if (remarkCol !== -1) {
          const currentRemark = data[i][remarkCol] || '';
          const newRemark = currentRemark + (currentRemark ? ' | ' : '') + 'CANCELLED: ' + reason;
          sheet.getRange(i + 1, remarkCol + 1).setValue(newRemark);
        }
        
        Logger.log('RTWE order cancelled: ' + rtweNo);
        return { success: true, message: 'Order cancelled successfully' };
      }
    }
    
    return { success: false, message: 'Order not found: ' + rtweNo };
    
  } catch (error) {
    Logger.log('cancelPendingRTWEOrder error: ' + error.stack);
    return { success: false, message: error.message };
  }
}

/**
 * Mark RTWE order as processed (Sale Order Created)
 * Called after a sale order is successfully created
 */
function markRTWEOrderAsProcessed(rtweNo, soNumber) {
  try {
    Logger.log('markRTWEOrderAsProcessed: ' + rtweNo + ' -> ' + soNumber);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Pending orders RTWE');
    
    if (!sheet) {
      Logger.log('Sheet not found');
      return false;
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Find or add status column
    let statusCol = findColumnIndex(headers, ['so_status', 'status', 'sale order status']);
    if (statusCol === -1) {
      statusCol = headers.length;
      sheet.getRange(1, statusCol + 1).setValue('so_status');
    }
    
    // Find SO No column (column 13 in ORDER_CONFIRM_DATA)
    let soNoCol = findColumnIndex(headers, ['s/o no', 'so no', 'sale order no']);
    if (soNoCol === -1) {
      soNoCol = 12; // Default to column 13 (index 12)
    }
    
    // Find the row
    const searchRtwe = String(rtweNo).trim().toUpperCase().replace(/[-\s]/g, '');
    
    for (let i = 1; i < data.length; i++) {
      const sheetRtwe = String(data[i][0] || '').trim().toUpperCase().replace(/[-\s]/g, '');
      
      if (sheetRtwe === searchRtwe || sheetRtwe.includes(searchRtwe)) {
        // Update status and SO number
        sheet.getRange(i + 1, statusCol + 1).setValue('SO_CREATED');
        sheet.getRange(i + 1, soNoCol + 1).setValue(soNumber);
        
        Logger.log('Marked RTWE ' + rtweNo + ' as processed with SO: ' + soNumber);
        return true;
      }
    }
    
    Logger.log('RTWE order not found: ' + rtweNo);
    return false;
    
  } catch (error) {
    Logger.log('markRTWEOrderAsProcessed error: ' + error.stack);
    return false;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function findColumnIndex(headers, possibleNames) {
  for (let i = 0; i < headers.length; i++) {
    const header = String(headers[i]).toLowerCase().trim();
    for (const name of possibleNames) {
      if (header.includes(name.toLowerCase())) {
        return i;
      }
    }
  }
  return -1;
}

function safeString(value) {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

function formatDateValue(value) {
  if (!value) return '';
  try {
    if (value instanceof Date) {
      return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    }
    return String(value);
  } catch (e) {
    return String(value);
  }
}
