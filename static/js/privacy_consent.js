/**
 * privacy_consent.js - Manages user privacy consent for WorkflowAI
 */

// Initialize consent handlers when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    setupConsentHandlers();
    
    // Check for consent on every page load
    if (window.localStorageManager) {
        const consent = window.localStorageManager.getPrivacyConsent();
        
        // Always show consent modal on page load if no consent is given yet
        if (!consent || !consent.applications) {
            console.log("No consent found - showing privacy consent modal");
            // Wait a moment for the page to fully load
            setTimeout(() => {
                const privacyModal = new bootstrap.Modal(document.getElementById('privacyConsentModal'));
                privacyModal.show();
            }, 500);
        }
    }
});

/**
 * Set up consent modal handlers and buttons
 */
function setupConsentHandlers() {
    // Handle the accept button in privacy consent modal
    const acceptButton = document.getElementById('acceptPrivacyConsent');
    if (acceptButton) {
        acceptButton.addEventListener('click', function() {
            saveConsentFromModal();
        });
    }
    
    // Update the privacy settings buttons
    const updateConsentBtn = document.getElementById('updateConsentSettings');
    if (updateConsentBtn) {
        updateConsentBtn.addEventListener('click', function() {
            // Just use the modal saving function since we don't have a separate settings page yet
            saveConsentFromModal();
        });
    }
    
    // If tracking is started and no consent exists, show the modal
    const startTrackingBtn = document.getElementById('start-tracking-btn');
    if (startTrackingBtn) {
        startTrackingBtn.addEventListener('click', function(event) {
            // If localStorage exists and no consent provided yet
            if (window.localStorageManager) {
                const hasFullConsent = window.localStorageManager.hasConsent('applications') && 
                                       window.localStorageManager.hasConsent('system_health') && 
                                       window.localStorageManager.hasConsent('device_info');
                
                if (!hasFullConsent) {
                    // Show consent modal
                    const privacyModal = new bootstrap.Modal(document.getElementById('privacyConsentModal'));
                    privacyModal.show();
                    // Prevent the original click handler
                    event.preventDefault();
                    return false;
                } else {
                    // If consent already provided, proceed with tracking
                    startTracking();
                }
            }
        });
    }
}

/**
 * Get consent choices from modal and save to localStorage
 */
function saveConsentFromModal() {
    // Get consent choices from modal
    const consent = {
        applications: document.getElementById('consentApplications').checked,
        window_titles: document.getElementById('consentWindowTitles').checked,
        system_health: document.getElementById('consentSystemHealth').checked,
        device_info: document.getElementById('consentDeviceInfo').checked,
        consent_date: new Date().toISOString(),
        consent_version: "1.0"
    };
    
    // Store consent in localStorage
    if (window.localStorageManager) {
        window.localStorageManager.setPrivacyConsent(consent);
        
        // Hide modal
        const privacyModal = bootstrap.Modal.getInstance(document.getElementById('privacyConsentModal'));
        if (privacyModal) {
            privacyModal.hide();
        }
        
        // Trigger the start tracking function
        startTrackingWithConsent();
    }
}

/**
 * Start tracking after consent is provided
 */
function startTrackingWithConsent() {
    // Get the start tracking button and simulate a click
    const startTrackingBtn = document.getElementById('start-tracking-btn');
    if (startTrackingBtn && typeof startTracking === 'function') {
        startTracking();
    }
}

/**
 * Check if user has provided consent for all tracking types
 * @returns {boolean} True if all consents are granted
 */
function hasFullConsent() {
    if (!window.localStorageManager) return false;
    
    const consent = window.localStorageManager.getPrivacyConsent();
    if (!consent) return false;
    
    return consent.applications === true &&
           consent.window_titles === true &&
           consent.system_health === true &&
           consent.device_info === true;
}

/**
 * Check if user has provided consent for a specific tracking type
 * @param {string} consentType - The type of consent to check
 * @returns {boolean} True if consent is granted
 */
function hasConsent(consentType) {
    if (!window.localStorageManager) return false;
    return window.localStorageManager.hasConsent(consentType);
}