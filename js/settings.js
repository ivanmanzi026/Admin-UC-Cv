/**
 * ProCV Admin - Settings
 * Handles general, security, and profile settings with Firebase
 */

console.log('⚙️ Settings module loading...');

// ============================================================
// 1. FIREBASE INIT
// ============================================================

const db = firebase.firestore();

// ============================================================
// 2. TOGGLE PASSWORD VISIBILITY
// ============================================================

function toggleSettingsPassword() {
    const input = document.getElementById('adminPassword');
    const icon = document.getElementById('settingsPasswordIcon');
    
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
// 3. SAVE GENERAL SETTINGS
// ============================================================

async function saveGeneralSettings(event) {
    event.preventDefault();
    
    const name = document.getElementById('websiteName').value;
    const logo = document.getElementById('websiteLogo').value;
    const currency = document.getElementById('defaultCurrency').value;
    const email = document.getElementById('contactEmail').value;
    
    if (!name || !email) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        await db.collection('settings').doc('general').set({
            websiteName: name,
            websiteLogo: logo || '',
            defaultCurrency: currency,
            contactEmail: email,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: sessionStorage.getItem('adminEmail') || 'admin'
        }, { merge: true });
        
        showToast('General settings saved successfully');
    } catch (error) {
        console.error('Error saving general settings:', error);
        showToast('Error saving settings', 'error');
    }
}

// ============================================================
// 4. SAVE SECURITY SETTINGS
// ============================================================

async function saveSecuritySettings(event) {
    event.preventDefault();
    
    const password = document.getElementById('adminPassword').value;
    const confirm = document.getElementById('confirmPassword').value;
    
    if (password && password !== confirm) {
        showToast('Passwords do not match', 'error');
        return;
    }
    
    if (password && password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }
    
    if (password) {
        try {
            // Update password in Firebase Auth
            const auth = firebase.auth();
            const user = auth.currentUser;
            if (user) {
                await user.updatePassword(password);
                showToast('Password updated successfully');
            } else {
                showToast('Please login again to change password', 'error');
            }
        } catch (error) {
            console.error('Error updating password:', error);
            if (error.code === 'auth/requires-recent-login') {
                showToast('Please re-authenticate to change password', 'error');
            } else {
                showToast('Error updating password: ' + error.message, 'error');
            }
        }
    } else {
        showToast('No changes made');
    }
    
    document.getElementById('adminPassword').value = '';
    document.getElementById('confirmPassword').value = '';
}

// ============================================================
// 5. SAVE ADMIN PROFILE
// ============================================================

async function saveAdminProfile(event) {
    event.preventDefault();
    
    const name = document.getElementById('adminName').value;
    const email = document.getElementById('adminEmail').value;
    
    if (!name || !email) {
        showToast('Please fill in all fields', 'error');
        return;
    }
    
    try {
        const auth = firebase.auth();
        const user = auth.currentUser;
        
        if (user) {
            // Update display name
            await user.updateProfile({
                displayName: name
            });
            
            // Update email if changed
            if (user.email !== email) {
                await user.updateEmail(email);
            }
            
            // Update session
            sessionStorage.setItem('adminName', name);
            sessionStorage.setItem('adminEmail', email);
            
            // Update UI
            const adminNameEl = document.querySelector('.admin-name');
            const topbarAdminName = document.getElementById('topbarAdminName');
            if (adminNameEl) adminNameEl.textContent = name;
            if (topbarAdminName) topbarAdminName.textContent = name;
            
            showToast('Profile updated successfully');
        } else {
            showToast('Please login to update profile', 'error');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        if (error.code === 'auth/requires-recent-login') {
            showToast('Please re-authenticate to update profile', 'error');
        } else {
            showToast('Error updating profile: ' + error.message, 'error');
        }
    }
}

// ============================================================
// 6. LOAD SETTINGS
// ============================================================

async function loadSettings() {
    try {
        const doc = await db.collection('settings').doc('general').get();
        if (doc.exists) {
            const data = doc.data();
            if (data.websiteName) document.getElementById('websiteName').value = data.websiteName;
            if (data.websiteLogo) document.getElementById('websiteLogo').value = data.websiteLogo;
            if (data.defaultCurrency) document.getElementById('defaultCurrency').value = data.defaultCurrency;
            if (data.contactEmail) document.getElementById('contactEmail').value = data.contactEmail;
        }
        
        // Load admin profile
        const adminName = sessionStorage.getItem('adminName') || 'Admin';
        const adminEmail = sessionStorage.getItem('adminEmail') || 'admin@procv.com';
        document.getElementById('adminName').value = adminName;
        document.getElementById('adminEmail').value = adminEmail;
        
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// ============================================================
// 7. TOAST
// ============================================================

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 
                 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================================
// 8. INIT
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    if (!requireAuth()) return;
    loadSettings();
});

// ============================================================
// 9. EXPOSE
// ============================================================

window.toggleSettingsPassword = toggleSettingsPassword;
window.saveGeneralSettings = saveGeneralSettings;
window.saveSecuritySettings = saveSecuritySettings;
window.saveAdminProfile = saveAdminProfile;

console.log('✅ Settings module loaded');