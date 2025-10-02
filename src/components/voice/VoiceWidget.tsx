import { useState, useRef } from 'react';

interface VoiceWidgetProps {
  position?: 'bottom-left' | 'bottom-right';
  primaryColor?: string;
  greetingMessage?: string;
}

export default function VoiceWidget({
  position = 'bottom-right',
  primaryColor = '#008060',
  greetingMessage = "Hi! I'm your AI assistant. How can I help?",
}: VoiceWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  const wsRef = useRef<WebSocket | null>(null);

  const positionClasses = {
    'bottom-left': 'bottom-8 left-8',
    'bottom-right': 'bottom-8 right-8',
  };

  const connectToVoiceWebSocket = async () => {
    setIsConnecting(true);
    setConnectionStatus('connecting');

    try {
      // In production, this would connect to your Deno voice-websocket function
      // For now, we'll simulate the connection
      console.log('Connecting to voice WebSocket...');
      
      // Simulate connection delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      setConnectionStatus('connected');
      setIsConnecting(false);
      setIsRecording(true);
      
      // Add greeting message
      setTranscript([greetingMessage]);

      // TODO: Implement actual WebSocket connection to your existing Deno backend
      // wsRef.current = new WebSocket('wss://your-project.supabase.co/functions/v1/voice-websocket');
      // wsRef.current.onmessage = handleWebSocketMessage;
      // wsRef.current.onerror = handleWebSocketError;
      
    } catch (error) {
      console.error('Failed to connect:', error);
      setIsConnecting(false);
      setConnectionStatus('disconnected');
    }
  };

  const handleToggleVoice = () => {
    if (!isOpen) {
      setIsOpen(true);
      connectToVoiceWebSocket();
    } else {
      // Close connection
      if (wsRef.current) {
        wsRef.current.close();
      }
      setIsOpen(false);
      setIsRecording(false);
      setConnectionStatus('disconnected');
      setTranscript([]);
    }
  };

  const handleSendMessage = (message: string) => {
    // In production: Send via WebSocket to your Deno backend
    console.log('Sending message:', message);
    setTranscript((prev) => [...prev, `You: ${message}`, 'AI: Processing...']);
  };

  return (
    <>
      {/* Floating Voice Button */}
      <div className={`fixed ${positionClasses[position]} z-50`}>
        <button
          onClick={handleToggleVoice}
          className={`relative flex items-center justify-center w-16 h-16 rounded-full shadow-lg transition-all hover:scale-110 ${
            isRecording ? 'recording-indicator' : ''
          }`}
          style={{ backgroundColor: primaryColor }}
          aria-label="Voice AI Assistant"
        >
          <svg
            className="w-8 h-8 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M7 4a3 3 0 016 0v6a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" />
          </svg>
          
          {isRecording && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </button>
      </div>

      {/* Voice Chat Modal */}
      {isOpen && (
        <div className={`fixed ${positionClasses[position]} z-50 mb-20`}>
          <div className="bg-white rounded-lg shadow-2xl w-96 h-[500px] flex flex-col">
            {/* Header */}
            <div
              className="flex items-center justify-between p-4 border-b"
              style={{ backgroundColor: `${primaryColor}10` }}
            >
              <div>
                <h3 className="font-semibold text-lg">Voice AI Assistant</h3>
                <p className="text-sm text-gray-600">
                  {connectionStatus === 'connected' && '🟢 Connected'}
                  {connectionStatus === 'connecting' && '🟡 Connecting...'}
                  {connectionStatus === 'disconnected' && '🔴 Disconnected'}
                </p>
              </div>
              <button
                onClick={handleToggleVoice}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            {/* Transcript */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {transcript.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>Start speaking to begin...</p>
                </div>
              ) : (
                transcript.map((message, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg ${
                      message.startsWith('You:')
                        ? 'bg-blue-100 ml-8'
                        : message.startsWith('AI:')
                        ? 'bg-gray-100 mr-8'
                        : 'bg-green-100'
                    }`}
                  >
                    {message}
                  </div>
                ))
              )}
            </div>

            {/* Controls */}
            <div className="p-4 border-t space-y-2">
              {isRecording && (
                <div className="flex items-center justify-center space-x-2 text-red-500">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Recording...</span>
                </div>
              )}
              
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Or type your message..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-1"
                  style={{ borderColor: primaryColor }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value) {
                      handleSendMessage(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <button
                  className="px-4 py-2 text-white rounded-lg hover:opacity-90"
                  style={{ backgroundColor: primaryColor }}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
