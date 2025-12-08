// // Safety wiring for dashboard modals (loaded after dash.js)
// document.addEventListener('DOMContentLoaded', function() {
//     try {
//         // Wire up Add Course button safely
//         const addCourseBtn = document.getElementById('add-course-button');
//         if (addCourseBtn) {
//             // Remove any existing handlers by cloning
//             const newBtn = addCourseBtn.cloneNode(true);
//             addCourseBtn.parentNode.replaceChild(newBtn, addCourseBtn);
            
//             // Add our canonical handler that defers to Courses module
//             newBtn.addEventListener('click', function() {
//                 console.log('add-course-button clicked (dash-boot)');
//                 if (window.Courses && typeof window.Courses.openAddCourseModal === 'function') {
//                     return window.Courses.openAddCourseModal();
//                 }
//                 if (typeof openAddCourseModal === 'function') return openAddCourseModal();
//             });
//         }

//         // Wire up other buttons
//         const addUserBtn = document.getElementById('add-user-button') || document.getElementById('add-user-btn');
//         if (addUserBtn && typeof openAddModal === 'function') {
//             addUserBtn.addEventListener('click', openAddModal);
//         }

//         const addBlogBtn = document.getElementById('add-blog-button');
//         if (addBlogBtn && typeof openBlogModal === 'function') {
//             addBlogBtn.addEventListener('click', () => openBlogModal(null));
//         }

//         // Ensure all modals can be closed
//         document.querySelectorAll('.modal').forEach(modal => {
//             const closeBtn = modal.querySelector('.modal-close');
//             if (closeBtn) {
//                 closeBtn.onclick = () => {
//                     modal.style.display = 'none';
//                     modal.classList.remove('show');
//                     document.body.style.overflow = 'auto';
//                 };
//             }
//         });

//     } catch (err) {
//         console.warn('dash-boot wiring failed', err);
//     }
//     // Initialize Courses module if available
//     try { if (window.Courses && typeof window.Courses.init === 'function') window.Courses.init(); } catch(e) {}
// });