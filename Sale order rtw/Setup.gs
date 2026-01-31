/**
 * ============================================================================
 * RTWE SALE ORDER SYSTEM - SETUP FILE
 * Creates all required sheets with headers
 * ============================================================================
 * 
 * Run createAllSheets() to set up the entire database
 * 
 * SHEETS TO CREATE:
 * 1. Users - User authentication
 * 2. Sale_Orders - Pending orders (from Order Confirm import)
 * 3. Completed_Orders - Completed sale orders
 * 4. Cancelled_Orders - Cancelled orders
 * 5. Master_Agents - Agent master data
 * 6. Master_Transport - Transport master data
 * 7. Master_Others - Buyers, Consignees etc
 * 8. USER_ACTIVITY_LOG - Login/activity tracking
 * 9. Settings - System settings
 */

// ============================================================================
// MAIN SETUP FUNCTION
// ============================================================================

function createAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  // Confirm before running
  const response = ui.alert(
    '⚠️ Setup Sale Order System',
    'This will DELETE ALL existing sheets and recreate them.\n\n⚠️ ALL DATA WILL BE LOST!\n\nContinue?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) {
    ui.alert('Setup cancelled.');
    return;
  }
  
  Logger.log('=== STARTING SALE ORDER SETUP ===');
  
  // DELETE ALL EXISTING SHEETS FIRST
  deleteAllSheets(ss);
  
  // Create all sheets
  createUsersSheet(ss);
  createSaleOrdersSheet(ss);
  createCompletedOrdersSheet(ss);
  createCancelledOrdersSheet(ss);
  createMasterAgentsSheet(ss);
  createMasterTransportSheet(ss);
  createMasterOthersSheet(ss);
  createMasterDropdownSheet(ss);  // NEW: Fixed dropdown options
  createUserActivityLogSheet(ss);
  createSettingsSheet(ss);
  
  // Create default admin user
  createDefaultAdmin(ss);
  
  // NEW: Populate master data with pre-filled values
  populateMasterData();
  
  Logger.log('=== SETUP COMPLETE ===');
  
  ui.alert('✅ Setup Complete!', 
    'All sheets have been created with pre-filled master data.\n\n' +
    'Includes:\n' +
    '• 9 Agents\n' +
    '• 9 Transport\n' +
    '• 45 Buyers\n' +
    '• All dropdown options\n\n' +
    'Default admin:\n' +
    'Email: admin@rtwe.com\n' +
    'Password: Admin@123',
    ui.ButtonSet.OK
  );
}

/**
 * DELETE ALL SHEETS (except protected sheets)
 * PROTECTED SHEETS: 'Pending orders RTWE' and any sheet starting with 'RTWE'
 */
function deleteAllSheets(ss) {
  // Get spreadsheet if not provided
  if (!ss) {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  
  // PROTECTED SHEETS - These will NOT be deleted
  const protectedSheets = [
    'Pending orders RTWE',
    'PENDING_DATA',
    'PENDING_APPROVED',
    'ORDER_CONFIRM_DATA',
    'ENQUIRY_CLOSED_DATA'
  ];
  
  // Get sheet names first (NOT references)
  const sheets = ss.getSheets();
  const sheetNames = sheets.map(s => s.getName());
  
  // Check if any protected sheet exists
  const protectedExists = sheetNames.some(name => protectedSheets.includes(name));
  
  Logger.log('Total sheets: ' + sheetNames.length);
  Logger.log('Protected sheets will be kept');
  
  // Create a temporary sheet to keep (Google requires at least 1 sheet)
  ss.insertSheet('_TEMP_DELETE_');
  
  // Delete all original sheets BY NAME except protected
  for (let i = 0; i < sheetNames.length; i++) {
    const sheetName = sheetNames[i];
    
    // Skip protected sheets
    if (protectedSheets.includes(sheetName)) {
      Logger.log('PROTECTED - Keeping: ' + sheetName);
      continue;
    }
    
    try {
      const sheetToDelete = ss.getSheetByName(sheetName);
      if (sheetToDelete) {
        ss.deleteSheet(sheetToDelete);
        Logger.log('Deleted: ' + sheetName);
      }
    } catch (e) {
      Logger.log('Could not delete: ' + sheetName + ' - ' + e);
    }
  }
  
  Logger.log('Setup sheets deleted. Protected sheets kept.');
}

/**
 * Run this separately to just delete all sheets
 */
function deleteAllSheetsOnly() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  const response = ui.alert(
    '⚠️ DELETE ALL SHEETS',
    'This will DELETE ALL sheets!\n\n⚠️ ALL DATA WILL BE LOST!\n\nContinue?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) {
    ui.alert('Cancelled.');
    return;
  }
  
  deleteAllSheets(ss);
  
  ui.alert('All sheets deleted. Run createAllSheets() to recreate.');
}

// ============================================================================
// SHEET CREATION FUNCTIONS
// ============================================================================

/**
 * Create Users sheet
 */
function createUsersSheet(ss) {
  let sheet = ss.getSheetByName('Users');
  
  if (!sheet) {
    sheet = ss.insertSheet('Users');
    Logger.log('Created Users sheet');
  }
  
  const headers = [
    'user_id', 'email', 'password', 'full_name', 'phone', 
    'role', 'status', 'created_at', 'last_login'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#6B4423')
    .setFontColor('white')
    .setFontWeight('bold');
  
  sheet.setFrozenRows(1);
  Logger.log('Users sheet configured');
}

/**
 * Create Sale_Orders sheet (Complete Multi-Item Support)
 * All fields from comprehensive Sale Order Form
 */
function createSaleOrdersSheet(ss) {
  let sheet = ss.getSheetByName('Sale_Orders');
  
  if (!sheet) {
    sheet = ss.insertSheet('Sale_Orders');
    Logger.log('Created Sale_Orders sheet');
  } else {
    // Clear existing headers
    sheet.clear();
  }
  
  // COMPLETE HEADERS - 45 columns for all fields
  const headers = [
    // Order Identification
    'so_number',          // A: Sale Order Number (same for all items)
    'item_sno',           // B: Item Serial Number (1, 2, 3...)
    'rtwe_no',            // C: Reference RTWE Number
    'costing_number',     // D: Costing Reference
    
    // Order Details
    'date',               // E: Order Date
    'buyer',              // F: Buyer Name
    'buyer_po_no',        // G: Buyer PO Number
    'consignee',          // H: Consignee Name
    'agent',              // I: Agent Name
    'agent_indent_no',    // J: Agent Indent Number
    'transport',          // K: Transport Name
    
    // Contract & Delivery
    'contract_type',      // L: DOMESTIC / EXPORT
    'contract_route',     // M: SELF RUNNING / JOB WORK
    'mode_of_shipment',   // N: ROAD / RAIL / AIR / SEA
    'delivery_terms',     // O: FOR / FOB / CIF / EX-WORKS
    'payment_terms',      // P: Payment Terms
    'bank',               // Q: Bank Name
    'so_type',            // R: BULK / SAMPLE
    'terms_conditions',   // S: T&C Reference
    'gst_type',           // T: CGST/SGST or IGST
    
    // Item Details (per row)
    'fabric_type',        // U: COTTON / POLYESTER / BLEND / SILK
    'quality',            // V: Quality Specification
    'design',             // W: Design Name
    'hsn_code',           // X: HSN Code
    'uom',                // Y: Unit (MTR / KG / PCS)
    'quantity',           // Z: Quantity
    'rate',               // AA: Rate per unit
    'base_amount',        // AB: Base Amount
    'cgst',               // AC: CGST Amount
    'sgst',               // AD: SGST Amount
    'igst',               // AE: IGST Amount
    'item_total',         // AF: Item Total
    'item_delivery_date', // AG: Per-item Delivery Date
    'piece_length',       // AH: Piece Length
    'no_pieces',          // AI: Number of Pieces
    
    // Technical Details (shared across items)
    'warp_details',       // AJ: Warp Details
    'weft_details',       // AK: Weft Details
    'sizing_details',     // AL: Sizing Details
    'weaving_details',    // AM: Weaving Details
    'selvedge_name',      // AN: Selvedge Name
    'selvedge_ends',      // AO: Selvedge Ends
    'selvedge_color',     // AP: Selvedge Color
    'inspection_type',    // AQ: Inspection Type
    'finished_quality',   // AR: Finished Quality
    'buyer_product',      // AS: Buyer Product Code
    'bonus_commission',   // AT: Bonus Commission
    'delivery_date',      // AU: Main Delivery Date
    
    // Order Meta
    'remark',             // AV: Remarks
    'status',             // AW: Pending / Complete / Cancelled
    'created_by',         // AX: Creator User
    'created_at',         // AY: Created Date/Time
    'updated_at'          // AZ: Last Updated
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#FF9800')
    .setFontColor('white')
    .setFontWeight('bold');
  
  sheet.setFrozenRows(1);
  Logger.log('Sale_Orders sheet configured with ' + headers.length + ' columns (Complete Form)');
}

/**
 * Create Completed_Orders sheet
 */
function createCompletedOrdersSheet(ss) {
  let sheet = ss.getSheetByName('Completed_Orders');
  
  if (!sheet) {
    sheet = ss.insertSheet('Completed_Orders');
    Logger.log('Created Completed_Orders sheet');
  }
  
  // Same headers as Sale_Orders plus completion info
  const headers = [
    'so_number', 'rtwe_no', 'date', 'buyer', 'buyer_po_no', 
    'consignee', 'agent', 'agent_indent_no', 'transport',
    'contract_type', 'contract_route', 'so_type', 'mode_of_shipment',
    'payment_terms', 'delivery_terms', 'delivery_date', 'bank', 'terms_conditions',
    'quality', 'quantity', 'rate', 'hsn_code', 'gst_type',
    'base_amount', 'cgst', 'sgst', 'igst', 'discount', 'additions', 'final_amount',
    'remark', 'status', 'created_by', 'created_at', 
    'completed_by', 'completed_at'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#4CAF50')
    .setFontColor('white')
    .setFontWeight('bold');
  
  sheet.setFrozenRows(1);
  Logger.log('Completed_Orders sheet configured');
}

/**
 * Create Cancelled_Orders sheet
 */
function createCancelledOrdersSheet(ss) {
  let sheet = ss.getSheetByName('Cancelled_Orders');
  
  if (!sheet) {
    sheet = ss.insertSheet('Cancelled_Orders');
    Logger.log('Created Cancelled_Orders sheet');
  }
  
  // Same headers plus cancellation info
  const headers = [
    'so_number', 'rtwe_no', 'date', 'buyer', 'buyer_po_no', 
    'consignee', 'agent', 'quality', 'quantity', 'rate', 'final_amount',
    'remark', 'cancelled_reason', 'cancelled_by', 'cancelled_at'
  ];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#F44336')
    .setFontColor('white')
    .setFontWeight('bold');
  
  sheet.setFrozenRows(1);
  Logger.log('Cancelled_Orders sheet configured');
}

/**
 * Create Master_Agents sheet
 */
function createMasterAgentsSheet(ss) {
  let sheet = ss.getSheetByName('Master_Agents');
  
  if (!sheet) {
    sheet = ss.insertSheet('Master_Agents');
    Logger.log('Created Master_Agents sheet');
  }
  
  const headers = ['id', 'name', 'contact', 'address', 'status', 'created_at'];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#6B4423')
    .setFontColor('white')
    .setFontWeight('bold');
  
  sheet.setFrozenRows(1);
  Logger.log('Master_Agents sheet configured');
}

/**
 * Create Master_Transport sheet
 */
function createMasterTransportSheet(ss) {
  let sheet = ss.getSheetByName('Master_Transport');
  
  if (!sheet) {
    sheet = ss.insertSheet('Master_Transport');
    Logger.log('Created Master_Transport sheet');
  }
  
  const headers = ['id', 'name', 'contact', 'vehicle_type', 'status', 'created_at'];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#6B4423')
    .setFontColor('white')
    .setFontWeight('bold');
  
  sheet.setFrozenRows(1);
  Logger.log('Master_Transport sheet configured');
}

/**
 * Create Master_Others sheet (Buyers, Consignees, etc)
 */
function createMasterOthersSheet(ss) {
  let sheet = ss.getSheetByName('Master_Others');
  
  if (!sheet) {
    sheet = ss.insertSheet('Master_Others');
    Logger.log('Created Master_Others sheet');
  }
  
  const headers = ['id', 'type', 'name', 'contact', 'address', 'gst_no', 'status', 'created_at'];
  // type can be: buyer, consignee, broker
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#6B4423')
    .setFontColor('white')
    .setFontWeight('bold');
  
  sheet.setFrozenRows(1);
  Logger.log('Master_Others sheet configured');
}

/**
 * Create USER_ACTIVITY_LOG sheet (Same as RTWE Enquiry)
 */
function createUserActivityLogSheet(ss) {
  let sheet = ss.getSheetByName('USER_ACTIVITY_LOG');
  
  if (!sheet) {
    sheet = ss.insertSheet('USER_ACTIVITY_LOG');
    Logger.log('Created USER_ACTIVITY_LOG sheet');
  }
  
  const headers = ['Date', 'Time', 'Username', 'Name', 'Action', 'Details'];
  
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#6B4423')
    .setFontColor('white')
    .setFontWeight('bold');
  
  sheet.setFrozenRows(1);
  Logger.log('USER_ACTIVITY_LOG sheet configured');
}

/**
 * Create Settings sheet
 */
function createSettingsSheet(ss) {
  let sheet = ss.getSheetByName('Settings');
  
  if (!sheet) {
    sheet = ss.insertSheet('Settings');
    Logger.log('Created Settings sheet');
  }
  
  const headers = ['key', 'value', 'description'];
  const data = [
    headers,
    ['SO_PREFIX', 'RTW-SO-NO', 'Sale Order Number Prefix'],
    ['FINANCIAL_YEAR', '25-26', 'Current Financial Year'],
    ['SO_COUNTER', '1', 'Next Sale Order Counter'],
    ['CGST_RATE', '2.5', 'CGST Rate (%)'],
    ['SGST_RATE', '2.5', 'SGST Rate (%)'],
    ['IGST_RATE', '5', 'IGST Rate (%)'],
    ['DISCOUNT_RATE', '3', 'Discount Rate (%)'],
    ['SESSION_TIMEOUT', '30', 'Session Timeout (minutes)']
  ];
  
  sheet.getRange(1, 1, data.length, headers.length).setValues(data);
  sheet.getRange(1, 1, 1, headers.length)
    .setBackground('#6B4423')
    .setFontColor('white')
    .setFontWeight('bold');
  
  sheet.setFrozenRows(1);
  Logger.log('Settings sheet configured');
}

/**
 * Create default admin user
 */
function createDefaultAdmin(ss) {
  const sheet = ss.getSheetByName('Users');
  if (!sheet) return;
  
  // Check if admin already exists
  if (sheet.getLastRow() > 1) {
    Logger.log('Users already exist, skipping default admin creation');
    return;
  }
  
  const now = new Date();
  const adminData = [
    'U001',                    // user_id
    'admin@rtwe.com',          // email
    'Admin@123',               // password (plain for testing)
    'Administrator',           // full_name
    '9999999999',              // phone
    'Admin',                   // role
    'Active',                  // status
    now,                       // created_at
    now                        // last_login
  ];
  
  sheet.appendRow(adminData);
  Logger.log('Default admin user created');
}

/**
 * Populate Master Data with pre-filled values
 * Call this after setup to seed the dropdowns
 */
function populateMasterData() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const now = new Date();
  
  // Populate Master_Agents
  populateAgents(ss, now);
  
  // Populate Master_Transport
  populateTransport(ss, now);
  
  // Populate Master_Others (Buyers)
  populateBuyers(ss, now);
  
  Logger.log('Master data populated successfully');
}

function populateAgents(ss, now) {
  const sheet = ss.getSheetByName('Master_Agents');
  if (!sheet || sheet.getLastRow() > 1) {
    Logger.log('Agents already populated, skipping');
    return;
  }
  
  const agents = [
    ['A001', 'SURENDRA S DAMANI', '9876543210', 'Ichalkaranji', 'Active', now],
    ['A002', 'MADANGOPAL S DAMANI', '', '', 'Active', now],
    ['A003', 'LALIT MALI', '', '', 'Active', now],
    ['A004', 'SELF', '', '', 'Active', now],
    ['A005', 'SAMRENDRA GHANOTRA', '', '', 'Active', now],
    ['A006', 'SANDIP MUNDRA', '', '', 'Active', now],
    ['A007', 'DEVKISHAN SARDA', '', '', 'Active', now],
    ['A008', 'GIRISHKUMAR A SHARMA', '', '', 'Active', now],
    ['A009', 'N KEWAL TEXTILE AGENCY', '', '', 'Active', now]
  ];
  
  for (let i = 0; i < agents.length; i++) {
    sheet.appendRow(agents[i]);
  }
  Logger.log('Agents populated: ' + agents.length);
}

function populateTransport(ss, now) {
  const sheet = ss.getSheetByName('Master_Transport');
  if (!sheet || sheet.getLastRow() > 1) {
    Logger.log('Transport already populated, skipping');
    return;
  }
  
  const transport = [
    ['T001', 'TEMPO', '', 'TEMPO', 'Active', now],
    ['T002', 'SHRI DATTA CARYING CORPORATION', '', 'TRUCK', 'Active', now],
    ['T003', 'NIRMAL WAREHOUSE AND TRANSPORTATION LLP', '', 'TRUCK', 'Active', now],
    ['T004', 'SHRI MAHAGANPATI ROADLINES', '', 'TRUCK', 'Active', now],
    ['T005', 'SARGAM TRANSPORT', '', 'TRUCK', 'Active', now],
    ['T006', 'MOONGIPA ROADWAYS', '', 'TRUCK', 'Active', now],
    ['T007', 'ROYAL TRANSPORT', '', 'TRUCK', 'Active', now],
    ['T008', 'SHIV SHAKTI LOGISTICS', '', 'TRUCK', 'Active', now],
    ['T009', 'MAHALAXMI CARGO SERVICES', '', 'TRUCK', 'Active', now]
  ];
  
  for (let i = 0; i < transport.length; i++) {
    sheet.appendRow(transport[i]);
  }
  Logger.log('Transport populated: ' + transport.length);
}

function populateBuyers(ss, now) {
  const sheet = ss.getSheetByName('Master_Others');
  if (!sheet || sheet.getLastRow() > 1) {
    Logger.log('Buyers already populated, skipping');
    return;
  }
  
  // Top buyers from main source (subset for initial setup)
  const buyers = [
    ['B001', 'buyer', 'AARVI COTSYN', '', '', '', 'Active', now],
    ['B002', 'buyer', 'AAYUSH QUALITY WORLD LLP', '', '', '', 'Active', now],
    ['B003', 'buyer', 'ADITYA MARKETING', '', '', '', 'Active', now],
    ['B004', 'buyer', 'AGARWAL EXPORT', '', '', '', 'Active', now],
    ['B005', 'buyer', 'AMIT BAKLIWAL', '', '', '', 'Active', now],
    ['B006', 'buyer', 'AMIT INDUSTRIES', '', '', '', 'Active', now],
    ['B007', 'buyer', 'ANGOORA SILK MILLS', '', '', '', 'Active', now],
    ['B008', 'buyer', 'ANKUR TEXTILES', '', '', '', 'Active', now],
    ['B009', 'buyer', 'ARIHANT TEXTILES', '', '', '', 'Active', now],
    ['B010', 'buyer', 'BAJAJ SILK FAB PVT LTD', '', '', '', 'Active', now],
    ['B011', 'buyer', 'BALDEV TEXTILE MILLS', '', '', '', 'Active', now],
    ['B012', 'buyer', 'BHAWANA FABRICS', '', '', '', 'Active', now],
    ['B013', 'buyer', 'BHAWANI SHANKAR UDYOG (P) LTD', '', '', '', 'Active', now],
    ['B014', 'buyer', 'ENCOT FABRICS PVT LTD', '', '', '', 'Active', now],
    ['B015', 'buyer', 'G M WEAVING MILLS', '', '', '', 'Active', now],
    ['B016', 'buyer', 'GM GROUP', '', '', '', 'Active', now],
    ['B017', 'buyer', 'GRANTHI SILK MILLS', '', '', '', 'Active', now],
    ['B018', 'buyer', 'HARSHIT TEXFAB', '', '', '', 'Active', now],
    ['B019', 'buyer', 'HIMEER TEXTILES', '', '', '', 'Active', now],
    ['B020', 'buyer', 'ICHALKARANJI WEAVER SOLUTIONS LLP', '', '', '', 'Active', now],
    ['B021', 'buyer', 'JINDAL FABRICS PVT LTD', '', '', '', 'Active', now],
    ['B022', 'buyer', 'JK FABTEX INDUSTRIES PRIVATE LIMITED', '', '', '', 'Active', now],
    ['B023', 'buyer', 'K M TEXTILES PVT LTD', '', '', '', 'Active', now],
    ['B024', 'buyer', 'KAMADGIRI FASHIONS LTD', '', '', '', 'Active', now],
    ['B025', 'buyer', 'MAHESH TEXFAB', '', '', '', 'Active', now],
    ['B026', 'buyer', 'MAHESHWARI TRADING COMPANY', '', '', '', 'Active', now],
    ['B027', 'buyer', 'MAYANK SYN FAB', '', '', '', 'Active', now],
    ['B028', 'buyer', 'MONDAY FASHION PVT LTD', '', '', '', 'Active', now],
    ['B029', 'buyer', 'N C CORPORATION', '', '', '', 'Active', now],
    ['B030', 'buyer', 'NAMO TEX FAB', '', '', '', 'Active', now],
    ['B031', 'buyer', 'POOJA TEXSTYLES', '', '', '', 'Active', now],
    ['B032', 'buyer', 'R V TEXTILES', '', '', '', 'Active', now],
    ['B033', 'buyer', 'RADHE TEXTILES', '', '', '', 'Active', now],
    ['B034', 'buyer', 'RAJESH SILK MILLS', '', '', '', 'Active', now],
    ['B035', 'buyer', 'RATAN ENTERPRISES', '', '', '', 'Active', now],
    ['B036', 'buyer', 'SAGAR TEXTILES', '', '', '', 'Active', now],
    ['B037', 'buyer', 'SARGAM TEXTILES', '', '', '', 'Active', now],
    ['B038', 'buyer', 'SHREE GANESH TEXTILES', '', '', '', 'Active', now],
    ['B039', 'buyer', 'SHRI LAXMI INDUSTRIES', '', '', '', 'Active', now],
    ['B040', 'buyer', 'SUNITA TEXTILES', '', '', '', 'Active', now],
    ['B041', 'buyer', 'TEAM WORK TEXTILES', '', '', '', 'Active', now],
    ['B042', 'buyer', 'TEXMACO', '', '', '', 'Active', now],
    ['B043', 'buyer', 'VARDHAMAN FABRICS', '', '', '', 'Active', now],
    ['B044', 'buyer', 'VELV FINE POLYTEX', '', '', '', 'Active', now],
    ['B045', 'buyer', 'VISHAL TEXTILE INDUSTRIES', '', '', '', 'Active', now]
  ];
  
  for (let i = 0; i < buyers.length; i++) {
    sheet.appendRow(buyers[i]);
  }
  Logger.log('Buyers populated: ' + buyers.length);
}

/**
 * Create Master_Dropdown sheet for fixed options
 */
function createMasterDropdownSheet(ss) {
  let sheet = ss.getSheetByName('Master_Dropdown');
  
  if (!sheet) {
    sheet = ss.insertSheet('Master_Dropdown');
    Logger.log('Created Master_Dropdown sheet');
  } else {
    sheet.clear();
  }
  
  const data = [
    ['TYPE', 'VALUE', 'DISPLAY'],
    // Contract Types
    ['CONTRACT_TYPE', 'DOMESTIC', 'DOMESTIC'],
    ['CONTRACT_TYPE', 'EXPORT', 'EXPORT'],
    // Contract Routes
    ['CONTRACT_ROUTE', 'RUNNING STOCK', 'RUNNING STOCK'],
    ['CONTRACT_ROUTE', 'SURPLUS STOCK', 'SURPLUS STOCK'],
    ['CONTRACT_ROUTE', 'PURCHASE STOCK', 'PURCHASE STOCK'],
    ['CONTRACT_ROUTE', 'SELF RUNNING', 'SELF RUNNING'],
    // Mode of Shipment
    ['MODE_OF_SHIPMENT', 'ROAD', 'ROAD'],
    ['MODE_OF_SHIPMENT', 'RAIL', 'RAIL'],
    ['MODE_OF_SHIPMENT', 'AIR', 'AIR'],
    ['MODE_OF_SHIPMENT', 'SEA', 'SEA'],
    // Payment Terms
    ['PAYMENT_TERMS', '30DAYS 3+1', '30 DAYS 3+1'],
    ['PAYMENT_TERMS', '90DAYS 1%', '90 DAYS 1%'],
    ['PAYMENT_TERMS', '7DAYS 4+1', '7 DAYS 4+1'],
    ['PAYMENT_TERMS', '45DAYS 3+1', '45 DAYS 3+1'],
    ['PAYMENT_TERMS', '45', '45 DAYS'],
    ['PAYMENT_TERMS', '30', '30 DAYS'],
    ['PAYMENT_TERMS', '90', '90 DAYS'],
    ['PAYMENT_TERMS', '7', '7 DAYS'],
    ['PAYMENT_TERMS', '15 DAYS 2%', '15 DAYS 2%'],
    ['PAYMENT_TERMS', '30 DAYS 3% LESS', '30 DAYS 3% LESS'],
    ['PAYMENT_TERMS', '60 DAYS NETT', '60 DAYS NETT'],
    ['PAYMENT_TERMS', '7 DAYS 4%', '7 DAYS 4%'],
    // Delivery Terms
    ['DELIVERY_TERMS', '45DAYS', '45 DAYS'],
    ['DELIVERY_TERMS', '30DAYS', '30 DAYS'],
    ['DELIVERY_TERMS', '60DAYS', '60 DAYS'],
    ['DELIVERY_TERMS', '15DAYS', '15 DAYS'],
    ['DELIVERY_TERMS', 'IMMEDIATE', 'IMMEDIATE'],
    // SO Type
    ['SO_TYPE', 'BULK', 'BULK'],
    ['SO_TYPE', 'SAMPLE', 'SAMPLE'],
    // GST Type
    ['GST_TYPE', 'IGST', 'IGST'],
    ['GST_TYPE', 'CGST/SGST', 'CGST/SGST'],
    // Fabric Types
    ['FABRIC_TYPE', 'COTTON', 'COTTON'],
    ['FABRIC_TYPE', 'POLYESTER', 'POLYESTER'],
    ['FABRIC_TYPE', 'BLEND', 'BLEND'],
    ['FABRIC_TYPE', 'SILK', 'SILK'],
    ['FABRIC_TYPE', 'VISCOSE', 'VISCOSE'],
    ['FABRIC_TYPE', 'LINEN', 'LINEN'],
    // UOM
    ['UOM', 'MTR', 'METERS'],
    ['UOM', 'KG', 'KILOGRAMS'],
    ['UOM', 'PCS', 'PIECES'],
    // Inspection Types
    ['INSPECTION_TYPE', 'STANDARD', 'STANDARD'],
    ['INSPECTION_TYPE', 'BUYER', 'BUYER INSPECTION'],
    ['INSPECTION_TYPE', 'THIRD PARTY', 'THIRD PARTY'],
    // Banks
    ['BANK', 'MAHESH SAHAKARI BANK LTD', 'MAHESH SAHAKARI BANK LTD'],
    ['BANK', 'SBI', 'STATE BANK OF INDIA'],
    ['BANK', 'HDFC', 'HDFC BANK'],
    ['BANK', 'ICICI', 'ICICI BANK'],
    ['BANK', 'AXIS', 'AXIS BANK'],
    ['BANK', 'PNB', 'PUNJAB NATIONAL BANK']
  ];
  
  sheet.getRange(1, 1, data.length, 3).setValues(data);
  sheet.getRange(1, 1, 1, 3)
    .setBackground('#6B4423')
    .setFontColor('white')
    .setFontWeight('bold');
  
  sheet.setFrozenRows(1);
  Logger.log('Master_Dropdown sheet configured with ' + (data.length - 1) + ' options');
}

