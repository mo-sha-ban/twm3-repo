// استرجاع المعلومات من localStorage عند تحميل الصفحة
window.onload = function () {
  // fetch("test-paid-courses.json")
  //   .then((response) => response.json())
  //   .then((courses) => {
  //     const coursesContainer = document.querySelector(".courses .container");
  //     coursesContainer.innerHTML = ""; // تنظيف المحتوى الحالي

  //     // عرض الدورات
  //     courses.forEach((course) => {
  //       const courseDiv = document.createElement("div");
  //       courseDiv.className = `box course ${course.type}`;
  //       courseDiv.innerHTML = `
  //       <div class="info">
  //         <i class="${course.icon}"></i>
  //         <h2>${course.title}</h2>
  //         <p>${course.description}</p>
  //         <p>Price: ${course.price}</p>
  //         <a href="course-page.html?id=${course.id}" class="course-link">Go to Course</a> <!-- Link to the course with ID -->
  //         <div class="shape">
  //           <img class="shape1" src="img/teamshape (1).svg" alt="" />
  //         </div>
  //       </div>

  //       `;
  //       coursesContainer.appendChild(courseDiv);
  //     });
  //   });

  // جلب معلومات الدورات من السيرفر
  async function loadCourses() {
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));
      
      if (!token || !user) {
        console.log("User not logged in, showing public courses");
        // عرض الكورسات العامة فقط
        return;
      }

      const response = await fetch("/api/courses", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const courses = await response.json();
      const coursesContainer = document.querySelector(".courses .container");
      coursesContainer.innerHTML = ""; // تنظيف المحتوى الحالي

      // عرض الدورات
      courses.forEach((course) => {
        const courseDiv = document.createElement("div");
        courseDiv.className = `box course ${course.category || 'general'}`;
        courseDiv.innerHTML = `
          <div class="info">
            <i class="${course.icon || 'fas fa-book'}"></i>
            <h2>${course.title}</h2>
            <p>${course.description || 'لا يوجد وصف متاح'}</p>
            <p>السعر: ${course.price || 0} جنيه</p>
            <p>المدرب: ${course.instructor || 'غير محدد'}</p>
            <p>المدة: ${course.duration || 0} ساعة</p>
            <a href="course-page.html?id=${course._id}" class="course-link">اذهب للكورس</a>
            <div class="shape">
              <img class="shape1" src="img/teamshape (1).svg" alt="" />
            </div>
          </div>
        `;
        coursesContainer.appendChild(courseDiv);
      });
    } catch (error) {
      console.error("Error fetching courses:", error);
      const coursesContainer = document.querySelector(".courses .container");
      coursesContainer.innerHTML = `<p>خطأ في تحميل الكورسات: ${error.message}</p>`;
    }
  }

  // استدعاء دالة تحميل الكورسات
  loadCourses();
};
