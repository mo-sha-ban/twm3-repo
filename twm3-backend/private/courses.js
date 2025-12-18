/* Clean Courses module — single source of truth for course UI/actions */
(function () {
  const API_BASE = '';

  // قائمة التصنيفات المتاحة للاستخدام في الفلاتر والنموذج
  const CATEGORY_LIST = [
    { value: 'programming', label: 'برمجة' },
    { value: 'ethical-hacking', label: 'اختراق أخلاقي' },
    { value: 'cybersecurity', label: 'سايبر سكيورتي' },
    { value: 'mobile-development', label: 'تطوير تطبيقات' },
    { value: 'web-development', label: 'تطوير مواقع' },
    { value: 'video-editing', label: 'مونتاج' },
    { value: 'other', label: 'أخرى' }
  ];

  const Courses = {
    init() {
      // bind add-course button
      const addBtn = document.getElementById('add-course-button');
      if (addBtn) {
        try { addBtn.onclick = null; } catch (e) {}
        addBtn.addEventListener('click', (e) => {
          e.preventDefault();
          Courses.openAddCourseModal();
        });
      }

      // ensure form handler
      const form = document.getElementById('addCourseForm');
      if (form) {
        form.removeEventListener('submit', Courses.handleAddCourseSubmit);
        form.addEventListener('submit', Courses.handleAddCourseSubmit);
      }

      // wire modal close buttons (in case)
      document.querySelectorAll('.modal .modal-close').forEach(btn => {
        btn.addEventListener('click', () => Courses.closeCourseModal());
      });

      // backdrop/escape handled globally elsewhere; fetch initial courses
      // Allow tests or pages to disable the automatic fetch during init by setting
      // window.COURSES_SKIP_AUTO_FETCH = true before calling init().
      if (!window.COURSES_SKIP_AUTO_FETCH) {
        Courses.fetchCourses();
      } else {
        console.log('Courses.init: skipped auto fetch (COURSES_SKIP_AUTO_FETCH=true)');
      }
    },

    async fetchCourses() {
      try {
        const token = localStorage.getItem('token');
        const url = `${API_BASE}/api/courses`;
        const res = await fetch(url, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!res.ok) {
          console.warn('Courses fetch failed', res.status);
          return;
        }
        const data = await res.json();
        const courses = Array.isArray(data) ? data : (data.courses || []);
        Courses.renderCourses(courses);
      } catch (err) {
        console.error('fetchCourses error', err);
      }
    },

        // عرض الكورسات في الجدول
        renderCourses: function(courses) {
            try {
                const tbody = document.getElementById('courses-table');
                if (!tbody) {
                    console.error('courses-table element not found');
                    return;
                }
                if (!Array.isArray(courses) || courses.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="9">لا توجد كورسات</td></tr>';
                    return;
                }

                tbody.innerHTML = courses.map((c, idx) => `
                    <tr data-id="${c._id}">
                        <td>${idx + 1}</td>
                        <td>${(c.icon || '') ? `<i class="${c.icon}"></i>` : ''} ${c.title || ''}</td>
                        <td>${(c.instructor || '')}</td>
                        <td>${(c.categories || []).map(cat => cat.mainCategory).join(', ')}</td>
                        <td>${c.duration || ''}</td>
                        <td>${c.price || ''}</td>
                        <td>${c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''}</td>
                        <td>
                            <div class="action-buttons">
                                <button class="btn btn-primary" onclick="editCourse('${c._id}')" title="تعديل"><i class="fas fa-edit"></i></button>
                                <button class="btn btn-secondary" onclick="manageCourseContent('${c._id}','${(c.title||'').replace(/'/g, "\\'")}', )" title="محتوى"><i class="fas fa-folder-open"></i></button>
                                <button class="btn btn-danger" onclick="deleteCourse('${c._id}')" title="حذف"><i class="fas fa-trash"></i></button>
                            </div>
                        </td>
                    </tr>
                `).join('');
            } catch (err) {
                console.error('Error rendering courses:', err);
            }
        },

    // إنشاء أو ربط واجهة الفلاتر أعلى جدول الكورسات
    initializeFilters() {
      // Filter initialization removed
    },

    applyFilters() {
      const selected = Array.from(document.querySelectorAll('#courses-filters .filter-input:checked')).map(i => i.value);
      this.currentFilters.categories = selected;
      this.fetchCourses();
    },

    openAddCourseModal() {
      const modal = document.getElementById('courseModal');
      if (!modal) return;
      
      // تحديث عنوان النافذة
      const titleEl = document.getElementById('courseModalTitle');
      if (titleEl) titleEl.textContent = 'إضافة كورس جديد';

      // إضافة حقل اختيار التصنيفات
      // Try to find an existing categories container first
      let categoriesContainer = document.getElementById('categories-container');
      let categoryGroup = null;
      
      // If no existing container, find where to insert it
      if (!categoriesContainer) {
        const iconEl = document.getElementById('courseIcon');
        if (iconEl && iconEl.parentElement) {
          categoryGroup = iconEl.parentElement;
        } else {
          categoryGroup = document.querySelector('.form-group:has(#courseCategory)');
        }
      }
      
      // Only create new categories UI if we don't already have one
      if (!categoriesContainer && categoryGroup) {
          // Create new div for categories
          categoriesContainer = document.createElement('div');
          categoriesContainer.id = 'categories-container';

          // Find the proper insertion point - before the form actions
          const form = document.getElementById('addCourseForm');
          if (!form) return;

          const formActions = form.querySelector('.form-actions');
          if (!formActions) return;

          // Insert before form actions
          form.insertBefore(categoriesContainer, formActions);

          // Remove legacy elements if present
          const legacyCat = document.getElementById('courseCategory');
          if (legacyCat && legacyCat.parentElement) legacyCat.parentElement.remove();
          const tagElement = document.getElementById('courseTags');
          if (tagElement && tagElement.parentElement) tagElement.parentElement.remove();

          categoriesContainer.innerHTML = `
          <div id="categories-container">
            <label>التصنيفات</label>
            <div class="categories-list">
              <label class="category-checkbox">
                <input type="checkbox" name="categories" value="programming" class="category-input">
                <span class="category-label">برمجة</span>
              </label>
              <label class="category-checkbox">
                <input type="checkbox" name="categories" value="ethical-hacking" class="category-input">
                <span class="category-label">اختراق أخلاقي</span>
              </label>
              <label class="category-checkbox">
                <input type="checkbox" name="categories" value="cybersecurity" class="category-input">
                <span class="category-label">سايبر سكيورتي</span>
              </label>
              <label class="category-checkbox">
                <input type="checkbox" name="categories" value="mobile-development" class="category-input">
                <span class="category-label">تطوير تطبيقات</span>
              </label>
              <label class="category-checkbox">
                <input type="checkbox" name="categories" value="web-development" class="category-input">
                <span class="category-label">تطوير مواقع</span>
              </label>
              <label class="category-checkbox">
                <input type="checkbox" name="categories" value="video-editing" class="category-input">
                <span class="category-label">مونتاج</span>
              </label>
            </div>
          </div>
        `;

        // إضافة التنسيقات المطلوبة
        const style = document.createElement('style');
        style.textContent = `
          .categories-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 10px;
            margin-top: 10px;
          }
          
          .category-checkbox {
            display: flex;
            align-items: center;
            padding: 10px;
            border: 1px solid var(--border-color);
            border-radius: var(--radius-md);
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .category-checkbox:hover {
            border-color: var(--primary-color);
            background: var(--bg-tertiary);
          }
          
          .category-input {
            margin-right: 8px;
          }
          
          .category-label {
            font-size: 0.9rem;
            color: var(--text-primary);
          }

          .category-checkbox input:checked + .category-label {
            color: var(--primary-color);
            font-weight: 600;
          }

          .category-checkbox input:checked {
            accent-color: var(--primary-color);
          }
        `;
        document.head.appendChild(style);
      }

      // إعادة تعيين النموذج عند فتح إضافة جديد (فقط إذا لم يكن في وضع التعديل)
      const form = document.getElementById('addCourseForm');
      if (form && !window.editingCourseId) {
        form.reset();
        // Reset pricing options
        const freeRadio = document.getElementById('pricingFree');
        const paidRadio = document.getElementById('pricingPaid');
        const priceGroup = document.getElementById('priceInputGroup');
        if (freeRadio) freeRadio.checked = true;
        if (paidRadio) paidRadio.checked = false;
        if (priceGroup) priceGroup.style.display = 'none';
      }
      // لا نعيد تعيين editingCourseId هنا إذا كان موجوداً (لأننا في وضع التعديل)
      if (!window.editingCourseId) {
        window.editingCourseId = null;
      }

      // Setup pricing option listeners
      Courses.setupPricingListeners();

      modal.style.display = 'flex';
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
    },

    openEditCourse(courseId) {
      if (!courseId) return;
      
      const initializeForm = () => {
        return new Promise((resolve) => {
          // Initialize form by opening add course modal
          Courses.openAddCourseModal();
          
          // Set editingCourseId AFTER opening modal (to prevent it from being reset)
          window.editingCourseId = courseId;
          
          // Update title for edit mode
          const titleEl = document.getElementById('courseModalTitle');
          if (titleEl) titleEl.textContent = 'تعديل الكورس';

          // Give time for DOM to update
          setTimeout(resolve, 100);
        });
      };

      const loadAndPopulateData = async () => {
        try {
          // Verify form elements exist
          const elements = {
            title: document.getElementById('courseTitle'),
            description: document.getElementById('courseDescription'),
            instructor: document.getElementById('courseInstructor'),
            duration: document.getElementById('courseDuration'),
            price: document.getElementById('coursePrice'),
            icon: document.getElementById('courseIcon')
          };

          // Check if any required element is missing
          const missingElements = Object.entries(elements)
            .filter(([key, el]) => !el)
            .map(([key]) => key);

          if (missingElements.length > 0) {
            throw new Error(`Missing form elements: ${missingElements.join(', ')}`);
          }

          // Load course data
          const response = await fetch(`/api/courses/${courseId}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });

          if (!response.ok) {
            throw new Error('Failed to fetch course data');
          }

          const course = await response.json();

          // Set form values
          elements.title.value = course.title || '';
          elements.description.value = course.description || '';
          elements.instructor.value = course.instructor || '';
          elements.duration.value = course.duration || '';
          elements.icon.value = course.icon || '';

          // Set pricing options
          const freeRadio = document.getElementById('pricingFree');
          const paidRadio = document.getElementById('pricingPaid');
          const priceGroup = document.getElementById('priceInputGroup');
          const featuredEl = document.getElementById('courseFeatured');

          const isFree = course.isFree !== false; // default to true if not set
          if (freeRadio) freeRadio.checked = isFree;
          if (paidRadio) paidRadio.checked = !isFree;
          if (priceGroup) priceGroup.style.display = isFree ? 'none' : 'block';
          if (!isFree) {
            elements.price.value = course.price || '';
          }

          if (featuredEl) featuredEl.checked = course.featured || false;

          // Update categories
          const categoryInputs = document.querySelectorAll('.category-input');
          if (categoryInputs.length === 0) {
            throw new Error('Categories UI not initialized');
          }

          // Set category checkboxes WITHOUT auto-update listeners
          // In edit mode, we want all changes to be saved together via the form submit
          categoryInputs.forEach(input => {
            input.checked = course.categories && Array.isArray(course.categories) &&
              course.categories.some(cat => cat.mainCategory === input.value);
              
            // Remove any existing change handlers to prevent auto-update
            // We want the user to submit the form to save all changes together
            if (input._hasChangeHandler) {
              const oldHandler = input._changeHandler;
              if (oldHandler) {
                input.removeEventListener('change', oldHandler);
              }
              input._hasChangeHandler = false;
              input._changeHandler = null;
            }
          });

        } catch (err) {
          console.error('Error loading course:', err);
          alert(`فشل في تحميل بيانات الكورس: ${err.message}`);
          Courses.closeCourseModal();
        }
      };

      // Execute the initialization and data loading sequence
      initializeForm()
        .then(loadAndPopulateData)
        .catch(err => {
          console.error('Failed to initialize edit form:', err);
          alert('فشل في تهيئة نموذج التعديل');
          Courses.closeCourseModal();
        });
    },

    closeCourseModal() {
      const modal = document.getElementById('courseModal');
      if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
      }
      const form = document.getElementById('addCourseForm');
      if (form) form.reset();
      window.editingCourseId = null;

      // تنظيف مجموعات التصنيفات الإضافية
      const categoriesContainer = document.getElementById('categories-container');
      if (categoriesContainer) {
        const categoryGroups = categoriesContainer.querySelectorAll('.category-group:not(:first-child)');
        categoryGroups.forEach(group => group.remove());
      }
    },

    handleAddCourseSubmit(e) {
      e && e.preventDefault && e.preventDefault();
      try {
        // Defensive retrieval of form fields to avoid TypeErrors on test pages
        const get = id => document.getElementById(id);
        const titleEl = get('courseTitle');
        const descEl = get('courseDescription');
        const instrEl = get('courseInstructor');
        const durEl = get('courseDuration');
        const priceEl = get('coursePrice');
        const iconEl = get('courseIcon');

        if (!titleEl || !descEl) {
          // In a lightweight test page some fields may be missing — fail gracefully
          console.warn('Course submit: required form fields not found. Skipping submit in test environment.');
          alert('نموذج الإضافة غير مكتمل في صفحة الاختبار. العملية ملغاة.');
          return;
        }

        // جمع التصنيفات المختارة
        const categoryInputs = document.querySelectorAll('.category-input:checked');
        const categories = Array.from(categoryInputs).map(input => ({
          mainCategory: input.value
        }));

        const freeRadio = document.getElementById('pricingFree');
        const paidRadio = document.getElementById('pricingPaid');
        const featuredEl = document.getElementById('courseFeatured');

        // Determine pricing based on radio buttons
        const isFree = freeRadio && freeRadio.checked;
        const price = isFree ? 0 : Number((priceEl && priceEl.value) || 0) || 0;

        const data = {
          title: (titleEl.value || '').trim(),
          description: (descEl.value || '').trim(),
          instructor: (instrEl && instrEl.value || '').trim(),
          duration: Number((durEl && durEl.value) || 0) || 0,
          price: price,
          categories: categories.map(cat => ({
            mainCategory: cat.mainCategory
          })),
          icon: (iconEl && iconEl.value || '').trim(),
          isFree: isFree,
          featured: featuredEl ? featuredEl.checked : false
        };

        const token = localStorage.getItem('token');
        const method = window.editingCourseId ? 'PUT' : 'POST';
        const url = window.editingCourseId ? `/api/courses/${window.editingCourseId}` : '/api/courses';

        fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(data)
        })
        .then(async res => {
          if (!res.ok) {
            const txt = await res.text();
            throw new Error(txt || 'خطأ من الخادم');
          }
          alert(window.editingCourseId ? 'تم تحديث الكورس' : 'تم إضافة الكورس');
          Courses.closeCourseModal();
          setTimeout(() => Courses.fetchCourses(), 150);
        })
        .catch(err => {
          console.error('submit course error', err && err.stack ? err.stack : err);
          alert('فشل في حفظ الكورس: ' + (err && err.message ? err.message : 'خطأ غير معروف'));
        });
      } catch (err) {
        console.error('Submit error:', err);
        alert('خطأ في حفظ الكورس: ' + (err && err.message ? err.message : 'خطأ غير معروف'));
      }
    },

    async deleteCourse(courseId) {
      if (!courseId) return;
      const confirmed = await showConfirm({
        title: 'تأكيد حذف الكورس',
        message: 'هل أنت متأكد من حذف هذا الكورس؟',
        confirmText: 'نعم، احذف الكورس',
        cancelText: 'إلغاء'
      });
      if (!confirmed) return;
      try {
        const res = await fetch(`/api/courses/${courseId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        if (!res.ok) throw new Error('فشل الحذف');
        showToast('تم الحذف', 'تم حذف الكورس بنجاح', 'success');
        Courses.fetchCourses();
      } catch (err) {
        console.error('delete course', err);
        showToast('خطأ', 'فشل في حذف الكورس', 'error');
      }
    },

    setupPricingListeners() {
      const freeRadio = document.getElementById('pricingFree');
      const paidRadio = document.getElementById('pricingPaid');
      const priceGroup = document.getElementById('priceInputGroup');

      if (freeRadio && paidRadio && priceGroup) {
        const updatePriceVisibility = () => {
          if (paidRadio.checked) {
            priceGroup.style.display = 'block';
          } else {
            priceGroup.style.display = 'none';
          }
        };

        freeRadio.addEventListener('change', updatePriceVisibility);
        paidRadio.addEventListener('change', updatePriceVisibility);

        // Initial state
        updatePriceVisibility();
      }
    },

    async manageCourseContent(courseId, courseTitle) {
      if (!courseId) return alert('معرف الكورس مفقود');
      try {
        window.currentCourseId = courseId;
        const res = await fetch(`/api/courses/${courseId}/content`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || 'فشل في جلب محتوى الكورس');
        }
        const content = await res.json();

        // If dashboard has a renderer, use it to show the modules/lessons
        if (window.displayCourseContent && typeof window.displayCourseContent === 'function') {
          try {
            window.currentCourseTitle = courseTitle;
            const titleEl = document.getElementById('courseContentModalTitle');
            if (titleEl) titleEl.textContent = `محتوى الكورس: ${courseTitle}`;
            window.displayCourseContent(content);
          } catch (err) {
            console.warn('displayCourseContent failed', err);
          }
        } else {
          // fallback: simple listing into modulesContainer
          const container = document.getElementById('modulesContainer');
          if (container) {
            container.innerHTML = '';
            (content.units || []).forEach((unit, i) => {
              const div = document.createElement('div');
              div.className = 'module-item';
              div.innerHTML = `<h4>الوحدة ${i+1}: ${unit.title}</h4>` +
                `<div>${(unit.lessons || []).map((l,j)=>`<div>الدرس ${j+1}: ${l.title}</div>`).join('')}</div>`;
              container.appendChild(div);
            });
          }
        }

        // Show modal
        const modal = document.getElementById('courseContentModal');
        if (modal) {
          modal.style.display = 'flex';
          modal.classList.add('show');
          document.body.style.overflow = 'hidden';
        }

      } catch (error) {
        console.error('manageCourseContent error', error);
        alert(`خطأ في تحميل محتوى الكورس: ${error && error.message ? error.message : ''}`);
      }
    }
  };

  // Alias for compatibility with legacy code
  Courses.editCourse = Courses.openEditCourse;

  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&"'<>]/g, function (s) {
      return ({'&':'&amp;','"':'&quot;',"'":'&#39;','<':'&lt;','>':'&gt;'})[s];
    });
  }

  // expose
  window.Courses = Courses;
})();

function getCategoryName(category) {
  const categories = {
    'programming': 'برمجة',
    'ethical-hacking': 'اختراق أخلاقي',
    'cybersecurity': 'سايبر سكيورتي',
    'mobile-development': 'تطوير تطبيقات',
    'web-development': 'تطوير مواقع',
    'video-editing': 'مونتاج'
  };
  return categories[category] || category;
}

function getSubCategoryName(subCategory) {
  const subCategories = {
    // Programming
    'python': 'بايثون',
    'javascript': 'جافاسكريبت',
    'java': 'جافا',
    'cpp': 'سي++',
    'csharp': 'سي شارب',
    'php': 'PHP',
    // Web Development
    'frontend': 'تطوير واجهات',
    'backend': 'تطوير خلفي',
    'fullstack': 'تطوير متكامل',
    'react': 'رياكت',
    'angular': 'أنجولر',
    'vue': 'فيو',
    // Mobile Development
    'android': 'أندرويد',
    'ios': 'آي أو إس',
    'flutter': 'فلاتر',
    'react-native': 'رياكت نيتف',
    // Cybersecurity
    'network-security': 'أمن الشبكات',
    'web-security': 'أمن المواقع',
    'malware-analysis': 'تحليل البرمجيات الخبيثة',
    'incident-response': 'الاستجابة للحوادث',
    // Ethical Hacking
    'penetration-testing': 'اختبار الاختراق',
    'vulnerability-assessment': 'تقييم الثغرات',
    'social-engineering': 'الهندسة الاجتماعية',
    // Video Editing
    'premiere-pro': 'بريمير برو',
    'after-effects': 'أفتر إفكتس',
    'davinci-resolve': 'دافنشي ريزولف'
  };
  return subCategories[subCategory] || subCategory;
}

function updateSubCategories(mainCategory, subCategoriesSelect) {
  const subCategories = {
    'programming': ['python', 'javascript', 'java', 'cpp', 'csharp', 'php'],
    'ethical-hacking': ['penetration-testing', 'vulnerability-assessment', 'social-engineering'],
    'cybersecurity': ['network-security', 'web-security', 'malware-analysis', 'incident-response'],
    'web-development': ['frontend', 'backend', 'fullstack', 'react', 'angular', 'vue'],
    'mobile-development': ['android', 'ios', 'flutter', 'react-native'],
    'video-editing': ['premiere-pro', 'after-effects', 'davinci-resolve'],
    'other': []
  };

  // Clear existing options
  subCategoriesSelect.innerHTML = '';

  if (!mainCategory || !subCategories[mainCategory]) return;

  // Add new options
  subCategories[mainCategory].forEach(subCat => {
    const option = document.createElement('option');
    option.value = subCat;
    option.textContent = getSubCategoryName(subCat);
    subCategoriesSelect.appendChild(option);
  });
}