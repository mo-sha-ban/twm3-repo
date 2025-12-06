// Script to check products and their image paths
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

async function checkProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/twm3');
    console.log('Connected to MongoDB');

    // Find all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products`);

    products.forEach(product => {
      console.log(`\nProduct: ${product.name} (${product._id})`);
      console.log(`Main Image: ${product.image || 'None'}`);

      if (product.images && Object.keys(product.images).length > 0) {
        console.log('Additional Images:');
        Object.entries(product.images).forEach(([key, value]) => {
          console.log(`  ${key}: ${value}`);
        });
      } else {
        console.log('Additional Images: None');
      }
    });

  } catch (error) {
    console.error('Error during check:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the check
checkProducts();