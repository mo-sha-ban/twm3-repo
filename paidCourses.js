// استرجاع المعلومات من localStorage عند تحميل الصفحة// استرجاع المعلومات من localStorage عند تحميل الصفحة
// استرجاع المعلومات من localStorage عند تحميل الصفحة
window.onload = function () {
  var savedEmail = localStorage.getItem("login-email");
  var savedPassword = localStorage.getItem("login-password");

  if (savedEmail && savedPassword) {
    // إذا كانت المعلومات موجودة، اجعل الديف مرئيًا
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("logoutButton").style.display = "block"; // اجعل زر تسجيل الخروج مرئيًا

    // جلب معلومات المستخدم من السيرفر
    async function loadUserCourses() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          alert("يجب تسجيل الدخول أولاً!");
          window.location.href = "login.html";
          return;
        }

        // جلب بيانات المستخدم
        const userResponse = await fetch("/api/user", {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!userResponse.ok) {
          throw new Error(`HTTP error! status: ${userResponse.status}`);
        }

        const user = await userResponse.json();

        // جلب الكورسات من السيرفر
        const coursesResponse = await fetch("/api/courses", {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!coursesResponse.ok) {
          throw new Error(`HTTP error! status: ${coursesResponse.status}`);
        }

        const courses = await coursesResponse.json();
        const coursesContainer = document.querySelector(".courses .container");
        coursesContainer.innerHTML = ""; // تنظيف المحتوى الحالي

        if (courses.length === 0) {
          coursesContainer.innerHTML = `<p>لا توجد كورسات متاحة.</p>`;
          return;
        }

        // عرض الدورات
        courses.forEach((course) => {
          const courseDiv = document.createElement("div");
          courseDiv.className = `box course ${course.category || 'general'}`;
          courseDiv.innerHTML = `
            <div class="info">
              <i class="${course.icon || 'fas fa-book'}"></i>
              <h2>${course.title}</h2>
              <p>${course.description || 'لا يوجد وصف متاح'}</p>
              <p>السعر: ${course.isFree ? 'مجاني' : (course.isPriceHidden ? 'مدفوع' : (course.price || 0) + ' جنيه')}</p>
              <p>المدرب: ${course.instructor || 'غير محدد'}</p>
              <p>المدة: ${course.duration || 0} ساعة</p>
              <a href="paid-course-page.html?id=${course._id}" class="course-link">اذهب للكورس</a>
            </div>
          `;
          coursesContainer.appendChild(courseDiv);
        });
      } catch (error) {
        console.error("Error loading courses:", error);
        const coursesContainer = document.querySelector(".courses .container");
        coursesContainer.innerHTML = `<p>خطأ في تحميل الكورسات: ${error.message}</p>`;
      }
    }

    // استدعاء دالة تحميل الكورسات
    loadUserCourses();
  } else {
    // إذا لم تكن المعلومات موجودة، اجعل نموذج تسجيل الدخول مرئيًا
    document.getElementById("loginForm").style.display = "block";
  }
};

document
  .getElementById("loginForm")
  .addEventListener("submit", function (event) {
    event.preventDefault(); // منع إرسال النموذج

    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    // تسجيل الدخول عبر السيرفر
    async function loginUser() {
      try {
        const response = await fetch("/api/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // حفظ التوكن وبيانات المستخدم
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          localStorage.setItem("login-email", email);
          localStorage.setItem("login-password", password);

          document.getElementById("loginForm").style.display = "none";
          document.getElementById("logoutButton").style.display = "block";

          // إعادة تحميل الصفحة لعرض الكورسات
          window.location.reload();
        } else {
          alert(data.message || "فشل في تسجيل الدخول");
        }
      } catch (error) {
        console.error("Login error:", error);
        alert("حدث خطأ أثناء تسجيل الدخول");
      }
    }

    loginUser();
  });

document.getElementById("logoutButton").addEventListener("click", function () {
  // حذف جميع المعلومات من localStorage عند تسجيل الخروج
  localStorage.removeItem("login-email");
  localStorage.removeItem("login-password");
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  document.getElementById("logoutButton").style.display = "none";
  document.getElementById("loginForm").style.display = "block";
  document.getElementById("login-email").value = "";
  document.getElementById("login-password").value = "";

  // إعادة تحميل الصفحة
  window.location.reload();
});
