import { useState, useRef, useEffect } from 'react';
import { MicrophoneIcon, StopIcon, PlayIcon, PauseIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

// Extend the Window interface to include webkitSpeechRecognition
declare global {
  interface Window {
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

type SpeechRecognitionType = typeof window.SpeechRecognition;

type VoiceRecorderProps = {
  onRecordingComplete: (audioBlob: Blob) => void;
  onTextUpdate: (text: string) => void;
  isProcessing: boolean;
};

export default function VoiceRecorder({ onRecordingComplete, onTextUpdate, isProcessing }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Initialize speech recognition if available
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition() as SpeechRecognition;
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            onTextUpdate(event.results[i][0].transcript);
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        setInterimTranscript(interimTranscript);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTextUpdate]);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      setError('');
      setInterimTranscript('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setRecordedAudio(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        onRecordingComplete(audioBlob);
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsPaused(false);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please ensure you have granted microphone permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const togglePause = () => {
    if (!mediaRecorderRef.current) return;
    
    if (isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    } else {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const playRecordedAudio = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const handleRetry = () => {
    setRecordedAudio(null);
    setAudioUrl('');
    onTextUpdate('');
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
          {error}
        </div>
      )}
      
      <div className="flex items-center justify-center space-x-4">
        {!isRecording && !recordedAudio && (
          <button
            onClick={startRecording}
            disabled={isProcessing}
            className="flex items-center px-6 py-3 text-white bg-red-600 rounded-full hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MicrophoneIcon className="w-6 h-6 mr-2" />
            Start Recording
          </button>
        )}
        
        {isRecording && (
          <div className="flex items-center space-x-2">
            <button
              onClick={stopRecording}
              className="flex items-center px-4 py-2 text-white bg-gray-600 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <StopIcon className="w-5 h-5 mr-1" />
              Stop
            </button>
            
            <button
              onClick={togglePause}
              className="flex items-center px-4 py-2 text-white bg-yellow-600 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
            >
              {isPaused ? (
                <>
                  <PlayIcon className="w-5 h-5 mr-1" />
                  Resume
                </>
              ) : (
                <>
                  <PauseIcon className="w-5 h-5 mr-1" />
                  Pause
                </>
              )}
            </button>
            
            <div className="flex items-center ml-2">
              <span className="inline-flex w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
              <span className="ml-2 text-sm text-gray-600">Recording...</span>
            </div>
          </div>
        )}
        
        {recordedAudio && audioUrl && (
          <div className="flex items-center space-x-2">
            <button
              onClick={playRecordedAudio}
              className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <PlayIcon className="w-5 h-5 mr-1" />
              Play
            </button>
            
            <button
              onClick={handleRetry}
              disabled={isProcessing}
              className="flex items-center px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowPathIcon className="w-5 h-5 mr-1" />
              Retry
            </button>
            
            <audio
              ref={audioRef}
              src={audioUrl}
              className="hidden"
              controls
            />
          </div>
        )}
      </div>
      
      {(isProcessing || interimTranscript) && (
        <div className="mt-4 space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            {isProcessing ? 'Processing...' : 'Transcribing...'}
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            rows={4}
            value={interimTranscript}
            readOnly
            placeholder="Your transcribed text will appear here..."
          />
          {isProcessing && (
            <div className="flex items-center mt-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-2 text-sm text-gray-600">Processing audio...</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
