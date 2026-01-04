# Sales Order Sheet Creation System

## Existing Setup System

Your Sale Order RTW system already has a **complete sheet creation system** in `Setup.gs`!

### **Key Functions:**

1. **`setupCompleteSystem()`** - Master setup function
2. **`createAllSheets()`** - Creates all sheets with headers
3. **`createSheet(spreadsheet, sheetName, headers)`** - Creates individual sheet

### **How It Works:**

```javascript
// Creates a sheet with:
// - Proper headers
// - Brown header background (#6B4423)
// - White text
// - Frozen header row
// - Auto-resized columns
// - Alternating row colors
```

---

## Current Sheets in System

Based on `createAllSheets()` function, you currently have:

1. **Users** - User management
2. **Sale_Orders** - Main sales orders
3. **Pending_Enquiries** - Pending enquiries
4. **Cancelled_Orders** - Cancelled orders
5. **Audit_Log** - System audit trail
6. **Master_Buyers** - Buyer master data
7. **Master_Agents** - Agent master data
8. **Master_Consignees** - Consignee master data
9. **Master_Transport** - Transport master data
10. **Master_Others** - Other master data
11. **System_Settings** - System configuration

---

## New Sheets Needed for Sales Order

### **1. SALES_ORDER_PENDING**
**Purpose:** Imported enquiries waiting to become sales orders

**Headers:**
```javascript
[
  'RTWE No',           // Primary key
  'Buyer',             // Customer name
  'Broker',            // Broker name
  'Quality',           // Fabric quality
  'Given Rate',        // Rate from enquiry
  'Enquiry Date',      // Original enquiry date
  'Import Date',       // When imported to SO system
  'Imported By',       // User email who imported
  'Status'             // Pending/In Progress/Completed
]
```

---

### **2. SALES_ORDER_CONFIRMED**
**Purpose:** Confirmed sales orders with full details

**Headers:**
```javascript
[
  'SO Number',         // RTW-SO-NO/25-26/001
  'RTWE No',           // Link to enquiry
  'PO Number',         // Customer PO
  'Buyer',             // Customer name
  'Quality Order',     // Quality specification
  'Design 1',          // Design name 1
  'TAGA 1',            // Quantity 1
  'Design 2',          // Design name 2
  'TAGA 2',            // Quantity 2
  'Design 3',          // Design name 3
  'TAGA 3',            // Quantity 3
  'Design 4',          // Design name 4
  'TAGA 4',            // Quantity 4
  'Design 5',          // Design name 5
  'TAGA 5',            // Quantity 5
  'Design 6',          // Design name 6
  'TAGA 6',            // Quantity 6
  'Total Order TAGA',  // Total quantity
  'Final Rate',        // Confirmed rate
  'Payment Terms',     // Payment terms
  'Delivery Date',     // Delivery date
  'Created By',        // User who created
  'Created Date',      // Creation timestamp
  'Status'             // Confirmed/Exported/Completed
]
```

---

## How to Add New Sheets

### **Option 1: Update `createAllSheets()` Function**

Add these to the existing `createAllSheets()` function in `Setup.gs`:

```javascript
function createAllSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // ... existing sheets ...
  
  // NEW: Sales Order Pending
  createSheet(ss, 'SALES_ORDER_PENDING', [
    'RTWE No',
    'Buyer',
    'Broker',
    'Quality',
    'Given Rate',
    'Enquiry Date',
    'Import Date',
    'Imported By',
    'Status'
  ]);
  
  // NEW: Sales Order Confirmed
  createSheet(ss, 'SALES_ORDER_CONFIRMED', [
    'SO Number',
    'RTWE No',
    'PO Number',
    'Buyer',
    'Quality Order',
    'Design 1',
    'TAGA 1',
    'Design 2',
    'TAGA 2',
    'Design 3',
    'TAGA 3',
    'Design 4',
    'TAGA 4',
    'Design 5',
    'TAGA 5',
    'Design 6',
    'TAGA 6',
    'Total Order TAGA',
    'Final Rate',
    'Payment Terms',
    'Delivery Date',
    'Created By',
    'Created Date',
    'Status'
  ]);
  
  Logger.log('✅ All sheets created successfully!');
}
```

---

### **Option 2: Create Individual Setup Function**

Create a separate function for Sales Order sheets:

```javascript
/**
 * Setup Sales Order specific sheets
 * Run this to add Sales Order sheets to existing system
 */
function setupSalesOrderSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  Logger.log('Creating Sales Order sheets...');
  
  // Sales Order Pending
  createSheet(ss, 'SALES_ORDER_PENDING', [
    'RTWE No',
    'Buyer',
    'Broker',
    'Quality',
    'Given Rate',
    'Enquiry Date',
    'Import Date',
    'Imported By',
    'Status'
  ]);
  
  // Sales Order Confirmed
  createSheet(ss, 'SALES_ORDER_CONFIRMED', [
    'SO Number',
    'RTWE No',
    'PO Number',
    'Buyer',
    'Quality Order',
    'Design 1',
    'TAGA 1',
    'Design 2',
    'TAGA 2',
    'Design 3',
    'TAGA 3',
    'Design 4',
    'TAGA 4',
    'Design 5',
    'TAGA 5',
    'Design 6',
    'TAGA 6',
    'Total Order TAGA',
    'Final Rate',
    'Payment Terms',
    'Delivery Date',
    'Created By',
    'Created Date',
    'Status'
  ]);
  
  Logger.log('✅ Sales Order sheets created successfully!');
  
  // Show success message
  SpreadsheetApp.getUi().alert(
    'Success!',
    'Sales Order sheets created:\n\n' +
    '• SALES_ORDER_PENDING\n' +
    '• SALES_ORDER_CONFIRMED',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}
```

---

## How to Run

### **Method 1: Run from Script Editor**
1. Open Script Editor (Extensions → Apps Script)
2. Find `Setup.gs`
3. Select `setupSalesOrderSheets` from dropdown
4. Click Run ▶️

### **Method 2: Add to Menu**
Add this to your `Code.gs` menu:

```javascript
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🛠️ Setup')
    .addItem('Create Sales Order Sheets', 'setupSalesOrderSheets')
    .addToUi();
}
```

---

## Sheet Features (Automatic)

When you run `createSheet()`, it automatically:

✅ **Header Formatting:**
- Brown background (#6B4423)
- White text
- Bold font
- Center aligned

✅ **Sheet Setup:**
- Frozen header row
- Auto-resized columns
- Minimum column width (100px)
- Alternating row colors (every even row is light gray)

✅ **Data Protection:**
- Deletes existing sheet if it exists
- Creates fresh sheet with clean data

---

## Summary

**You already have a complete sheet creation system!** 🎉

**To add Sales Order sheets:**
1. Copy the `setupSalesOrderSheets()` function to `Setup.gs`
2. Run it once from Script Editor
3. Done! Sheets created with proper headers and formatting

**Next Steps:**
1. Create sheets (5 minutes)
2. Build import function (2 hours)
3. Update SO number format (5 minutes)
4. Test workflow (1 hour)

Ready to add the function to Setup.gs? 🚀
