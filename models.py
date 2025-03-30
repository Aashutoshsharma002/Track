from app import db
from datetime import datetime
from sqlalchemy.ext.declarative import declared_attr
import uuid
import json

# ==================== Mixins for common fields ====================

class TimestampMixin:
    """Mixin for adding timestamp fields to all models"""
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class UUIDMixin:
    """Mixin for adding UUID field to models"""
    uuid = db.Column(db.String(36), default=lambda: str(uuid.uuid4()), unique=True)


class UserOwnerMixin:
    """Mixin for adding user_id field to models"""
    @declared_attr
    def user_id(cls):
        return db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'), nullable=True, index=True)


# ==================== Core Models ====================

class User(db.Model, TimestampMixin, UUIDMixin):
    """User model for authentication and identification"""
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256))
    full_name = db.Column(db.String(100))
    organization = db.Column(db.String(100))
    is_active = db.Column(db.Boolean, default=True)
    role = db.Column(db.String(20), default='user')  # user, admin, analyst
    last_login = db.Column(db.DateTime)
    
    # User preferences
    timezone = db.Column(db.String(50), default='UTC')
    preferences = db.Column(db.JSON, default=lambda: {
        'theme': 'dark',
        'dashboard_layout': 'standard',
        'notification_frequency': 'daily',
        'language': 'en'
    })
    
    # Relationships
    activities = db.relationship('Activity', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    suggestions = db.relationship('Suggestion', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    tracking_settings = db.relationship('TrackingSettings', backref='user', uselist=False, cascade='all, delete-orphan')
    devices = db.relationship('Device', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    dashboards = db.relationship('Dashboard', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    reports = db.relationship('Report', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    goals = db.relationship('ProductivityGoal', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    tags = db.relationship('Tag', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    notifications = db.relationship('Notification', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<User {self.username}>'


class Device(db.Model, TimestampMixin, UUIDMixin, UserOwnerMixin):
    """Device used by a user to access the system"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    device_type = db.Column(db.String(50))  # desktop, laptop, mobile, tablet
    os = db.Column(db.String(50))  # windows, macos, linux, android, ios
    os_version = db.Column(db.String(50))
    browser = db.Column(db.String(50))
    browser_version = db.Column(db.String(50))
    processor = db.Column(db.String(100))
    memory = db.Column(db.Float)  # GB
    last_active = db.Column(db.DateTime)
    is_tracking_enabled = db.Column(db.Boolean, default=True)
    hardware_id = db.Column(db.String(100), unique=True)  # Unique hardware identifier
    
    # Relationships
    activities = db.relationship('Activity', backref='device', lazy='dynamic')
    sessions = db.relationship('Session', backref='device', lazy='dynamic')
    health_metrics = db.relationship('SystemHealth', backref='device', lazy='dynamic')
    
    def __repr__(self):
        return f'<Device {self.name} ({self.device_type})>'


class Session(db.Model, TimestampMixin, UUIDMixin, UserOwnerMixin):
    """User session information"""
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.Integer, db.ForeignKey('device.id'), nullable=True)
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    end_time = db.Column(db.DateTime)
    duration = db.Column(db.Integer)  # in seconds
    is_productive = db.Column(db.Boolean)
    productivity_score = db.Column(db.Float, default=0.0)  # 0.0 to 1.0
    context = db.Column(db.String(100))  # work, personal, meeting, etc.
    location = db.Column(db.String(255))  # Where the session occurred
    
    # Relationships
    activities = db.relationship('Activity', backref='session', lazy='dynamic')
    
    def __repr__(self):
        return f'<Session {self.id} ({self.start_time})>'


class Activity(db.Model, TimestampMixin, UUIDMixin, UserOwnerMixin):
    """User activity record"""
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.Integer, db.ForeignKey('device.id'), nullable=True)
    session_id = db.Column(db.Integer, db.ForeignKey('session.id'), nullable=True)
    activity_type = db.Column(db.String(50), nullable=False, index=True)  # app_usage, file_operation, web_browsing, keyboard, mouse
    application_name = db.Column(db.String(100), index=True)
    window_title = db.Column(db.String(255))
    file_path = db.Column(db.String(255))
    action = db.Column(db.String(50), index=True)  # open, close, edit, etc.
    url = db.Column(db.String(2048))  # For web browsing
    duration = db.Column(db.Integer, default=0)  # in seconds
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    productivity_score = db.Column(db.Float)  # 0 to 1, how productive this activity is
    activity_data = db.Column(db.JSON)  # Additional activity-specific data (renamed from metadata)
    idle_time = db.Column(db.Integer, default=0)  # Idle time in seconds
    
    # Relationships
    tags = db.relationship('ActivityTag', backref='activity', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Activity {self.activity_type} - {self.application_name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'activity_type': self.activity_type,
            'application_name': self.application_name,
            'window_title': self.window_title,
            'file_path': self.file_path,
            'action': self.action,
            'url': self.url,
            'duration': self.duration,
            'timestamp': self.timestamp,
            'productivity_score': self.productivity_score,
            'activity_data': self.activity_data,
            'idle_time': self.idle_time
        }


class ApplicationCategory(db.Model, TimestampMixin):
    """Categories for applications to group similar apps"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    productivity_score = db.Column(db.Float, default=0.5)  # Default productivity score for this category
    icon = db.Column(db.String(50))  # Icon class or identifier
    color = db.Column(db.String(7), default='#007bff')  # Hex color for UI
    
    # Relationships
    applications = db.relationship('Application', backref='category', lazy='dynamic')
    
    def __repr__(self):
        return f'<ApplicationCategory {self.name}>'


class Application(db.Model, TimestampMixin):
    """Known applications and their productivity scores"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    description = db.Column(db.Text)
    category_id = db.Column(db.Integer, db.ForeignKey('application_category.id'), nullable=True)
    productivity_score = db.Column(db.Float)  # 0 to 1, how productive this app typically is
    common_processes = db.Column(db.JSON)  # Process names associated with this application
    executable_path = db.Column(db.String(255))  # Typical location of the executable
    is_browser = db.Column(db.Boolean, default=False)  # Whether this is a web browser
    
    def __repr__(self):
        return f'<Application {self.name}>'


class Website(db.Model, TimestampMixin):
    """Known websites and their productivity scores"""
    id = db.Column(db.Integer, primary_key=True)
    domain = db.Column(db.String(255), unique=True, nullable=False)
    name = db.Column(db.String(100))
    description = db.Column(db.Text)
    category = db.Column(db.String(50))  # social, productivity, entertainment, shopping, etc.
    productivity_score = db.Column(db.Float)  # 0 to 1, how productive this website typically is
    is_blacklisted = db.Column(db.Boolean, default=False)  # Whether this site should be blocked from tracking
    
    def __repr__(self):
        return f'<Website {self.domain}>'


class Tag(db.Model, TimestampMixin, UserOwnerMixin):
    """User-defined tags for categorizing activities"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    color = db.Column(db.String(7), default='#007bff')  # Hex color code
    description = db.Column(db.String(255))
    
    # Relationships
    activity_tags = db.relationship('ActivityTag', backref='tag_reference', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Tag {self.name}>'


class ActivityTag(db.Model):
    """Many-to-many relationship between activities and tags"""
    activity_id = db.Column(db.Integer, db.ForeignKey('activity.id', ondelete='CASCADE'), primary_key=True)
    tag_id = db.Column(db.Integer, db.ForeignKey('tag.id', ondelete='CASCADE'), primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<ActivityTag {self.activity_id}-{self.tag_id}>'


class Suggestion(db.Model, TimestampMixin, UUIDMixin, UserOwnerMixin):
    """Workflow improvement suggestions"""
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    source = db.Column(db.String(50))  # rule_based, reinforcement_learning, predictive
    category = db.Column(db.String(50))  # productivity, focus, organization, time_management, etc.
    priority = db.Column(db.Integer, default=1)  # 1-5, with 5 being highest priority
    feedback = db.Column(db.String(20))  # positive, negative, neutral
    implemented = db.Column(db.Boolean, default=False)
    dismissed = db.Column(db.Boolean, default=False)
    
    def __repr__(self):
        return f'<Suggestion {self.id}>'


class ProductivityGoal(db.Model, TimestampMixin, UUIDMixin, UserOwnerMixin):
    """User productivity goals"""
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    goal_type = db.Column(db.String(50))  # time_spent, activity_count, productivity_score
    target_value = db.Column(db.Float, nullable=False)
    current_value = db.Column(db.Float, default=0)
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date)
    recurrence = db.Column(db.String(20))  # daily, weekly, monthly, custom
    is_completed = db.Column(db.Boolean, default=False)
    progress = db.Column(db.Float, default=0.0)  # 0.0 to 1.0, calculated progress towards goal
    
    def __repr__(self):
        return f'<ProductivityGoal {self.title}>'


class TrackingSettings(db.Model, TimestampMixin, UserOwnerMixin):
    """User settings for activity tracking"""
    id = db.Column(db.Integer, primary_key=True)
    track_applications = db.Column(db.Boolean, default=True)
    track_files = db.Column(db.Boolean, default=True)
    track_browsing = db.Column(db.Boolean, default=False)
    track_idle_time = db.Column(db.Boolean, default=True)
    track_keyboard = db.Column(db.Boolean, default=False)
    track_mouse = db.Column(db.Boolean, default=False)
    learning_enabled = db.Column(db.Boolean, default=True)
    privacy_level = db.Column(db.String(20), default='standard')  # minimal, standard, detailed
    excluded_apps = db.Column(db.JSON, default=list)  # List of apps to exclude from tracking
    excluded_websites = db.Column(db.JSON, default=list)  # List of websites to exclude from tracking
    excluded_directories = db.Column(db.JSON, default=list)  # List of directories to exclude from tracking
    work_hours_start = db.Column(db.Time)
    work_hours_end = db.Column(db.Time)
    work_days = db.Column(db.JSON, default=lambda: [0, 1, 2, 3, 4])  # 0=Monday, 6=Sunday
    
    def __repr__(self):
        return f'<TrackingSettings for user {self.user_id}>'


class FeatureVector(db.Model, TimestampMixin, UserOwnerMixin):
    """Feature vectors for machine learning models"""
    id = db.Column(db.Integer, primary_key=True)
    features = db.Column(db.Text)  # JSON encoded feature vector
    feature_type = db.Column(db.String(50), default='general')  # Type of features (general, app_usage, time_patterns, etc.)
    
    def __repr__(self):
        return f'<FeatureVector {self.id}>'

    def get_features(self):
        """Decode and return the feature vector"""
        try:
            return json.loads(self.features)
        except:
            return {}


class RLState(db.Model, TimestampMixin):
    """Reinforcement learning model state"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    model_weights = db.Column(db.Text)  # Serialized model weights
    model_type = db.Column(db.String(50), default='default')  # The type of model
    model_version = db.Column(db.String(20))  # Version information
    hyperparameters = db.Column(db.JSON)  # Model hyperparameters
    
    def __repr__(self):
        return f'<RLState {self.id}>'


class Dashboard(db.Model, TimestampMixin, UUIDMixin, UserOwnerMixin):
    """User customizable dashboards"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    layout = db.Column(db.JSON)  # Dashboard layout configuration
    is_default = db.Column(db.Boolean, default=False)
    
    # Relationships
    widgets = db.relationship('DashboardWidget', backref='dashboard', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Dashboard {self.name}>'


class DashboardWidget(db.Model, TimestampMixin):
    """Widgets on a dashboard"""
    id = db.Column(db.Integer, primary_key=True)
    dashboard_id = db.Column(db.Integer, db.ForeignKey('dashboard.id', ondelete='CASCADE'), nullable=False)
    widget_type = db.Column(db.String(50), nullable=False)  # chart, metric, list, suggestion, etc.
    title = db.Column(db.String(100))
    config = db.Column(db.JSON)  # Widget configuration
    position_x = db.Column(db.Integer, default=0)
    position_y = db.Column(db.Integer, default=0)
    width = db.Column(db.Integer, default=4)
    height = db.Column(db.Integer, default=4)
    
    def __repr__(self):
        return f'<DashboardWidget {self.widget_type} - {self.title}>'


class Report(db.Model, TimestampMixin, UUIDMixin, UserOwnerMixin):
    """Scheduled or one-time productivity reports"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    report_type = db.Column(db.String(50))  # daily, weekly, monthly, custom
    schedule = db.Column(db.String(50))  # cron expression for scheduled reports
    template = db.Column(db.Text)  # HTML template for the report
    last_generated = db.Column(db.DateTime)
    recipients = db.Column(db.JSON)  # List of email addresses
    data_config = db.Column(db.JSON)  # Configuration for what data to include
    
    def __repr__(self):
        return f'<Report {self.name}>'


class Notification(db.Model, TimestampMixin, UserOwnerMixin):
    """System or user notifications"""
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text)
    notification_type = db.Column(db.String(50))  # system, suggestion, goal, etc.
    priority = db.Column(db.String(20), default='normal')  # low, normal, high, urgent
    is_read = db.Column(db.Boolean, default=False)
    action_url = db.Column(db.String(255))  # URL for the action button
    expires_at = db.Column(db.DateTime)  # When the notification expires
    
    def __repr__(self):
        return f'<Notification {self.title}>'


class APIKey(db.Model, TimestampMixin, UserOwnerMixin):
    """API keys for programmatic access"""
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    key_hash = db.Column(db.String(256), nullable=False)  # Hashed API key
    scopes = db.Column(db.JSON)  # Authorized scopes for this key
    expires_at = db.Column(db.DateTime)
    last_used_at = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    
    def __repr__(self):
        return f'<APIKey {self.name}>'


class SystemHealth(db.Model, TimestampMixin):
    """System health monitoring data"""
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.Integer, db.ForeignKey('device.id'), nullable=True)
    cpu_usage = db.Column(db.Float)  # Percentage
    memory_usage = db.Column(db.Float)  # Percentage
    disk_usage = db.Column(db.Float)  # Percentage
    network_in = db.Column(db.Float)  # Bytes
    network_out = db.Column(db.Float)  # Bytes
    battery_level = db.Column(db.Float)  # Percentage
    processes_count = db.Column(db.Integer)  # Number of running processes
    
    def __repr__(self):
        return f'<SystemHealth {self.id}>'


class AuditLog(db.Model, TimestampMixin):
    """Audit logs for tracking important system events"""
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    action = db.Column(db.String(100), nullable=False)
    resource_type = db.Column(db.String(50))  # user, activity, suggestion, etc.
    resource_id = db.Column(db.Integer)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.String(255))
    details = db.Column(db.JSON)
    
    def __repr__(self):
        return f'<AuditLog {self.action} by user_id={self.user_id}>'


class FileActivity(db.Model, TimestampMixin, UserOwnerMixin):
    """Detailed file activity tracking"""
    id = db.Column(db.Integer, primary_key=True)
    activity_id = db.Column(db.Integer, db.ForeignKey('activity.id'), nullable=True)
    file_path = db.Column(db.String(512), nullable=False)
    file_name = db.Column(db.String(255), nullable=False)
    file_extension = db.Column(db.String(20))
    file_size = db.Column(db.BigInteger)  # Size in bytes
    action = db.Column(db.String(50))  # create, modify, delete, rename, etc.
    old_path = db.Column(db.String(512))  # Used for rename operations
    
    def __repr__(self):
        return f'<FileActivity {self.action} {self.file_name}>'
