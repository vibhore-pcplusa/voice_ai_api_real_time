# Voice AI System

A real-time voice AI system with speech-to-text and text-to-speech capabilities.

## Features
- **Speech-to-Text**: Convert spoken words to text using advanced speech recognition
- **Text-to-Speech**: Convert text input to natural-sounding speech
- **Real-time Communication**: WebSocket-based real-time audio processing
- **Modern UI**: Clean and responsive React frontend

## Tech Stack

### Backend
- Python 3.8+
- Flask (web framework)
- SpeechRecognition (speech-to-text)
- gTTS (Google Text-to-Speech)
- Flask-SocketIO (WebSocket support)
- pydub (audio processing)

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- Socket.IO Client
- Web Audio API

## Project Structure
```
voice_ai_api_real_time/
├── backend/          # Python Flask API
├── frontend/         # React TypeScript application
└── README.md         # This file
```

## Getting Started

### Option 1: Docker Deployment (Recommended)

1. **Prerequisites**: Make sure you have Docker and Docker Compose installed

2. **Deploy with Docker**:
```bash
# Clone the repository
git clone <repository-url>
cd voice_ai_api_real_time

# Run the deployment script
./docker-deploy.sh
```

3. **Manual Docker deployment**:
```bash
# Build and start all services
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop the services
docker-compose down
```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Health Check: http://localhost:5000/api/health

### Option 2: Local Development

#### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python run.py
```

#### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## Usage
1. Start the backend server
2. Start the frontend development server
3. Open http://localhost:3000 in your browser
4. Click the microphone button to start speaking
5. The system will convert your speech to text
6. Type text and click the speak button to hear it read aloud

## Docker Configuration

The project includes Docker configurations for easy deployment:

- **Backend Dockerfile**: Python Flask application with all dependencies
- **Frontend Dockerfile**: Multi-stage build with Nginx for production
- **docker-compose.yml**: Orchestrates both services with networking
- **nginx.conf**: Production-ready Nginx configuration with API proxy
- **docker-deploy.sh**: Automated deployment script

### Docker Services

1. **Backend Service**:
   - Port: 5000
   - Health check: `/api/health`
   - Volume: Persistent uploads directory

2. **Frontend Service**:
   - Port: 3000 (mapped to Nginx port 80)
   - Reverse proxy to backend API
   - WebSocket support for real-time communication

## API Endpoints
- `POST /api/speech-to-text` - Convert audio to text
- `POST /api/text-to-speech` - Convert text to audio
- WebSocket `/socket.io` - Real-time communication
