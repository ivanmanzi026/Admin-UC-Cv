/**
 * ProCV Admin - Template Management
 * Handles CRUD operations for templates in Firestore
 */

console.log('📁 Templates admin module loading...');

// ============================================================
// 1. FIREBASE - Get instance
// ============================================================

let db = null;

function getDB() {
    if (db) return db;
    
    try {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            db = firebase.firestore();
            console.log('✅ Firestore ready (templates)');
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

let allTemplates = [];
let filteredTemplates = [];
let currentPage = 1;
const perPage = 10;
let deleteTargetId = null;

// ============================================================
// 3. LOAD TEMPLATES
// ============================================================

async function loadTemplates() {
    console.log('🔄 Loading templates from Firestore...');
    
    const tbody = document.getElementById('templatesTableBody');
    if (tbody) {
        tbody.innerHTML = `
            <tr><td colspan="7" style="text-align:center;padding:40px;color:var(--gray-500);">
                <i class="fas fa-spinner fa-spin" style="font-size:24px;display:block;margin-bottom:8px;"></i>
                Loading templates...
            </td></tr>
        `;
    }
    
    const dbInstance = getDB();
    if (!dbInstance) {
        console.warn('⚠️ Firestore not available');
        showToast('Firestore not available. Please check your connection.', 'error');
        renderFallbackTemplates();
        return;
    }
    
    try {
        const snapshot = await dbInstance.collection('templates').get();
        allTemplates = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            allTemplates.push({ 
                id: doc.id, 
                ...data,
                isPortfolio: data.category === 'portfolio' || data.isPortfolio || false,
                type: data.type || 'standard'
            });
        });
        
        // Sort by createdAt descending
        allTemplates.sort((a, b) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
        });
        
        const templateCount = document.getElementById('templateCount');
        if (templateCount) templateCount.textContent = allTemplates.length;
        
        applyFilters();
        
    } catch (error) {
        console.error('❌ Error loading templates:', error);
        showToast('Error loading templates: ' + error.message, 'error');
        renderFallbackTemplates();
    }
}

// ============================================================
// 4. RENDER FALLBACK TEMPLATES
// ============================================================

function renderFallbackTemplates() {
    const tbody = document.getElementById('templatesTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr><td colspan="7" style="text-align:center;padding:40px;color:var(--gray-500);">
            <i class="fas fa-database" style="font-size:24px;display:block;margin-bottom:8px;"></i>
            No templates found. Create your first template in the Visual Editor.
            <div style="font-size:12px;color:var(--gray-400);margin-top:4px;">
                Collection: templates | Status: draft/published
            </div>
            <button class="btn btn-primary" onclick="window.location.href='visual-editor.html'" style="margin-top:12px;">
                <i class="fas fa-plus"></i> Create Template
            </button>
        </td></tr>
    `;
}

// ============================================================
// 5. APPLY FILTERS
// ============================================================

function applyFilters() {
    const search = document.getElementById('templateSearch')?.value?.toLowerCase() || '';
    const planFilter = document.getElementById('planFilter')?.value || 'all';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';
    const categoryFilter = document.getElementById('categoryFilter')?.value || 'all';
    
    filteredTemplates = allTemplates.filter(t => {
        const matchesSearch = t.name?.toLowerCase().includes(search) || 
                              t.description?.toLowerCase().includes(search) ||
                              t.id?.toLowerCase().includes(search);
        const matchesPlan = planFilter === 'all' || t.plan === planFilter || 
                           (planFilter === 'pro' && (t.plan === 'pro' || t.plan === 'premium'));
        const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
        const matchesCategory = categoryFilter === 'all' || 
                               (categoryFilter === 'portfolio' && t.isPortfolio === true) ||
                               (categoryFilter === 'standard' && t.isPortfolio !== true);
        return matchesSearch && matchesPlan && matchesStatus && matchesCategory;
    });
    
    currentPage = 1;
    renderTemplates();
}

// ============================================================
// 6. GENERATE TEMPLATE THUMBNAIL
// ============================================================

function generateTemplateThumbnail(template) {
    // If template has pages and elements, generate a simple thumbnail
    if (template.pages && template.pages.length > 0 && template.pages[0].elements) {
        const elements = template.pages[0].elements;
        const nameElement = elements.find(el => el.type === 'name');
        const jobElement = elements.find(el => el.type === 'jobtitle');
        const photoElement = elements.find(el => el.type === 'profilephoto');
        
        // Create a canvas thumbnail
        const canvas = document.createElement('canvas');
        canvas.width = 120;
        canvas.height = 160;
        const ctx = canvas.getContext('2d');
        
        // Background
        const bgColor = template.design?.bgColor || '#FFFFFF';
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, 120, 160);
        
        // Add a subtle border
        ctx.strokeStyle = '#E2E8F0';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, 120, 160);
        
        // Draw profile photo placeholder
        if (photoElement) {
            ctx.beginPath();
            ctx.arc(60, 30, 20, 0, 2 * Math.PI);
            ctx.fillStyle = '#E2E8F0';
            ctx.fill();
            ctx.strokeStyle = '#CBD5E1';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // Draw name
        const name = nameElement?.content || 'Your Name';
        ctx.fillStyle = template.design?.primaryColor || '#0F172A';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(name.substring(0, 12), 60, 65);
        
        // Draw job title
        const job = jobElement?.content || 'Job Title';
        ctx.fillStyle = '#64748B';
        ctx.font = '9px Inter, sans-serif';
        ctx.fillText(job.substring(0, 15), 60, 80);
        
        // Draw divider
        ctx.fillStyle = '#E2E8F0';
        ctx.fillRect(20, 88, 80, 1);
        
        // Draw some placeholder lines for content
        ctx.fillStyle = '#F1F5F9';
        for (let i = 0; i < 4; i++) {
            const y = 100 + (i * 14);
            const width = 80 - (i * 10);
            ctx.fillRect(20, y, width, 4);
        }
        
        // Draw "CV" or "Portfolio" badge
        const isPortfolio = template.category === 'portfolio' || template.isPortfolio;
        ctx.fillStyle = isPortfolio ? '#7C3AED' : '#2563EB';
        ctx.font = '7px Inter, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(80, 2, 35, 14);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 7px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(isPortfolio ? 'PORTFOLIO' : 'CV', 97, 12);
        
        return canvas.toDataURL('image/png');
    }
    
    // Fallback: return colored icon based on category
    const isPortfolio = template.category === 'portfolio' || template.isPortfolio;
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');
    
    const color = isPortfolio ? '#7C3AED' : '#2563EB';
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 120, 160);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '40px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isPortfolio ? '📁' : '📄', 60, 70);
    
    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillText(template.name || 'Template', 60, 115);
    
    return canvas.toDataURL('image/png');
}

// ============================================================
// 7. RENDER TEMPLATES
// ============================================================

function renderTemplates() {
    const tbody = document.getElementById('templatesTableBody');
    if (!tbody) return;
    
    const total = filteredTemplates.length;
    const totalPages = Math.ceil(total / perPage);
    const start = (currentPage - 1) * perPage;
    const end = Math.min(start + perPage, total);
    const pageTemplates = filteredTemplates.slice(start, end);
    
    if (pageTemplates.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="7" style="text-align:center;padding:40px;color:var(--gray-500);">
                <i class="fas fa-inbox" style="font-size:24px;display:block;margin-bottom:8px;"></i>
                No templates found
                <div style="font-size:12px;color:var(--gray-400);margin-top:4px;">
                    Try adjusting your filters or create a new template
                </div>
                <button class="btn btn-primary" onclick="window.location.href='visual-editor.html'" style="margin-top:12px;">
                    <i class="fas fa-plus"></i> Create Template
                </button>
            </td></tr>
        `;
    } else {
        tbody.innerHTML = pageTemplates.map(template => {
            const isPortfolio = template.isPortfolio || template.category === 'portfolio';
            const planLabel = template.plan === 'pro' || template.plan === 'premium' ? '⭐ Premium' : 'Free';
            const typeLabel = isPortfolio ? '🎨 Portfolio' : '📄 Standard';
            const planClass = template.plan === 'pro' || template.plan === 'premium' ? 'pro' : 'free';
            
            // Generate thumbnail
            let thumbnailHtml = '';
            try {
                const thumbnailData = generateTemplateThumbnail(template);
                thumbnailHtml = `<img src="${thumbnailData}" alt="${template.name}" style="width:60px;height:80px;object-fit:cover;border-radius:4px;border:1px solid var(--gray-200);">`;
            } catch (e) {
                thumbnailHtml = `<span style="font-size:30px;">${isPortfolio ? '📁' : '📄'}</span>`;
            }
            
            return `
                <tr>
                    <td>
                        <div class="template-preview-thumb" style="position:relative;width:60px;height:80px;display:flex;align-items:center;justify-content:center;background:var(--gray-100);border-radius:4px;overflow:hidden;">
                            ${thumbnailHtml}
                            ${isPortfolio ? `<span style="position:absolute;top:2px;right:2px;font-size:10px;background:rgba(124,58,237,0.8);color:white;padding:1px 6px;border-radius:3px;">PORT</span>` : ''}
                        </div>
                    </td>
                    <td>
                        <strong>${template.name || 'Untitled'}</strong>
                        ${isPortfolio ? ' <span style="color:#7C3AED;font-size:11px;font-weight:600;">🎨 Portfolio</span>' : ''}
                        <div style="font-size:12px;color:var(--gray-500);">${template.description || 'No description'}</div>
                        <div style="font-size:10px;color:var(--gray-400);">ID: ${template.id.substring(0, 8)}...</div>
                        <div style="font-size:10px;color:var(--gray-400);">Elements: ${template.pages?.[0]?.elements?.length || 0}</div>
                    </td>
                    <td>
                        <span class="status-badge" style="font-size:11px;">${typeLabel}</span>
                    </td>
                    <td>
                        <span class="plan-badge ${planClass}">
                            ${planLabel}
                        </span>
                    </td>
                    <td>
                        <span class="status-badge ${template.status || 'draft'}">
                            ${template.status || 'draft'}
                        </span>
                    </td>
                    <td style="font-size:12px;color:var(--gray-500);">
                        ${template.createdAt ? formatDate(template.createdAt) : 'N/A'}
                    </td>
                    <td>
                        <div class="action-group">
                            <!-- View/Preview -->
                            <button class="action-btn-sm edit" onclick="previewTemplate('${template.id}')" title="Preview Template" style="color:#2563EB;">
                                <i class="fas fa-eye"></i>
                            </button>
                            <!-- Edit -->
                            <button class="action-btn-sm edit" onclick="editTemplate('${template.id}')" title="Edit in Visual Editor" style="color:#2563EB;">
                                <i class="fas fa-edit"></i>
                            </button>
                            <!-- Duplicate -->
                            <button class="action-btn-sm duplicate" onclick="duplicateTemplate('${template.id}')" title="Duplicate" style="color:#7C3AED;">
                                <i class="fas fa-copy"></i>
                            </button>
                            <!-- Publish/Unpublish -->
                            ${template.status === 'published' ? `
                                <button class="action-btn-sm unpublish" onclick="togglePublish('${template.id}')" title="Unpublish" style="color:#F59E0B;">
                                    <i class="fas fa-eye-slash"></i>
                                </button>
                            ` : template.status === 'draft' ? `
                                <button class="action-btn-sm publish" onclick="togglePublish('${template.id}')" title="Publish" style="color:#10B981;">
                                    <i class="fas fa-eye"></i>
                                </button>
                            ` : ''}
                            <!-- Delete -->
                            <button class="action-btn-sm archive" onclick="confirmDelete('${template.id}')" title="Delete Template" style="color:#EF4444;">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    // Update pagination
    const paginationInfo = document.getElementById('paginationInfo');
    if (paginationInfo) {
        paginationInfo.textContent = 
            `Showing ${total > 0 ? start + 1 : 0}-${Math.min(end, total)} of ${total} templates`;
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
// 8. PREVIEW TEMPLATE
// ============================================================

function previewTemplate(id) {
    const template = allTemplates.find(t => t.id === id);
    if (!template) {
        showToast('Template not found', 'error');
        return;
    }
    
    // Open in preview modal
    const modal = document.getElementById('previewModal');
    if (!modal) {
        // Create modal if it doesn't exist
        createPreviewModal();
    }
    
    const content = document.getElementById('previewContent');
    if (content) {
        // Render a simple preview of the template
        content.innerHTML = `
            <div style="padding:20px;font-family:Inter,sans-serif;max-width:600px;margin:0 auto;">
                <div style="text-align:center;margin-bottom:20px;">
                    <div style="font-size:32px;font-weight:800;color:#0F172A;">${template.name || 'Untitled'}</div>
                    <div style="font-size:14px;color:#64748B;">${template.category || 'cv'} • ${template.plan || 'free'}</div>
                    <div style="font-size:12px;color:#94A3B8;margin-top:4px;">Status: ${template.status || 'draft'}</div>
                    <div style="font-size:12px;color:#94A3B8;">Elements: ${template.pages?.[0]?.elements?.length || 0}</div>
                </div>
                <div style="border-top:1px solid #E2E8F0;padding-top:16px;">
                    <h4 style="font-size:14px;font-weight:600;color:#0F172A;margin-bottom:8px;">Template Preview</h4>
                    <div style="background:#F8FAFC;border-radius:8px;padding:16px;border:1px solid #E2E8F0;min-height:200px;">
                        ${template.pages?.[0]?.elements?.map(el => `
                            <div style="padding:4px 0;font-size:13px;color:#475569;border-bottom:1px solid #F1F5F9;">
                                <span style="font-weight:500;color:#0F172A;">${el.type}:</span> 
                                ${el.content || el.field || '...'}
                                ${el.editable ? ' <span style="font-size:10px;color:#10B981;">✎ editable</span>' : ''}
                            </div>
                        `).join('') || '<div style="color:#94A3B8;">No elements found</div>'}
                    </div>
                </div>
                <div style="margin-top:16px;padding-top:16px;border-top:1px solid #E2E8F0;display:flex;gap:8px;">
                    <button class="btn btn-primary btn-sm" onclick="editTemplate('${template.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="closeModal('previewModal')">
                        Close
                    </button>
                </div>
            </div>
        `;
    }
    
    openModal('previewModal');
}

function createPreviewModal() {
    const modal = document.createElement('div');
    modal.id = 'previewModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content modal-lg">
            <div class="modal-header">
                <h3><i class="fas fa-eye"></i> Template Preview</h3>
                <button class="modal-close" onclick="closeModal('previewModal')">×</button>
            </div>
            <div class="modal-body" id="previewBody" style="max-height:70vh;overflow:auto;">
                <div id="previewContent"></div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// ============================================================
// 9. GO TO PAGE
// ============================================================

function goToPage(page) {
    currentPage = page;
    renderTemplates();
}

// ============================================================
// 10. EDIT TEMPLATE
// ============================================================

function editTemplate(id) {
    window.location.href = `visual-editor.html?id=${id}`;
}

// ============================================================
// 11. DUPLICATE TEMPLATE
// ============================================================

async function duplicateTemplate(id) {
    const dbInstance = getDB();
    if (!dbInstance) {
        showToast('Firestore not available', 'error');
        return;
    }
    
    try {
        const original = allTemplates.find(t => t.id === id);
        if (!original) {
            showToast('Template not found', 'error');
            return;
        }
        
        const newTemplate = {
            ...original,
            name: original.name + ' (Copy)',
            status: 'draft',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        delete newTemplate.id;
        
        await dbInstance.collection('templates').add(newTemplate);
        showToast('Template duplicated successfully');
        loadTemplates();
        
    } catch (error) {
        console.error('Error duplicating template:', error);
        showToast('Error duplicating template: ' + error.message, 'error');
    }
}

// ============================================================
// 12. TOGGLE PUBLISH
// ============================================================

async function togglePublish(id) {
    const dbInstance = getDB();
    if (!dbInstance) {
        showToast('Firestore not available', 'error');
        return;
    }
    
    try {
        const template = allTemplates.find(t => t.id === id);
        if (!template) return;
        
        const newStatus = template.status === 'published' ? 'draft' : 'published';
        
        await dbInstance.collection('templates').doc(id).update({
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast(`Template ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`);
        loadTemplates();
        
    } catch (error) {
        console.error('Error toggling publish:', error);
        showToast('Error updating template: ' + error.message, 'error');
    }
}

// ============================================================
// 13. CONFIRM DELETE
// ============================================================

function confirmDelete(id) {
    const template = allTemplates.find(t => t.id === id);
    if (!template) return;
    
    deleteTargetId = id;
    const nameEl = document.getElementById('deleteTemplateName');
    if (nameEl) nameEl.textContent = template.name || 'Untitled';
    
    // Update modal to show delete button
    const deleteBtn = document.getElementById('confirmDeleteBtn');
    if (deleteBtn) {
        deleteBtn.textContent = 'Delete Permanently';
        deleteBtn.className = 'btn btn-danger';
        deleteBtn.onclick = confirmDeletePermanent;
    }
    
    openModal('deleteModal');
}

// ============================================================
// 14. CONFIRM DELETE PERMANENT
// ============================================================

async function confirmDeletePermanent() {
    if (!deleteTargetId) return;
    
    const dbInstance = getDB();
    if (!dbInstance) {
        showToast('Firestore not available', 'error');
        return;
    }
    
    try {
        await dbInstance.collection('templates').doc(deleteTargetId).delete();
        showToast('Template deleted successfully');
        closeModal('deleteModal');
        loadTemplates();
        
    } catch (error) {
        console.error('Error deleting template:', error);
        showToast('Error deleting template: ' + error.message, 'error');
    }
    
    deleteTargetId = null;
}

// ============================================================
// 15. CONFIRM ARCHIVE (Archive instead of delete)
// ============================================================

async function confirmArchive() {
    if (!deleteTargetId) return;
    
    const dbInstance = getDB();
    if (!dbInstance) {
        showToast('Firestore not available', 'error');
        return;
    }
    
    try {
        await dbInstance.collection('templates').doc(deleteTargetId).update({
            status: 'archived',
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        showToast('Template archived successfully');
        closeModal('deleteModal');
        loadTemplates();
        
    } catch (error) {
        console.error('Error archiving template:', error);
        showToast('Error archiving template: ' + error.message, 'error');
    }
    
    deleteTargetId = null;
}

// ============================================================
// 16. RESET FILTERS
// ============================================================

function resetFilters() {
    const planFilter = document.getElementById('planFilter');
    const statusFilter = document.getElementById('statusFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const templateSearch = document.getElementById('templateSearch');
    
    if (planFilter) planFilter.value = 'all';
    if (statusFilter) statusFilter.value = 'all';
    if (categoryFilter) categoryFilter.value = 'all';
    if (templateSearch) templateSearch.value = '';
    
    applyFilters();
}

// ============================================================
// 17. FORMAT DATE
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
// 18. TOAST
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
// 19. MODAL
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
// 20. SEARCH & FILTER EVENTS
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('📁 Templates DOM loaded');
    
    if (typeof requireAuth === 'function') {
        if (!requireAuth()) return;
    }
    
    const templateSearch = document.getElementById('templateSearch');
    const planFilter = document.getElementById('planFilter');
    const statusFilter = document.getElementById('statusFilter');
    const categoryFilter = document.getElementById('categoryFilter');
    const prevPage = document.getElementById('prevPage');
    const nextPage = document.getElementById('nextPage');
    
    if (templateSearch) templateSearch.addEventListener('input', applyFilters);
    if (planFilter) planFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);
    if (categoryFilter) categoryFilter.addEventListener('change', applyFilters);
    
    if (prevPage) {
        prevPage.addEventListener('click', () => {
            if (currentPage > 1) { currentPage--; renderTemplates(); }
        });
    }
    
    if (nextPage) {
        nextPage.addEventListener('click', () => {
            const totalPages = Math.ceil(filteredTemplates.length / perPage);
            if (currentPage < totalPages) { currentPage++; renderTemplates(); }
        });
    }
    
    // Wait for Firebase to be ready
    let attempts = 0;
    const maxAttempts = 10;
    
    function tryLoad() {
        attempts++;
        const dbInstance = getDB();
        
        if (dbInstance) {
            loadTemplates();
        } else if (attempts < maxAttempts) {
            console.log(`⏳ Waiting for Firebase... (attempt ${attempts}/${maxAttempts})`);
            setTimeout(tryLoad, 500);
        } else {
            console.warn('⚠️ Firebase not ready after max attempts');
            renderFallbackTemplates();
        }
    }
    
    setTimeout(tryLoad, 300);
});

// ============================================================
// 21. EXPOSE
// ============================================================

window.editTemplate = editTemplate;
window.previewTemplate = previewTemplate;
window.duplicateTemplate = duplicateTemplate;
window.togglePublish = togglePublish;
window.confirmDelete = confirmDelete;
window.confirmDeletePermanent = confirmDeletePermanent;
window.confirmArchive = confirmArchive;
window.resetFilters = resetFilters;
window.goToPage = goToPage;
window.openModal = openModal;
window.closeModal = closeModal;
window.generateTemplateThumbnail = generateTemplateThumbnail;

console.log('✅ Templates module loaded');