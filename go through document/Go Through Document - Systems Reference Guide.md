# RTWE Systems - Complete Reference Guide

> **Last Updated**: January 2, 2026  
> **Systems**: Sort Master, Sale Order, RTWE Enquiry

---

## 📊 System Overview

| System | Purpose | Main Spreadsheet |
|--------|---------|------------------|
| **RTWE Enquiry** | Manage customer enquiries from pending → approved → confirmed → closed | RTWE Enquiry Spreadsheet |
| **Sort Master** | Calculate fabric specifications (warp, weft, yarn weights) | Sort Master Spreadsheet |
| **Sale Order** | Create and manage sale orders from RTWE enquiries | RTW Sale Order Portal 0.3 |

---

## 🏗️ System Architecture

### Common File Structure
```
├── Code.gs              # Main routing, doGet(), page serving, include()
├── Dashboard.html       # Main dashboard with stats
├── Login.html           # User authentication
├── Navigation.html      # Shared navigation component
├── Styles.html          # Common CSS styles
├── Scripts.html         # Common JavaScript
├── [Feature]Handler.gs  # Backend functions for each feature
├── [Feature].html       # Frontend pages
└── Setup.gs             # Sheet creation and initialization
```

### Data Flow
```
1. User → doGet() → Route → servePage() → HTML Template
2. HTML → google.script.run → Backend Function → Spreadsheet
3. Backend → Return Data → HTML Success/Failure Handler → UI Update
```

---

## 🚨 Common Problems & Solutions

### 1. **Blank Page After Login / 404 Errors**

| Problem | Cause | Solution |
|---------|-------|----------|
| Page shows blank | Missing route in `doGet()` | Add route: `case 'page-name': return servePage()` |
| 404 error | File not deployed | Copy ALL .gs and .html files to Apps Script |
| Raw template showing | Template not evaluated | Use `HtmlService.createTemplateFromFile().evaluate()` |

### 2. **Dashboard Statistics Showing 0 or Wrong Data**

| Problem | Cause | Solution |
|---------|-------|----------|
| All stats = 0 | Wrong sheet name | Use exact sheet name: `ss.getSheetByName('Exact Name')` |
| Stats don't match page | Different data sources | Use SAME sheet and filtering as the list page |
| Pending count wrong | Not filtering processed orders | Filter out `SO_CREATED` or `CANCELLED` status |

**Key Learning**: Dashboard stats must read from the **same sheet** with **same filters** as the list page.

### 3. **Dropdown Loading Issues**

| Problem | Cause | Solution |
|---------|-------|----------|
| Empty dropdowns | Wrong sheet found | Use `getSheetByName('Exact Name')` not fuzzy match |
| Data returns empty | Multiple sheets with similar names | Specify exact sheet: `Master` not `Master_Agents` |
| JS error | Element ID mismatch | Verify HTML ID matches JS: `getElementById('buyerSelect')` |

**Key Learning**: Fuzzy sheet matching (`includes('master')`) can find wrong sheets. Always use exact names.

### 4. **Template Include Errors**

| Problem | Cause | Solution |
|---------|-------|----------|
| `<?= include(...) ?>` showing | Missing quotes | Use `<?!= include('FileName'); ?>` |
| Include file not found | File not deployed | Ensure file exists in Apps Script |
| Navigation broken | File deleted/missing | Create minimal working Navigation.html |

### 5. **Session/Authentication Issues**

| Problem | Cause | Solution |
|---------|-------|----------|
| Redirect loop | Session not validated | Check `validateSession()` returns correct data |
| User data missing | Wrong property name | Use `session.name` not `session.userName` |
| Login required again | Session expired | Store session in localStorage as backup |

---

## 📋 System-Specific Details

### RTWE Enquiry System

**Sheets Used:**
- `PENDING_DATA` - New enquiries
- `PENDING_APPROVED` - Approved enquiries
- `ORDER_CONFIRM_DATA` - Confirmed orders
- `ENQUIRY_CLOSED_DATA` - Cancelled enquiries
- `User` - User authentication

**Key Functions:**
- `getPendingEnquiries()` - Fetch pending list
- `getApprovedEnquiries()` - Fetch approved list
- `saveEnquiry()` - Save new enquiry
- `approveEnquiry()` - Move to approved

---

### Sort Master System

**Sheets Used:**
- `SORT_MASTER` - Main sort master data
- `Complete_Orders` - Completed calculations

**Key Functions:**
- `calculateWarpWeight()` - Calculate warp specifications
- `calculateWeftWeight()` - Calculate weft specifications
- `saveSortMaster()` - Save complete calculation
- `getStatistics()` - Dashboard stats

**Key Learning**: Column mapping must match sheet headers exactly. Log first row to verify.

---

### Sale Order System

**Sheets Used:**
- `Pending orders RTWE` - Pending enquiries (from RTWE)
- `Sale_Orders` - Created sale orders
- `Completed_Orders` - Complete orders
- `Cancelled_Orders` - Cancelled orders
- `Master` - Dropdown master data

**Key Functions:**
- `getMasterData()` - Load dropdown options
- `getPendingRTWEOrders()` - Fetch pending for SO creation
- `saveSaleOrder()` - Save new sale order
- `getDashboardStats()` - Dashboard statistics

**Spreadsheet ID**: `14HCylVTboHGsmHoJ-jVm6dQ96e5X7VJv9PYIqfQ439E`

---

## ✅ Best Practices Checklist

### Before Development
- [ ] List all sheets and their exact names
- [ ] Document column headers and order
- [ ] Identify which sheets each function reads/writes
- [ ] Map page routes in `doGet()`

### During Development
- [ ] Use `Logger.log()` extensively in backend functions
- [ ] Use `console.log()` in frontend JavaScript
- [ ] Test backend functions in Apps Script editor first
- [ ] Use exact sheet names, not fuzzy matching

### Deployment Checklist
- [ ] Copy ALL `.gs` files to Apps Script
- [ ] Copy ALL `.html` files to Apps Script
- [ ] Check for missing `include()` files
- [ ] Test with NEW deployment (not head)
- [ ] Clear browser cache after deploy

### Debugging Steps
1. Check Apps Script **Execution log** for errors
2. Check browser **Console** for JS errors
3. Verify sheet names match exactly
4. Verify function names match between HTML and .gs
5. Check route exists in `doGet()`

---

## 🔧 Code Patterns to Follow

### Correct Sheet Access
```javascript
// ✅ GOOD - Exact name
const sheet = ss.getSheetByName('Master');

// ❌ BAD - Fuzzy match can find wrong sheet
if (name.includes('master')) { ... }
```

### Correct Include Statement
```javascript
// ✅ GOOD
<?!= include('Navigation'); ?>

// ❌ BAD - Missing quotes or wrong syntax
<?= include(Navigation); ?>
```

### Correct Data Return Format
```javascript
// ✅ GOOD - Consistent format
return {
  success: true,
  data: { items: [], count: 0 },
  message: 'Loaded successfully'
};

// Handle in frontend
.withSuccessHandler(function(result) {
  if (result && result.success && result.data) {
    // Use result.data
  }
})
```

### Correct Page Serving
```javascript
function servePage(sessionId, userName) {
  const template = HtmlService.createTemplateFromFile('PageName');
  template.sessionId = sessionId;
  template.userName = userName;
  template.webAppUrl = ScriptApp.getService().getUrl();
  return template.evaluate()
    .setTitle('Page Title')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
```

---

## 📝 Quick Reference

### Apps Script URLs
- **RTWE Enquiry**: (Add URL here)
- **Sort Master**: (Add URL here)  
- **Sale Order**: (Add URL here)

### Common Session Variables
```javascript
const webAppUrl = '<?= webAppUrl ?>';
const sessionId = '<?= sessionId ?>';
const userName = '<?= userName ?>';
```

### Debug Function Template
```javascript
function testFunction() {
  const result = yourFunction('test-param');
  Logger.log(JSON.stringify(result, null, 2));
}
```

---

## ⚠️ Time-Saving Tips

1. **Test backend FIRST** - Run functions in Apps Script editor before testing UI
2. **Check sheet names** - Copy exact name from sheet tab, don't type manually
3. **Deploy after EVERY change** - Apps Script doesn't auto-deploy
4. **Use NEW deployment** - Head deployment can cache old code
5. **Log everything** - Add logs at start/end of every function
6. **Verify IDs match** - HTML `id="xyz"` must match JS `getElementById('xyz')`

---

*This document should be updated as new issues are discovered and solved.*
