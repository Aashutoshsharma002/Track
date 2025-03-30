# WorkFlowAI by AcadeWise

A sophisticated AI assistant that monitors system activities and provides intelligent workflow suggestions using reinforcement learning.

## Features

- **Activity Tracking**: Monitors system activities, application usage, and work patterns.
- **Intelligent Suggestions**: Uses reinforcement learning to provide personalized workflow optimization suggestions.
- **Multi-device Support**: Works across multiple devices with centralized user profiles.
- **Neural Network Models**: Employs multiple deep learning models for activity classification, workflow prediction, productivity analysis, and system optimization.
- **System Health Monitoring**: Tracks CPU usage, memory utilization, and other system metrics to provide optimization suggestions.
- **Interactive Dashboard**: Visual presentation of activities, suggestions, and system metrics.
- **Dark/Light Mode**: Customizable interface with theme toggle.
- **Client-Side Storage**: All data is stored in the browser's localStorage for enhanced privacy and personalization.
- **Data Export**: Export your data in JSON, CSV, or Excel formats directly from your browser.

## Technology Stack

- **Backend**: Flask, TensorFlow
- **Frontend**: Bootstrap 5, Chart.js, TensorFlow.js
- **Data Storage**: Browser localStorage (client-side)
- **Data Processing**: NumPy, Pandas
- **System Monitoring**: psutil
- **Data Export**: Client-side file generation (JSON, CSV, Excel)

## Neural Models

The application includes four specialized neural network models:

1. **Activity Classifier**: Categorizes user activities based on duration, focus level, and other metrics.
2. **Workflow Predictor**: Anticipates the next application or task based on usage patterns.
3. **Productivity Analyzer**: Evaluates work habits and suggests efficiency improvements.
4. **System Optimizer**: Analyzes system performance and recommends optimizations.

## Getting Started

### Prerequisites

- Python 3.11+

### Installation

1. Clone the repository
2. Install dependencies: `pip install -r requirements.txt`
3. Configure environment variables:
   - `SESSION_SECRET`: Secret key for session management
4. Start the application: `gunicorn --bind 0.0.0.0:5000 main:app`

## Usage

1. Access the web interface at `http://localhost:5000`
2. Accept privacy consent for tracking data in your browser
3. Start activity tracking from the dashboard
4. View suggestions and metrics on the dashboard as they're automatically populated
5. Provide feedback on suggestions to improve the AI model
6. Export your data in JSON, CSV, or Excel format from the dashboard

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.