// Modern Course Page JavaScript with Progress Tracking
(function() {
    'use strict';

    const links = document.getElementById('links');
    const videoSrc = document.getElementById('iframe');
    
    if (!links || !videoSrc) return;

    const API_BASE = 'http://localhost:5000/api';
    let currentUser = null;
    let currentCourseId = null;
    let currentLessonId = null;

    // Initialize user and course
    async function initializeTracking() {
        const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');
        if (!authToken) return;

        try {
            const response = await fetch(`${API_BASE}/auth/me`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (response.ok) {
                currentUser = await response.json();
            }
        } catch (error) {
            console.error('Error loading user:', error);
        }

        // Get course ID from URL or page data
        currentCourseId = getCurrentCourseId();
    }

    function getCurrentCourseId() {
        // Try to get from URL params
        const params = new URLSearchParams(window.location.search);
        if (params.has('courseId')) return params.get('courseId');
        if (params.has('id')) return params.get('id');

        // Try to get from page data attribute
        if (document.body.dataset.courseId) return document.body.dataset.courseId;

        // Try to extract from course title
        const courseTitle = document.querySelector('h1, .course-title');
        if (courseTitle) return courseTitle.dataset.courseId;

        return null;
    }

    // Track lesson watch using new Progress API
    async function trackLessonWatch(lessonId) {
        if (!currentUser || !currentCourseId) return;

        try {
            const authToken = localStorage.getItem('authToken') || localStorage.getItem('token');
            await fetch(`${API_BASE}/progress/track-lesson`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: currentUser._id,
                    courseId: currentCourseId,
                    lessonId: lessonId
                })
            });
        } catch (error) {
            console.error('Error tracking progress:', error);
        }
    }

    // Get lesson ID from link element
    function getLessonId(linkElement) {
        // Try data attribute
        if (linkElement.dataset.lessonId) return linkElement.dataset.lessonId;

        // Try to extract from URL
        const url = linkElement.getAttribute('title') || linkElement.href;
        const match = url.match(/[?&]id=([^&]+)/);
        if (match) return match[1];

        // Use link text as fallback
        return linkElement.textContent.trim();
    }

    // Initialize tracking on page load
    initializeTracking();

    // Handle lesson clicks
    links.addEventListener('click', (event) => {
        const link = event.target.closest('a');
        if (!link || !link.hasAttribute('title')) return;
        
        event.preventDefault();
        
        const videoUrl = link.getAttribute('title');
        currentLessonId = getLessonId(link);
        
        // Update video source
        videoSrc.src = videoUrl;
        
        // Update active state
        document.querySelectorAll('.dropdown-items a').forEach(a => {
            a.classList.remove('active');
        });
        link.classList.add('active');
        
        // Track lesson watch
        trackLessonWatch(currentLessonId);
        
        // Scroll to top on mobile
        if (window.innerWidth < 992) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    // Handle dropdown toggles
    document.querySelectorAll('.dropdown > span, .dropdown > a').forEach(toggle => {
        if (toggle.tagName === 'SPAN') {
            toggle.style.cursor = 'pointer';
        }
    });

    // Auto-expand active lesson's unit
    const activeLesson = document.querySelector('.dropdown-items a.active');
    if (activeLesson) {
        const parentDropdown = activeLesson.closest('.dropdown');
        if (parentDropdown) {
            parentDropdown.classList.add('active');
        }

        // Track initial lesson if page loaded with active lesson
        currentLessonId = getLessonId(activeLesson);
        if (currentUser && currentCourseId) {
            trackLessonWatch(currentLessonId);
        }
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        const activeLesson = document.querySelector('.dropdown-items a.active');
        if (!activeLesson) return;

        let nextLesson = null;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            nextLesson = activeLesson.parentElement.nextElementSibling?.querySelector('a');
            if (!nextLesson) {
                // Try next unit
                const currentUnit = activeLesson.closest('.dropdown');
                const nextUnit = currentUnit?.nextElementSibling;
                nextLesson = nextUnit?.querySelector('.dropdown-items a');
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            nextLesson = activeLesson.parentElement.previousElementSibling?.querySelector('a');
            if (!nextLesson) {
                // Try previous unit
                const currentUnit = activeLesson.closest('.dropdown');
                const prevUnit = currentUnit?.previousElementSibling;
                const prevUnitLessons = prevUnit?.querySelectorAll('.dropdown-items a');
                nextLesson = prevUnitLessons?.[prevUnitLessons.length - 1];
            }
        }

        if (nextLesson) {
            nextLesson.click();
            nextLesson.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });

})();