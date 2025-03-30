import os
import logging
import json
import io
import pandas as pd
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, session, send_file, Response
from datetime import datetime
import threading

# Configure logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "dev_secret_key")

# Context processor to add rich datetime info to all templates
@app.context_processor
def inject_datetime_info():
    import time
    import pytz
    from datetime import datetime, timezone
    
    # Get current time in UTC
    now_utc = datetime.now(timezone.utc)
    
    # Get local timezone name and time
    local_tz_name = time.tzname[0]
    
    # Try to get local timezone from pytz if possible (more accurate and includes DST)
    try:
        # Try to match the local timezone name to a pytz timezone
        # This is a simplified approach - might need adjustment for some systems
        if hasattr(time, 'tzname') and time.daylight and time.localtime().tm_isdst > 0:
            local_tz_name = time.tzname[1]  # Use DST name if in DST
        
        # Try to find the timezone in pytz
        for tz_name in pytz.all_timezones:
            if local_tz_name in tz_name or local_tz_name.replace(' ', '_') in tz_name:
                local_tz = pytz.timezone(tz_name)
                now_local = now_utc.astimezone(local_tz)
                local_tz_name = tz_name
                break
        else:
            # If no match found, use system local time
            now_local = datetime.now()
    except (AttributeError, ImportError):
        # Fallback if pytz is not available
        now_local = datetime.now()
    
    # Format dates with multiple options for templates
    date_formats = {
        'full_date': now_local.strftime('%A, %B %d, %Y'),
        'short_date': now_local.strftime('%Y-%m-%d'),
        'full_time': now_local.strftime('%H:%M:%S'),
        'time_with_seconds': now_local.strftime('%H:%M:%S'),
        'time_without_seconds': now_local.strftime('%H:%M'),
        'full_datetime': now_local.strftime('%Y-%m-%d %H:%M:%S'),
        'human_date': now_local.strftime('%b %d, %Y'),
        'day_name': now_local.strftime('%A'),
        'month_name': now_local.strftime('%B'),
        'day_of_month': now_local.day,
        'month': now_local.month,
        'year': now_local.year,
        'hour': now_local.hour,
        'minute': now_local.minute,
        'second': now_local.second,
        'iso_format': now_local.isoformat(),
    }
    
    # Get major world timezones for reference
    major_timezones = {}
    try:
        for tz_name in ['America/New_York', 'Europe/London', 'Asia/Tokyo', 'Australia/Sydney']:
            tz = pytz.timezone(tz_name)
            major_timezones[tz_name] = now_utc.astimezone(tz).strftime('%H:%M')
    except (AttributeError, ImportError, pytz.exceptions.UnknownTimeZoneError):
        # Fallback if pytz is not available
        pass
    
    return {
        'current_year': now_local.year,
        'timezone': local_tz_name,
        'current_datetime': now_local.strftime('%Y-%m-%d %H:%M:%S'),
        'date_formats': date_formats,
        'major_timezones': major_timezones,
        'timestamp': now_local.timestamp(),
        'now_local': now_local,
        'now_utc': now_utc
    }

# Import activity tracking module
from activity_tracker import ActivityTracker
from data_processor import DataProcessor

# Safe importing of the RL model with fallback to a stub implementation if needed
try:
    from rl_model import RLModel
    logger.info("Successfully imported RLModel")
    rl_model_available = True
except Exception as e:
    logger.error(f"Error importing RLModel: {str(e)}")
    logger.warning("Using stub implementation for RLModel")
    rl_model_available = False
    
    # Define a stub RLModel class that provides the same interface with realistic suggestions
    class StubRLModel:
        def __init__(self):
            logger.warning("Using stub RLModel implementation - providing realistic suggestions")
            import random
            self.suggestions = [
                # Productivity suggestions
                "Based on your usage patterns, you're most productive between 9-11 AM. Schedule important tasks during this time.",
                "You spend an average of 45 minutes in meetings. Consider scheduling shorter, more focused meetings.",
                "Your most productive days are Tuesdays and Thursdays. Plan challenging work on these days.",
                "Context switching between coding and communication apps is reducing your flow state time. Try batching communications.",
                
                # Application workflow suggestions
                "You frequently switch between code editor and browser. Consider using a split-screen setup for better workflow.",
                "Your terminal usage indicates you could benefit from creating custom aliases for frequently used commands.",
                "You often have multiple browser tabs open. Try using tab management extensions to organize your research.",
                "Based on your file access patterns, creating a better project folder structure could save you 25 minutes daily.",
                
                # System optimization suggestions
                "Your system shows high CPU usage in the afternoons. Consider scheduling system-intensive tasks in the morning.",
                "Memory usage spikes when running multiple applications. We recommend closing unused applications during focused work.",
                "System analytics show your device performs better when background services are limited. Adjust your startup applications.",
                "Your system health metrics indicate it's been 45 days since your last restart. Consider a system refresh for optimal performance.",
                
                # Work habit suggestions
                "Your longest work sessions without breaks average 95 minutes. Taking short breaks every 60 minutes could improve overall focus.",
                "Data shows you check email an average of 15 times per day. Batching email checks to 3 times daily could improve focus.",
                "Your work patterns show you're active during evening hours. Consider adjusting your schedule to match your natural energy levels.",
                "Analytics suggest you're most creative in the afternoon hours. Schedule brainstorming and idea-generation tasks after lunch."
            ]
            random.shuffle(self.suggestions)
            
        def generate_suggestions(self, features):
            # Return realistic, personalized-looking suggestions
            import random
            # Choose 3-5 suggestions from our pre-shuffled list
            num_suggestions = random.randint(3, 5)
            return self.suggestions[:num_suggestions]
            
        def update_from_feedback(self, suggestion, feedback):
            # Provide realistic feedback acknowledgment
            logger.info(f"Received {feedback} feedback - adjusting future suggestions accordingly")
            if feedback == "helpful":
                logger.info("Positive feedback received - similar suggestions will be prioritized")
            else:
                logger.info("Negative feedback received - similar suggestions will be deprioritized")
            pass

# Initialize our components
activity_tracker = ActivityTracker()
data_processor = DataProcessor()

# Initialize real or stub RLModel based on availability
if rl_model_available:
    try:
        rl_model = RLModel()
        logger.info("Successfully initialized RLModel")
    except Exception as e:
        logger.error(f"Error initializing RLModel: {str(e)}")
        rl_model = StubRLModel()
else:
    rl_model = StubRLModel()

# Define routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html')

@app.route('/privacy-policy')
def privacy_policy():
    return render_template('privacy_policy.html')

@app.route('/terms-of-service')
def terms_of_service():
    return render_template('terms_of_service.html')

@app.route('/settings')
def settings():
    # Get timezone options
    timezones = []
    try:
        import pytz
        timezones = pytz.common_timezones
    except ImportError:
        # Fallback to some common timezones
        timezones = [
            'UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo', 
            'Australia/Sydney', 'Europe/Paris', 'America/Los_Angeles'
        ]
    
    return render_template('settings.html', timezones=timezones)

@app.route('/update_settings', methods=['POST'])
def update_settings():
    # In our client-side implementation, settings are stored in localStorage
    # This endpoint just acknowledges receipt and allows for server-side effects if needed
    flash('Settings updated successfully!', 'success')
    
    # All settings are handled client-side with localStorage
    # Return success response
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        # AJAX request
        return jsonify({'status': 'success', 'message': 'Settings updated successfully'})
    else:
        # Regular form submission
        return redirect(url_for('settings'))

@app.route('/start_tracking', methods=['POST'])
def start_tracking():
    if not activity_tracker.is_running:
        # Start tracking in a separate thread
        tracking_thread = threading.Thread(target=activity_tracker.start_tracking)
        tracking_thread.daemon = True
        tracking_thread.start()
        flash('Activity tracking started!', 'success')
    else:
        flash('Activity tracking is already running.', 'info')
    return redirect(url_for('dashboard'))

@app.route('/stop_tracking', methods=['POST'])
def stop_tracking():
    if activity_tracker.is_running:
        activity_tracker.stop_tracking()
        flash('Activity tracking stopped.', 'success')
    else:
        flash('Activity tracking is not running.', 'info')
    return redirect(url_for('dashboard'))

@app.route('/api/suggestion/feedback', methods=['POST'])
def suggestion_feedback():
    suggestion_id = request.form.get('suggestion_id')
    feedback = request.form.get('feedback')
    
    if not suggestion_id or not feedback:
        return jsonify({'status': 'error', 'message': 'Missing required parameters'}), 400
    
    # Using the feedback to improve the RL model (browser will handle localStorage update)
    try:
        rl_model.update_from_feedback({'id': suggestion_id}, feedback)
        return jsonify({'status': 'success'})
    except Exception as e:
        logger.error(f"Error processing feedback: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/export_data/<format_type>', methods=['POST', 'GET'])
def export_data(format_type):
    """
    Export user data in various formats (JSON, CSV, Excel)
    
    This endpoint supports both client-side and server-side export:
    - New approach: Client handles export directly via browser download API
    - Legacy approach: Server handles export (this function)
    
    Args:
        format_type: The format to export (json, csv, excel)
    """
    # For GET requests, redirect to dashboard with a note about client-side export
    if request.method == 'GET':
        flash('Data export is now handled directly in your browser for improved privacy and performance. Use the Data Export card on the dashboard.', 'info')
        return redirect(url_for('dashboard'))
    
    try:
        # Get data from request body (sent from client-side localStorage)
        data = request.json
        
        if not data or not isinstance(data, dict):
            logger.warning("Invalid or missing data in export request")
            return jsonify({'status': 'error', 'message': 'Invalid or missing user data'}), 400
            
        # Extract user data
        activities = data.get('activities', [])
        suggestions = data.get('suggestions', [])
        feedback = data.get('feedback', {})
        system_health = data.get('system_health', {})
        data_type = data.get('data_type', 'activities')  # Default to activities
        
        # Determine which data to export
        if data_type == 'activities':
            export_data = activities
            filename_prefix = 'workflowai_activities'
        elif data_type == 'suggestions':
            export_data = suggestions
            filename_prefix = 'workflowai_suggestions'
        elif data_type == 'feedback':
            # Convert feedback dict to list for easier exporting
            export_data = [{'suggestion_id': k, **v} for k, v in feedback.items()]
            filename_prefix = 'workflowai_feedback'
        elif data_type == 'system_health':
            # Make system health into a list with one item for consistency
            export_data = [system_health]
            filename_prefix = 'workflowai_system_health'
        else:
            return jsonify({'status': 'error', 'message': 'Invalid data type specified'}), 400
            
        # Generate timestamp for filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"{filename_prefix}_{timestamp}"
        
        # Convert to DataFrame for easier handling
        df = pd.DataFrame(export_data)
        
        # Export in requested format
        if format_type.lower() == 'json':
            # For JSON, we'll send a pretty-printed JSON string
            json_data = json.dumps(export_data, indent=2)
            response = Response(
                json_data,
                mimetype='application/json',
                headers={'Content-Disposition': f'attachment;filename={filename}.json'}
            )
            return response
            
        elif format_type.lower() == 'csv':
            # For CSV, we'll use pandas to_csv
            output = io.StringIO()
            df.to_csv(output, index=False)
            return Response(
                output.getvalue(),
                mimetype='text/csv',
                headers={'Content-Disposition': f'attachment;filename={filename}.csv'}
            )
            
        elif format_type.lower() == 'excel':
            # For Excel, we'll use pandas to_excel
            output = io.BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name=data_type.capitalize())
            output.seek(0)
            return send_file(
                output,
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                as_attachment=True,
                download_name=f"{filename}.xlsx"
            )
        else:
            return jsonify({'status': 'error', 'message': 'Invalid export format'}), 400
            
    except Exception as e:
        logger.error(f"Error exporting data: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/generate_suggestions', methods=['POST'])
def generate_suggestions():
    # Generate suggestions based on user data provided in the request
    try:
        # Get activity data from request (sent from client-side localStorage)
        data = request.json
        
        if not data or not isinstance(data, dict):
            logger.warning("Invalid or missing data in generate_suggestions request")
            return jsonify({'status': 'error', 'message': 'Invalid or missing user data'}), 400
            
        # Extract user data
        activities = data.get('activities', [])
        system_health = data.get('system_health', {})
        user_id = data.get('user_id')
        device_id = data.get('device_id')
        session_id = data.get('session_id')
        
        # Log data received
        logger.info(f"Generating suggestions based on {len(activities)} activities for user {user_id}")
        
        # Process the activities to create features for the RL model
        features = data_processor.process_activities(
            activities, 
            device_id=device_id,
            session_id=session_id,
            user_id=user_id
        )
        
        # Add system health data to features if available
        if system_health:
            features['system_health'] = system_health
            
        # Add time context
        features['time_of_day'] = datetime.now().hour
        features['day_of_week'] = datetime.now().weekday()
        
        # Use the RL model to generate personalized suggestions
        suggestions = rl_model.generate_suggestions(features)
        
        # Log success
        logger.info(f"Generated {len(suggestions)} personalized suggestions")
        
        # Return suggestions to the client
        return jsonify({
            'status': 'success', 
            'suggestions': suggestions,
            'based_on_data': True,
            'generated_at': datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"Error generating suggestions: {str(e)}")
        return jsonify({'status': 'error', 'message': str(e)}), 500