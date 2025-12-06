/**
 * Find products whose image files referenced in DB do not exist on disk.
 * Usage: node scripts/find-missing-images.js
 */

const mongoose = require('mongoose');
const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/twm3';

function existsOnDisk(urlPath) {
  if (!urlPath || typeof urlPath !== 'string') return false;
  // Normalize to public relative path
  if (urlPath.startsWith('/')) urlPath = urlPath.slice(1);
  const full = path.join(__dirname, '..', 'public', urlPath);
  return fs.existsSync(full);
}

async function run() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const products = await Product.find({}).lean();
  const missing = [];
  for (const p of products) {
    const imageMissing = !!(p.image && !existsOnDisk(p.image));
    let imagesMissing = [];
    if (p.images && typeof p.images === 'object') {
      for (const [k, v] of Object.entries(p.images)) {
        if (v && !existsOnDisk(v)) imagesMissing.push(k);
      }
    }
    if (imageMissing || imagesMissing.length > 0) {
      missing.push({ _id: p._id, title: p.name, image: p.image, missingImages: imagesMissing });
    }
  }
  console.log('Found', missing.length, 'products with missing image files');
  missing.slice(0,50).forEach(m => console.log(m));
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
