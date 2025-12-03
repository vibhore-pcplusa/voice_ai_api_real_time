from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import os
from datetime import datetime
import speech_recognition as sr
from gtts import gTTS
import tempfile
import uuid
import subprocess

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
    print("Received request to /api/speech-to-text")  # Debug log
    
    if 'audio' not in request.files:
        print("No audio file in request")  # Debug log
        return jsonify({"error": "No audio file provided"}), 400
    
    audio_file = request.files['audio']
    if audio_file.filename == '':
        print("Empty filename")  # Debug log
        return jsonify({"error": "No selected file"}), 400
    
    temp_audio_path = None
    converted_audio_path = None
    try:
        # Log file info
        print(f"Received file: {audio_file.filename}, Content-Type: {audio_file.content_type}")
        
        # Ensure upload directory exists
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        
        # Save the audio file temporarily
        temp_audio_path = os.path.join(app.config['UPLOAD_FOLDER'], f"temp_audio_{uuid.uuid4().hex}.{audio_file.filename.split('.')[-1] if '.' in audio_file.filename else 'webm'}")
        print(f"Saving audio to: {temp_audio_path}")
        audio_file.save(temp_audio_path)
        
        # Verify file exists and has content
        if not os.path.exists(temp_audio_path) or os.path.getsize(temp_audio_path) == 0:
            raise Exception("Failed to save audio file or file is empty")
        
        # Convert to WAV if needed
        converted_audio_path = os.path.join(app.config['UPLOAD_FOLDER'], f"converted_audio_{uuid.uuid4().hex}.wav")
        print(f"Converting audio to WAV: {converted_audio_path}")
        
        # Use ffmpeg to convert to WAV
        try:
            subprocess.run([
                'ffmpeg', '-i', temp_audio_path, 
                '-acodec', 'pcm_s16le', 
                '-ar', '16000', 
                '-ac', '1',
                converted_audio_path
            ], check=True, capture_output=True)
        except subprocess.CalledProcessError as e:
            print(f"FFmpeg conversion failed: {e.stderr.decode()}")
            # Try without conversion first
            converted_audio_path = temp_audio_path
        
        print("Attempting to recognize speech...")  # Debug log
        # Use the recognizer to convert speech to text
        with sr.AudioFile(converted_audio_path) as source:
            print("Audio file opened successfully")  # Debug log
            audio_data = recognizer.record(source)
            print("Audio recorded, recognizing...")  # Debug log
            text = recognizer.recognize_google(audio_data)
            print(f"Recognized text: {text}")  # Debug log
        
        return jsonify({"text": text})
        
    except sr.UnknownValueError:
        error_msg = "Could not understand audio"
        print(error_msg)  # Debug log
        return jsonify({"error": error_msg}), 400
    except sr.RequestError as e:
        error_msg = f"Could not request results from Google Speech Recognition service; {e}"
        print(error_msg)  # Debug log
        return jsonify({"error": error_msg}), 503
    except Exception as e:
        error_msg = f"Error processing audio: {str(e)}"
        print(error_msg)  # Debug log
        return jsonify({"error": error_msg}), 500
    finally:
        # Clean up the temporary files if they exist
        for temp_file in [temp_audio_path, converted_audio_path]:
            if temp_file and os.path.exists(temp_file):
                try:
                    os.remove(temp_file)
                    print(f"Removed temporary file: {temp_file}")  # Debug log
                except Exception as e:
                    print(f"Error removing temporary file: {e}")  # Debug log

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
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@socketio.on('connect')
def handle_connect():
    print('Client connected')
    emit('connection_response', {'data': 'Connected to Voice AI API'})

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

if __name__ == '__main__':
    socketio.run(app, debug=True, host='0.0.0.0', port=5000)
