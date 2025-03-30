/**
 * neural_models.js - Implements TensorFlow.js neural network models for the WorkflowAI application
 */

// Global model variables - use window to prevent redeclaration errors
window.activityClassifier = window.activityClassifier || null;
window.workflowPredictor = window.workflowPredictor || null;
window.productivityAnalyzer = window.productivityAnalyzer || null;
window.systemOptimizer = window.systemOptimizer || null;

// Initialize models on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeModels().catch(err => {
        console.error('Error initializing neural models:', err);
    });
});

/**
 * Initialize all neural models
 */
async function initializeModels() {
    try {
        console.log('Initializing neural models...');
        
        // Check if TensorFlow.js is available
        if (!window.tf) {
            console.error('TensorFlow.js not loaded');
            return;
        }
        
        // Initialize each model in parallel
        await Promise.all([
            initActivityClassifier(),
            initWorkflowPredictor(),
            initProductivityAnalyzer(),
            initSystemOptimizer()
        ]);
        
        console.log('All neural models initialized successfully');
    } catch (error) {
        console.error('Error initializing models:', error);
        throw error;
    }
}

/**
 * Initialize Activity Classifier model
 */
async function initActivityClassifier() {
    console.log('Initializing Activity Classifier...');
    
    // Create a simple model using TensorFlow.js
    window.activityClassifier = tf.sequential({
        layers: [
            // Input layer with 12 features (application used, duration, time of day, etc.)
            tf.layers.dense({ inputShape: [12], units: 16, activation: 'relu' }),
            tf.layers.dropout({ rate: 0.2 }),
            tf.layers.dense({ units: 8, activation: 'relu' }),
            // Output layer with 3 classes (productive, neutral, distracting)
            tf.layers.dense({ units: 3, activation: 'softmax' })
        ]
    });
    
    // Compile the model
    window.activityClassifier.compile({
        optimizer: 'adam',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
    });
    
    console.log('Activity Classifier initialized');
    
    // Create a small dataset for initial training
    const dummyFeatures = tf.randomNormal([10, 12]);
    const dummyLabels = tf.oneHot(tf.tensor1d([0, 1, 2, 0, 1, 2, 0, 1, 2, 0], 'int32'), 3);
    
    // Train the model with dummy data (just for initialization)
    await window.activityClassifier.fit(dummyFeatures, dummyLabels, {
        epochs: 5,
        verbose: 0
    });
    
    console.log('Activity Classifier trained with initial data');
}

/**
 * Initialize Workflow Predictor model
 */
async function initWorkflowPredictor() {
    console.log('Initializing Workflow Predictor...');
    
    // Create an LSTM model for sequence prediction
    window.workflowPredictor = tf.sequential({
        layers: [
            // Input layer for sequence of 5 previous activities with 8 features each
            tf.layers.lstm({ inputShape: [5, 8], units: 16, returnSequences: true }),
            tf.layers.lstm({ units: 16, returnSequences: false }),
            tf.layers.dropout({ rate: 0.2 }),
            // Output layer predicting the next activity (assuming 10 possible activities)
            tf.layers.dense({ units: 10, activation: 'softmax' })
        ]
    });
    
    // Compile the model
    window.workflowPredictor.compile({
        optimizer: 'rmsprop',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
    });
    
    console.log('Workflow Predictor initialized');
    
    // Create a small dataset for initial training
    const dummyFeatures = tf.randomNormal([10, 5, 8]);
    const dummyLabels = tf.oneHot(tf.tensor1d([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 'int32'), 10);
    
    // Train the model with dummy data (just for initialization)
    await window.workflowPredictor.fit(dummyFeatures, dummyLabels, {
        epochs: 5,
        verbose: 0
    });
    
    console.log('Workflow Predictor trained with initial data');
}

/**
 * Initialize Productivity Analyzer model
 */
async function initProductivityAnalyzer() {
    console.log('Initializing Productivity Analyzer...');
    
    // Create a model to analyze productivity patterns
    window.productivityAnalyzer = tf.sequential({
        layers: [
            // Input layer with 24 features (hourly activity data for a day)
            tf.layers.dense({ inputShape: [24], units: 32, activation: 'relu' }),
            tf.layers.dropout({ rate: 0.3 }),
            tf.layers.dense({ units: 16, activation: 'relu' }),
            // Output layer predicting productivity score (0-100)
            tf.layers.dense({ units: 1, activation: 'sigmoid' })
        ]
    });
    
    // Compile the model
    window.productivityAnalyzer.compile({
        optimizer: 'adam',
        loss: 'meanSquaredError',
        metrics: ['mse']
    });
    
    console.log('Productivity Analyzer initialized');
    
    // Create a small dataset for initial training
    const dummyFeatures = tf.randomNormal([10, 24]);
    const dummyLabels = tf.randomUniform([10, 1]);
    
    // Train the model with dummy data (just for initialization)
    await window.productivityAnalyzer.fit(dummyFeatures, dummyLabels, {
        epochs: 5,
        verbose: 0
    });
    
    console.log('Productivity Analyzer trained with initial data');
}

/**
 * Initialize System Optimizer model
 */
async function initSystemOptimizer() {
    console.log('Initializing System Optimizer...');
    
    // Create a model to optimize system resource allocation
    window.systemOptimizer = tf.sequential({
        layers: [
            // Input layer with 10 features (CPU, memory, disk usage, etc.)
            tf.layers.dense({ inputShape: [10], units: 16, activation: 'relu' }),
            tf.layers.dropout({ rate: 0.2 }),
            tf.layers.dense({ units: 8, activation: 'relu' }),
            // Output layer predicting optimal resource allocation for 5 resources
            tf.layers.dense({ units: 5, activation: 'softmax' })
        ]
    });
    
    // Compile the model
    window.systemOptimizer.compile({
        optimizer: 'adam',
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy']
    });
    
    console.log('System Optimizer initialized');
    
    // Create a small dataset for initial training
    const dummyFeatures = tf.randomNormal([10, 10]);
    const dummyLabels = tf.randomUniform([10, 5]);
    
    // Train the model with dummy data (just for initialization)
    await window.systemOptimizer.fit(dummyFeatures, dummyLabels, {
        epochs: 5,
        verbose: 0
    });
    
    console.log('System Optimizer trained with initial data');
}

/**
 * Train models with actual user data
 */
async function trainModelsWithUserData() {
    if (!window.localStorageManager) {
        console.error('LocalStorageManager not available');
        return;
    }
    
    try {
        console.log('Training models with user data...');
        
        // Get user activities from localStorage
        const activities = window.localStorageManager.getActivities();
        
        if (activities.length < 10) {
            console.log('Not enough activity data for meaningful training');
            return;
        }
        
        // Train Activity Classifier with real data
        if (window.activityClassifier) {
            await trainActivityClassifier(activities);
        }
        
        // Train Workflow Predictor with real data
        if (window.workflowPredictor) {
            await trainWorkflowPredictor(activities);
        }
        
        // Train Productivity Analyzer with real data
        if (window.productivityAnalyzer) {
            await trainProductivityAnalyzer(activities);
        }
        
        // Train System Optimizer with real data
        if (window.systemOptimizer && window.localStorageManager.getSystemHealth()) {
            await trainSystemOptimizer();
        }
        
        console.log('Models trained successfully with user data');
        return true;
    } catch (error) {
        console.error('Error training models with user data:', error);
        return false;
    }
}

/**
 * Train Activity Classifier with real user data
 */
async function trainActivityClassifier(activities) {
    // Pre-process activities into features and labels
    const features = [];
    const labels = [];
    
    activities.forEach(activity => {
        if (!activity.productivity_score) {
            return; // Skip activities without productivity score
        }
        
        // Convert activity to feature vector
        const feature = activityToFeatureVector(activity);
        features.push(feature);
        
        // Convert productivity score to label (0: low, 1: medium, 2: high)
        let label;
        if (activity.productivity_score < 0.3) {
            label = 0; // Low productivity
        } else if (activity.productivity_score < 0.7) {
            label = 1; // Medium productivity
        } else {
            label = 2; // High productivity
        }
        labels.push(label);
    });
    
    if (features.length < 5) {
        console.log('Not enough labeled data to train Activity Classifier');
        return;
    }
    
    // Convert to TensorFlow tensors
    const featuresTensor = tf.tensor2d(features);
    const labelsTensor = tf.oneHot(tf.tensor1d(labels, 'int32'), 3);
    
    // Train the model
    await window.activityClassifier.fit(featuresTensor, labelsTensor, {
        epochs: 10,
        batchSize: 5,
        shuffle: true,
        verbose: 0
    });
    
    // Clean up tensors
    featuresTensor.dispose();
    labelsTensor.dispose();
    
    console.log(`Activity Classifier trained with ${features.length} samples`);
}

/**
 * Train Workflow Predictor with real user data
 */
async function trainWorkflowPredictor(activities) {
    // Need at least 10 activities to build sequences
    if (activities.length < 10) {
        console.log('Not enough activity data to train Workflow Predictor');
        return;
    }
    
    // Sort activities by timestamp
    activities.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Create sequences of 5 activities to predict the 6th
    const sequences = [];
    const nextApps = [];
    
    for (let i = 0; i <= activities.length - 6; i++) {
        const sequence = activities.slice(i, i + 5).map(activity => {
            return activityToFeatureVector(activity).slice(0, 8); // Take first 8 features
        });
        sequences.push(sequence);
        
        // Map the application name to a numeric index (simplistic approach)
        const nextApp = activities[i + 5].application_name;
        const appIndex = Math.abs(nextApp.split('').reduce((acc, char) => {
            return acc + char.charCodeAt(0);
        }, 0) % 10); // Hash to 0-9 range
        nextApps.push(appIndex);
    }
    
    if (sequences.length < 5) {
        console.log('Not enough sequences to train Workflow Predictor');
        return;
    }
    
    // Convert to TensorFlow tensors
    const sequencesTensor = tf.tensor3d(sequences);
    const nextAppsTensor = tf.oneHot(tf.tensor1d(nextApps, 'int32'), 10);
    
    // Train the model
    await window.workflowPredictor.fit(sequencesTensor, nextAppsTensor, {
        epochs: 10,
        batchSize: 5,
        shuffle: true,
        verbose: 0
    });
    
    // Clean up tensors
    sequencesTensor.dispose();
    nextAppsTensor.dispose();
    
    console.log(`Workflow Predictor trained with ${sequences.length} sequences`);
}

/**
 * Train Productivity Analyzer with real user data
 */
async function trainProductivityAnalyzer(activities) {
    // Sort activities by timestamp
    activities.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Group activities by day
    const dayActivities = {};
    
    activities.forEach(activity => {
        const date = new Date(activity.timestamp).toLocaleDateString();
        if (!dayActivities[date]) {
            dayActivities[date] = [];
        }
        dayActivities[date].push(activity);
    });
    
    // Create 24-hour activity profiles for each day
    const dailyProfiles = [];
    const productivityScores = [];
    
    for (const date in dayActivities) {
        const dayActivity = dayActivities[date];
        const hourlyActivity = Array(24).fill(0);
        let totalProductivity = 0;
        
        // Calculate hours of activity for each hour of the day
        dayActivity.forEach(activity => {
            const hour = new Date(activity.timestamp).getHours();
            hourlyActivity[hour] += activity.duration || 0;
            totalProductivity += activity.productivity_score || 0.5;
        });
        
        // Normalize to percentage of day
        const totalSeconds = hourlyActivity.reduce((sum, hour) => sum + hour, 0);
        const normalizedHourly = hourlyActivity.map(hour => totalSeconds > 0 ? hour / totalSeconds : 0);
        
        // Calculate average productivity for the day
        const avgProductivity = totalProductivity / dayActivity.length;
        
        dailyProfiles.push(normalizedHourly);
        productivityScores.push([avgProductivity]);
    }
    
    if (dailyProfiles.length < 3) {
        console.log('Not enough daily data to train Productivity Analyzer');
        return;
    }
    
    // Convert to TensorFlow tensors
    const profilesTensor = tf.tensor2d(dailyProfiles);
    const scoresTensor = tf.tensor2d(productivityScores);
    
    // Train the model
    await window.productivityAnalyzer.fit(profilesTensor, scoresTensor, {
        epochs: 15,
        batchSize: 3,
        shuffle: true,
        verbose: 0
    });
    
    // Clean up tensors
    profilesTensor.dispose();
    scoresTensor.dispose();
    
    console.log(`Productivity Analyzer trained with ${dailyProfiles.length} daily profiles`);
}

/**
 * Train System Optimizer with real user data
 */
async function trainSystemOptimizer() {
    const systemHealth = window.localStorageManager.getSystemHealth();
    if (!systemHealth || !systemHealth.cpu_usage) {
        console.log('No system health data available for training System Optimizer');
        return;
    }
    
    // Create a simplified feature vector from system health
    const feature = [
        systemHealth.cpu_usage / 100, // Normalize to 0-1
        systemHealth.memory_usage / 100,
        systemHealth.disk_usage / 100,
        systemHealth.network_in ? Math.min(systemHealth.network_in / 1000000, 1) : 0, // Normalize to 0-1 (max 1MB/s)
        systemHealth.network_out ? Math.min(systemHealth.network_out / 1000000, 1) : 0,
        systemHealth.battery_level ? systemHealth.battery_level / 100 : 0.5,
        systemHealth.processes_count ? Math.min(systemHealth.processes_count / 300, 1) : 0.5, // Normalize to 0-1 (max 300 processes)
        (new Date().getHours()) / 24, // Time of day
        (new Date().getDay()) / 7, // Day of week
        Math.random() // Random feature
    ];
    
    // Create a target allocation vector (for demonstration)
    // Represents optimal allocation of 5 resources based on system health
    const allocation = [
        0.6, // CPU allocation
        0.7, // Memory allocation
        0.3, // Disk allocation
        0.5, // Network allocation
        0.8  // Battery usage
    ];
    
    // Convert to TensorFlow tensors (single sample)
    const featureTensor = tf.tensor2d([feature]);
    const allocationTensor = tf.tensor2d([allocation]);
    
    // Train the model with a single update
    await window.systemOptimizer.fit(featureTensor, allocationTensor, {
        epochs: 1,
        verbose: 0
    });
    
    // Clean up tensors
    featureTensor.dispose();
    allocationTensor.dispose();
    
    console.log('System Optimizer updated with current system health data');
}

/**
 * Convert an activity object to a feature vector for neural models
 */
function activityToFeatureVector(activity) {
    // Extract application type (simplified approach)
    const appTypes = {
        'browser': 0.1,
        'chrome': 0.1,
        'firefox': 0.1,
        'safari': 0.1,
        'edge': 0.1,
        'code': 0.2,
        'vscode': 0.2,
        'sublime': 0.2,
        'atom': 0.2,
        'terminal': 0.3,
        'cmd': 0.3,
        'powershell': 0.3,
        'word': 0.4,
        'excel': 0.4,
        'powerpoint': 0.4,
        'outlook': 0.5,
        'mail': 0.5,
        'gmail': 0.5,
        'teams': 0.6,
        'slack': 0.6,
        'discord': 0.6,
        'zoom': 0.6,
        'youtube': 0.7,
        'netflix': 0.7,
        'spotify': 0.7,
        'game': 0.8,
        'steam': 0.8
    };
    
    // Calculate app type score based on application name
    let appTypeScore = 0.5; // Default
    const appName = (activity.application_name || '').toLowerCase();
    
    for (const [appType, score] of Object.entries(appTypes)) {
        if (appName.includes(appType)) {
            appTypeScore = score;
            break;
        }
    }
    
    // Time of day (0-1)
    const timestamp = new Date(activity.timestamp);
    const hourOfDay = timestamp.getHours() / 24;
    const dayOfWeek = timestamp.getDay() / 7;
    const isWeekend = timestamp.getDay() === 0 || timestamp.getDay() === 6 ? 1 : 0;
    
    // Duration in seconds (normalized to 0-1, assuming max of 2 hours)
    const normalizedDuration = Math.min((activity.duration || 0) / 7200, 1);
    
    // Productivity score (0-1)
    const productivityScore = activity.productivity_score || 0.5;
    
    // Window title features
    const windowTitle = (activity.window_title || '').toLowerCase();
    
    // Simple features from window title
    const hasEmail = windowTitle.includes('mail') || windowTitle.includes('inbox') ? 1 : 0;
    const hasSocial = windowTitle.includes('facebook') || windowTitle.includes('twitter') || 
                       windowTitle.includes('instagram') ? 1 : 0;
    const hasWork = windowTitle.includes('project') || windowTitle.includes('task') || 
                     windowTitle.includes('report') ? 1 : 0;
    const hasEntertainment = windowTitle.includes('youtube') || windowTitle.includes('netflix') || 
                            windowTitle.includes('game') ? 1 : 0;
    
    // Return feature vector
    return [
        appTypeScore,
        normalizedDuration,
        hourOfDay,
        dayOfWeek,
        isWeekend,
        productivityScore,
        hasEmail,
        hasSocial,
        hasWork,
        hasEntertainment,
        Math.random(), // Random feature for demonstration
        Math.random()  // Random feature for demonstration
    ];
}

/**
 * Reset all neural models to their initial state
 */
async function resetModels() {
    console.log('Resetting neural models...');
    
    try {
        // Re-initialize all models
        await initializeModels();
        console.log('All neural models have been reset to their initial state');
        return true;
    } catch (error) {
        console.error('Error resetting models:', error);
        return false;
    }
}

/**
 * Use the Activity Classifier to predict productivity score for an activity
 * @param {Object} activity - The activity to classify
 * @returns {number} Productivity score between 0 and 1
 */
function classifyActivity(activity) {
    if (!window.activityClassifier) {
        console.error('Activity Classifier not initialized');
        return 0.5; // Default score
    }
    
    try {
        // Convert activity to feature vector
        const featureVector = activityToFeatureVector(activity);
        
        // Create tensor from feature vector
        const featureTensor = tf.tensor2d([featureVector]);
        
        // Make prediction
        const prediction = window.activityClassifier.predict(featureTensor);
        
        // Get the class probabilities
        const probabilities = prediction.dataSync();
        
        // Calculate weighted score (0: low, 1: medium, 2: high)
        const weightedScore = (probabilities[0] * 0.2 + probabilities[1] * 0.6 + probabilities[2] * 0.9);
        
        // Clean up tensors
        featureTensor.dispose();
        prediction.dispose();
        
        return weightedScore;
    } catch (error) {
        console.error('Error classifying activity:', error);
        return 0.5; // Default score on error
    }
}

/**
 * Use the Productivity Analyzer to predict optimal working hours
 * @returns {Object} Object containing optimal hours and expected productivity
 */
function analyzeProductivity() {
    if (!window.productivityAnalyzer) {
        console.error('Productivity Analyzer not initialized');
        return null;
    }
    
    try {
        // Create 24 test profiles, each with activity concentrated in a different hour
        const hourlyProfiles = [];
        
        for (let peakHour = 0; peakHour < 24; peakHour++) {
            const profile = Array(24).fill(0.01); // Base activity
            profile[peakHour] = 0.91; // Peak activity in this hour
            hourlyProfiles.push(profile);
        }
        
        // Convert to tensor
        const profilesTensor = tf.tensor2d(hourlyProfiles);
        
        // Make predictions
        const predictions = window.productivityAnalyzer.predict(profilesTensor);
        
        // Get productivity scores for each hour
        const hourlyScores = predictions.dataSync();
        
        // Find the peak productivity hours
        const sortedHours = hourlyScores.map((score, hour) => ({ hour, score }))
            .sort((a, b) => b.score - a.score);
        
        // Get top 3 most productive hours
        const optimalHours = sortedHours.slice(0, 3).map(item => item.hour);
        const optimalScore = sortedHours[0].score;
        
        // Clean up tensors
        profilesTensor.dispose();
        predictions.dispose();
        
        return {
            optimalHours,
            optimalScore,
            hourlyScores: Array.from(hourlyScores)
        };
    } catch (error) {
        console.error('Error analyzing productivity:', error);
        return null;
    }
}