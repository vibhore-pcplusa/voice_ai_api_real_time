import { useState, useRef } from 'react';
import { SpeakerWaveIcon, ArrowPathIcon } from '@heroicons/react/24/solid';

type TextToSpeechProps = {
  onTextSubmit: (text: string) => void;
  isProcessing: boolean;
};

export default function TextToSpeech({ onTextSubmit, isProcessing }: TextToSpeechProps) {
  const [text, setText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const synth = window.speechSynthesis;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onTextSubmit(text);
    }
  };

  const speakText = () => {
    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
      return;
    }

    if (text.trim()) {
      if (utteranceRef.current) {
        synth.cancel();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      utteranceRef.current = utterance;
      synth.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const handleClear = () => {
    setText('');
    if (utteranceRef.current) {
      synth.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="textInput" className="block text-sm font-medium text-gray-700">
            Enter text to convert to speech
          </label>
          <div className="mt-1">
            <textarea
              id="textInput"
              rows={4}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Type something here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isProcessing}
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={handleClear}
            disabled={!text || isProcessing}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear
          </button>
          
          <button
            type="button"
            onClick={speakText}
            disabled={!text.trim() || isProcessing}
            className={`flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${
              isSpeaking ? 'bg-red-600 hover:bg-red-700' : ''
            }`}
          >
            {isSpeaking ? (
              <>
                <span className="w-2 h-2 mr-2 bg-white rounded-full animate-pulse"></span>
                Stop Speaking
              </>
            ) : (
              <>
                <SpeakerWaveIcon className="w-5 h-5 mr-2" />
                Speak
              </>
            )}
          </button>
          
          <button
            type="submit"
            disabled={!text.trim() || isProcessing}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <div className="flex items-center">
                <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </div>
            ) : (
              'Convert to Speech'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
