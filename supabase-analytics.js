// Supabase Analytics Tracking for Taiyaki Quiz
// This script tracks user interactions and sends them to Supabase

class TaiyakiAnalytics {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.events = [];
        this.batchSize = 10;
        this.flushInterval = 5000; // 5 seconds
        
        this.init();
    }
    
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    init() {
        // Track page load
        this.track('page_load', {
            url: window.location.href,
            referrer: document.referrer,
            user_agent: navigator.userAgent,
            timestamp: new Date().toISOString()
        });
        
        // Set up auto-flush
        setInterval(() => this.flush(), this.flushInterval);
        
        // Flush on page unload
        window.addEventListener('beforeunload', () => this.flush());
        
        // Track quiz interactions
        this.setupQuizTracking();
    }
    
    setupQuizTracking() {
        // Track button clicks
        document.addEventListener('click', (event) => {
            const target = event.target;
            
            // Track quiz option selections
            if (target.classList.contains('option')) {
                this.track('option_selected', {
                    question: this.getCurrentQuestion(),
                    option_value: target.dataset.value || target.textContent.trim(),
                    option_element: target.className
                });
            }
            
            // Track continue button clicks
            if (target.classList.contains('btn-primary')) {
                this.track('continue_clicked', {
                    from_question: this.getCurrentQuestion(),
                    button_text: target.textContent.trim()
                });
            }
            
            // Track restart button clicks
            if (target.classList.contains('btn-regenerate')) {
                this.track('restart_clicked', {
                    at_stage: this.getCurrentQuestion()
                });
            }
        });
        
        // Track form input changes
        document.addEventListener('input', (event) => {
            const target = event.target;
            
            if (target.id === 'dog-name') {
                this.track('dog_name_entered', {
                    has_value: target.value.length > 0,
                    length: target.value.length
                });
            }
            
            if (target.id === 'dog-description') {
                this.track('dog_description_entered', {
                    has_value: target.value.length > 0,
                    length: target.value.length
                });
            }
            
            if (target.id === 'contact-email') {
                this.track('email_entered', {
                    has_value: target.value.length > 0,
                    is_valid: target.checkValidity()
                });
            }
        });
        
        // Track file uploads
        document.addEventListener('change', (event) => {
            const target = event.target;
            
            if (target.id === 'dog-photo') {
                this.track('photo_uploaded', {
                    has_file: target.files.length > 0,
                    file_count: target.files.length,
                    file_size: target.files[0] ? target.files[0].size : 0,
                    file_type: target.files[0] ? target.files[0].type : null
                });
            }
        });
    }
    
    getCurrentQuestion() {
        // Try to determine current question from visible elements
        const visibleQuestion = document.querySelector('.question-container:not([style*="display: none"])');
        if (visibleQuestion) {
            return visibleQuestion.dataset.question || 'unknown';
        }
        
        // Fallback to global variable if available
        if (typeof currentQuestion !== 'undefined') {
            return currentQuestion;
        }
        
        return 'unknown';
    }
    
    track(eventType, eventData = {}) {
        const event = {
            session_id: this.sessionId,
            event_type: eventType,
            event_data: {
                ...eventData,
                page_url: window.location.href,
                timestamp: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
        };
        
        this.events.push(event);
        
        // Auto-flush if batch is full
        if (this.events.length >= this.batchSize) {
            this.flush();
        }
        
        console.log('📊 Analytics tracked:', eventType, eventData);
    }
    
    async flush() {
        if (this.events.length === 0) return;
        
        const eventsToSend = [...this.events];
        this.events = [];
        
        try {
            const response = await fetch('/api/track-analytics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    events: eventsToSend
                })
            });
            
            if (!response.ok) {
                console.warn('Failed to send analytics events:', response.status);
                // Put events back if failed
                this.events.unshift(...eventsToSend);
            }
        } catch (error) {
            console.warn('Error sending analytics events:', error);
            // Put events back if failed
            this.events.unshift(...eventsToSend);
        }
    }
    
    // Public methods for manual tracking
    trackQuizStart() {
        this.track('quiz_started', {
            start_time: new Date().toISOString()
        });
    }
    
    trackQuizComplete(formData) {
        this.track('quiz_completed', {
            completion_time: new Date().toISOString(),
            has_photo: !!formData.dogPhotoData,
            has_dog_name: !!formData.dogName,
            has_description: !!formData.dogDescription,
            material_choice: formData.materials,
            email_provided: !!formData.email
        });
    }
    
    trackDesignGeneration(success, error = null) {
        this.track('design_generation', {
            success: success,
            error_message: error ? error.message : null,
            generation_time: new Date().toISOString()
        });
    }
    
    trackError(errorType, errorMessage, context = {}) {
        this.track('error_occurred', {
            error_type: errorType,
            error_message: errorMessage,
            context: context,
            error_time: new Date().toISOString()
        });
    }
}

// Initialize analytics when DOM is ready
let taiyakiAnalytics;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        taiyakiAnalytics = new TaiyakiAnalytics();
    });
} else {
    taiyakiAnalytics = new TaiyakiAnalytics();
}

// Make analytics available globally
window.TaiyakiAnalytics = TaiyakiAnalytics;
window.taiyakiAnalytics = taiyakiAnalytics; 