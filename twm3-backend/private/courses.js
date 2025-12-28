/* Clean Courses module — single source of truth for course UI/actions */
(function () {
  const API_BASE = '';


  const Courses = {
    init() {
      // bind add-course button
      const addBtn = document.getElementById('add-course-button');
      if (addBtn) {
        try { addBtn.onclick = null; } catch (e) { }
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
    renderCourses(courses) {
      const tbody = document.getElementById('courses-table');
      if (!tbody) return;
      if (!Array.isArray(courses) || courses.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">لا توجد كورسات</td></tr>';
        return;
      }
      tbody.innerHTML = courses.map((course, idx) => {
        return `
          <tr>
            <td>${idx + 1}</td>
            <td>${escapeHtml(course.title || '')}</td>
            <td>${escapeHtml((course.description || '').substring(0, 80))}</td>
            <td>${escapeHtml(course.instructor || '')}</td>
            <td>${course.duration || 0} ساعة</td>
            <td>${course.isFree ? 'مجاني' : (course.isPriceHidden ? 'مدفوع' : (course.price || 0) + ' جنيه')}</td>
            <td>
              <div class="action-buttons">
                  <button class="btn btn-primary" onclick="editCourse('${course._id}')" title="تعديل"><i class="fas fa-edit"></i></button>
                  <button class="btn btn-secondary" onclick="manageCourseContent('${course._id}','${(course.title || '').replace(/'/g, "\\'")}' )" title="محتوى"><i class="fas fa-folder-open"></i></button>
                  <button class="btn btn-danger" onclick="deleteCourse('${course._id}')" title="حذف"><i class="fas fa-trash"></i></button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
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
        const hidePriceEl = document.getElementById('courseHidePrice');
        if (hidePriceEl) hidePriceEl.checked = false;
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
            icon: document.getElementById('courseIcon'),
            udemyLink: document.getElementById('courseUdemyLink')
            // promoVideo and promoThumbnail removed - now managed in course content modal
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
          elements.udemyLink.value = course.udemyLink || '';

          // Set pricing options
          const freeRadio = document.getElementById('pricingFree');
          const paidRadio = document.getElementById('pricingPaid');
          const priceGroup = document.getElementById('priceInputGroup');
          const udemyLinkGroup = document.getElementById('udemyLinkGroup');
          // Promo video and thumbnail now managed in course content modal
          const featuredEl = document.getElementById('courseFeatured');

          const isFree = course.isFree !== false; // default to true if not set
          if (freeRadio) freeRadio.checked = isFree;
          if (paidRadio) paidRadio.checked = !isFree;
          if (priceGroup) priceGroup.style.display = isFree ? 'none' : 'block';
          if (udemyLinkGroup) udemyLinkGroup.style.display = isFree ? 'none' : 'block';

          const hidePriceEl = document.getElementById('courseHidePrice');
          if (hidePriceEl) hidePriceEl.checked = course.isPriceHidden || false;

          if (!isFree) {
            elements.price.value = course.price || '';
          }

          if (featuredEl) featuredEl.checked = course.featured || false;

          // Promo video and thumbnail URLs removed from this form
          // They are now managed in the course content modal


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
        const udemyLinkEl = get('courseUdemyLink');
        // promoVideo and promoThumbnail removed - managed in course content modal

        if (!titleEl || !descEl) {
          // In a lightweight test page some fields may be missing — fail gracefully
          console.warn('Course submit: required form fields not found. Skipping submit in test environment.');
          alert('نموذج الإضافة غير مكتمل في صفحة الاختبار. العملية ملغاة.');
          return;
        }

        // collect other data

        const freeRadio = document.getElementById('pricingFree');
        const paidRadio = document.getElementById('pricingPaid');
        const hidePriceEl = document.getElementById('courseHidePrice');
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
          categories: [],
          icon: (iconEl && iconEl.value || '').trim(),
          isFree: isFree,
          isPriceHidden: hidePriceEl ? hidePriceEl.checked : false,
          featured: featuredEl ? featuredEl.checked : false,
          udemyLink: (udemyLinkEl && udemyLinkEl.value || '').trim()
          // promoVideo and promoThumbnail removed - managed in course content modal
        };

        const method = window.editingCourseId ? 'PUT' : 'POST';
        const url = window.editingCourseId ? `/api/courses/${window.editingCourseId}` : '/api/courses';
        const token = localStorage.getItem('token');

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
      const udemyLinkGroup = document.getElementById('udemyLinkGroup');
      // Promo video and thumbnail now managed in course content modal

      if (freeRadio && paidRadio && priceGroup) {
        const updatePriceVisibility = () => {
          if (paidRadio.checked) {
            priceGroup.style.display = 'block';
            if (udemyLinkGroup) udemyLinkGroup.style.display = 'block';
          } else {
            priceGroup.style.display = 'none';
            if (udemyLinkGroup) udemyLinkGroup.style.display = 'none';
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
        const token = localStorage.getItem('token');

        // Fetch both course details and content
        const [courseRes, contentRes] = await Promise.all([
          fetch(`/api/courses/${courseId}`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`/api/courses/${courseId}/content`, { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (!courseRes.ok) throw new Error('فشل في جلب بيانات الكورس');
        if (!contentRes.ok) throw new Error('فشل في جلب محتوى الكورس');

        const course = await courseRes.json();
        const content = await contentRes.json();

        // If dashboard has a renderer, use it to show the modules/lessons
        if (window.displayCourseContent && typeof window.displayCourseContent === 'function') {
          try {
            window.currentCourseTitle = courseTitle;
            const titleEl = document.getElementById('courseContentModalTitle');
            if (titleEl) titleEl.textContent = `محتوى الكورس: ${courseTitle}`;
            window.displayCourseContent(content, course);
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
              div.innerHTML = `<h4>الوحدة ${i + 1}: ${unit.title}</h4>` +
                `<div>${(unit.lessons || []).map((l, j) => `<div>الدرس ${j + 1}: ${l.title}</div>`).join('')}</div>`;
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
      return ({ '&': '&amp;', '"': '&quot;', "'": '&#39;', '<': '&lt;', '>': '&gt;' })[s];
    });
  }

  // expose
  window.Courses = Courses;
})();
