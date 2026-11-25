/**
 * ProCV Admin - Dashboard
 * Loads real data from Firebase Firestore
 */

console.log('📊 Dashboard loading...');

// ============================================================
// 1. FIREBASE - Get instance with retry
// ============================================================

let db = null;
let firebaseReady = false;

function getDB() {
    if (db) return db;
    
    try {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            db = firebase.firestore();
            firebaseReady = true;
            console.log('✅ Firestore ready');
            return db;
        }
    } catch (error) {
        console.warn('⚠️ Firestore not ready:', error.message);
    }
    return null;
}

// ============================================================
// 2. LOAD DASHBOARD DATA
// ============================================================

async function loadDashboardData() {
    console.log('🔄 Loading dashboard data...');
    
    const dbInstance = getDB();
    if (!dbInstance) {
        console.warn('⚠️ Firestore not available, using fallback data');
        loadFallbackData();
        return;
    }
    
    try {
        // Load users
        const usersSnapshot = await dbInstance.collection('users').get();
        const users = [];
        usersSnapshot.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() });
        });
        
        const totalUsers = users.length;
        const proUsers = users.filter(u => u.plan === 'pro' || u.plan === 'premium').length;
        
        // Update user stats
        const totalUsersEl = document.getElementById('totalUsers');
        const proUsersEl = document.getElementById('proUsers');
        const userCountEl = document.getElementById('userCount');
        if (totalUsersEl) totalUsersEl.textContent = totalUsers;
        if (proUsersEl) proUsersEl.textContent = proUsers;
        if (userCountEl) userCountEl.textContent = totalUsers;
        
        // Load templates
        const templatesSnapshot = await dbInstance.collection('templates').where('status', '==', 'published').get();
        const totalTemplates = templatesSnapshot.size;
        const totalTemplatesEl = document.getElementById('totalTemplates');
        const templateCountEl = document.getElementById('templateCount');
        if (totalTemplatesEl) totalTemplatesEl.textContent = totalTemplates;
        if (templateCountEl) templateCountEl.textContent = totalTemplates;
        
        // Load payments
        const paymentsSnapshot = await dbInstance.collection('payments')
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();
        
        const payments = [];
        let totalRevenue = 0;
        paymentsSnapshot.forEach(doc => {
            const data = doc.data();
            payments.push({ id: doc.id, ...data });
            if (data.status === 'successful' || data.status === 'completed') {
                totalRevenue += data.amount || 0;
            }
        });
        
        const totalRevenueEl = document.getElementById('totalRevenue');
        const paymentCountEl = document.getElementById('paymentCount');
        if (totalRevenueEl) totalRevenueEl.textContent = `RWF ${totalRevenue.toLocaleString()}`;
        if (paymentCountEl) paymentCountEl.textContent = payments.length;
        
        // Render recent payments
        renderRecentPayments(payments);
        
        // Load recent users
        const recentUsersSnapshot = await dbInstance.collection('users')
            .orderBy('createdAt', 'desc')
            .limit(5)
            .get();
        
        const recentUsers = [];
        recentUsersSnapshot.forEach(doc => {
            recentUsers.push({ id: doc.id, ...doc.data() });
        });
        renderRecentUsers(recentUsers);
        
        console.log('✅ Dashboard data loaded');
        
    } catch (error) {
        console.error('❌ Error loading dashboard data:', error);
        loadFallbackData();
    }
}

// ============================================================
// 3. RENDER RECENT PAYMENTS
// ============================================================

function renderRecentPayments(payments) {
    const container = document.getElementById('recentPayments');
    if (!container) return;
    
    if (payments.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:20px;color:var(--gray-500);">
                <i class="fas fa-inbox" style="font-size:24px;display:block;margin-bottom:8px;"></i>
                No payments yet
            </div>
        `;
        return;
    }
    
    container.innerHTML = payments.map(payment => {
        const status = payment.status || 'pending';
        const statusColor = status === 'successful' || status === 'completed' ? 'green' : 
                           status === 'failed' ? 'red' : 'gold';
        const statusIcon = status === 'successful' || status === 'completed' ? 'check' : 
                          status === 'failed' ? 'times' : 'clock';
        const userName = payment.userName || payment.userId || 'Unknown User';
        const amount = payment.amount || 0;
        const date = payment.createdAt ? formatDate(payment.createdAt) : 'N/A';
        
        return `
            <div class="activity-item">
                <div class="activity-avatar ${statusColor}">
                    <i class="fas fa-${statusIcon}"></i>
                </div>
                <div class="activity-info">
                    <span class="activity-name">${userName}</span>
                    <span class="activity-detail">RWF ${amount.toLocaleString()} • ${status}</span>
                </div>
                <span class="activity-time">${date}</span>
            </div>
        `;
    }).join('');
}

// ============================================================
// 4. RENDER RECENT USERS
// ============================================================

function renderRecentUsers(users) {
    const container = document.getElementById('recentUsers');
    if (!container) return;
    
    if (users.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;padding:20px;color:var(--gray-500);">
                <i class="fas fa-inbox" style="font-size:24px;display:block;margin-bottom:8px;"></i>
                No users yet
            </div>
        `;
        return;
    }
    
    container.innerHTML = users.map(user => {
        const planColor = user.plan === 'pro' || user.plan === 'premium' ? 'gold' : 'blue';
        const name = user.name || 'Unknown User';
        const email = user.email || '';
        const plan = user.plan || 'free';
        const date = user.createdAt ? formatDate(user.createdAt) : 'N/A';
        
        return `
            <div class="activity-item">
                <div class="activity-avatar ${planColor}">
                    ${name.charAt(0).toUpperCase()}
                </div>
                <div class="activity-info">
                    <span class="activity-name">${name}</span>
                    <span class="activity-detail">${email} • ${plan}</span>
                </div>
                <span class="activity-time">${date}</span>
            </div>
        `;
    }).join('');
}

// ============================================================
// 5. FORMAT DATE
// ============================================================

function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    
    try {
        let date;
        if (timestamp.seconds) {
            date = new Date(timestamp.seconds * 1000);
        } else if (timestamp.toDate) {
            date = timestamp.toDate();
        } else {
            date = new Date(timestamp);
        }
        return date.toLocaleDateString();
    } catch (e) {
        return 'N/A';
    }
}

// ============================================================
// 6. LOAD FALLBACK DATA
// ============================================================

function loadFallbackData() {
    console.log('📋 Using fallback data');
    
    const elements = {
        'totalUsers': '0',
        'proUsers': '0',
        'totalTemplates': '0',
        'totalRevenue': 'RWF 0',
        'userCount': '0',
        'templateCount': '0',
        'paymentCount': '0'
    };
    
    Object.keys(elements).forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = elements[id];
    });
    
    const recentPayments = document.getElementById('recentPayments');
    if (recentPayments) {
        recentPayments.innerHTML = `
            <div style="text-align:center;padding:20px;color:var(--gray-500);">
                <i class="fas fa-inbox" style="font-size:24px;display:block;margin-bottom:8px;"></i>
                No data available
            </div>
        `;
    }
    
    const recentUsers = document.getElementById('recentUsers');
    if (recentUsers) {
        recentUsers.innerHTML = `
            <div style="text-align:center;padding:20px;color:var(--gray-500);">
                <i class="fas fa-inbox" style="font-size:24px;display:block;margin-bottom:8px;"></i>
                No data available
            </div>
        `;
    }
}

// ============================================================
// 7. REAL-TIME UPDATES
// ============================================================

function setupRealtimeUpdates() {
    const dbInstance = getDB();
    if (!dbInstance) return;
    
    try {
        dbInstance.collection('users').onSnapshot(() => {
            console.log('🔄 Users updated, reloading...');
            loadDashboardData();
        }, (error) => {
            console.error('User listener error:', error);
        });
    } catch (error) {
        console.warn('⚠️ Could not set up realtime updates:', error.message);
    }
}

// ============================================================
// 8. INIT
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Dashboard DOM loaded');
    
    // Check auth
    if (typeof requireAuth === 'function') {
        if (!requireAuth()) return;
    }
    
    // Wait for Firebase to be ready
    let attempts = 0;
    const maxAttempts = 10;
    
    function tryLoad() {
        attempts++;
        const dbInstance = getDB();
        
        if (dbInstance) {
            loadDashboardData();
            setupRealtimeUpdates();
        } else if (attempts < maxAttempts) {
            console.log(`⏳ Waiting for Firebase... (attempt ${attempts}/${maxAttempts})`);
            setTimeout(tryLoad, 500);
        } else {
            console.warn('⚠️ Firebase not ready after max attempts, using fallback');
            loadFallbackData();
        }
    }
    
    setTimeout(tryLoad, 300);
});

// ============================================================
// 9. EXPOSE
// ============================================================

window.loadDashboardData = loadDashboardData;
window.formatDate = formatDate;

console.log('✅ Dashboard module loaded');