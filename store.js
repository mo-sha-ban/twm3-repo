// Store page functionality - Modern Design
(function() {
  'use strict';

  let allProducts = [];
  let filteredProducts = [];
  let currentCategory = 'all';
  let searchTerm = '';

  // Initialize store
  function initStore() {
    console.log('Initializing store...');
    loadProducts();
    setupEventListeners();
  }

  // Setup event listeners
  function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
      searchInput.addEventListener('input', handleSearch);
    }

    // Category filtering
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(button => {
      button.addEventListener('click', () => {
        const category = button.getAttribute('data-category');
        filterByCategory(category);
      });
    });

    // Clear search
    const clearSearchBtn = document.getElementById('clearSearch');
    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', clearSearch);
    }
  }

  // Load products from API
  async function loadProducts() {
    try {
      console.log('Loading products from API...');
      const response = await fetch('twm3-repo-production.up.railway.app/api/products');

      if (!response.ok) {
        throw new Error('فشل في تحميل المنتجات');
      }

      allProducts = await response.json();
      console.log('Loaded products:', allProducts);

      // Get unique categories
      const categories = [...new Set(allProducts.map(product => product.category).filter(Boolean))];
      renderCategories(categories);

      // Initial render
      filterAndRenderProducts();

    } catch (error) {
      console.error('Error loading products:', error);
      showError('حدث خطأ في تحميل المنتجات. يرجى المحاولة مرة أخرى.');
    }
  }

  // Render category buttons
  function renderCategories(categories) {
    const categoryContainer = document.getElementById('categories');
    if (!categoryContainer) return;

    const categoryButtons = [
      { id: 'all', name: 'الكل', icon: 'fa-th-large' },
      ...categories.map(category => ({
        id: category,
        name: getCategoryName(category),
        icon: getCategoryIcon(category)
      }))
    ];

    categoryContainer.innerHTML = categoryButtons.map(category => `
      <button class="category-btn ${category.id === 'all' ? 'active' : ''}"
              data-category="${category.id}">
        <i class="fas ${category.icon}"></i>
        <span>${category.name}</span>
      </button>
    `).join('');

    // Re-attach event listeners
    const newCategoryButtons = document.querySelectorAll('.category-btn');
    newCategoryButtons.forEach(button => {
      button.addEventListener('click', () => {
        const category = button.getAttribute('data-category');
        filterByCategory(category);
      });
    });
  }

  // Get category display name
  function getCategoryName(category) {
    const categoryNames = {
      'electronics': 'إلكترونيات',
      'books': 'كتب',
      'courses': 'كورسات',
      'software': 'برمجيات',
      'hardware': 'أجهزة',
      'accessories': 'إكسسوارات',
      'general': 'عام'
    };
    return categoryNames[category] || category;
  }

  // Get category icon
  function getCategoryIcon(category) {
    const categoryIcons = {
      'electronics': 'fa-laptop',
      'books': 'fa-book',
      'courses': 'fa-graduation-cap',
      'software': 'fa-code',
      'hardware': 'fa-microchip',
      'accessories': 'fa-plug',
      'general': 'fa-box'
    };
    return categoryIcons[category] || 'fa-tag';
  }

  // Handle search
  function handleSearch(e) {
    searchTerm = e.target.value.toLowerCase().trim();
    filterAndRenderProducts();

    // Show/hide clear button
    const clearBtn = document.getElementById('clearSearch');
    if (clearBtn) {
      clearBtn.style.display = searchTerm ? 'block' : 'none';
    }
  }

  // Clear search
  function clearSearch() {
    const searchInput = document.getElementById('productSearch');
    if (searchInput) {
      searchInput.value = '';
      searchTerm = '';
      filterAndRenderProducts();
    }
    document.getElementById('clearSearch').style.display = 'none';
  }

  // Filter by category
  function filterByCategory(category) {
    currentCategory = category;

    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-category') === category);
    });

    filterAndRenderProducts();
  }

  // Filter and render products
  function filterAndRenderProducts() {
    // Filter by category
    let filtered = currentCategory === 'all'
      ? allProducts
      : allProducts.filter(product => product.category === currentCategory);

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.category.toLowerCase().includes(searchTerm)
      );
    }

    filteredProducts = filtered;
    renderProducts(filteredProducts);
    updateResultsCount(filteredProducts.length);
  }

  // Update results count
  function updateResultsCount(count) {
    const countElement = document.getElementById('resultsCount');
    if (countElement) {
      countElement.textContent = `عرض ${count} منتج${count !== 1 ? '' : ''}`;
    }
  }

  // Render products
  function renderProducts(products) {
    const productGrid = document.getElementById('lists');
    if (!productGrid) return;

    if (!products || products.length === 0) {
      productGrid.innerHTML = `
        <div class="no-products">
          <i class="fas fa-box-open"></i>
          <h3>لا توجد منتجات</h3>
          <p>لم نتمكن من العثور على منتجات تطابق بحثك</p>
        </div>
      `;
      return;
    }

    productGrid.innerHTML = products.map(product => `
      <div class="product-card ${product.featured ? 'featured-product' : ''}" data-product-id="${product._id}">
        <div class="product-image-container">
          <img src="${product.image || '/img/profile.png'}"
               alt="${product.name}"
               class="product-image"
               loading="lazy">
          ${product.featured ? '<div class="featured-badge"><i class="fas fa-crown"></i> منتج مميز</div>' : ''}
          <div class="product-overlay">
            <button class="quick-view-btn" onclick="viewProduct('${product._id}')">
              <i class="fas fa-eye"></i>
              عرض سريع
            </button>
          </div>
        </div>

        <div class="product-info">
          <div class="product-category">${getCategoryName(product.category)}</div>
          <h3 class="product-title">${escapeHtml(product.name)}</h3>
          <p class="product-description">${escapeHtml(product.description.substring(0, 100))}${product.description.length > 100 ? '...' : ''}</p>

          <div class="product-rating">
            ${renderStars(product.rating || 0)}
            <span class="rating-text">(${product.rating || 0})</span>
          </div>

          <div class="product-price">
            <span class="price">${product.price || 0} ج.م</span>
          </div>

          <div class="product-actions">
            <button class="btn btn-primary" onclick="viewProduct('${product._id}')">
              <i class="fas fa-eye"></i>
              عرض التفاصيل
            </button>
            ${product.inStock ? `
              <button class="btn btn-secondary" onclick="addToCart('${product._id}')">
                <i class="fas fa-cart-plus"></i>
                إضافة للسلة
              </button>
            ` : `
              <button class="btn btn-disabled" disabled>
                <i class="fas fa-times"></i>
                غير متوفر
              </button>
            `}
          </div>
        </div>
      </div>
    `).join('');
  }

  // Render star rating
  function renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';

    for (let i = 0; i < fullStars; i++) {
      stars += '<i class="fas fa-star"></i>';
    }

    if (hasHalfStar) {
      stars += '<i class="fas fa-star-half-alt"></i>';
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars += '<i class="far fa-star"></i>';
    }

    return stars;
  }

  // View product details
  function viewProduct(productId) {
    window.location.href = `product-details.html?id=${productId}`;
  }

  // Add to cart functionality
  function addToCart(productId) {
      try {
          // Get current cart items from localStorage
          const cartData = localStorage.getItem('cartItems');
          const cartItems = cartData ? JSON.parse(cartData) : [];

          // Check if product already in cart
          const existingItemIndex = cartItems.findIndex(item => item.productId === productId);

          if (existingItemIndex !== -1) {
              // Product already in cart, update quantity
              cartItems[existingItemIndex].quantity = (cartItems[existingItemIndex].quantity || 1) + 1;
              showToast('تم تحديث الكمية في السلة', 'success');
          } else {
              // Add new product to cart with quantity 1
              cartItems.push({
                  productId: productId,
                  quantity: 1,
                  addedAt: new Date().toISOString()
              });

              showToast('تم إضافة المنتج للسلة', 'success');
          }

          // Save updated cart
          localStorage.setItem('cartItems', JSON.stringify(cartItems));

          // Update cart badge if we're on store page
          if (typeof updateCartBadge === 'function') {
              updateCartBadge();
          }

      } catch (error) {
          console.error('Error adding to cart:', error);
          showToast('خطأ في إضافة المنتج للسلة', 'error');
      }
  }

  // Show error message
  function showError(message) {
    const productGrid = document.getElementById('lists');
    if (productGrid) {
      productGrid.innerHTML = `
        <div class="error-message">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>خطأ</h3>
          <p>${message}</p>
          <button class="btn btn-primary" onclick="location.reload()">إعادة المحاولة</button>
        </div>
      `;
    }
  }

  // Show toast notification
  function showToast(message, type = 'info') {
    // Simple toast implementation
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  // Utility function to escape HTML
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Global functions
  window.viewProduct = viewProduct;
  window.addToCart = addToCart;

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStore);
  } else {
    initStore();
  }

})();
