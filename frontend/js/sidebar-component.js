// ================================================================
// RTWE ERP - REUSABLE SIDEBAR COMPONENT
// Use this in any new page for consistent navigation
// ================================================================

// Initialize sidebar on page load
document.addEventListener('DOMContentLoaded', function () {
    initializeSidebar();
});

// ================================================================
// SIDEBAR INITIALIZATION
// ================================================================
function initializeSidebar() {
    loadUserInfo();
    setupSidebarEventListeners();
}

// ================================================================
// TOGGLE SUBMENU (Collapsible Menus)
// ================================================================
function toggleSubmenu(submenuId, element) {
    const submenu = document.getElementById(submenuId);
    const arrow = element.querySelector('.category-arrow');

    if (!submenu) return;

    if (submenu.style.display === 'block') {
        submenu.style.display = 'none';
        if (arrow) arrow.style.transform = 'rotate(0deg)';
    } else {
        submenu.style.display = 'block';
        if (arrow) arrow.style.transform = 'rotate(90deg)';
    }
}

// ================================================================
// TOGGLE SIDEBAR (Mobile Menu)
// ================================================================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('show');
}

// ================================================================
// HANDLE LOGOUT
// ================================================================
function handleLogout() {
    if (confirm('Are you sure you want to logout?')) {
        // Show loading if available
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) loadingOverlay.style.display = 'flex';

        fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        })
            .then(() => {
                // Clear all storage
                localStorage.clear();
                sessionStorage.clear();

                // Redirect to login
                window.location.href = '/Login.html';
            })
            .catch((error) => {
                console.error('Logout error:', error);

                // Force logout even on error
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = '/Login.html';
            });
    }
}

// ================================================================
// LOAD USER INFO
// ================================================================
function loadUserInfo() {
    // Get authToken from localStorage
    const authToken = localStorage.getItem('authToken');

    if (!authToken) {
        console.warn('No auth token found, redirecting to login');
        window.location.href = '/Login.html';
        return;
    }

    fetch('/api/auth/check-session', {
        credentials: 'include',
        headers: {
            'Authorization': `Bearer ${authToken}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success && data.user) {
                const userName = data.user.fullName || data.user.userName || data.user.user_name || 'User';
                const userRole = data.user.role || 'user';

                // Update user name
                const userNameEl = document.getElementById('userName');
                if (userNameEl) userNameEl.textContent = userName;

                // Update user role
                const userRoleEl = document.getElementById('userRole');
                if (userRoleEl) userRoleEl.textContent = userRole.toUpperCase();

                // Generate and set avatar initials
                const initials = userName.split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase()
                    .substring(0, 2);

                const userAvatarEl = document.getElementById('userAvatar');
                if (userAvatarEl) userAvatarEl.textContent = initials;

                // Show admin menu if user is admin
                if (userRole === 'admin' || userRole === 'super_admin') {
                    const adminMenu = document.getElementById('adminMenu');
                    if (adminMenu) adminMenu.style.display = 'block';
                }
            } else {
                // Session expired or invalid
                console.warn('Session check failed:', data);
                localStorage.clear();
                window.location.href = '/Login.html';
            }
        })
        .catch(error => {
            console.error('Failed to load user info:', error);
            localStorage.clear();
            window.location.href = '/Login.html';
        });
}

// ================================================================
// SETUP EVENT LISTENERS
// ================================================================
function setupSidebarEventListeners() {
    // Mobile menu button (if exists)
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleSidebar);
    }

    // Sidebar overlay (if exists)
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', toggleSidebar);
    }
}

// ================================================================
// HIGHLIGHT ACTIVE PAGE
// ================================================================
function highlightActivePage() {
    const currentPage = window.location.pathname.split('/').pop();
    const menuItems = document.querySelectorAll('.sidebar .menu-item');

    menuItems.forEach(item => {
        const href = item.getAttribute('href');
        if (href && href.includes(currentPage)) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Call on page load
document.addEventListener('DOMContentLoaded', highlightActivePage);

// ================================================================
// EXPORT FOR EXTERNAL USE (if using modules)
// ================================================================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        toggleSubmenu,
        toggleSidebar,
        handleLogout,
        loadUserInfo,
        highlightActivePage
    };
}

console.log('✅ Sidebar component loaded');
