// TEST FUNCTION - Add this to OrderConfirmData.gs in GAS and run it

function testOrderConfirmDataFunctions() {
  Logger.log('=== TESTING ORDER CONFIRM DATA FUNCTIONS ===');
  
  // Test 1: Check if getConfirmedEnquiries exists
  Logger.log('1. Testing getConfirmedEnquiries...');
  try {
    const result = getConfirmedEnquiries({});
    Logger.log('✅ getConfirmedEnquiries works!');
    Logger.log('   Returned ' + result.length + ' orders');
    if (result.length > 0) {
      Logger.log('   First order: ' + JSON.stringify(result[0]));
    }
  } catch (e) {
    Logger.log('❌ getConfirmedEnquiries ERROR: ' + e.message);
  }
  
  // Test 2: Check if serveOrderConfirmData exists
  Logger.log('2. Testing serveOrderConfirmData...');
  try {
    // Create a test session first
    const testSessionId = 'test-session-' + new Date().getTime();
    const result = serveOrderConfirmData(testSessionId);
    Logger.log('✅ serveOrderConfirmData works!');
  } catch (e) {
    Logger.log('❌ serveOrderConfirmData ERROR: ' + e.message);
  }
  
  // Test 3: Check ORDER_CONFIRM_DATA sheet
  Logger.log('3. Checking ORDER_CONFIRM_DATA sheet...');
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('ORDER_CONFIRM_DATA');
    if (sheet) {
      Logger.log('✅ Sheet exists');
      Logger.log('   Rows: ' + sheet.getLastRow());
      Logger.log('   Columns: ' + sheet.getLastColumn());
      
      // Show headers
      const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
      Logger.log('   Headers: ' + JSON.stringify(headers));
    } else {
      Logger.log('❌ Sheet ORDER_CONFIRM_DATA not found!');
    }
  } catch (e) {
    Logger.log('❌ Sheet check ERROR: ' + e.message);
  }
  
  Logger.log('=== TEST COMPLETE ===');
}
