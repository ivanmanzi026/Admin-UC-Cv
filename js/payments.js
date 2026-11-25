/**
 * ProCV Admin - Payment Management
 * Loads real payment data from Firestore
 */

console.log('💳 Payments admin module loading...');

// ============================================================
// 1. FIREBASE INIT
// ============================================================

const db = firebase.firestore();

let allPayments = [];
let filteredPayments = [];
let currentPage = 1;
const perPage = 10;

// ============================================================
// 2. LOAD PAYMENTS
// ============================================================

async function loadPayments() {
    console.log('🔄 Loading payments...');
    
    const tbody = document.getElementById('paymentsTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr><td colspan="6" style="text-align:center;padding:40px;color:var(--gray-500);">
                <i class="fas fa-spinner fa-spin" style="font-size:24px;display:block;margin-bottom:8px;"></i>
                Loading payments...
            </td></tr>
        `;
    }
    
    try {
        const snapshot = await db.collection('payments').orderBy('createdAt', 'desc').get();
        allPayments = [];
        let totalRevenue = 0;
        let successful = 0;
        let failed = 0;
        
        snapshot.forEach(doc => {
            const data = doc.data();
            allPayments.push({ id: doc.id, ...data });
            const status = data.status || 'pending';
            if (status === 'successful' || status === 'completed') {
                totalRevenue += data.amount || 0;
                successful++;
            } else if (status === 'failed') {
                failed++;
            }
        });
        
        document.getElementById('paymentCount').textContent = allPayments.length;
        document.getElementById('totalRevenue').textContent = `RWF ${totalRevenue.toLocaleString()}`;
        document.getElementById('successfulCount').textContent = successful;
        document.getElementById('failedCount').textContent = failed;
        
        applyFilters();
        
    } catch (error) {
        console.error('❌ Error loading payments:', error);
        if (tbody) {
            tbody.innerHTML = `
                <tr><td colspan="6" style="text-align:center;padding:40px;color:var(--gray-500);">
                    <i class="fas fa-exclamation-circle" style="font-size:24px;display:block;margin-bottom:8px;"></i>
                    Error loading payments: ${error.message}
                </td></tr>
            `;
        }
    }
}

// ============================================================
// 3. APPLY FILTERS
// ============================================================

function applyFilters() {
    const search = document.getElementById('paymentSearch')?.value?.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    
    filteredPayments = allPayments.filter(p => {
        const matchesSearch = p.userName?.toLowerCase().includes(search) || 
                              p.userId?.toLowerCase().includes(search) ||
                              p.txRef?.toLowerCase().includes(search) ||
                              p.id?.toLowerCase().includes(search);
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });
    
    currentPage = 1;
    renderPayments();
}

// ============================================================
// 4. RENDER PAYMENTS
// ============================================================

function renderPayments() {
    const tbody = document.getElementById('paymentsTableBody');
    if (!tbody) return;
    
    const total = filteredPayments.length;
    const totalPages = Math.ceil(total / perPage);
    const start = (currentPage - 1) * perPage;
    const end = Math.min(start + perPage, total);
    const pagePayments = filteredPayments.slice(start, end);
    
    if (pagePayments.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="6" style="text-align:center;padding:40px;color:var(--gray-500);">
                <i class="fas fa-receipt" style="font-size:24px;display:block;margin-bottom:8px;"></i>
                No payments found
            </td></tr>
        `;
    } else {
        tbody.innerHTML = pagePayments.map(payment => {
            const status = payment.status || 'pending';
            const txRef = payment.txRef || payment.id || 'N/A';
            const userName = payment.userName || payment.userId || 'Unknown';
            const userEmail = payment.userEmail || '';
            const amount = payment.amount || 0;
            const date = payment.createdAt ? formatDate(payment.createdAt) : 'N/A';
            
            return `
                <tr>
                    <td>
                        <code style="background:var(--gray-100);padding:2px 8px;border-radius:4px;font-size:12px;">
                            ${txRef.substring(0, 12)}...
                        </code>
                    </td>
                    <td>
                        <strong>${userName}</strong>
                        <div style="font-size:11px;color:var(--gray-500);">${userEmail}</div>
                    </td>
                    <td>
                        <strong>RWF ${amount.toLocaleString()}</strong>
                    </td>
                    <td>
                        <span class="status-badge ${status}">
                            ${status}
                        </span>
                    </td>
                    <td style="font-size:13px;color:var(--gray-500);">
                        ${date}
                    </td>
                    <td>
                        <div class="action-group">
                            <button class="action-btn-sm edit" onclick="viewPayment('${payment.id}')" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${status === 'pending' ? `
                                <button class="action-btn-sm publish" onclick="updatePaymentStatus('${payment.id}','successful')" title="Mark Successful">
                                    <i class="fas fa-check"></i>
                                </button>
                                <button class="action-btn-sm archive" onclick="updatePaymentStatus('${payment.id}','failed')" title="Mark Failed">
                                    <i class="fas fa-times"></i>
                                </button>
                            ` : ''}
                            ${status === 'successful' || status === 'completed' ? `
                                <button class="action-btn-sm archive" onclick="updatePaymentStatus('${payment.id}','refunded')" title="Refund">
                                    <i class="fas fa-undo"></i>
                                </button>
                            ` : ''}
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    // Update pagination
    document.getElementById('paginationInfo').textContent = 
        `Showing ${total > 0 ? start + 1 : 0}-${Math.min(end, total)} of ${total} payments`;
    
    document.getElementById('prevPage').disabled = currentPage === 1;
    document.getElementById('nextPage').disabled = currentPage >= totalPages;
    
    // Page numbers
    const pageNumbers = document.getElementById('pageNumbers');
    let pagesHtml = '';
    const maxPages = Math.min(totalPages, 5);
    for (let i = 1; i <= maxPages; i++) {
        pagesHtml += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="goToPage(${i})">${i}</button>`;
    }
    pageNumbers.innerHTML = pagesHtml;
}

// ============================================================
// 5. GO TO PAGE
// ============================================================

function goToPage(page) {
    currentPage = page;
    renderPayments();
}

// ============================================================
// 6. VIEW PAYMENT
// ============================================================

function viewPayment(id) {
    const payment = allPayments.find(p => p.id === id);
    if (!payment) {
        showToast('Payment not found', 'error');
        return;
    }
    
    const details = `
        Transaction: ${payment.txRef || payment.id}
        User: ${payment.userName || payment.userId}
        Email: ${payment.userEmail || 'N/A'}
        Amount: RWF ${payment.amount || 0}
        Status: ${payment.status || 'pending'}
        Date: ${payment.createdAt ? formatDate(payment.createdAt) : 'N/A'}
        ${payment.method ? `Method: ${payment.method}` : ''}
        ${payment.description ? `Description: ${payment.description}` : ''}
    `;
    
    showToast(details, 'info');
}

// ============================================================
// 7. UPDATE PAYMENT STATUS
// ============================================================

async function updatePaymentStatus(id, status) {
    if (status === 'refunded' && !confirm('Are you sure you want to refund this payment?')) {
        return;
    }
    
    try {
        await db.collection('payments').doc(id).update({
            status: status,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast(`Payment ${status} successfully`);
        loadPayments();
        
    } catch (error) {
        console.error('Error updating payment:', error);
        showToast('Error updating payment', 'error');
    }
}

// ============================================================
// 8. RESET FILTERS
// ============================================================

function resetFilters() {
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('paymentSearch').value = '';
    applyFilters();
}

// ============================================================
// 9. FORMAT DATE
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
// 10. TOAST
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
                 type === 'info' ? 'fa-info-circle' : 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    document.getElementById('toastContainer').appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================================
// 11. SEARCH & FILTER EVENTS
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    if (!requireAuth()) return;
    
    document.getElementById('paymentSearch').addEventListener('input', applyFilters);
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    
    document.getElementById('prevPage').addEventListener('click', () => {
        if (currentPage > 1) { currentPage--; renderPayments(); }
    });
    document.getElementById('nextPage').addEventListener('click', () => {
        const totalPages = Math.ceil(filteredPayments.length / perPage);
        if (currentPage < totalPages) { currentPage++; renderPayments(); }
    });
    
    loadPayments();
});

// ============================================================
// 12. EXPOSE
// ============================================================

window.viewPayment = viewPayment;
window.updatePaymentStatus = updatePaymentStatus;
window.resetFilters = resetFilters;
window.goToPage = goToPage;

console.log('✅ Payments module loaded');