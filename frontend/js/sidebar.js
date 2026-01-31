/* ============================================
   SIDEBAR COMPONENT - RTWE ERP
   Shared sidebar JavaScript for all pages
   ============================================ */

// ============================================
// GLOBAL AUTHENTICATION CHECK
// ============================================
// Hide content and redirect to login if not authenticated
// Using DOMContentLoaded to ensure localStorage is synced after redirect
document.addEventListener('DOMContentLoaded', function checkAuthentication() {
    // Skip auth check for login page (case-insensitive)
    const currentPath = window.location.pathname.toLowerCase();
    const currentHref = window.location.href.toLowerCase();

    if (currentPath.includes('login.html') || currentHref.includes('login.html') ||
        currentPath === '/login.html' || currentPath === '/login') {
        document.documentElement.style.visibility = 'visible';
        return;
    }

    // Check for JWT token
    const token = localStorage.getItem('authToken'); // Match Login.html key
    if (!token) {
        console.warn('No authentication token found. Redirecting to login...');
        window.location.replace('/Login.html'); // Use replace to avoid back button
        return;
    }

    // Token exists, show the page
    document.documentElement.style.visibility = 'visible';
});

/**
 * Sidebar Menu Configuration
 * Edit this to update menu on ALL pages
 */
const SIDEBAR_MENU = {
    brand: {
        logo: '🏭',
        name: 'RTWE ERP',
        subtitle: 'Textile Management'
    },
    sections: [
        {
            title: 'Main Menu',
            items: [
                { icon: '📊', label: 'Dashboard', href: 'dashboard.html' }
            ]
        },
        {
            title: 'Master Data',
            collapsible: true,
            id: 'masterSubmenu',
            icon: '📦',
            items: [
                // ⭐ PINNED AT TOP - ADD-ON SYSTEMS ⭐
                { icon: '🏢', label: 'Companies', href: 'companies.html' },
                { icon: '👥', label: 'User Management', href: 'user-management-enhanced.html' },
                { icon: '📊', label: 'Costing Management', href: 'costing-management.html' },
                // Divider marker - will be rendered as a line
                { divider: true },
                // Existing Items
                { icon: '👤', label: 'Agent', href: 'agents.html' },
                { icon: '🏢', label: 'Consignee', href: 'consignees.html' },
                { icon: '🛍️', label: 'Domestic Buyer', href: 'domestic-buyers.html' },
                { icon: '📍', label: 'Godown Location', href: 'godown.html' },
                { icon: '🛡️', label: 'Insurance', href: 'insurance.html' },
                { icon: '💳', label: 'Payment Terms', href: 'payment-terms.html' },
                { icon: '💵', label: 'Rate Master', href: 'rate-master.html' },
                { icon: '🎯', label: 'Sale Order Target', href: 'sales-target.html' },
                { icon: '🧵', label: 'Selvedge Master', href: 'selvedge.html' },
                { icon: '🔍', label: 'Sourcing By', href: 'sourcing-by.html' },
                { icon: '📦', label: 'Stock Type', href: 'stock-types.html' },
                { icon: '📜', label: 'Terms & Condition', href: 'terms-conditions.html' },
                { icon: '🚚', label: 'Transportation', href: 'transportation.html' },
                { icon: '🏭', label: 'Vendor', href: 'vendors.html' },
                { icon: '📁', label: 'Vendor Group', href: 'vendor-groups.html' },
                { icon: '🏷️', label: 'Vendor Prefix', href: 'vendor-prefix.html' },
                { icon: '🧶', label: 'Yarn Adjust Entry', href: 'yarn-adjust.html' }
            ]
        },
        {
            title: 'Orders',
            items: [
                { icon: '📝', label: 'Enquiries', href: '#', badge: '' },
                { icon: '🛒', label: 'Sale Orders', href: '#' },
                { icon: '📦', label: 'Sort Master', href: '#' }
            ]
        },
        {
            title: 'Attendance',
            collapsible: true,
            id: 'attendanceSubmenu',
            icon: '🕒',
            items: [
                { icon: '🕒', label: 'Live Dashboard', href: 'attendance-dashboard.html' },
                { icon: '👥', label: 'Employees', href: 'attendance-employees.html' },
                { icon: '📋', label: 'Attendance Logs', href: 'attendance-logs.html' },
                { icon: '⏰', label: 'Shift Management', href: 'attendance-shifts.html' },
                { icon: '🏖️', label: 'Leave Management', href: 'attendance-leaves.html' },
                { icon: '📡', label: 'Devices', href: 'attendance-devices.html' },
                { icon: '💰', label: 'Salary & Payroll', href: 'salary-management.html' }
            ]
        },
        {
            title: 'Reports',
            items: [
                { icon: '📈', label: 'Analytics', href: '#' },
                { icon: '📋', label: 'Order Reports', href: '#' },
                { icon: '💰', label: 'Financial', href: '#' }
            ]
        },
        {
            title: 'Administration',
            adminOnly: true,
            items: [
                { icon: '👥', label: 'User Management', href: 'Usermanagement.html' },
                { icon: '📜', label: 'Audit Logs', href: '#' },
                { icon: '⚙️', label: 'Settings', href: '#' }
            ]
        }
    ]
};

/**
 * Initialize the sidebar
 * Call this function on page load
 */
function initSidebar(activePage) {
    const container = document.getElementById('sidebarContainer');
    if (!container) {
        console.warn('Sidebar container not found. Add <div id="sidebarContainer"></div> to your page.');
        return;
    }

    const currentPage = activePage || getCurrentPage();
    const userRole = localStorage.getItem('userRole') || 'user';
    const userName = localStorage.getItem('userName') || 'User';
    const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    let html = `
        <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>
        <nav class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <span class="sidebar-logo">${SIDEBAR_MENU.brand.logo}</span>
                <div class="sidebar-brand">
                    ${SIDEBAR_MENU.brand.name}
                    <small>${SIDEBAR_MENU.brand.subtitle}</small>
                </div>
            </div>
            <div class="sidebar-menu">
    `;

    SIDEBAR_MENU.sections.forEach(section => {
        // Skip admin sections for non-admin users
        if (section.adminOnly && userRole !== 'admin') return;

        html += `<div class="menu-section"${section.adminOnly ? ' id="adminMenu"' : ''}>`;

        if (section.collapsible) {
            // Collapsible menu category
            html += `
                <div class="menu-category" onclick="toggleSubmenu('${section.id}', this)">
                    <div class="category-left">
                        <span class="category-icon">${section.icon || '�'}</span>
                        <span>${section.title}</span>
                    </div>
                    <span class="category-arrow">▶</span>
                </div>
                <div class="submenu" id="${section.id}">
            `;
            section.items.forEach(item => {
                // Handle divider items
                if (item.divider) {
                    html += `<div style="border-top: 1px solid rgba(255,255,255,0.1); margin: 8px 20px;"></div>`;
                    return;
                }
                const isActive = isActivePage(item.href, currentPage);
                html += `<a href="${item.href}" class="menu-item${isActive ? ' active' : ''}">
                    <span class="icon">${item.icon}</span>${item.label}
                </a>`;
            });
            html += `</div>`;
        } else {
            // Regular section
            html += `<div class="menu-section-title">${section.title}</div>`;
            section.items.forEach(item => {
                const isActive = isActivePage(item.href, currentPage);
                const badge = item.badge ? `<span class="badge">${item.badge}</span>` : '';
                html += `<a href="${item.href}" class="menu-item${isActive ? ' active' : ''}">
                    <span class="icon">${item.icon}</span>${item.label}${badge}
                </a>`;
            });
        }

        html += `</div>`;
    });

    html += `
            </div>
            <div class="sidebar-footer">
                <div class="user-profile">
                    <div class="user-avatar" id="userAvatar">${initials}</div>
                    <div class="user-info">
                        <div class="user-name" id="userName">${userName}</div>
                        <div class="user-role" id="userRole">${userRole.toUpperCase()}</div>
                    </div>
                    <button class="btn-logout" onclick="handleLogout()" title="Logout">🚪</button>
                </div>
            </div>
        </nav>
    `;

    container.innerHTML = html;

    // Auto-expand submenu if current page is inside it
    expandActiveSubmenu(currentPage);
}

/**
 * Get current page filename
 */
function getCurrentPage() {
    const path = window.location.pathname;
    return path.substring(path.lastIndexOf('/') + 1) || 'dashboard.html';
}

/**
 * Check if the given href matches current page
 */
function isActivePage(href, currentPage) {
    if (!href || href === '#') return false;
    const hrefPage = href.substring(href.lastIndexOf('/') + 1);
    return hrefPage === currentPage;
}

/**
 * Auto-expand submenu containing active page
 */
function expandActiveSubmenu(currentPage) {
    SIDEBAR_MENU.sections.forEach(section => {
        if (section.collapsible) {
            const hasActivePage = section.items.some(item => isActivePage(item.href, currentPage));
            if (hasActivePage) {
                const submenu = document.getElementById(section.id);
                const category = submenu?.previousElementSibling;
                if (submenu) submenu.classList.add('expanded');
                if (category) category.classList.add('expanded');
            }
        }
    });
}

/**
 * Toggle collapsible submenu
 */
function toggleSubmenu(submenuId, categoryElement) {
    const submenu = document.getElementById(submenuId);
    if (submenu) {
        submenu.classList.toggle('expanded');
        categoryElement.classList.toggle('expanded');
    }
}

/**
 * Toggle mobile sidebar
 */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('show');

    document.body.style.overflow = sidebar?.classList.contains('open') ? 'hidden' : '';
}

/**
 * Handle logout with confirmation popup
 */
function handleLogout() {
    // Show confirmation popup
    showLogoutConfirmation();
}

/**
 * Show logout confirmation modal
 */
function showLogoutConfirmation() {
    // Check if modal already exists
    let modal = document.getElementById('logoutConfirmModal');

    if (!modal) {
        // Create modal HTML
        modal = document.createElement('div');
        modal.id = 'logoutConfirmModal';
        modal.innerHTML = `
            <div class="logout-modal-overlay" onclick="closeLogoutModal()">
                <div class="logout-modal-content" onclick="event.stopPropagation()">
                    <div class="logout-modal-icon">🚪</div>
                    <h3>Confirm Logout</h3>
                    <p>Are you sure you want to logout from RTWE ERP?</p>
                    <div class="logout-modal-buttons">
                        <button class="btn-stay" onclick="closeLogoutModal()">Stay Logged In</button>
                        <button class="btn-logout-confirm" onclick="confirmLogout()">Yes, Logout</button>
                    </div>
                </div>
            </div>
            <style>
                .logout-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.6);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10001;
                    animation: fadeIn 0.2s ease;
                }
                .logout-modal-content {
                    background: white;
                    padding: 35px 40px;
                    border-radius: 16px;
                    text-align: center;
                    max-width: 380px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                    animation: slideUp 0.3s ease;
                }
                .logout-modal-icon {
                    font-size: 48px;
                    margin-bottom: 15px;
                }
                .logout-modal-content h3 {
                    color: #3E2723;
                    margin-bottom: 10px;
                    font-size: 22px;
                }
                .logout-modal-content p {
                    color: #666;
                    margin-bottom: 25px;
                    font-size: 15px;
                }
                .logout-modal-buttons {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                }
                .logout-modal-buttons button {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .btn-stay {
                    background: #f0f0f0;
                    color: #333;
                }
                .btn-stay:hover {
                    background: #e0e0e0;
                }
                .btn-logout-confirm {
                    background: #d32f2f;
                    color: white;
                }
                .btn-logout-confirm:hover {
                    background: #b71c1c;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(30px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            </style>
        `;
        document.body.appendChild(modal);
    }

    modal.style.display = 'block';
}

/**
 * Close logout confirmation modal
 */
function closeLogoutModal() {
    const modal = document.getElementById('logoutConfirmModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

/**
 * Confirm and perform logout
 */
function confirmLogout() {
    // Close modal and show loading
    closeLogoutModal();

    const logoutOverlay = document.getElementById('logoutOverlay');
    if (logoutOverlay) logoutOverlay.classList.add('show');

    fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
    })
        .then(() => {
            localStorage.removeItem('userId');
            localStorage.removeItem('userName');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userRole');
            localStorage.removeItem('sessionId');
            window.location.href = '/Login.html';
        })
        .catch(() => {
            localStorage.clear();
            window.location.href = '/Login.html';
        });
}

/**
 * Update user display in sidebar (call after session check)
 */
function updateSidebarUser(user) {
    const name = user?.userName || localStorage.getItem('userName') || 'User';
    const role = user?.role || localStorage.getItem('userRole') || 'user';
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const nameEl = document.getElementById('userName');
    const roleEl = document.getElementById('userRole');
    const avatarEl = document.getElementById('userAvatar');
    const adminMenu = document.getElementById('adminMenu');

    if (nameEl) nameEl.textContent = name;
    if (roleEl) roleEl.textContent = role.toUpperCase();
    if (avatarEl) avatarEl.textContent = initials;
    if (adminMenu && role === 'admin') adminMenu.style.display = 'block';
}

// Close sidebar on menu item click (mobile)
document.addEventListener('click', function (e) {
    if (e.target.closest('.menu-item') && window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        if (sidebar?.classList.contains('open')) {
            sidebar.classList.remove('open');
            overlay?.classList.remove('show');
            document.body.style.overflow = '';
        }
    }
});

// Handle window resize
window.addEventListener('resize', function () {
    if (window.innerWidth > 768) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        sidebar?.classList.remove('open');
        overlay?.classList.remove('show');
        document.body.style.overflow = '';
    }
});
