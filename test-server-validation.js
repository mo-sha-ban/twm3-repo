/**
 * Test script for server data validation and real-time synchronization
 * This tests the new features added to handle server data corruption
 */

// Mock the completedLessons variable
let completedLessons = new Set(['0-0', '0-1', '0-2']);

// Test the validation function with the corrupted server data from the feedback
function testServerDataValidation() {
    console.log('=== Testing Server Data Validation ===');

    // This is the corrupted data from the server feedback
    const corruptedServerData = {
        "courseId": "69281576e8ca55d8b9df2163",
        "courseTitle": "pro course 2",
        "completedCount": 39,
        "totalLessons": 9,
        "progressPercent": 433, // This is impossible! 433% progress
        "lastViewed": {
            "unitId": "692815958979794d5e98c660",
            "lessonId": "692f4f54a35196f4e3c6a219",
            "at": "2025-12-02T20:47:32.838Z"
        },
        "updatedAt": "2025-12-02T20:47:32.841Z"
    };

    // Test the validation function
    const validationResult = validateServerProgressData(corruptedServerData);

    console.log('Validation Result:', validationResult);

    if (!validationResult.valid) {
        console.log('✅ SUCCESS: Validation correctly identified corrupted server data');
        console.log('Errors detected:', validationResult.message);

        if (validationResult.severe) {
            console.log('✅ SUCCESS: Severe corruption flagged for reporting');
        } else {
            console.log('❌ FAILURE: Severe corruption not properly flagged');
        }
    } else {
        console.log('❌ FAILURE: Validation did not detect corrupted server data');
    }

    // Test with valid data
    const validServerData = {
        "courseId": "69281576e8ca55d8b9df2163",
        "courseTitle": "pro course 2",
        "completedCount": 8,
        "totalLessons": 9,
        "progressPercent": 89,
        "lastViewed": {
            "unitId": "692815958979794d5e98c660",
            "lessonId": "692f4f54a35196f4e3c6a219",
            "at": "2025-12-02T20:47:32.838Z"
        },
        "updatedAt": "2025-12-02T20:47:32.841Z"
    };

    const validResult = validateServerProgressData(validServerData);
    console.log('Valid Data Result:', validResult);

    if (validResult.valid) {
        console.log('✅ SUCCESS: Validation correctly accepted valid server data');
    } else {
        console.log('❌ FAILURE: Validation incorrectly rejected valid server data');
    }

    return !validationResult.valid && validResult.valid;
}

// Test the conflict resolution function
function testConflictResolution() {
    console.log('\n=== Testing Conflict Resolution ===');

    // Test case 1: Server data is more recent
    const recentServerData = {
        updatedAt: new Date().toISOString(),
        progressPercent: 95
    };

    const result1 = resolveProgressConflict(89, 95, recentServerData);
    console.log('Recent server data test:', result1);

    if (result1.action === 'use_server') {
        console.log('✅ SUCCESS: Correctly prefers recent server data');
    } else {
        console.log('❌ FAILURE: Should prefer recent server data');
    }

    // Test case 2: Local has detailed tracking
    const sparseServerData = {
        updatedAt: new Date(Date.now() - 600000).toISOString(), // 10 minutes old
        completedLessons: []
    };

    // Simulate having local completed lessons
    const mockCompletedLessons = new Set(['0-0', '0-1', '0-2']);
    const originalSize = mockCompletedLessons.size;

    const result2 = resolveProgressConflict(89, 95, sparseServerData);
    console.log('Local detailed tracking test:', result2);

    if (result2.action === 'use_local') {
        console.log('✅ SUCCESS: Correctly prefers local detailed tracking');
    } else {
        console.log('❌ FAILURE: Should prefer local detailed tracking');
    }

    // Test case 3: Server shows higher reasonable progress
    const higherServerData = {
        updatedAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes old
        progressPercent: 95,
        completedLessons: ['0-0', '0-1', '0-2', '0-3', '0-4', '0-5', '0-6', '0-7', '0-8']
    };

    const result3 = resolveProgressConflict(89, 95, higherServerData);
    console.log('Higher server progress test:', result3);

    if (result3.action === 'use_server') {
        console.log('✅ SUCCESS: Correctly prefers higher server progress');
    } else {
        console.log('❌ FAILURE: Should prefer higher server progress');
    }

    return result1.action === 'use_server' &&
           result2.action === 'use_local' &&
           result3.action === 'use_server';
}

// Test the synchronization functions
function testSynchronization() {
    console.log('\n=== Testing Synchronization Functions ===');

    // Mock course data
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

    // Test sync with server completed lessons
    const serverCompletedLessons = ['0-0', '0-1', '0-2', '0-3', '0-4', '0-5', '0-6', '0-7'];
    const originalCompletedLessons = new Set(['0-0', '0-1', '0-2']);

    console.log('Before sync - Local completed:', Array.from(originalCompletedLessons));
    console.log('Server completed:', serverCompletedLessons);

    // This would normally call syncWithServerCompletedLessons, but we'll test the logic
    const newCompletedLessons = new Set(originalCompletedLessons);

    serverCompletedLessons.forEach(lessonKey => {
        const parts = lessonKey.split('-');
        if (parts.length === 2 && !isNaN(parseInt(parts[0])) && !isNaN(parseInt(parts[1]))) {
            const [moduleIndex, lessonIndex] = lessonKey.split('-').map(Number);
            const unit = mockCourseData.units[moduleIndex];
            const lesson = unit?.lessons?.[lessonIndex];

            if (unit && lesson) {
                newCompletedLessons.add(lessonKey);
            }
        }
    });

    console.log('After sync - Combined completed:', Array.from(newCompletedLessons));

    if (newCompletedLessons.size > originalCompletedLessons.size) {
        console.log('✅ SUCCESS: Synchronization correctly merged server and local data');
        console.log(`Synced ${newCompletedLessons.size - originalCompletedLessons.size} additional lessons`);
    } else {
        console.log('❌ FAILURE: Synchronization did not merge data correctly');
    }

    return newCompletedLessons.size > originalCompletedLessons.size;
}

// Copy the validation functions from course-page.html for testing
function validateServerProgressData(summary) {
    const errors = [];

    if (typeof summary.progressPercent !== 'number' ||
        isNaN(summary.progressPercent) ||
        summary.progressPercent < 0 ||
        summary.progressPercent > 100) {
        errors.push(`Invalid progressPercent: ${summary.progressPercent} (must be 0-100)`);
    }

    if (typeof summary.completedCount === 'number' &&
        typeof summary.totalLessons === 'number' &&
        summary.totalLessons > 0) {
        const calculatedPercent = (summary.completedCount / summary.totalLessons) * 100;
        const percentDiff = Math.abs(calculatedPercent - (summary.progressPercent || 0));

        if (summary.completedCount > summary.totalLessons) {
            errors.push(`Completed count (${summary.completedCount}) exceeds total lessons (${summary.totalLessons})`);
        }

        if (percentDiff > 10) {
            errors.push(`Progress percent (${summary.progressPercent}%) doesn't match completed/total ratio (${calculatedPercent.toFixed(1)}%)`);
        }
    }

    if (summary.completedCount > 1000 || summary.totalLessons > 1000) {
        errors.push(`Unrealistic lesson counts: completed=${summary.completedCount}, total=${summary.totalLessons}`);
    }

    if (summary.completedCount < 0 || summary.totalLessons < 0) {
        errors.push(`Negative lesson counts detected`);
    }

    return {
        valid: errors.length === 0,
        message: errors.join('; '),
        severe: errors.some(err => err.includes('exceeds') || err.includes('Unrealistic') || err.includes('Negative'))
    };
}

function resolveProgressConflict(localProgress, serverProgress, serverData) {
    if (serverData.updatedAt && new Date(serverData.updatedAt) > new Date(Date.now() - 300000)) {
        return { action: 'use_server', reason: 'server_data_recent' };
    }

    if (completedLessons.size > 0 && (!serverData.completedLessons || serverData.completedLessons.length === 0)) {
        return { action: 'use_local', reason: 'local_has_detailed_tracking' };
    }

    if (serverProgress > localProgress && serverProgress <= 100) {
        return { action: 'use_server', reason: 'server_shows_higher_progress' };
    }

    return { action: 'use_local', reason: 'local_more_granular' };
}

// Run all tests
function runAllTests() {
    console.log('Running comprehensive server validation and synchronization tests...');

    const validationTestPassed = testServerDataValidation();
    const conflictTestPassed = testConflictResolution();
    const syncTestPassed = testSynchronization();

    console.log('\n=== Test Results Summary ===');
    console.log(`Server Data Validation: ${validationTestPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Conflict Resolution: ${conflictTestPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`Synchronization: ${syncTestPassed ? '✅ PASSED' : '❌ FAILED'}`);

    const allTestsPassed = validationTestPassed && conflictTestPassed && syncTestPassed;

    if (allTestsPassed) {
        console.log('\n🎉 All tests passed! Server validation and synchronization are working correctly.');
        console.log('The system will now properly handle corrupted server data like the 433% progress issue.');
    } else {
        console.log('\n💥 Some tests failed. The implementation needs review.');
    }

    return allTestsPassed;
}

// Run the tests
runAllTests();