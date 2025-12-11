// Modern Auto-Scrolling Courses Carousel
class CoursesCarousel {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error('Container not found:', containerId);
      return;
    }

    this.options = {
      autoScroll: true,
      scrollInterval: 3000,
      scrollStep: 1,
      visibleCards: this.getVisibleCards(),
      ...options
    };

    this.courses = [];
    this.currentIndex = 0;
    this.isAnimating = false;
    this.autoScrollTimer = null;
    this.carouselContainer = null;
    this.dotsContainer = null;
    this.init();
  }

  getVisibleCards() {
    const width = window.innerWidth;
    if (width > 1200) return 4;
    if (width > 992) return 3;
    if (width > 768) return 2;
    return 1;
  }

  async init() {
    try {
      await this.loadCourses();

      
      if (this.courses.length > 0) {
        this.render();
        this.setupEventListeners();
        
        // Start auto-scroll after a short delay
        setTimeout(() => {
          if (this.options.autoScroll) {
            this.startAutoScroll();
          }
        }, 500);
      } else {
        this.container.innerHTML = `<p class="loading">لا توجد كورسات متاحة</p>`;
      }
    } catch (error) {
      console.error('Error initializing carousel:', error);
      this.container.innerHTML = `<p class="loading">حدث خطأ أثناء تحميل الكورسات</p>`;
    }
  }

  async loadCourses() {
    try {
      // Try to load from API first
      const res = await fetch(`${window.appConfig.API_BASE_URL}/api/courses`);
      if (res.ok) {
        const data = await res.json();
        this.courses = Array.isArray(data) ? data : (data.courses || []);
      }
    } catch (error) {
    }

    // Fallback to courses.json if API fails
    if (this.courses.length === 0) {
      try {
        const res = await fetch('/courses.json');
        const data = await res.json();
        this.courses = Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error loading courses.json:', error);
      }
    }

    if (this.courses.length === 0) {
      throw new Error('No courses available');
    }

    // Duplicate courses for infinite scroll effect
    const originalLength = this.courses.length;
    if (originalLength < 12) {
      const timesToDuplicate = Math.ceil(12 / originalLength);
      const duplicated = [];
      for (let i = 0; i < timesToDuplicate; i++) {
        duplicated.push(...this.courses);
      }
      this.courses = duplicated;
    }
  }

  render() {
    // Clear container
    this.container.innerHTML = '';

    // Create wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'carousel-wrapper';

    // Create carousel container
    const carouselContainer = document.createElement('div');
    carouselContainer.className = 'carousel-container';
    this.carouselContainer = carouselContainer;

    // Add all course cards
    this.courses.forEach((course, index) => {
      const card = this.createCourseCard(course, index);
      carouselContainer.appendChild(card);
    });

    wrapper.appendChild(carouselContainer);

    // Add controls
    const controls = this.createControls();
    wrapper.appendChild(controls);

    this.container.appendChild(wrapper);

    // Initial position
    setTimeout(() => {
      this.updateCarousel();
    }, 100);
  }

  createCourseCard(course, index) {
    const card = document.createElement('div');
    card.className = 'course-card';
    card.dataset.index = index;

    const icon = course.icon || 'fa-solid fa-book';
    const title = course.title || 'كورس برمجة';
    const description = course.description || 'تعلم البرمجة من الصفر';
    const instructor = course.instructor || 'TWM3';
    const price = course.price === 'free' || course.price === 0 ? 'مجاني' : `${course.price} جنيه`;
    const courseId = course._id || course.id || index;

    card.innerHTML = `
      <div class="course-content">
        <div class="course-icon">
          <i class="${icon}"></i>
        </div>
        <h3 class="course-title">${title}</h3>
        <p class="course-description">${description}</p>
        <div class="course-meta">
          <span class="course-instructor">
            <i class="fa-solid fa-user-tie"></i>
            ${instructor}
          </span>
          <span class="course-price">
            <i class="fa-solid fa-tag"></i>
            ${price}
          </span>
        </div>
        <a href="course-page.html?id=${courseId}" class="course-link">
          عرض الكورس
          <i class="fa-solid fa-arrow-left" style="margin-right: 8px;"></i>
        </a>
      </div>
    `;

    return card;
  }

createControls() {
  const controls = document.createElement('div');
  controls.className = 'carousel-controls';

  const dotsContainer = document.createElement('div');
  dotsContainer.className = 'carousel-dots';
  this.dotsContainer = dotsContainer;

  // تحديد عدد الكروت الظاهرة وعدد الخطوات
  const visible = this.options.visibleCards || this.getVisibleCards();
  const step = Math.max(1, this.options.scrollStep || 1);
  const totalItems = this.courses.length || 0;

  // عدد النقاط الديناميكي (كل نقطة = صفحة جديدة)
  let totalDots = 1;
  if (totalItems > visible) {
    totalDots = Math.ceil((totalItems - visible) / step) + 1;
  }

  // حفظ عدد النقاط لاستخدامه لاحقًا
  this.totalDots = totalDots;

  // إنشاء النقاط
  for (let i = 0; i < totalDots; i++) {
    const dot = document.createElement('div');
    dot.className = 'carousel-dot';
    if (i === 0) dot.classList.add('active');
    dot.dataset.index = i;

    dot.addEventListener('click', () => {
      this.currentIndex = i * this.options.scrollStep;
      this.updateCarousel();
      this.stopAutoScroll();
      if (this.options.autoScroll) this.startAutoScroll();
    });

    dotsContainer.appendChild(dot);
  }

  controls.appendChild(dotsContainer);
  return controls;
}


updateCarousel() {
  if (!this.carouselContainer) return;

  const cards = Array.from(this.carouselContainer.children);
  if (cards.length === 0) return;

  const cardWidth = cards[0].offsetWidth;
  const gap = 24; // المسافة بين الكروت
  const offset = -(this.currentIndex * (cardWidth + gap));

  // تحديث موضع الكاروسيل
  this.carouselContainer.style.transform = `translateX(${offset}px)`;

  // ✅ تحديث النقاط (dots)
  if (this.dotsContainer) {
    const dots = this.dotsContainer.children;
    if (dots.length > 0) {
      const activeDotIndex = Math.floor(this.currentIndex / this.options.scrollStep) % dots.length;
      Array.from(dots).forEach((dot, index) => {
        dot.classList.toggle('active', index === activeDotIndex);
      });
    }
  }

  // // ✅ تحديد الكروت الظاهرة وعمل highlight
  // const visible = this.options.visibleCards || this.getVisibleCards();
  // const start = this.currentIndex;
  // const end = this.currentIndex + visible;

  // cards.forEach((card, index) => {
  //   if (index >= start && index < end) {
  //     card.classList.add('active-course');
  //   } else {
  //     card.classList.remove('active-course');
  //   }
  // });
  
  // ✅ تحديد الكورس النشط بناءً على النقطة الفعّالة
  const activeDotIndex = Math.floor(this.currentIndex / this.options.scrollStep);
  const activeCourseIndex = activeDotIndex * this.options.scrollStep;
  
  cards.forEach((card, index) => {
    card.classList.remove('active-course');
    if (index === activeCourseIndex) {
      card.classList.add('active-course');
    }
  });
  
}



  goToSlide(slideIndex) {
    this.stopAutoScroll();
    this.currentIndex = slideIndex * this.options.scrollStep;
    this.updateCarousel();
    if (this.options.autoScroll) {
      this.startAutoScroll();
    }
  }

scrollNext() {
  if (this.isAnimating) return;

  this.isAnimating = true;
  this.currentIndex += this.options.scrollStep;

  const maxIndex = this.courses.length - this.options.visibleCards;
  
  // لو وصلنا لآخر نقطة نرجع للأولى
  if (this.currentIndex >= maxIndex) {
    this.currentIndex = 0;
  }

  this.updateCarousel();

  setTimeout(() => {
    this.isAnimating = false;
  }, 600);
}


  scrollPrev() {
    if (this.isAnimating) {
      return;
    }

    this.isAnimating = true;
    this.currentIndex -= this.options.scrollStep;

    // Loop to end when going before start
    if (this.currentIndex < 0) {
      const maxIndex = this.courses.length - this.options.visibleCards;
      this.currentIndex = Math.max(0, maxIndex);
    }
    this.updateCarousel();

    setTimeout(() => {
      this.isAnimating = false;
    }, 600);
  }

  startAutoScroll() {
    this.stopAutoScroll();
    this.autoScrollTimer = setInterval(() => {
      this.scrollNext();
    }, this.options.scrollInterval);
  }

  stopAutoScroll() {
    if (this.autoScrollTimer) {
      clearInterval(this.autoScrollTimer);
      this.autoScrollTimer = null;
    }
  }

  setupEventListeners() {
    // Pause auto-scroll on hover
    if (this.container) {
      this.container.addEventListener('mouseenter', () => {
        this.stopAutoScroll();
      });

      this.container.addEventListener('mouseleave', () => {
        if (this.options.autoScroll) {
          this.startAutoScroll();
        }
      });
    }

    // Handle window resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const oldVisibleCards = this.options.visibleCards;
        this.options.visibleCards = this.getVisibleCards();
        if (oldVisibleCards !== this.options.visibleCards) {
        }
        this.updateCarousel();
      }, 250);
    });

    // Pause on visibility change
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.stopAutoScroll();
      } else if (this.options.autoScroll) {
        this.startAutoScroll();
      }
    });
  }

  destroy() {
    this.stopAutoScroll();
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}

// Initialize carousel when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const carousel = new CoursesCarousel('latest-courses', {
    autoScroll: true,
    scrollInterval: 2000,
    scrollStep: 1
  });
  
  // Make carousel accessible globally for debugging
  window.coursesCarousel = carousel;
});