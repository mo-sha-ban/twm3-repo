// API Configuration
const API_CONFIG = {
    // Backend API URL (Vercel deployment)
    API_BASE_URL: 'https://twm3-repo.vercel.app/api',
    
    // Frontend URL (Hostinger)
    FRONTEND_URL: 'https://www.twm3.org',
    
    // Timeout for API requests (in milliseconds)
    TIMEOUT: 30000,
    
    // Retry configuration
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000
};

// Helper function to make API calls
async function apiCall(endpoint, options = {}) {
    const url = `${API_CONFIG.API_BASE_URL}${endpoint}`;
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        credentials: 'include',
        ...options
    };
    
    try {
        const response = await fetch(url, defaultOptions);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { API_CONFIG, apiCall };
}