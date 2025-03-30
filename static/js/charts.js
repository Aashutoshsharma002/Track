/**
 * charts.js - Chart visualizations for the WorkflowAI application
 */

// Chart objects cache - use window to prevent redeclaration errors
window.chartInstances = window.chartInstances || {};

/**
 * Initialize all charts for the dashboard
 */
function initCharts() {
    // Initialize app usage pie chart
    initAppUsageChart();
    
    // Initialize productivity line chart
    initProductivityChart();
    
    // Initialize time distribution chart
    initTimeDistributionChart();
    
    // Initialize system health gauges
    initSystemHealthGauges();
}

/**
 * Initialize the app usage pie chart
 */
function initAppUsageChart() {
    const ctx = document.getElementById('appUsageChart');
    if (!ctx) return;
    
    // Get data from localStorage if available
    let appData = {
        labels: ['Browser', 'Editor', 'Terminal', 'Media', 'Productivity', 'Other'],
        values: [30, 25, 15, 10, 15, 5]
    };
    
    if (window.localStorageManager) {
        // Try to get real data from activities
        const activities = window.localStorageManager.getActivities();
        if (activities && activities.length > 0) {
            // Process activities to get app usage data
            const appUsage = {};
            let totalTime = 0;
            
            activities.forEach(activity => {
                if (!activity.application_name || !activity.duration) return;
                
                const appName = activity.application_name;
                if (!appUsage[appName]) {
                    appUsage[appName] = 0;
                }
                
                appUsage[appName] += activity.duration;
                totalTime += activity.duration;
            });
            
            // If we have real data, convert it to chart format
            if (totalTime > 0) {
                // Sort by usage time
                const sortedApps = Object.entries(appUsage)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5); // Top 5 apps
                
                // Calculate other
                const topAppsTotalTime = sortedApps.reduce((sum, app) => sum + app[1], 0);
                const otherTime = totalTime - topAppsTotalTime;
                
                // Create data arrays
                appData.labels = sortedApps.map(app => app[0]);
                appData.labels.push('Other');
                
                appData.values = sortedApps.map(app => app[1]);
                appData.values.push(otherTime);
                
                // Convert to percentages
                appData.values = appData.values.map(value => (value / totalTime) * 100);
            }
        }
    }
    
    // Create chart
    window.chartInstances.appUsage = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: appData.labels,
            datasets: [{
                data: appData.values,
                backgroundColor: [
                    '#4e73df',
                    '#1cc88a',
                    '#36b9cc',
                    '#f6c23e',
                    '#e74a3b',
                    '#858796'
                ],
                hoverBackgroundColor: [
                    '#2e59d9',
                    '#17a673',
                    '#2c9faf',
                    '#dda20a',
                    '#be2617',
                    '#6e707e'
                ],
                borderWidth: 1
            }]
        },
        options: {
            maintainAspectRatio: false,
            responsive: true,
            cutout: '70%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--bs-body-color')
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw;
                            return `${label}: ${value.toFixed(1)}%`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Initialize the productivity line chart
 */
function initProductivityChart() {
    const ctx = document.getElementById('productivityChart');
    if (!ctx) return;
    
    // Sample data for demonstration
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const productivityData = [65, 70, 55, 75, 60, 40, 45];
    
    // Create chart
    window.chartInstances.productivity = new Chart(ctx, {
        type: 'line',
        data: {
            labels: days,
            datasets: [{
                label: 'Productivity Score',
                data: productivityData,
                backgroundColor: 'rgba(78, 115, 223, 0.05)',
                borderColor: 'rgba(78, 115, 223, 1)',
                pointRadius: 3,
                pointBackgroundColor: 'rgba(78, 115, 223, 1)',
                pointBorderColor: 'rgba(78, 115, 223, 1)',
                pointHoverRadius: 5,
                pointHoverBackgroundColor: 'rgba(78, 115, 223, 1)',
                pointHoverBorderColor: 'rgba(78, 115, 223, 1)',
                pointHitRadius: 10,
                pointBorderWidth: 2,
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            maintainAspectRatio: false,
            responsive: true,
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--bs-body-color')
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--bs-body-color')
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

/**
 * Initialize the time distribution chart
 */
function initTimeDistributionChart() {
    const ctx = document.getElementById('timeDistributionChart');
    if (!ctx) return;
    
    // Sample data for demonstration
    const hours = Array.from({length: 24}, (_, i) => `${i}:00`);
    
    // Create "typical" distribution with peaks at 9-12 and 14-17
    const timeDistributionData = hours.map((_, i) => {
        if (i >= 9 && i < 12) {
            return 60 + Math.random() * 20;
        } else if (i >= 14 && i < 17) {
            return 70 + Math.random() * 20;
        } else if (i >= 20 || i < 6) {
            return Math.random() * 10;
        } else {
            return 20 + Math.random() * 30;
        }
    });
    
    // Create chart
    window.chartInstances.timeDistribution = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: hours,
            datasets: [{
                label: 'Activity Level',
                data: timeDistributionData,
                backgroundColor: 'rgba(28, 200, 138, 0.6)',
                borderWidth: 0
            }]
        },
        options: {
            maintainAspectRatio: false,
            responsive: true,
            scales: {
                y: {
                    min: 0,
                    max: 100,
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--bs-body-color')
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    }
                },
                x: {
                    ticks: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--bs-body-color'),
                        maxRotation: 90,
                        minRotation: 45
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

/**
 * Initialize system health gauges
 */
function initSystemHealthGauges() {
    // CPU usage gauge
    const cpuGauge = document.getElementById('cpuGauge');
    if (cpuGauge) {
        updateGauge(cpuGauge, 45, 'CPU');
    }
    
    // Memory usage gauge
    const memoryGauge = document.getElementById('memoryGauge');
    if (memoryGauge) {
        updateGauge(memoryGauge, 72, 'Memory');
    }
    
    // Disk usage gauge
    const diskGauge = document.getElementById('diskGauge');
    if (diskGauge) {
        updateGauge(diskGauge, 58, 'Disk');
    }
}

/**
 * Update a gauge chart with new value
 */
function updateGauge(canvasElement, value, label) {
    const ctx = canvasElement.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Draw background arc
    const centerX = canvasElement.width / 2;
    const centerY = canvasElement.height - 20;
    const radius = Math.min(centerX, centerY) - 10;
    
    // Background arc
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, 0, false);
    ctx.lineWidth = 10;
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.3)';
    ctx.stroke();
    
    // Value arc
    const endAngle = Math.PI + (value / 100) * Math.PI;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, Math.PI, endAngle, false);
    ctx.lineWidth = 10;
    
    // Color based on value
    if (value < 50) {
        ctx.strokeStyle = '#1cc88a'; // Green
    } else if (value < 75) {
        ctx.strokeStyle = '#f6c23e'; // Yellow
    } else {
        ctx.strokeStyle = '#e74a3b'; // Red
    }
    
    ctx.stroke();
    
    // Add text
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bs-body-color');
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${value}%`, centerX, centerY);
    
    ctx.font = '14px Arial';
    ctx.fillText(label, centerX, centerY + 25);
}

/**
 * Update all charts with fresh data
 */
function updateCharts() {
    // Re-initialize each chart with fresh data
    Object.keys(window.chartInstances).forEach(key => {
        if (window.chartInstances[key]) {
            window.chartInstances[key].destroy();
        }
    });
    
    // Re-initialize with new data
    initCharts();
}

// Initialize charts when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize charts if we're on the dashboard page
    if (document.getElementById('appUsageChart') || 
        document.getElementById('productivityChart') || 
        document.getElementById('timeDistributionChart')) {
        initCharts();
    }
});

// Update charts when theme changes
document.addEventListener('themeChanged', function() {
    updateCharts();
});