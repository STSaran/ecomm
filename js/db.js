const DB_NAME = 'ecoShopDB';
const DB_VERSION = 1;

class Database {
    constructor() {
        this.db = null;
    }

    async init() {
        try {
            this.db = await this.initDB();
            return this.db;
        } catch (error) {
            console.error('Failed to initialize database:', error);
            throw error;
        }
    }

    initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error("Error opening database");
                reject(request.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log("Database opened successfully");
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object stores
                if (!db.objectStoreNames.contains('products')) {
                    const productStore = db.createObjectStore('products', { keyPath: 'id' });
                    productStore.createIndex('category', 'category', { unique: false });
                    productStore.createIndex('price', 'price', { unique: false });
                }

                if (!db.objectStoreNames.contains('cart')) {
                    const cartStore = db.createObjectStore('cart', { keyPath: 'id' });
                    cartStore.createIndex('productId', 'productId', { unique: false });
                }
            };
        });
    }

    async addProduct(product) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        const transaction = this.db.transaction(['products'], 'readwrite');
        const store = transaction.objectStore('products');
        return new Promise((resolve, reject) => {
            const request = store.put(product);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getProducts() {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['products'], 'readonly');
            const store = transaction.objectStore('products');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getProductsByCategory(category) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['products'], 'readonly');
            const store = transaction.objectStore('products');
            const index = store.index('category');
            const request = index.getAll(category);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async addToCart(item) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        const transaction = this.db.transaction(['cart'], 'readwrite');
        const store = transaction.objectStore('cart');
        return new Promise((resolve, reject) => {
            const request = store.put(item);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async removeFromCart(id) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        const transaction = this.db.transaction(['cart'], 'readwrite');
        const store = transaction.objectStore('cart');
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getCart() {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['cart'], 'readonly');
            const store = transaction.objectStore('cart');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async clearCart() {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        const transaction = this.db.transaction(['cart'], 'readwrite');
        const store = transaction.objectStore('cart');
        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteProduct(id) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        const transaction = this.db.transaction(['products'], 'readwrite');
        const store = transaction.objectStore('products');
        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

const db = new Database(); 