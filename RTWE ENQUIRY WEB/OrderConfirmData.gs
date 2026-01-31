// ============================================
// ORDER CONFIRM DATA MANAGEMENT - JSON FORMAT VERSION
// UPDATED: Design & TAGA stored as JSON in columns P & Q
// Complete file - ready to paste
// ============================================

/**
 * Get all confirmed enquiries from ORDER_CONFIRM_DATA sheet
 * @param {Object} filters - Optional filters for search
 */
function getConfirmedEnquiries(filters) {
  try {
    Logger.log('========================================');
    Logger.log('🔍 getConfirmedEnquiries START');
    Logger.log('Timestamp: ' + new Date().toISOString());
    Logger.log('Filters: ' + JSON.stringify(filters));
    Logger.log('========================================');
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('ORDER_CONFIRM_DATA');
    
    if (!sheet) {
      Logger.log('❌ ORDER_CONFIRM_DATA sheet not found!');
      return [];
    }
    
    Logger.log('✅ ORDER_CONFIRM_DATA sheet found');
    
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    
    Logger.log('📊 Last Row: ' + lastRow);
    Logger.log('📊 Last Column: ' + lastCol);
    
    if (lastRow <= 1) {
      Logger.log('⚠️ Sheet is empty or only has headers');
      return [];
    }
    
    const data = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    const headers = data[0];
    
    Logger.log('📋 Headers: ' + JSON.stringify(headers));
    
    // Find column indices - flexible matching
    const cols = {
      rtweNo: headers.findIndex(h => h && String(h).toLowerCase().includes('rtwe')),
      costingNo: headers.findIndex(h => h && String(h).toLowerCase().includes('costing')),
      enqDate: headers.findIndex(h => h && String(h).toLowerCase().includes('enquiry date')),
      broker: headers.findIndex(h => h && String(h).toLowerCase().includes('broker')),
      quality: headers.findIndex(h => h && String(h).toLowerCase().includes('quality')),
      givenRate: headers.findIndex(h => h && String(h).toLowerCase().includes('given rate')),
      orderStatus: headers.findIndex(h => h && String(h).toLowerCase().includes('order status')),
      finalRate: headers.findIndex(h => h && String(h).toLowerCase().includes('final rate')),
      buyer: headers.findIndex(h => h && String(h).toLowerCase().includes('buyer')),
      poNo: headers.findIndex(h => h && String(h).toLowerCase().includes('p/o'))
    };
    
    Logger.log('🔍 Column mapping:');
    Logger.log('  RTWE No: Col ' + (cols.rtweNo + 1));
    Logger.log('  Broker: Col ' + (cols.broker + 1));
    Logger.log('  Buyer: Col ' + (cols.buyer + 1));
    Logger.log('  Final Rate: Col ' + (cols.finalRate + 1));
    Logger.log('  P/O No: Col ' + (cols.poNo + 1));
    
    if (cols.rtweNo === -1) {
      Logger.log('❌ RTWE No column not found!');
      return [];
    }
    
    // Build enquiries array
    const enquiries = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      
      // Skip empty rows
      if (!row[cols.rtweNo] || String(row[cols.rtweNo]).trim() === '') {
        continue;
      }
      
      const enquiry = {
        rtweNo: String(row[cols.rtweNo] || '').trim(),
        costingNo: cols.costingNo !== -1 ? String(row[cols.costingNo] || '').trim() : '',
        broker: cols.broker !== -1 ? String(row[cols.broker] || '').trim() : '',
        quality: cols.quality !== -1 ? String(row[cols.quality] || '').trim() : '',
        givenRate: cols.givenRate !== -1 ? String(row[cols.givenRate] || '') : '',
        finalRate: cols.finalRate !== -1 ? String(row[cols.finalRate] || '') : '',
        buyer: cols.buyer !== -1 ? String(row[cols.buyer] || '').trim() : '',
        poNo: cols.poNo !== -1 ? String(row[cols.poNo] || '').trim() : '',
        orderStatus: cols.orderStatus !== -1 ? String(row[cols.orderStatus] || '') : 'Confirmed'
      };
      
      // Apply filters if provided
      if (filters) {
        if (filters.rtweNo && !enquiry.rtweNo.toLowerCase().includes(filters.rtweNo.toLowerCase())) {
          continue;
        }
        if (filters.broker && !enquiry.broker.toLowerCase().includes(filters.broker.toLowerCase())) {
          continue;
        }
        if (filters.buyer && !enquiry.buyer.toLowerCase().includes(filters.buyer.toLowerCase())) {
          continue;
        }
      }
      
      enquiries.push(enquiry);
    }
    
    Logger.log('========================================');
    Logger.log('✅ SUCCESS - Returning ' + enquiries.length + ' confirmed orders');
    Logger.log('========================================');
    
    return enquiries;
    
  } catch (error) {
    Logger.log('========================================');
    Logger.log('❌ CRITICAL ERROR in getConfirmedEnquiries');
    Logger.log('Error message: ' + error.message);
    Logger.log('Stack trace: ' + error.stack);
    Logger.log('========================================');
    
    return [];
  }
}

/**
 * Load a specific confirmed enquiry by RTWE number
 * UPDATED: Reads Design & TAGA from JSON format in columns P & Q
 * @param {string} rtweNo - RTWE number to load
 */
function loadConfirmedEnquiryData(rtweNo) {
  try {
    Logger.log('========================================');
    Logger.log('🔍 loadConfirmedEnquiryData called for: ' + rtweNo);
    Logger.log('========================================');
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('ORDER_CONFIRM_DATA');
    
    if (!sheet) {
      Logger.log('❌ ORDER_CONFIRM_DATA sheet not found');
      return null;
    }
    
    const lastRow = sheet.getLastRow();
    Logger.log('📊 Sheet has ' + lastRow + ' rows');
    
    if (lastRow <= 1) {
      Logger.log('❌ No data in ORDER_CONFIRM_DATA sheet');
      return null;
    }
    
    const data = sheet.getRange(1, 1, lastRow, sheet.getLastColumn()).getValues();
    const headers = data[0];
    
    Logger.log('📋 Headers: ' + JSON.stringify(headers));
    Logger.log('🔍 Searching for RTWE: ' + rtweNo);
    
    // Normalize search term
    const searchRtwe = String(rtweNo).trim().toUpperCase().replace(/[-\s]/g, '');
    Logger.log('🔍 Normalized search: ' + searchRtwe);
    
    // Search through all rows
    for (let i = 1; i < data.length; i++) {
      const sheetRtwe = String(data[i][0] || '').trim().toUpperCase().replace(/[-\s]/g, '');
      
      Logger.log('Row ' + (i + 1) + ' RTWE: ' + sheetRtwe);
      
      if (sheetRtwe === searchRtwe || sheetRtwe.includes(searchRtwe) || searchRtwe.includes(sheetRtwe)) {
        Logger.log('✅ Found matching order at row ' + (i + 1));
        
        const row = data[i];
        
        // Helper function to safely convert dates
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
        
        // Helper function to safely convert to string
        function safeString(value) {
          if (value === null || value === undefined) return '';
          return String(value).trim();
        }
        
        // ============================================
        // NEW COLUMN MAPPING - JSON FORMAT
        // ============================================
        // Based on your column mapping:
        // Column P (index 15): Design (JSON array)
        // Column Q (index 16): TAGA (JSON array)
        // Columns R onwards shifted accordingly
        // ============================================
        
        const enquiryData = {
          rtweNo: safeString(row[0]),           // A - RTWE No
          costingNo: safeString(row[1]),        // B - Costing Sheet No
          enqDate: formatDateValue(row[2]),     // C - Enquiry Date
          enqTime: safeString(row[3]),          // D - Enquiry Time
          broker: safeString(row[4]),           // E - Broker Name
          quality: safeString(row[5]),          // F - Quality
          givenRate: safeString(row[6]),        // G - Given Rate
          orderStatus: safeString(row[7]) || 'Confirmed', // H - Order Status
          approvedDate: formatDateValue(row[8]), // I - Approved Date
          approvedTime: safeString(row[9]),     // J - Approved Time
          finalRate: safeString(row[10]),       // K - Final Rate
          buyer: safeString(row[11]),           // L - Buyer
          poNo: safeString(row[12]),            // M - P/O No
          soNo: safeString(row[13]),            // N - S/O No
          qualityOrder: safeString(row[14]),    // O - Quality Order
          
          // ============================================
          // READ JSON FROM COLUMNS P & Q
          // ============================================
          designJson: safeString(row[15]),      // P - Design (JSON)
          tagaJson: safeString(row[16]),        // Q - TAGA (JSON)
          
          // ============================================
          // UPDATED COLUMN INDICES (shifted after P & Q)
          // ============================================
          totalOrderTaga: safeString(row[17]),  // R - Total Order Taga
          countMeter: safeString(row[18]),      // S - Count Meter
          totalMTR: safeString(row[19]),        // T - Total MTR
          totalOrderValue: safeString(row[20]), // U - Total Order Value
          selvedgeName: safeString(row[21]),    // V - Name of Selvedge
          selvedgeEnds: safeString(row[22]),    // W - Ends of Selvedge
          selvedgeColor: safeString(row[23]),   // X - Color of Selvedge
          remark: safeString(row[24]),          // Y - Remark
          yarnUsed: safeString(row[25]),        // Z - Yarn to be Used
          sizingBeam: safeString(row[26]),      // AA - Sizing Beam Meter
          paymentTerms: safeString(row[27]),    // AB - Payment Terms
          deliveryDate: formatDateValue(row[28]), // AC - Delivery Date
          orderRemark: safeString(row[29]),     // AD - Remark (second)
          createdDate: formatDateValue(row[30]), // AE - Created Date
          createdTime: safeString(row[31]),     // AF - Created Time
          createdBy: safeString(row[32]),       // AG - Created By
          userId: safeString(row[33]),          // AH - User ID
          
          isConfirmed: true,
          sourceSheet: 'ORDER_CONFIRM_DATA'
        };
        
        // ============================================
        // PARSE JSON DESIGN & TAGA INTO DESIGNS ARRAY
        // ============================================
        
        let designsArray = [];
        let tagasArray = [];
        
        // Parse Design JSON (Column P)
        if (enquiryData.designJson) {
          try {
            const parsed = JSON.parse(enquiryData.designJson);
            if (Array.isArray(parsed)) {
              designsArray = parsed;
              Logger.log('✅ Parsed ' + designsArray.length + ' designs from JSON');
            }
          } catch (e) {
            Logger.log('⚠️ Failed to parse Design JSON: ' + e.message);
            Logger.log('   Raw value: ' + enquiryData.designJson);
          }
        }
        
        // Parse TAGA JSON (Column Q)
        if (enquiryData.tagaJson) {
          try {
            const parsed = JSON.parse(enquiryData.tagaJson);
            if (Array.isArray(parsed)) {
              tagasArray = parsed;
              Logger.log('✅ Parsed ' + tagasArray.length + ' tagas from JSON');
            }
          } catch (e) {
            Logger.log('⚠️ Failed to parse TAGA JSON: ' + e.message);
            Logger.log('   Raw value: ' + enquiryData.tagaJson);
          }
        }
        
        // Build designs array combining Design + TAGA
        enquiryData.designs = [];
        const maxLength = Math.max(designsArray.length, tagasArray.length);
        
        for (let j = 0; j < maxLength; j++) {
          enquiryData.designs.push({
            design: designsArray[j] || '',
            taga: tagasArray[j] || '0'
          });
        }
        
        Logger.log('📦 Built designs array: ' + enquiryData.designs.length + ' items');
        
        // Also set old format fields for backward compatibility
        for (let d = 1; d <= 6; d++) {
          const index = d - 1;
          if (index < enquiryData.designs.length) {
            enquiryData['design' + d] = enquiryData.designs[index].design;
            enquiryData['taga' + d] = enquiryData.designs[index].taga;
          } else {
            enquiryData['design' + d] = '';
            enquiryData['taga' + d] = '';
          }
        }
        
        Logger.log('📦 Returning data:');
        Logger.log('  RTWE: ' + enquiryData.rtweNo);
        Logger.log('  Broker: ' + enquiryData.broker);
        Logger.log('  Buyer: ' + enquiryData.buyer);
        Logger.log('  Final Rate: ' + enquiryData.finalRate);
        Logger.log('  Designs Count: ' + enquiryData.designs.length);
        Logger.log('  First Design: ' + (enquiryData.designs[0] ? JSON.stringify(enquiryData.designs[0]) : 'none'));
        
        return enquiryData;
      }
    }
    
    Logger.log('❌ No matching order found for RTWE: ' + rtweNo);
    Logger.log('========================================');
    return null;
    
  } catch (error) {
    Logger.log('========================================');
    Logger.log('❌ loadConfirmedEnquiryData error: ' + error.message);
    Logger.log('Stack trace: ' + error.stack);
    Logger.log('========================================');
    return null;
  }
}

/**
 * Load pending enquiry data (for approval from Pending Enquiries page)
 * NOT CHANGED - PENDING_APPROVED sheet doesn't use JSON format
 * @param {string} rtweNo - RTWE number to load
 */
function loadPendingEnquiryData(rtweNo) {
  try {
    Logger.log('🔍 loadPendingEnquiryData called for: ' + rtweNo);
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('PENDING_APPROVED');
    
    if (!sheet) {
      Logger.log('❌ PENDING_APPROVED sheet not found');
      return null;
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      Logger.log('❌ No data in PENDING_APPROVED sheet');
      return null;
    }
    
    // Normalize search term
    const searchRtwe = String(rtweNo).trim().toUpperCase().replace(/[-\s]/g, '');
    
    // Search through all rows
    for (let i = 1; i < data.length; i++) {
      const sheetRtwe = String(data[i][0] || '').trim().toUpperCase().replace(/[-\s]/g, '');
      
      if (sheetRtwe === searchRtwe || sheetRtwe.includes(searchRtwe) || searchRtwe.includes(sheetRtwe)) {
        Logger.log('✅ Found matching pending enquiry at row ' + (i + 1));
        
        const row = data[i];
        
        // Helper functions
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
        
        function safeString(value) {
          if (value === null || value === undefined) return '';
          return String(value).trim();
        }
        
        // PENDING_APPROVED uses old column structure (no JSON)
        const enquiryData = {
          rtweNo: safeString(row[0]),
          costingNo: safeString(row[1]),
          enqDate: formatDateValue(row[2]),
          enqTime: safeString(row[3]),
          broker: safeString(row[4]),
          quality: safeString(row[5]),
          givenRate: safeString(row[6]),
          orderStatus: safeString(row[7]) || 'Pending',
          approvedDate: formatDateValue(row[8]),
          approvedTime: safeString(row[9]),
          finalRate: safeString(row[10]),
          buyer: safeString(row[11]),
          poNo: safeString(row[12]),
          isPending: true,
          sourceSheet: 'PENDING_APPROVED'
        };
        
        return enquiryData;
      }
    }
    
    Logger.log('❌ No matching pending enquiry found for RTWE: ' + rtweNo);
    return null;
    
  } catch (error) {
    Logger.log('❌ loadPendingEnquiryData error: ' + error.message);
    return null;
  }
}

/**
 * Update an existing confirmed enquiry in ORDER_CONFIRM_DATA sheet
 * UPDATED: Writes Design & TAGA as JSON to columns P & Q
 * @param {Object} formData - Form data to save
 */
function updateConfirmedEnquiry(formData) {
  try {
    Logger.log('========================================');
    Logger.log('📝 updateConfirmedEnquiry START');
    Logger.log('RTWE No: ' + formData.rtweNo);
    Logger.log('========================================');
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('ORDER_CONFIRM_DATA');
    
    if (!sheet) {
      return {
        success: false,
        error: 'ORDER_CONFIRM_DATA sheet not found'
      };
    }
    
    const data = sheet.getDataRange().getValues();
    let foundRow = -1;
    
    // Normalize search term
    const searchRtwe = String(formData.rtweNo).trim().toUpperCase().replace(/[-\s]/g, '');
    
    // Find the row with matching RTWE No
    for (let i = 1; i < data.length; i++) {
      const sheetRtwe = String(data[i][0] || '').trim().toUpperCase().replace(/[-\s]/g, '');
      
      if (sheetRtwe === searchRtwe) {
        foundRow = i + 1; // +1 because sheet rows are 1-indexed
        Logger.log('✅ Found row to update: ' + foundRow);
        break;
      }
    }
    
    if (foundRow === -1) {
      return {
        success: false,
        error: 'RTWE No not found in ORDER_CONFIRM_DATA: ' + formData.rtweNo
      };
    }
    
    // ============================================
    // BUILD DESIGN & TAGA JSON ARRAYS
    // ============================================
    
    let designsArray = [];
    let tagasArray = [];
    
    if (formData.designs && Array.isArray(formData.designs)) {
      formData.designs.forEach(item => {
        designsArray.push(item.design || '');
        tagasArray.push(item.taga || '0');
      });
    }
    
    const designJson = JSON.stringify(designsArray);
    const tagaJson = JSON.stringify(tagasArray);
    
    Logger.log('📦 Design JSON: ' + designJson);
    Logger.log('📦 TAGA JSON: ' + tagaJson);
    
    // ============================================
    // PREPARE ROW DATA - NEW COLUMN MAPPING
    // ============================================
    
    const rowData = [
      formData.rtweNo,                    // 0 - A: RTWE No
      formData.costingNo,                 // 1 - B: Costing Sheet No
      formData.enqDate,                   // 2 - C: Enquiry Date
      formData.enqTime,                   // 3 - D: Enquiry Time
      formData.broker,                    // 4 - E: Broker Name
      formData.quality,                   // 5 - F: Quality
      formData.givenRate,                 // 6 - G: Given Rate
      formData.orderStatus || 'Confirmed',// 7 - H: Order Status
      formData.approvedDate || '',        // 8 - I: Approved Date
      formData.approvedTime || '',        // 9 - J: Approved Time
      formData.finalRate || '',           // 10 - K: Final Rate
      formData.buyer || '',               // 11 - L: Buyer
      formData.poNo || '',                // 12 - M: P/O No
      formData.soNo || '',                // 13 - N: S/O No
      formData.qualityOrder || '',        // 14 - O: Quality Order
      designJson,                         // 15 - P: Design (JSON)
      tagaJson,                           // 16 - Q: TAGA (JSON)
      formData.totalOrderTaga || '',      // 17 - R: Total Order Taga
      formData.countMeter || '',          // 18 - S: Count Meter
      formData.totalMTR || '',            // 19 - T: Total MTR
      formData.totalOrderValue || '',     // 20 - U: Total Order Value
      formData.selvedgeName || '',        // 21 - V: Name of Selvedge
      formData.selvedgeEnds || '',        // 22 - W: Ends of Selvedge
      formData.selvedgeColor || '',       // 23 - X: Color of Selvedge
      formData.remark || '',              // 24 - Y: Remark
      formData.yarnUsed || '',            // 25 - Z: Yarn to be Used
      formData.sizingBeam || '',          // 26 - AA: Sizing Beam Meter
      formData.paymentTerms || '',        // 27 - AB: Payment Terms
      formData.deliveryDate || '',        // 28 - AC: Delivery Date
      formData.orderRemark || ''          // 29 - AD: Remark (second)
    ];
    
    // Update the row
    sheet.getRange(foundRow, 1, 1, rowData.length).setValues([rowData]);
    
    Logger.log('✅ Updated row ' + foundRow + ' for RTWE: ' + formData.rtweNo);
    Logger.log('========================================');
    
    return {
      success: true,
      rtweNo: formData.rtweNo,
      message: 'Order updated successfully'
    };
    
  } catch (error) {
    Logger.log('========================================');
    Logger.log('❌ updateConfirmedEnquiry error: ' + error.message);
    Logger.log('Stack trace: ' + error.stack);
    Logger.log('========================================');
    
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Serve Order Confirm Data page
 */
function serveOrderConfirmData(sessionId) {
  const session = getSessionData(sessionId);
  
  if (!session) {
    return serveLogin('Session expired. Please login again.');
  }
  
  const template = HtmlService.createTemplateFromFile('OrderConfirmData');
  template.sessionId = sessionId;
  template.userName = session.name || session.userName || 'User';
  
  return template.evaluate()
    .setTitle('Order Confirm Data - RTWE')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setSandboxMode(HtmlService.SandboxMode.IFRAME);
}

/**
 * Test function - verify JSON data loads correctly
 */
function testLoadConfirmedEnquiry() {
  Logger.clear();
  Logger.log('========================================');
  Logger.log('🧪 TESTING loadConfirmedEnquiryData (JSON FORMAT)');
  Logger.log('========================================');
  
  // Replace with an actual RTWE number from your sheet
  const testRtwe = 'RTWE-0001';
  const result = loadConfirmedEnquiryData(testRtwe);
  
  if (result) {
    Logger.log('✅ SUCCESS! Data loaded:');
    Logger.log('  RTWE: ' + result.rtweNo);
    Logger.log('  Broker: ' + result.broker);
    Logger.log('  Buyer: ' + result.buyer);
    Logger.log('  Final Rate: ' + result.finalRate);
    Logger.log('  Designs: ' + JSON.stringify(result.designs));
    Logger.log('  Design1 (compat): ' + result.design1);
    Logger.log('  Taga1 (compat): ' + result.taga1);
    
    // Test JSON serialization
    try {
      const jsonString = JSON.stringify(result);
      Logger.log('\n✅ JSON Serialization: SUCCESS');
      Logger.log('  JSON Length: ' + jsonString.length + ' chars');
    } catch (e) {
      Logger.log('\n❌ JSON Serialization FAILED: ' + e.message);
    }
  } else {
    Logger.log('❌ FAILED - No data returned');
    Logger.log('   Make sure RTWE number exists in ORDER_CONFIRM_DATA sheet');
  }
  
  Logger.log('========================================');
}