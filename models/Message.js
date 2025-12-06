const mongoose = require('mongoose');

const ReplySchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    body: { type: String },
    createdAt: { type: Date, default: Date.now }
}, { _id: false });

const MessageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    subject: { type: String, default: '' },
    body: { type: String, required: true },
    // Admin broadcast control: when true, mask real sender on UI and expose displayName
    isAdminBroadcast: { type: Boolean, default: false },
    // Optional UI display name (e.g., 'Admin')
    displayName: { type: String, default: '' },
    read: { type: Boolean, default: false },
    viaEmail: { type: Boolean, default: false },
    replies: [ReplySchema],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);
