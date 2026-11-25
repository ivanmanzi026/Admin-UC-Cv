/**
 * ProCV Admin - Authentication Module
 * Uses Firebase Authentication for secure admin access
 */

console.log('🔐 Auth module loading...');

// ============================================================
// 1. AUTH STATE
// ============================================================

let currentUser = null;
let authStateListener = null;

// ============================================================
// 2. CHECK AUTH STATUS
// ============================================================

function checkAuth() {
    return new Promise((resolve) => {
        // Check if Firebase is available
        if (typeof firebase === 'undefined') {
            console.warn('⚠️ Firebase not loaded, using mock auth');
            resolve(checkMockAuth());
            return;
        }

        try {
            const auth = firebase.auth();
            
            // Check if already authenticated
            if (auth.currentUser) {
                currentUser = auth.currentUser;
                updateUIForUser(currentUser);
                resolve(true);
                return;
            }

            // Listen for auth state changes
            if (authStateListener) {
                authStateListener();
            }

            authStateListener = auth.onAuthStateChanged((user) => {
                if (user) {
                    currentUser = user;
                    updateUIForUser(user);
                    resolve(true);
                } else {
                    currentUser = null;
                    resolve(false);
                }
            });
        } catch (error) {
            console.error('❌ Auth check error:', error);
            resolve(checkMockAuth());
        }
    });
}

// ============================================================
// 3. MOCK AUTH (Fallback for testing)
// ============================================================

const MOCK_ADMIN = {
    email: 'admin@procv.com',
    password: 'admin123',
    name: 'Admin',
    role: 'Super Admin'
};

function checkMockAuth() {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
    if (isLoggedIn) {
        currentUser = {
            email: MOCK_ADMIN.email,
            displayName: MOCK_ADMIN.name,
            uid: 'mock_user_123'
        };
        updateUIForUser(currentUser);
    }
    return isLoggedIn;
}

// ============================================================
// 4. LOGIN HANDLER
// ============================================================

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('adminEmail')?.value;
    const password = document.getElementById('adminPassword')?.value;
    const errorDiv = document.getElementById('loginError');
    const errorMessage = document.getElementById('errorMessage');
    const loginBtn = document.getElementById('loginBtn');
    
    if (!email || !password) {
        showLoginError('Please enter email and password');
        return;
    }
    
    // Show loading state
    if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
    }
    
    try {
        // Try Firebase Auth first
        if (typeof firebase !== 'undefined' && firebase.auth) {
            const auth = firebase.auth();
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Check if user is admin
            const isAdmin = await checkIfAdmin(user);
            if (!isAdmin) {
                await auth.signOut();
                showLoginError('Access denied. Admin privileges required.');
                resetLoginButton(loginBtn);
                return;
            }
            
            currentUser = user;
            sessionStorage.setItem('adminLoggedIn', 'true');
            sessionStorage.setItem('adminName', user.displayName || 'Admin');
            sessionStorage.setItem('adminEmail', user.email);
            sessionStorage.setItem('adminUid', user.uid);
            
            window.location.href = 'dashboard.html';
        } else {
            // Fallback to mock auth
            if (email === MOCK_ADMIN.email && password === MOCK_ADMIN.password) {
                sessionStorage.setItem('adminLoggedIn', 'true');
                sessionStorage.setItem('adminName', MOCK_ADMIN.name);
                sessionStorage.setItem('adminRole', MOCK_ADMIN.role);
                window.location.href = 'dashboard.html';
            } else {
                showLoginError('Invalid email or password');
                resetLoginButton(loginBtn);
            }
        }
    } catch (error) {
        console.error('Login error:', error);
        let errorMsg = 'Invalid email or password';
        if (error.code === 'auth/user-not-found') {
            errorMsg = 'User not found';
        } else if (error.code === 'auth/wrong-password') {
            errorMsg = 'Incorrect password';
        } else if (error.code === 'auth/too-many-requests') {
            errorMsg = 'Too many failed attempts. Please try again later.';
        } else if (error.code === 'auth/invalid-email') {
            errorMsg = 'Invalid email format';
        }
        showLoginError(errorMsg);
        resetLoginButton(loginBtn);
    }
}

// ============================================================
// 5. CHECK ADMIN STATUS
// ============================================================

async function checkIfAdmin(user) {
    try {
        // Method 1: Check custom claims (if set)
        const idTokenResult = await user.getIdTokenResult();
        if (idTokenResult.claims && idTokenResult.claims.admin === true) {
            return true;
        }
        
        // Method 2: Check admin collection in Firestore
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            const db = firebase.firestore();
            const adminDoc = await db.collection('admin').doc(user.uid).get();
            if (adminDoc.exists && adminDoc.data().role === 'admin') {
                return true;
            }
            
            // Also check if admin@yourcv.com is the email
            if (user.email === 'ivanmanzi@yourcv.com' || user.email === 'admin@yourcv.com') {
                // Create admin document if it doesn't exist
                await db.collection('admin').doc(user.uid).set({
                    role: 'admin',
                    email: user.email,
                    name: user.displayName || 'Admin',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                return true;
            }
        }
        
        return false;
    } catch (error) {
        console.error('Error checking admin status:', error);
        return false;
    }
}

// ============================================================
// 6. LOGOUT
// ============================================================

async function handleLogout() {
    if (!confirm('Are you sure you want to logout?')) return;
    
    try {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            await firebase.auth().signOut();
        }
        
        sessionStorage.removeItem('adminLoggedIn');
        sessionStorage.removeItem('adminName');
        sessionStorage.removeItem('adminEmail');
        sessionStorage.removeItem('adminRole');
        sessionStorage.removeItem('adminUid');
        
        currentUser = null;
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Logout error:', error);
        // Force logout even if error
        sessionStorage.clear();
        window.location.href = 'login.html';
    }
}

// ============================================================
// 7. TOGGLE PASSWORD VISIBILITY
// ============================================================

function togglePassword() {
    const input = document.getElementById('adminPassword');
    const icon = document.getElementById('passwordToggleIcon');
    
    if (input && icon) {
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
        }
    }
}

// ============================================================
// 8. UI HELPERS
// ============================================================

function updateUIForUser(user) {
    if (!user) return;
    
    const name = user.displayName || user.email || 'Admin';
    const adminNameEl = document.querySelector('.admin-name');
    const topbarAdminName = document.getElementById('topbarAdminName');
    const adminEmailEl = document.getElementById('adminEmail');
    
    if (adminNameEl) adminNameEl.textContent = name;
    if (topbarAdminName) topbarAdminName.textContent = name;
    if (adminEmailEl) adminEmailEl.value = user.email || '';
    
    // Update admin avatar
    const avatarEl = document.querySelector('.admin-avatar');
    if (avatarEl) {
        avatarEl.textContent = name.charAt(0).toUpperCase();
    }
    
    sessionStorage.setItem('adminName', name);
    sessionStorage.setItem('adminEmail', user.email || '');
    sessionStorage.setItem('adminUid', user.uid || '');
}

function showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    const errorMessage = document.getElementById('errorMessage');
    if (errorDiv && errorMessage) {
        errorDiv.style.display = 'flex';
        errorMessage.textContent = message;
    }
}

function resetLoginButton(loginBtn) {
    if (loginBtn) {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In';
    }
}

function requireAuth() {
    // Check if we're on the login page
    if (window.location.pathname.includes('login.html')) {
        return true;
    }
    
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
    
    if (!isLoggedIn) {
        window.location.href = 'login.html';
        return false;
    }
    
    // Update UI with admin info
    const adminName = sessionStorage.getItem('adminName') || 'Admin';
    const adminNameEl = document.querySelector('.admin-name');
    const topbarAdminName = document.getElementById('topbarAdminName');
    
    if (adminNameEl) adminNameEl.textContent = adminName;
    if (topbarAdminName) topbarAdminName.textContent = adminName;
    
    const avatarEl = document.querySelector('.admin-avatar');
    if (avatarEl) {
        avatarEl.textContent = adminName.charAt(0).toUpperCase();
    }
    
    return true;
}

// ============================================================
// 9. INIT
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔐 Auth DOM loaded');
    
    // Set up login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Auto-check auth on page load (except login page)
    if (!window.location.pathname.includes('login.html')) {
        // Wait for Firebase to be ready
        setTimeout(() => {
            checkAuth();
        }, 500);
    }
    
    // Set up logout buttons
    document.querySelectorAll('.logout-btn').forEach(btn => {
        btn.addEventListener('click', handleLogout);
    });
});

// ============================================================
// 10. EXPORTS
// ============================================================

// Make functions globally available
window.handleLogin = handleLogin;
window.handleLogout = handleLogout;
window.togglePassword = togglePassword;
window.checkAuth = checkAuth;
window.requireAuth = requireAuth;
window.currentUser = currentUser;

console.log('✅ Auth module loaded');