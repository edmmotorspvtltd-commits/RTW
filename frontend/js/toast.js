/* ============================================
   MODERN TOAST NOTIFICATIONS - RTWE ERP
   Shared toast JavaScript for all pages
   ============================================ */

/**
 * Show a modern toast notification
 * @param {string} message - The message to display
 * @param {string} type - Toast type: 'success', 'error', 'warning', 'info'
 */
function showToast(message, type = 'success') {
    // Remove existing toast if any
    const existingToast = document.getElementById('modernToast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.id = 'modernToast';
    toast.className = 'modern-toast ' + type;

    // Determine icon based on type
    let icon = '✓';
    let title = 'Success';

    switch (type) {
        case 'success':
            icon = '✓';
            title = 'Success';
            break;
        case 'error':
            icon = '✕';
            title = 'Error';
            break;
        case 'warning':
            icon = '⚠';
            title = 'Warning';
            break;
        case 'info':
            icon = 'ℹ';
            title = 'Info';
            break;
    }

    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

    document.body.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto remove after 4 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

/**
 * Show success toast (green)
 * @param {string} message - The message to display
 */
function showSuccessToast(message) {
    showToast(message, 'success');
}

/**
 * Show error toast (red)
 * @param {string} message - The message to display
 */
function showErrorToast(message) {
    showToast(message, 'error');
}

/**
 * Show warning toast (orange)
 * @param {string} message - The message to display  
 */
function showWarningToast(message) {
    showToast(message, 'warning');
}

/**
 * Show info toast (brown - RTWE theme)
 * @param {string} message - The message to display
 */
function showInfoToast(message) {
    showToast(message, 'info');
}
