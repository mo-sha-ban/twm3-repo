/* New Course Content Management System */
(function() {
  const CourseSystem = {
    currentCourse: null,
    
    async init() {
      console.log('Initializing Course Content Management System');
    },
    
    async loadCourseContent(courseId) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/courses/${courseId}/content`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to load course content');
        }
        
        const course = await response.json();
        this.currentCourse = course;
        this.renderCourseContent(course);
        return course;
      } catch (error) {
        console.error('Error loading course content:', error);
        showToast('Error', 'Failed to load course content', 'error');
      }
    },
    
    renderCourseContent(course) {
      const container = document.getElementById('modulesContainer');
      if (!container) return;
      
      // Clear container
      container.innerHTML = '';
      
      // Add promotional video section for paid courses
      if (!course.isFree) {
        const promoSection = document.createElement('div');
        promoSection.className = 'promo-video-section';
        promoSection.innerHTML = `
          <div class="section-header">
            <h3><i class="fas fa-star"></i> الفيديو الترويجي</h3>
            <button class="btn btn-sm btn-primary edit-promo-btn" onclick="editPromoVideo('${course._id}')">
              <i class="fas fa-edit"></i> تعديل
            </button>
          </div>
          <div class="promo-video-content">
            ${course.promoVideo ? this.renderPromoVideo(course.promoVideo) : '<p>لم يتم إضافة فيديو ترويجي بعد</p>'}
          </div>
        `;
        container.appendChild(promoSection);
      }
      
      // Add "Add Unit" button
      const addUnitButton = document.createElement('div');
      addUnitButton.className = 'add-unit-section';
      addUnitButton.innerHTML = `
        <button id="addUnitButton" class="btn btn-primary">
          <i class="fas fa-plus"></i> إضافة وحدة جديدة
        </button>
        <div id="addUnitForm" class="add-unit-form" style="display: none;">
          <input type="text" id="unitTitle" placeholder="عنوان الوحدة" class="form-control">
          <textarea id="unitDescription" placeholder="وصف الوحدة" class="form-control"></textarea>
          <div class="form-actions">
            <button id="saveUnitButton" class="btn btn-success">حفظ</button>
            <button id="cancelUnitButton" class="btn btn-secondary">إلغاء</button>
          </div>
        </div>
      `;
      container.appendChild(addUnitButton);
      
      // Event listeners for unit creation
      document.getElementById('addUnitButton').addEventListener('click', () => {
        document.getElementById('addUnitForm').style.display = 'block';
      });
      
      document.getElementById('cancelUnitButton').addEventListener('click', () => {
        document.getElementById('addUnitForm').style.display = 'none';
        document.getElementById('unitTitle').value = '';
        document.getElementById('unitDescription').value = '';
      });
      
      document.getElementById('saveUnitButton').addEventListener('click', () => {
        this.createUnit(course._id);
      });
      
      // Render existing units
      if (course.units && course.units.length > 0) {
        course.units.forEach((unit, index) => {
          this.renderUnit(unit, index, course._id);
        });
      } else {
        // Show message if no units
        const noUnitsMessage = document.createElement('div');
        noUnitsMessage.className = 'no-units-message';
        noUnitsMessage.innerHTML = '<p>لا توجد وحدات في هذا الكورس بعد. أضف وحدة جديدة لتبدأ.</p>';
        container.appendChild(noUnitsMessage);
      }
    },
    
    renderPromoVideo(videoUrl) {
      if (!videoUrl) return '';
      
      // Check if it's a YouTube video
      if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        const videoId = this.getYoutubeVideoId(videoUrl);
        if (videoId) {
          return `
            <div class="promo-video-preview youtube-preview">
              <iframe src="https://www.youtube.com/embed/${videoId}" 
                      frameborder="0" 
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                      allowfullscreen></iframe>
            </div>
          `;
        }
      }
      
      // For local videos
      return `
        <div class="promo-video-preview local-preview">
          <video controls>
            <source src="${videoUrl}" type="video/mp4">
            متصفحك لا يدعم مشغل الفيديو.
          </video>
        </div>
      `;
    },
    
    getYoutubeVideoId(url) {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    },
    
    renderUnit(unit, index, courseId) {
      const container = document.getElementById('modulesContainer');
      if (!container) return;
      
      const unitElement = document.createElement('div');
      unitElement.className = 'unit-item';
      unitElement.dataset.unitId = unit._id;
      
      unitElement.innerHTML = `
        <div class="unit-header">
          <h3 class="unit-title">${unit.title}</h3>
          <div class="unit-actions">
            <button class="btn btn-sm btn-secondary edit-unit-btn" data-unit-id="${unit._id}" data-course-id="${courseId}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-danger delete-unit-btn" data-unit-id="${unit._id}" data-course-id="${courseId}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="unit-description">${unit.description || ''}</div>
        <div class="unit-lessons">
          <h4>الدروس</h4>
          <div class="lessons-list" id="lessons-${unit._id}">
            ${this.renderLessons(unit.lessons, unit._id, courseId)}
          </div>
          <button class="btn btn-sm btn-outline-primary add-lesson-btn" data-unit-id="${unit._id}" data-course-id="${courseId}">
            <i class="fas fa-plus"></i> إضافة درس
          </button>
          <div class="add-lesson-form" id="add-lesson-form-${unit._id}" style="display: none;">
            <input type="text" class="form-control lesson-title" placeholder="عنوان الدرس">
            <select class="form-control lesson-type">
              <option value="video">فيديو</option>
              <option value="pdf">مستند PDF</option>
              <option value="url">رابط خارجي</option>
            </select>
            <textarea class="form-control lesson-description" placeholder="وصف الدرس"></textarea>
            <input type="text" class="form-control lesson-url" placeholder="رابط الفيديو/المستند/الرابط الخارجي">
            <div class="form-actions">
              <button class="btn btn-success save-lesson-btn" data-unit-id="${unit._id}" data-course-id="${courseId}">حفظ</button>
              <button class="btn btn-secondary cancel-lesson-btn" data-unit-id="${unit._id}" data-course-id="${courseId}">إلغاء</button>
            </div>
          </div>
        </div>
      `;
      
      container.appendChild(unitElement);
      
      // Add event listeners
      unitElement.querySelector('.add-lesson-btn').addEventListener('click', (e) => {
        const unitId = e.target.dataset.unitId;
        document.getElementById(`add-lesson-form-${unitId}`).style.display = 'block';
      });
      
      unitElement.querySelector('.cancel-lesson-btn').addEventListener('click', (e) => {
        const unitId = e.target.dataset.unitId;
        document.getElementById(`add-lesson-form-${unitId}`).style.display = 'none';
        // Reset form
        const form = document.getElementById(`add-lesson-form-${unitId}`);
        form.querySelector('.lesson-title').value = '';
        form.querySelector('.lesson-description').value = '';
        form.querySelector('.lesson-url').value = '';
      });
      
      unitElement.querySelector('.save-lesson-btn').addEventListener('click', (e) => {
        const unitId = e.target.dataset.unitId;
        const courseId = e.target.dataset.courseId;
        this.createLesson(courseId, unitId);
      });
      
      unitElement.querySelector('.delete-unit-btn').addEventListener('click', (e) => {
        const unitId = e.target.dataset.unitId;
        const courseId = e.target.dataset.courseId;
        this.deleteUnit(courseId, unitId);
      });
      
      // Add edit lesson event listeners
      unitElement.querySelectorAll('.edit-lesson-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const lessonId = e.target.dataset.lessonId;
          const unitId = e.target.dataset.unitId;
          const courseId = e.target.dataset.courseId;
          this.editLesson(courseId, unitId, lessonId);
        });
      });
      
      // Add delete lesson event listeners
      unitElement.querySelectorAll('.delete-lesson-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const lessonId = e.target.dataset.lessonId;
          const unitId = e.target.dataset.unitId;
          const courseId = e.target.dataset.courseId;
          this.deleteLesson(courseId, unitId, lessonId);
        });
      });
    },
    
    renderLessons(lessons, unitId, courseId) {
      if (!lessons || lessons.length === 0) {
        return '<p class="no-lessons">لا توجد دروس في هذه الوحدة بعد.</p>';
      }
      
      return lessons.map(lesson => `
        <div class="lesson-item" data-lesson-id="${lesson._id}">
          <div class="lesson-header">
            <span class="lesson-title">${lesson.title}</span>
            <div class="lesson-actions">
              <button class="btn btn-sm btn-secondary edit-lesson-btn" data-lesson-id="${lesson._id}" data-unit-id="${unitId}" data-course-id="${courseId}">
                <i class="fas fa-edit"></i>
              </button>
              <button class="btn btn-sm btn-danger delete-lesson-btn" data-lesson-id="${lesson._id}" data-unit-id="${unitId}" data-course-id="${courseId}">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
          <div class="lesson-description">${lesson.description || ''}</div>
          <div class="lesson-meta">
            <span class="lesson-type">${this.getLessonTypeLabel(lesson.type)}</span>
            ${lesson.duration ? `<span class="lesson-duration">${lesson.duration} دقائق</span>` : ''}
          </div>
        </div>
      `).join('');
    },
    
    getLessonTypeLabel(type) {
      const labels = {
        'video': 'فيديو',
        'pdf': 'PDF',
        'url': 'رابط خارجي'
      };
      return labels[type] || type;
    },
    
    async createUnit(courseId) {
      try {
        const title = document.getElementById('unitTitle').value.trim();
        const description = document.getElementById('unitDescription').value.trim();
        
        if (!title) {
          showToast('Error', 'يرجى إدخال عنوان الوحدة', 'error');
          return;
        }
        
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/courses/${courseId}/unit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ title, description })
        });
        
        if (!response.ok) {
          throw new Error('Failed to create unit');
        }
        
        const result = await response.json();
        
        // Hide form and reset fields
        document.getElementById('addUnitForm').style.display = 'none';
        document.getElementById('unitTitle').value = '';
        document.getElementById('unitDescription').value = '';
        
        // Reload course content
        this.loadCourseContent(courseId);
        
        showToast('Success', 'تم إنشاء الوحدة بنجاح', 'success');
      } catch (error) {
        console.error('Error creating unit:', error);
        showToast('Error', 'فشل في إنشاء الوحدة', 'error');
      }
    },
    
    async createLesson(courseId, unitId) {
      try {
        const form = document.getElementById(`add-lesson-form-${unitId}`);
        const title = form.querySelector('.lesson-title').value.trim();
        const type = form.querySelector('.lesson-type').value;
        const description = form.querySelector('.lesson-description').value.trim();
        const url = form.querySelector('.lesson-url').value.trim();
        
        if (!title) {
          showToast('Error', 'يرجى إدخال عنوان الدرس', 'error');
          return;
        }
        
        const lessonData = { title, type, description };
        if (url) {
          lessonData.url = url;
        }
        
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/courses/${courseId}/units/${unitId}/lessons`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(lessonData)
        });
        
        if (!response.ok) {
          throw new Error('Failed to create lesson');
        }
        
        const result = await response.json();
        
        // Hide form and reset fields
        form.style.display = 'none';
        form.querySelector('.lesson-title').value = '';
        form.querySelector('.lesson-description').value = '';
        form.querySelector('.lesson-url').value = '';
        
        // Reload course content
        this.loadCourseContent(courseId);
        
        showToast('Success', 'تم إنشاء الدرس بنجاح', 'success');
      } catch (error) {
        console.error('Error creating lesson:', error);
        showToast('Error', 'فشل في إنشاء الدرس', 'error');
      }
    },
    
    async editLesson(courseId, unitId, lessonId) {
      try {
        // First, get the lesson details
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/courses/${courseId}/units/${unitId}/lessons/${lessonId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch lesson details');
        }
        
        const lesson = await response.json();
        
        // Fill the form with existing lesson data
        const form = document.getElementById(`add-lesson-form-${unitId}`);
        form.querySelector('.lesson-title').value = lesson.title || '';
        form.querySelector('.lesson-description').value = lesson.description || '';
        form.querySelector('.lesson-url').value = lesson.url || '';
        
        // Set the lesson type
        const typeSelect = form.querySelector('.lesson-type');
        if (lesson.type) {
          typeSelect.value = lesson.type;
        }
        
        // Show the form
        form.style.display = 'block';
        
        // Change the save button to update mode
        const saveButton = form.querySelector('.save-lesson-btn');
        saveButton.textContent = 'تحديث';
        saveButton.onclick = () => this.updateLesson(courseId, unitId, lessonId);
        
        // Add cancel button handler
        const cancelButton = form.querySelector('.cancel-lesson-btn');
        cancelButton.onclick = () => {
          form.style.display = 'none';
          saveButton.textContent = 'حفظ';
          saveButton.onclick = () => this.createLesson(courseId, unitId);
        };
        
      } catch (error) {
        console.error('Error editing lesson:', error);
        showToast('Error', 'فشل في تحميل تفاصيل الدرس', 'error');
      }
    },
    
    async updateLesson(courseId, unitId, lessonId) {
      try {
        const form = document.getElementById(`add-lesson-form-${unitId}`);
        const title = form.querySelector('.lesson-title').value.trim();
        const type = form.querySelector('.lesson-type').value;
        const description = form.querySelector('.lesson-description').value.trim();
        const url = form.querySelector('.lesson-url').value.trim();
        
        if (!title) {
          showToast('Error', 'يرجى إدخال عنوان الدرس', 'error');
          return;
        }
        
        const lessonData = { title, type, description };
        if (url) {
          lessonData.url = url;
        }
        
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/courses/${courseId}/units/${unitId}/lessons/${lessonId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(lessonData)
        });
        
        if (!response.ok) {
          throw new Error('Failed to update lesson');
        }
        
        const result = await response.json();
        
        // Hide form and reset fields
        form.style.display = 'none';
        form.querySelector('.lesson-title').value = '';
        form.querySelector('.lesson-description').value = '';
        form.querySelector('.lesson-url').value = '';
        
        // Reset save button
        const saveButton = form.querySelector('.save-lesson-btn');
        saveButton.textContent = 'حفظ';
        saveButton.onclick = () => this.createLesson(courseId, unitId);
        
        // Reload course content
        this.loadCourseContent(courseId);
        
        showToast('Success', 'تم تحديث الدرس بنجاح', 'success');
      } catch (error) {
        console.error('Error updating lesson:', error);
        showToast('Error', 'فشل في تحديث الدرس', 'error');
      }
    },
    
    async deleteLesson(courseId, unitId, lessonId) {
      const confirmed = await showConfirm({
        title: 'تأكيد حذف الدرس',
        message: 'هل أنت متأكد من حذف هذا الدرس؟',
        confirmText: 'نعم، احذف الدرس',
        cancelText: 'إلغاء'
      });
      
      if (!confirmed) return;
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/courses/${courseId}/units/${unitId}/lessons/${lessonId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete lesson');
        }
        
        // Reload course content
        this.loadCourseContent(courseId);
        
        showToast('Success', 'تم حذف الدرس بنجاح', 'success');
      } catch (error) {
        console.error('Error deleting lesson:', error);
        showToast('Error', 'فشل في حذف الدرس', 'error');
      }
    },
    
    async deleteUnit(courseId, unitId) {
      const confirmed = await showConfirm({
        title: 'تأكيد حذف الوحدة',
        message: 'هل أنت متأكد من حذف هذه الوحدة وكل الدروس الموجودة فيها؟',
        confirmText: 'نعم، احذف الوحدة',
        cancelText: 'إلغاء'
      });
      
      if (!confirmed) return;
      
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/courses/${courseId}/units/${unitId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete unit');
        }
        
        // Reload course content
        this.loadCourseContent(courseId);
        
        showToast('Success', 'تم حذف الوحدة بنجاح', 'success');
      } catch (error) {
        console.error('Error deleting unit:', error);
        showToast('Error', 'فشل في حذف الوحدة', 'error');
      }
    }
  };
  
  // Make it globally available
  window.CourseSystem = CourseSystem;
  window.editPromoVideo = function(courseId) {
    // Open the course edit modal to update promotional video
    if (window.Courses && typeof window.Courses.openEditCourse === 'function') {
      window.Courses.openEditCourse(courseId);
    } else {
      showToast('Error', 'ميزة تعديل الفيديو الترويجي غير متوفرة حالياً', 'error');
    }
  };
  
  // Initialize when DOM is loaded
  document.addEventListener('DOMContentLoaded', () => {
    CourseSystem.init();
  });
})();