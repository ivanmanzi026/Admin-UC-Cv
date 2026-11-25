/**
 * ProCV Admin - Plan Management
 * Manages subscription plans in Firestore
 */

console.log('📋 Plans admin module loading...');

// ============================================================
// 1. FIREBASE INIT
// ============================================================

const db = firebase.firestore();

let proFeatures = [];
let currentPlanData = {};

// ============================================================
// 2. LOAD PLAN DATA
// ============================================================

async function loadPlanData() {
    console.log('🔄 Loading plan data...');
    
    try {
        const doc = await db.collection('settings').doc('plans').get();
        if (doc.exists) {
            const data = doc.data();
            currentPlanData = data;
            
            // Set features
            if (data.proFeatures && Array.isArray(data.proFeatures)) {
                proFeatures = data.proFeatures;
            } else {
                proFeatures = [
                    'All Templates',
                    'Unlimited CVs',
                    'Premium Templates',
                    'Cover Letter Builder',
                    'CV Checker',
                    'ATS Analysis',
                    'Custom Sections',
                    'Multiple CV Versions'
                ];
            }
            
            // Set price
            if (data.proPrice) {
                document.getElementById('proPrice').value = data.proPrice;
            }
            
            // Set status
            if (data.proActive !== undefined) {
                const toggle = document.querySelector('.toggle-switch');
                const statusText = document.getElementById('planStatusText');
                if (data.proActive) {
                    toggle.classList.add('active');
                    toggle.querySelector('.toggle-slider').style.left = '22px';
                    statusText.textContent = 'Active';
                } else {
                    toggle.classList.remove('active');
                    toggle.querySelector('.toggle-slider').style.left = '2px';
                    statusText.textContent = 'Inactive';
                }
            }
        } else {
            // Initialize with defaults
            proFeatures = [
                'All Templates',
                'Unlimited CVs',
                'Premium Templates',
                'Cover Letter Builder',
                'CV Checker',
                'ATS Analysis',
                'Custom Sections',
                'Multiple CV Versions'
            ];
            await db.collection('settings').doc('plans').set({
                proFeatures: proFeatures,
                proPrice: 2000,
                proActive: true,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    } catch (error) {
        console.error('Error loading plan data:', error);
        // Use default values
        proFeatures = [
            'All Templates',
            'Unlimited CVs',
            'Premium Templates',
            'Cover Letter Builder',
            'CV Checker',
            'ATS Analysis',
            'Custom Sections',
            'Multiple CV Versions'
        ];
    }
    
    renderProFeatures();
}

// ============================================================
// 3. RENDER PRO FEATURES
// ============================================================

function renderProFeatures() {
    const container = document.getElementById('proFeatureList');
    if (!container) return;
    
    if (proFeatures.length === 0) {
        container.innerHTML = `
            <p class="help-text" style="padding:8px 0;">No features added yet</p>
        `;
        return;
    }
    
    container.innerHTML = proFeatures.map((feature, index) => `
        <span class="feature-tag" style="display:inline-flex;align-items:center;gap:6px;background:var(--gray-100);padding:4px 12px;border-radius:50px;font-size:13px;color:var(--gray-700);">
            ${feature}
            <button class="remove-feature" onclick="removeProFeature(${index})" style="background:none;border:none;color:var(--gray-400);cursor:pointer;font-size:14px;padding:0 4px;">×</button>
        </span>
    `).join('');
}

// ============================================================
// 4. ADD PRO FEATURE
// ============================================================

async function addProFeature() {
    const input = document.getElementById('newFeatureInput');
    const feature = input.value.trim();
    if (!feature) {
        showToast('Please enter a feature', 'error');
        return;
    }
    
    if (proFeatures.includes(feature)) {
        showToast('Feature already exists', 'warning');
        return;
    }
    
    proFeatures.push(feature);
    await saveProFeatures();
    renderProFeatures();
    input.value = '';
    showToast('Feature added successfully');
}

// ============================================================
// 5. REMOVE PRO FEATURE
// ============================================================

async function removeProFeature(index) {
    if (!confirm('Remove this feature from Pro plan?')) return;
    
    proFeatures.splice(index, 1);
    await saveProFeatures();
    renderProFeatures();
    showToast('Feature removed');
}

// ============================================================
// 6. SAVE PRO FEATURES
// ============================================================

async function saveProFeatures() {
    try {
        await db.collection('settings').doc('plans').set({
            proFeatures: proFeatures,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error('Error saving features:', error);
        showToast('Error saving features', 'error');
    }
}

// ============================================================
// 7. UPDATE PRO PRICE
// ============================================================

async function updateProPrice() {
    const input = document.getElementById('proPrice');
    const price = parseInt(input.value);
    if (!price || price <= 0) {
        showToast('Please enter a valid price', 'error');
        return;
    }
    
    try {
        await db.collection('settings').doc('plans').set({
            proPrice: price,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        showToast(`Pro price updated to RWF ${price.toLocaleString()}/month`);
    } catch (error) {
        console.error('Error updating price:', error);
        showToast('Error updating price', 'error');
    }
}

// ============================================================
// 8. TOGGLE PLAN STATUS
// ============================================================

async function togglePlanStatus(element) {
    const isActive = element.classList.contains('active');
    element.classList.toggle('active');
    const slider = element.querySelector('.toggle-slider');
    const statusText = document.getElementById('planStatusText');
    
    if (!isActive) {
        slider.style.left = '22px';
        statusText.textContent = 'Active';
        showToast('Pro plan activated');
    } else {
        slider.style.left = '2px';
        statusText.textContent = 'Inactive';
        showToast('Pro plan deactivated');
    }
    
    try {
        await db.collection('settings').doc('plans').set({
            proActive: !isActive,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
    } catch (error) {
        console.error('Error toggling plan status:', error);
        showToast('Error updating plan status', 'error');
    }
}

// ============================================================
// 9. TOAST
// ============================================================

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) {
        const newContainer = document.createElement('div');
        newContainer.id = 'toastContainer';
        document.body.appendChild(newContainer);
    }
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 
                 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    document.getElementById('toastContainer').appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================================
// 10. INIT
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    if (!requireAuth()) return;
    loadPlanData();
});

// ============================================================
// 11. EXPOSE
// ============================================================

window.addProFeature = addProFeature;
window.removeProFeature = removeProFeature;
window.updateProPrice = updateProPrice;
window.togglePlanStatus = togglePlanStatus;

console.log('✅ Plans module loaded');