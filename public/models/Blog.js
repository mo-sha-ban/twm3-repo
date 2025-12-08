const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    excerpt: String,
    featuredImage: String,
    galleryImages: [String],
    metaTitle: String,
    metaDescription: String,
    slug: { type: String, unique: true },
    focusKeyword: String,
    status: { 
        type: String, 
        enum: ['draft', 'published', 'private'], 
        default: 'draft' 
    },
    allowComments: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    publishDate: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: Date,
    tags: [String],
    visits: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Blog', blogSchema);