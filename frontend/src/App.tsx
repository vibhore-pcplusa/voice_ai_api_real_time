import React, { useState } from 'react';
import VoiceRecorder from './components/VoiceRecorder';
import TextToSpeech from './components/TextToSpeech';
import { MicrophoneIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';

function App() {
  const [transcribedText, setTranscribedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRecordingComplete = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');

      // Use the full backend URL
      const response = await fetch('http://localhost:5000/api/speech-to-text', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header, let the browser set it with the correct boundary
        headers: {
          'Accept': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTranscribedText(data.text);
      } else {
        console.error('Speech-to-text failed');
      }
    } catch (error) {
      console.error('Error processing speech:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextSubmit = async (text: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch('http://localhost:5000/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const data = await response.json();
        // Play the generated audio using full backend URL
        const audio = new Audio(`http://localhost:5000${data.url}`);
        audio.play();
      } else {
        console.error('Text-to-speech failed');
      }
    } catch (error) {
      console.error('Error processing text:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Voice AI System
          </h1>
          <p className="text-lg text-gray-600">
            Convert speech to text and text to speech with AI
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Speech to Text Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-6">
              <MicrophoneIcon className="h-8 w-8 text-blue-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-800">
                Speech to Text
              </h2>
            </div>
            
            <VoiceRecorder
              onRecordingComplete={handleRecordingComplete}
              onTextUpdate={setTranscribedText}
              isProcessing={isProcessing}
            />

            {transcribedText && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 mb-2">
                  Transcribed Text:
                </h3>
                <p className="text-gray-700">{transcribedText}</p>
              </div>
            )}
          </div>

          {/* Text to Speech Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-6">
              <SpeakerWaveIcon className="h-8 w-8 text-green-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-800">
                Text to Speech
              </h2>
            </div>
            
            <TextToSpeech
              onTextSubmit={handleTextSubmit}
              isProcessing={isProcessing}
            />
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            How to Use
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">
                🎤 Speech to Text
              </h4>
              <ol className="text-sm text-gray-600 space-y-1">
                <li>1. Click "Start Recording"</li>
                <li>2. Speak clearly into your microphone</li>
                <li>3. Click "Stop" when finished</li>
                <li>4. View your transcribed text</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">
                🔊 Text to Speech
              </h4>
              <ol className="text-sm text-gray-600 space-y-1">
                <li>1. Type or paste text in the input field</li>
                <li>2. Click "Speak" to hear it aloud</li>
                <li>3. Or click "Convert to Speech" for AI voice</li>
                <li>4. Listen to the generated speech</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
