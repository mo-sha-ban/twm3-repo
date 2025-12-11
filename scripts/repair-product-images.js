/*
Repair product image URLs in the database.
- If product.image is set to '/uploads/<filename>' but the file exists in 'public/uploads/images/<filename>', update product.image to '/uploads/images/<filename>'.
- Similarly, for product.images (object), repair each imgN.

Usage: node scripts/repair-product-images.js
*/

const mongoose = require('mongoose');
const Product = require('../models/Product');
const path = require('path');
const fs = require('fs');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/twm3';

async function fileExistsRel(relPath) {
  try {
    return fs.existsSync(path.join(__dirname, '..', 'public', relPath));
  } catch (e) {
    return false;
  }
}

async function run() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');
  const products = await Product.find({}).lean();
  let updatedCount = 0;
  for (const p of products) {
    const updates = {};
    // repair product.image if it points to /uploads/<file>
    if (p.image && p.image.startsWith('/uploads/')) {
      const filename = path.basename(p.image);
      const candidates = [
        `/uploads/${filename}`,
        `/uploads/images/${filename}`,
        `/uploads/videos/${filename}`,
        `/uploads/avatars/${filename}`
      ];
      let found = null;
      for (const c of candidates) {
        if (await fileExistsRel(c)) { found = c; break; }
      }
      if (found && found !== p.image) {
        updates.image = found;
      }
    }

    // repair product.images (object key values)
    if (p.images && typeof p.images === 'object') {
      const newImages = { ...p.images };
      let imagesChanged = false;
      for (const [key, val] of Object.entries(p.images)) {
        if (!val || typeof val !== 'string') continue;
        if (val.startsWith('/uploads/')) {
          const filename = path.basename(val);
          const candidates = [
            `/uploads/${filename}`,
            `/uploads/images/${filename}`,
            `/uploads/videos/${filename}`,
            `/uploads/avatars/${filename}`
          ];
          let found = null;
          for (const c of candidates) {
            if (await fileExistsRel(c)) { found = c; break; }
          }
          if (found && found !== val) {
            newImages[key] = found;
            imagesChanged = true;
          }
        }
      }
      if (imagesChanged) updates.images = newImages;
    }

    if (Object.keys(updates).length > 0) {
      await Product.findByIdAndUpdate(p._id, updates);
      updatedCount++;
      console.log('Updated product', p._id, updates);
    }
  }
  console.log('Done. Updated', updatedCount, 'products.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
