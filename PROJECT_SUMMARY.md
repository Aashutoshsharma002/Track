# WorkFlowAI by AcadeWise - Project Summary

## Core Technologies
- **Flask Backend**: Handles web server, routing, and API endpoints
- **TensorFlow.js**: Client-side machine learning for personalized suggestions
- **Client-side Storage**: All user data stored in browser localStorage
- **Bootstrap 5**: Responsive UI with dark/light theme support
- **Chart.js**: Interactive visualizations for activity data
- **Reinforcement Learning**: Adaptive suggestion system

## Key Features Implemented
1. **Activity Tracking System**
   - Browser-based tracking using JavaScript APIs
   - Server-side tracking via ActivityTracker class
   - System health monitoring (CPU, memory usage)

2. **Multiple Neural Models**
   - Activity Classifier: Categorizes user activities
   - Workflow Predictor: Anticipates next tasks
   - Productivity Analyzer: Evaluates work habits
   - System Optimizer: Recommends system optimizations

3. **Privacy-First Architecture**
   - All data stored client-side in localStorage
   - Clear consent management system
   - No server-side database storage of user activities

4. **Intelligent Suggestion System**
   - Reinforcement learning for adaptive suggestions
   - Personalized recommendations based on usage patterns
   - Feedback mechanism to improve suggestions over time

5. **Data Export Capabilities**
   - Client-side export to JSON, CSV, or Excel formats
   - No server processing required for exports

6. **Automatic Activity Updates**
   - Activities refresh every 30 seconds automatically
   - Auto-tracking adds new activities every minute when active

## Technical Architecture
- **Frontend**: HTML/CSS/JavaScript with Bootstrap and TensorFlow.js
- **Backend**: Flask Python server with modular design
- **Storage**: Browser localStorage with structured data schemas
- **Models**: Client-side neural networks for suggestion generation

## Project Requirements
The dependencies are listed in project_requirements.txt and include:
- Flask and related extensions
- Data processing libraries (pandas, numpy)
- System monitoring tools (psutil)
- TensorFlow for server-side model training
- Export capabilities (openpyxl)

## Usage Instructions
1. Start the application using `gunicorn --bind 0.0.0.0:5000 main:app`
2. Access the web interface at `http://localhost:5000`
3. Accept privacy consent for tracking
4. Start activity tracking from the dashboard
5. View suggestions and metrics that automatically update
6. Provide feedback on suggestions to improve the AI model
7. Export your data in multiple formats directly from the dashboard

## Future Enhancements
- Enhanced visualization options
- Deeper neural network models
- Additional export formats
- Integration with productivity tools
- Workflow automation capabilities