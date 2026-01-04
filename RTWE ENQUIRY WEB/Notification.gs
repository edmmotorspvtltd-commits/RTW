// ============================================
// NOTIFICATIONS
// Auto-organized from original code
// ============================================

function sendOrderConfirmationNotifications(formData) {
  Logger.log('📱 Sending notifications for: ' + formData.rtweNo);
  
  // Build design details string
  let designDetails = '';
  const designs = [
    {design: formData.design1, taga: formData.taga1},
    {design: formData.design2, taga: formData.taga2},
    {design: formData.design3, taga: formData.taga3},
    {design: formData.design4, taga: formData.taga4},
    {design: formData.design5, taga: formData.taga5},
    {design: formData.design6, taga: formData.taga6}
  ];
  
  designs.forEach((d, i) => {
    if (d.design && d.taga) {
      designDetails += '\n• ' + d.design + ': ' + d.taga + ' TAGA';
    }
  });
  
  const deliveryDateFormatted = formData.deliveryDate ? 
    Utilities.formatDate(new Date(formData.deliveryDate), Session.getScriptTimeZone(), 'dd-MMM-yyyy') : 
    'Not set';
  
  // WhatsApp message
  const whatsappMessage = 
    '🎉 *New Order Confirmed*\n\n' +
    'RTWE No: ' + formData.rtweNo + '\n' +
    'Quality: ' + formData.quality + '\n' +
    'Broker: ' + formData.broker + '\n' +
    'Total MTR: ' + (formData.totalMTR || 'N/A') + '\n\n' +
    '*Design & TAGA:*' + designDetails + '\n\n' +
    'Payment Terms: ' + (formData.paymentTerms || 'N/A') + '\n' +
    'Delivery Date: ' + deliveryDateFormatted + '\n\n' +
    '_RTW - Ramratan Techno Weave_';
  
  // Send to all active WhatsApp recipients
  sendWhatsAppToRecipients(whatsappMessage, formData.rtweNo);
  
  // Send Telegram notification
  sendTelegramNotification(formData, designDetails, deliveryDateFormatted);
  
  Logger.log('✅ Notifications sent');
}