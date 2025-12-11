const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { 
        type: String, 
        enum: ['course', 'update', 'discount', 'announcement', 'message', 'info', 'success', 'warning', 'error'],
        default: 'info'
    },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    message: { type: String, default: '' }, // Alias for body
    read: { type: Boolean, default: false },
    link: { type: String, default: '' }, // Optional link to navigate to
    createdAt: { type: Date, default: Date.now }
});

// Index for efficient queries
NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, read: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);

