import logging
import numpy as np
from datetime import datetime, timedelta
import os
import json
import random

logger = logging.getLogger(__name__)

class RLModel:
    def __init__(self):
        """Initialize the RL model for workflow suggestions"""
        logger.info("Initializing RL model")
        
        # Initialize model parameters
        self.learning_rate = 0.1
        self.discount_factor = 0.9
        self.exploration_rate = 0.2
        
        # Initialize state-action value function (Q-table)
        self.q_values = {}
        
        # Categories of suggestions
        self.suggestion_categories = [
            'productivity',
            'organization',
            'time_management',
            'ergonomics',
            'break_reminders',
            'workflow_optimization',
            'focus_suggestions',
            'app_consolidation'
        ]
        
        # Load suggestions template corpus
        self.suggestion_templates = {
            'productivity': [
                "Consider using keyboard shortcuts for {app} to speed up your workflow.",
                "You've been switching frequently between {app1} and {app2}. Try using split screen to view both at once.",
                "Your most productive hours appear to be in the {time_of_day}. Consider scheduling important tasks during this time.",
                "You seem to work well with {app}. Try allocating more focused time for tasks using this application.",
                "Based on your patterns, you may benefit from the Pomodoro technique: 25 minutes of focus followed by a 5-minute break."
            ],
            'organization': [
                "You frequently access multiple files. Consider creating project-specific folders to keep related files together.",
                "Your desktop has many items. Try organizing them into folders for better visual clarity and faster access.",
                "Consider using tagging or a naming convention for your files to make them easier to search and organize.",
                "You use {app} frequently. Consider creating templates for common tasks in this application.",
                "Try grouping similar applications together in your dock/taskbar for more efficient access."
            ],
            'time_management': [
                "You tend to spend {duration} minutes on {app} at a time. Consider setting a timer to keep these sessions focused.",
                "Your {time_of_day} schedule shows frequent application switching. Try time-blocking to reduce context switching.",
                "Consider scheduling specific times for checking email and messages rather than switching to them frequently.",
                "You seem most active between {start_time} and {end_time}. Try scheduling your most important tasks during this period.",
                "Your data shows you typically spend {duration} minutes in meetings. Consider setting 45-minute meetings instead of 60-minute ones for more breaks."
            ],
            'ergonomics': [
                "You've been working continuously for {duration} minutes. Remember to take short breaks to rest your eyes and stretch.",
                "Consider adjusting your workspace for better ergonomics: keyboard at elbow level, monitor at eye level.",
                "Remember the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds to reduce eye strain.",
                "Try incorporating standing periods into your work routine to reduce sitting time.",
                "Consider enabling night mode or blue light filters during evening work sessions to reduce eye strain."
            ],
            'break_reminders': [
                "You've been working for {duration} minutes straight. Take a quick 5-minute break to stretch and rest your eyes.",
                "Time for a hydration break! Staying hydrated improves cognitive function and energy levels.",
                "Consider taking a short walk to refresh your mind after this intense work session.",
                "You've been in meetings for {duration} minutes today. Try to take short breaks between consecutive meetings.",
                "After focusing on {app} for {duration} minutes, a short break might help maintain your productivity."
            ],
            'workflow_optimization': [
                "You frequently transition between {app1} and {app2}. Consider learning how to integrate these tools better.",
                "Your workflow includes many repetitive tasks in {app}. Explore if these can be automated or streamlined.",
                "You might benefit from using a clipboard manager to handle the frequent copy-paste operations you perform.",
                "Consider using a password manager to streamline your login processes across applications.",
                "Your data shows you work with multiple browser tabs. Try organizing them with tab management extensions."
            ],
            'focus_suggestions': [
                "Consider using a website blocker during your work sessions to minimize distractions.",
                "Your most focused work happens in {time_of_day} sessions. Try scheduling complex tasks during this time.",
                "You tend to switch applications frequently. Try using full-screen mode for your primary task to reduce distractions.",
                "Consider using noise-cancelling headphones or background music to maintain focus during your work sessions.",
                "Try the 'two-minute rule': if a task takes less than two minutes, do it immediately rather than switching context."
            ],
            'app_consolidation': [
                "You're using multiple applications for similar tasks. Consider consolidating to fewer tools for better efficiency.",
                "You frequently use {app1}, {app2}, and {app3} together. Look for a unified solution that combines these functions.",
                "Consider using fewer browser tabs by bookmarking frequently visited sites or using a start page.",
                "Your data shows you use multiple communication tools. Consider standardizing on fewer platforms when possible.",
                "Try using keyboard launchers or command palettes to reduce time navigating between applications."
            ]
        }
        
        # Initialize suggestion history
        self.suggestion_history = []
        self.feedback_history = []
    
    def _extract_features_for_rl(self, features_dict):
        """Extract relevant features from the feature dictionary for RL decision making"""
        # For this simplified version, we'll extract a few key features
        state_features = {}
        
        # App usage
        if 'app_usage' in features_dict:
            # Get top 3 apps by usage
            app_usage = features_dict['app_usage']
            top_apps = sorted(app_usage.items(), key=lambda x: x[1], reverse=True)[:3]
            
            for i, (app, usage) in enumerate(top_apps):
                state_features[f'top_app_{i+1}'] = app
                state_features[f'top_app_{i+1}_usage'] = usage
        
        # Time features
        state_features['time_of_day'] = features_dict.get('time_of_day', datetime.now().hour)
        state_features['day_of_week'] = features_dict.get('day_of_week', datetime.now().weekday())
        state_features['is_weekend'] = features_dict.get('is_weekend', 1 if datetime.now().weekday() >= 5 else 0)
        
        # Productivity metrics
        state_features['high_productivity'] = features_dict.get('high_productivity', 0)
        state_features['medium_productivity'] = features_dict.get('medium_productivity', 0)
        state_features['low_productivity'] = features_dict.get('low_productivity', 0)
        
        # Activity density
        state_features['activity_density'] = features_dict.get('activity_density', 0)
        
        return state_features
    
    def _get_state_key(self, state_features):
        """Convert state features to a string key for the Q-table"""
        # Simplified state key - just use the hour of day and top app
        time_of_day = state_features.get('time_of_day', 0)
        day_of_week = state_features.get('day_of_week', 0)
        top_app = state_features.get('top_app_1', 'unknown')
        is_weekend = state_features.get('is_weekend', 0)
        
        # Time period (morning, afternoon, evening, night)
        if 5 <= time_of_day < 12:
            time_period = 'morning'
        elif 12 <= time_of_day < 17:
            time_period = 'afternoon'
        elif 17 <= time_of_day < 22:
            time_period = 'evening'
        else:
            time_period = 'night'
        
        # Simplified productivity level
        high_prod = state_features.get('high_productivity', 0)
        med_prod = state_features.get('medium_productivity', 0)
        low_prod = state_features.get('low_productivity', 0)
        
        if high_prod > max(med_prod, low_prod):
            productivity = 'high'
        elif med_prod > low_prod:
            productivity = 'medium'
        else:
            productivity = 'low'
        
        # Create a simplified state key
        state_key = f"{time_period}_{day_of_week}_{is_weekend}_{productivity}_{top_app}"
        return state_key
    
    def _format_suggestion(self, template, state_features):
        """Format a suggestion template with actual state values"""
        # Extract values for formatting
        formatted = template
        
        # Replace {app} with the top app
        if '{app}' in template:
            app = state_features.get('top_app_1', 'your frequently used application')
            formatted = formatted.replace('{app}', app)
        
        # Replace {app1} and {app2} for workflow optimization
        if '{app1}' in template:
            app1 = state_features.get('top_app_1', 'your first application')
            formatted = formatted.replace('{app1}', app1)
        
        if '{app2}' in template:
            app2 = state_features.get('top_app_2', 'your second application')
            formatted = formatted.replace('{app2}', app2)
        
        if '{app3}' in template:
            app3 = state_features.get('top_app_3', 'your third application')
            formatted = formatted.replace('{app3}', app3)
        
        # Replace {duration} with a reasonable duration based on app usage
        if '{duration}' in template:
            duration = int(state_features.get('activity_density', 5) * 10)
            duration = max(10, min(duration, 120))  # Between 10 and 120 minutes
            formatted = formatted.replace('{duration}', str(duration))
        
        # Replace {time_of_day} with the current period
        if '{time_of_day}' in template:
            hour = state_features.get('time_of_day', datetime.now().hour)
            if 5 <= hour < 12:
                time_of_day = 'morning'
            elif 12 <= hour < 17:
                time_of_day = 'afternoon'
            elif 17 <= hour < 22:
                time_of_day = 'evening'
            else:
                time_of_day = 'late night'
            formatted = formatted.replace('{time_of_day}', time_of_day)
        
        # Replace {start_time} and {end_time} with reasonable work hours
        if '{start_time}' in template:
            start_hour = max(8, min(state_features.get('time_of_day', 9) - 1, 11))
            start_time = f"{start_hour}:00"
            formatted = formatted.replace('{start_time}', start_time)
        
        if '{end_time}' in template:
            end_hour = max(16, min(state_features.get('time_of_day', 17) + 1, 20))
            end_time = f"{end_hour}:00"
            formatted = formatted.replace('{end_time}', end_time)
        
        return formatted
    
    def _select_suggestion_category(self, state_key):
        """Select a suggestion category using reinforcement learning"""
        # If this state doesn't exist in our Q-table, initialize it
        if state_key not in self.q_values:
            self.q_values[state_key] = {category: 0.1 for category in self.suggestion_categories}
        
        # Epsilon-greedy strategy for exploration/exploitation
        if random.random() < self.exploration_rate:
            # Exploration: Choose a random category
            return random.choice(self.suggestion_categories)
        else:
            # Exploitation: Choose the best category according to Q-values
            q_values = self.q_values[state_key]
            return max(q_values, key=q_values.get)
    
    def _get_suggestions_for_category(self, category, state_features, count=1):
        """Get suggestions for a specific category"""
        if category not in self.suggestion_templates:
            logger.warning(f"Unknown suggestion category: {category}")
            category = 'productivity'  # Fallback to productivity
        
        # Get templates for this category
        templates = self.suggestion_templates[category]
        
        # Format templates with state data
        formatted_suggestions = []
        for template in templates:
            formatted = self._format_suggestion(template, state_features)
            formatted_suggestions.append(formatted)
        
        # Shuffle and take requested number
        random.shuffle(formatted_suggestions)
        return formatted_suggestions[:count]
    
    def generate_suggestions(self, features):
        """Generate workflow suggestions based on the provided feature vector"""
        try:
            # Extract features for RL
            state_features = self._extract_features_for_rl(features)
            
            # Get state key for the Q-table
            state_key = self._get_state_key(state_features)
            
            # Generate suggestions from different categories
            suggestions = []
            
            # Use RL to select the primary suggestion category
            primary_category = self._select_suggestion_category(state_key)
            primary_suggestions = self._get_suggestions_for_category(primary_category, state_features, count=2)
            suggestions.extend(primary_suggestions)
            
            # Get one suggestion from other categories
            other_categories = [c for c in self.suggestion_categories if c != primary_category]
            random.shuffle(other_categories)
            secondary_category = other_categories[0]
            secondary_suggestions = self._get_suggestions_for_category(secondary_category, state_features, count=1)
            suggestions.extend(secondary_suggestions)
            
            # Add these suggestions to the history
            for suggestion in suggestions:
                self.suggestion_history.append({
                    'content': suggestion,
                    'state_key': state_key,
                    'category': primary_category if suggestion in primary_suggestions else secondary_category,
                    'timestamp': datetime.now().isoformat()
                })
            
            # Ensure we have a reasonable number of suggestions
            if len(suggestions) > 3:
                suggestions = suggestions[:3]
            elif len(suggestions) < 3:
                # Fill with generic suggestions if needed
                generic_suggestions = [
                    "Consider organizing your files into project-based folders for easier access.",
                    "Take regular breaks to maintain productivity. Try the Pomodoro technique: 25 minutes of focus followed by a 5-minute break.",
                    "Keep your workspace organized to improve focus and efficiency."
                ]
                suggestions.extend(generic_suggestions[:(3 - len(suggestions))])
            
            return suggestions
            
        except Exception as e:
            logger.error(f"Error generating suggestions: {str(e)}")
            # Return generic suggestions as fallback
            return [
                "Consider organizing your files into project-based folders for easier access.",
                "Clean up your desktop and dock/taskbar to focus on applications you actually use.",
                "Take regular breaks to maintain productivity. Try the Pomodoro technique."
            ]
    
    def update_from_feedback(self, suggestion, feedback):
        """Update the RL model based on user feedback"""
        try:
            # In client-side implementation, suggestion would be the actual suggestion object
            # But here it might just be the ID, so we'll simplify
            
            # Record the feedback
            feedback_record = {
                'suggestion_id': suggestion.get('id', 'unknown'),
                'feedback': feedback,
                'timestamp': datetime.now().isoformat()
            }
            self.feedback_history.append(feedback_record)
            
            # Normally we'd look up the state and category from the suggestion
            # but here we'll use a simplified approach
            for recent_suggestion in reversed(self.suggestion_history[-10:]):  # Look at 10 most recent
                if recent_suggestion.get('content') == suggestion.get('content', ''):
                    state_key = recent_suggestion.get('state_key')
                    category = recent_suggestion.get('category')
                    
                    if state_key and category:
                        # Initialize Q-value if needed
                        if state_key not in self.q_values:
                            self.q_values[state_key] = {cat: 0.1 for cat in self.suggestion_categories}
                        
                        # Update Q-value based on feedback
                        if feedback == 'helpful':
                            reward = 1.0
                        elif feedback == 'somewhat_helpful':
                            reward = 0.5
                        else:  # 'not_helpful'
                            reward = -0.2
                        
                        # Simple update rule
                        self.q_values[state_key][category] += self.learning_rate * reward
                        
                        logger.info(f"Updated Q-value for {state_key} {category} based on {feedback} feedback")
                    break
            
            return True
            
        except Exception as e:
            logger.error(f"Error updating from feedback: {str(e)}")
            return False