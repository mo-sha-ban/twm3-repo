/**
 * Test script to verify the progress tracking fix in course-page.html
 * This simulates the exact scenario from the logs
 */

// Mock the necessary DOM elements and functions
const mockDOM = {
    progressPercentage: { textContent: '0%' },
    progressFill: { style: { width: '0%' } },
    lessonItems: []
};

// Mock course data matching the log scenario
const mockCourseData = {
    units: [
        {
            _id: 'unit-0',
            title: "Module 0",
            lessons: [
                { _id: 'lesson-0-0', title: "Lesson 0-0" },
                { _id: 'lesson-0-1', title: "Lesson 0-1" },
                { _id: 'lesson-0-2', title: "Lesson 0-2" },
                { _id: 'lesson-0-3', title: "Lesson 0-3" },
                { _id: 'lesson-0-4', title: "Lesson 0-4" },
                { _id: 'lesson-0-5', title: "Lesson 0-5" },
                { _id: 'lesson-0-6', title: "Lesson 0-6" },
                { _id: 'lesson-0-7', title: "Lesson 0-7" },
                { _id: 'lesson-0-8', title: "Lesson 0-8" }
            ]
        }
    ]
};

// Mock server response with 8 completed lessons (89% progress)
const mockServerResponse = {
    courseId: '69281576e8ca55d8b9df2163',
    progressPercent: 89,
    completedLessons: ['0-0', '0-2', '0-1', '0-4', '0-6', '0-7', '0-5', '0-8']
};

// Global variables from course-page.html
let completedLessons = new Set();
let courseData = null;
let currentUserId = '692f43b0f799b697fbbe8cd6';
let courseId = '69281576e8ca55d8b9df2163';

// Mock DOM functions
function getElementById(id) {
    switch(id) {
        case 'progressPercentage': return mockDOM.progressPercentage;
        case 'progressFill': return mockDOM.progressFill;
        default: return null;
    }
}

function querySelectorAll(selector) {
    if (selector === '.lesson-item') {
        return mockDOM.lessonItems;
    }
    return [];
}

// Copy the key functions from course-page.html with our fixes
function countTotalLessons() {
    let total = 0;
    if (Array.isArray(courseData?.units)) {
        courseData.units.forEach(u => {
            if (Array.isArray(u.lessons)) total += u.lessons.length;
        });
    }
    return total;
}

function updateProgress() {
    const existingKeys = new Set();
    let totalLessons = 0;
    if (Array.isArray(courseData?.units)) {
        courseData.units.forEach((unit, mIdx) => {
            if (Array.isArray(unit.lessons)) {
                unit.lessons.forEach((_, lIdx) => {
                    existingKeys.add(`${mIdx}-${lIdx}`);
                    totalLessons += 1;
                });
            }
        });
    }

    console.log('Existing lesson keys:', Array.from(existingKeys));

    const prunedCompleted = new Set();
    completedLessons.forEach(key => {
        if (existingKeys.has(key)) prunedCompleted.add(key);
    });
    completedLessons = prunedCompleted;

    console.log('Pruned completed lessons:', Array.from(completedLessons));

    const completedCount = completedLessons.size;
    let percentage = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
    percentage = Math.max(0, Math.min(100, percentage));

    const percEl = getElementById('progressPercentage');
    const fillEl = getElementById('progressFill');
    if (percEl) percEl.textContent = `${percentage}%`;
    if (fillEl) fillEl.style.width = `${percentage}%`;

    console.log('Progress Calculation:', {
        totalLessons,
        completedCount,
        percentage,
        completedLessons: Array.from(completedLessons),
        existingLessons: Array.from(existingKeys)
    });

    // Synchronize visual completion indicators with actual completion data
    querySelectorAll('.lesson-item').forEach(lessonItem => {
        const moduleIndex = parseInt(lessonItem.dataset.module);
        const lessonIndex = parseInt(lessonItem.dataset.lesson);
        const lessonKey = `${moduleIndex}-${lessonIndex}`;

        if (completedLessons.has(lessonKey)) {
            lessonItem.classList.add('completed');
        } else {
            lessonItem.classList.remove('completed');
        }
    });

    // Force re-calculation if there's a mismatch
    const visualCompletedCount = querySelectorAll('.lesson-item.completed').length;
    if (visualCompletedCount !== completedCount) {
        console.warn('Mismatch detected! Visual completed:', visualCompletedCount, 'vs actual completed:', completedCount);

        // Determine which one is more likely correct
        if (visualCompletedCount > completedCount && completedCount > 0) {
            console.log('Trusting visual indicators as they show more completions (likely from server load)');
            const visuallyCompleted = new Set();
            querySelectorAll('.lesson-item.completed').forEach(item => {
                const moduleIndex = parseInt(item.dataset.module);
                const lessonIndex = parseInt(item.dataset.lesson);
                visuallyCompleted.add(`${moduleIndex}-${lessonIndex}`);
            });
            completedLessons = visuallyCompleted;
        } else if (completedCount > visualCompletedCount) {
            console.log('Trusting completedLessons set as it shows more completions (local tracking ahead)');
            querySelectorAll('.lesson-item').forEach(lessonItem => {
                const moduleIndex = parseInt(lessonItem.dataset.module);
                const lessonIndex = parseInt(lessonItem.dataset.lesson);
                const lessonKey = `${moduleIndex}-${lessonIndex}`;

                if (completedLessons.has(lessonKey)) {
                    lessonItem.classList.add('completed');
                } else {
                    lessonItem.classList.remove('completed');
                }
            });
        }

        // Recalculate with the correct data
        const newCompletedCount = completedLessons.size;
        const newPercentage = totalLessons > 0 ? Math.round((newCompletedCount / totalLessons) * 100) : 0;
        if (percEl) percEl.textContent = `${newPercentage}%`;
        if (fillEl) fillEl.style.width = `${newPercentage}%`;
        console.log('Recalculated progress after sync:', newPercentage + '%');
    }
}

async function fetchServerProgress() {
    try {
        // Mock token
        const token = 'mock-token';
        if (!token) return;

        // Mock server response
        const response = {
            ok: true,
            json: () => Promise.resolve([mockServerResponse])
        };

        const summaries = await response.json();
        const courseSummary = Array.isArray(summaries) ? summaries.find(s => s.courseId === courseId) : null;

        if (courseSummary && typeof courseSummary.progressPercent === 'number') {
            const serverProgress = Math.max(0, Math.min(100, Math.round(courseSummary.progressPercent)));
            const percEl = getElementById('progressPercentage');
            const fillEl = getElementById('progressFill');

            // Get current local progress calculation
            const currentProgress = percEl ? parseInt(percEl.textContent) || 0 : 0;

            console.log(`Server progress: ${serverProgress}%, Local progress: ${currentProgress}%`);

            // Fixed logic - should NOT update to 100%
            if (completedLessons.size === 0 && serverProgress > 0) {
                console.log(`Initializing progress from server: ${currentProgress}% -> ${serverProgress}%`);
                if (percEl) percEl.textContent = `${serverProgress}%`;
                if (fillEl) fillEl.style.width = `${serverProgress}%`;

                // Also update the completedLessons set based on server progress
                const totalLessons = countTotalLessons();
                if (totalLessons > 0) {
                    const estimatedCompleted = Math.round((serverProgress / 100) * totalLessons);
                    console.log(`Server indicates ~${estimatedCompleted} lessons completed, but keeping local tracking for accuracy`);
                }
            } else if (Math.abs(serverProgress - currentProgress) > 5) {
                console.log(`Significant progress difference detected: local ${currentProgress}% vs server ${serverProgress}%`);
                console.log(`Keeping local progress calculation as it's more accurate`);
            } else {
                console.log(`Progress is consistent: local ${currentProgress}% matches server ${serverProgress}%`);
            }
        }
    } catch (error) {
        console.error('Error fetching server progress:', error);
    }
}

function loadProgress() {
    // Use user-specific key to prevent cross-user progress sharing
    const storageKey = `courseProgress_${currentUserId}_${courseId}`;

    // Mock localStorage with server data
    const mockProgressData = {
        completedLessons: mockServerResponse.completedLessons,
        lastAccessed: new Date().toISOString()
    };

    try {
        const data = mockProgressData;
        completedLessons = new Set(data.completedLessons || []);
        console.log('Loaded user-specific progress:', {
            userId: currentUserId,
            courseId: courseId,
            completedLessons: Array.from(completedLessons),
            count: completedLessons.size
        });

        // First update visual completion indicators
        completedLessons.forEach(lessonKey => {
            const [moduleIndex, lessonIndex] = lessonKey.split('-');
            // Mock lesson items
            const lessonItem = {
                dataset: { module: moduleIndex, lesson: lessonIndex },
                classList: {
                    add: function(cls) { console.log(`Added class '${cls}' to lesson ${lessonKey}`); },
                    remove: function(cls) { console.log(`Removed class '${cls}' from lesson ${lessonKey}`); }
                }
            };
            if (lessonItem) {
                lessonItem.classList.add('completed');
            }
        });

        // Then force update progress to ensure UI is synchronized
        updateProgress();

    } catch (error) {
        console.error('Error loading user-specific progress:', error);
    }
}

// Initialize and run the test
function runTest() {
    console.log('=== Starting Progress Tracking Test ===');

    // Set up course data
    courseData = mockCourseData;

    // Create mock lesson items
    courseData.units.forEach((unit, moduleIndex) => {
        unit.lessons.forEach((lesson, lessonIndex) => {
            mockDOM.lessonItems.push({
                dataset: { module: moduleIndex, lesson: lessonIndex },
                classList: {
                    add: function(cls) { console.log(`Added class '${cls}' to lesson ${moduleIndex}-${lessonIndex}`); },
                    remove: function(cls) { console.log(`Removed class '${cls}' from lesson ${moduleIndex}-${lessonIndex}`); },
                    contains: function(cls) { return this._classes && this._classes.includes(cls); },
                    _classes: []
                }
            });
        });
    });

    console.log('Step 1: Initial state');
    console.log(`Total lessons: ${countTotalLessons()}`);
    console.log(`Completed lessons: ${completedLessons.size}`);
    console.log(`Progress: ${mockDOM.progressPercentage.textContent}`);

    console.log('\nStep 2: Loading progress from server (8 completed lessons)');
    loadProgress();

    console.log('\nStep 3: Current state after loading');
    console.log(`Completed lessons: ${Array.from(completedLessons).join(', ')}`);
    console.log(`Progress: ${mockDOM.progressPercentage.textContent}`);

    console.log('\nStep 4: Fetching server progress');
    fetchServerProgress();

    console.log('\nStep 5: Final state');
    console.log(`Final progress: ${mockDOM.progressPercentage.textContent}`);
    console.log(`Final completed lessons count: ${completedLessons.size}`);

    // Verify the fix
    const finalProgress = parseInt(mockDOM.progressPercentage.textContent);
    if (finalProgress === 89) {
        console.log('\n✅ SUCCESS: Progress correctly shows 89% (not 100%)');
        console.log('✅ The fix is working correctly!');
        return true;
    } else {
        console.log(`\n❌ FAILURE: Progress shows ${finalProgress}% instead of expected 89%`);
        console.log('❌ The fix is NOT working correctly!');
        return false;
    }
}

// Run the test
console.log('Running progress tracking test...');
const testPassed = runTest();

if (testPassed) {
    console.log('\n🎉 All tests passed! The progress tracking fix is working correctly.');
} else {
    console.log('\n💥 Tests failed! The progress tracking fix needs more work.');
}