/**
 * ============================================
 * AUTHENTICATION UTILITIES - RTWE ERP
 * JWT-based session management
 * ============================================
 */

/**
 * Check if user is authenticated and redirect to login if not
 * @param {boolean} autoRedirect - Automatically redirect to login if not authenticated
 * @returns {Promise<object|null>} User object if authenticated, null otherwise
 */
async function checkAuth(autoRedirect = true) {
    const authToken = localStorage.getItem('authToken');

    if (!authToken) {
        if (autoRedirect) {
            window.location.href = '/Login.html';
        }
        return null;
    }

    try {
        const response = await fetch('/api/auth/check-session', {
            method: 'GET',
            credentials: 'include',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        const result = await response.json();

        if (result.success && result.user) {
            return result.user;
        } else {
            // Session invalid, clear and redirect
            if (autoRedirect) {
                clearAuthData();
                window.location.href = '/Login.html';
            }
            return null;
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        if (autoRedirect) {
            clearAuthData();
            window.location.href = '/Login.html';
        }
        return null;
    }
}

/**
 * Clear all authentication data from localStorage
 */
function clearAuthData() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('sessionId');
}

/**
 * Get the current authenticated user from localStorage
 * @returns {object|null} User object or null
 */
function getCurrentUser() {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) return null;

    return {
        id: localStorage.getItem('userId'),
        name: localStorage.getItem('userName'),
        email: localStorage.getItem('userEmail'),
        role: localStorage.getItem('userRole'),
        token: authToken
    };
}

/**
 * Make an authenticated API request with JWT token
 * @param {string} url - API endpoint URL
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
async function authenticatedFetch(url, options = {}) {
    const authToken = localStorage.getItem('authToken');

    if (!authToken) {
        throw new Error('No authentication token found');
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
        ...options.headers
    };

    return fetch(url, {
        ...options,
        credentials: 'include',
        headers
    });
}

/**
 * Check if user has a specific role
 * @param {string|array} allowedRoles - Role(s) to check against
 * @returns {boolean}
 */
function hasRole(allowedRoles) {
    const userRole = localStorage.getItem('userRole');
    if (!userRole) return false;

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    return roles.includes(userRole);
}

/**
 * Logout the current user
 */
async function logout() {
    try {
        const authToken = localStorage.getItem('authToken');

        if (authToken) {
            await fetch('/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });
        }
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        clearAuthData();
        window.location.href = '/Login.html';
    }
}

console.log('✅ Auth utilities loaded');
