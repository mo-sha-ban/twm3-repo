// Script to fix broken image references in products
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');
const fs = require('fs');
const path = require('path');

async function fixBrokenImages() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/twm3');
    console.log('Connected to MongoDB');

    // Find all products
    const products = await Product.find({});
    console.log(`Found ${products.length} products to check`);

    let fixedCount = 0;

    for (const product of products) {
      let needsUpdate = false;
      const updateData = {};

      // Check main image
      if (product.image && product.image.startsWith('/uploads/')) {
        const filename = product.image.replace('/uploads/', '');
        const filePath = path.join(__dirname, 'twm3-backend', 'public', 'uploads', filename);

        if (!fs.existsSync(filePath)) {
          console.log(`Broken main image for product "${product.name}": ${filename}`);
          updateData.image = null; // Remove broken image instead of using default
          needsUpdate = true;
        }
      }

      // Check additional images
      if (product.images) {
        const fixedImages = {};
        for (const [key, value] of Object.entries(product.images)) {
          if (value && value.startsWith('/uploads/')) {
            const filename = value.replace('/uploads/', '');
            const filePath = path.join(__dirname, 'twm3-backend', 'public', 'uploads', filename);

            if (!fs.existsSync(filePath)) {
              console.log(`Broken additional image for product "${product.name}": ${filename}`);
              // Remove broken image reference
              fixedImages[key] = undefined;
              needsUpdate = true;
            } else {
              fixedImages[key] = value;
            }
          } else {
            fixedImages[key] = value;
          }
        }
        if (needsUpdate) {
          updateData.images = fixedImages;
        }
      }

      // Check and clean media array - REMOVE profile.png defaults
      if (product.media && Array.isArray(product.media)) {
        const cleanedMedia = [];
        for (const mediaItem of product.media) {
          // Skip profile.png defaults
          if (mediaItem.url && mediaItem.url.includes('/img/profile.png')) {
            console.log(`Removing profile.png default from media for product "${product.name}"`);
            needsUpdate = true;
            continue; // Skip this item
          }

          // Check if uploaded files exist
          if (mediaItem.url && mediaItem.url.startsWith('/uploads/')) {
            const filename = mediaItem.url.replace('/uploads/', '').split('/').pop();
            const possiblePaths = [
              path.join(__dirname, 'twm3-backend', 'public', 'uploads', filename),
              path.join(__dirname, 'twm3-backend', 'public', 'uploads', 'images', filename),
              path.join(__dirname, 'twm3-backend', 'public', 'uploads', 'videos', filename),
              path.join(__dirname, 'twm3-backend', 'public', 'uploads', 'lesson-assets', filename)
            ];

            let fileExists = false;
            for (const checkPath of possiblePaths) {
              if (fs.existsSync(checkPath)) {
                fileExists = true;
                break;
              }
            }

            if (!fileExists) {
              console.log(`Broken media file for product "${product.name}": ${mediaItem.url}`);
              needsUpdate = true;
              continue; // Skip broken media
            }
          }

          // Keep valid media items
          cleanedMedia.push(mediaItem);
        }

        if (needsUpdate && cleanedMedia.length !== product.media.length) {
          updateData.media = cleanedMedia.length > 0 ? cleanedMedia : undefined;
        }
      }

      // Update the product if needed
      if (needsUpdate) {
        await Product.findByIdAndUpdate(product._id, updateData);
        fixedCount++;
        console.log(`Fixed product: ${product.name} (${product._id})`);
      }
    }

    console.log(`Fixed broken images for ${fixedCount} products`);
    console.log('Migration completed successfully');

  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
fixBrokenImages();