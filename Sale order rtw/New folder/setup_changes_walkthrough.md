# Sales Order Sheets Added to Setup.gs

## Changes Made

### ✅ **File Modified:** `Setup.gs`

Added two new sheet definitions to the `createAllSheets()` function to support the new sales order workflow.

---

## New Sheets Added

### **1. SALES_ORDER_PENDING**
**Purpose:** Store imported enquiries from Enquiry system that are waiting to be converted to sales orders

**Headers:**
```javascript
'SALES_ORDER_PENDING': [
  'rtwe_no',        // Primary key - links to enquiry
  'buyer',          // Customer name
  'broker',         // Broker name
  'quality',        // Fabric quality
  'given_rate',     // Rate from enquiry
  'enquiry_date',   // Original enquiry date
  'import_date',    // When imported to SO system
  'imported_by',    // User email who imported
  'status'          // Pending/In Progress/Completed
]
```

---

### **2. SALES_ORDER_CONFIRMED**
**Purpose:** Store confirmed sales orders with full details

**Headers:**
```javascript
'SALES_ORDER_CONFIRMED': [
  'so_number',         // RTW-SO-NO/25-26/001
  'rtwe_no',           // Link back to enquiry
  'po_number',         // Customer PO number
  'buyer',             // Customer name
  'quality_order',     // Quality specification
  'design_1',          // Design name 1
  'taga_1',            // Quantity 1
  'design_2',          // Design name 2
  'taga_2',            // Quantity 2
  'design_3',          // Design name 3
  'taga_3',            // Quantity 3
  'design_4',          // Design name 4
  'taga_4',            // Quantity 4
  'design_5',          // Design name 5
  'taga_5',            // Quantity 5
  'design_6',          // Design name 6
  'taga_6',            // Quantity 6
  'total_order_taga',  // Total quantity
  'final_rate',        // Confirmed rate
  'payment_terms',     // Payment terms
  'delivery_date',     // Delivery date
  'created_by',        // User who created
  'created_at',        // Creation timestamp
  'status'             // Confirmed/Exported/Completed
]
```

---

## Code Changes

### **Location:** Lines 121-138 in `Setup.gs`

```diff
    'Pending_Enquiries': [
      'rtwe_no', 'broker_name', 'quality', 'date', 'given_rate', 
      'status', 'import_date', 'notes', 'created_at', 'updated_at'
    ],
    
+   // NEW: Sales Order Pending - Imported from Enquiry System
+   'SALES_ORDER_PENDING': [
+     'rtwe_no', 'buyer', 'broker', 'quality', 'given_rate',
+     'enquiry_date', 'import_date', 'imported_by', 'status'
+   ],
+   
+   // NEW: Sales Order Confirmed - Confirmed Sales Orders
+   'SALES_ORDER_CONFIRMED': [
+     'so_number', 'rtwe_no', 'po_number', 'buyer', 'quality_order',
+     'design_1', 'taga_1', 'design_2', 'taga_2', 'design_3', 'taga_3',
+     'design_4', 'taga_4', 'design_5', 'taga_5', 'design_6', 'taga_6',
+     'total_order_taga', 'final_rate', 'payment_terms', 'delivery_date',
+     'created_by', 'created_at', 'status'
+   ],
+   
    'Sale_Orders': [
```

---

### **Location:** Lines 724-730 in `Setup.gs`

Updated `verifySetup()` function to include new sheets:

```diff
  const requiredSheets = [
-   'Users', 'Pending_Enquiries', 'Sale_Orders', 'Complete_Sale_Orders',
+   'Users', 'Pending_Enquiries', 'SALES_ORDER_PENDING', 'SALES_ORDER_CONFIRMED',
+   'Sale_Orders', 'Complete_Sale_Orders',
    'Cancelled_Orders', 'Master_Buyers', 'Master_Consignees', 'Master_Agents',
    'Master_Transport', 'Master_Others', 'Audit_Log', 'Settings',
    'Order_Confirm_Data', 'Email_Queue', 'Telegram_Queue', 'PDF_Cache',
    'Session_Tokens'
  ];
```

---

## How to Create the Sheets

### **Method 1: Run Complete Setup**
If setting up a new system:
```
1. Open Script Editor (Extensions → Apps Script)
2. Select "setupCompleteSystem" from dropdown
3. Click Run ▶️
4. Approve permissions
5. Wait for completion
```

### **Method 2: Run Partial Setup** (Recommended for existing system)
To add just the new sheets without affecting existing data:

```javascript
// Add this function to Setup.gs
function setupSalesOrderSheetsOnly() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Sales Order Pending
  createSheet(ss, 'SALES_ORDER_PENDING', [
    'rtwe_no', 'buyer', 'broker', 'quality', 'given_rate',
    'enquiry_date', 'import_date', 'imported_by', 'status'
  ]);
  
  // Sales Order Confirmed
  createSheet(ss, 'SALES_ORDER_CONFIRMED', [
    'so_number', 'rtwe_no', 'po_number', 'buyer', 'quality_order',
    'design_1', 'taga_1', 'design_2', 'taga_2', 'design_3', 'taga_3',
    'design_4', 'taga_4', 'design_5', 'taga_5', 'design_6', 'taga_6',
    'total_order_taga', 'final_rate', 'payment_terms', 'delivery_date',
    'created_by', 'created_at', 'status'
  ]);
  
  SpreadsheetApp.getUi().alert(
    'Success!',
    'Sales Order sheets created successfully!',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}
```

Then run `setupSalesOrderSheetsOnly()` from Script Editor.

---

## What Happens When Sheets Are Created

The `createSheet()` function automatically:

✅ **Deletes existing sheet** (if it exists) - Creates fresh sheet
✅ **Sets headers** - First row with column names
✅ **Formats headers:**
- Brown background (#6B4423)
- White text
- Bold font
- Center aligned

✅ **Freezes header row** - Always visible when scrolling
✅ **Auto-resizes columns** - Minimum 100px width
✅ **Adds alternating row colors** - Every even row is light gray (#F5F5F5)

---

## Next Steps

Now that the sheet structure is ready, you can:

1. ✅ **Create the sheets** - Run setup function
2. 🔧 **Build import function** - Import from Enquiry system
3. 🔧 **Update SO number format** - Change to RTW-SO-NO/25-26/001
4. 🔧 **Build sales order form** - Create/update orders
5. 🔧 **Build pending page** - Display imported enquiries

---

## Summary

**Changes:**
- ✅ Added 2 new sheet definitions to `createAllSheets()`
- ✅ Updated `verifySetup()` to include new sheets
- ✅ Ready to create sheets with proper headers and formatting

**Files Modified:**
- `Setup.gs` (2 locations updated)

**Ready to run!** 🚀
