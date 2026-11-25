/**
 * ProCV - Firebase Configuration
 * Complete configuration with Firestore helpers
 */

// ============================================================
// 1. FIREBASE CONFIG
// ============================================================

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyAbJ7moAGaFXvuAkE6KLnVAPGOy4gvur0g",
    authDomain: "yourcv-1.firebaseapp.com",
    projectId: "yourcv-1",
    storageBucket: "yourcv-1.firebasestorage.app",
    messagingSenderId: "148589960500",
    appId: "1:148589960500:web:4d230f9470ef4bb4b99961",
    measurementId: "G-7H2M2WD45R"
};

// ============================================================
// 2. COLLECTION NAMES
// ============================================================

const COLLECTIONS = {
    TEMPLATES: 'templates',
    USERS: 'users',
    PAYMENTS: 'payments',
    PLANS: 'plans',
    SETTINGS: 'settings',
    ADMIN: 'admin'
};

// ============================================================
// 3. INITIALIZE FIREBASE (CRITICAL FIX)
// ============================================================

console.log('🔧 Initializing Firebase...');

// Check if Firebase SDK is loaded
if (typeof firebase === 'undefined') {
    console.error('❌ Firebase SDK not loaded! Make sure the Firebase scripts are included.');
} else {
    try {
        // Check if app already exists
        let appExists = false;
        try {
            const existingApp = firebase.app();
            if (existingApp) {
                appExists = true;
                console.log('✅ Firebase app already exists');
            }
        } catch (e) {
            // App doesn't exist, we'll create it
        }
        
        if (!appExists) {
            // Initialize Firebase
            firebase.initializeApp(FIREBASE_CONFIG);
            console.log('✅ Firebase initialized successfully');
            console.log('📌 Project:', FIREBASE_CONFIG.projectId);
            console.log('📌 Auth Domain:', FIREBASE_CONFIG.authDomain);
        }
    } catch (error) {
        console.error('❌ Firebase initialization error:', error);
    }
}

// ============================================================
// 4. FIRESTORE HELPERS
// ============================================================

// Get Firestore instance
function getFirestore() {
    try {
        if (typeof firebase !== 'undefined' && firebase.firestore) {
            return firebase.firestore();
        }
    } catch (error) {
        console.warn('⚠️ Firestore not available:', error.message);
    }
    return null;
}

// Get Auth instance
function getAuth() {
    try {
        if (typeof firebase !== 'undefined' && firebase.auth) {
            return firebase.auth();
        }
    } catch (error) {
        console.warn('⚠️ Auth not available:', error.message);
    }
    return null;
}

// ============================================================
// 5. CRUD OPERATIONS
// ============================================================

// Create a document
async function createDocument(collection, data, id = null) {
    try {
        const db = getFirestore();
        if (!db) throw new Error('Firestore not available');
        
        let docRef;
        if (id) {
            docRef = db.collection(collection).doc(id);
            await docRef.set(data);
        } else {
            docRef = await db.collection(collection).add(data);
        }
        
        return { success: true, id: docRef.id, data };
    } catch (error) {
        console.error(`Error creating document in ${collection}:`, error);
        return { success: false, error: error.message };
    }
}

// Read documents
async function getDocuments(collection, filters = [], orderBy = null, limit = null) {
    try {
        const db = getFirestore();
        if (!db) throw new Error('Firestore not available');
        
        let query = db.collection(collection);
        
        filters.forEach(filter => {
            query = query.where(filter.field, filter.operator || '==', filter.value);
        });
        
        if (orderBy) {
            query = query.orderBy(orderBy.field, orderBy.direction || 'desc');
        }
        
        if (limit) {
            query = query.limit(limit);
        }
        
        const snapshot = await query.get();
        const results = [];
        snapshot.forEach(doc => {
            results.push({ id: doc.id, ...doc.data() });
        });
        
        return { success: true, data: results };
    } catch (error) {
        console.error(`Error reading documents from ${collection}:`, error);
        return { success: false, error: error.message, data: [] };
    }
}

// Get a single document
async function getDocument(collection, id) {
    try {
        const db = getFirestore();
        if (!db) throw new Error('Firestore not available');
        
        const doc = await db.collection(collection).doc(id).get();
        if (doc.exists) {
            return { success: true, data: { id: doc.id, ...doc.data() } };
        } else {
            return { success: false, error: 'Document not found', data: null };
        }
    } catch (error) {
        console.error(`Error reading document from ${collection}:`, error);
        return { success: false, error: error.message, data: null };
    }
}

// Update a document
async function updateDocument(collection, id, data) {
    try {
        const db = getFirestore();
        if (!db) throw new Error('Firestore not available');
        
        await db.collection(collection).doc(id).update(data);
        return { success: true };
    } catch (error) {
        console.error(`Error updating document in ${collection}:`, error);
        return { success: false, error: error.message };
    }
}

// Delete a document
async function deleteDocument(collection, id) {
    try {
        const db = getFirestore();
        if (!db) throw new Error('Firestore not available');
        
        await db.collection(collection).doc(id).delete();
        return { success: true };
    } catch (error) {
        console.error(`Error deleting document from ${collection}:`, error);
        return { success: false, error: error.message };
    }
}

// ============================================================
// 6. REAL-TIME LISTENERS
// ============================================================

function listenToCollection(collection, callback, filters = [], orderBy = null) {
    try {
        const db = getFirestore();
        if (!db) throw new Error('Firestore not available');
        
        let query = db.collection(collection);
        
        filters.forEach(filter => {
            query = query.where(filter.field, filter.operator || '==', filter.value);
        });
        
        if (orderBy) {
            query = query.orderBy(orderBy.field, orderBy.direction || 'desc');
        }
        
        return query.onSnapshot((snapshot) => {
            const results = [];
            snapshot.forEach(doc => {
                results.push({ id: doc.id, ...doc.data() });
            });
            callback(results);
        }, (error) => {
            console.error(`Error listening to ${collection}:`, error);
            callback([], error);
        });
    } catch (error) {
        console.error(`Error setting up listener for ${collection}:`, error);
        return null;
    }
}

// ============================================================
// 7. EXPORTS
// ============================================================

// Make everything globally available
window.FIREBASE_CONFIG = FIREBASE_CONFIG;
window.COLLECTIONS = COLLECTIONS;
window.getFirestore = getFirestore;
window.getAuth = getAuth;
window.createDocument = createDocument;
window.getDocuments = getDocuments;
window.getDocument = getDocument;
window.updateDocument = updateDocument;
window.deleteDocument = deleteDocument;
window.listenToCollection = listenToCollection;

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FIREBASE_CONFIG,
        COLLECTIONS,
        getFirestore,
        getAuth,
        createDocument,
        getDocuments,
        getDocument,
        updateDocument,
        deleteDocument,
        listenToCollection
    };
}

console.log('✅ ProCV Config loaded');
console.log('📌 Firebase Project:', FIREBASE_CONFIG.projectId);
console.log('📌 Currency: RWF');