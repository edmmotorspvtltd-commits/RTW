/**
 * ================================================================
 * RAMRATAN TECHNO WEAVE - PRINT TO PDF SYSTEM
 * ================================================================
 * 
 * SIMPLE WORKFLOW:
 * 1. User enters sales order data in Google Sheets
 * 2. User clicks "Print PDF" button (or uses menu)
 * 3. Script generates PDF in exact invoice format
 * 4. PDF opens automatically / downloads
 * 
 * ================================================================
 */

// ==================== CONFIGURATION ====================
var CONFIG = {
  LOGO_FILE_ID: 'YOUR_LOGO_FILE_ID', // Paste your logo file ID here
  OUTPUT_FOLDER_ID: 'YOUR_OUTPUT_FOLDER_ID', // Folder for PDFs

  COMPANY: {
    name: 'RAMRATAN TECHNO WEAVE',
    address: 'GAT NO 294, BUNG-24, BUNG-1770-1, NEAR SOMANI OIL GAS, SAVADI MALA, SHAHAD-5, ICHALKARANJI',
    pincode: '416115, Dist: KOLHAPUR',
    phone: 'Tel: 9422855123',
    website: 'Web: WWW.RAMRATANTEXTILES.COM',
    msme: 'MSME No: UDYAM-MH-13-0074949 | MSME Type: Micro',
    gst: 'GST NO - 27AAFFR8063A2ZA'
  },

  BANK: {
    name: 'MAHARASHTRA GRAMIN BANK LTD',
    accountNo: '01213010000120',
    branch: 'MSBL0000012',
    ifsc: 'MSBL0000012'
  }
};

// ==================== MENU & BUTTON SETUP ====================

/**
 * Runs when spreadsheet opens - creates custom menu
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();

  ui.createMenu('🖨️ PRINT')
    .addItem('📄 Print Invoice to PDF', 'printInvoiceToPDF')
    .addItem('👁️ Preview PDF', 'previewPDF')
    .addSeparator()
    .addItem('📁 Open PDF Folder', 'openPDFFolder')
    .addItem('📧 Email PDF', 'emailPDF')
    .addToUi();
}

/**
 * MAIN FUNCTION - Called when user clicks "Print Invoice to PDF"
 * This is what happens when user wants to print!
 */
function printInvoiceToPDF() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var ui = SpreadsheetApp.getUi();

    // Get active row (where user clicked)
    var activeRow = ss.getActiveSheet().getActiveRange().getRow();

    if (activeRow < 2) {
      ui.alert('⚠️ Please select a sales order row first!');
      return;
    }

    // Show processing message
    ui.alert('🔄 Generating PDF...\n\nPlease wait a few seconds.');

    // Get order data
    var orderData = getOrderData(activeRow);

    if (!orderData || !orderData.invoiceNo) {
      ui.alert('❌ Error: No invoice data found in selected row!');
      return;
    }

    // Generate PDF
    var pdfFile = createInvoicePDF(orderData);

    // Success! Show options
    var response = ui.alert(
      '✅ PDF Generated Successfully!',
      'Invoice: ' + orderData.invoiceNo + '\n' +
      'File: ' + pdfFile.getName() + '\n' +
      'Size: ' + (pdfFile.getSize() / 1024).toFixed(0) + ' KB\n\n' +
      '📥 Click OK to open PDF, or Cancel to continue working.',
      ui.ButtonSet.OK_CANCEL
    );

    if (response == ui.Button.OK) {
      // Open PDF in new window
      var htmlOutput = HtmlService.createHtmlOutput(
        '<html><body>' +
        '<script>' +
        'window.open("' + pdfFile.getUrl() + '", "_blank");' +
        'google.script.host.close();' +
        '</script>' +
        '<p>Opening PDF... If it doesn\'t open, <a href="' + pdfFile.getUrl() + '" target="_blank">click here</a>.</p>' +
        '</body></html>'
      ).setWidth(400).setHeight(200);

      ui.showModalDialog(htmlOutput, '📄 Opening PDF...');
    }

    // Log the generation
    logPDFGeneration(orderData.invoiceNo, pdfFile.getId(), pdfFile.getUrl());

  } catch (error) {
    Logger.log('Error in printInvoiceToPDF: ' + error);
    SpreadsheetApp.getUi().alert('❌ Error generating PDF:\n\n' + error.toString());
  }
}

/**
 * Preview PDF without saving (quick view)
 */
function previewPDF() {
  try {
    var activeRow = SpreadsheetApp.getActiveSheet().getActiveRange().getRow();

    if (activeRow < 2) {
      SpreadsheetApp.getUi().alert('⚠️ Please select a sales order row first!');
      return;
    }

    var orderData = getOrderData(activeRow);
    var pdfFile = createInvoicePDF(orderData);

    // Open immediately
    var htmlOutput = HtmlService.createHtmlOutput(
      '<iframe src="' + pdfFile.getUrl() + '" width="100%" height="600px"></iframe>'
    ).setWidth(800).setHeight(650);

    SpreadsheetApp.getUi().showModalDialog(htmlOutput, '📄 Preview: ' + orderData.invoiceNo);

  } catch (error) {
    SpreadsheetApp.getUi().alert('Error: ' + error.toString());
  }
}

/**
 * Email PDF to customer
 */
function emailPDF() {
  try {
    var ui = SpreadsheetApp.getUi();
    var activeRow = SpreadsheetApp.getActiveSheet().getActiveRange().getRow();

    if (activeRow < 2) {
      ui.alert('⚠️ Please select a sales order row first!');
      return;
    }

    // Get email address
    var result = ui.prompt(
      'Email Invoice PDF',
      'Enter recipient email address:',
      ui.ButtonSet.OK_CANCEL
    );

    if (result.getSelectedButton() != ui.Button.OK) {
      return;
    }

    var email = result.getResponseText();

    if (!email || email.indexOf('@') === -1) {
      ui.alert('❌ Invalid email address!');
      return;
    }

    // Generate PDF
    var orderData = getOrderData(activeRow);
    var pdfFile = createInvoicePDF(orderData);

    // Send email
    MailApp.sendEmail({
      to: email,
      subject: 'Tax Invoice - ' + orderData.invoiceNo + ' - Ramratan Techno Weave',
      body: 'Dear Customer,\n\n' +
        'Please find attached your tax invoice.\n\n' +
        'Invoice No: ' + orderData.invoiceNo + '\n' +
        'Invoice Date: ' + orderData.invoiceDate + '\n' +
        'Amount: ₹ ' + formatNumber(orderData.finalTotal, 2) + '\n\n' +
        'Thank you for your business!\n\n' +
        'Best regards,\n' +
        'Ramratan Techno Weave',
      attachments: [pdfFile.getAs(MimeType.PDF)]
    });

    ui.alert('✅ Email sent successfully to: ' + email);

  } catch (error) {
    SpreadsheetApp.getUi().alert('Error sending email: ' + error.toString());
  }
}

// ==================== DATA RETRIEVAL ====================

/**
 * Get order data from current row
 */
function getOrderData(row) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getActiveSheet();

  // Read the row data (adjust column count as needed)
  var rowData = sheet.getRange(row, 1, 1, 20).getValues()[0];

  // Map to order object
  var orderData = {
    invoiceNo: rowData[0] || '',
    invoiceDate: formatDate(rowData[1]),
    reverseCharge: rowData[2] || 'No',
    transport: rowData[3] || '',
    vehicleNo: rowData[4] || '',
    lrNo: rowData[5] || '',
    lrDate: formatDate(rowData[6]),
    buyerName: rowData[7] || '',
    buyerAddress: rowData[8] || '',
    buyerCity: rowData[9] || '',
    buyerState: rowData[10] || '',
    buyerPincode: rowData[11] || '',
    buyerGST: rowData[12] || '',
    buyerPlace: rowData[13] || '',
    agentName: rowData[14] || '',
    agentMobile: rowData[15] || '',
    ewayBill: rowData[16] || '',
    gstType: rowData[17] || 'CGST/SGST',
    items: [],

    // Will be calculated
    totalAmount: 0,
    cgst: 0,
    sgst: 0,
    igst: 0,
    grandTotal: 0,
    finalTotal: 0
  };

  // Get items from next columns or separate sheet
  // For simplicity, assuming items are in columns 18+
  // Adjust based on your sheet structure

  // Example: Get items from "Order Items" sheet
  var itemsSheet = ss.getSheetByName('Order Items');
  if (itemsSheet) {
    var itemsData = itemsSheet.getDataRange().getValues();

    for (var i = 1; i < itemsData.length; i++) {
      if (itemsData[i][0] == orderData.invoiceNo) {
        orderData.items.push({
          srNo: orderData.items.length + 1,
          description: itemsData[i][1] || '',
          hsnCode: itemsData[i][2] || '',
          fromOrderNo: itemsData[i][3] || '',
          toOrderNo: itemsData[i][4] || '',
          pieces: parseFloat(itemsData[i][5]) || 0,
          quantity: parseFloat(itemsData[i][6]) || 0,
          uom: itemsData[i][7] || 'MTR',
          rate: parseFloat(itemsData[i][8]) || 0,
          amount: 0
        });
      }
    }

    // Calculate item amounts
    orderData.items.forEach(function (item) {
      item.amount = item.quantity * item.rate;
      orderData.totalAmount += item.amount;
    });
  }

  // Calculate GST
  calculateTotals(orderData);

  return orderData;
}

/**
 * Calculate totals and GST
 */
function calculateTotals(orderData) {
  var gstRate = 5; // 5% total (2.5% + 2.5%)

  if (orderData.gstType === 'IGST') {
    orderData.igst = (orderData.totalAmount * gstRate) / 100;
    orderData.cgst = 0;
    orderData.sgst = 0;
  } else {
    orderData.cgst = (orderData.totalAmount * (gstRate / 2)) / 100;
    orderData.sgst = (orderData.totalAmount * (gstRate / 2)) / 100;
    orderData.igst = 0;
  }

  orderData.grandTotal = orderData.totalAmount + orderData.cgst + orderData.sgst + orderData.igst;
  orderData.tcsAmount = 0.09;
  orderData.finalTotal = orderData.grandTotal + orderData.tcsAmount;
  orderData.amountInWords = convertNumberToWords(Math.round(orderData.finalTotal));
}

// ==================== PDF GENERATION ====================

/**
 * Create the actual PDF document
 */
function createInvoicePDF(orderData) {
  // Create temporary Google Doc
  var doc = DocumentApp.create('Invoice_' + orderData.invoiceNo + '_' + new Date().getTime());
  var body = doc.getBody();

  body.clear();
  body.setMarginTop(20);
  body.setMarginBottom(20);
  body.setMarginLeft(20);
  body.setMarginRight(20);

  // Build invoice sections
  buildInvoiceHeader(body, orderData);
  body.appendParagraph('');

  buildInvoiceDetails(body, orderData);
  body.appendParagraph('');

  buildBuyerDetails(body, orderData);
  body.appendParagraph('');

  buildItemsTable(body, orderData);
  body.appendParagraph('');

  buildTotalsSection(body, orderData);
  body.appendParagraph('');

  buildBankDetails(body, orderData);
  body.appendParagraph('');

  buildFooter(body, orderData);

  // Save document
  doc.saveAndClose();

  // Convert to PDF
  var docFile = DriveApp.getFileById(doc.getId());
  var pdfBlob = docFile.getAs('application/pdf');
  pdfBlob.setName('Invoice_' + orderData.invoiceNo.replace(/\//g, '_') + '.pdf');

  // Save to output folder
  var folder;
  try {
    folder = DriveApp.getFolderById(CONFIG.OUTPUT_FOLDER_ID);
  } catch (e) {
    // Fallback: Create or find 'Invoices' folder in root
    var folders = DriveApp.getFoldersByName('Invoices');
    if (folders.hasNext()) {
      folder = folders.next();
    } else {
      folder = DriveApp.createFolder('Invoices');
    }
  }

  var pdfFile = folder.createFile(pdfBlob);

  // Delete temporary doc
  docFile.setTrashed(true);

  return pdfFile;
}

/**
 * Build invoice header with company details
 */
function buildInvoiceHeader(body, orderData) {
  var headerTable = body.appendTable();
  var row = headerTable.appendTableRow();

  // Left cell - Company info
  var leftCell = row.appendTableCell();

  // Add logo if available
  try {
    if (CONFIG.LOGO_FILE_ID && CONFIG.LOGO_FILE_ID !== 'YOUR_LOGO_FILE_ID') {
      var logoFile = DriveApp.getFileById(CONFIG.LOGO_FILE_ID);
      var logo = leftCell.appendImage(logoFile.getBlob());
      logo.setWidth(100);
      logo.setHeight(33);
    }
  } catch (e) {
    Logger.log('Logo not available: ' + e);
  }

  var companyName = leftCell.appendParagraph(CONFIG.COMPANY.name);
  companyName.setHeading(DocumentApp.ParagraphHeading.HEADING1);
  companyName.editAsText().setFontSize(14).setBold(true);

  leftCell.appendParagraph(CONFIG.COMPANY.address).editAsText().setFontSize(8);
  leftCell.appendParagraph(CONFIG.COMPANY.pincode).editAsText().setFontSize(8);
  leftCell.appendParagraph(CONFIG.COMPANY.phone).editAsText().setFontSize(8);
  leftCell.appendParagraph(CONFIG.COMPANY.website).editAsText().setFontSize(8);
  leftCell.appendParagraph(CONFIG.COMPANY.msme).editAsText().setFontSize(7);

  // Right cell - GST and title
  var rightCell = row.appendTableCell();
  rightCell.setVerticalAlignment(DocumentApp.VerticalAlignment.TOP);

  var gst = rightCell.appendParagraph(CONFIG.COMPANY.gst);
  gst.editAsText().setFontSize(9).setBold(true);
  gst.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);

  rightCell.appendParagraph('');

  var title = rightCell.appendParagraph('TAX INVOICE');
  title.editAsText().setFontSize(14).setBold(true);
  title.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);

  headerTable.setBorderWidth(1);
  headerTable.setBorderColor('#000000');
}

/**
 * Build invoice details section
 */
function buildInvoiceDetails(body, orderData) {
  var table = body.appendTable();
  var row = table.appendTableRow();

  var leftCell = row.appendTableCell();
  addLabelValue(leftCell, 'Invoice No.', orderData.invoiceNo, 9);
  addLabelValue(leftCell, 'Invoice Date', orderData.invoiceDate, 9);
  addLabelValue(leftCell, 'Is This Reverse Charge Invoice', orderData.reverseCharge, 9);

  var rightCell = row.appendTableCell();
  addLabelValue(rightCell, 'Transport', orderData.transport, 9);
  addLabelValue(rightCell, 'Vehicle No', orderData.vehicleNo, 9);
  addLabelValue(rightCell, 'LR No.', orderData.lrNo, 9);
  addLabelValue(rightCell, 'LR Date', orderData.lrDate, 9);

  table.setBorderWidth(1);
  table.setBorderColor('#000000');
}

/**
 * Build buyer details
 */
function buildBuyerDetails(body, orderData) {
  var table = body.appendTable();
  var row = table.appendTableRow();

  var leftCell = row.appendTableCell();
  leftCell.appendParagraph('Invoice To:').setBold(true).editAsText().setFontSize(9);
  leftCell.appendParagraph(orderData.buyerName).editAsText().setFontSize(9);
  leftCell.appendParagraph(orderData.buyerAddress).editAsText().setFontSize(9);
  leftCell.appendParagraph(orderData.buyerCity).editAsText().setFontSize(9);
  leftCell.appendParagraph('Pin Code: ' + orderData.buyerPincode).editAsText().setFontSize(9);
  addLabelValue(leftCell, 'Place', orderData.buyerPlace, 9);
  addLabelValue(leftCell, 'GST No', orderData.buyerGST, 9);
  addLabelValue(leftCell, 'State', orderData.buyerState, 9);

  var rightCell = row.appendTableCell();
  rightCell.appendParagraph('Ship To:').setBold(true).editAsText().setFontSize(9);
  rightCell.appendParagraph(orderData.buyerName).editAsText().setFontSize(9);
  rightCell.appendParagraph(orderData.buyerAddress).editAsText().setFontSize(9);
  rightCell.appendParagraph(orderData.buyerCity).editAsText().setFontSize(9);
  rightCell.appendParagraph('Pin Code: ' + orderData.buyerPincode).editAsText().setFontSize(9);

  table.setBorderWidth(1);
  table.setBorderColor('#000000');
}

/**
 * Build items table
 */
function buildItemsTable(body, orderData) {
  var itemsTable = body.appendTable();

  // Header
  var headerRow = itemsTable.appendTableRow();
  var headers = ['Sr.', 'Description', 'HSN', 'From/To', 'Pieces', 'Qty', 'UOM', 'Rate', 'Amount'];

  headers.forEach(function (h) {
    var cell = headerRow.appendTableCell(h);
    cell.setBackgroundColor('#CCCCCC');
    cell.getChild(0).asParagraph().editAsText().setFontSize(8).setBold(true);
    cell.getChild(0).asParagraph().setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  });

  headerRow.removeChild(headerRow.getCell(0));

  // Data rows
  var totalQty = 0;
  var totalPieces = 0;

  orderData.items.forEach(function (item) {
    var row = itemsTable.appendTableRow();
    row.appendTableCell(item.srNo.toString()).editAsText().setFontSize(8);
    row.appendTableCell(item.description).editAsText().setFontSize(8);
    row.appendTableCell(item.hsnCode).editAsText().setFontSize(8);
    row.appendTableCell(item.fromOrderNo + ' TO ' + item.toOrderNo).editAsText().setFontSize(8);
    row.appendTableCell(item.pieces.toString()).editAsText().setFontSize(8);
    row.appendTableCell(formatNumber(item.quantity, 2)).editAsText().setFontSize(8);
    row.appendTableCell(item.uom).editAsText().setFontSize(8);
    row.appendTableCell(formatNumber(item.rate, 2)).editAsText().setFontSize(8);
    row.appendTableCell(formatNumber(item.amount, 2)).editAsText().setFontSize(8);

    totalQty += item.quantity;
    totalPieces += item.pieces;
  });

  // Total row
  var totalRow = itemsTable.appendTableRow();
  totalRow.appendTableCell('').setBold(true);
  totalRow.appendTableCell('Total').setBold(true).editAsText().setFontSize(8);
  totalRow.appendTableCell('').setBold(true);
  totalRow.appendTableCell('').setBold(true);
  totalRow.appendTableCell(totalPieces.toString()).setBold(true).editAsText().setFontSize(8);
  totalRow.appendTableCell(formatNumber(totalQty, 1)).setBold(true).editAsText().setFontSize(8);
  totalRow.appendTableCell('').setBold(true);
  totalRow.appendTableCell('').setBold(true);
  totalRow.appendTableCell(formatNumber(orderData.totalAmount, 2)).setBold(true).editAsText().setFontSize(8);

  itemsTable.setBorderWidth(1);
  itemsTable.setBorderColor('#000000');
}

/**
 * Build totals with GST
 */
function buildTotalsSection(body, orderData) {
  var table = body.appendTable();
  var row = table.appendTableRow();

  var leftCell = row.appendTableCell();
  leftCell.appendParagraph('Additional Charges:').setBold(true).editAsText().setFontSize(8);
  leftCell.appendParagraph('Less Charges:').setBold(true).editAsText().setFontSize(8);

  var rightCell = row.appendTableCell();
  var taxTable = rightCell.appendTable();

  addTotalRow(taxTable, 'Add', '', 8);
  addTotalRow(taxTable, 'Less', '3,356.24', 8);
  addTotalRow(taxTable, 'Sub Total', formatNumber(orderData.totalAmount - 3356.24, 2), 8);

  if (orderData.gstType === 'IGST') {
    addTotalRow(taxTable, 'I. GST (5%)', formatNumber(orderData.igst, 2), 8);
  } else {
    addTotalRow(taxTable, 'C. GST (2.5%)', formatNumber(orderData.cgst, 2), 8);
    addTotalRow(taxTable, 'S. GST (2.5%)', formatNumber(orderData.sgst, 2), 8);
  }

  addTotalRow(taxTable, 'Total', formatNumber(orderData.grandTotal, 2), 8);
  addTotalRow(taxTable, 'TCS Amount', formatNumber(orderData.tcsAmount, 2), 8);
  addTotalRow(taxTable, 'R/O', '', 8);

  var grandRow = taxTable.appendTableRow();
  grandRow.appendTableCell('Grand Total').setBold(true).setBackgroundColor('#CCCCCC').editAsText().setFontSize(8);
  grandRow.appendTableCell(formatNumber(orderData.finalTotal, 2)).setBold(true).setBackgroundColor('#CCCCCC').editAsText().setFontSize(8);

  taxTable.setBorderWidth(1);

  table.setBorderWidth(1);
  table.setBorderColor('#000000');
}

/**
 * Build bank details
 */
function buildBankDetails(body, orderData) {
  var table = body.appendTable();

  table.appendTableRow().appendTableCell('Company\'s Bank Details:').setBold(true).editAsText().setFontSize(9);

  var detailsRow = table.appendTableRow();
  var cell = detailsRow.appendTableCell();
  addLabelValue(cell, 'Bank Name', CONFIG.BANK.name, 8);
  addLabelValue(cell, 'A/c No', CONFIG.BANK.accountNo, 8);
  addLabelValue(cell, 'Branch & IFSC Code', CONFIG.BANK.ifsc, 8);

  var amountRow = table.appendTableRow();
  addLabelValue(amountRow.appendTableCell(), 'Amount Chargeable (in words)',
    'INR ' + orderData.amountInWords + ' only', 8);

  table.setBorderWidth(1);
  table.setBorderColor('#000000');
}

/**
 * Build footer
 */
function buildFooter(body, orderData) {
  var table = body.appendTable();

  table.appendTableRow().appendTableCell('Terms and Condition:').setBold(true).editAsText().setFontSize(9);

  var termsRow = table.appendTableRow();
  termsRow.appendTableCell('THE ORIENTAL INSURANCE COMPANY LIMITED - 162002/31/2025/42').editAsText().setFontSize(7);

  var sigRow = table.appendTableRow();
  var sigCell = sigRow.appendTableCell();
  sigCell.appendParagraph('');
  sigCell.appendParagraph('');
  var sig = sigCell.appendParagraph('For ' + CONFIG.COMPANY.name);
  sig.setBold(true).editAsText().setFontSize(9);
  sig.setAlignment(DocumentApp.HorizontalAlignment.RIGHT);
  sigCell.appendParagraph('');
  sigCell.appendParagraph('Authorised Signatory').setAlignment(DocumentApp.HorizontalAlignment.RIGHT).editAsText().setFontSize(9);

  table.setBorderWidth(1);
  table.setBorderColor('#000000');
}

// ==================== HELPER FUNCTIONS ====================

function addLabelValue(cell, label, value, fontSize) {
  fontSize = fontSize || 10;
  var para = cell.appendParagraph('');
  var text = para.editAsText();
  if (label) {
    text.appendText(label + ': ').setFontSize(fontSize).setBold(true);
  }
  text.appendText(value || '').setFontSize(fontSize);
}

function addTotalRow(table, label, value, fontSize) {
  var row = table.appendTableRow();
  row.appendTableCell(label).editAsText().setFontSize(fontSize || 9);
  row.appendTableCell(value).editAsText().setFontSize(fontSize || 9);
}

function formatNumber(num, decimals) {
  if (!num) return '0.00';
  var parts = num.toFixed(decimals).toString().split('.');
  var intPart = parts[0];
  var decPart = parts[1];
  var lastThree = intPart.substring(intPart.length - 3);
  var otherNumbers = intPart.substring(0, intPart.length - 3);
  if (otherNumbers != '') lastThree = ',' + lastThree;
  return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree + (decimals > 0 ? '.' + decPart : '');
}

function formatDate(date) {
  if (!date) return '';
  if (typeof date === 'string') return date;
  var d = new Date(date);
  return ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();
}

function convertNumberToWords(num) {
  if (num === 0) return 'Zero';
  var ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  var tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  var teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  function convert(n) {
    if (n === 0) return '';
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convert(n % 100) : '');
  }

  if (num < 1000) return convert(num);
  if (num < 100000) return convert(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + convert(num % 1000) : '');
  if (num < 10000000) return convert(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 !== 0 ? ' ' + convertNumberToWords(num % 100000) : '');
  return convert(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 !== 0 ? ' ' + convertNumberToWords(num % 10000000) : '');
}

function openPDFFolder() {
  try {
    var folder = DriveApp.getFolderById(CONFIG.OUTPUT_FOLDER_ID);
    var html = '<script>window.open("' + folder.getUrl() + '", "_blank");</script>';
    SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html), 'Opening folder...');
  } catch (e) {
    SpreadsheetApp.getUi().alert('Please configure OUTPUT_FOLDER_ID first!');
  }
}

// ==================== WEB APP HANDLERS ====================

/**
 * Generate PDF for a specific IO/SO Number (called from Web App)
 */
function generateOrderPDF(soNumber, sessionId) {
  try {
    // Validate session
    const session = getSessionData(sessionId);
    if (!session) {
      return { success: false, message: 'Session expired' };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Complete_Orders'); // explicit sheet
    if (!sheet) return { success: false, message: 'Complete_Orders sheet not found' };

    // Find row by SO Number
    const row = findOrderRow(sheet, soNumber);
    if (row === -1) {
      return { success: false, message: 'Order not found: ' + soNumber };
    }

    // Set as active sheet so getOrderData works (as it uses getActiveSheet)
    ss.setActiveSheet(sheet);

    // Get Data
    const orderData = getOrderData(row);
    if (!orderData || !orderData.invoiceNo) {
      return { success: false, message: 'Invalid order data' };
    }

    // Generate PDF
    const pdfFile = createInvoicePDF(orderData);

    // Log
    logPDFGeneration(orderData.invoiceNo, pdfFile.getId(), pdfFile.getUrl());

    return {
      success: true,
      url: pdfFile.getUrl(),
      fileId: pdfFile.getId()
    };

  } catch (error) {
    Logger.log('generateOrderPDF error: ' + error);
    return { success: false, message: error.toString() };
  }
}

/**
 * Email PDF for a specific Order (called from Web App)
 */
function emailOrderPDF(soNumber, email, sessionId) {
  try {
    // Validate session
    const session = getSessionData(sessionId);
    if (!session) {
      return { success: false, message: 'Session expired' };
    }

    if (!email || !email.includes('@')) {
      return { success: false, message: 'Invalid email address' };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName('Complete_Orders');
    if (!sheet) return { success: false, message: 'Complete_Orders sheet not found' };

    const row = findOrderRow(sheet, soNumber);
    if (row === -1) {
      return { success: false, message: 'Order not found: ' + soNumber };
    }

    ss.setActiveSheet(sheet);
    const orderData = getOrderData(row);
    const pdfFile = createInvoicePDF(orderData);

    // Send Email
    MailApp.sendEmail({
      to: email,
      subject: 'Tax Invoice - ' + orderData.invoiceNo + ' - Ramratan Techno Weave',
      body: 'Dear Customer,\n\n' +
        'Please find attached your tax invoice.\n\n' +
        'Invoice No: ' + orderData.invoiceNo + '\n' +
        'Invoice Date: ' + orderData.invoiceDate + '\n' +
        'Amount: ₹ ' + formatNumber(orderData.finalTotal, 2) + '\n\n' +
        'Thank you for your business!\n\n' +
        'Best regards,\n' +
        'Ramratan Techno Weave',
      attachments: [pdfFile.getAs(MimeType.PDF)]
    });

    logPDFGeneration(orderData.invoiceNo, pdfFile.getId(), pdfFile.getUrl());

    return { success: true, message: 'Email sent successfully' };

  } catch (error) {
    Logger.log('emailOrderPDF error: ' + error);
    return { success: false, message: error.toString() };
  }
}

/**
 * Helper: Find row index by SO Number
 */
function findOrderRow(sheet, soNumber) {
  const data = sheet.getDataRange().getValues();
  // Assume SO Number is in first column (index 0) or check where it is
  // complete orders usually has SO Number in column A (index 0)
  const search = String(soNumber).trim().toUpperCase();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim().toUpperCase() === search) {
      return i + 1; // 1-based index
    }
  }
  return -1;
}

function logPDFGeneration(invoiceNo, fileId, fileUrl) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var logSheet = ss.getSheetByName('PDF Log');

    if (!logSheet) {
      logSheet = ss.insertSheet('PDF Log');
      logSheet.appendRow(['Timestamp', 'Invoice No', 'File ID', 'URL', 'Generated By']);
    }

    // Check if session exists (for web app) or use ActiveUser (for sheet)
    let userEmail = 'Unknown';
    try {
      userEmail = Session.getActiveUser().getEmail();
    } catch (e) { }

    logSheet.appendRow([
      new Date(),
      invoiceNo,
      fileId,
      fileUrl,
      userEmail
    ]);
  } catch (e) {
    Logger.log('Could not log PDF generation: ' + e);
  }
}
