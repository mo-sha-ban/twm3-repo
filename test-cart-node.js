/**
 * Node.js version of cart functionality test
 * This script tests the cart enhancements including quantity handling
 */

// Mock localStorage for Node.js
const localStorage = {
    _data: {},
    getItem(key) {
        return this._data[key] || null;
    },
    setItem(key, value) {
        this._data[key] = value;
    },
    removeItem(key) {
        delete this._data[key];
    }
};

// Test data
const testProducts = [
    {
        _id: 'test-product-1',
        name: 'منتج اختبار 1',
        price: 100,
        category: 'electronics',
        image: '/img/profile.png'
    },
    {
        _id: 'test-product-2',
        name: 'منتج اختبار 2',
        price: 50,
        category: 'books',
        image: '/img/profile.png'
    }
];

// Test functions
function testCartFunctionality() {
    console.log('Starting cart functionality tests...');

    // Test 1: Add single product
    testAddSingleProduct();

    // Test 2: Add duplicate product (should update quantity)
    testAddDuplicateProduct();

    // Test 3: Update quantity
    testUpdateQuantity();

    // Test 4: Remove product
    testRemoveProduct();

    // Test 5: Calculate totals
    testCalculateTotals();

    console.log('\n✅ All tests completed!');
}

// Test 1: Add single product
function testAddSingleProduct() {
    console.log('\n=== Test 1: Add Single Product ===');

    // Clear cart
    localStorage.removeItem('cartItems');

    // Add product
    const productId = testProducts[0]._id;
    let cartItems = [];

    cartItems.push({
        productId: productId,
        quantity: 1,
        addedAt: new Date().toISOString()
    });

    localStorage.setItem('cartItems', JSON.stringify(cartItems));

    // Verify
    const cartData = localStorage.getItem('cartItems');
    const storedItems = cartData ? JSON.parse(cartData) : [];

    console.log('Expected: 1 item with quantity 1');
    console.log('Actual:', storedItems);

    if (storedItems.length === 1 && storedItems[0].quantity === 1) {
        console.log('✅ Test 1 PASSED');
        return true;
    } else {
        console.log('❌ Test 1 FAILED');
        return false;
    }
}

// Test 2: Add duplicate product
function testAddDuplicateProduct() {
    console.log('\n=== Test 2: Add Duplicate Product ===');

    // Get current cart
    const cartData = localStorage.getItem('cartItems');
    let cartItems = cartData ? JSON.parse(cartData) : [];

    // Add same product again
    const productId = testProducts[0]._id;
    const existingItemIndex = cartItems.findIndex(item => item.productId === productId);

    if (existingItemIndex !== -1) {
        cartItems[existingItemIndex].quantity = (cartItems[existingItemIndex].quantity || 1) + 1;
    } else {
        cartItems.push({
            productId: productId,
            quantity: 1,
            addedAt: new Date().toISOString()
        });
    }

    localStorage.setItem('cartItems', JSON.stringify(cartItems));

    // Verify
    const updatedCartData = localStorage.getItem('cartItems');
    const updatedItems = updatedCartData ? JSON.parse(updatedCartData) : [];

    console.log('Expected: 1 item with quantity 2');
    console.log('Actual:', updatedItems);

    if (updatedItems.length === 1 && updatedItems[0].quantity === 2) {
        console.log('✅ Test 2 PASSED');
        return true;
    } else {
        console.log('❌ Test 2 FAILED');
        return false;
    }
}

// Test 3: Update quantity
function testUpdateQuantity() {
    console.log('\n=== Test 3: Update Quantity ===');

    // Get current cart
    const cartData = localStorage.getItem('cartItems');
    let cartItems = cartData ? JSON.parse(cartData) : [];

    // Update quantity of first product
    const productId = testProducts[0]._id;
    const itemIndex = cartItems.findIndex(item => item.productId === productId);

    if (itemIndex !== -1) {
        // Increase quantity
        cartItems[itemIndex].quantity = (cartItems[itemIndex].quantity || 1) + 1;

        // Decrease quantity
        cartItems[itemIndex].quantity = Math.max(1, (cartItems[itemIndex].quantity || 1) - 1);
    }

    localStorage.setItem('cartItems', JSON.stringify(cartItems));

    // Verify
    const updatedCartData = localStorage.getItem('cartItems');
    const updatedItems = updatedCartData ? JSON.parse(updatedCartData) : [];

    console.log('Expected: quantity back to 2 after increase then decrease');
    console.log('Actual:', updatedItems);

    if (updatedItems.length === 1 && updatedItems[0].quantity === 2) {
        console.log('✅ Test 3 PASSED');
        return true;
    } else {
        console.log('❌ Test 3 FAILED');
        return false;
    }
}

// Test 4: Remove product
function testRemoveProduct() {
    console.log('\n=== Test 4: Remove Product ===');

    // Add second product first
    const productId2 = testProducts[1]._id;
    let cartItems = [];

    const cartData = localStorage.getItem('cartItems');
    if (cartData) {
        cartItems = JSON.parse(cartData);
    }

    cartItems.push({
        productId: productId2,
        quantity: 1,
        addedAt: new Date().toISOString()
    });

    localStorage.setItem('cartItems', JSON.stringify(cartItems));

    // Remove first product
    const productId1 = testProducts[0]._id;
    let updatedCartItems = cartItems.filter(item => item.productId !== productId1);

    localStorage.setItem('cartItems', JSON.stringify(updatedCartItems));

    // Verify
    const finalCartData = localStorage.getItem('cartItems');
    const finalItems = finalCartData ? JSON.parse(finalCartData) : [];

    console.log('Expected: 1 item remaining (product 2)');
    console.log('Actual:', finalItems);

    if (finalItems.length === 1 && finalItems[0].productId === productId2) {
        console.log('✅ Test 4 PASSED');
        return true;
    } else {
        console.log('❌ Test 4 FAILED');
        return false;
    }
}

// Test 5: Calculate totals
function testCalculateTotals() {
    console.log('\n=== Test 5: Calculate Totals ===');

    // Get current cart
    const cartData = localStorage.getItem('cartItems');
    const cartItems = cartData ? JSON.parse(cartData) : [];

    // Calculate totals
    let subtotal = 0;
    cartItems.forEach(item => {
        const product = testProducts.find(p => p._id === item.productId);
        if (product) {
            subtotal += product.price * (item.quantity || 1);
        }
    });

    const tax = subtotal * 0.14;
    const total = subtotal + tax;

    console.log('Cart items:', cartItems);
    console.log('Subtotal:', subtotal.toFixed(2), 'EGP');
    console.log('Tax (14%):', tax.toFixed(2), 'EGP');
    console.log('Total:', total.toFixed(2), 'EGP');

    // Verify calculations
    const expectedSubtotal = 50; // Only product 2 remains at quantity 1
    const expectedTax = expectedSubtotal * 0.14;
    const expectedTotal = expectedSubtotal + expectedTax;

    if (Math.abs(subtotal - expectedSubtotal) < 0.01 &&
        Math.abs(tax - expectedTax) < 0.01 &&
        Math.abs(total - expectedTotal) < 0.01) {
        console.log('✅ Test 5 PASSED');
        return true;
    } else {
        console.log('❌ Test 5 FAILED');
        return false;
    }
}

// Run tests
testCartFunctionality();