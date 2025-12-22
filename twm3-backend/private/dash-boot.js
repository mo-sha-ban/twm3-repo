/**
 * Dashboard Bootstrap Script
 * Initializes all dashboard modules after page load
 */

(function() {
    'use strict';

    // Function to safely initialize modules with error handling
    function initializeModule(moduleName, initFunction) {
        try {
            console.log(`Initializing ${moduleName}...`);
            if (typeof initFunction === 'function') {
                initFunction();
                console.log(`✓ ${moduleName} initialized successfully`);
                return true;
            } else {
                console.warn(`${moduleName} initialization function not found`);
                return false;
            }
        } catch (error) {
            console.error(`✗ Error initializing ${moduleName}:`, error);
            return false;
        }
    }

    // Wait for DOM to be fully loaded before initializing modules
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrapDashboard);
    } else {
        // DOM is already loaded (inline script execution)
        bootstrapDashboard();
    }

    function bootstrapDashboard() {
        console.log('Dashboard Bootstrap: Starting initialization...');

        // Initialize Courses module
        if (window.Courses && typeof window.Courses.init === 'function') {
            initializeModule('Courses', function() {
                window.Courses.init();
            });
        }

        // Set up modal system if available
        if (window.ModalSystem && typeof window.ModalSystem.setupEvents === 'function') {
            initializeModule('ModalSystem', function() {
                window.ModalSystem.setupEvents();
            });
        }

        // Ensure global modal functions are available
        ensureGlobalModalFunctions();

        console.log('Dashboard Bootstrap: Initialization complete');
    }

    // Ensure critical global functions are accessible
    function ensureGlobalModalFunctions() {
        // manageCourseContent
        if (typeof window.manageCourseContent !== 'function') {
            window.manageCourseContent = function(courseId, courseTitle) {
                console.log('manageCourseContent called:', courseId, courseTitle);
                if (window.Courses && typeof window.Courses.manageCourseContent === 'function') {
                    return window.Courses.manageCourseContent(courseId, courseTitle);
                } else {
                    console.error('manageCourseContent not available in Courses module');
                    alert('خطأ: لا يمكن فتح محتوى الكورس');
                }
            };
        }

        // openAddCourseModal
        if (typeof window.openAddCourseModal !== 'function') {
            window.openAddCourseModal = function() {
                console.log('openAddCourseModal called');
                if (window.Courses && typeof window.Courses.openAddCourseModal === 'function') {
                    return window.Courses.openAddCourseModal();
                } else if (typeof openModal === 'function') {
                    openModal('courseModal');
                } else {
                    console.error('openAddCourseModal not available');
                }
            };
        }

        // editCourse
        if (typeof window.editCourse !== 'function') {
            window.editCourse = function(courseId) {
                console.log('editCourse called:', courseId);
                if (window.Courses && typeof window.Courses.openEditCourse === 'function') {
                    return window.Courses.openEditCourse(courseId);
                } else {
                    console.error('editCourse not available');
                }
            };
        }

        // closeCourseModal
        if (typeof window.closeCourseModal !== 'function') {
            window.closeCourseModal = function() {
                console.log('closeCourseModal called');
                if (window.Courses && typeof window.Courses.closeCourseModal === 'function') {
                    return window.Courses.closeCourseModal();
                } else if (typeof closeModal === 'function') {
                    closeModal('courseModal');
                } else {
                    console.error('closeCourseModal not available');
                }
            };
        }

        // closeCourseContentModal
        if (typeof window.closeCourseContentModal !== 'function') {
            window.closeCourseContentModal = function() {
                console.log('closeCourseContentModal called');
                if (window.Courses && typeof window.Courses.closeCourseContentModal === 'function') {
                    return window.Courses.closeCourseContentModal();
                } else if (typeof closeModal === 'function') {
                    closeModal('courseContentModal');
                } else {
                    console.error('closeCourseContentModal not available');
                }
            };
        }

        // addUnitToCourse
        if (typeof window.addUnitToCourse !== 'function') {
            window.addUnitToCourse = function(courseId) {
                console.log('addUnitToCourse called:', courseId);
                if (window.Courses && typeof window.Courses.addUnitToCourse === 'function') {
                    return window.Courses.addUnitToCourse(courseId);
                } else {
                    console.error('addUnitToCourse not available in Courses module');
                    alert('خطأ: لا يمكن إضافة وحدة جديدة');
                }
            };
        }

        // updatePromoVideo - Update promotional video for paid courses
        if (typeof window.updatePromoVideo !== 'function') {
            window.updatePromoVideo = async function(courseId) {
                console.log('updatePromoVideo called:', courseId);
                const videoUrl = document.getElementById('promoVideoUrl')?.value;
                if (!videoUrl) {
                    alert('يرجى إدخال رابط الفيديو');
                    return;
                }
                try {
                    const response = await fetch(`/api/courses/${courseId}/promo-video`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ promoVideoUrl: videoUrl })
                    });
                    if (!response.ok) throw new Error('Failed to update promo video');
                    alert('تم حفظ الفيديو الترويجي بنجاح');
                    // Refresh the modal
                    if (window.Courses && typeof window.Courses.manageCourseContent === 'function') {
                        window.Courses.manageCourseContent(courseId, '');
                    }
                } catch (error) {
                    console.error('Error updating promo video:', error);
                    alert('خطأ: فشل حفظ الفيديو الترويجي');
                }
            };
        }

        // removePromoVideo - Remove promotional video
        if (typeof window.removePromoVideo !== 'function') {
            window.removePromoVideo = async function(courseId) {
                console.log('removePromoVideo called:', courseId);
                if (!confirm('هل أنت متأكد من حذف الفيديو الترويجي؟')) {
                    return;
                }
                try {
                    const response = await fetch(`/api/courses/${courseId}/promo-video`, {
                        method: 'DELETE'
                    });
                    if (!response.ok) throw new Error('Failed to remove promo video');
                    alert('تم حذف الفيديو الترويجي بنجاح');
                    // Refresh the modal
                    if (window.Courses && typeof window.Courses.manageCourseContent === 'function') {
                        window.Courses.manageCourseContent(courseId, '');
                    }
                } catch (error) {
                    console.error('Error removing promo video:', error);
                    alert('خطأ: فشل حذف الفيديو الترويجي');
                }
            };
        }
    }

    // Helper function to update promo video preview iframe
    window.updatePromoVideoPreview = function(videoUrl) {
        const frame = document.getElementById('promoVideoFrame');
        if (!frame) return;

        if (!videoUrl) {
            frame.src = '';
            return;
        }

        // Handle YouTube URLs
        if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
            let videoId = '';
            if (videoUrl.includes('v=')) {
                videoId = videoUrl.split('v=')[1].split('&')[0];
            } else if (videoUrl.includes('youtu.be/')) {
                videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
            }
            if (videoId) {
                frame.src = `https://www.youtube.com/embed/${videoId}`;
            }
        } else if (videoUrl.includes('google.com/file')) {
            // Handle Google Drive URLs
            let fileId = videoUrl.match(/\/d\/([\w-]+)/)?.[1];
            if (fileId) {
                frame.src = `https://drive.google.com/file/d/${fileId}/preview`;
            }
        } else {
            // Direct video file URL
            frame.src = videoUrl;
        }
    };

    console.log('Dashboard Bootstrap script loaded');
})();
