const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

// Helper function to process media array from request
const processMedia = (body, files) => {
    let media = [];
    if (body.media && typeof body.media === 'string') {
        try {
            media = JSON.parse(body.media);
        } catch (e) {
            console.error('Error parsing media JSON:', e);
        }
    } else if (Array.isArray(body.media)) {
        media = body.media;
    }

    const uploadedFiles = files ? Object.values(files).flat() : [];
    
    return media.map(item => {
        // Skip profile.png defaults completely
        if (item.url && item.url.includes('/img/profile.png')) {
            console.warn('Skipping profile.png default from media');
            return null;
        }

        if (item.type === 'image' || item.type === 'video') {
            if (item.fileId) {
                const file = uploadedFiles.find(f => f.fieldname === `media[${item.fileId}][file]`);
                if (file) {
                    const folder = item.type === 'image' ? 'images' : 'videos';
                    return {
                        type: item.type,
                        url: `/uploads/${folder}/${file.filename}`
                    };
                }
            } else if(item.url) {
                 return {
                    type: item.type,
                    url: item.url
                };
            }
        }
        return item; // For links
    }).filter(Boolean); // Remove any null/undefined entries
};


// جلب جميع المنتجات
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب المنتجات' });
  }
};

// جلب منتج واحد
exports.getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'المنتج غير موجود' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب المنتج' });
  }
};

// إضافة منتج جديد
exports.createProduct = async (req, res) => {
  try {
    const { name, description, long_description, price, rating, category, inStock, featured } = req.body;

    if (!name || !description || !price) {
      return res.status(400).json({ error: 'الاسم والوصف والسعر مطلوبة' });
    }
    
    console.log('createProduct: req.files=', req.files?.map(f => ({ fieldname: f.fieldname, filename: f.filename })) || 'none');
    
    let mainImage;
    const imageFile = req.files && req.files.find(file => file.fieldname === 'image');
    if (imageFile) {
        mainImage = `/uploads/images/${imageFile.filename}`;
        console.log('createProduct: mainImage=', mainImage);
    } else {
        console.warn('createProduct: No image file found in request!');
    }

    const media = processMedia(req.body, req.files);

    const productData = {
      name,
      description,
      long_description,
      price: parseFloat(price) || 0,
      rating: parseFloat(rating) || 0,
      image: mainImage,
      media: media,
      category: category || 'general',
      inStock: inStock === 'true' || inStock === true,
      featured: featured === 'true' || featured === true
    };

    const product = new Product(productData);

    await product.save();
    res.status(201).json({ message: 'تم إضافة المنتج بنجاح', product });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء إضافة المنتج' });
  }
};

// تحديث منتج
exports.updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'المنتج غير موجود' });
    }

    const { name, description, long_description, price, rating, category, inStock, featured } = req.body;

    const media = processMedia(req.body, req.files);

    const updateData = {
      name,
      description,
      long_description,
      price: parseFloat(price) || product.price,
      rating: parseFloat(rating) || product.rating,
      category: category || product.category,
      inStock: inStock !== undefined ? (inStock === 'true' || inStock === true) : product.inStock,
      featured: featured !== undefined ? (featured === 'true' || featured === true) : product.featured,
      media: media,
      updatedAt: Date.now()
    };
    
    const oldImage = product.image;

    const imageFile = req.files && req.files.find(file => file.fieldname === 'image');

    // Handle new image upload
    if (imageFile) {
      updateData.image = `/uploads/images/${imageFile.filename}`;
      
      // Delete old image if it exists
      if (oldImage) {
        const oldImagePath = path.join(__dirname, '..', 'public', oldImage);
        fs.unlink(oldImagePath, (err) => {
          if (err) console.error(`Failed to delete old image: ${oldImagePath}`, err);
        });
      }
    } else if (req.body.image === '') {
      // Handle image removal
      updateData.image = null;
      if (oldImage) {
        const oldImagePath = path.join(__dirname, '..', 'public', oldImage);
        fs.unlink(oldImagePath, (err) => {
          if (err) console.error(`Failed to delete old image: ${oldImagePath}`, err);
        });
      }
    }


    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({ message: 'تم تحديث المنتج بنجاح', product: updatedProduct });

  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء تحديث المنتج' });
  }
};


// حذف منتج
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ error: 'المنتج غير موجود' });
    }

    res.json({ message: 'تم حذف المنتج بنجاح' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء حذف المنتج' });
  }
};

// جلب المنتجات المميزة
exports.getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ featured: true }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب المنتجات المميزة' });
  }
};

// جلب المنتجات حسب الفئة
exports.getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const products = await Product.find({ category }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products by category:', error);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب المنتجات حسب الفئة' });
  }
};
