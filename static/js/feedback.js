/**
 * feedback.js - Handles suggestion feedback mechanisms for the WorkflowAI application
 */

// Global feedback state - use window to prevent redeclaration errors
window.window.pendingFeedback = window.window.pendingFeedback || null;

/**
 * Provide feedback for a suggestion
 * @param {string} suggestionId - The ID of the suggestion
 * @param {string} feedback - The feedback value ('helpful', 'somewhat_helpful', or 'not_helpful')
 */
function provideFeedback(suggestionId, feedback) {
    console.log(`Providing feedback for suggestion ${suggestionId}: ${feedback}`);
    
    // First, update UI to show the selected feedback
    updateFeedbackUI(suggestionId, feedback);
    
    // Store the feedback in localStorage if available
    if (window.localStorageManager) {
        window.localStorageManager.updateSuggestionFeedback(suggestionId, feedback);
    }
    
    // Send feedback to the server
    sendFeedbackToServer(suggestionId, feedback);
}

/**
 * Update the feedback UI elements
 * @param {string} suggestionId - The ID of the suggestion
 * @param {string} feedback - The feedback value
 */
function updateFeedbackUI(suggestionId, feedback) {
    // Find all feedback buttons for this suggestion
    const suggestionCards = document.querySelectorAll('.suggestion-card');
    
    suggestionCards.forEach(card => {
        const buttons = card.querySelectorAll('.feedback-btn');
        const suggestionIdAttr = card.getAttribute('data-suggestion-id');
        
        // If this card has the matching suggestion ID or doesn't have an ID attribute (use DOM traversal)
        if (!suggestionIdAttr || suggestionIdAttr === suggestionId) {
            buttons.forEach(btn => {
                // Get the feedback type from the onclick attribute or data attribute
                const onclickAttr = btn.getAttribute('onclick');
                if (onclickAttr && onclickAttr.includes(suggestionId)) {
                    // Extract the feedback type from the onclick attribute
                    const feedbackType = onclickAttr.split(',')[1].trim().replace(/['")/]/g, '');
                    
                    // Update button styling based on feedback match
                    if (feedbackType === feedback) {
                        btn.classList.add('active');
                        if (feedbackType === 'helpful') {
                            btn.classList.add('text-success');
                            btn.classList.remove('text-muted');
                        } else if (feedbackType === 'somewhat_helpful') {
                            btn.classList.add('text-warning');
                            btn.classList.remove('text-muted');
                        } else if (feedbackType === 'not_helpful') {
                            btn.classList.add('text-danger');
                            btn.classList.remove('text-muted');
                        }
                    } else {
                        btn.classList.remove('active');
                        btn.classList.add('text-muted');
                        btn.classList.remove('text-success', 'text-warning', 'text-danger');
                    }
                }
            });
        }
    });
}

/**
 * Send feedback to the server
 * @param {string} suggestionId - The ID of the suggestion
 * @param {string} feedback - The feedback value
 */
function sendFeedbackToServer(suggestionId, feedback) {
    // Create form data
    const formData = new FormData();
    formData.append('suggestion_id', suggestionId);
    formData.append('feedback', feedback);
    
    // Send feedback to server
    fetch('/api/suggestion/feedback', {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
    .then(data => {
        console.log('Feedback submitted successfully:', data);
    })
    .catch(error => {
        console.error('Error submitting feedback:', error);
        // Store pending feedback to retry later
        window.pendingFeedback = { suggestionId, feedback };
    });
}

/**
 * Retry sending any pending feedback
 */
function retryPendingFeedback() {
    if (window.pendingFeedback) {
        console.log('Retrying pending feedback submission');
        sendFeedbackToServer(window.pendingFeedback.suggestionId, window.pendingFeedback.feedback);
        window.pendingFeedback = null;
    }
}

// Set up periodic retry of pending feedback
setInterval(retryPendingFeedback, 30000);

// Listen for online status to retry when connection is restored
window.addEventListener('online', retryPendingFeedback);