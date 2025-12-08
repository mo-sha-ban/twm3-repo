const mongoose = require('mongoose');

const counterConfigSchema = new mongoose.Schema({
    baseCount: {
        type: Number,
        required: true,
        min: 0,
        default: 50000
    },
    dailyIncrement: {
        type: Number,
        required: true,
        min: 0,
        default: 20
    },
    startDate: {
        type: Date,
        required: true,
        default: new Date('2024-01-01')
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Virtual for calculating current count
counterConfigSchema.virtual('currentCount').get(function() {
    const currentDate = new Date();
    const daysSinceStart = Math.floor((currentDate - this.startDate) / (1000 * 60 * 60 * 24));
    return Math.floor(this.baseCount + (daysSinceStart * this.dailyIncrement));
});

module.exports = mongoose.model('CounterConfig', counterConfigSchema);