function fixEverything() {
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Unprotect form
  const formSheet = ss.getSheetByName(CONFIG.SHEETS.FORM);
  if (formSheet) {
    const protections = formSheet.getProtections(SpreadsheetApp.ProtectionType.SHEET);
    protections.forEach(p => p.remove());
  }
  
  // 2. Update menu
  ui.createMenu('🔐 RTWE System v3.0')
    .addItem('📋 Enquiry Form (HTML)', 'showEnquiryForm')
    .addItem('📊 Dashboard (HTML)', 'showDashboard')
    .addItem('🔍 Search (HTML)', 'showSearchDashboard')
    .addItem('⚙️ Settings (HTML)', 'showSettingsDialog')
    .addSeparator()
    .addSubMenu(ui.createMenu('👤 User Management')
      .addItem('➕ Create User', 'showCreateUserDialog')
      .addItem('🔑 Change Password', 'showChangePasswordDialog')
      .addItem('👥 View All Users', 'viewAllUsers')
      .addItem('📊 View Activity Log', 'viewActivityLog'))
    .addSeparator()
    .addSubMenu(ui.createMenu('🔧 System Setup')
      .addItem('⚙️ Complete Setup', 'completeSystemSetup')
      .addItem('🔍 Check Status', 'checkSystemStatus')
      .addItem('🔄 Quick Repair', 'quickSystemRepair')
      .addItem('⚠️ Reset System', 'resetSystem'))
    .addSeparator()
    .addItem('🚪 Logout', 'handleLogout')
    .addToUi();
  
  ui.alert('✅ Fixed!', 'Menu updated and form unlocked.\n\nPress Ctrl+Shift+R to hard refresh.', ui.ButtonSet.OK);
}