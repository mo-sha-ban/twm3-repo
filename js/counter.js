// Counter configuration and state management
let counterConfig = {
    baseCount: 50000, // Default base count
    dailyIncrement: 20, // Default daily increment
    startDate: new Date('2024-01-01').getTime() // Starting date for calculations
};

// Function to calculate current count based on seconds elapsed (smooth per-second)
function calculateCurrentCount() {
    const now = Date.now();
    const start = Number(counterConfig.startDate) || counterConfig.startDate;
    const secondsSinceStart = Math.max(0, (now - start) / 1000);
    const perSecond = (Number(counterConfig.dailyIncrement) || 0) / 86400; // daily -> per second
    const total = Number(counterConfig.baseCount || 0) + (secondsSinceStart * perSecond);
    return Math.floor(total);
}

// Function to format number with English (Latin) numerals and commas
function formatNumber(number) {
    return new Intl.NumberFormat('en-US').format(number);
}

// Function to update the counter display
function updateCounterDisplay() {
    const counterElement = document.querySelector('.students .text h1 span');
    if (counterElement) {
        counterElement.textContent = formatNumber(calculateCurrentCount()) + '+';
    }
}

// Load config from server if available
async function loadCounterConfig() {
    try {
        // Use API_CONFIG if available, otherwise fallback to relative path
        const apiUrl = typeof API_CONFIG !== 'undefined' 
            ? `${API_CONFIG.API_BASE_URL}/counter-config`
            : '/api/counter-config';
            
        const response = await fetch(apiUrl);
        if (response.ok) {
            const config = await response.json();
            counterConfig = { ...counterConfig, ...config };
        }
    } catch (error) {
        console.error('Failed to load counter configuration:', error);
        // Continue with default config
    }
}

// Initialize counter
async function initCounter() {
    await loadCounterConfig();
    updateCounterDisplay();
    
    // Update counter every second for a smooth live feel
    setInterval(updateCounterDisplay, 1000);
}

// Start counter when DOM is loaded
document.addEventListener('DOMContentLoaded', initCounter);