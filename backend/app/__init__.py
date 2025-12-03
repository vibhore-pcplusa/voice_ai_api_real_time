from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import os
from datetime import datetime
import speech_recognition as sr
from gtts import gTTS
import tempfile
import uuid

# Initialize Flask app
app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = 'your-secret-key-here'
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads')

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize SocketIO with threading
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

# Initialize speech recognizer
recognizer = sr.Recognizer()

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok", "message": "Voice AI API is running"})

@app.route('/api/speech-to-text', methods=['POST'])
def speech_to_text():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400
    
    audio_file = request.files['audio']
    if audio_file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    try:
        # Save the audio file temporarily
        temp_audio_path = os.path.join(app.config['UPLOAD_FOLDER'], f"temp_audio_{uuid.uuid4().hex}.wav")
        audio_file.save(temp_audio_path)
        
        # Use the recognizer to convert speech to text
        with sr.AudioFile(temp_audio_path) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data)
        
        # Clean up the temporary file
        os.remove(temp_audio_path)
        
        return jsonify({"text": text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/text-to-speech', methods=['POST'])
def text_to_speech():
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({"error": "No text provided"}), 400
    
    try:
        # Generate speech from text
        tts = gTTS(text=data['text'], lang='en')
        
        # Save the speech to a temporary file
        filename = f"speech_{uuid.uuid4().hex}.mp3"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        tts.save(filepath)
        
        # Return the URL to the generated speech file
        return jsonify({
            "url": f"/api/audio/{filename}",
            "text": data['text']
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/audio/<filename>', methods=['GET'])
def get_audio(filename):
    return app.send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@socketio.on('connect')
def handle_connect():
    print('Client connected')
    emit('connection_response', {'data': 'Connected to Voice AI API'})

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
