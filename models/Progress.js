const mongoose = require('mongoose');

const CompletedLessonSchema = new mongoose.Schema({
  unitId: { type: mongoose.Schema.Types.ObjectId, required: false },
  lessonId: { type: mongoose.Types.ObjectId, required: true },
  completedAt: { type: Date, default: Date.now }
}, { _id: false });

const LastViewedSchema = new mongoose.Schema({
  unitId: { type: mongoose.Schema.Types.ObjectId },
  lessonId: { type: mongoose.Schema.Types.ObjectId },
  at: { type: Date, default: Date.now }
}, { _id: false });

const ProgressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  completedLessons: { type: [CompletedLessonSchema], default: [] },
  lastViewed: { type: LastViewedSchema, default: {} },
  totalLessons: { type: Number, default: 0 }, // Cache total lessons at time of first tracking
}, { timestamps: true });

ProgressSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model('Progress', ProgressSchema);
