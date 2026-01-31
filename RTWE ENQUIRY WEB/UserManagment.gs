// ============================================
// USERMANAGEMENT
// Auto-organized from original code
// ============================================

function setupUserManagementSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let userSheet = ss.getSheetByName('USER_MANAGEMENT');
  
  if (!userSheet) {
    userSheet = ss.insertSheet('USER_MANAGEMENT');
    userSheet.setTabColor('#212121');
  }
  
  userSheet.clear();
  userSheet.getRange('A1:G1').setValues([[
    'Full Name', 'Username', 'Password Hash', 'Role', 
    'Email', 'Phone', 'Status'
  ]]).setFontWeight('bold')
    .setBackground('#212121')
    .setFontColor('white');
  
  userSheet.setFrozenRows(1);
  userSheet.setColumnWidths(1, 7, 150);
  
  const protection = userSheet.protect();
  protection.setDescription('User Management Protection');
  protection.setWarningOnly(true);
  
  Logger.log('✅ User Management sheet created');
  return userSheet;
}

function migrateUsersToSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let userSheet = ss.getSheetByName('USER_MANAGEMENT');
  
  if (!userSheet) {
    userSheet = setupUserManagementSheet();
  }
  
  if (userSheet.getLastRow() > 1) {
    const ui = SpreadsheetApp.getUi();
    const response = ui.alert(
      'Users Already Exist',
      'User data already exists. Overwrite?',
      ui.ButtonSet.YES_NO
    );
    
    if (response !== ui.Button.YES) {
      return;
    }
    
    if (userSheet.getLastRow() > 1) {
      userSheet.getRange(2, 1, userSheet.getLastRow() - 1, 7).clear();
    }
  }
  
  Object.keys(USERS_CONFIG.users).forEach((username) => {
    const user = USERS_CONFIG.users[username];
    const hashedPassword = hashPassword(user.password);
    
    userSheet.appendRow([
      user.name,
      username,
      hashedPassword,
      user.role,
      user.email || '',
      user.phone || '',
      'Active'
    ]);
  });
  
  SpreadsheetApp.getUi().alert(
    '✅ Migration Complete!',
    Object.keys(USERS_CONFIG.users).length + ' users migrated with hashed passwords.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
  
  Logger.log('✅ Users migrated to sheet');
}

// ============================================
// ENHANCED LOGIN WITH HASHING
// ============================================

function showCreateUserDialog() {
  const session = getCurrentUser();
  if (!session || !['OWNER', 'MANAGER'].includes(session.role)) {
    SpreadsheetApp.getUi().alert(
      '⛔ Access Denied',
      'Only Owner/Manager can create users.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }
  
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let userSheet = ss.getSheetByName('USER_MANAGEMENT');
  
  if (!userSheet) {
    setupUserManagementSheet();
    migrateUsersToSheet();
    userSheet = ss.getSheetByName('USER_MANAGEMENT');
  }
  
  const nameRes = ui.prompt(
    'Create New User - Step 1/6',
    'Enter Full Name:',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (nameRes.getSelectedButton() !== ui.Button.OK) return;
  const fullName = nameRes.getResponseText().trim();
  
  if (!fullName) {
    ui.alert('Name cannot be empty!');
    return;
  }
  
  const unameRes = ui.prompt(
    'Create New User - Step 2/6',
    'Enter Username (no spaces):',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (unameRes.getSelectedButton() !== ui.Button.OK) return;
  const username = unameRes.getResponseText().trim().toLowerCase();
  
  if (!username || username.indexOf(' ') >= 0) {
    ui.alert('Username must not contain spaces!');
    return;
  }
  
  const data = userSheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === username) {
      ui.alert('❌ Username already exists!');
      return;
    }
  }
  
  const passRes = ui.prompt(
    'Create New User - Step 3/6',
    'Enter Password (min 6 characters):',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (passRes.getSelectedButton() !== ui.Button.OK) return;
  const password = passRes.getResponseText().trim();
  
  if (password.length < USERS_CONFIG.security.passwordMinLength) {
    ui.alert('Password must be at least ' + USERS_CONFIG.security.passwordMinLength + ' characters!');
    return;
  }
  
  const passwordHash = hashPassword(password);
  
  const roleRes = ui.prompt(
    'Create New User - Step 4/6',
    'Select Role:\n\n' +
    '1. OWNER\n' +
    '2. MANAGER\n' +
    '3. ASSISTANT_MANAGER\n' +
    '4. TEAM_MEMBER\n\n' +
    'Enter number (1-4):',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (roleRes.getSelectedButton() !== ui.Button.OK) return;
  
  const roles = ['OWNER', 'MANAGER', 'ASSISTANT_MANAGER', 'TEAM_MEMBER'];
  const roleIndex = parseInt(roleRes.getResponseText()) - 1;
  
  if (roleIndex < 0 || roleIndex >= roles.length) {
    ui.alert('Invalid role!');
    return;
  }
  
  const role = roles[roleIndex];
  
  const emailRes = ui.prompt(
    'Create New User - Step 5/6',
    'Enter Email (optional):',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (emailRes.getSelectedButton() !== ui.Button.OK) return;
  const email = emailRes.getResponseText().trim();
  
  const phoneRes = ui.prompt(
    'Create New User - Step 6/6',
    'Enter Phone (optional):',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (phoneRes.getSelectedButton() !== ui.Button.OK) return;
  const phone = phoneRes.getResponseText().trim();
  
  userSheet.appendRow([
    fullName,
    username,
    passwordHash,
    role,
    email,
    phone,
    'Active'
  ]);
  
  logUserActivity(session.username, 'USER_CREATED', 'New user: ' + username);
  
  ui.alert(
    '✅ User Created!',
    'Username: ' + username + '\n' +
    'Password: ' + password + '\n\n' +
    'Share credentials with user.',
    ui.ButtonSet.OK
  );
}

function showChangePasswordDialog() {
  const session = getCurrentUser();
  if (!session || !['OWNER', 'MANAGER'].includes(session.role)) {
    SpreadsheetApp.getUi().alert('⛔ Access Denied');
    return;
  }
  
  const ui = SpreadsheetApp.getUi();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const userSheet = ss.getSheetByName('USER_MANAGEMENT');
  
  if (!userSheet) {
    ui.alert('User Management not setup!');
    return;
  }
  
  const unameRes = ui.prompt(
    'Change Password - Step 1/2',
    'Enter username:',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (unameRes.getSelectedButton() !== ui.Button.OK) return;
  const username = unameRes.getResponseText().trim();
  
  const data = userSheet.getDataRange().getValues();
  let found = false;
  let rowIndex = -1;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === username) {
      found = true;
      rowIndex = i + 1;
      break;
    }
  }
  
  if (!found) {
    ui.alert('User not found!');
    return;
  }
  
  const passRes = ui.prompt(
    'Change Password - Step 2/2',
    'Enter new password (min 6 chars):',
    ui.ButtonSet.OK_CANCEL
  );
  
  if (passRes.getSelectedButton() !== ui.Button.OK) return;
  const newPassword = passRes.getResponseText().trim();
  
  if (newPassword.length < USERS_CONFIG.security.passwordMinLength) {
    ui.alert('Password too short!');
    return;
  }
  
  const newHash = hashPassword(newPassword);
  userSheet.getRange(rowIndex, 3).setValue(newHash);
  
  logUserActivity(session.username, 'PASSWORD_CHANGED', 'For user: ' + username);
  
  ui.alert('✅ Password Changed!\n\nNew password: ' + newPassword);
}

function viewAllUsers() {
  const session = getCurrentUser();
  if (!session || !['OWNER', 'MANAGER'].includes(session.role)) {
    SpreadsheetApp.getUi().alert('⛔ Access Denied');
    return;
  }
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const userSheet = ss.getSheetByName('USER_MANAGEMENT');
  
  if (!userSheet) {
    SpreadsheetApp.getUi().alert('No users found!');
    return;
  }
  
  SpreadsheetApp.setActiveSheet(userSheet);
  SpreadsheetApp.getUi().alert('User Management sheet opened');
}

// ============================================
// SESSION MANAGEMENT (Existing - Enhanced)
// ============================================