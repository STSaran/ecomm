// Sample product data
const sampleProducts = [
    {
        id: 1,
        name: "Classic White T-Shirt",
        price: 499,
        category: "Clothing",
        image: "/images/1.jpg",
        description: "Premium cotton classic white t-shirt"
    },
    {
        id: 2,
        name: "Blue Denim Jeans",
        price: 1299,
        category: "Clothing",
        image: "/images/2.png",
        description: "Comfortable slim-fit blue denim jeans"
    },
    {
        id: 3,
        name: "Running Shoes",
        price: 2499,
        category: "Footwear",
        image: "/images/3.png",
        description: "Lightweight running shoes with cushioning"
    },
    {
        id: 4,
        name: "Leather Wallet",
        price: 899,
        category: "Accessories",
        image: "/images/4.png",
        description: "Genuine leather wallet with multiple card slots"
    },
    {
        id: 5,
        name: "Smart Watch",
        price: 4999,
        category: "Electronics",
        image: "/images/5.avif",
        description: "Smart watch with fitness tracking features"
    },
    {
        id: 6,
        name: "Wireless Earbuds",
        price: 3499,
        category: "Electronics",
        image: "/images/6.jpg",
        description: "True wireless earbuds with noise cancellation"
    },
    {
        id: 7,
        name: "Backpack",
        price: 1499,
        category: "Accessories",
        image: "/images/7.jpg",
        description: "Durable backpack with laptop compartment"
    },
    {
        id: 8,
        name: "Sunglasses",
        price: 999,
        category: "Accessories",
        image: "/images/8.png",
        description: "UV protection stylish sunglasses"
    }
];

class Shop {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.categories = new Set();
        this.cart = [];
        this.init();
    }

    async init() {
        try {
            // Initialize database first
            await db.init();
            
            // Initialize event listeners
            this.initializeEventListeners();
            
            // Load products
            await this.loadProducts();
            
            // Update UI
            this.renderProducts();
            this.renderCategories();
            this.updateCartCount();
            
            // Check online status
            this.checkOnlineStatus();
        } catch (error) {
            console.error('Error initializing shop:', error);
            this.showToast('Error initializing shop. Please refresh the page.');
        }
    }

    initializeEventListeners() {
        // Search
        document.getElementById('search').addEventListener('input', (e) => {
            this.filterProducts(e.target.value);
        });

        // Sort
        document.getElementById('sort-select').addEventListener('change', (e) => {
            this.sortProducts(e.target.value);
        });

        // Price filter
        document.getElementById('price-filter').addEventListener('input', (e) => {
            document.getElementById('price-value').textContent = `₹${e.target.value}`;
            this.filterByPrice(parseInt(e.target.value));
        });

        // Cart modal
        document.getElementById('cart-btn').addEventListener('click', () => {
            this.toggleCart();
        });

        document.querySelector('.close-modal').addEventListener('click', () => {
            this.toggleCart();
        });

        // Checkout
        document.getElementById('checkout-btn').addEventListener('click', () => {
            this.checkout();
        });
    }

    async loadProducts() {
        try {
            // Try to get products from IndexedDB
            this.products = await db.getProducts();
            
            // If no products in DB, load sample data
            if (!this.products || this.products.length === 0) {
                for (const product of sampleProducts) {
                    await db.addProduct(product);
                }
                this.products = sampleProducts;
            }

            this.filteredProducts = [...this.products];
            this.categories = new Set(this.products.map(p => p.category));
            
            // Load cart
            this.cart = await db.getCart() || [];
        } catch (error) {
            console.error('Error loading products:', error);
            this.showToast('Error loading products. Please refresh the page.');
            throw error;
        }
    }

    renderProducts(products = this.filteredProducts) {
        const grid = document.getElementById('products-grid');
        grid.innerHTML = products.map(product => `
            <div class="product-card">
                <img src="${product.image}" 
                     alt="${product.name}" 
                     class="product-image" 
                     loading="lazy"
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/200x200?text=${encodeURIComponent(product.name)}'">
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <p class="product-price">₹${product.price.toLocaleString()}</p>
                </div>
                <button class="add-to-cart" onclick="shop.addToCart(${product.id})">
                    <i class="fas fa-shopping-cart"></i> Add to Cart
                </button>
            </div>
        `).join('');
    }

    renderCategories() {
        const categoriesList = document.getElementById('categories-list');
        categoriesList.innerHTML = Array.from(this.categories).map(category => `
            <div class="category-item">
                <input type="checkbox" id="${category}" onchange="shop.filterByCategory()">
                <label for="${category}">${category}</label>
            </div>
        `).join('');
    }

    filterProducts(searchTerm) {
        const term = searchTerm.toLowerCase();
        this.filteredProducts = this.products.filter(product => 
            product.name.toLowerCase().includes(term) ||
            product.description.toLowerCase().includes(term)
        );
        this.renderProducts();
    }

    filterByCategory() {
        const selectedCategories = Array.from(document.querySelectorAll('#categories-list input:checked'))
            .map(input => input.id);

        this.filteredProducts = selectedCategories.length === 0 
            ? [...this.products]
            : this.products.filter(product => selectedCategories.includes(product.category));

        this.renderProducts();
    }

    filterByPrice(maxPrice) {
        this.filteredProducts = this.products.filter(product => product.price <= maxPrice);
        this.renderProducts();
    }

    sortProducts(criterion) {
        switch (criterion) {
            case 'price-low':
                this.filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                this.filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'name':
                this.filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            default:
                this.filteredProducts = [...this.products];
        }
        this.renderProducts();
    }

    async addToCart(productId) {
        try {
            const product = this.products.find(p => p.id === productId);
            const cartItem = {
                id: Date.now(),
                productId,
                name: product.name,
                price: product.price,
                image: product.image,
                quantity: 1
            };
            
            await db.addToCart(cartItem);
            this.cart.push(cartItem);
            
            this.updateCartCount();
            this.showToast(`${product.name} added to cart!`);
        } catch (error) {
            console.error('Error adding to cart:', error);
            this.showToast('Error adding item to cart. Please try again.');
        }
    }

    async removeFromCart(itemId) {
        try {
            await db.removeFromCart(itemId);
            this.cart = this.cart.filter(item => item.id !== itemId);
            this.updateCartCount();
            this.renderCart();
        } catch (error) {
            console.error('Error removing from cart:', error);
            this.showToast('Error removing item from cart. Please try again.');
        }
    }

    updateCartCount() {
        document.getElementById('cart-count').textContent = this.cart.length;
    }

    toggleCart() {
        const modal = document.getElementById('cart-modal');
        modal.style.display = modal.style.display === 'none' ? 'block' : 'none';
        if (modal.style.display === 'block') {
            this.renderCart();
        }
    }

    renderCart() {
        const cartItems = document.getElementById('cart-items');
        const total = this.cart.reduce((sum, item) => sum + item.price, 0);
        
        if (this.cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Your cart is empty</p>
                </div>
            `;
        } else {
            cartItems.innerHTML = this.cart.map(item => `
                <div class="cart-item">
                    <img src="${item.image}" 
                         alt="${item.name}"
                         onerror="this.onerror=null; this.src='https://via.placeholder.com/80x80?text=${encodeURIComponent(item.name)}'">
                    <div class="cart-item-info">
                        <h4>${item.name}</h4>
                        <p class="cart-item-price">₹${item.price.toLocaleString()}</p>
                    </div>
                    <button onclick="shop.removeFromCart(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `).join('');
        }
        
        document.getElementById('cart-total').textContent = total.toLocaleString();
    }

    async checkout() {
        try {
            await db.clearCart();
            this.cart = [];
            this.updateCartCount();
            this.toggleCart();
            this.showToast('Thank you for your purchase!');
        } catch (error) {
            console.error('Error during checkout:', error);
            this.showToast('Error processing checkout. Please try again.');
        }
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }

    checkOnlineStatus() {
        const updateOnlineStatus = () => {
            const offlineMessage = document.getElementById('offline-message');
            if (navigator.onLine) {
                offlineMessage.style.display = 'none';
            } else {
                offlineMessage.style.display = 'block';
            }
        };

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        updateOnlineStatus();
    }
}

// Initialize the shop
const shop = new Shop(); 