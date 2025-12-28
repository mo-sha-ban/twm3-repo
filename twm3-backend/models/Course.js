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
  specialization: {
    type: String,
    enum: [
      'cybersecurity',           // الأمان السيبراني
      'networks',                // الشبكات
      'hacking',                 // الهاكينج/الاختراق الأخلاقي
      'linux',                   // لينكس
      'bug-bounty',              // باج باونتي
      'ethical-hacking',         // الهاكينج الأخلاقي
      'malware-analysis',        // تحليل البرمجيات الخبيثة
      'penetration-testing',     // اختبار الاختراق
      'web-security',            // أمان الويب
      'network-security',        // أمان الشبكات
      'incident-response',       // الاستجابة للحوادث
      'forensics',               // الطب الشرعي الرقمي
      'reverse-engineering',     // الهندسة العكسية
      'cryptography'             // التشفير
    ],
    default: 'cybersecurity'
  },
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
  specializations: [
    {
      type: String,
      enum: [
        'cybersecurity',           // الأمان السيبراني
        'networks',                // الشبكات
        'hacking',                 // الهاكينج/الاختراق الأخلاقي
        'linux',                   // لينكس
        'bug-bounty',              // باج باونتي
        'ethical-hacking',         // الهاكينج الأخلاقي
        'malware-analysis',        // تحليل البرمجيات الخبيثة
        'penetration-testing',     // اختبار الاختراق
        'web-security',            // أمان الويب
        'network-security',        // أمان الشبكات
        'incident-response',       // الاستجابة للحوادث
        'forensics',               // الطب الشرعي الرقمي
        'reverse-engineering',     // الهندسة العكسية
        'cryptography'             // التشفير
      ]
    }
  ],
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
  isFree: { type: Boolean, default: false },
  udemyLink: { type: String, default: '' },
  isPriceHidden: { type: Boolean, default: false },
  promoVideoId: { type: String, default: null }, // ID of the selected promo video from mediaItems
  promoVideo: { type: String, default: '' }, // Promotional video URL (YouTube or local video)
  promoThumbnail: { type: String, default: '' }, // Thumbnail image for promo video
  introVideo: { type: String, default: '' }, // Introductory video URL (fallback for promoVideo)
  normalizedTitle: { type: String, default: null }, // Lowercase title for deduplication checks (optional)
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add indexes
courseSchema.index({ title: 'text', description: 'text' });
courseSchema.index({ 'categories.mainCategory': 1 });
courseSchema.index({ isPublished: 1 });
courseSchema.index({ featured: 1 });
courseSchema.index({ createdAt: -1 });
courseSchema.index({ normalizedTitle: 1, createdBy: 1 }, { sparse: true }); // Sparse index for deduplication

// Virtual for total lessons count
courseSchema.virtual('totalLessonsCount').get(function () {
  return this.units.reduce((total, unit) => total + unit.lessons.length, 0);
});

// Virtual for total duration
courseSchema.virtual('totalDurationCalc').get(function () {
  return this.units.reduce((total, unit) => {
    return total + unit.lessons.reduce((unitTotal, lesson) => unitTotal + (lesson.duration || 0), 0);
  }, 0);
});

// Middleware to update the updatedAt field
courseSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Course', courseSchema);
