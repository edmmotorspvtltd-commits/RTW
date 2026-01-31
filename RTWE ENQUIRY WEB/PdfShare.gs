// ============================================
// PDF SHARE - FIXED VERSION (NO MENU CONFLICT)
// All issues resolved + Broker data handling
// ============================================

/**
 * Generate single-page PDF with only enquiry details
 * ENHANCED: Better error handling and cleanup
 */
// ============================================
// PDF SHARE - PROFESSIONAL DOCUMENT STYLE
// ============================================

/**
 * Generate professional document-style PDF with logo
 * COMPLETELY REWRITTEN for professional appearance
 */
// ============================================
// PROFESSIONAL PDF GENERATION - TABLE FORMAT
// Matches user's approved design
// ============================================

/**
 * Generate professional table-based PDF (single page)
 * COMPLETELY REWRITTEN to match approved format
 */
/**
 * ============================================
 * PROFESSIONAL PDF GENERATION - GOOGLE DOCS METHOD
 * Creates PDF directly from data using Google Docs
 * NO SHEET CONVERSION - Pure data to PDF
 * ============================================
 */

function generateEnquiryPDF(enquiryData) {
  try {
    // Step 1: Create a temporary Google Doc
    const docName = 'TEMP_PDF_' + new Date().getTime();
    const doc = DocumentApp.create(docName);
    const body = doc.getBody();
    
    // Clear any default content
    body.clear();
    
    // ====================================
    // HEADER SECTION WITH LOGO
    // ====================================
    
    // Try to insert logo
    try {
      const logoFiles = DriveApp.getFilesByName('logo.png');
      if (logoFiles.hasNext()) {
        const logoFile = logoFiles.next();
        const logoBlob = logoFile.getBlob();
        
        // Create a table for logo + text layout
        const headerTable = body.appendTable();
        const headerRow = headerTable.appendTableRow();
        
        // Logo cell
        const logoCell = headerRow.appendTableCell();
        const logoImage = logoCell.appendImage(logoBlob);
        logoImage.setWidth(80);
        logoImage.setHeight(80);
        
        // Text cell
        const textCell = headerRow.appendTableCell();
        textCell.appendParagraph('|| SHREE RADHAKRISHNAARPAN VIJAYATE ||')
          .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
          .editAsText()
          .setBold(true)
          .setFontSize(10)
          .setForegroundColor('#8B4513');
        
        // Remove table borders
        headerTable.setBorderWidth(0);
      }
    } catch (logoError) {
      Logger.log('Logo not inserted: ' + logoError);
    }
    
    // Empty line
    body.appendParagraph('');
    
    // Company Name
    body.appendParagraph('RAMRATAN TECHNO WEAVE')
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
      .editAsText()
      .setBold(true)
      .setFontSize(24)
      .setForegroundColor('#5D4037');
    
    // Empty line
    body.appendParagraph('');
    
    // Address
    body.appendParagraph('GAT NO 234, WARD NO 24, H NO 1770/4, NEAR SONAM CAR GAS, SOALGE MALA, SHAHAPUR, ICHALKARANJI 416115, DIST: KOLHAPUR')
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
      .editAsText()
      .setFontSize(9)
      .setForegroundColor('#333333');
    
    // Empty line
    body.appendParagraph('');
    
    // Contact Info
    body.appendParagraph('Tel: 9423858123')
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
      .editAsText()
      .setFontSize(9)
      .setForegroundColor('#333333');
    
    body.appendParagraph('Web: WWW.RAMRATANTEXTILES.COM')
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
      .editAsText()
      .setFontSize(9)
      .setForegroundColor('#333333');
    
    body.appendParagraph('MSME No: UDYAM-MH-15-0077448 | MSME Type: MICRO')
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
      .editAsText()
      .setFontSize(8)
      .setForegroundColor('#666666');
    
    // Separator line
    body.appendHorizontalRule();
    
    // Empty line
    body.appendParagraph('');
    
    // ====================================
    // DOCUMENT TITLE
    // ====================================
    body.appendParagraph('ENQUIRY FORM')
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
      .editAsText()
      .setBold(true)
      .setFontSize(18)
      .setForegroundColor('#5D4037');
    
    body.appendHorizontalRule();
    
    body.appendParagraph('');
    
    // ====================================
    // BASIC INFORMATION
    // ====================================
    body.appendParagraph('■ BASIC INFORMATION')
      .editAsText()
      .setBold(true)
      .setFontSize(12)
      .setForegroundColor('#FFFFFF')
      .setBackgroundColor('#5D4037');
    
    const basicTable = body.appendTable();
    
    // Row 1: RTWE No + Date
    const row1 = basicTable.appendTableRow();
    row1.appendTableCell('RTWE No:').editAsText().setBold(true).setBackgroundColor('#F5F5F5');
    row1.appendTableCell(enquiryData.rtweNo || '');
    row1.appendTableCell('Date:').editAsText().setBold(true).setBackgroundColor('#F5F5F5');
    row1.appendTableCell(enquiryData.enqDate || '');
    
    // Row 2: Broker
    const row2 = basicTable.appendTableRow();
    row2.appendTableCell('Broker:').editAsText().setBold(true).setBackgroundColor('#F5F5F5');
    const brokerCell = row2.appendTableCell(enquiryData.broker || '');
    brokerCell.setAttributes({[DocumentApp.Attribute.COLUMN_SPAN]: 3});
    
    // Row 3: Quality
    const row3 = basicTable.appendTableRow();
    row3.appendTableCell('Quality:').editAsText().setBold(true).setBackgroundColor('#F5F5F5');
    const qualityCell = row3.appendTableCell(enquiryData.quality || '');
    qualityCell.setAttributes({[DocumentApp.Attribute.COLUMN_SPAN]: 3});
    
    // Row 4: Given Rate
    const row4 = basicTable.appendTableRow();
    row4.appendTableCell('Given Rate:').editAsText().setBold(true).setBackgroundColor('#F5F5F5');
    const rateCell = row4.appendTableCell(enquiryData.givenRate ? '₹ ' + enquiryData.givenRate : '');
    rateCell.setAttributes({[DocumentApp.Attribute.COLUMN_SPAN]: 3});
    
    // Style table
    basicTable.setBorderWidth(1);
    basicTable.setBorderColor('#CCCCCC');
    
    body.appendParagraph('');
    
    // ====================================
    // ORDER DETAILS (If Approved)
    // ====================================
    if (enquiryData.buyer || enquiryData.finalRate) {
      body.appendParagraph('■ ORDER DETAILS (if approved)')
        .editAsText()
        .setBold(true)
        .setFontSize(12)
        .setForegroundColor('#FFFFFF')
        .setBackgroundColor('#5D4037');
      
      const orderTable = body.appendTable();
      
      // Final Rate + Buyer
      const oRow1 = orderTable.appendTableRow();
      oRow1.appendTableCell('Final Rate:').editAsText().setBold(true).setBackgroundColor('#F5F5F5');
      oRow1.appendTableCell(enquiryData.finalRate ? '₹ ' + enquiryData.finalRate : '');
      oRow1.appendTableCell('Buyer:').editAsText().setBold(true).setBackgroundColor('#F5F5F5');
      oRow1.appendTableCell(enquiryData.buyer || '');
      
      // P/O No
      const oRow2 = orderTable.appendTableRow();
      oRow2.appendTableCell('P/O No:').editAsText().setBold(true).setBackgroundColor('#F5F5F5');
      const poCell = oRow2.appendTableCell(enquiryData.poNo || '');
      poCell.setAttributes({[DocumentApp.Attribute.COLUMN_SPAN]: 3});
      
      // Total MTR + Value
      const oRow3 = orderTable.appendTableRow();
      oRow3.appendTableCell('Total MTR:').editAsText().setBold(true).setBackgroundColor('#F5F5F5');
      oRow3.appendTableCell(enquiryData.totalMTR || '');
      oRow3.appendTableCell('Value:').editAsText().setBold(true).setBackgroundColor('#F5F5F5');
      oRow3.appendTableCell(enquiryData.totalOrderValue ? '₹ ' + enquiryData.totalOrderValue : '');
      
      orderTable.setBorderWidth(1);
      orderTable.setBorderColor('#CCCCCC');
      
      body.appendParagraph('');
    }
    
    // ====================================
    // DESIGN & TAGA DETAILS - PARSE JSON
    // ====================================
    let designArray = [];
    let tagaArray = [];
    
    // Parse Design JSON
    if (enquiryData.design && enquiryData.design.trim().startsWith('[')) {
      try {
        designArray = JSON.parse(enquiryData.design);
      } catch (e) {
        Logger.log('Design JSON parse error: ' + e);
      }
    }
    
    // Parse TAGA JSON
    if (enquiryData.taga && enquiryData.taga.trim().startsWith('[')) {
      try {
        tagaArray = JSON.parse(enquiryData.taga);
      } catch (e) {
        Logger.log('TAGA JSON parse error: ' + e);
      }
    }
    
    if (designArray.length > 0 || tagaArray.length > 0) {
      body.appendParagraph('■ DESIGN & TAGA DETAILS')
        .editAsText()
        .setBold(true)
        .setFontSize(12)
        .setForegroundColor('#FFFFFF')
        .setBackgroundColor('#5D4037');
      
      const designTable = body.appendTable();
      
      // Header row
      const headerRow = designTable.appendTableRow();
      headerRow.appendTableCell('Design').editAsText().setBold(true).setBackgroundColor('#8B7355').setForegroundColor('#FFFFFF');
      headerRow.appendTableCell('Name').editAsText().setBold(true).setBackgroundColor('#8B7355').setForegroundColor('#FFFFFF');
      headerRow.appendTableCell('Taga').editAsText().setBold(true).setBackgroundColor('#8B7355').setForegroundColor('#FFFFFF');
      
      // Data rows
      const maxRows = Math.max(designArray.length, tagaArray.length);
      
      for (let i = 0; i < maxRows; i++) {
        const dataRow = designTable.appendTableRow();
        dataRow.appendTableCell('Design ' + (i + 1)).setBackgroundColor('#F5F5F5');
        dataRow.appendTableCell(designArray[i] || '');
        dataRow.appendTableCell(tagaArray[i] || '');
      }
      
      designTable.setBorderWidth(1);
      designTable.setBorderColor('#CCCCCC');
      
      body.appendParagraph('');
    }
    
    // ====================================
    // SELVEDGE DETAILS
    // ====================================
    if (enquiryData.selvedgeName || enquiryData.selvedgeEnds || enquiryData.selvedgeColor) {
      body.appendParagraph('■ SELVEDGE DETAILS')
        .editAsText()
        .setBold(true)
        .setFontSize(12)
        .setForegroundColor('#FFFFFF')
        .setBackgroundColor('#5D4037');
      
      const selvedgeTable = body.appendTable();
      
      const sRow1 = selvedgeTable.appendTableRow();
      sRow1.appendTableCell('Name:').editAsText().setBold(true).setBackgroundColor('#F5F5F5');
      const nameCell = sRow1.appendTableCell(enquiryData.selvedgeName || '');
      nameCell.setAttributes({[DocumentApp.Attribute.COLUMN_SPAN]: 3});
      
      const sRow2 = selvedgeTable.appendTableRow();
      sRow2.appendTableCell('Ends:').editAsText().setBold(true).setBackgroundColor('#F5F5F5');
      const endsCell = sRow2.appendTableCell(enquiryData.selvedgeEnds || '');
      endsCell.setAttributes({[DocumentApp.Attribute.COLUMN_SPAN]: 3});
      
      const sRow3 = selvedgeTable.appendTableRow();
      sRow3.appendTableCell('Color:').editAsText().setBold(true).setBackgroundColor('#F5F5F5');
      const colorCell = sRow3.appendTableCell(enquiryData.selvedgeColor || '');
      colorCell.setAttributes({[DocumentApp.Attribute.COLUMN_SPAN]: 3});
      
      selvedgeTable.setBorderWidth(1);
      selvedgeTable.setBorderColor('#CCCCCC');
      
      body.appendParagraph('');
    }
    
    // ====================================
    // FOOTER
    // ====================================
    body.appendParagraph('');
    body.appendHorizontalRule();
    body.appendParagraph('');
    
    const footerText = 'Generated on: ' + 
      Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd-MMM-yyyy HH:mm:ss') + 
      '  |  RTWE: ' + (enquiryData.rtweNo || 'N/A');
    
    body.appendParagraph(footerText)
      .setAlignment(DocumentApp.HorizontalAlignment.CENTER)
      .editAsText()
      .setFontSize(8)
      .setItalic(true)
      .setForegroundColor('#999999');
    
    // Save and close document
    doc.saveAndClose();
    
    // ====================================
    // CONVERT TO PDF
    // ====================================
    const docFile = DriveApp.getFileById(doc.getId());
    const pdfBlob = docFile.getAs('application/pdf');
    pdfBlob.setName('RTWE_Enquiry_' + enquiryData.rtweNo + '.pdf');
    
    // Save to Drive folder
    const folder = getDriveFolder('RTWE_PDFs');
    const pdfFile = folder.createFile(pdfBlob);
    
    // Delete temporary Google Doc
    DriveApp.getFileById(doc.getId()).setTrashed(true);
    
    Logger.log('✅ PDF generated: ' + pdfFile.getName());
    
    return {
      success: true,
      fileId: pdfFile.getId(),
      fileName: pdfFile.getName(),
      fileUrl: pdfFile.getUrl()
    };
    
  } catch (error) {
    Logger.log('❌ PDF Generation Error: ' + error);
    
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Get or create Drive folder with better error handling
 */
function getDriveFolder(folderName) {
  try {
    const folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
      return folders.next();
    }
    
    const newFolder = DriveApp.createFolder(folderName);
    Logger.log('Created new folder: ' + folderName);
    return newFolder;
    
  } catch (error) {
    throw new Error('Drive folder error: ' + error.toString());
  }
}

// ... rest of your PDF_SHARE.gs functions remain the same ...
// (Keep all other functions: generateBrokerToken, sharePDFfromHTML, sendBrokerEmail, etc.)

/**
 * Generate broker token with expiry and usage limits
 */
function generateBrokerToken(rtweNo) {
  const token = Utilities.getUuid();
  const scriptProps = PropertiesService.getScriptProperties();
  
  const tokenData = {
    rtweNo: rtweNo,
    createdAt: new Date().getTime(),
    expiresAt: new Date().getTime() + (72 * 60 * 60 * 1000),
    usageCount: 0,
    maxUsage: 3
  };
  
  scriptProps.setProperty('BROKER_TOKEN_' + token, JSON.stringify(tokenData));
  Logger.log('✅ Token generated for ' + rtweNo);
  
  return token;
}

/**
 * HTML-SAFE PDF SHARING FUNCTION
 * This is called from the HTML form - NO UI INTERACTIONS
 */
function sharePDFfromHTML(enquiryData, email) {
  try {
    Logger.log('=== sharePDFfromHTML START ===');
    Logger.log('RTWE: ' + enquiryData.rtweNo);
    Logger.log('Email: ' + email);
    
    // Validate inputs
    if (!enquiryData || !enquiryData.rtweNo) {
      return { success: false, error: 'Missing RTWE number' };
    }
    
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Invalid email address' };
    }
    
    // Step 1: Generate PDF
    const pdfResult = generateEnquiryPDF(enquiryData);
    
    if (!pdfResult.success) {
      Logger.log('PDF generation failed: ' + pdfResult.error);
      return { 
        success: false, 
        error: 'PDF generation failed: ' + pdfResult.error 
      };
    }
    
    // Step 2: Generate broker token
    const token = generateBrokerToken(enquiryData.rtweNo);
    
    // Step 3: Get deployment URL (hardcoded working URL)
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbzSFZ5s_60U4Hrum-BnkxP3r6WXGJUL0-Lzzber227ZYsKMxN4wbIX-GU8qgWE1vGck/exec';
    
    if (!scriptUrl) {
      return { 
        success: false, 
        error: 'Web App URL not configured!'
      };
    }
    
    const brokerLink = scriptUrl + '?action=broker&token=' + token;
    
    Logger.log('✅ Broker link: ' + brokerLink);
    
    // Step 4: Send Email
    const emailResult = sendBrokerEmail(email, enquiryData.rtweNo, brokerLink, pdfResult.fileId);
    
    if (!emailResult.success) {
      return { 
        success: false, 
        error: 'Email failed: ' + emailResult.error 
      };
    }
    
    // Step 5: Optional Telegram notification
    try {
      if (typeof TELEGRAM_CONFIG !== 'undefined' && TELEGRAM_CONFIG.ENABLED) {
        sendBrokerTelegram(enquiryData.rtweNo, brokerLink, pdfResult.fileId);
      }
    } catch (e) {
      Logger.log('Telegram notification skipped: ' + e);
    }
    
    Logger.log('=== sharePDFfromHTML SUCCESS ===');
    
    return {
      success: true,
      message: 'PDF shared successfully via email!',
      brokerLink: brokerLink,
      pdfFileName: pdfResult.fileName
    };
    
  } catch (error) {
    Logger.log('❌ sharePDFfromHTML error: ' + error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Send email with PDF and broker link
 */
function sendBrokerEmail(email, rtweNo, brokerLink, fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    const pdfBlob = file.getBlob();
    
    const subject = 'RTWE Enquiry - Selvedge Details Required - ' + rtweNo;
    
    const body = 
      'Dear Sir/Madam,\n\n' +
      'Greetings from Ramratan Techno Weave.\n\n' +
      'We request you to kindly fill in the selvedge details for the concerned order using the link provided below.\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
      'COMPANY DETAILS:\n\n' +
      'Company Name: Ramratan Techno Weave\n\n' +
      'Constitution Units:\n' +
      '• Ramratan Cotsyn – GSTIN: 27AHFPXM0585N1Z5\n' +
      '• Ramratan Techno Weave – GSTIN: 27AHFPM0535N2Z4\n' +
      '• Ramratan Weavings – GSTIN: 27ABEEFR8289B1ZW\n\n' +
      'Address:\n' +
      'Gat No. 234, Ward No. 24, H. No. 1770/4,\n' +
      'Near Sonam Car Gas, Soalge Mala, Shahapur,\n' +
      'Ichalkaranji – 416115, Dist. Kolhapur, Maharashtra\n\n' +
      'Contact No.: 9423858123\n' +
      'Website: www.ramratantextiles.com\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
      ' SELVEDGE DETAILS LINK:\n' +
      brokerLink + '\n\n' +
      ' Link Valid: 72 hours\n' +
      ' Max Submissions: 3 times\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
      'Kindly complete the above details at the earliest to avoid any delay in further processing.\n\n' +
      'For any clarification, please feel free to contact us.\n\n' +
      'Thanking you.\n\n' +
      'Warm regards,\n' +
      'RTW Team\n' +
      'Ramratan Techno Weave';
    
    GmailApp.sendEmail(
      email,
      subject,
      body,
      {
        attachments: [pdfBlob],
        name: 'RTW Team - Ramratan Techno Weave'
      }
    );
    
    Logger.log('✅ Email sent to: ' + email);
    
    return { success: true };
    
  } catch (error) {
    Logger.log('❌ Email error: ' + error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Optional: Send Telegram notification
 */
function sendBrokerTelegram(rtweNo, brokerLink, fileId) {
  try {
    if (!TELEGRAM_CONFIG || !TELEGRAM_CONFIG.ENABLED) {
      Logger.log('Telegram not enabled');
      return;
    }
    
    const file = DriveApp.getFileById(fileId);
    const blob = file.getBlob();
    
    const caption = 
      ' *RTWE Enquiry: ' + rtweNo + '*\n\n' +
      ' Selvedge Details Link:\n' +
      brokerLink + '\n\n' +
      ' Valid: 72 hours\n' +
      ' Max: 3 submissions';
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const telegramSheet = ss.getSheetByName('TELEGRAM_USERS');
    
    if (!telegramSheet) return;
    
    const data = telegramSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const chatId = data[i][0];
      const status = data[i][3];
      
      if (status === 'Active' && chatId) {
        sendTelegramDocument(chatId, blob, file.getName(), caption);
      }
    }
    
    Logger.log('✅ Telegram sent');
    
  } catch (error) {
    Logger.log('❌ Telegram error: ' + error);
  }
}

/**
 * Validate broker token
 */
function validateBrokerToken(token) {
  const scriptProps = PropertiesService.getScriptProperties();
  const tokenDataStr = scriptProps.getProperty('BROKER_TOKEN_' + token);
  
  if (!tokenDataStr) {
    return { valid: false, error: 'Invalid or expired token' };
  }
  
  const tokenData = JSON.parse(tokenDataStr);
  const now = new Date().getTime();
  
  if (now > tokenData.expiresAt) {
    return { valid: false, error: 'Token expired (72 hours limit)' };
  }
  
  if (tokenData.usageCount >= tokenData.maxUsage) {
    return { valid: false, error: 'Maximum submissions reached (3 times)' };
  }
  
  return { valid: true, data: tokenData };
}

/**
 * Increment broker token usage counter
 */
function incrementBrokerTokenUsage(token) {
  const scriptProps = PropertiesService.getScriptProperties();
  const tokenDataStr = scriptProps.getProperty('BROKER_TOKEN_' + token);
  
  if (tokenDataStr) {
    const tokenData = JSON.parse(tokenDataStr);
    tokenData.usageCount++;
    scriptProps.setProperty('BROKER_TOKEN_' + token, JSON.stringify(tokenData));
  }
}

/**
 * IMPROVED: Save broker submission AND write to sheet immediately
 */
function saveBrokerSubmission(token, brokerData) {
  try {
    const validation = validateBrokerToken(token);
    
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    const rtweNo = validation.data.rtweNo;
    
    // Save to Script Properties (backup)
    const scriptProps = PropertiesService.getScriptProperties();
    scriptProps.setProperty('BROKER_DATA_' + rtweNo, JSON.stringify(brokerData));
    
    // Increment token usage
    incrementBrokerTokenUsage(token);
    
    // ✅ NEW: Write to spreadsheet immediately
    const writeResult = writeBrokerDataToSheet(rtweNo, brokerData, validation.data.usageCount + 1);
    
    Logger.log('✅ Broker submission saved for ' + rtweNo);
    
    return { 
      success: true,
      sheetWritten: writeResult.success
    };
    
  } catch (error) {
    Logger.log('❌ saveBrokerSubmission error: ' + error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Write broker submission to BROKER_SUBMISSIONS sheet
 */
function writeBrokerDataToSheet(rtweNo, brokerData, submissionCount) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('BROKER_SUBMISSIONS');
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet('BROKER_SUBMISSIONS');
      
      // Add headers
      const headers = [
        'RTWE No', 
        'Selvedge Name', 
        'Selvedge Notes', 
        'Submitted At',
        'Submission Count',
        'Status'
      ];
      
      sheet.getRange(1, 1, 1, headers.length)
        .setValues([headers])
        .setFontWeight('bold')
        .setBackground('#8b7355')
        .setFontColor('#ffffff');
      
      sheet.setFrozenRows(1);
      sheet.setColumnWidth(1, 120);
      sheet.setColumnWidth(2, 200);
      sheet.setColumnWidth(3, 300);
      sheet.setColumnWidth(4, 180);
      sheet.setColumnWidth(5, 140);
      sheet.setColumnWidth(6, 100);
    }
    
    // Check if RTWE already has a submission
    const data = sheet.getDataRange().getValues();
    let existingRow = -1;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === rtweNo) {
        existingRow = i + 1;
        break;
      }
    }
    
    const timestamp = new Date(brokerData.submittedAt || new Date());
    const formattedTime = Utilities.formatDate(
      timestamp, 
      Session.getScriptTimeZone(), 
      'dd-MMM-yyyy HH:mm:ss'
    );
    
    const rowData = [
      rtweNo,
      brokerData.selvedgeName || '',
      brokerData.selvedgeNotes || '',
      formattedTime,
      submissionCount,
      'Received'
    ];
    
    if (existingRow > 0) {
      // Update existing row
      sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
      sheet.getRange(existingRow, 1, 1, rowData.length).setBackground('#fff8f0');
      Logger.log('✅ Updated existing broker submission row for ' + rtweNo);
    } else {
      // Add new row
      sheet.appendRow(rowData);
      const lastRow = sheet.getLastRow();
      sheet.getRange(lastRow, 1, 1, rowData.length).setBackground('#f5f5f5');
      Logger.log('✅ Added new broker submission row for ' + rtweNo);
    }
    
    return { success: true };
    
  } catch (error) {
    Logger.log('❌ writeBrokerDataToSheet error: ' + error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Get enquiry details for broker form
 */
function getEnquiryForBroker(rtweNo) {
  try {
    Logger.log('🔍 getEnquiryForBroker called for: ' + rtweNo);
    
    if (!rtweNo) {
      Logger.log('❌ rtweNo is empty or null');
      return null;
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ['PENDING_DATA', 'PENDING_APPROVED', 'ORDER_CONFIRM_DATA'];
    
    // Normalize search RTWE
    const searchRtwe = String(rtweNo).trim().toUpperCase().replace(/[-\s]/g, '');
    Logger.log('Searching for normalized RTWE: ' + searchRtwe);
    
    for (let sheetName of sheets) {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        Logger.log('Sheet not found: ' + sheetName);
        continue;
      }
      
      const lastRow = sheet.getLastRow();
      if (lastRow < 2) {
        Logger.log('No data in sheet: ' + sheetName);
        continue;
      }
      
      const data = sheet.getRange(1, 1, lastRow, 10).getValues();
      Logger.log('Searching in ' + sheetName + ' with ' + (data.length - 1) + ' rows');
      
      for (let i = 1; i < data.length; i++) {
        const sheetRtwe = String(data[i][0] || '').trim().toUpperCase().replace(/[-\s]/g, '');
        
        if (sheetRtwe === searchRtwe || sheetRtwe.includes(searchRtwe) || searchRtwe.includes(sheetRtwe)) {
          Logger.log('✅ Found match in ' + sheetName + ' at row ' + (i + 1));
          
          return {
            rtweNo: String(data[i][0] || ''),
            costingNo: String(data[i][1] || ''),
            broker: String(data[i][4] || ''),
            quality: String(data[i][5] || ''),
            givenRate: String(data[i][6] || ''),
            orderStatus: String(data[i][7] || '')
          };
        }
      }
    }
    
    Logger.log('❌ RTWE not found in any sheet: ' + rtweNo);
    return null;
    
  } catch (error) {
    Logger.log('❌ getEnquiryForBroker error: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    return null;
  }
}

/**
 * Show all broker submissions sheet
 */
function showBrokerSubmissions() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('BROKER_SUBMISSIONS');
  
  if (!sheet) {
    SpreadsheetApp.getUi().alert(
      '❌ No Submissions Found',
      'The BROKER_SUBMISSIONS sheet does not exist yet.\n\n' +
      'It will be created automatically when a broker submits data.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }
  
  ss.setActiveSheet(sheet);
  
  SpreadsheetApp.getUi().alert(
    '✅ Broker Submissions',
    'Showing all broker submissions.\n\n' +
    'Total submissions: ' + (sheet.getLastRow() - 1),
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Retrieve all broker submissions from Script Properties
 */
function getAllBrokerSubmissions() {
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const allProps = scriptProps.getProperties();
    const submissions = [];
    
    for (let key in allProps) {
      if (key.startsWith('BROKER_DATA_')) {
        const rtweNo = key.replace('BROKER_DATA_', '');
        const data = JSON.parse(allProps[key]);
        
        submissions.push({
          rtweNo: rtweNo,
          data: data
        });
      }
    }
    
    return submissions;
    
  } catch (error) {
    Logger.log('❌ getAllBrokerSubmissions error: ' + error);
    return [];
  }
}

/**
 * UTILITY: Recover all old broker submissions and write them to sheet
 * Run this ONCE to recover any old submissions
 */
function recoverOldBrokerSubmissions() {
  const submissions = getAllBrokerSubmissions();
  
  Logger.log('Found ' + submissions.length + ' broker submissions in properties');
  
  if (submissions.length === 0) {
    SpreadsheetApp.getUi().alert(
      'ℹ️ No Data Found',
      'No broker submissions found in Script Properties.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }
  
  let recovered = 0;
  
  submissions.forEach(function(submission) {
    const result = writeBrokerDataToSheet(
      submission.rtweNo, 
      submission.data,
      1
    );
    
    if (result.success) {
      recovered++;
    }
  });
  
  Logger.log('✅ Recovered ' + recovered + ' submissions to sheet');
  
  SpreadsheetApp.getUi().alert(
    '✅ Recovery Complete',
    'Total found: ' + submissions.length + '\n' +
    'Successfully recovered: ' + recovered + '\n\n' +
    'Check the BROKER_SUBMISSIONS sheet.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
  
  return {
    total: submissions.length,
    recovered: recovered
  };



/**
 * Generate broker token with expiry and usage limits
 */
function generateBrokerToken(rtweNo) {
  const token = Utilities.getUuid();
  const scriptProps = PropertiesService.getScriptProperties();
  
  const tokenData = {
    rtweNo: rtweNo,
    createdAt: new Date().getTime(),
    expiresAt: new Date().getTime() + (72 * 60 * 60 * 1000),
    usageCount: 0,
    maxUsage: 3
  };
  
  scriptProps.setProperty('BROKER_TOKEN_' + token, JSON.stringify(tokenData));
  Logger.log('✅ Token generated for ' + rtweNo);
  
  return token;
}

/**
 * HTML-SAFE PDF SHARING FUNCTION
 * This is called from the HTML form - NO UI INTERACTIONS
 */
function sharePDFfromHTML(enquiryData, email) {
  try {
    Logger.log('=== sharePDFfromHTML START ===');
    Logger.log('RTWE: ' + enquiryData.rtweNo);
    Logger.log('Email: ' + email);
    
    // Validate inputs
    if (!enquiryData || !enquiryData.rtweNo) {
      return { success: false, error: 'Missing RTWE number' };
    }
    
    if (!email || !email.includes('@')) {
      return { success: false, error: 'Invalid email address' };
    }
    
    // Step 1: Generate PDF
    const pdfResult = generateEnquiryPDF(enquiryData);
    
    if (!pdfResult.success) {
      Logger.log('PDF generation failed: ' + pdfResult.error);
      return { 
        success: false, 
        error: 'PDF generation failed: ' + pdfResult.error 
      };
    }
    
    // Step 2: Generate broker token
    const token = generateBrokerToken(enquiryData.rtweNo);
    
    // Step 3: Get deployment URL (hardcoded working URL)
    const scriptUrl = 'https://script.google.com/macros/s/AKfycbzSFZ5s_60U4Hrum-BnkxP3r6WXGJUL0-Lzzber227ZYsKMxN4wbIX-GU8qgWE1vGck/exec';
    
    if (!scriptUrl) {
      return { 
        success: false, 
        error: 'Web App URL not configured!'
      };
    }
    
    const brokerLink = scriptUrl + '?action=broker&token=' + token;
    
    Logger.log('✅ Broker link: ' + brokerLink);
    
    // Step 4: Send Email
    const emailResult = sendBrokerEmail(email, enquiryData.rtweNo, brokerLink, pdfResult.fileId);
    
    if (!emailResult.success) {
      return { 
        success: false, 
        error: 'Email failed: ' + emailResult.error 
      };
    }
    
    // Step 5: Optional Telegram notification
    try {
      if (typeof TELEGRAM_CONFIG !== 'undefined' && TELEGRAM_CONFIG.ENABLED) {
        sendBrokerTelegram(enquiryData.rtweNo, brokerLink, pdfResult.fileId);
      }
    } catch (e) {
      Logger.log('Telegram notification skipped: ' + e);
    }
    
    Logger.log('=== sharePDFfromHTML SUCCESS ===');
    
    return {
      success: true,
      message: 'PDF shared successfully via email!',
      brokerLink: brokerLink,
      pdfFileName: pdfResult.fileName
    };
    
  } catch (error) {
    Logger.log('❌ sharePDFfromHTML error: ' + error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

/**
 * Send email with PDF and broker link
 */
function sendBrokerEmail(email, rtweNo, brokerLink, fileId) {
  try {
    const file = DriveApp.getFileById(fileId);
    const pdfBlob = file.getBlob();
    
    const subject = 'RTWE Enquiry - Selvedge Details Required - ' + rtweNo;
    
    const body = 
      'Dear Sir/Madam,\n\n' +
      'Greetings from Ramratan Techno Weave.\n\n' +
      'We request you to kindly fill in the selvedge details for the concerned order using the link provided below.\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
      'COMPANY DETAILS:\n\n' +
      'Company Name: Ramratan Techno weave\n\n' +
      'Constitution Units:\n' +
      '• Ramratan Cotsyn – GSTIN: 27AHFPXM0585N1Z5\n' +
      '• Ramratan Techno Weave – GSTIN: 27AHFPM0535N2Z4\n' +
      '• Ramratan Weavings – GSTIN: 27ABEEFR8289B1ZW\n\n' +
      'Address:\n' +
      'Gat No. 234, Ward No. 24, H. No. 1770/4,\n' +
      'Near Sonam Car Gas, Soalge Mala, Shahapur,\n' +
      'Ichalkaranji – 416115, Dist. Kolhapur, Maharashtra\n\n' +
      'Contact No.: 9423858123\n' +
      'Website: www.ramratantextiles.com\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
      ' SELVEDGE DETAILS LINK:\n' +
      brokerLink + '\n\n' +
      ' Link Valid: 72 hours\n' +
      ' Max Submissions: 3 times\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
      'Kindly complete the above details at the earliest to avoid any delay in further processing.\n\n' +
      'For any clarification, please feel free to contact us.\n\n' +
      'Thanking you.\n\n' +
      'Warm regards,\n' +
      'RTW Team\n' +
      'Ramratan Techno Weave';
    
    GmailApp.sendEmail(
      email,
      subject,
      body,
      {
        attachments: [pdfBlob],
        name: 'RTW Team - Ramratan Techno weave'
      }
    );
    
    Logger.log('✅ Email sent to: ' + email);
    
    return { success: true };
    
  } catch (error) {
    Logger.log('❌ Email error: ' + error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Optional: Send Telegram notification
 */
function sendBrokerTelegram(rtweNo, brokerLink, fileId) {
  try {
    if (!TELEGRAM_CONFIG || !TELEGRAM_CONFIG.ENABLED) {
      Logger.log('Telegram not enabled');
      return;
    }
    
    const file = DriveApp.getFileById(fileId);
    const blob = file.getBlob();
    
    const caption = 
      ' *RTWE Enquiry: ' + rtweNo + '*\n\n' +
      ' Selvedge Details Link:\n' +
      brokerLink + '\n\n' +
      ' Valid: 72 hours\n' +
      ' Max: 3 submissions';
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const telegramSheet = ss.getSheetByName('TELEGRAM_USERS');
    
    if (!telegramSheet) return;
    
    const data = telegramSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      const chatId = data[i][0];
      const status = data[i][3];
      
      if (status === 'Active' && chatId) {
        sendTelegramDocument(chatId, blob, file.getName(), caption);
      }
    }
    
    Logger.log('✅ Telegram sent');
    
  } catch (error) {
    Logger.log('❌ Telegram error: ' + error);
  }
}

/**
 * Validate broker token
 */
function validateBrokerToken(token) {
  const scriptProps = PropertiesService.getScriptProperties();
  const tokenDataStr = scriptProps.getProperty('BROKER_TOKEN_' + token);
  
  if (!tokenDataStr) {
    return { valid: false, error: 'Invalid or expired token' };
  }
  
  const tokenData = JSON.parse(tokenDataStr);
  const now = new Date().getTime();
  
  if (now > tokenData.expiresAt) {
    return { valid: false, error: 'Token expired (72 hours limit)' };
  }
  
  if (tokenData.usageCount >= tokenData.maxUsage) {
    return { valid: false, error: 'Maximum submissions reached (3 times)' };
  }
  
  return { valid: true, data: tokenData };
}

/**
 * Increment broker token usage counter
 */
function incrementBrokerTokenUsage(token) {
  const scriptProps = PropertiesService.getScriptProperties();
  const tokenDataStr = scriptProps.getProperty('BROKER_TOKEN_' + token);
  
  if (tokenDataStr) {
    const tokenData = JSON.parse(tokenDataStr);
    tokenData.usageCount++;
    scriptProps.setProperty('BROKER_TOKEN_' + token, JSON.stringify(tokenData));
  }
}

/**
 * IMPROVED: Save broker submission AND write to sheet immediately
 */
function saveBrokerSubmission(token, brokerData) {
  try {
    const validation = validateBrokerToken(token);
    
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    
    const rtweNo = validation.data.rtweNo;
    
    // Save to Script Properties (backup)
    const scriptProps = PropertiesService.getScriptProperties();
    scriptProps.setProperty('BROKER_DATA_' + rtweNo, JSON.stringify(brokerData));
    
    // Increment token usage
    incrementBrokerTokenUsage(token);
    
    // ✅ NEW: Write to spreadsheet immediately
    const writeResult = writeBrokerDataToSheet(rtweNo, brokerData, validation.data.usageCount + 1);
    
    Logger.log('✅ Broker submission saved for ' + rtweNo);
    
    return { 
      success: true,
      sheetWritten: writeResult.success
    };
    
  } catch (error) {
    Logger.log('❌ saveBrokerSubmission error: ' + error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Write broker submission to BROKER_SUBMISSIONS sheet
 */
function writeBrokerDataToSheet(rtweNo, brokerData, submissionCount) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName('BROKER_SUBMISSIONS');
    
    // Create sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet('BROKER_SUBMISSIONS');
      
      // Add headers
      const headers = [
        'RTWE No', 
        'Selvedge Name', 
        'Selvedge Notes', 
        'Submitted At',
        'Submission Count',
        'Status'
      ];
      
      sheet.getRange(1, 1, 1, headers.length)
        .setValues([headers])
        .setFontWeight('bold')
        .setBackground('#8b7355')
        .setFontColor('#ffffff');
      
      sheet.setFrozenRows(1);
      sheet.setColumnWidth(1, 120);
      sheet.setColumnWidth(2, 200);
      sheet.setColumnWidth(3, 300);
      sheet.setColumnWidth(4, 180);
      sheet.setColumnWidth(5, 140);
      sheet.setColumnWidth(6, 100);
    }
    
    // Check if RTWE already has a submission
    const data = sheet.getDataRange().getValues();
    let existingRow = -1;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === rtweNo) {
        existingRow = i + 1;
        break;
      }
    }
    
    const timestamp = new Date(brokerData.submittedAt || new Date());
    const formattedTime = Utilities.formatDate(
      timestamp, 
      Session.getScriptTimeZone(), 
      'dd-MMM-yyyy HH:mm:ss'
    );
    
    const rowData = [
      rtweNo,
      brokerData.selvedgeName || '',
      brokerData.selvedgeNotes || '',
      formattedTime,
      submissionCount,
      'Received'
    ];
    
    if (existingRow > 0) {
      // Update existing row
      sheet.getRange(existingRow, 1, 1, rowData.length).setValues([rowData]);
      sheet.getRange(existingRow, 1, 1, rowData.length).setBackground('#fff8f0');
      Logger.log('✅ Updated existing broker submission row for ' + rtweNo);
    } else {
      // Add new row
      sheet.appendRow(rowData);
      const lastRow = sheet.getLastRow();
      sheet.getRange(lastRow, 1, 1, rowData.length).setBackground('#f5f5f5');
      Logger.log('✅ Added new broker submission row for ' + rtweNo);
    }
    
    return { success: true };
    
  } catch (error) {
    Logger.log('❌ writeBrokerDataToSheet error: ' + error);
    return { success: false, error: error.toString() };
  }
}

/**
 * Get enquiry details for broker form
 */
function getEnquiryForBroker(rtweNo) {
  try {
    Logger.log('🔍 getEnquiryForBroker called for: ' + rtweNo);
    
    if (!rtweNo) {
      Logger.log('❌ rtweNo is empty or null');
      return null;
    }
    
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = ['PENDING_DATA', 'PENDING_APPROVED', 'ORDER_CONFIRM_DATA'];
    
    // Normalize search RTWE
    const searchRtwe = String(rtweNo).trim().toUpperCase().replace(/[-\s]/g, '');
    Logger.log('Searching for normalized RTWE: ' + searchRtwe);
    
    for (let sheetName of sheets) {
      const sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        Logger.log('Sheet not found: ' + sheetName);
        continue;
      }
      
      const lastRow = sheet.getLastRow();
      if (lastRow < 2) {
        Logger.log('No data in sheet: ' + sheetName);
        continue;
      }
      
      const data = sheet.getRange(1, 1, lastRow, 10).getValues();
      Logger.log('Searching in ' + sheetName + ' with ' + (data.length - 1) + ' rows');
      
      for (let i = 1; i < data.length; i++) {
        const sheetRtwe = String(data[i][0] || '').trim().toUpperCase().replace(/[-\s]/g, '');
        
        if (sheetRtwe === searchRtwe || sheetRtwe.includes(searchRtwe) || searchRtwe.includes(sheetRtwe)) {
          Logger.log('✅ Found match in ' + sheetName + ' at row ' + (i + 1));
          
          return {
            rtweNo: String(data[i][0] || ''),
            costingNo: String(data[i][1] || ''),
            broker: String(data[i][4] || ''),
            quality: String(data[i][5] || ''),
            givenRate: String(data[i][6] || ''),
            orderStatus: String(data[i][7] || '')
          };
        }
      }
    }
    
    Logger.log('❌ RTWE not found in any sheet: ' + rtweNo);
    return null;
    
  } catch (error) {
    Logger.log('❌ getEnquiryForBroker error: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    return null;
  }
}

/**
 * Show all broker submissions sheet
 */
function showBrokerSubmissions() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('BROKER_SUBMISSIONS');
  
  if (!sheet) {
    SpreadsheetApp.getUi().alert(
      '❌ No Submissions Found',
      'The BROKER_SUBMISSIONS sheet does not exist yet.\n\n' +
      'It will be created automatically when a broker submits data.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }
  
  ss.setActiveSheet(sheet);
  
  SpreadsheetApp.getUi().alert(
    '✅ Broker Submissions',
    'Showing all broker submissions.\n\n' +
    'Total submissions: ' + (sheet.getLastRow() - 1),
    SpreadsheetApp.getUi().ButtonSet.OK
  );
}

/**
 * Retrieve all broker submissions from Script Properties
 */
function getAllBrokerSubmissions() {
  try {
    const scriptProps = PropertiesService.getScriptProperties();
    const allProps = scriptProps.getProperties();
    const submissions = [];
    
    for (let key in allProps) {
      if (key.startsWith('BROKER_DATA_')) {
        const rtweNo = key.replace('BROKER_DATA_', '');
        const data = JSON.parse(allProps[key]);
        
        submissions.push({
          rtweNo: rtweNo,
          data: data
        });
      }
    }
    
    return submissions;
    
  } catch (error) {
    Logger.log('❌ getAllBrokerSubmissions error: ' + error);
    return [];
  }
}

/**
 * UTILITY: Recover all old broker submissions and write them to sheet
 * Run this ONCE to recover any old submissions
 */
function recoverOldBrokerSubmissions() {
  const submissions = getAllBrokerSubmissions();
  
  Logger.log('Found ' + submissions.length + ' broker submissions in properties');
  
  if (submissions.length === 0) {
    SpreadsheetApp.getUi().alert(
      'ℹ️ No Data Found',
      'No broker submissions found in Script Properties.',
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return;
  }
  
  let recovered = 0;
  
  submissions.forEach(function(submission) {
    const result = writeBrokerDataToSheet(
      submission.rtweNo, 
      submission.data,
      1
    );
    
    if (result.success) {
      recovered++;
    }
  });
  
  Logger.log('✅ Recovered ' + recovered + ' submissions to sheet');
  
  SpreadsheetApp.getUi().alert(
    '✅ Recovery Complete',
    'Total found: ' + submissions.length + '\n' +
    'Successfully recovered: ' + recovered + '\n\n' +
    'Check the BROKER_SUBMISSIONS sheet.',
    SpreadsheetApp.getUi().ButtonSet.OK
  );
  
  return {
    total: submissions.length,
    recovered: recovered
  };
}
}


function authorizePDFGeneration() {
  // This simple function will trigger DocumentApp authorization
  const doc = DocumentApp.create('TEST_AUTH');
  const docId = doc.getId();
  
  // Delete the test doc
  DriveApp.getFileById(docId).setTrashed(true);
  
  Logger.log('✅ Authorization successful!');
  
  return 'Authorization granted';
}


function testPDFGeneration() {
  const testData = {
    rtweNo: 'TEST-001',
    enqDate: '04-Jan-2026',
    broker: 'Test Broker',
    quality: 'Test Quality',
    givenRate: '100'
  };
  
  const result = generateEnquiryPDF(testData);
  Logger.log('Result: ' + JSON.stringify(result));
}