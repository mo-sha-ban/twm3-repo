require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const product = await Product.findOne({name: 'rezk'});
    if (!product) {
      console.log('Product rezk not found');
      return;
    }
    
    console.log('Product rezk:');
    console.log('  name:', product.name);
    console.log('  description:', product.description?.substring(0, 50));
    console.log('  long_description:', product.long_description?.substring(0, 100) || 'EMPTY');
    console.log('  media count:', product.media?.length || 0);
    if (product.media && product.media.length > 0) {
      console.log('  Media items:');
      product.media.forEach((m, i) => {
        console.log(`    [${i}] type=${m.type}, url=${m.url.substring(0, 50)}`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.disconnect();
  }
}

check();
