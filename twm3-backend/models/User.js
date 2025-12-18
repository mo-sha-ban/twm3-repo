const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true },
    email: { type: String, required: true },
    // password is optional for OAuth users
    password: { type: String },
    // OAuth provider fields
    provider: { type: String, enum: ['google', 'facebook', 'local'], default: 'local' },
    providerId: { type: String, default: '' },
    phone: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    isAdmin: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    verificationExpires: { type: Date },
    isBlocked: { type: Boolean, default: false },
    // users this user has blocked
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    created_at: { type: Date, default: Date.now },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    courseProgress: [{
        course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
        completedLessons: [String] // lesson _id
    }]
});

module.exports = mongoose.model("User", userSchema);
