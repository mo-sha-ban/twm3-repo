// Alert to Toast Converter
// This script replaces all alert() calls with beautiful toast notifications

(function() {
    // Store the original alert function
    const originalAlert = window.alert;
    
    // Override the alert function
    window.alert = function(message) {
        // If toast system is available, use it
        if (window.showToast) {
            // Determine toast type based on message content
            let type = 'info';
            let title = 'تنبيه';
            let icon = 'fas fa-info-circle';
            
            const messageStr = String(message);
            
            // Success indicators
            if (messageStr.includes('نجاح') || 
                messageStr.includes('تم') || 
                messageStr.includes('✅') ||
                messageStr.includes('بنجاح')) {
                type = 'success';
                title = 'نجح';
                icon = 'fas fa-check-circle';
            }
            // Error indicators
            else if (messageStr.includes('خطأ') || 
                     messageStr.includes('فشل') || 
                     messageStr.includes('❌') ||
                     messageStr.includes('Error') ||
                     messageStr.includes('تعذر')) {
                type = 'error';
                title = 'خطأ';
                icon = 'fas fa-times-circle';
            }
            // Warning indicators
            else if (messageStr.includes('تحذير') || 
                     messageStr.includes('⚠️') ||
                     messageStr.includes('يجب') ||
                     messageStr.includes('يرجى')) {
                type = 'warning';
                title = 'تحذير';
                icon = 'fas fa-exclamation-triangle';
            }
            
            window.showToast(messageStr, {
                type: type,
                timeout: 5000,
                title: title,
                icon: icon
            });
        } else {
            // Fallback to original alert if toast not available
            originalAlert.call(window, message);
        }
    };
    
    // Also provide a way to access original alert if needed
    window.originalAlert = originalAlert;
})();