import os
import time
import logging
import psutil
import platform
import json
import uuid
import socket
from datetime import datetime
import threading

logger = logging.getLogger(__name__)

class ActivityTracker:
    def __init__(self):
        self.is_running = False
        self.stop_event = threading.Event()
        self.current_processes = {}
        self.tracked_applications = set()
        self.sample_interval = 5  # seconds
        self.current_device = None
        self.current_session = None
        self.device_id = None
        self.session_id = None
        
    def get_device_info(self):
        """Get current device information"""
        device_info = {
            'name': socket.gethostname(),
            'device_type': self._detect_device_type(),
            'os': platform.system(),
            'os_version': platform.version(),
            'processor': platform.processor(),
            'memory': psutil.virtual_memory().total / (1024 * 1024 * 1024),  # GB
            'hardware_id': self._get_hardware_id()
        }
        return device_info
    
    def _detect_device_type(self):
        """Detect device type based on system information"""
        system = platform.system()
        
        # Check if running on a mobile device
        if system == 'Android' or system == 'iOS':
            return 'mobile'
            
        # Try to detect if it's a laptop or desktop on other systems
        if system == 'Windows' or system == 'Darwin' or system == 'Linux':
            try:
                # Check for battery - laptops have batteries
                battery = psutil.sensors_battery()
                if battery:
                    return 'laptop'
                else:
                    return 'desktop'
            except (AttributeError, NotImplementedError):
                # If we can't check battery, guess based on processor
                if platform.processor().lower().find('mobile') >= 0:
                    return 'laptop'
                else:
                    return 'desktop'
        
        # Default case
        return 'desktop'
    
    def _get_hardware_id(self):
        """Generate or retrieve a unique hardware ID"""
        system = platform.system()
        
        try:
            if system == 'Windows':
                # Try to get Windows serial number
                import subprocess
                result = subprocess.check_output('wmic csproduct get uuid').decode().split('\n')[1].strip()
                return result
            elif system == 'Darwin':
                # Try to get macOS serial number
                import subprocess
                result = subprocess.check_output(['ioreg', '-rd1', '-c', 'IOPlatformExpertDevice']).decode()
                serial = [line for line in result.split('\n') if 'IOPlatformSerialNumber' in line]
                if serial:
                    return serial[0].split('"')[-2]
            elif system == 'Linux':
                # Try to get machine-id on Linux
                try:
                    with open('/etc/machine-id', 'r') as f:
                        return f.read().strip()
                except:
                    pass
        except:
            logger.warning("Could not get hardware ID using system methods")
            
        # If all else fails, generate a UUID based on the hostname and save it
        hw_id_file = os.path.expanduser('~/.workflowai_hwid')
        try:
            if os.path.exists(hw_id_file):
                with open(hw_id_file, 'r') as f:
                    return f.read().strip()
            else:
                # Generate a new one
                hw_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, socket.gethostname()))
                with open(hw_id_file, 'w') as f:
                    f.write(hw_id)
                return hw_id
        except:
            # Last resort, generate a UUID each time (not ideal)
            return str(uuid.uuid4())
        
    def get_active_window_info(self):
        """Get information about the currently active window based on the platform"""
        active_window_info = {
            'application_name': '',
            'window_title': '',
            'pid': None
        }
        
        try:
            if platform.system() == 'Windows':
                # For Windows using pywin32 (which needs to be imported here)
                try:
                    import win32gui
                    import win32process
                    
                    window = win32gui.GetForegroundWindow()
                    if window:
                        active_window_info['window_title'] = win32gui.GetWindowText(window)
                        _, pid = win32process.GetWindowThreadProcessId(window)
                        active_window_info['pid'] = pid
                        
                        process = psutil.Process(pid)
                        active_window_info['application_name'] = process.name()
                except Exception as e:
                    logger.error(f"Error getting Windows active window: {str(e)}")
                    
            elif platform.system() == 'Linux':
                # For Linux we'll use xdotool if available
                try:
                    import subprocess
                    active_window_id = subprocess.check_output(['xdotool', 'getactivewindow']).decode().strip()
                    window_name = subprocess.check_output(['xdotool', 'getwindowname', active_window_id]).decode().strip()
                    pid = subprocess.check_output(['xdotool', 'getwindowpid', active_window_id]).decode().strip()
                    
                    active_window_info['window_title'] = window_name
                    active_window_info['pid'] = int(pid)
                    
                    process = psutil.Process(int(pid))
                    active_window_info['application_name'] = process.name()
                except Exception as e:
                    logger.error(f"Error getting Linux active window: {str(e)}")
                    
            elif platform.system() == 'Darwin':
                # For MacOS
                try:
                    script = '''
                    tell application "System Events"
                        set frontApp to name of first application process whose frontmost is true
                        set frontAppPath to path of first application process whose frontmost is true
                        set windowTitle to ""
                        tell process frontApp
                            if exists (1st window whose value of attribute "AXMain" is true) then
                                set windowTitle to name of 1st window whose value of attribute "AXMain" is true
                            end if
                        end tell
                        return {frontApp, windowTitle, frontAppPath}
                    end tell
                    '''
                    import subprocess
                    result = subprocess.check_output(['osascript', '-e', script]).decode().strip()
                    parts = result.split(', ')
                    
                    active_window_info['application_name'] = parts[0] if len(parts) > 0 else ''
                    active_window_info['window_title'] = parts[1] if len(parts) > 1 else ''
                    
                    # Try to find the PID of the application
                    for proc in psutil.process_iter(['pid', 'name']):
                        if proc.info['name'] and active_window_info['application_name'] in proc.info['name']:
                            active_window_info['pid'] = proc.info['pid']
                            break
                except Exception as e:
                    logger.error(f"Error getting MacOS active window: {str(e)}")
        
        except Exception as e:
            logger.error(f"General error tracking active window: {str(e)}")
            
        return active_window_info
    
    def track_file_operations(self):
        """Track file operations (simplified version)"""
        # This is a placeholder. In a real implementation, you'd need to use
        # platform-specific file system monitoring like watchdog for Python
        pass
        
    def monitor_system_health(self):
        """Collect system health metrics"""
        try:
            # Get CPU usage (percent)
            cpu_usage = psutil.cpu_percent(interval=0.5)
            
            # Get memory usage
            memory = psutil.virtual_memory()
            memory_usage = memory.percent
            
            # Get disk usage
            disk = psutil.disk_usage('/')
            disk_usage = disk.percent
            
            # Get network I/O
            net_io = psutil.net_io_counters()
            network_in = net_io.bytes_recv
            network_out = net_io.bytes_sent
            
            # Get battery level if available
            battery_level = None
            try:
                battery = psutil.sensors_battery()
                if battery:
                    battery_level = battery.percent
            except (AttributeError, NotImplementedError):
                pass
                
            # Get process count
            processes_count = len(list(psutil.process_iter()))
            
            # In client-side storage, we'd send this data to the browser
            # but in this server, we'll just log it
            health_data = {
                'device_id': self.device_id,
                'cpu_usage': cpu_usage,
                'memory_usage': memory_usage,
                'disk_usage': disk_usage,
                'network_in': network_in,
                'network_out': network_out,
                'battery_level': battery_level,
                'processes_count': processes_count,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            logger.info(f"System health: CPU {cpu_usage}%, Memory {memory_usage}%, Disk {disk_usage}%")
            return health_data
                
        except Exception as e:
            logger.error(f"Error monitoring system health: {str(e)}")
            return None
    
    def start_tracking(self):
        """Start the activity tracking process"""
        logger.info("Starting activity tracking...")
        self.is_running = True
        self.stop_event.clear()
        
        # Generate unique IDs for device and session
        self.device_id = str(uuid.uuid4())
        self.session_id = str(uuid.uuid4())
        
        # Get device info
        device_info = self.get_device_info()
        self.current_device = {
            'id': self.device_id,
            'name': device_info['name'],
            'device_type': device_info['device_type'],
            'os': device_info['os'],
            'os_version': device_info['os_version'],
            'processor': device_info['processor'],
            'memory': device_info['memory'],
            'hardware_id': device_info['hardware_id'],
            'is_tracking_enabled': True,
            'last_active': datetime.utcnow().isoformat()
        }
        
        # Create a new session
        self.current_session = {
            'id': self.session_id,
            'device_id': self.device_id,
            'start_time': datetime.utcnow().isoformat(),
            'end_time': None,
            'context': 'work'  # Default context
        }
        
        logger.info(f"Started new tracking session: {self.session_id} on device {self.device_id}")
        
        # Initial process snapshot
        self.current_processes = {p.pid: p.info for p in 
                                  psutil.process_iter(['name', 'username', 'create_time'])}
        
        start_time = time.time()
        current_app = None
        current_window = None
        app_start_time = start_time
        
        try:
            while not self.stop_event.is_set():
                try:
                    # Get current active window
                    window_info = self.get_active_window_info()
                    
                    # If the active app has changed, log the previous one's duration
                    if current_app and current_app != window_info['application_name']:
                        duration = time.time() - app_start_time
                        
                        # Only log if it's a meaningful duration
                        if duration >= 2:  # At least 2 seconds
                            # Create activity with session and device info
                            activity = {
                                'id': str(uuid.uuid4()),
                                'activity_type': 'app_usage',
                                'application_name': current_app,
                                'window_title': current_window,
                                'duration': int(duration),
                                'device_id': self.device_id,
                                'session_id': self.session_id,
                                'timestamp': datetime.utcnow().isoformat(),
                                'productivity_score': 0.5,  # Default score
                                'activity_data': {"foreground": True},
                                'idle_time': 0
                            }
                            
                            logger.debug(f"Logged activity: {current_app} for {int(duration)} seconds")
                        
                        # Reset for new app
                        app_start_time = time.time()
                    
                    # Update current app info
                    current_app = window_info['application_name']
                    current_window = window_info['window_title']
                    
                    # Monitor system health every minute
                    current_time = time.time()
                    if int(current_time) % 60 < 2:  # Check every minute
                        self.monitor_system_health()
                    
                    # Sleep for the sample interval
                    time.sleep(self.sample_interval)
                    
                except Exception as e:
                    logger.error(f"Error in tracking loop: {str(e)}")
                    time.sleep(self.sample_interval)
        
        except KeyboardInterrupt:
            logger.info("Tracking interrupted by user")
        finally:
            # End the session
            if self.current_session:
                self.current_session['end_time'] = datetime.utcnow().isoformat()
                logger.info("Tracking session ended")
                
            self.is_running = False
    
    def stop_tracking(self):
        """Stop the activity tracking process"""
        logger.info("Stopping activity tracking...")
        self.stop_event.set()
        
        # End the session
        if self.current_session:
            self.current_session['end_time'] = datetime.utcnow().isoformat()
            
        self.is_running = False