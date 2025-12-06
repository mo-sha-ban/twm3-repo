// Counter admin configuration management

// Function to format number with English (Latin) numerals and commas
function formatNumber(number) {
    return new Intl.NumberFormat('en-US').format(number);
}

// Function to calculate current count based on configuration
function calculateCurrentCount(config) {
    const now = Date.now();
    const start = Number(config.startDate) || new Date(config.startDate).getTime();
    const secondsSinceStart = Math.max(0, (now - start) / 1000);
    const perSecond = (Number(config.dailyIncrement) || 0) / 86400;
    const total = Number(config.baseCount || 0) + (secondsSinceStart * perSecond);
    return Math.floor(total);
}

// Update counter preview
let _previewInterval = null;
function updatePreview() {
    const baseCount = parseInt(document.getElementById('baseCount').value) || 0;
    const dailyIncrement = parseInt(document.getElementById('dailyIncrement').value) || 0;
    const startDate = document.getElementById('startDate').value;
    if (!startDate) return;

    const cfg = {
        baseCount,
        dailyIncrement,
        startDate: new Date(startDate).getTime()
    };

    // immediate update
    document.getElementById('counterPreview').textContent = formatNumber(calculateCurrentCount(cfg)) + '+';

    // ensure a live per-second preview updates while the page is open
    if (!_previewInterval) {
        _previewInterval = setInterval(() => {
            document.getElementById('counterPreview').textContent = formatNumber(calculateCurrentCount(cfg)) + '+';
        }, 1000);
    }
}

// Load current configuration
async function loadCurrentConfig() {
    try {
        const response = await fetch('/api/counter-config');
        if (response.ok) {
            const config = await response.json();
            
            document.getElementById('baseCount').value = config.baseCount;
            document.getElementById('dailyIncrement').value = config.dailyIncrement;
            
            // Convert timestamp to YYYY-MM-DD format for date input
            const startDate = new Date(config.startDate);
            const formattedDate = startDate.toISOString().split('T')[0];
            document.getElementById('startDate').value = formattedDate;
            
            updatePreview();
        }
    } catch (error) {
        console.error('Failed to load counter configuration:', error);
        alert('حدث خطأ أثناء تحميل الإعدادات');
    }
}

// Save configuration changes
async function saveConfig(event) {
    event.preventDefault();
    
    const baseCount = parseInt(document.getElementById('baseCount').value);
    const dailyIncrement = parseInt(document.getElementById('dailyIncrement').value);
    const startDate = new Date(document.getElementById('startDate').value).getTime();
    
    try {
        const response = await fetch('/api/counter-config', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                baseCount,
                dailyIncrement,
                startDate
            })
        });
        
        if (response.ok) {
            alert('تم حفظ الإعدادات بنجاح');
        } else {
            const data = await response.json();
            throw new Error(data.error || 'Failed to save configuration');
        }
    } catch (error) {
        console.error('Failed to save counter configuration:', error);
        alert('حدث خطأ أثناء حفظ الإعدادات');
    }
}

// Initialize the admin interface
document.addEventListener('DOMContentLoaded', () => {
    loadCurrentConfig();
    
    // Update preview when inputs change
    document.getElementById('baseCount').addEventListener('input', updatePreview);
    document.getElementById('dailyIncrement').addEventListener('input', updatePreview);
    document.getElementById('startDate').addEventListener('change', updatePreview);
    
    // Handle form submission
    document.getElementById('counterConfigForm').addEventListener('submit', saveConfig);
});