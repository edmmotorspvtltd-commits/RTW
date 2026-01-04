// ADD THIS TO GOOGLE APPS SCRIPT AND RUN IT
// This will tell you if serveOrderConfirmData is accessible

function TEST_ServeFunction() {
  Logger.clear();
  Logger.log('=== TESTING serveOrderConfirmData ===');
  
  try {
    // Check if function exists
    const exists = typeof serveOrderConfirmData === 'function';
    Logger.log('serveOrderConfirmData exists: ' + (exists ? '✅ YES' : '❌ NO'));
    
    if (!exists) {
      Logger.log('');
      Logger.log('❌ PROBLEM FOUND:');
      Logger.log('The serveOrderConfirmData function does NOT exist in your GAS project!');
      Logger.log('');
      Logger.log('SOLUTION:');
      Logger.log('1. Check if OrderConfirmData.gs file exists in GAS');
      Logger.log('2. If missing, create it and paste the content');
      Logger.log('3. Save and deploy new version');
      return;
    }
    
    // Try to call it with a test session
    Logger.log('Attempting to call function...');
    const result = serveOrderConfirmData('test-session-123');
    Logger.log('✅ Function callable!');
    Logger.log('Result type: ' + typeof result);
    
  } catch (e) {
    Logger.log('❌ ERROR: ' + e.message);
    Logger.log('Stack: ' + e.stack);
  }
  
  Logger.log('=== TEST COMPLETE ===');
}
