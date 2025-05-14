class AdminPanel {
    constructor() {
        this.productForm = document.getElementById('productForm');
        this.productId = document.getElementById('productId');
        this.productName = document.getElementById('productName');
        this.productPrice = document.getElementById('productPrice');
        this.productCategory = document.getElementById('productCategory');
        this.productDescription = document.getElementById('productDescription');
        this.productImage = document.getElementById('productImage');
        this.imagePreview = document.getElementById('imagePreview');
        this.productsTableBody = document.getElementById('productsTableBody');
        
        this.init();
    }

    async init() {
        try {
            // Initialize database
            await db.init();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load and display products
            await this.loadProducts();
        } catch (error) {
            console.error('Error initializing admin panel:', error);
            this.showToast('Error initializing admin panel. Please refresh the page.');
        }
    }

    setupEventListeners() {
        // Form submission
        this.productForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Image preview
        this.productImage.addEventListener('change', (e) => this.handleImageChange(e));
    }

    async loadProducts() {
        try {
            const products = await db.getProducts();
            this.renderProductsTable(products);
        } catch (error) {
            console.error('Error loading products:', error);
            this.showToast('Error loading products. Please try again.');
        }
    }

    renderProductsTable(products) {
        this.productsTableBody.innerHTML = products.map(product => `
            <tr>
                <td><img src="${product.image}" alt="${product.name}"></td>
                <td>${product.name}</td>
                <td>₹${product.price.toLocaleString()}</td>
                <td>${product.category}</td>
                <td class="action-buttons">
                    <button onclick="adminPanel.editProduct(${product.id})" class="edit-btn">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="adminPanel.deleteProduct(${product.id})" class="delete-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        try {
            const imageFile = this.productImage.files[0];
            if (!imageFile && !this.productId.value) {
                throw new Error('Please select an image');
            }

            // Convert image to base64 if a new image is selected
            const imageUrl = imageFile ? await this.convertImageToBase64(imageFile) : null;

            const product = {
                id: this.productId.value ? parseInt(this.productId.value) : Date.now(),
                name: this.productName.value,
                price: parseInt(this.productPrice.value),
                category: this.productCategory.value,
                description: this.productDescription.value,
                image: imageUrl || (this.productId.value ? (await db.getProducts()).find(p => p.id === parseInt(this.productId.value)).image : null)
            };

            await db.addProduct(product);
            await this.loadProducts();
            this.clearForm();
            this.showToast(`Product ${this.productId.value ? 'updated' : 'added'} successfully!`);
        } catch (error) {
            console.error('Error saving product:', error);
            this.showToast(error.message || 'Error saving product. Please try again.');
        }
    }

    async editProduct(productId) {
        try {
            const products = await db.getProducts();
            const product = products.find(p => p.id === productId);
            
            if (product) {
                this.productId.value = product.id;
                this.productName.value = product.name;
                this.productPrice.value = product.price;
                this.productCategory.value = product.category;
                this.productDescription.value = product.description;
                
                // Show current image in preview
                this.imagePreview.innerHTML = `<img src="${product.image}" alt="${product.name}">`;
                this.productImage.required = false; // Don't require new image for editing
            }
        } catch (error) {
            console.error('Error loading product for edit:', error);
            this.showToast('Error loading product. Please try again.');
        }
    }

    async deleteProduct(productId) {
        if (confirm('Are you sure you want to delete this product?')) {
            try {
                await db.deleteProduct(productId);
                await this.loadProducts();
                this.showToast('Product deleted successfully!');
            } catch (error) {
                console.error('Error deleting product:', error);
                this.showToast('Error deleting product. Please try again.');
            }
        }
    }

    handleImageChange(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        }
    }

    convertImageToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    clearForm() {
        this.productForm.reset();
        this.productId.value = '';
        this.imagePreview.innerHTML = '';
        this.productImage.required = true;
    }

    showToast(message) {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.style.display = 'block';
        setTimeout(() => {
            toast.style.display = 'none';
        }, 3000);
    }
}

// Initialize admin panel
const adminPanel = new AdminPanel(); 