/**
 * local_storage.js - Client-side storage manager for the WorkflowAI application
 * Handles persistent storage of all application data in the browser's localStorage
 */

class LocalStorageManager {
    constructor() {
        this.initialized = false;
        this.DB_VERSION = '1.0.0';
        this.STORAGE_KEYS = {
            VERSION: 'workflowai_version',
            USER_ID: 'workflowai_user_id',
            DEVICE_ID: 'workflowai_device_id',
            SESSION_ID: 'workflowai_session_id',
            ACTIVITIES: 'workflowai_activities',
            SUGGESTIONS: 'workflowai_suggestions',
            FEEDBACK: 'workflowai_feedback',
            SETTINGS: 'workflowai_settings',
            SYSTEM_HEALTH: 'workflowai_system_health',
            INSIGHTS: 'workflowai_insights',
            THEME: 'workflowai_theme',
            PRIVACY_CONSENT: 'workflowai_privacy_consent'
        };
        this.initialize();
    }

    /**
     * Initialize the storage system
     */
    initialize() {
        try {
            // Check if localStorage is available
            if (!window.localStorage) {
                console.error('LocalStorage not available in this browser');
                return false;
            }

            // Check if storage is already initialized
            const version = localStorage.getItem(this.STORAGE_KEYS.VERSION);
            
            // Only initialize if not already set up or version changed
            if (!version) {
                // Initialize storage structure
                this._initializeStorage();
            }

            // Mark as initialized
            this.initialized = true;
            console.log('LocalStorage initialized successfully');
            return true;
        } catch (error) {
            console.error('Error initializing LocalStorage:', error);
            return false;
        }
    }

    /**
     * Set up initial storage structure
     */
    _initializeStorage() {
        try {
            // Set version
            localStorage.setItem(this.STORAGE_KEYS.VERSION, this.DB_VERSION);

            // Check if user ID exists before creating a new one
            let userId = localStorage.getItem(this.STORAGE_KEYS.USER_ID);
            if (!userId) {
                userId = this._generateId('user');
                localStorage.setItem(this.STORAGE_KEYS.USER_ID, userId);
            }

            // Check if device ID exists before creating a new one
            let deviceId = localStorage.getItem(this.STORAGE_KEYS.DEVICE_ID);
            if (!deviceId) {
                deviceId = this._generateId('device');
                localStorage.setItem(this.STORAGE_KEYS.DEVICE_ID, deviceId);
            }

            // Always create a new session ID
            const sessionId = this._generateId('session');
            localStorage.setItem(this.STORAGE_KEYS.SESSION_ID, sessionId);
            
            // ALWAYS set privacy consent to true for this demo
            localStorage.setItem(this.STORAGE_KEYS.PRIVACY_CONSENT, JSON.stringify({
                consent_date: new Date().toISOString(),
                consent_version: "1.0",
                applications: true,
                window_titles: true,
                system_health: true,
                device_info: true
            }));
            
            // Initialize empty collections if they don't exist
            const activities = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.ACTIVITIES) || '[]');
            if (activities.length === 0) {
                // Initialize with empty activities array
                localStorage.setItem(this.STORAGE_KEYS.ACTIVITIES, JSON.stringify([]));
                console.log("Initialized empty activities collection");
            }
            
            const suggestions = JSON.parse(localStorage.getItem(this.STORAGE_KEYS.SUGGESTIONS) || '[]');
            if (suggestions.length === 0) {
                // Initialize with empty suggestions array
                localStorage.setItem(this.STORAGE_KEYS.SUGGESTIONS, JSON.stringify([]));
                console.log("Initialized empty suggestions collection");
            }
            
            if (!localStorage.getItem(this.STORAGE_KEYS.FEEDBACK)) {
                localStorage.setItem(this.STORAGE_KEYS.FEEDBACK, JSON.stringify({}));
            }
            
            if (!localStorage.getItem(this.STORAGE_KEYS.INSIGHTS)) {
                localStorage.setItem(this.STORAGE_KEYS.INSIGHTS, JSON.stringify({}));
            }
            
            console.log("Storage initialized with empty collections - ready for actual user data");
        } catch (error) {
            console.error("Error in _initializeStorage:", error);
            
            // If any error occurs, reset to a fresh state with empty data collections
            localStorage.clear();
            localStorage.setItem(this.STORAGE_KEYS.VERSION, this.DB_VERSION);
            localStorage.setItem(this.STORAGE_KEYS.USER_ID, this._generateId('user'));
            localStorage.setItem(this.STORAGE_KEYS.DEVICE_ID, this._generateId('device'));
            localStorage.setItem(this.STORAGE_KEYS.SESSION_ID, this._generateId('session'));
            
            // Don't automatically set privacy consent - it should be explicitly given
            // Initialize with empty data collections
            localStorage.setItem(this.STORAGE_KEYS.ACTIVITIES, JSON.stringify([]));
            localStorage.setItem(this.STORAGE_KEYS.SUGGESTIONS, JSON.stringify([]));
            localStorage.setItem(this.STORAGE_KEYS.FEEDBACK, JSON.stringify({}));
            localStorage.setItem(this.STORAGE_KEYS.INSIGHTS, JSON.stringify({}));
            console.log("Storage reset with empty collections due to initialization error");
        }

        // Initialize default settings
        const defaultSettings = {
            track_applications: true,
            track_files: true,
            track_browsing: true,
            track_idle_time: true,
            track_keyboard: false,
            track_mouse: false,
            learning_enabled: true,
            privacy_level: 'standard',
            work_hours_start: '09:00',
            work_hours_end: '17:00',
            work_days: [0, 1, 2, 3, 4], // Monday to Friday
            excluded_apps: [],
            excluded_websites: [],
            excluded_directories: [],
            theme: 'dark'
        };
        localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));

        // Initialize empty system health data - will be populated with real data when tracking begins
        localStorage.setItem(this.STORAGE_KEYS.SYSTEM_HEALTH, JSON.stringify({
            cpu_usage: 0,
            memory_usage: 0,
            disk_usage: 0,
            network_in: 0,
            network_out: 0,
            processes_count: 0,
            battery_level: 100,
            battery_charging: false,
            temperature: 0,
            uptime: 0,
            sample_data: false,
            last_updated: new Date().toISOString()
        }));

        // Initialize theme
        localStorage.setItem(this.STORAGE_KEYS.THEME, 'dark');
    }
    
    /**
     * Generate sample activities for demonstration
     * @private
     */
    _generateSampleActivities() {
        const applications = [
            'VS Code', 'Chrome', 'Firefox', 'Terminal', 
            'Slack', 'Zoom', 'Microsoft Word', 'Excel', 
            'PowerPoint', 'Photoshop', 'Illustrator'
        ];
        
        const windowTitles = {
            'VS Code': [
                'index.js - Project', 'main.py - AI Assistant', 'style.css - Portfolio',
                'README.md - Documentation', 'app.js - E-commerce'
            ],
            'Chrome': [
                'Google - Web Search', 'YouTube - Home', 'GitHub - Pull Requests',
                'Stack Overflow - Questions', 'MDN Web Docs - JavaScript'
            ],
            'Firefox': [
                'Twitter - Home', 'Reddit - r/programming', 'LinkedIn - Messages',
                'Medium - Tech Articles', 'Dev.to - Latest Posts'
            ],
            'Terminal': [
                'bash - user@localhost', 'npm install', 'git pull origin main',
                'docker ps', 'python manage.py runserver'
            ],
            'Slack': [
                'dev-team - Workspace', 'general - Channel', 'project-ai - Thread',
                'Direct Message - John', 'Huddle in #team-standup'
            ],
            'Zoom': [
                'Team Meeting', 'Client Presentation', 'Weekly Standup',
                'Interview - Developer Position', 'Webinar - AI Ethics'
            ],
            'Microsoft Word': [
                'Project Proposal.docx', 'Meeting Notes.docx', 'Documentation.docx',
                'Resume.docx', 'Cover Letter.docx'
            ],
            'Excel': [
                'Budget 2025.xlsx', 'Data Analysis.xlsx', 'Project Timeline.xlsx',
                'Inventory.xlsx', 'Sales Report.xlsx'
            ],
            'PowerPoint': [
                'Company Presentation.pptx', 'Product Launch.pptx', 'Quarterly Report.pptx',
                'Training Materials.pptx', 'Conference Talk.pptx'
            ],
            'Photoshop': [
                'Banner Design.psd', 'Logo Mockup.psd', 'Website Mockup.psd',
                'Photo Editing.psd', 'Social Media Graphics.psd'
            ],
            'Illustrator': [
                'Vector Logo.ai', 'Infographic.ai', 'Icon Set.ai',
                'Brochure Design.ai', 'Business Card.ai'
            ]
        };
        
        // Generate activities for the past week
        const activities = [];
        const now = new Date();
        
        // Create 50 sample activities
        for (let i = 0; i < 50; i++) {
            // Random time within the past week
            const timestamp = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000);
            
            // Random application
            const appName = applications[Math.floor(Math.random() * applications.length)];
            
            // Random window title for the selected application
            const titles = windowTitles[appName] || ['Unknown Window'];
            const windowTitle = titles[Math.floor(Math.random() * titles.length)];
            
            // Random duration between 1 minute and 2 hours (in seconds)
            const duration = Math.floor(Math.random() * (7200 - 60) + 60);
            
            activities.push({
                id: this._generateId('activity'),
                application_name: appName,
                window_title: windowTitle,
                duration: duration,
                timestamp: timestamp.toISOString(),
                type: 'application',
                productivity_score: Math.random() * 100
            });
        }
        
        // Sort by timestamp (newest first)
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return activities;
    }
    
    /**
     * Generate sample suggestions for demonstration
     * @private
     */
    _generateSampleSuggestions() {
        const suggestionTemplates = [
            {
                text: 'You spend a lot of time in meetings. Consider blocking focus time on your calendar.',
                category: 'time_management',
                source: 'time_analysis'
            },
            {
                text: 'Your most productive hours appear to be 9-11 AM. Schedule important tasks during this time.',
                category: 'productivity',
                source: 'activity_pattern'
            },
            {
                text: 'You switch between VS Code and browser frequently. Consider using a split-screen setup.',
                category: 'workflow',
                source: 'context_switching'
            },
            {
                text: 'You often work late hours. Set a reminder to take breaks for better work-life balance.',
                category: 'wellbeing',
                source: 'work_hours'
            },
            {
                text: 'Your system memory usage is consistently high. Consider closing unused applications.',
                category: 'system',
                source: 'system_health'
            },
            {
                text: 'You use keyboard shortcuts infrequently. Learning shortcuts for your most-used apps could save time.',
                category: 'efficiency',
                source: 'input_analysis'
            },
            {
                text: 'Consider organizing your project files into dedicated folders for better structure.',
                category: 'organization',
                source: 'file_access'
            },
            {
                text: 'Your browser has many open tabs. Try using bookmarks or tab organizers for better focus.',
                category: 'focus',
                source: 'browser_usage'
            }
        ];
        
        // Generate suggestions
        const suggestions = [];
        const now = new Date();
        
        // Create instances of each suggestion template
        suggestionTemplates.forEach((template, index) => {
            // Random timestamp within past 2 days
            const timestamp = new Date(now.getTime() - Math.random() * 2 * 24 * 60 * 60 * 1000);
            
            suggestions.push({
                id: this._generateId('suggestion'),
                text: template.text,
                category: template.category,
                source: template.source,
                confidence: 0.7 + (Math.random() * 0.3), // Between 0.7 and 1.0
                timestamp: timestamp.toISOString(),
                status: Math.random() > 0.7 ? 'implemented' : 'pending',
                feedback: Math.random() > 0.7 ? (Math.random() > 0.5 ? 'helpful' : 'not_helpful') : null
            });
        });
        
        // Sort by timestamp (newest first)
        suggestions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        return suggestions;
    }

    /**
     * Generate a unique ID
     */
    _generateId(prefix = '') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Migrate data between versions (for future use)
     */
    _migrateData(oldVersion, newVersion) {
        console.log(`Migrating data from ${oldVersion} to ${newVersion}`);
        // Migration logic will be implemented as needed
        localStorage.setItem(this.STORAGE_KEYS.VERSION, newVersion);
    }

    /**
     * Reset a new session ID
     */
    resetSession() {
        const sessionId = this._generateId('session');
        localStorage.setItem(this.STORAGE_KEYS.SESSION_ID, sessionId);
        return sessionId;
    }

    /**
     * Get the user ID
     */
    getUserId() {
        return localStorage.getItem(this.STORAGE_KEYS.USER_ID);
    }

    /**
     * Get the device ID
     */
    getDeviceId() {
        return localStorage.getItem(this.STORAGE_KEYS.DEVICE_ID);
    }

    /**
     * Get the session ID
     */
    getSessionId() {
        return localStorage.getItem(this.STORAGE_KEYS.SESSION_ID);
    }

    /**
     * Get all activities
     */
    getActivities() {
        try {
            // Check if user has given consent for activity tracking
            // If we have activities but no consent yet, still return them (they'll be filtered when displayed)
            const activitiesJson = localStorage.getItem(this.STORAGE_KEYS.ACTIVITIES);
            const activities = activitiesJson ? JSON.parse(activitiesJson) : [];
            
            if (!this.hasConsent('applications') && activities.length > 0) {
                console.warn('No consent for application tracking - returning activities but they may be filtered in UI');
            }
            
            return activities;
        } catch (error) {
            console.error('Error getting activities:', error);
            return [];
        }
    }

    /**
     * Add a new activity
     */
    addActivity(activity) {
        try {
            // Check for consent based on activity type
            if (activity.activity_type === 'app_usage' && !this.hasConsent('applications')) {
                console.warn('Cannot track application usage without consent');
                return null;
            }
            
            if (activity.window_title && !this.hasConsent('window_titles')) {
                // Still track but remove the window title
                activity.window_title = '[Window title hidden due to privacy settings]';
            }
            
            if (!activity.id) {
                activity.id = this._generateId('activity');
            }
            if (!activity.timestamp) {
                activity.timestamp = new Date().toISOString();
            }

            const activities = this.getActivities();
            activities.push(activity);

            // Limit the number of stored activities (keep the most recent 1000)
            if (activities.length > 1000) {
                activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                activities.splice(1000);
            }

            localStorage.setItem(this.STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
            return activity.id;
        } catch (error) {
            console.error('Error adding activity:', error);
            return null;
        }
    }

    /**
     * Update an existing activity
     */
    updateActivity(activityId, updatedData) {
        try {
            const activities = this.getActivities();
            const index = activities.findIndex(activity => activity.id === activityId);

            if (index !== -1) {
                // Merge the updated data with the existing activity
                activities[index] = { ...activities[index], ...updatedData };
                localStorage.setItem(this.STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating activity:', error);
            return false;
        }
    }

    /**
     * Delete an activity
     */
    deleteActivity(activityId) {
        try {
            const activities = this.getActivities();
            const filteredActivities = activities.filter(activity => activity.id !== activityId);

            if (filteredActivities.length !== activities.length) {
                localStorage.setItem(this.STORAGE_KEYS.ACTIVITIES, JSON.stringify(filteredActivities));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deleting activity:', error);
            return false;
        }
    }

    /**
     * Get all suggestions
     */
    getSuggestions() {
        try {
            const suggestionsJson = localStorage.getItem(this.STORAGE_KEYS.SUGGESTIONS);
            return suggestionsJson ? JSON.parse(suggestionsJson) : [];
        } catch (error) {
            console.error('Error getting suggestions:', error);
            return [];
        }
    }

    /**
     * Add a new suggestion
     */
    addSuggestion(suggestion) {
        try {
            if (!suggestion.id) {
                suggestion.id = this._generateId('suggestion');
            }
            if (!suggestion.timestamp) {
                suggestion.timestamp = new Date().toISOString();
            }

            const suggestions = this.getSuggestions();
            suggestions.push(suggestion);

            // Limit the number of stored suggestions (keep the most recent 100)
            if (suggestions.length > 100) {
                suggestions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                suggestions.splice(100);
            }

            localStorage.setItem(this.STORAGE_KEYS.SUGGESTIONS, JSON.stringify(suggestions));
            return suggestion.id;
        } catch (error) {
            console.error('Error adding suggestion:', error);
            return null;
        }
    }

    /**
     * Update suggestion feedback
     */
    updateSuggestionFeedback(suggestionId, feedback) {
        try {
            // Get existing feedback
            const feedbackJson = localStorage.getItem(this.STORAGE_KEYS.FEEDBACK);
            const feedbackData = feedbackJson ? JSON.parse(feedbackJson) : {};

            // Add or update feedback for this suggestion
            feedbackData[suggestionId] = {
                feedback,
                timestamp: new Date().toISOString()
            };

            // Save updated feedback
            localStorage.setItem(this.STORAGE_KEYS.FEEDBACK, JSON.stringify(feedbackData));

            // Also update the suggestion if it exists
            const suggestions = this.getSuggestions();
            const index = suggestions.findIndex(suggestion => suggestion.id === suggestionId);

            if (index !== -1) {
                suggestions[index].feedback = feedback;
                localStorage.setItem(this.STORAGE_KEYS.SUGGESTIONS, JSON.stringify(suggestions));
            }

            return true;
        } catch (error) {
            console.error('Error updating suggestion feedback:', error);
            return false;
        }
    }

    /**
     * Get feedback for a suggestion
     */
    getSuggestionFeedback(suggestionId) {
        try {
            const feedbackJson = localStorage.getItem(this.STORAGE_KEYS.FEEDBACK);
            const feedbackData = feedbackJson ? JSON.parse(feedbackJson) : {};

            return feedbackData[suggestionId] || null;
        } catch (error) {
            console.error('Error getting suggestion feedback:', error);
            return null;
        }
    }

    /**
     * Get all feedback
     */
    getAllFeedback() {
        try {
            const feedbackJson = localStorage.getItem(this.STORAGE_KEYS.FEEDBACK);
            return feedbackJson ? JSON.parse(feedbackJson) : {};
        } catch (error) {
            console.error('Error getting all feedback:', error);
            return {};
        }
    }
    
    /**
     * Get active session
     * @returns {Object|null} Active session or null if none active
     */
    getActiveSession() {
        try {
            const sessionId = this.getSessionId();
            if (!sessionId) return null;
            
            // Check if tracking has user consent
            if (!this.hasConsent('applications')) {
                return {
                    id: sessionId,
                    requires_consent: true,
                    is_active: false
                };
            }
            
            // Return basic session data (no fake values)
            return {
                id: sessionId,
                start_time: new Date().toISOString(), // Current time as session start
                device_id: this.getDeviceId(),
                user_id: this.getUserId(),
                is_active: true,
                context: 'Unknown', // Will be populated by actual tracking
                productivity_score: null // Will be calculated from real data
            };
        } catch (error) {
            console.error('Error getting active session:', error);
            return null;
        }
    }
    
    /**
     * Start a new session
     * @param {string} context The context of the session (work, personal, etc.)
     * @returns {string} Session ID
     */
    startSession(context = 'general') {
        try {
            const sessionId = this._generateId('session');
            localStorage.setItem(this.STORAGE_KEYS.SESSION_ID, sessionId);
            console.log(`Started new session: ${sessionId} with context: ${context}`);
            return sessionId;
        } catch (error) {
            console.error('Error starting session:', error);
            return null;
        }
    }
    
    /**
     * End the current session
     * @param {number} productivityScore Optional productivity score for the session
     * @returns {boolean} Success/failure
     */
    endSession(productivityScore = null) {
        try {
            console.log(`Ended session with productivity score: ${productivityScore}`);
            return true;
        } catch (error) {
            console.error('Error ending session:', error);
            return false;
        }
    }
    
    /**
     * Update device tracking status
     * @param {boolean} isTracking Whether tracking is enabled
     * @returns {boolean} Success/failure
     */
    updateDeviceTrackingStatus(isTracking) {
        try {
            console.log(`Updated device tracking status: ${isTracking ? 'enabled' : 'disabled'}`);
            return true;
        } catch (error) {
            console.error('Error updating device tracking status:', error);
            return false;
        }
    }
    
    /**
     * Get current device information
     * @returns {Object} Device information
     */
    getCurrentDevice() {
        try {
            const deviceId = this.getDeviceId();
            
            // Check if user has given consent for device info tracking
            if (!this.hasConsent('device_info')) {
                return {
                    id: deviceId,
                    name: 'This Device', // Basic info even without consent
                    device_type: 'browser',
                    os: 'Browser Session',
                    requires_consent: true,
                    is_tracking_enabled: false,
                    last_active: new Date().toISOString()
                };
            }
            
            // Return actual device info when consent is given
            return {
                id: deviceId,
                name: 'This Device',
                device_type: 'browser',
                os: navigator.platform || 'Browser',
                os_version: navigator.userAgent ? navigator.userAgent.split(' ').pop() : '',
                browser: navigator.userAgent ? navigator.userAgent.split(' ')[0] : 'Web Browser',
                is_tracking_enabled: this.hasConsent('applications'),
                last_active: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error getting current device:', error);
            return null;
        }
    }

    /**
     * Update system health data
     */
    updateSystemHealth(healthData) {
        try {
            // Check if user has consented to system health tracking
            if (!this.hasConsent('system_health')) {
                console.warn('Cannot update system health data without consent');
                return false;
            }
            
            // Merge with existing data or create new
            const existingDataJson = localStorage.getItem(this.STORAGE_KEYS.SYSTEM_HEALTH);
            const existingData = existingDataJson ? JSON.parse(existingDataJson) : {};

            const updatedData = { ...existingData, ...healthData, last_updated: new Date().toISOString() };
            localStorage.setItem(this.STORAGE_KEYS.SYSTEM_HEALTH, JSON.stringify(updatedData));
            return true;
        } catch (error) {
            console.error('Error updating system health:', error);
            return false;
        }
    }

    /**
     * Get system health data
     */
    getSystemHealth() {
        try {
            const healthDataJson = localStorage.getItem(this.STORAGE_KEYS.SYSTEM_HEALTH);
            const healthData = healthDataJson ? JSON.parse(healthDataJson) : null;
            
            // For testing, we always provide health data even if consent is missing
            // by using sample values. In a real app, we'd require consent
            if (!this.hasConsent('system_health') || !healthData || !healthData.cpu_usage) {
                // Generate sample system health data for display (just for testing)
                return {
                    cpu_usage: 35 + Math.random() * 15,
                    memory_usage: 60 + Math.random() * 10,
                    disk_usage: 50 + Math.random() * 20,
                    network_in: 1024 * Math.random() * 100,
                    network_out: 512 * Math.random() * 100,
                    processes_count: 30 + Math.floor(Math.random() * 20),
                    battery_level: 70 + Math.random() * 30,
                    battery_charging: Math.random() > 0.5,
                    temperature: 40 + Math.random() * 10,
                    uptime: 3600 * Math.random() * 24,
                    last_updated: new Date().toISOString(),
                    sample_data: true // Flag indicating this is sample data
                };
            }
            
            return healthData;
        } catch (error) {
            console.error('Error getting system health:', error);
            return null;
        }
    }

    /**
     * Update user settings
     */
    updateSettings(settings) {
        try {
            // Merge with existing settings
            const existingSettingsJson = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
            const existingSettings = existingSettingsJson ? JSON.parse(existingSettingsJson) : {};

            const updatedSettings = { ...existingSettings, ...settings };
            localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(updatedSettings));

            // Also update theme separately for easy access
            if (settings.theme) {
                localStorage.setItem(this.STORAGE_KEYS.THEME, settings.theme);
            }

            return true;
        } catch (error) {
            console.error('Error updating settings:', error);
            return false;
        }
    }

    /**
     * Get user settings
     */
    getSettings() {
        try {
            const settingsJson = localStorage.getItem(this.STORAGE_KEYS.SETTINGS);
            return settingsJson ? JSON.parse(settingsJson) : {};
        } catch (error) {
            console.error('Error getting settings:', error);
            return {};
        }
    }

    /**
     * Update theme preference
     */
    updateTheme(theme) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.THEME, theme);

            // Also update in settings
            const settings = this.getSettings();
            settings.theme = theme;
            localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(settings));

            return true;
        } catch (error) {
            console.error('Error updating theme:', error);
            return false;
        }
    }

    /**
     * Get theme preference
     */
    getTheme() {
        try {
            return localStorage.getItem(this.STORAGE_KEYS.THEME) || 'dark';
        } catch (error) {
            console.error('Error getting theme:', error);
            return 'dark';
        }
    }
    
    /**
     * Set privacy consent preferences
     * @param {Object} consentData - The consent preferences
     * @returns {boolean} Success/failure
     */
    setPrivacyConsent(consentData) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.PRIVACY_CONSENT, JSON.stringify(consentData));
            return true;
        } catch (error) {
            console.error('Error setting privacy consent:', error);
            return false;
        }
    }
    
    /**
     * Get privacy consent preferences
     * @returns {Object|null} The consent preferences or null if not set
     */
    getPrivacyConsent() {
        try {
            const consentJson = localStorage.getItem(this.STORAGE_KEYS.PRIVACY_CONSENT);
            return consentJson ? JSON.parse(consentJson) : null;
        } catch (error) {
            console.error('Error getting privacy consent:', error);
            return null;
        }
    }
    
    /**
     * Check if a specific consent is granted
     * @param {string} consentType - The type of consent to check ('applications', 'window_titles', etc.)
     * @returns {boolean} Whether consent is granted
     */
    hasConsent(consentType) {
        try {
            const consent = this.getPrivacyConsent();
            // If no consent info is found, assume no consent
            if (!consent) return false;
            // Return the specific consent or false if not found
            return consent[consentType] === true;
        } catch (error) {
            console.error(`Error checking consent for ${consentType}:`, error);
            return false;
        }
    }

    /**
     * Get recent suggestions
     */
    getRecentSuggestions(limit = 5) {
        try {
            const suggestions = this.getSuggestions();
            // Sort by timestamp (newest first)
            suggestions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            return suggestions.slice(0, limit);
        } catch (error) {
            console.error('Error getting recent suggestions:', error);
            return [];
        }
    }

    /**
     * Save insight data
     */
    saveInsight(insightType, insightData) {
        try {
            const insightsJson = localStorage.getItem(this.STORAGE_KEYS.INSIGHTS);
            const insights = insightsJson ? JSON.parse(insightsJson) : {};

            // Create or update the insight
            insights[insightType] = {
                ...insightData,
                updated_at: new Date().toISOString()
            };

            localStorage.setItem(this.STORAGE_KEYS.INSIGHTS, JSON.stringify(insights));
            return true;
        } catch (error) {
            console.error('Error saving insight:', error);
            return false;
        }
    }

    /**
     * Get all insights or a specific type
     */
    getInsights(insightType = null) {
        try {
            const insightsJson = localStorage.getItem(this.STORAGE_KEYS.INSIGHTS);
            const insights = insightsJson ? JSON.parse(insightsJson) : {};

            if (insightType) {
                return insights[insightType] || null;
            }
            return insights;
        } catch (error) {
            console.error('Error getting insights:', error);
            return insightType ? null : {};
        }
    }

    /**
     * Clear all data from storage
     */
    clearAllData() {
        try {
            // Preserve user, device, and session IDs
            const userId = this.getUserId();
            const deviceId = this.getDeviceId();
            const sessionId = this.getSessionId();
            const theme = this.getTheme();

            // Clear all data
            localStorage.clear();

            // Restore IDs
            localStorage.setItem(this.STORAGE_KEYS.USER_ID, userId);
            localStorage.setItem(this.STORAGE_KEYS.DEVICE_ID, deviceId);
            localStorage.setItem(this.STORAGE_KEYS.SESSION_ID, sessionId);
            localStorage.setItem(this.STORAGE_KEYS.VERSION, this.DB_VERSION);
            localStorage.setItem(this.STORAGE_KEYS.THEME, theme);

            // Re-initialize empty collections
            localStorage.setItem(this.STORAGE_KEYS.ACTIVITIES, JSON.stringify([]));
            localStorage.setItem(this.STORAGE_KEYS.SUGGESTIONS, JSON.stringify([]));
            localStorage.setItem(this.STORAGE_KEYS.FEEDBACK, JSON.stringify({}));
            localStorage.setItem(this.STORAGE_KEYS.INSIGHTS, JSON.stringify({}));

            // Re-initialize default settings but maintain theme
            const defaultSettings = {
                track_applications: true,
                track_files: true,
                track_browsing: true,
                track_idle_time: true,
                track_keyboard: false,
                track_mouse: false,
                learning_enabled: true,
                privacy_level: 'standard',
                work_hours_start: '09:00',
                work_hours_end: '17:00',
                work_days: [0, 1, 2, 3, 4], // Monday to Friday
                excluded_apps: [],
                excluded_websites: [],
                excluded_directories: [],
                theme: theme
            };
            localStorage.setItem(this.STORAGE_KEYS.SETTINGS, JSON.stringify(defaultSettings));

            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            return false;
        }
    }

    /**
     * Get recent activities
     * @param {number} limit - Maximum number of activities to return
     * @returns {Array} Recent activities
     */
    getRecentActivities(limit = 10) {
        try {
            const activities = this.getActivities();
            if (!activities || activities.length === 0) {
                return [];
            }
            
            // Sort by timestamp (most recent first)
            activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            // Return limited number
            return activities.slice(0, limit);
        } catch (error) {
            console.error('Error getting recent activities:', error);
            return [];
        }
    }
    
    /**
     * Get app usage statistics
     * @param {number} limit - Maximum number of apps to return
     * @returns {Array} App usage statistics sorted by most used first
     */
    getAppUsageStats(limit = 5) {
        try {
            const activities = this.getActivities();
            if (!activities || activities.length === 0) {
                return [];
            }
            
            // Count app usage
            const appCounts = {};
            activities.forEach(activity => {
                if (!activity.application_name) return;
                
                const appName = activity.application_name;
                if (!appCounts[appName]) {
                    appCounts[appName] = {
                        app: appName,
                        count: 0,
                        duration: 0
                    };
                }
                
                appCounts[appName].count++;
                if (activity.duration) {
                    appCounts[appName].duration += activity.duration;
                }
            });
            
            // Convert to array and sort by count
            const sortedApps = Object.values(appCounts)
                .sort((a, b) => b.count - a.count)
                .slice(0, limit);
            
            return sortedApps;
        } catch (error) {
            console.error('Error getting app usage stats:', error);
            return [];
        }
    }
    
    /**
     * Get statistics about user activities
     * @returns {Object} Statistics
     */
    getStatistics() {
        try {
            const activities = this.getActivities();
            const feedback = this.getAllFeedback();
            
            // Default stats
            const stats = {
                activities: activities.length,
                productive_time: 0,
                avg_score: 0.5,
                sessions: 1
            };
            
            if (activities.length > 0) {
                // Calculate productive time (seconds)
                activities.forEach(activity => {
                    if (activity.duration && activity.productivity_score && activity.productivity_score > 0.5) {
                        stats.productive_time += activity.duration;
                    }
                });
                
                // Calculate average productivity score
                let totalScore = 0;
                let scoredActivities = 0;
                
                activities.forEach(activity => {
                    if (activity.productivity_score !== undefined) {
                        totalScore += activity.productivity_score;
                        scoredActivities++;
                    }
                });
                
                if (scoredActivities > 0) {
                    stats.avg_score = totalScore / scoredActivities;
                }
                
                // Count unique sessions
                const uniqueSessions = new Set();
                activities.forEach(activity => {
                    if (activity.session_id) {
                        uniqueSessions.add(activity.session_id);
                    }
                });
                
                stats.sessions = uniqueSessions.size || 1;
            }
            
            return stats;
        } catch (error) {
            console.error('Error getting statistics:', error);
            return {
                activities: 0,
                productive_time: 0,
                avg_score: 0.5,
                sessions: 1
            };
        }
    }

    /**
     * Calculate storage usage
     */
    getStorageUsage() {
        try {
            let totalBytes = 0;
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key.startsWith('workflowai_')) {
                    const value = localStorage.getItem(key);
                    totalBytes += key.length + value.length;
                }
            }

            const usageKB = (totalBytes / 1024).toFixed(2);
            const limit = 5 * 1024; // 5MB typical limit
            const percentUsed = ((totalBytes / 1024) / limit * 100).toFixed(2);

            return {
                usageKB,
                percentUsed,
                limit: '5 MB'
            };
        } catch (error) {
            console.error('Error calculating storage usage:', error);
            return {
                usageKB: 0,
                percentUsed: 0,
                limit: '5 MB'
            };
        }
    }
    
    /**
     * Get all activities (for export)
     */
    getAllActivities() {
        try {
            const activitiesJson = localStorage.getItem(this.STORAGE_KEYS.ACTIVITIES);
            return activitiesJson ? JSON.parse(activitiesJson) : [];
        } catch (error) {
            console.error('Error getting all activities:', error);
            return [];
        }
    }
    
    /**
     * Get all suggestions (for export)
     */
    getAllSuggestions() {
        try {
            const suggestionsJson = localStorage.getItem(this.STORAGE_KEYS.SUGGESTIONS);
            return suggestionsJson ? JSON.parse(suggestionsJson) : [];
        } catch (error) {
            console.error('Error getting all suggestions:', error);
            return [];
        }
    }
    
    /**
     * Get all system health data (for export)
     */
    getAllSystemHealthData() {
        try {
            // Get all system health records
            const systemHealthJson = localStorage.getItem(this.STORAGE_KEYS.SYSTEM_HEALTH);
            if (!systemHealthJson) return [];
            
            const systemHealth = JSON.parse(systemHealthJson);
            
            // If it's an object (current format), convert to array with single entry
            if (!Array.isArray(systemHealth)) {
                return [
                    {
                        ...systemHealth,
                        timestamp: systemHealth.last_updated || new Date().toISOString(),
                        device_id: this.getDeviceId()
                    }
                ];
            }
            
            return systemHealth;
        } catch (error) {
            console.error('Error getting all system health data:', error);
            return [];
        }
    }
}

// Initialize and expose the manager
window.localStorageManager = new LocalStorageManager();