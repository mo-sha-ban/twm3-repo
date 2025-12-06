// models/Course.js
const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  link: { type: String, required: true }
}, { _id: false });

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  type: { type: String, enum: ['video', 'pdf', 'url', 'text'], default: 'video' },
  content: String, // 👈 تضيف هذا الحقل
  videoUrl: String,
  fileUrl: String,
  externalUrl: String,
  description: String,
  duration: { type: Number, default: 0 }, // بالدقائق
  isFree: { type: Boolean, default: false },
  previewImage: String,
  resources: [resourceSchema],
  createdAt: { type: Date, default: Date.now }
});

const unitSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  order: { type: Number, default: 0 },
  lessons: [lessonSchema],
  createdAt: { type: Date, default: Date.now }
});

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  instructor: String,
  duration: Number, // قديم – مش ضروري طالما بنحسب من الدروس
  price: { type: Number, default: 0 },
  icon: { type: String, default: 'fa-solid fa-book' },
  content: [{
    title: { type: String, required: true },
    link: String,
    file: String
  }],
    categories: [{
      mainCategory: {
        type: String,
        enum: ['programming', 'ethical-hacking', 'cybersecurity', 'web-development', 'mobile-development', 'video-editing', 'other'],
        required: true
      },
      subCategories: [{
        type: String,
        enum: [
          // Programming subcategories
          'python', 'javascript', 'java', 'cpp', 'csharp', 'php',
          // Web Development subcategories
          'frontend', 'backend', 'fullstack', 'react', 'angular', 'vue',
          // Mobile Development subcategories
          'android', 'ios', 'flutter', 'react-native',
          // Cybersecurity subcategories
          'network-security', 'web-security', 'malware-analysis', 'incident-response',
          // Ethical Hacking subcategories
          'penetration-testing', 'vulnerability-assessment', 'social-engineering',
          // Video Editing subcategories
          'premiere-pro', 'after-effects', 'davinci-resolve'
        ]
      }]
    }],
  tags: [String],
  units: [unitSchema],
  prerequisites: [String],
  learningObjectives: [String],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  featuredImage: String,
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  language: { type: String, default: 'ar' },
  totalLessons: { type: Number, default: 0 },
  totalDuration: { type: Number, default: 0 }, // بالدقائق
  rating: { type: Number, default: 0 },
  studentsEnrolled: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: false },
  featured: { type: Boolean, default: false },
  isFree: { type: Boolean, default: true },
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comment: String,
    rating: { type: Number, min: 1, max: 5 },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// normalizedTitle will be used for case-insensitive uniqueness checks per creator
courseSchema.add({ normalizedTitle: { type: String, index: true } });

// ensure uniqueness: a user should not have two courses with the same normalized title
courseSchema.index({ createdBy: 1, normalizedTitle: 1 }, { unique: true, sparse: true });

// تحديث عدد الدروس والمدة الإجمالية قبل الحفظ
courseSchema.pre('save', function (next) {
  let totalLessons = 0;
  let totalDuration = 0;

  if (this.units && this.units.length > 0) {
    this.units.forEach(unit => {
      totalLessons += unit.lessons.length;
      unit.lessons.forEach(lesson => {
        totalDuration += lesson.duration || 0;
      });
    });
  }

  this.totalLessons = totalLessons;
  this.totalDuration = totalDuration;
  this.updatedAt = new Date();

  next();
});

module.exports = mongoose.model('Course', courseSchema);
