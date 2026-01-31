// ============================================
// MENU.GS - ENHANCED WITH HTML FORM SUPPORT
// ============================================

/**
 * Show HTML Enquiry Form (Modern UI)
 */
function showEnquiryForm() {
  if (!refreshSession()) {
    SpreadsheetApp.getUi().alert('🔒 Session expired! Please login.');
    showLoginDialog();
    return;
  }
  
  const html = HtmlService.createHtmlOutputFromFile('Enquiry-Form')
    .setWidth(1000)
    .setHeight(700)
    .setTitle('RTWE Enquiry Form');
  
  SpreadsheetApp.getUi().showModalDialog(html, 'RTWE Enquiry Form');
}

/**
 * Menu function: New Entry (Sheet-based)
 */
function menuNewEntry() {
  if (!refreshSession()) {
    SpreadsheetApp.getUi().alert('🔒 Session expired! Please login.');
    showLoginDialog();
    return;
  }
  
  const formSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.FORM);
  formSheet.getRange(CONFIG.CELLS.ENTRY_TYPE).setValue('NEW ENTRY');
  SpreadsheetApp.setActiveSheet(formSheet);
}

/**
 * Menu function: Edit Enquiry (Sheet-based)
 */
function menuEditEnquiry() {
  if (!refreshSession()) {
    SpreadsheetApp.getUi().alert('🔒 Session expired! Please login.');
    showLoginDialog();
    return;
  }
  
  const formSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.FORM);
  formSheet.getRange(CONFIG.CELLS.ENTRY_TYPE).setValue('EDIT ENQUIRY');
  SpreadsheetApp.setActiveSheet(formSheet);
}

/**
 * Menu function: Pending Approved (Sheet-based)
 */
function menuPendingApproved() {
  if (!refreshSession()) {
    SpreadsheetApp.getUi().alert('🔒 Session expired! Please login.');
    showLoginDialog();
    return;
  }
  
  const formSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEETS.FORM);
  formSheet.getRange(CONFIG.CELLS.ENTRY_TYPE).setValue('PENDING APPROVED');
  SpreadsheetApp.setActiveSheet(formSheet);
}

/**
 * Disable form (protection)
 */
function disableForm() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const formSheet = ss.getSheetByName(CONFIG.SHEETS.FORM);
  if (!formSheet) return;
  
  const range = formSheet.getRange('B3:C50');
  let protection = range.getProtection();
  
  if (!protection) {
    protection = range.protect();
  }
  
  protection.setDescription('Form locked - Login required');
  protection.setWarningOnly(false);
  
  const me = Session.getEffectiveUser();
  protection.removeEditors(protection.getEditors());
  if (protection.canDomainEdit()) {
    protection.setDomainEdit(false);
  }
}

/**
 * Enable form (remove protection)
 */
function enableForm() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const formSheet = ss.getSheetByName(CONFIG.SHEETS.FORM);
  if (!formSheet) return;
  
  const range = formSheet.getRange('B3:C50');
  const protection = range.getProtection();
  
  if (protection && protection.canEdit()) {
    protection.remove();
  }
}

/**
 * Reset form to initial state
 */
function resetFormToInitial() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const formSheet = ss.getSheetByName(CONFIG.SHEETS.FORM);
  if (!formSheet) return;

  // Clear form data
  clearFormUpdated();

  // Clear entry type selectors
  formSheet.getRange(CONFIG.CELLS.ENTRY_TYPE).clearContent();
  formSheet.getRange(CONFIG.CELLS.SELECT_PENDING_APPROVED).clearContent();
  formSheet.getRange(CONFIG.CELLS.SELECT_EDIT).clearContent();
  formSheet.getRange(CONFIG.CELLS.SEARCH_RTWE).clearContent();

  // Hide all sections - show only Entry Type selector
  formSheet.hideRows(5, 2);    // Hide rows 5-6 (search fields)
  formSheet.hideRows(7, 9);    // Hide rows 7-15 (basic form)
  formSheet.hideRows(17, 30);  // Hide rows 17-46 (order details)

  SpreadsheetApp.flush();
  
  SpreadsheetApp.getActiveSpreadsheet().toast(
    'Form reset. Select Entry Type to start.',
    '🔁 Ready',
    3
  );
}

/**
 * Handle logout
 */
function handleLogout() {
  const result = logoutUser();
  
  // Hide menu - show only login
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('🔐 RTWE System v3.0')
    .addItem('🔑 Login', 'showLoginDialog')
    .addToUi();
  
  showLoginStatus();
  disableForm();
  
  SpreadsheetApp.getUi().alert(
    '👋 Logged Out!',
    result.message + '\n\nMenu access removed.\nForm is locked.\n\nLogin again to continue.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
  
  SpreadsheetApp.flush();
  Utilities.sleep(1000);
  showLoginDialog();
}