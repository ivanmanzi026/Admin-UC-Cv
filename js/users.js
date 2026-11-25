/**
 * ProCV Admin - User Management
 * Loads real user data from Firebase Firestore
 */

console.log('👤 Users module loading...');

// ============================================================
// 1. FIREBASE - Get instance
// ============================================================

let db = null;

function getDB() {
    if (db) return db;
    
    try {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            db = firebase.firestore();
            console.log('✅ Firestore ready (users)');
            return db;
        }
    } catch (error) {
        console.warn('⚠️ Firestore not ready:', error.message);
    }
    return null;
}

// ============================================================
// 2. STATE
// ============================================================

let allUsers = [];
let filteredUsers = [];
let currentPage = 1;
const perPage = 10;
let selectedUserId = null;

// ============================================================
// 3. LOAD USERS
// ============================================================

async function loadUsers() {
    console.log('🔄 Loading users...');
    
    const tbody = document.getElementById('usersTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr><td colspan="6" style="text-align:center;padding:40px;color:var(--gray-500);">
                <i class="fas fa-spinner fa-spin" style="font-size:24px;display:block;margin-bottom:8px;"></i>
                Loading users...
            </td></tr>
        `;
    }
    
    const dbInstance = getDB();
    if (!dbInstance) {
        console.warn('⚠️ Firestore not available, using fallback');
        renderFallbackUsers();
        return;
    }
    
    try {
        const snapshot = await dbInstance.collection('users').get();
        allUsers = [];
        snapshot.forEach(doc => {
            allUsers.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort by createdAt descending
        allUsers.sort((a, b) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
        });
        
        const userCountEl = document.getElementById('userCount');
        if (userCountEl) userCountEl.textContent = allUsers.length;
        
        applyFilters();
        
    } catch (error) {
        console.error('❌ Error loading users:', error);
        renderFallbackUsers();
    }
}

// ============================================================
// 4. RENDER FALLBACK USERS
// ============================================================

function renderFallbackUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr><td colspan="6" style="text-align:center;padding:40px;color:var(--gray-500);">
            <i class="fas fa-database" style="font-size:24px;display:block;margin-bottom:8px;"></i>
            No users found. Add your first user in Firestore.
            <div style="font-size:12px;color:var(--gray-400);margin-top:4px;">
                Collection: users
            </div>
        </td></tr>
    `;
}

// ============================================================
// 5. APPLY FILTERS
// ============================================================

function applyFilters() {
    const search = document.getElementById('userSearch')?.value?.toLowerCase() || '';
    const planFilter = document.getElementById('planFilter')?.value || 'all';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    
    filteredUsers = allUsers.filter(user => {
        const matchesSearch = user.name?.toLowerCase().includes(search) || 
                              user.email?.toLowerCase().includes(search) ||
                              user.id?.toLowerCase().includes(search);
        const matchesPlan = planFilter === 'all' || user.plan === planFilter || 
                           (planFilter === 'pro' && (user.plan === 'pro' || user.plan === 'premium'));
        const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
        return matchesSearch && matchesPlan && matchesStatus;
    });
    
    currentPage = 1;
    renderUsers();
}

// ============================================================
// 6. RENDER USERS
// ============================================================

function renderUsers() {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    const total = filteredUsers.length;
    const totalPages = Math.ceil(total / perPage);
    const start = (currentPage - 1) * perPage;
    const end = Math.min(start + perPage, total);
    const pageUsers = filteredUsers.slice(start, end);
    
    if (pageUsers.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="6" style="text-align:center;padding:40px;color:var(--gray-500);">
                <i class="fas fa-users-slash" style="font-size:24px;display:block;margin-bottom:8px;"></i>
                No users found
            </td></tr>
        `;
    } else {
        tbody.innerHTML = pageUsers.map(user => `
            <tr>
                <td>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#2563EB,#7C3AED);color:white;display:flex;align-items:center;justify-content:center;font-weight:600;font-size:14px;">
                            ${user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <strong>${user.name || 'Unknown'}</strong>
                    </div>
                </td>
                <td>${user.email || 'No email'}</td>
                <td>
                    <span class="plan-badge ${user.plan === 'pro' || user.plan === 'premium' ? 'pro' : 'free'}">
                        ${user.plan === 'pro' || user.plan === 'premium' ? '⭐ Pro' : 'Free'}
                    </span>
                </td>
                <td>
                    <span class="status-badge ${user.status || 'active'}">
                        ${user.status || 'active'}
                    </span>
                </td>
                <td style="font-size:13px;color:var(--gray-500);">
                    ${user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                </td>
                <td>
                    <div class="action-group">
                        <button class="action-btn-sm edit" onclick="viewUser('${user.id}')" title="View Details">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn-sm ${user.status === 'active' ? 'archive' : 'publish'}" 
                                onclick="toggleUserStatus('${user.id}')" 
                                title="${user.status === 'active' ? 'Suspend' : 'Activate'}">
                            <i class="fas ${user.status === 'active' ? 'fa-ban' : 'fa-check'}"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
    
    // Update pagination
    const paginationInfo = document.getElementById('paginationInfo');
    if (paginationInfo) {
        paginationInfo.textContent = 
            `Showing ${total > 0 ? start + 1 : 0}-${Math.min(end, total)} of ${total} users`;
    }
    
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    if (prevPage) prevPage.disabled = currentPage === 1;
    if (nextPage) nextPage.disabled = currentPage >= totalPages;
    
    // Page numbers
    const pageNumbers = document.getElementById('pageNumbers');
    if (pageNumbers) {
        let pagesHtml = '';
        const maxPages = Math.min(totalPages, 5);
        for (let i = 1; i <= maxPages; i++) {
            pagesHtml += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
        }
        pageNumbers.innerHTML = pagesHtml;
    }
}

// ============================================================
// 7. GO TO PAGE
// ============================================================

function goToPage(page) {
    currentPage = page;
    renderUsers();
}

// ============================================================
// 8. VIEW USER
// ============================================================

async function viewUser(id) {
    selectedUserId = id;
    
    const dbInstance = getDB();
    if (!dbInstance) {
        showToast('Firestore not available', 'error');
        return;
    }
    
    try {
        const doc = await dbInstance.collection('users').doc(id).get();
        if (!doc.exists) {
            showToast('User not found', 'error');
            return;
        }
        
        const user = { id: doc.id, ...doc.data() };
        
        const body = document.getElementById('userDetailBody');
        if (body) {
            body.innerHTML = `
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                    <div><strong>Name:</strong> ${user.name || 'N/A'}</div>
                    <div><strong>Email:</strong> ${user.email || 'N/A'}</div>
                    <div><strong>Plan:</strong> <span class="plan-badge ${user.plan === 'pro' || user.plan === 'premium' ? 'pro' : 'free'}">${user.plan || 'free'}</span></div>
                    <div><strong>Status:</strong> <span class="status-badge ${user.status || 'active'}">${user.status || 'active'}</span></div>
                    <div><strong>Registered:</strong> ${user.createdAt ? formatDate(user.createdAt) : 'N/A'}</div>
                    <div><strong>Last Updated:</strong> ${user.updatedAt ? formatDate(user.updatedAt) : 'N/A'}</div>
                    ${user.subscriptionEnd ? `<div><strong>Subscription End:</strong> ${formatDate(user.subscriptionEnd)}</div>` : ''}
                    ${user.lastPayment ? `<div><strong>Last Payment:</strong> RWF ${user.lastPayment.amount || 0}</div>` : ''}
                </div>
                <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--gray-200);">
                    <h4 style="font-size:14px;font-weight:600;margin-bottom:8px;">Payment History</h4>
                    <div style="font-size:13px;color:var(--gray-500);">
                        ${user.plan === 'pro' || user.plan === 'premium' ? 'Pro subscription active' : 'No payment history'}
                    </div>
                </div>
            `;
        }
        
        const suspendBtn = document.getElementById('suspendUserBtn');
        if (suspendBtn) {
            suspendBtn.innerHTML = 
                `<i class="fas ${user.status === 'active' ? 'fa-ban' : 'fa-check'}"></i> ${user.status === 'active' ? 'Suspend' : 'Activate'}`;
        }
        
        openModal('userDetailModal');
        
    } catch (error) {
        console.error('Error viewing user:', error);
        showToast('Error loading user details', 'error');
    }
}

// ============================================================
// 9. TOGGLE USER STATUS
// ============================================================

async function toggleUserStatus(id) {
    const userId = id || selectedUserId;
    if (!userId) return;
    
    const dbInstance = getDB();
    if (!dbInstance) {
        showToast('Firestore not available', 'error');
        return;
    }
    
    try {
        const doc = await dbInstance.collection('users').doc(userId).get();
        if (!doc.exists) {
            showToast('User not found', 'error');
            return;
        }
        
        const user = doc.data();
        const newStatus = user.status === 'active' ? 'suspended' : 'active';
        
        await dbInstance.collection('users').doc(userId).update({
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        closeModal('userDetailModal');
        showToast(`User ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`);
        loadUsers();
        
    } catch (error) {
        console.error('Error toggling user status:', error);
        showToast('Error updating user status', 'error');
    }
}

// ============================================================
// 10. EXPORT USERS
// ============================================================

function exportUsers() {
    if (filteredUsers.length === 0) {
        showToast('No users to export', 'error');
        return;
    }
    
    let csv = 'Name,Email,Plan,Status,Registered\n';
    filteredUsers.forEach(user => {
        const date = user.createdAt ? formatDate(user.createdAt) : '';
        csv += `${user.name || ''},${user.email || ''},${user.plan || 'free'},${user.status || 'active'},${date}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `procv-users-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Users exported successfully');
}

// ============================================================
// 11. RESET FILTERS
// ============================================================

function resetFilters() {
    const planFilter = document.getElementById('planFilter');
    const statusFilter = document.getElementById('statusFilter');
    const userSearch = document.getElementById('userSearch');
    
    if (planFilter) planFilter.value = 'all';
    if (statusFilter) statusFilter.value = 'all';
    if (userSearch) userSearch.value = '';
    
    applyFilters();
}

// ============================================================
// 12. FORMAT DATE
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
// 13. TOAST
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
// 14. MODAL
// ============================================================

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('active');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('active');
}

// ============================================================
// 15. SEARCH & FILTER EVENTS
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('👤 Users DOM loaded');
    
    // Check auth
    if (typeof requireAuth === 'function') {
        if (!requireAuth()) return;
    }
    
    const userSearch = document.getElementById('userSearch');
    const planFilter = document.getElementById('planFilter');
    const statusFilter = document.getElementById('statusFilter');
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    
    if (userSearch) userSearch.addEventListener('input', applyFilters);
    if (planFilter) planFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);
    
    if (prevPage) {
        prevPage.addEventListener('click', () => {
            if (currentPage > 1) { currentPage--; renderUsers(); }
        });
    }
    
    if (nextPage) {
        nextPage.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredUsers.length / perPage);
            if (currentPage < totalPages) { currentPage++; renderUsers(); }
        });
    }
    
    // Wait for Firebase to be ready
    let attempts = 0;
    const maxAttempts = 10;
    
    function tryLoad() {
        attempts++;
        const dbInstance = getDB();
        
        if (dbInstance) {
            loadUsers();
        } else if (attempts < maxAttempts) {
            console.log(`⏳ Waiting for Firebase... (attempt ${attempts}/${maxAttempts})`);
            setTimeout(tryLoad, 500);
        } else {
            console.warn('⚠️ Firebase not ready after max attempts');
            renderFallbackUsers();
        }
    }
    
    setTimeout(tryLoad, 300);
});

// ============================================================
// 16. EXPOSE
// ============================================================

window.viewUser = viewUser;
window.toggleUserStatus = toggleUserStatus;
window.exportUsers = exportUsers;
window.resetFilters = resetFilters;
window.goToPage = goToPage;
window.openModal = openModal;
window.closeModal = closeModal;

console.log('✅ Users module loaded');