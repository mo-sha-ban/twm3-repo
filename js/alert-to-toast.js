// Alert to Toast Converter with Confirm Support
// This script replaces all alert() calls with beautiful toast notifications
// and confirm() calls with modern confirm modals

(function() {
    // Store the original alert and confirm functions
    const originalAlert = window.alert;
    const originalConfirm = window.confirm;

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
                timeout: 4000,
                title: title,
                icon: icon
            });
        } else {
            // Fallback to original alert if toast not available
            originalAlert.call(window, message);
        }
    };

    // Override the confirm function
    window.confirm = function(message) {
        // If confirm system is available, use it
        if (window.showConfirm) {
            return window.showConfirm({
                title: 'تأكيد الحذف',
                message: String(message),
                confirmText: 'نعم، احذف',
                cancelText: 'إلغاء'
            });
        } else {
            // Fallback to original confirm if not available
            return originalConfirm.call(window, message);
        }
    };

    // Also provide a way to access original functions if needed
    window.originalAlert = originalAlert;
    window.originalConfirm = originalConfirm;
})();