import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import uuid

logger = logging.getLogger(__name__)

class DataProcessor:
    def __init__(self):
        self.feature_vector_size = 64  # Size of the feature vector for the RL model
    
    def process_activities(self, activities, device_id=None, session_id=None, user_id=None):
        """
        Process a list of activities to generate features for the RL model
        
        Args:
            activities: List of Activity objects or dictionaries
            device_id: Optional device ID to include device-specific features
            session_id: Optional session ID to include session context
            user_id: Optional user ID to associate with the feature vector
            
        Returns:
            dict: Feature dictionary for use by the RL model
        """
        try:
            # Convert to dataframe for easier processing
            if not activities:
                logger.warning("No activities to process")
                return self._create_empty_feature_vector()
            
            # Handle activities as dictionaries (for localStorage)
            if isinstance(activities[0], dict):
                df = pd.DataFrame(activities)
            else:
                # Convert objects to dictionaries (legacy support)
                activities_dicts = []
                for activity in activities:
                    act_dict = {
                        'id': getattr(activity, 'id', str(uuid.uuid4())),
                        'activity_type': getattr(activity, 'activity_type', 'unknown'),
                        'application_name': getattr(activity, 'application_name', ''),
                        'window_title': getattr(activity, 'window_title', ''),
                        'duration': getattr(activity, 'duration', 0),
                        'timestamp': getattr(activity, 'timestamp', datetime.utcnow().isoformat()),
                        'productivity_score': getattr(activity, 'productivity_score', 0.5)
                    }
                    activities_dicts.append(act_dict)
                df = pd.DataFrame(activities_dicts)
            
            # Convert timestamp strings to datetime objects if needed
            if isinstance(df['timestamp'].iloc[0], str):
                df['timestamp'] = pd.to_datetime(df['timestamp'])
            
            # Extract features
            features = {}
            
            # Add app usage features
            app_features = self._extract_app_usage_features(df)
            features.update(app_features)
            
            # Add time-based features
            time_features = self._extract_time_patterns(df)
            features.update(time_features)
            
            # Add workflow sequence features
            workflow_features = self._extract_workflow_sequences(df)
            features.update(workflow_features)
            
            # Add device-specific features if available
            if device_id:
                device_features = self._extract_device_features(device_id)
                features.update(device_features)
                
                # Also add system health features if device ID is available
                health_features = self._extract_system_health_features(device_id)
                features.update(health_features)
            
            # Add session context features if available
            if session_id:
                session_features = self._extract_session_features(session_id)
                features.update(session_features)
            
            # Save the feature vector if a user ID is provided
            if user_id:
                self._save_feature_vector(features, user_id)
            
            return features
            
        except Exception as e:
            logger.error(f"Error processing activities: {str(e)}")
            return self._create_empty_feature_vector()
    
    def _create_empty_feature_vector(self):
        """Create an empty feature vector with zeros"""
        return {
            'app_usage': {},
            'time_of_day': datetime.now().hour,
            'day_of_week': datetime.now().weekday(),
            'features_available': False
        }
    
    def _extract_app_usage_features(self, df):
        """Extract features related to application usage patterns"""
        try:
            # Group by application name and sum durations
            app_usage = df.groupby('application_name')['duration'].sum()
            
            # Convert to dictionary
            app_usage_dict = app_usage.to_dict()
            
            # Calculate total time
            total_time = sum(app_usage_dict.values())
            
            # Normalize app usage (percentage of time)
            if total_time > 0:
                app_usage_normalized = {app: time / total_time * 100 for app, time in app_usage_dict.items()}
            else:
                app_usage_normalized = app_usage_dict
            
            # Categorize apps into productivity groups (simplified)
            productivity_categories = {
                'high': ['code', 'editor', 'terminal', 'office', 'excel', 'word', 'powerpoint'],
                'medium': ['browser', 'mail', 'outlook', 'teams', 'slack', 'discord'],
                'low': ['games', 'youtube', 'netflix', 'spotify', 'music']
            }
            
            # Calculate time spent per category
            category_time = {cat: 0 for cat in productivity_categories.keys()}
            
            for app, time in app_usage_dict.items():
                app_lower = app.lower()
                for category, keywords in productivity_categories.items():
                    if any(keyword in app_lower for keyword in keywords):
                        category_time[category] += time
                        break
            
            # Add productivity category percentages
            productivity_percentages = {}
            if total_time > 0:
                productivity_percentages = {f'{cat}_productivity': time / total_time * 100 
                                           for cat, time in category_time.items()}
            
            return {
                'app_usage': app_usage_normalized,
                'total_tracked_time': total_time,
                **productivity_percentages
            }
            
        except Exception as e:
            logger.error(f"Error extracting app usage features: {str(e)}")
            return {'app_usage': {}}
    
    def _extract_time_patterns(self, df):
        """Extract features related to timing patterns"""
        try:
            # Get the time range of activities
            if not df.empty:
                start_time = df['timestamp'].min()
                end_time = df['timestamp'].max()
                
                # Extract hour of day and day of week
                hours = df['timestamp'].dt.hour.value_counts().to_dict()
                days = df['timestamp'].dt.dayofweek.value_counts().to_dict()
                
                # Calculate activity density (activities per hour)
                if (end_time - start_time).total_seconds() > 0:
                    hours_span = (end_time - start_time).total_seconds() / 3600
                    activity_density = len(df) / max(1, hours_span)
                else:
                    activity_density = 0
                
                # Time of day features
                morning_activities = df[df['timestamp'].dt.hour.between(5, 11)].shape[0]
                afternoon_activities = df[df['timestamp'].dt.hour.between(12, 17)].shape[0]
                evening_activities = df[df['timestamp'].dt.hour.between(18, 23)].shape[0]
                night_activities = df[~df['timestamp'].dt.hour.between(5, 23)].shape[0]
                
                total_activities = len(df)
                time_distribution = {}
                
                if total_activities > 0:
                    time_distribution = {
                        'morning_pct': morning_activities / total_activities * 100,
                        'afternoon_pct': afternoon_activities / total_activities * 100,
                        'evening_pct': evening_activities / total_activities * 100,
                        'night_pct': night_activities / total_activities * 100
                    }
                
                # Get current time features
                now = datetime.now()
                
                return {
                    'time_of_day': now.hour,
                    'day_of_week': now.weekday(),
                    'is_weekend': 1 if now.weekday() >= 5 else 0,
                    'activity_hours': hours,
                    'activity_days': days,
                    'activity_density': activity_density,
                    **time_distribution
                }
            else:
                now = datetime.now()
                return {
                    'time_of_day': now.hour,
                    'day_of_week': now.weekday(),
                    'is_weekend': 1 if now.weekday() >= 5 else 0
                }
                
        except Exception as e:
            logger.error(f"Error extracting time patterns: {str(e)}")
            now = datetime.now()
            return {
                'time_of_day': now.hour,
                'day_of_week': now.weekday(),
                'is_weekend': 1 if now.weekday() >= 5 else 0
            }
    
    def _extract_workflow_sequences(self, df):
        """Extract sequences of actions that might represent workflows"""
        try:
            # Need at least 2 activities to form a sequence
            if len(df) < 2:
                return {'workflows': {}, 'common_transitions': {}}
            
            # Sort by timestamp
            df = df.sort_values('timestamp')
            
            # Extract app transitions
            app_sequence = df['application_name'].tolist()
            transitions = {}
            
            # Count transitions between apps
            for i in range(len(app_sequence) - 1):
                from_app = app_sequence[i]
                to_app = app_sequence[i + 1]
                transition_key = f"{from_app} -> {to_app}"
                
                if transition_key not in transitions:
                    transitions[transition_key] = 0
                transitions[transition_key] += 1
            
            # Extract most common transitions (up to 5)
            sorted_transitions = dict(sorted(transitions.items(), key=lambda item: item[1], reverse=True)[:5])
            
            # Try to identify workflows (simplified)
            # A workflow is a sequence of 3+ apps that occur together multiple times
            workflows = {}
            if len(app_sequence) >= 3:
                for i in range(len(app_sequence) - 2):
                    workflow = f"{app_sequence[i]} -> {app_sequence[i+1]} -> {app_sequence[i+2]}"
                    if workflow not in workflows:
                        workflows[workflow] = 0
                    workflows[workflow] += 1
            
            sorted_workflows = dict(sorted(workflows.items(), key=lambda item: item[1], reverse=True)[:3])
            
            return {
                'common_transitions': sorted_transitions,
                'workflows': sorted_workflows
            }
            
        except Exception as e:
            logger.error(f"Error extracting workflow sequences: {str(e)}")
            return {'workflows': {}, 'common_transitions': {}}
    
    def _extract_device_features(self, device_id):
        """Extract features specific to the device"""
        # In client-side implementation, this would get data from localStorage
        # Here we just provide a placeholder structure
        return {
            'device_id': device_id,
            'device_features_available': True
        }
    
    def _extract_system_health_features(self, device_id):
        """Extract system health metrics for the device"""
        # In client-side implementation, this would get data from localStorage
        # Here we just provide a placeholder structure
        return {
            'system_health_metrics': {
                'cpu_usage': 0,
                'memory_usage': 0,
                'disk_usage': 0
            },
            'system_health_available': False
        }
    
    def _extract_session_features(self, session_id):
        """Extract features related to the current session"""
        # In client-side implementation, this would get data from localStorage
        # Here we just provide a placeholder structure
        return {
            'session_id': session_id,
            'session_features_available': True
        }
    
    def _save_feature_vector(self, features, user_id=None):
        """Save the generated feature vector (client-side implementation would save to localStorage)"""
        # In client-side implementation, this would save to localStorage
        # Here we just log that it would be saved
        logger.info(f"Feature vector generated (would be saved to localStorage for user {user_id})")
        return True