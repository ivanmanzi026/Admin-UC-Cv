/**
 * ProCV - Visual Template Designer
 * Complete drag-and-drop template editor with component system
 * Supports: CV & Portfolio templates, Free & Premium plans, Image upload
 * ALL ELEMENTS ARE EDITABLE - Text, Components, Fields, Years, Images
 */

// ============================================================
// 1. STATE MANAGEMENT
// ============================================================

const STATE = {
    template: {
        id: null,
        name: 'New Template',
        category: 'cv',
        plan: 'free',
        status: 'draft',
        pageSize: 'A4',
        orientation: 'portrait',
        description: '',
        thumbnail: null,
        createdAt: null,
        updatedAt: null,
        pages: []
    },
    currentPageIndex: 0,
    selectedElementId: null,
    nextId: 1,
    zoom: 1,
    showGrid: true,
    snapEnabled: true,
    history: [],
    historyIndex: -1,
    isDragging: false,
    dragOffset: { x: 0, y: 0 },
    isResizing: false,
    resizeStart: { x: 0, y: 0, w: 0, h: 0 },
    isEditing: false,
    templateId: null,
    isSaving: false,
    isMobile: window.innerWidth <= 768,
    clipboard: null,
    maxHistory: 50,
    autoSaveTimer: null,
    uploadedImages: {},
    isUploadingImage: false
};

// ============================================================
// 2. FIREBASE INIT
// ============================================================

let db = null;

try {
    if (typeof firebase !== 'undefined' && typeof FIREBASE_CONFIG !== 'undefined') {
        if (!firebase.apps || !firebase.apps.length) {
            firebase.initializeApp(FIREBASE_CONFIG);
        }
        db = firebase.firestore();
        console.log('✅ Firebase initialized');
    } else {
        console.log('⚠️ Firebase not configured, using LocalStorage only');
    }
} catch (e) {
    console.log('⚠️ Firebase init error:', e.message);
}

// ============================================================
// 3. ID GENERATOR
// ============================================================

function generateId() {
    return 'el_' + String(STATE.nextId++).padStart(4, '0');
}

function generatePageId() {
    return 'page_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4);
}

// ============================================================
// 4. DEFAULT TEMPLATE
// ============================================================

function createDefaultTemplate() {
    const pageId = generatePageId();
    return {
        id: null,
        name: 'New Template',
        category: 'cv',
        plan: 'free',
        status: 'draft',
        pageSize: 'A4',
        orientation: 'portrait',
        description: '',
        thumbnail: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pages: [{
            id: pageId,
            name: 'Page 1',
            width: 794,
            height: 1123,
            elements: createDefaultElements()
        }]
    };
}

function createDefaultElements() {
    const elements = [
        {
            id: generateId(),
            type: 'name',
            content: 'YOUR NAME',
            field: 'personal.fullName',
            editable: true,
            locked: false,
            hidden: false,
            x: 50,
            y: 50,
            width: 694,
            height: 50,
            zIndex: 1,
            style: {
                fontFamily: 'Inter',
                fontSize: 32,
                fontWeight: '800',
                color: '#0F172A',
                textAlign: 'center',
                letterSpacing: 2
            }
        },
        {
            id: generateId(),
            type: 'jobtitle',
            content: 'Your Job Title',
            field: 'personal.jobTitle',
            editable: true,
            locked: false,
            hidden: false,
            x: 50,
            y: 105,
            width: 694,
            height: 30,
            zIndex: 1,
            style: {
                fontFamily: 'Inter',
                fontSize: 16,
                fontWeight: '500',
                color: '#64748B',
                textAlign: 'center'
            }
        },
        {
            id: generateId(),
            type: 'shape',
            shapeType: 'divider',
            content: '',
            editable: false,
            locked: false,
            hidden: false,
            x: 200,
            y: 145,
            width: 394,
            height: 2,
            zIndex: 1,
            style: {
                backgroundColor: '#2563EB'
            }
        },
        {
            id: generateId(),
            type: 'profilephoto',
            content: '',
            editable: false,
            locked: false,
            hidden: false,
            x: 347,
            y: 160,
            width: 100,
            height: 100,
            zIndex: 1,
            photoShape: 'circle',
            borderWidth: 3,
            borderColor: '#2563EB',
            style: {
                backgroundColor: '#F1F5F9'
            },
            imageData: null
        },
        {
            id: generateId(),
            type: 'field',
            fieldType: 'contact',
            content: '📧 {{email}}  |  📱 {{phone}}  |  📍 {{location}}',
            field: 'personal.contact',
            editable: true,
            locked: false,
            hidden: false,
            x: 50,
            y: 275,
            width: 694,
            height: 30,
            zIndex: 1,
            style: {
                fontFamily: 'Inter',
                fontSize: 13,
                fontWeight: '400',
                color: '#64748B',
                textAlign: 'center'
            }
        },
        {
            id: generateId(),
            type: 'field',
            fieldType: 'summary',
            content: 'Professional summary goes here. Describe your experience, skills, and career goals.',
            field: 'personal.summary',
            editable: true,
            locked: false,
            hidden: false,
            x: 50,
            y: 320,
            width: 694,
            height: 60,
            zIndex: 1,
            style: {
                fontFamily: 'Inter',
                fontSize: 13,
                fontWeight: '400',
                color: '#475569',
                lineHeight: 1.6,
                textAlign: 'left'
            }
        },
        {
            id: generateId(),
            type: 'heading',
            content: 'WORK EXPERIENCE',
            editable: false,
            locked: false,
            hidden: false,
            x: 50,
            y: 400,
            width: 694,
            height: 30,
            zIndex: 1,
            style: {
                fontFamily: 'Inter',
                fontSize: 16,
                fontWeight: '700',
                color: '#0F172A',
                textAlign: 'left',
                letterSpacing: 1
            }
        },
        {
            id: generateId(),
            type: 'shape',
            shapeType: 'divider',
            content: '',
            editable: false,
            locked: false,
            hidden: false,
            x: 50,
            y: 435,
            width: 694,
            height: 2,
            zIndex: 1,
            style: {
                backgroundColor: '#E2E8F0'
            }
        },
        {
            id: generateId(),
            type: 'component',
            componentType: 'experience',
            content: 'Experience',
            field: 'experience',
            editable: true,
            locked: false,
            hidden: false,
            x: 50,
            y: 450,
            width: 694,
            height: 220,
            zIndex: 1,
            componentData: {
                title: 'Experience',
                style: 'timeline',
                field: 'experience',
                items: [
                    { 
                        company: 'Company Name', 
                        position: 'Your Position', 
                        startDate: '2020', 
                        endDate: 'Present', 
                        description: 'Describe your role and achievements here.' 
                    },
                    { 
                        company: 'Previous Company', 
                        position: 'Previous Role', 
                        startDate: '2016', 
                        endDate: '2020', 
                        description: 'Describe your previous role and achievements here.' 
                    }
                ]
            }
        },
        {
            id: generateId(),
            type: 'heading',
            content: 'EDUCATION',
            editable: false,
            locked: false,
            hidden: false,
            x: 50,
            y: 690,
            width: 694,
            height: 30,
            zIndex: 1,
            style: {
                fontFamily: 'Inter',
                fontSize: 16,
                fontWeight: '700',
                color: '#0F172A',
                textAlign: 'left',
                letterSpacing: 1
            }
        },
        {
            id: generateId(),
            type: 'shape',
            shapeType: 'divider',
            content: '',
            editable: false,
            locked: false,
            hidden: false,
            x: 50,
            y: 725,
            width: 694,
            height: 2,
            zIndex: 1,
            style: {
                backgroundColor: '#E2E8F0'
            }
        },
        {
            id: generateId(),
            type: 'component',
            componentType: 'education',
            content: 'Education',
            field: 'education',
            editable: true,
            locked: false,
            hidden: false,
            x: 50,
            y: 740,
            width: 694,
            height: 140,
            zIndex: 1,
            componentData: {
                title: 'Education',
                style: 'classic',
                field: 'education',
                items: [
                    { 
                        school: 'University Name', 
                        degree: 'Your Degree', 
                        field: 'Field of Study', 
                        startDate: '2014', 
                        endDate: '2018', 
                        description: 'Additional details about your education.' 
                    }
                ]
            }
        },
        {
            id: generateId(),
            type: 'component',
            componentType: 'skills',
            content: 'Skills',
            field: 'skills',
            editable: true,
            locked: false,
            hidden: false,
            x: 50,
            y: 900,
            width: 694,
            height: 130,
            zIndex: 1,
            componentData: {
                title: 'SKILLS',
                style: 'bars',
                field: 'skills',
                items: [
                    { name: 'Skill 1', level: 90 },
                    { name: 'Skill 2', level: 75 },
                    { name: 'Skill 3', level: 60 },
                    { name: 'Skill 4', level: 45 }
                ]
            }
        }
    ];
    
    STATE.nextId = elements.length + 1;
    return elements;
}

// ============================================================
// 5. CATEGORY MANAGEMENT
// ============================================================

function toggleCategory() {
    const current = STATE.template.category || 'cv';
    const newCategory = current === 'cv' ? 'portfolio' : 'cv';
    setCategory(newCategory);
}

function setCategory(category) {
    STATE.template.category = category;
    updateCategoryBadge(category);
    updateCategoryButtons(category);
    showToast(`Category: ${category.toUpperCase()}`);
    autoSave();
}

function updateCategoryBadge(category) {
    const badge = document.getElementById('categoryBadge');
    if (badge) {
        const icons = { cv: '📄', portfolio: '📁' };
        const labels = { cv: 'CV', portfolio: 'Portfolio' };
        badge.textContent = `${icons[category] || '📄'} ${labels[category] || 'CV'}`;
        badge.className = 'plan-badge ' + category;
    }
}

function updateCategoryButtons(category) {
    const cvBtn = document.getElementById('cvCategoryBtn');
    const portfolioBtn = document.getElementById('portfolioCategoryBtn');
    if (cvBtn && portfolioBtn) {
        cvBtn.className = `btn btn-sm ${category === 'cv' ? 'btn-primary' : 'btn-secondary'}`;
        portfolioBtn.className = `btn btn-sm ${category === 'portfolio' ? 'btn-primary' : 'btn-secondary'}`;
    }
}

// ============================================================
// 6. IMAGE UPLOAD - FIXED!
// ============================================================

function uploadProfileImage() {
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    document.body.appendChild(input);
    
    input.onchange = function(e) {
        const file = this.files[0];
        if (!file) return;
        
        // Show loading state
        showToast('Uploading image...', 'info');
        
        const reader = new FileReader();
        reader.onload = function(event) {
            const imageData = event.target.result;
            
            // Find the profile photo element or create one
            const page = getCurrentPage();
            let photoEl = page.elements.find(el => el.type === 'profilephoto');
            
            if (photoEl) {
                // Update existing photo
                photoEl.imageData = imageData;
                STATE.selectedElementId = photoEl.id;
                renderAll();
                showToast('✅ Image uploaded successfully!');
                autoSave();
            } else {
                // Create new profile photo at center
                const el = {
                    id: generateId(),
                    type: 'profilephoto',
                    content: '',
                    editable: false,
                    locked: false,
                    hidden: false,
                    x: (page.width / 2) - 50,
                    y: 50,
                    width: 100,
                    height: 100,
                    zIndex: page.elements.length + 1,
                    photoShape: 'circle',
                    borderWidth: 3,
                    borderColor: '#2563EB',
                    style: {
                        backgroundColor: '#F1F5F9'
                    },
                    imageData: imageData
                };
                page.elements.push(el);
                STATE.selectedElementId = el.id;
                renderAll();
                showToast('✅ Image uploaded and added to canvas!');
                autoSave();
            }
        };
        reader.readAsDataURL(file);
        document.body.removeChild(input);
    };
    
    input.click();
}

function uploadImageForElement(elementId) {
    const el = getElement(elementId);
    if (!el || el.type !== 'profilephoto') return;
    
    // Create file input
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';
    document.body.appendChild(input);
    
    input.onchange = function(e) {
        const file = this.files[0];
        if (!file) return;
        
        showToast('Uploading image...', 'info');
        
        const reader = new FileReader();
        reader.onload = function(event) {
            el.imageData = event.target.result;
            renderAll();
            showToast('✅ Image updated successfully!');
            autoSave();
        };
        reader.readAsDataURL(file);
        document.body.removeChild(input);
    };
    
    input.click();
}

// ============================================================
// 7. INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('=== ProCV Visual Editor Loading ===');
    
    if (typeof requireAuth === 'function') {
        if (!requireAuth()) return;
    }
    
    const params = new URLSearchParams(window.location.search);
    const templateId = params.get('id');
    
    if (templateId) {
        STATE.isEditing = true;
        STATE.templateId = templateId;
        loadTemplate(templateId);
    } else {
        STATE.template = createDefaultTemplate();
        STATE.template.id = 'temp_' + Date.now();
        document.getElementById('templateNameInput').value = 'New Template';
        updatePlanBadge('free');
        updateCategoryBadge('cv');
        updateStatusBar();
        renderAll();
    }
    
    setupDragAndDrop();
    setupCanvasEvents();
    setupDesignControls();
    setupTabs();
    setupMobileControls();
    setupResizeObserver();
    
    document.getElementById('templateNameInput').addEventListener('input', function() {
        STATE.template.name = this.value || 'Untitled';
        updateStatusBar();
        autoSave();
    });
    
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    STATE.autoSaveTimer = setInterval(autoSave, 10000);
    
    console.log('✅ Editor ready');
    console.log('📄 Template:', STATE.template.name);
    console.log('📊 Elements:', getCurrentPage().elements.length);
    console.log('💾 Auto-save enabled (10s)');
});

// ============================================================
// 8. PAGE MANAGEMENT
// ============================================================

function getCurrentPage() {
    return STATE.template.pages[STATE.currentPageIndex] || STATE.template.pages[0];
}

function getPageElements() {
    return getCurrentPage().elements || [];
}

function addPage() {
    const newPage = {
        id: generatePageId(),
        name: `Page ${STATE.template.pages.length + 1}`,
        width: 794,
        height: 1123,
        elements: []
    };
    
    STATE.template.pages.push(newPage);
    STATE.currentPageIndex = STATE.template.pages.length - 1;
    STATE.selectedElementId = null;
    
    renderAll();
    showToast('Page added');
    autoSave();
}

function deletePage(index) {
    if (STATE.template.pages.length <= 1) {
        showToast('Cannot delete the last page', 'error');
        return;
    }
    
    if (!confirm(`Delete "${STATE.template.pages[index].name}"?`)) return;
    
    STATE.template.pages.splice(index, 1);
    if (STATE.currentPageIndex >= STATE.template.pages.length) {
        STATE.currentPageIndex = STATE.template.pages.length - 1;
    }
    STATE.selectedElementId = null;
    
    renderAll();
    showToast('Page deleted');
    autoSave();
}

function switchPage(index) {
    if (index < 0 || index >= STATE.template.pages.length) return;
    STATE.currentPageIndex = index;
    STATE.selectedElementId = null;
    renderAll();
    updatePageDisplay();
}

function duplicatePage(index) {
    const original = STATE.template.pages[index];
    if (!original) return;
    
    const newPage = JSON.parse(JSON.stringify(original));
    newPage.id = generatePageId();
    newPage.name = original.name + ' (Copy)';
    
    newPage.elements = newPage.elements.map(el => {
        el.id = generateId();
        if (el.type === 'profilephoto') {
            el.imageData = null;
        }
        return el;
    });
    
    STATE.template.pages.splice(index + 1, 0, newPage);
    STATE.currentPageIndex = index + 1;
    STATE.selectedElementId = null;
    
    renderAll();
    showToast('Page duplicated');
    autoSave();
}

function renamePage(index, newName) {
    if (index < 0 || index >= STATE.template.pages.length) return;
    STATE.template.pages[index].name = newName || `Page ${index + 1}`;
    renderAll();
    autoSave();
}

function updatePageDisplay() {
    const display = document.getElementById('pageDisplay');
    if (display) {
        display.textContent = `Page ${STATE.currentPageIndex + 1} of ${STATE.template.pages.length}`;
    }
}

// ============================================================
// 9. ELEMENT CRUD
// ============================================================

function addElement(elementData) {
    const page = getCurrentPage();
    const el = {
        id: generateId(),
        ...elementData,
        zIndex: page.elements.length + 1
    };
    page.elements.push(el);
    STATE.selectedElementId = el.id;
    renderAll();
    autoSave();
    return el;
}

function deleteElement(id) {
    const page = getCurrentPage();
    const index = page.elements.findIndex(el => el.id === id);
    if (index === -1) return;
    
    if (!confirm('Delete this element?')) return;
    
    page.elements.splice(index, 1);
    if (STATE.selectedElementId === id) {
        STATE.selectedElementId = null;
    }
    renderAll();
    showToast('Element deleted');
    autoSave();
}

function duplicateElement(id) {
    const page = getCurrentPage();
    const original = page.elements.find(el => el.id === id);
    if (!original) return;
    
    const copy = JSON.parse(JSON.stringify(original));
    copy.id = generateId();
    copy.x += 20;
    copy.y += 20;
    copy.zIndex = page.elements.length + 1;
    
    if (copy.type === 'profilephoto') {
        copy.imageData = null;
    }
    
    page.elements.push(copy);
    STATE.selectedElementId = copy.id;
    renderAll();
    showToast('Element duplicated');
    autoSave();
}

function getElement(id) {
    const page = getCurrentPage();
    return page.elements.find(el => el.id === id);
}

function updateElement(id, updates) {
    const el = getElement(id);
    if (el) {
        Object.assign(el, updates);
        renderAll();
        autoSave();
        return true;
    }
    return false;
}

function updateElementProperty(id, key, value) {
    const el = getElement(id);
    if (el) {
        if (key.includes('.')) {
            const parts = key.split('.');
            let obj = el;
            for (let i = 0; i < parts.length - 1; i++) {
                if (!obj[parts[i]]) obj[parts[i]] = {};
                obj = obj[parts[i]];
            }
            obj[parts[parts.length - 1]] = value;
        } else {
            el[key] = value;
        }
        renderAll();
        autoSave();
        return true;
    }
    return false;
}

// ============================================================
// 10. RENDER ENGINE
// ============================================================

function renderAll() {
    renderCanvas();
    renderLayers();
    renderProperties();
    renderPages();
    updateStatusBar();
    updateElementCount();
    updatePageDisplay();
    saveHistory();
}

function renderCanvas() {
    const canvas = document.getElementById('a4Page');
    if (!canvas) return;
    
    canvas.innerHTML = '';
    const page = getCurrentPage();
    if (!page) return;
    
    canvas.style.backgroundColor = STATE.template.design?.bgColor || '#FFFFFF';
    canvas.style.width = page.width + 'px';
    canvas.style.height = page.height + 'px';
    
    const sorted = [...page.elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    
    sorted.forEach(el => {
        if (el.hidden) return;
        const div = createElementDOM(el);
        canvas.appendChild(div);
    });
    
    const scale = STATE.zoom;
    canvas.style.transform = `scale(${scale})`;
    canvas.style.transformOrigin = 'top center';
}

function createElementDOM(el) {
    const div = document.createElement('div');
    div.className = `cv-element ${el.type}`;
    div.dataset.id = el.id;
    
    div.style.left = (el.x || 0) + 'px';
    div.style.top = (el.y || 0) + 'px';
    div.style.width = (el.width || 100) + 'px';
    div.style.height = (el.height || 40) + 'px';
    
    const style = el.style || {};
    if (style.fontFamily) div.style.fontFamily = style.fontFamily;
    if (style.fontSize) div.style.fontSize = style.fontSize + 'px';
    if (style.fontWeight) div.style.fontWeight = style.fontWeight;
    if (style.color) div.style.color = style.color;
    if (style.backgroundColor) div.style.backgroundColor = style.backgroundColor;
    if (style.textAlign) div.style.textAlign = style.textAlign;
    if (style.lineHeight) div.style.lineHeight = style.lineHeight;
    if (style.letterSpacing) div.style.letterSpacing = style.letterSpacing + 'px';
    if (style.border) div.style.border = style.border;
    if (style.borderRadius) div.style.borderRadius = style.borderRadius + 'px';
    if (style.opacity !== undefined) div.style.opacity = style.opacity;
    
    if (el.rotation) {
        div.style.transform = `rotate(${el.rotation}deg)`;
    }
    
    // SHAPE
    if (el.type === 'shape') {
        if (el.shapeType === 'rectangle') {
            div.style.borderRadius = '0';
        } else if (el.shapeType === 'circle') {
            div.style.borderRadius = '50%';
        } else if (el.shapeType === 'rounded') {
            div.style.borderRadius = '12px';
        } else if (el.shapeType === 'divider') {
            div.style.height = '2px';
            div.style.background = style.backgroundColor || '#E2E8F0';
            div.style.border = 'none';
            div.style.padding = '0';
        }
        if (style.backgroundColor) div.style.background = style.backgroundColor;
        if (style.border) div.style.border = style.border;
        if (el.shapeType === 'divider') {
            div.innerHTML = '';
        }
    }
    
    // PROFILE PHOTO - FIXED!
    if (el.type === 'profilephoto') {
        const shape = el.photoShape || 'circle';
        if (shape === 'circle') div.style.borderRadius = '50%';
        else if (shape === 'square') div.style.borderRadius = '0';
        else if (shape === 'rounded') div.style.borderRadius = '12px';
        
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.overflow = 'hidden';
        div.style.background = style.backgroundColor || '#F1F5F9';
        div.style.position = 'relative';
        div.style.cursor = 'pointer';
        
        if (el.borderWidth) {
            div.style.border = `${el.borderWidth}px solid ${el.borderColor || '#E2E8F0'}`;
        }
        
        // Image or placeholder
        if (el.imageData) {
            const img = document.createElement('img');
            img.src = el.imageData;
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'cover';
            img.draggable = false;
            div.appendChild(img);
        } else {
            const icon = document.createElement('i');
            icon.className = 'fas fa-user-circle';
            icon.style.cssText = `
                font-size: ${Math.min(el.width || 100, el.height || 100) * 0.6}px;
                color: #CBD5E1;
            `;
            div.appendChild(icon);
        }
        
        // Upload button overlay - FIXED: Click only this button triggers upload
        const uploadBtn = document.createElement('button');
        uploadBtn.className = 'image-upload-btn';
        uploadBtn.innerHTML = '<i class="fas fa-camera"></i>';
        uploadBtn.style.cssText = `
            position: absolute;
            bottom: 4px;
            right: 4px;
            background: var(--primary);
            color: white;
            border: none;
            border-radius: 50%;
            width: 28px;
            height: 28px;
            cursor: pointer;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 10;
            transition: transform 0.2s ease;
        `;
        uploadBtn.onmouseenter = () => { uploadBtn.style.transform = 'scale(1.1)'; };
        uploadBtn.onmouseleave = () => { uploadBtn.style.transform = 'scale(1)'; };
        uploadBtn.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            uploadImageForElement(el.id);
        };
        div.appendChild(uploadBtn);
        
        // Make the whole div clickable for selection, but NOT for upload
        div.onclick = (e) => {
            // Only select if not clicking the upload button
            if (!e.target.closest('.image-upload-btn')) {
                selectElement(el.id);
            }
        };
    }
    
    // ICON
    if (el.type === 'icon') {
        const iconName = el.iconName || 'fa-star';
        div.innerHTML = `<i class="fas ${iconName}"></i>`;
        div.style.display = 'flex';
        div.style.alignItems = 'center';
        div.style.justifyContent = 'center';
        div.style.fontSize = Math.min(el.width || 40, el.height || 40) * 0.8 + 'px';
        div.style.color = style.color || '#64748B';
    }
    
    // COMPONENT
    if (el.type === 'component') {
        div.innerHTML = renderComponentPreview(el);
        div.style.background = style.backgroundColor || 'rgba(37, 99, 235, 0.02)';
        div.style.border = style.border || '1px dashed #E2E8F0';
        div.style.padding = '8px';
        div.style.overflow = 'hidden';
        div.style.cursor = 'default';
    }
    
    // FIELD
    if (el.type === 'field') {
        const fieldName = el.field || el.fieldType || 'field';
        div.textContent = el.content || `{{${fieldName}}}`;
        div.style.color = '#64748B';
        div.style.fontStyle = 'italic';
        div.style.opacity = '0.8';
    }
    
    // TEXT elements
    if (!el.type || ['text', 'heading', 'subheading', 'paragraph', 'name', 'jobtitle'].includes(el.type)) {
        div.textContent = el.content || 'Text';
        if (!el.style?.color) {
            div.style.color = '#1a1a1a';
        }
    }
    
    // Selection state
    if (STATE.selectedElementId === el.id && !el.locked) {
        div.classList.add('selected');
    }
    
    // Click to select - FIXED: Only for non-profilephoto elements (handled above)
    if (el.type !== 'profilephoto') {
        div.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!el.locked) selectElement(el.id);
        });
    }
    
    // Double-click to edit content
    div.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        if (!el.locked && el.editable !== false) {
            editElementContent(el.id);
        }
    });
    
    // Drag
    if (!el.locked) {
        div.addEventListener('mousedown', (e) => {
            if (e.target.closest('.element-delete') || 
                e.target.closest('.element-drag-handle') ||
                e.target.closest('.element-handle') ||
                e.target.closest('.image-upload-btn')) return;
            startDrag(e, el.id);
        });
        
        div.addEventListener('touchstart', (e) => {
            if (e.target.closest('.element-delete') || 
                e.target.closest('.element-drag-handle') ||
                e.target.closest('.element-handle') ||
                e.target.closest('.image-upload-btn')) return;
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousedown', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            startDrag(mouseEvent, el.id);
        }, { passive: true });
    }
    
    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'element-delete';
    deleteBtn.innerHTML = '×';
    deleteBtn.setAttribute('aria-label', 'Delete element');
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!el.locked) deleteElement(el.id);
    });
    div.appendChild(deleteBtn);
    
    // Drag handle
    const dragHandle = document.createElement('button');
    dragHandle.className = 'element-drag-handle';
    dragHandle.innerHTML = '⣿';
    dragHandle.setAttribute('aria-label', 'Drag element');
    dragHandle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        if (!el.locked) startDrag(e, el.id);
    });
    div.appendChild(dragHandle);
    
    // Resize handle
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'element-handle';
    resizeHandle.setAttribute('aria-label', 'Resize element');
    resizeHandle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e.preventDefault();
        if (!el.locked) startResize(e, el.id);
    });
    div.appendChild(resizeHandle);
    
    return div;
}

function renderComponentPreview(el) {
    const data = el.componentData || {};
    const title = data.title || el.componentType?.charAt(0).toUpperCase() + el.componentType?.slice(1) || 'Component';
    const items = data.items || [];
    const style = data.style || 'classic';
    const field = data.field || el.field || '';
    
    let html = `<div style="font-weight:600;font-size:14px;color:#0F172A;margin-bottom:8px;display:flex;justify-content:space-between;align-items:center;">
        <span>${title}</span>
        <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation();editComponentData('${el.id}')" style="font-size:10px;padding:2px 8px;">
            <i class="fas fa-edit"></i> Edit
        </button>
    </div>`;
    
    switch(el.componentType) {
        case 'experience':
            if (items.length === 0) {
                html += `<div style="font-size:13px;color:#94A3B8;font-style:italic;">Click Edit to add experience</div>`;
            } else {
                items.forEach((item, index) => {
                    html += `
                        <div style="margin-bottom:10px;padding:6px;background:#F8FAFC;border-radius:4px;border-left:3px solid var(--primary);">
                            <div style="display:flex;justify-content:space-between;font-weight:500;font-size:13px;">
                                <span>${item.company || 'Company'}</span>
                                <span style="font-weight:400;color:#64748B;font-size:12px;">${item.startDate || ''} - ${item.endDate || ''}</span>
                            </div>
                            <div style="font-size:12px;color:#475569;font-weight:500;">${item.position || 'Position'}</div>
                            <div style="font-size:12px;color:#64748B;">${item.description || 'Description'}</div>
                        </div>
                    `;
                });
            }
            break;
        case 'education':
            if (items.length === 0) {
                html += `<div style="font-size:13px;color:#94A3B8;font-style:italic;">Click Edit to add education</div>`;
            } else {
                items.forEach((item, index) => {
                    html += `
                        <div style="margin-bottom:8px;padding:6px;background:#F8FAFC;border-radius:4px;border-left:3px solid var(--primary);">
                            <div style="display:flex;justify-content:space-between;font-weight:500;font-size:13px;">
                                <span>${item.school || 'School'}</span>
                                <span style="font-weight:400;color:#64748B;font-size:12px;">${item.startDate || ''} - ${item.endDate || ''}</span>
                            </div>
                            <div style="font-size:12px;color:#475569;">${item.degree || ''} ${item.field ? '- ' + item.field : ''}</div>
                            ${item.description ? `<div style="font-size:12px;color:#64748B;">${item.description}</div>` : ''}
                        </div>
                    `;
                });
            }
            break;
        case 'skills':
        case 'skillbars':
            if (items.length === 0) {
                html += `<div style="font-size:13px;color:#94A3B8;font-style:italic;">Click Edit to add skills</div>`;
            } else {
                if (style === 'bars') {
                    items.forEach((item, index) => {
                        const level = item.level || 50;
                        html += `
                            <div style="margin-bottom:4px;">
                                <div style="display:flex;justify-content:space-between;font-size:12px;">
                                    <span>${item.name || 'Skill'}</span>
                                    <span>${level}%</span>
                                </div>
                                <div style="height:6px;background:#F1F5F9;border-radius:3px;overflow:hidden;">
                                    <div style="height:100%;width:${level}%;background:var(--primary);border-radius:3px;"></div>
                                </div>
                            </div>
                        `;
                    });
                } else {
                    html += `<div style="display:flex;flex-wrap:wrap;gap:6px;">`;
                    items.forEach((item, index) => {
                        html += `<span style="background:#F1F5F9;padding:4px 12px;border-radius:4px;font-size:12px;color:#475569;">${item.name || 'Skill'}</span>`;
                    });
                    html += `</div>`;
                }
            }
            break;
        case 'projects':
            if (items.length === 0) {
                html += `<div style="font-size:13px;color:#94A3B8;font-style:italic;">Click Edit to add projects</div>`;
            } else {
                items.forEach((item, index) => {
                    html += `
                        <div style="margin-bottom:8px;padding:6px;background:#F8FAFC;border-radius:4px;">
                            <div style="font-weight:500;font-size:13px;">${item.name || 'Project'}</div>
                            <div style="font-size:12px;color:#64748B;">${item.description || 'Description'}</div>
                            ${item.technologies ? `<div style="font-size:11px;color:#94A3B8;">${item.technologies}</div>` : ''}
                        </div>
                    `;
                });
            }
            break;
        case 'languages':
            if (items.length === 0) {
                html += `<div style="font-size:13px;color:#94A3B8;font-style:italic;">Click Edit to add languages</div>`;
            } else {
                items.forEach((item, index) => {
                    html += `
                        <div style="font-size:13px;color:#475569;padding:2px 0;">${item.language || 'Language'} — <span style="color:#64748B;">${item.proficiency || 'Level'}</span></div>
                    `;
                });
            }
            break;
        case 'certifications':
            if (items.length === 0) {
                html += `<div style="font-size:13px;color:#94A3B8;font-style:italic;">Click Edit to add certifications</div>`;
            } else {
                items.forEach((item, index) => {
                    html += `<div style="font-size:13px;color:#475569;padding:2px 0;">• ${item.name || 'Certification'}</div>`;
                });
            }
            break;
        case 'timeline':
            if (items.length === 0) {
                html += `<div style="font-size:13px;color:#94A3B8;font-style:italic;">Click Edit to add timeline items</div>`;
            } else {
                items.forEach((item, index) => {
                    html += `
                        <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:6px;">
                            <div style="display:flex;flex-direction:column;align-items:center;">
                                <div style="width:12px;height:12px;border-radius:50%;background:${index === 0 ? 'var(--primary)' : '#E2E8F0'};"></div>
                                ${index < items.length - 1 ? `<div style="width:2px;height:20px;background:#E2E8F0;"></div>` : ''}
                            </div>
                            <div>
                                <div style="font-weight:500;font-size:13px;">${item.date || 'Date'}</div>
                                <div style="font-size:12px;color:#64748B;">${item.title || 'Title'}</div>
                            </div>
                        </div>
                    `;
                });
            }
            break;
        case 'profile':
            html += `
                <div style="font-size:13px;color:#475569;line-height:1.6;padding:4px;background:#F8FAFC;border-radius:4px;border-left:3px solid var(--primary);">
                    ${el.content || 'Click to edit profile text...'}
                </div>
            `;
            break;
        default:
            html += `<div style="font-size:13px;color:#64748B;">${title} component</div>`;
    }
    
    if (field && el.componentType !== 'profile') {
        html += `<div style="margin-top:4px;font-size:10px;color:#94A3B8;font-style:italic;">Field: ${field}</div>`;
    }
    
    return html;
}

// ============================================================
// 11. COMPONENT DATA EDITING
// ============================================================

function editComponentData(elementId) {
    const el = getElement(elementId);
    if (!el || el.type !== 'component') return;
    
    const data = el.componentData || {};
    const items = data.items || [];
    const type = el.componentType || 'experience';
    
    window._editingComponentId = elementId;
    
    let modalHTML = `
        <div style="max-height:60vh;overflow-y:auto;">
            <h4 style="margin-bottom:12px;">Edit ${data.title || type}</h4>
            <div id="componentItemsContainer">
    `;
    
    if (items.length === 0) {
        modalHTML += `<p class="help-text">No items yet. Add your first item below.</p>`;
    } else {
        items.forEach((item, index) => {
            modalHTML += renderComponentItemForm(type, item, index);
        });
    }
    
    modalHTML += `
            </div>
            <button class="btn btn-sm btn-secondary" onclick="addComponentItem('${elementId}')" style="margin-top:8px;">
                <i class="fas fa-plus"></i> Add Item
            </button>
            <div style="margin-top:12px;display:flex;gap:8px;">
                <button class="btn btn-sm btn-primary" onclick="saveComponentData('${elementId}')">
                    <i class="fas fa-save"></i> Save
                </button>
                <button class="btn btn-sm btn-secondary" onclick="closeModal('componentEditModal')">
                    Cancel
                </button>
            </div>
        </div>
    `;
    
    let modal = document.getElementById('componentEditModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'componentEditModal';
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width:600px;">
                <div class="modal-header">
                    <h3>Edit Component</h3>
                    <button class="modal-close" onclick="closeModal('componentEditModal')">×</button>
                </div>
                <div class="modal-body" id="componentEditBody">
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    document.getElementById('componentEditBody').innerHTML = modalHTML;
    openModal('componentEditModal');
}

function renderComponentItemForm(type, item, index) {
    let html = `<div class="component-item-form" data-index="${index}" style="border:1px solid var(--gray-200);border-radius:6px;padding:12px;margin-bottom:8px;position:relative;">`;
    
    html += `
        <button class="btn btn-sm btn-danger" onclick="removeComponentItem(${index})" style="position:absolute;top:4px;right:4px;padding:2px 6px;font-size:10px;z-index:10;">×</button>
    `;
    
    switch(type) {
        case 'experience':
            html += `
                <div class="properties-row">
                    <div class="properties-group">
                        <label>Company</label>
                        <input type="text" class="comp-field" data-field="company" value="${item.company || ''}" placeholder="Company Name">
                    </div>
                    <div class="properties-group">
                        <label>Position</label>
                        <input type="text" class="comp-field" data-field="position" value="${item.position || ''}" placeholder="Your Position">
                    </div>
                </div>
                <div class="properties-row">
                    <div class="properties-group">
                        <label>Start Date</label>
                        <input type="text" class="comp-field" data-field="startDate" value="${item.startDate || ''}" placeholder="2020">
                    </div>
                    <div class="properties-group">
                        <label>End Date</label>
                        <input type="text" class="comp-field" data-field="endDate" value="${item.endDate || ''}" placeholder="Present">
                    </div>
                </div>
                <div class="properties-group">
                    <label>Description</label>
                    <textarea class="comp-field" data-field="description" rows="2" placeholder="Describe your role...">${item.description || ''}</textarea>
                </div>
            `;
            break;
        case 'education':
            html += `
                <div class="properties-row">
                    <div class="properties-group">
                        <label>School</label>
                        <input type="text" class="comp-field" data-field="school" value="${item.school || ''}" placeholder="University Name">
                    </div>
                    <div class="properties-group">
                        <label>Degree</label>
                        <input type="text" class="comp-field" data-field="degree" value="${item.degree || ''}" placeholder="Your Degree">
                    </div>
                </div>
                <div class="properties-row">
                    <div class="properties-group">
                        <label>Field</label>
                        <input type="text" class="comp-field" data-field="field" value="${item.field || ''}" placeholder="Field of Study">
                    </div>
                    <div class="properties-group">
                        <label>Year</label>
                        <input type="text" class="comp-field" data-field="year" value="${item.year || ''}" placeholder="2018">
                    </div>
                </div>
                <div class="properties-group">
                    <label>Description</label>
                    <textarea class="comp-field" data-field="description" rows="2" placeholder="Additional details...">${item.description || ''}</textarea>
                </div>
            `;
            break;
        case 'skills':
        case 'skillbars':
            html += `
                <div class="properties-row">
                    <div class="properties-group">
                        <label>Skill Name</label>
                        <input type="text" class="comp-field" data-field="name" value="${item.name || ''}" placeholder="Skill Name">
                    </div>
                    <div class="properties-group">
                        <label>Level (%)</label>
                        <input type="number" class="comp-field" data-field="level" value="${item.level || 50}" min="0" max="100" placeholder="50">
                    </div>
                </div>
            `;
            break;
        case 'projects':
            html += `
                <div class="properties-group">
                    <label>Project Name</label>
                    <input type="text" class="comp-field" data-field="name" value="${item.name || ''}" placeholder="Project Name">
                </div>
                <div class="properties-group">
                    <label>Description</label>
                    <textarea class="comp-field" data-field="description" rows="2" placeholder="Project description...">${item.description || ''}</textarea>
                </div>
                <div class="properties-group">
                    <label>Technologies</label>
                    <input type="text" class="comp-field" data-field="technologies" value="${item.technologies || ''}" placeholder="Tech used">
                </div>
            `;
            break;
        case 'languages':
            html += `
                <div class="properties-row">
                    <div class="properties-group">
                        <label>Language</label>
                        <input type="text" class="comp-field" data-field="language" value="${item.language || ''}" placeholder="English">
                    </div>
                    <div class="properties-group">
                        <label>Proficiency</label>
                        <input type="text" class="comp-field" data-field="proficiency" value="${item.proficiency || ''}" placeholder="Native">
                    </div>
                </div>
            `;
            break;
        case 'certifications':
            html += `
                <div class="properties-group">
                    <label>Certification Name</label>
                    <input type="text" class="comp-field" data-field="name" value="${item.name || ''}" placeholder="Certification Name">
                </div>
                <div class="properties-group">
                    <label>Issuer</label>
                    <input type="text" class="comp-field" data-field="issuer" value="${item.issuer || ''}" placeholder="Issuing Organization">
                </div>
            `;
            break;
        case 'timeline':
            html += `
                <div class="properties-row">
                    <div class="properties-group">
                        <label>Date</label>
                        <input type="text" class="comp-field" data-field="date" value="${item.date || ''}" placeholder="2020">
                    </div>
                    <div class="properties-group">
                        <label>Title</label>
                        <input type="text" class="comp-field" data-field="title" value="${item.title || ''}" placeholder="Event Title">
                    </div>
                </div>
            `;
            break;
        default:
            html += `<p>Unknown component type</p>`;
    }
    
    html += `</div>`;
    return html;
}

function addComponentItem(elementId) {
    const el = getElement(elementId);
    if (!el || el.type !== 'component') return;
    
    const data = el.componentData || {};
    const items = data.items || [];
    const type = el.componentType || 'experience';
    
    let newItem = {};
    switch(type) {
        case 'experience':
            newItem = { company: '', position: '', startDate: '', endDate: '', description: '' };
            break;
        case 'education':
            newItem = { school: '', degree: '', field: '', year: '', description: '' };
            break;
        case 'skills':
        case 'skillbars':
            newItem = { name: '', level: 50 };
            break;
        case 'projects':
            newItem = { name: '', description: '', technologies: '' };
            break;
        case 'languages':
            newItem = { language: '', proficiency: '' };
            break;
        case 'certifications':
            newItem = { name: '', issuer: '' };
            break;
        case 'timeline':
            newItem = { date: '', title: '' };
            break;
        default:
            newItem = { name: '' };
    }
    
    items.push(newItem);
    data.items = items;
    el.componentData = data;
    
    renderAll();
    showToast('Item added');
    autoSave();
    
    editComponentData(elementId);
}

function removeComponentItem(index) {
    const elementId = window._editingComponentId;
    if (!elementId) return;
    
    const el = getElement(elementId);
    if (!el || el.type !== 'component') return;
    
    const data = el.componentData || {};
    const items = data.items || [];
    
    if (index >= 0 && index < items.length) {
        if (!confirm('Remove this item?')) return;
        items.splice(index, 1);
        data.items = items;
        el.componentData = data;
        renderAll();
        autoSave();
        editComponentData(elementId);
        showToast('Item removed');
    }
}

function saveComponentData(elementId) {
    const el = getElement(elementId);
    if (!el || el.type !== 'component') return;
    
    const data = el.componentData || {};
    const items = [];
    const itemForms = document.querySelectorAll('.component-item-form');
    
    itemForms.forEach(form => {
        const fields = form.querySelectorAll('.comp-field');
        const item = {};
        fields.forEach(field => {
            const fieldName = field.dataset.field;
            item[fieldName] = field.value;
        });
        items.push(item);
    });
    
    data.items = items;
    el.componentData = data;
    
    renderAll();
    closeModal('componentEditModal');
    showToast('Component data saved');
    autoSave();
}

// ============================================================
// 12. EDIT ELEMENT CONTENT (Double-click)
// ============================================================

function editElementContent(elementId) {
    const el = getElement(elementId);
    if (!el || el.locked) return;
    
    if (el.type === 'component') {
        editComponentData(elementId);
        return;
    }
    
    const currentContent = el.content || '';
    const newContent = prompt('Edit content:', currentContent);
    if (newContent !== null) {
        el.content = newContent;
        renderAll();
        autoSave();
        showToast('Content updated');
    }
}

// ============================================================
// 13. SELECTION
// ============================================================

function selectElement(id) {
    STATE.selectedElementId = id;
    renderAll();
    if (STATE.isMobile) {
        openMobileProperties();
    }
}

function deselectAll() {
    STATE.selectedElementId = null;
    renderAll();
    if (STATE.isMobile) {
        closeMobileProperties();
    }
}

// ============================================================
// 14. DRAG AND DROP
// ============================================================

function setupDragAndDrop() {
    document.querySelectorAll('.element-item[draggable]').forEach(item => {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify({
                type: item.dataset.type,
                field: item.dataset.field,
                component: item.dataset.component,
                shape: item.dataset.shape,
                icon: item.dataset.icon
            }));
            item.classList.add('dragging');
        });
        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
        });
    });
    
    const canvas = document.getElementById('a4Page');
    canvas.addEventListener('dragover', (e) => {
        e.preventDefault();
    });
    canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const scale = STATE.zoom;
        const x = (e.clientX - rect.left) / scale;
        const y = (e.clientY - rect.top) / scale;
        
        try {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            addElementFromDrop(data, x, y);
        } catch (err) {
            console.error('Drop error:', err);
        }
    });
}

function addElementFromDrop(data, x, y) {
    const el = {
        id: generateId(),
        x: Math.max(10, x - 50),
        y: Math.max(10, y - 20),
        width: 200,
        height: 40,
        zIndex: getCurrentPage().elements.length + 1,
        editable: true,
        locked: false,
        hidden: false,
        style: {
            fontFamily: STATE.template.design?.font || 'Inter',
            color: STATE.template.design?.secondaryColor || '#0F172A'
        }
    };
    
    switch(data.type) {
        case 'heading':
            el.type = 'heading';
            el.content = 'HEADING TEXT';
            el.editable = true;
            el.style.fontSize = 18;
            el.style.fontWeight = '700';
            el.style.letterSpacing = 1;
            el.height = 35;
            el.width = 300;
            break;
        case 'subheading':
            el.type = 'subheading';
            el.content = 'Subheading Text';
            el.editable = true;
            el.style.fontSize = 16;
            el.style.fontWeight = '600';
            el.height = 30;
            el.width = 250;
            break;
        case 'paragraph':
            el.type = 'paragraph';
            el.content = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
            el.editable = true;
            el.style.fontSize = 13;
            el.style.fontWeight = '400';
            el.height = 80;
            el.width = 400;
            el.style.lineHeight = 1.6;
            break;
        case 'name':
            el.type = 'name';
            el.content = 'YOUR NAME';
            el.field = 'personal.fullName';
            el.editable = true;
            el.style.fontSize = 32;
            el.style.fontWeight = '800';
            el.style.letterSpacing = 2;
            el.height = 50;
            el.width = 300;
            el.style.color = STATE.template.design?.primaryColor || '#0F172A';
            break;
        case 'jobtitle':
            el.type = 'jobtitle';
            el.content = 'Your Job Title';
            el.field = 'personal.jobTitle';
            el.editable = true;
            el.style.fontSize = 16;
            el.style.fontWeight = '500';
            el.height = 30;
            el.width = 300;
            el.style.color = '#64748B';
            break;
        case 'field':
            el.type = 'field';
            el.fieldType = data.field;
            el.field = data.field;
            el.content = `{{${data.field}}}`;
            el.editable = true;
            el.style.fontSize = 13;
            el.style.fontWeight = '400';
            el.height = 30;
            el.width = 250;
            el.style.color = '#475569';
            break;
        case 'component':
            el.type = 'component';
            el.componentType = data.component;
            el.editable = true;
            el.componentData = {
                title: data.component.charAt(0).toUpperCase() + data.component.slice(1),
                style: data.component === 'skillbars' ? 'bars' : 
                       data.component === 'experience' ? 'timeline' : 'classic',
                field: data.component,
                items: getDefaultComponentItems(data.component)
            };
            el.height = data.component === 'skills' || data.component === 'skillbars' ? 120 : 
                       data.component === 'profile' ? 100 : 150;
            el.width = 400;
            el.style.backgroundColor = 'rgba(37, 99, 235, 0.02)';
            el.style.border = '1px dashed #E2E8F0';
            break;
        case 'shape':
            el.type = 'shape';
            el.shapeType = data.shape || 'rectangle';
            el.editable = false;
            el.style.backgroundColor = '#E2E8F0';
            if (data.shape === 'divider') {
                el.height = 2;
                el.width = 400;
                el.style.backgroundColor = '#CBD5E1';
                el.style.border = 'none';
            } else if (data.shape === 'circle') {
                el.height = 80;
                el.width = 80;
                el.style.borderRadius = '50%';
            } else if (data.shape === 'rounded') {
                el.height = 80;
                el.width = 200;
                el.style.borderRadius = '12px';
            } else {
                el.height = 80;
                el.width = 200;
            }
            break;
        case 'profilephoto':
            el.type = 'profilephoto';
            el.photoShape = 'circle';
            el.borderWidth = 3;
            el.borderColor = '#2563EB';
            el.height = 100;
            el.width = 100;
            el.editable = false;
            el.imageData = null;
            el.style.backgroundColor = '#F1F5F9';
            break;
        case 'icon':
            el.type = 'icon';
            el.iconName = data.icon || 'fa-star';
            el.height = 40;
            el.width = 40;
            el.editable = false;
            el.style.color = '#64748B';
            el.style.fontSize = 24;
            break;
        default:
            el.type = 'paragraph';
            el.content = 'New Element';
            el.editable = true;
            el.style.fontSize = 14;
            el.height = 30;
            el.width = 150;
    }
    
    getCurrentPage().elements.push(el);
    STATE.selectedElementId = el.id;
    renderAll();
    showToast('Element added');
    autoSave();
}

function getDefaultComponentItems(type) {
    switch(type) {
        case 'experience':
            return [
                { company: 'Company Name', position: 'Your Position', startDate: '2020', endDate: 'Present', description: 'Describe your role...' }
            ];
        case 'education':
            return [
                { school: 'University Name', degree: 'Your Degree', field: 'Field of Study', year: '2018', description: '' }
            ];
        case 'skills':
        case 'skillbars':
            return [
                { name: 'Skill 1', level: 90 },
                { name: 'Skill 2', level: 75 },
                { name: 'Skill 3', level: 60 }
            ];
        case 'projects':
            return [
                { name: 'Project Name', description: 'Project description...', technologies: 'Tech used' }
            ];
        case 'languages':
            return [
                { language: 'English', proficiency: 'Native' }
            ];
        case 'certifications':
            return [
                { name: 'Certification Name', issuer: 'Issuing Organization' }
            ];
        case 'timeline':
            return [
                { date: '2020', title: 'Event Title' }
            ];
        case 'profile':
            return [];
        default:
            return [];
    }
}

// ============================================================
// 15. DRAG AND RESIZE LOGIC
// ============================================================

function startDrag(e, id) {
    const el = getElement(id);
    if (!el || el.locked) return;
    
    STATE.isDragging = true;
    STATE.selectedElementId = id;
    
    const rect = document.getElementById('a4Page').getBoundingClientRect();
    const scale = STATE.zoom;
    
    STATE.dragOffset = {
        x: (e.clientX - rect.left) / scale - el.x,
        y: (e.clientY - rect.top) / scale - el.y
    };
    
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', onDragTouch, { passive: false });
    document.addEventListener('touchend', endDragTouch, { passive: false });
    
    renderAll();
}

function onDrag(e) {
    if (!STATE.isDragging) return;
    const id = STATE.selectedElementId;
    const el = getElement(id);
    if (!el) return;
    
    const rect = document.getElementById('a4Page').getBoundingClientRect();
    const scale = STATE.zoom;
    
    let x = (e.clientX - rect.left) / scale - STATE.dragOffset.x;
    let y = (e.clientY - rect.top) / scale - STATE.dragOffset.y;
    
    if (STATE.snapEnabled) {
        const snapSize = 10;
        x = Math.round(x / snapSize) * snapSize;
        y = Math.round(y / snapSize) * snapSize;
    }
    
    const page = getCurrentPage();
    x = Math.max(0, Math.min(x, page.width - el.width));
    y = Math.max(0, Math.min(y, page.height - el.height));
    
    el.x = x;
    el.y = y;
    
    renderCanvas();
    renderLayers();
    updateElementCount();
}

function onDragTouch(e) {
    e.preventDefault();
    if (!STATE.isDragging || !e.touches.length) return;
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    onDrag(mouseEvent);
}

function endDrag() {
    STATE.isDragging = false;
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchmove', onDragTouch);
    document.removeEventListener('touchend', endDragTouch);
    renderAll();
    autoSave();
}

function endDragTouch(e) {
    endDrag();
}

function startResize(e, id) {
    const el = getElement(id);
    if (!el || el.locked) return;
    
    STATE.isResizing = true;
    STATE.selectedElementId = id;
    STATE.resizeStart = {
        x: e.clientX,
        y: e.clientY,
        w: el.width,
        h: el.height
    };
    
    document.addEventListener('mousemove', onResize);
    document.addEventListener('mouseup', endResize);
    document.addEventListener('touchmove', onResizeTouch, { passive: false });
    document.addEventListener('touchend', endResizeTouch, { passive: false });
}

function onResize(e) {
    if (!STATE.isResizing) return;
    const id = STATE.selectedElementId;
    const el = getElement(id);
    if (!el) return;
    
    const rect = document.getElementById('a4Page').getBoundingClientRect();
    const scale = STATE.zoom;
    
    const dx = (e.clientX - STATE.resizeStart.x) / scale;
    const dy = (e.clientY - STATE.resizeStart.y) / scale;
    
    let newWidth = Math.max(20, STATE.resizeStart.w + dx);
    let newHeight = Math.max(20, STATE.resizeStart.h + dy);
    
    if (STATE.snapEnabled) {
        newWidth = Math.round(newWidth / 10) * 10;
        newHeight = Math.round(newHeight / 10) * 10;
    }
    
    el.width = newWidth;
    el.height = newHeight;
    
    renderCanvas();
    renderLayers();
    updateElementCount();
}

function onResizeTouch(e) {
    e.preventDefault();
    if (!STATE.isResizing || !e.touches.length) return;
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    onResize(mouseEvent);
}

function endResize() {
    STATE.isResizing = false;
    document.removeEventListener('mousemove', onResize);
    document.removeEventListener('mouseup', endResize);
    document.removeEventListener('touchmove', onResizeTouch);
    document.removeEventListener('touchend', endResizeTouch);
    renderAll();
    autoSave();
}

function endResizeTouch(e) {
    endResize();
}

// ============================================================
// 16. LAYERS
// ============================================================

function renderLayers() {
    const container = document.getElementById('layerList');
    if (!container) return;
    
    const elements = getPageElements();
    const sorted = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    
    if (sorted.length === 0) {
        container.innerHTML = `<p class="help-text" style="padding:12px;text-align:center;">No elements on this page</p>`;
        return;
    }
    
    container.innerHTML = sorted.map(el => `
        <div class="layer-item ${STATE.selectedElementId === el.id ? 'selected' : ''}" 
             onclick="selectElement('${el.id}')">
            <span class="layer-visibility" onclick="event.stopPropagation();toggleVisibility('${el.id}')">
                <i class="fas ${el.hidden ? 'fa-eye-slash' : 'fa-eye'}"></i>
            </span>
            <span class="layer-name">${getElementLabel(el)}</span>
            <span class="layer-lock" onclick="event.stopPropagation();toggleLock('${el.id}')">
                <i class="fas ${el.locked ? 'fa-lock' : 'fa-lock-open'}"></i>
            </span>
            ${el.editable ? `<span class="layer-editable" style="font-size:10px;color:var(--success);margin-left:4px;">✎</span>` : ''}
        </div>
    `).join('');
}

function getElementLabel(el) {
    let label = el.type || 'element';
    if (el.content && el.content.length > 0) {
        const content = el.content.replace(/\{\{.*?\}\}/g, '').trim();
        if (content.length > 0) {
            label = content.substring(0, 20);
        }
    }
    if (el.field) {
        label = `${label} (${el.field})`;
    }
    if (el.componentType) {
        label = `${el.componentType}`;
    }
    return label;
}

function toggleVisibility(id) {
    const el = getElement(id);
    if (el) {
        el.hidden = !el.hidden;
        renderLayers();
        renderCanvas();
        autoSave();
    }
}

function toggleLock(id) {
    const el = getElement(id);
    if (el) {
        el.locked = !el.locked;
        renderLayers();
        showToast(el.locked ? 'Element locked' : 'Element unlocked');
        autoSave();
    }
}

function bringForward() {
    const id = STATE.selectedElementId;
    if (!id) return;
    const el = getElement(id);
    if (el) {
        el.zIndex = (el.zIndex || 0) + 1;
        renderAll();
        autoSave();
    }
}

function sendBackward() {
    const id = STATE.selectedElementId;
    if (!id) return;
    const el = getElement(id);
    if (el) {
        el.zIndex = (el.zIndex || 0) - 1;
        renderAll();
        autoSave();
    }
}

// ============================================================
// 17. PROPERTIES PANEL
// ============================================================

function renderProperties() {
    const container = document.getElementById('propertiesContent');
    const mobileContainer = document.getElementById('mobilePropertiesContent');
    if (!container) return;
    
    if (!STATE.selectedElementId) {
        const emptyMsg = `<p class="help-text">Select an element to edit its properties</p>`;
        container.innerHTML = emptyMsg;
        if (mobileContainer) mobileContainer.innerHTML = emptyMsg;
        return;
    }
    
    const el = getElement(STATE.selectedElementId);
    if (!el) {
        const emptyMsg = `<p class="help-text">Element not found</p>`;
        container.innerHTML = emptyMsg;
        if (mobileContainer) mobileContainer.innerHTML = emptyMsg;
        return;
    }
    
    const html = buildPropertiesHTML(el);
    container.innerHTML = html;
    if (mobileContainer) mobileContainer.innerHTML = html;
}

function buildPropertiesHTML(el) {
    let html = `
        <div class="properties-group">
            <label>Type</label>
            <input type="text" value="${el.type}" disabled style="background:var(--gray-100);font-size:12px;">
        </div>
    `;
    
    // Content editing for all text elements
    if (el.type !== 'shape' && el.type !== 'profilephoto' && el.type !== 'icon') {
        html += `
            <div class="properties-group">
                <label>Content</label>
                <input type="text" id="propContent" value="${el.content || ''}" 
                       onchange="updateElementProperty('${el.id}', 'content', this.value)"
                       placeholder="Enter text content...">
            </div>
        `;
    }
    
    // Component specific properties
    if (el.type === 'component') {
        html += `
            <div class="properties-group">
                <label>Component Field</label>
                <input type="text" id="propField" value="${el.field || ''}" placeholder="e.g. experience" 
                       onchange="updateElementProperty('${el.id}', 'field', this.value)">
            </div>
            <div class="properties-group">
                <label>Component Title</label>
                <input type="text" id="propComponentTitle" value="${el.componentData?.title || ''}" 
                       onchange="updateElementProperty('${el.id}', 'componentData.title', this.value)">
            </div>
            <div class="properties-group">
                <label>Style</label>
                <select id="propComponentStyle" onchange="updateElementProperty('${el.id}', 'componentData.style', this.value)">
                    <option value="classic" ${el.componentData?.style === 'classic' ? 'selected' : ''}>Classic</option>
                    <option value="timeline" ${el.componentData?.style === 'timeline' ? 'selected' : ''}>Timeline</option>
                    <option value="modern" ${el.componentData?.style === 'modern' ? 'selected' : ''}>Modern</option>
                    <option value="bars" ${el.componentData?.style === 'bars' ? 'selected' : ''}>Bars</option>
                    <option value="compact" ${el.componentData?.style === 'compact' ? 'selected' : ''}>Compact</option>
                </select>
            </div>
            <div class="properties-group">
                <button class="btn btn-sm btn-primary" onclick="editComponentData('${el.id}')" style="width:100%;">
                    <i class="fas fa-edit"></i> Edit Component Data
                </button>
            </div>
        `;
    }
    
    // Editable toggle
    if (['text', 'heading', 'subheading', 'paragraph', 'name', 'jobtitle', 'field', 'component'].includes(el.type)) {
        html += `
            <div class="properties-group" style="display:flex;align-items:center;gap:12px;">
                <label style="margin-bottom:0;">User Editable</label>
                <div class="toggle-switch ${el.editable ? 'active' : ''}" 
                     onclick="toggleEditable('${el.id}')">
                    <span class="toggle-slider" style="left:${el.editable ? '22px' : '2px'};"></span>
                </div>
            </div>
        `;
        
        if (el.editable && el.type !== 'component') {
            html += `
                <div class="properties-group">
                    <label>Field Key</label>
                    <input type="text" id="propField" value="${el.field || ''}" placeholder="personal.fullName"
                           onchange="updateElementProperty('${el.id}', 'field', this.value)">
                    <p class="help-text">e.g. personal.fullName, experience, skills</p>
                </div>
            `;
        }
    }
    
    // Position & Size
    if (!el.locked) {
        html += `
            <hr style="border:none;border-top:1px solid var(--gray-200);margin:12px 0;">
            <div class="properties-row">
                <div class="properties-group">
                    <label>X</label>
                    <input type="number" id="propX" value="${el.x || 0}" 
                           onchange="updateElementProperty('${el.id}', 'x', parseInt(this.value))">
                </div>
                <div class="properties-group">
                    <label>Y</label>
                    <input type="number" id="propY" value="${el.y || 0}" 
                           onchange="updateElementProperty('${el.id}', 'y', parseInt(this.value))">
                </div>
            </div>
            <div class="properties-row">
                <div class="properties-group">
                    <label>Width</label>
                    <input type="number" id="propWidth" value="${el.width || 100}" 
                           onchange="updateElementProperty('${el.id}', 'width', parseInt(this.value))">
                </div>
                <div class="properties-group">
                    <label>Height</label>
                    <input type="number" id="propHeight" value="${el.height || 40}" 
                           onchange="updateElementProperty('${el.id}', 'height', parseInt(this.value))">
                </div>
            </div>
            <div class="properties-group">
                <label>Rotation</label>
                <input type="number" id="propRotation" value="${el.rotation || 0}" step="5"
                       onchange="updateElementProperty('${el.id}', 'rotation', parseInt(this.value))">
            </div>
        `;
    }
    
    // Style properties
    if (!el.locked && el.type !== 'component' && el.type !== 'field' && el.type !== 'shape') {
        html += `
            <hr style="border:none;border-top:1px solid var(--gray-200);margin:12px 0;">
            <div class="properties-group">
                <label>Font Family</label>
                <select id="propFont" onchange="updateElementProperty('${el.id}', 'style.fontFamily', this.value)">
                    <option value="Inter" ${el.style?.fontFamily === 'Inter' ? 'selected' : ''}>Inter</option>
                    <option value="Times New Roman" ${el.style?.fontFamily === 'Times New Roman' ? 'selected' : ''}>Times New Roman</option>
                    <option value="Arial" ${el.style?.fontFamily === 'Arial' ? 'selected' : ''}>Arial</option>
                    <option value="Georgia" ${el.style?.fontFamily === 'Georgia' ? 'selected' : ''}>Georgia</option>
                    <option value="Roboto" ${el.style?.fontFamily === 'Roboto' ? 'selected' : ''}>Roboto</option>
                    <option value="Playfair Display" ${el.style?.fontFamily === 'Playfair Display' ? 'selected' : ''}>Playfair Display</option>
                </select>
            </div>
            <div class="properties-row">
                <div class="properties-group">
                    <label>Font Size</label>
                    <input type="number" id="propFontSize" value="${el.style?.fontSize || 14}" 
                           onchange="updateElementProperty('${el.id}', 'style.fontSize', parseInt(this.value))">
                </div>
                <div class="properties-group">
                    <label>Font Weight</label>
                    <select id="propFontWeight" onchange="updateElementProperty('${el.id}', 'style.fontWeight', this.value)">
                        <option value="300" ${el.style?.fontWeight === '300' ? 'selected' : ''}>Light</option>
                        <option value="400" ${el.style?.fontWeight === '400' ? 'selected' : ''}>Regular</option>
                        <option value="500" ${el.style?.fontWeight === '500' ? 'selected' : ''}>Medium</option>
                        <option value="600" ${el.style?.fontWeight === '600' ? 'selected' : ''}>Semi-Bold</option>
                        <option value="700" ${el.style?.fontWeight === '700' ? 'selected' : ''}>Bold</option>
                        <option value="800" ${el.style?.fontWeight === '800' ? 'selected' : ''}>Extra Bold</option>
                    </select>
                </div>
            </div>
            <div class="properties-row">
                <div class="properties-group">
                    <label>Color</label>
                    <input type="color" id="propColor" value="${el.style?.color || '#0F172A'}" 
                           onchange="updateElementProperty('${el.id}', 'style.color', this.value)">
                </div>
                <div class="properties-group">
                    <label>Alignment</label>
                    <select id="propAlignment" onchange="updateElementProperty('${el.id}', 'style.textAlign', this.value)">
                        <option value="left" ${el.style?.textAlign === 'left' ? 'selected' : ''}>Left</option>
                        <option value="center" ${el.style?.textAlign === 'center' ? 'selected' : ''}>Center</option>
                        <option value="right" ${el.style?.textAlign === 'right' ? 'selected' : ''}>Right</option>
                    </select>
                </div>
            </div>
            <div class="properties-group">
                <label>Background Color</label>
                <input type="color" id="propBgColor" value="${el.style?.backgroundColor || 'transparent'}" 
                       onchange="updateElementProperty('${el.id}', 'style.backgroundColor', this.value)">
            </div>
            <div class="properties-group">
                <label>Opacity</label>
                <input type="range" min="0" max="1" step="0.05" id="propOpacity" value="${el.style?.opacity || 1}" 
                       onchange="updateElementProperty('${el.id}', 'style.opacity', parseFloat(this.value))">
            </div>
        `;
    }
    
    // Shape specific
    if (el.type === 'shape' && !el.locked) {
        html += `
            <hr style="border:none;border-top:1px solid var(--gray-200);margin:12px 0;">
            <div class="properties-group">
                <label>Shape Type</label>
                <select id="propShapeType" onchange="updateElementProperty('${el.id}', 'shapeType', this.value)">
                    <option value="rectangle" ${el.shapeType === 'rectangle' ? 'selected' : ''}>Rectangle</option>
                    <option value="rounded" ${el.shapeType === 'rounded' ? 'selected' : ''}>Rounded</option>
                    <option value="circle" ${el.shapeType === 'circle' ? 'selected' : ''}>Circle</option>
                    <option value="divider" ${el.shapeType === 'divider' ? 'selected' : ''}>Divider</option>
                </select>
            </div>
            <div class="properties-group">
                <label>Background Color</label>
                <input type="color" id="propShapeBg" value="${el.style?.backgroundColor || '#E2E8F0'}" 
                       onchange="updateElementProperty('${el.id}', 'style.backgroundColor', this.value)">
            </div>
        `;
    }
    
    // Profile photo specific
    if (el.type === 'profilephoto' && !el.locked) {
        html += `
            <hr style="border:none;border-top:1px solid var(--gray-200);margin:12px 0;">
            <div class="properties-group">
                <label>Photo Shape</label>
                <select id="propPhotoShape" onchange="updateElementProperty('${el.id}', 'photoShape', this.value)">
                    <option value="circle" ${el.photoShape === 'circle' ? 'selected' : ''}>Circle</option>
                    <option value="square" ${el.photoShape === 'square' ? 'selected' : ''}>Square</option>
                    <option value="rounded" ${el.photoShape === 'rounded' ? 'selected' : ''}>Rounded</option>
                </select>
            </div>
            <div class="properties-row">
                <div class="properties-group">
                    <label>Border Width</label>
                    <input type="number" id="propBorderWidth" value="${el.borderWidth || 0}" 
                           onchange="updateElementProperty('${el.id}', 'borderWidth', parseInt(this.value))">
                </div>
                <div class="properties-group">
                    <label>Border Color</label>
                    <input type="color" id="propBorderColor" value="${el.borderColor || '#E2E8F0'}" 
                           onchange="updateElementProperty('${el.id}', 'borderColor', this.value)">
                </div>
            </div>
            <div class="properties-group">
                <button class="btn btn-sm btn-primary" onclick="uploadImageForElement('${el.id}')" style="width:100%;">
                    <i class="fas fa-upload"></i> Upload Image
                </button>
            </div>
        `;
    }
    
    // Actions
    if (!el.locked) {
        html += `
            <hr style="border:none;border-top:1px solid var(--gray-200);margin:12px 0;">
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button class="btn btn-sm btn-secondary" onclick="duplicateElement('${el.id}')">
                    <i class="fas fa-copy"></i> Duplicate
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteElement('${el.id}')">
                    <i class="fas fa-trash"></i> Delete
                </button>
            </div>
        `;
    }
    
    return html;
}

function toggleEditable(id) {
    const el = getElement(id);
    if (el) {
        el.editable = !el.editable;
        renderProperties();
        renderLayers();
        showToast(el.editable ? 'Element is now user-editable' : 'Element is now static');
        autoSave();
    }
}

// ============================================================
// 18. PAGES PANEL
// ============================================================

function renderPages() {
    const container = document.getElementById('pageList');
    if (!container) return;
    
    container.innerHTML = STATE.template.pages.map((page, index) => `
        <div class="page-item ${STATE.currentPageIndex === index ? 'active' : ''}" 
             onclick="switchPage(${index})">
            <div class="page-thumbnail">
                <i class="fas fa-file-alt"></i>
                <span class="page-number">${index + 1}</span>
            </div>
            <div class="page-info">
                <input type="text" value="${page.name || `Page ${index + 1}`}" 
                       onchange="renamePage(${index}, this.value)" 
                       onclick="event.stopPropagation()">
                <span class="page-count">${page.elements?.length || 0} elements</span>
            </div>
            <div class="page-actions">
                <button class="action-btn-sm" onclick="event.stopPropagation();duplicatePage(${index})" title="Duplicate">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="action-btn-sm danger" onclick="event.stopPropagation();deletePage(${index})" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// ============================================================
// 19. DESIGN CONTROLS
// ============================================================

function setupDesignControls() {
    const design = STATE.template.design || {};
    
    const primary = document.getElementById('designPrimaryColor');
    const secondary = document.getElementById('designSecondaryColor');
    const bg = document.getElementById('designBgColor');
    const font = document.getElementById('designFont');
    const margins = document.getElementById('designMargins');
    
    if (primary) primary.value = design.primaryColor || '#2563EB';
    if (secondary) secondary.value = design.secondaryColor || '#0F172A';
    if (bg) bg.value = design.bgColor || '#FFFFFF';
    if (font) font.value = design.font || 'Inter';
    if (margins) margins.value = design.margins || 'medium';
    
    const category = document.getElementById('templateCategory');
    if (category) category.value = STATE.template.category || 'cv';
    updateCategoryBadge(STATE.template.category || 'cv');
    updateCategoryButtons(STATE.template.category || 'cv');
    
    const planSelect = document.getElementById('templatePlanSelect');
    if (planSelect) planSelect.value = STATE.template.plan || 'free';
    
    const pageSize = document.getElementById('pageSize');
    if (pageSize) pageSize.value = STATE.template.pageSize || 'A4';
    
    const orientation = document.getElementById('pageOrientation');
    if (orientation) orientation.value = STATE.template.orientation || 'portrait';
}

function updateDesignColors() {
    const primary = document.getElementById('designPrimaryColor')?.value || '#2563EB';
    const secondary = document.getElementById('designSecondaryColor')?.value || '#0F172A';
    const bg = document.getElementById('designBgColor')?.value || '#FFFFFF';
    
    if (!STATE.template.design) STATE.template.design = {};
    STATE.template.design.primaryColor = primary;
    STATE.template.design.secondaryColor = secondary;
    STATE.template.design.bgColor = bg;
    
    renderAll();
    showToast('Design colors updated');
    autoSave();
}

function updateDesignFont() {
    const font = document.getElementById('designFont')?.value || 'Inter';
    if (!STATE.template.design) STATE.template.design = {};
    STATE.template.design.font = font;
    
    renderAll();
    showToast('Font updated');
    autoSave();
}

function updateDesignMargins() {
    const margins = document.getElementById('designMargins')?.value || 'medium';
    if (!STATE.template.design) STATE.template.design = {};
    STATE.template.design.margins = margins;
    showToast(`Margins set to ${margins}`);
    autoSave();
}

function updateTemplatePlan(value) {
    STATE.template.plan = value;
    updatePlanBadge(value);
    showToast(`Plan: ${value.toUpperCase()}`);
    autoSave();
}

function updatePageSize(value) {
    STATE.template.pageSize = value;
    updatePageDimensions();
    showToast(`Page size: ${value}`);
    autoSave();
}

function updatePageOrientation(value) {
    STATE.template.orientation = value;
    updatePageDimensions();
    showToast(`Orientation: ${value}`);
    autoSave();
}

function updatePageDimensions() {
    const size = STATE.template.pageSize;
    const orientation = STATE.template.orientation;
    
    let width, height;
    if (size === 'A4') {
        width = orientation === 'portrait' ? 794 : 1123;
        height = orientation === 'portrait' ? 1123 : 794;
    } else if (size === 'letter') {
        width = orientation === 'portrait' ? 816 : 1056;
        height = orientation === 'portrait' ? 1056 : 816;
    } else {
        width = 794;
        height = 1123;
    }
    
    STATE.template.pages.forEach(page => {
        page.width = width;
        page.height = height;
    });
    
    renderAll();
}

function applyPalette(name) {
    const palettes = {
        professional: { primary: '#1a1a1a', secondary: '#2563EB', bg: '#FFFFFF' },
        modern: { primary: '#0F172A', secondary: '#7C3AED', bg: '#FFFFFF' },
        creative: { primary: '#1a1a1a', secondary: '#F59E0B', bg: '#FAF8F6' },
        minimal: { primary: '#1E293B', secondary: '#64748B', bg: '#FFFFFF' }
    };
    
    const palette = palettes[name];
    if (!palette) return;
    
    document.getElementById('designPrimaryColor').value = palette.primary;
    document.getElementById('designSecondaryColor').value = palette.secondary;
    document.getElementById('designBgColor').value = palette.bg;
    
    STATE.template.design = STATE.template.design || {};
    STATE.template.design.primaryColor = palette.primary;
    STATE.template.design.secondaryColor = palette.secondary;
    STATE.template.design.bgColor = palette.bg;
    
    renderAll();
    showToast(`Applied ${name} palette`);
    autoSave();
}

// ============================================================
// 20. TOGGLE PLAN
// ============================================================

function togglePlan() {
    const current = STATE.template.plan || 'free';
    const newPlan = current === 'free' ? 'premium' : 'free';
    STATE.template.plan = newPlan;
    updatePlanBadge(newPlan);
    
    const planSelect = document.getElementById('templatePlanSelect');
    if (planSelect) planSelect.value = newPlan;
    
    showToast(`Plan changed to ${newPlan.toUpperCase()}`);
    autoSave();
}

function updatePlanBadge(plan) {
    const badge = document.getElementById('planBadge');
    if (badge) {
        badge.textContent = plan === 'premium' ? '⭐ PREMIUM' : 'FREE';
        badge.className = 'plan-badge ' + plan;
    }
    
    const planDisplay = document.getElementById('planDisplay');
    if (planDisplay) {
        planDisplay.textContent = plan === 'premium' ? '⭐ Premium' : 'Free';
        planDisplay.style.color = plan === 'premium' ? '#F59E0B' : 'var(--gray-500)';
    }
}

// ============================================================
// 21. ZOOM CONTROLS
// ============================================================

function zoomIn() {
    STATE.zoom = Math.min(STATE.zoom + 0.1, 2);
    updateZoom();
}

function zoomOut() {
    STATE.zoom = Math.max(STATE.zoom - 0.1, 0.25);
    updateZoom();
}

function fitToScreen() {
    const container = document.getElementById('canvasContainer');
    const page = document.getElementById('a4Page');
    if (!container || !page) return;
    
    const containerRect = container.getBoundingClientRect();
    const pageRect = page.getBoundingClientRect();
    
    const scaleX = (containerRect.width - 40) / (pageRect.width || 794);
    const scaleY = (containerRect.height - 40) / (pageRect.height || 1123);
    
    STATE.zoom = Math.min(scaleX, scaleY, 1);
    updateZoom();
}

function updateZoom() {
    document.getElementById('zoomLevel').textContent = Math.round(STATE.zoom * 100) + '%';
    renderCanvas();
}

// ============================================================
// 22. TOGGLE GRID & SNAP
// ============================================================

function toggleGrid() {
    STATE.showGrid = !STATE.showGrid;
    document.querySelector('.canvas-container')?.classList.toggle('grid-on', STATE.showGrid);
    showToast(STATE.showGrid ? 'Grid enabled' : 'Grid disabled');
}

function toggleSnap() {
    STATE.snapEnabled = !STATE.snapEnabled;
    showToast(`Snap ${STATE.snapEnabled ? 'enabled' : 'disabled'}`);
}

// ============================================================
// 23. TABS
// ============================================================

function setupTabs() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.dataset.tab;
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            const content = document.getElementById(`tab-${tab}`);
            if (content) content.classList.add('active');
        });
    });
}

// ============================================================
// 24. SIDEBAR TOGGLES
// ============================================================

function toggleLeftSidebar() {
    const sidebar = document.getElementById('leftSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('open');
    if (overlay) {
        overlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
    }
    
    const rightSidebar = document.getElementById('rightSidebar');
    if (rightSidebar) rightSidebar.classList.remove('open');
    closeMobileProperties();
}

function toggleRightSidebar() {
    const sidebar = document.getElementById('rightSidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('open');
    if (overlay) {
        overlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
    }
    
    const leftSidebar = document.getElementById('leftSidebar');
    if (leftSidebar) leftSidebar.classList.remove('open');
}

function closeAllSidebars() {
    document.getElementById('leftSidebar')?.classList.remove('open');
    document.getElementById('rightSidebar')?.classList.remove('open');
    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) overlay.style.display = 'none';
    closeMobileProperties();
}

// ============================================================
// 25. MOBILE CONTROLS
// ============================================================

function setupMobileControls() {
    STATE.isMobile = window.innerWidth <= 768;
    
    window.addEventListener('resize', () => {
        const wasMobile = STATE.isMobile;
        STATE.isMobile = window.innerWidth <= 768;
        if (STATE.isMobile !== wasMobile) {
            renderAll();
        }
    });
}

function openMobileProperties() {
    const sheet = document.getElementById('mobilePropertiesSheet');
    if (sheet) {
        sheet.style.display = 'block';
        setTimeout(() => sheet.classList.add('open'), 10);
    }
}

function closeMobileProperties() {
    const sheet = document.getElementById('mobilePropertiesSheet');
    if (sheet) {
        sheet.classList.remove('open');
        setTimeout(() => {
            sheet.style.display = 'none';
        }, 300);
    }
}

function addElementFromMobile() {
    const el = {
        id: generateId(),
        type: 'paragraph',
        content: 'New Text Element',
        x: 50,
        y: 50,
        width: 300,
        height: 40,
        zIndex: getCurrentPage().elements.length + 1,
        editable: true,
        locked: false,
        hidden: false,
        style: {
            fontFamily: 'Inter',
            fontSize: 14,
            fontWeight: '400',
            color: '#1a1a1a'
        }
    };
    getCurrentPage().elements.push(el);
    STATE.selectedElementId = el.id;
    renderAll();
    showToast('Element added');
    autoSave();
    
    if (STATE.isMobile) {
        openMobileProperties();
    }
}

function togglePages() {
    const pagesTab = document.querySelector('[data-tab="pages"]');
    if (pagesTab) {
        pagesTab.click();
        toggleLeftSidebar();
    }
}

function toggleLayers() {
    const layersTab = document.querySelector('[data-tab="layers"]');
    if (layersTab) {
        layersTab.click();
        toggleLeftSidebar();
    }
}

// ============================================================
// 26. CANVAS EVENTS
// ============================================================

function setupCanvasEvents() {
    const canvas = document.getElementById('a4Page');
    canvas?.addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            deselectAll();
        }
    });
}

// ============================================================
// 27. KEYBOARD SHORTCUTS
// ============================================================

function handleKeyboardShortcuts(e) {
    const ctrl = e.ctrlKey || e.metaKey;
    
    if (ctrl && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
            redoAction();
        } else {
            undoAction();
        }
    }
    
    if (ctrl && e.key === 'y') {
        e.preventDefault();
        redoAction();
    }
    
    if (ctrl && e.key === 'c') {
        e.preventDefault();
        copyElement();
    }
    
    if (ctrl && e.key === 'v') {
        e.preventDefault();
        pasteElement();
    }
    
    if (ctrl && e.key === 'd') {
        e.preventDefault();
        if (STATE.selectedElementId) {
            duplicateElement(STATE.selectedElementId);
        }
    }
    
    if (ctrl && e.key === 's') {
        e.preventDefault();
        saveDraft();
    }
    
    if (e.key === 'Delete' || e.key === 'Backspace') {
        if (STATE.selectedElementId && !e.target.closest('input')) {
            e.preventDefault();
            deleteElement(STATE.selectedElementId);
        }
    }
    
    if (e.key === 'Escape') {
        deselectAll();
        closeAllSidebars();
    }
    
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const id = STATE.selectedElementId;
        if (id && !e.target.closest('input')) {
            e.preventDefault();
            const el = getElement(id);
            if (el) {
                const step = e.shiftKey ? 10 : 1;
                if (e.key === 'ArrowUp') el.y = Math.max(0, el.y - step);
                if (e.key === 'ArrowDown') el.y = Math.min(getCurrentPage().height - el.height, el.y + step);
                if (e.key === 'ArrowLeft') el.x = Math.max(0, el.x - step);
                if (e.key === 'ArrowRight') el.x = Math.min(getCurrentPage().width - el.width, el.x + step);
                renderAll();
                autoSave();
            }
        }
    }
}

// ============================================================
// 28. COPY / PASTE
// ============================================================

function copyElement() {
    const id = STATE.selectedElementId;
    if (!id) return;
    const el = getElement(id);
    if (!el) return;
    STATE.clipboard = JSON.parse(JSON.stringify(el));
    showToast('Element copied');
}

function pasteElement() {
    if (!STATE.clipboard) {
        showToast('Nothing to paste', 'error');
        return;
    }
    const copy = JSON.parse(JSON.stringify(STATE.clipboard));
    copy.id = generateId();
    copy.x += 20;
    copy.y += 20;
    copy.zIndex = getCurrentPage().elements.length + 1;
    if (copy.type === 'profilephoto') {
        copy.imageData = null;
    }
    getCurrentPage().elements.push(copy);
    STATE.selectedElementId = copy.id;
    renderAll();
    showToast('Element pasted');
    autoSave();
}

// ============================================================
// 29. UNDO / REDO
// ============================================================

function saveHistory() {
    const snapshot = JSON.stringify({
        pages: STATE.template.pages,
        selectedId: STATE.selectedElementId
    });
    
    STATE.history = STATE.history.slice(0, STATE.historyIndex + 1);
    STATE.history.push(snapshot);
    
    if (STATE.history.length > STATE.maxHistory) {
        STATE.history.shift();
    }
    
    STATE.historyIndex = STATE.history.length - 1;
}

function restoreHistory(index) {
    if (index < 0 || index >= STATE.history.length) return;
    try {
        const data = JSON.parse(STATE.history[index]);
        STATE.template.pages = data.pages;
        STATE.selectedElementId = data.selectedId || null;
        STATE.historyIndex = index;
        renderAll();
    } catch (e) {
        console.error('History restore error:', e);
    }
}

function undoAction() {
    if (STATE.historyIndex > 0) {
        restoreHistory(STATE.historyIndex - 1);
        showToast('Undo');
    }
}

function redoAction() {
    if (STATE.historyIndex < STATE.history.length - 1) {
        restoreHistory(STATE.historyIndex + 1);
        showToast('Redo');
    }
}

// ============================================================
// 30. ADD COMPONENT
// ============================================================

function addComponent(type) {
    const page = getCurrentPage();
    const maxY = page.elements.reduce((max, el) => Math.max(max, el.y + el.height), 0);
    const y = Math.max(50, maxY + 20);
    
    const items = getDefaultComponentItems(type);
    const height = type === 'skills' || type === 'skillbars' ? 120 : 
                   type === 'profile' ? 100 : 
                   type === 'languages' ? 100 : 150;
    
    const el = {
        id: generateId(),
        type: 'component',
        componentType: type,
        content: type.charAt(0).toUpperCase() + type.slice(1),
        field: type,
        editable: true,
        locked: false,
        hidden: false,
        x: 50,
        y: y,
        width: 694,
        height: height,
        zIndex: page.elements.length + 1,
        componentData: {
            title: type.charAt(0).toUpperCase() + type.slice(1),
            style: type === 'skillbars' ? 'bars' : 
                   type === 'experience' ? 'timeline' : 'classic',
            field: type,
            items: items
        },
        style: {
            fontFamily: STATE.template.design?.font || 'Inter',
            color: STATE.template.design?.secondaryColor || '#0F172A',
            backgroundColor: 'rgba(37, 99, 235, 0.02)',
            border: '1px dashed #E2E8F0'
        }
    };
    
    page.elements.push(el);
    STATE.selectedElementId = el.id;
    renderAll();
    showToast(`${el.componentData.title} component added`);
    autoSave();
}

// ============================================================
// 31. PREVIEW - Shows ACTUAL template you built
// ============================================================

function previewTemplate() {
    const previewContent = document.getElementById('previewContent');
    const canvas = document.getElementById('a4Page');
    
    if (!previewContent || !canvas) return;
    
    // Clone the canvas content
    previewContent.innerHTML = canvas.innerHTML;
    previewContent.style.transform = 'scale(1)';
    previewContent.style.width = getCurrentPage().width + 'px';
    previewContent.style.height = getCurrentPage().height + 'px';
    previewContent.style.background = STATE.template.design?.bgColor || '#FFFFFF';
    previewContent.style.boxShadow = '0 4px 24px rgba(0,0,0,0.12)';
    previewContent.style.margin = '0 auto';
    previewContent.style.position = 'relative';
    
    // Remove editor controls
    const controls = previewContent.querySelectorAll('.element-delete, .element-drag-handle, .element-handle, .image-upload-btn');
    controls.forEach(el => el.remove());
    
    // Remove selection styles
    const selected = previewContent.querySelectorAll('.cv-element.selected');
    selected.forEach(el => {
        el.classList.remove('selected');
        el.style.borderColor = 'transparent';
        el.style.boxShadow = 'none';
    });
    
    // Show field placeholders
    const fields = previewContent.querySelectorAll('.cv-element.field');
    fields.forEach(el => {
        const fieldName = el.dataset.field || el.className.split(' ')[1] || 'field';
        const label = fieldName.replace(/[.]/g, ' ').replace(/([A-Z])/g, ' $1').trim();
        const displayName = label.charAt(0).toUpperCase() + label.slice(1);
        el.textContent = `[${displayName}]`;
        el.style.color = '#64748B';
        el.style.fontStyle = 'italic';
        el.style.opacity = '0.7';
    });
    
    // Show name and job title placeholders
    const nameEls = previewContent.querySelectorAll('.cv-element.name');
    nameEls.forEach(el => {
        if (!el.textContent || el.textContent.trim() === '' || el.textContent.includes('{{')) {
            el.textContent = '[Your Name]';
        }
    });
    
    const jobEls = previewContent.querySelectorAll('.cv-element.jobtitle');
    jobEls.forEach(el => {
        if (!el.textContent || el.textContent.trim() === '' || el.textContent.includes('{{')) {
            el.textContent = '[Your Job Title]';
        }
    });
    
    // Clean up components
    const components = previewContent.querySelectorAll('.cv-element.component');
    components.forEach(el => {
        el.style.border = 'none';
        el.style.background = 'none';
        el.style.padding = '4px';
        const editBtns = el.querySelectorAll('.btn');
        editBtns.forEach(btn => btn.remove());
    });
    
    openModal('previewModal');
}

function exportPreviewPDF() {
    showToast('📄 Use browser print (Ctrl+P) to save as PDF');
    window.print();
}

// ============================================================
// 32. SAVE / PUBLISH / EXPORT / IMPORT
// ============================================================

function saveDraft() {
    STATE.template.status = 'draft';
    const saved = saveToFirestore();
    if (saved) {
        showToast('📝 Draft saved successfully');
        updateStatusBar();
        document.getElementById('statusDot').className = 'status-dot saved';
    }
}

function publishTemplate() {
    const name = document.getElementById('templateNameInput').value.trim();
    if (!name) {
        showToast('Please enter a template name', 'error');
        document.getElementById('templateNameInput').focus();
        return;
    }
    
    const errors = validateTemplate();
    if (errors.length > 0) {
        showToast('Validation errors: ' + errors.join(', '), 'error');
        return;
    }
    
    STATE.template.name = name;
    STATE.template.status = 'published';
    STATE.template.updatedAt = new Date().toISOString();
    
    const saved = saveToFirestore();
    if (saved) {
        showToast('🎉 Template published successfully!');
        updateStatusBar();
        document.getElementById('statusDot').className = 'status-dot saved';
    }
}

function saveTemplateAndExit() {
    if (STATE.isSaving) return;
    STATE.isSaving = true;
    
    const name = document.getElementById('templateNameInput').value.trim();
    if (!name) {
        showToast('Please enter a template name', 'error');
        document.getElementById('templateNameInput').focus();
        STATE.isSaving = false;
        return;
    }
    
    STATE.template.name = name;
    STATE.template.updatedAt = new Date().toISOString();
    
    generateThumbnail();
    
    const saved = saveToFirestore();
    STATE.isSaving = false;
    
    if (saved) {
        showToast('✅ Template saved successfully!');
        setTimeout(() => {
            window.location.href = 'templates.html';
        }, 1000);
    } else {
        showToast('Error saving template', 'error');
    }
}

function generateThumbnail() {
    try {
        STATE.template.thumbnail = '📄';
    } catch (e) {
        STATE.template.thumbnail = '📄';
    }
}

function validateTemplate() {
    const errors = [];
    const page = getCurrentPage();
    
    if (!page) {
        errors.push('No pages found');
    }
    
    if (page.elements.length === 0) {
        errors.push('No elements on page');
    }
    
    const hasName = page.elements.some(el => el.type === 'name' || el.field === 'personal.fullName');
    if (!hasName) {
        errors.push('No name field found');
    }
    
    return errors;
}

// ============================================================
// 33. FIRESTORE SAVE/LOAD
// ============================================================

async function saveToFirestore() {
    try {
        const templateData = {
            name: STATE.template.name,
            category: STATE.template.category,
            plan: STATE.template.plan,
            status: STATE.template.status,
            pageSize: STATE.template.pageSize,
            orientation: STATE.template.orientation,
            description: STATE.template.description || '',
            thumbnail: STATE.template.thumbnail || '📄',
            pages: STATE.template.pages,
            design: STATE.template.design || {
                primaryColor: '#2563EB',
                secondaryColor: '#0F172A',
                bgColor: '#FFFFFF',
                font: 'Inter',
                margins: 'medium'
            },
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: sessionStorage.getItem('adminEmail') || 'admin@procv.com'
        };
        
        if (db && STATE.isEditing && STATE.templateId) {
            await db.collection('templates').doc(STATE.templateId).set(templateData, { merge: true });
            console.log('✅ Template updated in Firestore');
            return true;
        } else if (db) {
            const docRef = await db.collection('templates').add({
                ...templateData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: sessionStorage.getItem('adminEmail') || 'admin@procv.com'
            });
            STATE.templateId = docRef.id;
            STATE.isEditing = true;
            console.log('✅ Template saved to Firestore with ID:', docRef.id);
            return true;
        }
        
        // Fallback to LocalStorage
        return saveToLocalStorage(templateData);
    } catch (error) {
        console.error('❌ Firestore save error:', error);
        return saveToLocalStorage(templateData);
    }
}

function saveToLocalStorage(templateData) {
    try {
        const templates = JSON.parse(localStorage.getItem('procv_visual_templates') || '[]');
        const index = templates.findIndex(t => t.id === STATE.templateId);
        
        if (index !== -1) {
            templates[index] = { ...templates[index], ...templateData };
        } else {
            const newTemplate = {
                id: STATE.templateId || 'temp_' + Date.now(),
                ...templateData,
                createdAt: new Date().toISOString()
            };
            templates.push(newTemplate);
            STATE.templateId = newTemplate.id;
        }
        
        localStorage.setItem('procv_visual_templates', JSON.stringify(templates));
        console.log('✅ Template saved to LocalStorage (fallback)');
        return true;
    } catch (error) {
        console.error('❌ LocalStorage save error:', error);
        return false;
    }
}

async function loadTemplate(id) {
    try {
        if (db) {
            const doc = await db.collection('templates').doc(id).get();
            if (doc.exists) {
                const data = doc.data();
                loadTemplateData(data, id);
                return;
            }
        }
        loadTemplateFromLocalStorage(id);
    } catch (error) {
        console.error('❌ Load error:', error);
        loadTemplateFromLocalStorage(id);
    }
}

function loadTemplateFromLocalStorage(id) {
    try {
        const templates = JSON.parse(localStorage.getItem('procv_visual_templates') || '[]');
        const template = templates.find(t => t.id === id);
        
        if (template) {
            loadTemplateData(template, id);
        } else {
            showToast('Template not found', 'error');
            setTimeout(() => {
                window.location.href = 'templates.html';
            }, 1500);
        }
    } catch (error) {
        console.error('❌ LocalStorage load error:', error);
        showToast('Error loading template', 'error');
    }
}

function loadTemplateData(data, id) {
    STATE.template = {
        id: id,
        name: data.name || 'Untitled',
        category: data.category || 'cv',
        plan: data.plan || 'free',
        status: data.status || 'draft',
        pageSize: data.pageSize || 'A4',
        orientation: data.orientation || 'portrait',
        description: data.description || '',
        thumbnail: data.thumbnail || '📄',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        pages: data.pages || [{
            id: generatePageId(),
            name: 'Page 1',
            width: 794,
            height: 1123,
            elements: []
        }],
        design: data.design || {
            primaryColor: '#2563EB',
            secondaryColor: '#0F172A',
            bgColor: '#FFFFFF',
            font: 'Inter',
            margins: 'medium'
        }
    };
    
    STATE.templateId = id;
    STATE.isEditing = true;
    STATE.currentPageIndex = 0;
    
    document.getElementById('templateNameInput').value = STATE.template.name;
    updatePlanBadge(STATE.template.plan);
    updateCategoryBadge(STATE.template.category);
    updateCategoryButtons(STATE.template.category);
    setupDesignControls();
    renderAll();
    showToast('Template loaded');
}

function exportTemplate() {
    const data = JSON.stringify(STATE.template, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${STATE.template.name || 'template'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Template exported');
}

function importTemplate(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.pages && data.pages.length > 0) {
                STATE.template = data;
                STATE.templateId = data.id || 'temp_' + Date.now();
                STATE.isEditing = true;
                document.getElementById('templateNameInput').value = data.name || 'Imported';
                updatePlanBadge(data.plan || 'free');
                updateCategoryBadge(data.category || 'cv');
                updateCategoryButtons(data.category || 'cv');
                setupDesignControls();
                renderAll();
                showToast('Template imported successfully');
                autoSave();
            } else {
                showToast('Invalid template file', 'error');
            }
        } catch (err) {
            showToast('Error parsing template file', 'error');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

let autoSaveTimeout = null;

function autoSave() {
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
    }
    
    autoSaveTimeout = setTimeout(() => {
        if (STATE.template.pages.length > 0 && STATE.template.name) {
            saveToFirestore();
            document.getElementById('statusDot').className = 'status-dot saved';
        }
        autoSaveTimeout = null;
    }, 2000);
}

function cancelEdit() {
    const hasElements = STATE.template.pages.some(p => p.elements.length > 0);
    if (hasElements) {
        if (confirm('Are you sure you want to cancel? Your changes will be lost.')) {
            window.location.href = 'templates.html';
        }
    } else {
        window.location.href = 'templates.html';
    }
}

// ============================================================
// 34. STATUS BAR
// ============================================================

function updateStatusBar() {
    const statusText = document.getElementById('statusText');
    const templateIdDisplay = document.getElementById('templateIdDisplay');
    
    if (statusText) {
        const mode = STATE.isEditing ? 'Editing' : 'Creating';
        const name = STATE.template.name || 'Untitled';
        statusText.textContent = `${mode}: ${name}`;
    }
    
    if (templateIdDisplay) {
        templateIdDisplay.textContent = STATE.templateId ? `ID: ${STATE.templateId}` : '';
    }
}

function updateElementCount() {
    const count = document.getElementById('elementCount');
    if (count) {
        const total = STATE.template.pages.reduce((sum, p) => sum + (p.elements?.length || 0), 0);
        count.textContent = total + ' elements total';
    }
}

// ============================================================
// 35. RESIZE OBSERVER
// ============================================================

function setupResizeObserver() {
    const container = document.getElementById('canvasContainer');
    if (container && window.ResizeObserver) {
        const observer = new ResizeObserver(() => {
            if (STATE.zoom === 1) {
                fitToScreen();
            }
        });
        observer.observe(container);
    }
}

// ============================================================
// 36. MODAL
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
// 37. TOAST
// ============================================================

function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    
    const toast = document.createElement('div');
    toast.className = `toast-item ${type}`;
    const icon = type === 'success' ? 'fa-check-circle' : 
                 type === 'error' ? 'fa-exclamation-circle' : 
                 type === 'info' ? 'fa-info-circle' : 'fa-info-circle';
    toast.innerHTML = `<i class="fas ${icon}"></i> ${message}`;
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================================
// 38. EXPOSE GLOBALLY
// ============================================================

window.selectElement = selectElement;
window.deselectAll = deselectAll;
window.deleteElement = deleteElement;
window.duplicateElement = duplicateElement;
window.undoAction = undoAction;
window.redoAction = redoAction;
window.zoomIn = zoomIn;
window.zoomOut = zoomOut;
window.fitToScreen = fitToScreen;
window.toggleGrid = toggleGrid;
window.toggleSnap = toggleSnap;
window.toggleLeftSidebar = toggleLeftSidebar;
window.toggleRightSidebar = toggleRightSidebar;
window.closeAllSidebars = closeAllSidebars;
window.previewTemplate = previewTemplate;
window.exportPreviewPDF = exportPreviewPDF;
window.saveDraft = saveDraft;
window.publishTemplate = publishTemplate;
window.saveTemplateAndExit = saveTemplateAndExit;
window.cancelEdit = cancelEdit;
window.togglePlan = togglePlan;
window.toggleCategory = toggleCategory;
window.setCategory = setCategory;
window.exportTemplate = exportTemplate;
window.importTemplate = importTemplate;
window.addComponent = addComponent;
window.bringForward = bringForward;
window.sendBackward = sendBackward;
window.toggleVisibility = toggleVisibility;
window.toggleLock = toggleLock;
window.updateElementProperty = updateElementProperty;
window.applyPalette = applyPalette;
window.updateDesignColors = updateDesignColors;
window.updateDesignFont = updateDesignFont;
window.updateDesignMargins = updateDesignMargins;
window.updateTemplatePlan = updateTemplatePlan;
window.updatePageSize = updatePageSize;
window.updatePageOrientation = updatePageOrientation;
window.addPage = addPage;
window.deletePage = deletePage;
window.switchPage = switchPage;
window.duplicatePage = duplicatePage;
window.renamePage = renamePage;
window.openModal = openModal;
window.closeModal = closeModal;
window.showToast = showToast;
window.addElementFromMobile = addElementFromMobile;
window.togglePages = togglePages;
window.toggleLayers = toggleLayers;
window.openMobileProperties = openMobileProperties;
window.closeMobileProperties = closeMobileProperties;
window.copyElement = copyElement;
window.pasteElement = pasteElement;
window.editComponentData = editComponentData;
window.addComponentItem = addComponentItem;
window.removeComponentItem = removeComponentItem;
window.saveComponentData = saveComponentData;
window.uploadProfileImage = uploadProfileImage;
window.uploadImageForElement = uploadImageForElement;

console.log('✅ ProCV Visual Editor ready');
console.log('📄 Template:', STATE.template.name);
console.log('📊 Elements:', getCurrentPage().elements.length);
console.log('💾 Auto-save enabled (2s debounce)');
console.log('⌨️ Ctrl+Z=Undo, Ctrl+Y=Redo, Delete=Remove');
console.log('🖱️ Double-click text to edit');
console.log('📁 Category:', STATE.template.category);
console.log('💎 Plan:', STATE.template.plan);
console.log('🖼️ Image upload: Click the camera icon on profile photo');