import { useState, useRef, useEffect } from 'react';
import { AudioRecorder, AudioPlayer, blobToBase64, base64ToBlob } from '@/utils/audioUtils';
import { supabase } from '@/integrations/supabase/client';

interface VoiceWidgetProps {
  position?: 'bottom-left' | 'bottom-right';
  primaryColor?: string;
  greetingMessage?: string;
  shopId?: string;
}

interface TranscriptMessage {
  role: 'customer' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

export default function VoiceWidget({
  position = 'bottom-right',
  primaryColor = '#008060',
  greetingMessage = "Hi! I'm your AI assistant. How can I help?",
  shopId = 'demo-shop',
}: VoiceWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  const wsRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<AudioRecorder | null>(null);
  const playerRef = useRef<AudioPlayer | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  const positionClasses = {
    'bottom-left': 'bottom-8 left-8',
    'bottom-right': 'bottom-8 right-8',
  };

  useEffect(() => {
    // Initialize audio player
    playerRef.current = new AudioPlayer();
    
    return () => {
      // Cleanup
      if (recorderRef.current) {
        recorderRef.current.stop();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (playerRef.current) {
        playerRef.current.stop();
      }
    };
  }, []);

  const connectToVoiceWebSocket = async () => {
    setIsConnecting(true);
    setConnectionStatus('connecting');

    try {
      // Get Supabase project URL from environment
      const projectUrl = import.meta.env.VITE_SUPABASE_URL;
      const projectId = projectUrl?.split('//')[1]?.split('.')[0];
      
      // Connect to voice WebSocket
      const wsUrl = `wss://${projectId}.supabase.co/functions/v1/voice-websocket?shop=${encodeURIComponent(shopId)}`;
      
      console.log('Connecting to:', wsUrl);
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = async () => {
        console.log('WebSocket connected');
        setConnectionStatus('connected');
        setIsConnecting(false);
        
        // Start recording audio
        try {
          recorderRef.current = new AudioRecorder(async (audioBlob) => {
            // Send audio chunk to server
            const base64Audio = await blobToBase64(audioBlob);
            wsRef.current?.send(JSON.stringify({
              type: 'audio_chunk',
              audio: base64Audio,
            }));
          });
          
          await recorderRef.current.start();
          setIsRecording(true);
        } catch (error) {
          console.error('Error starting recorder:', error);
        }
      };

      wsRef.current.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        console.log('Received:', data.type);

        switch (data.type) {
          case 'connection_established':
            sessionIdRef.current = data.sessionId;
            // Add greeting
            setTranscript([{
              role: 'system',
              content: data.greeting || greetingMessage,
              timestamp: new Date().toISOString(),
            }]);
            break;

          case 'transcript_update':
            setTranscript(prev => [
              ...prev,
              {
                role: data.role === 'customer' ? 'customer' : 'assistant',
                content: data.text,
                timestamp: new Date().toISOString(),
              }
            ]);
            break;

          case 'audio_response':
            // TODO: Receive and play TTS audio
            console.log('Audio response:', data.text);
            break;

          case 'error':
            console.error('Server error:', data.error);
            break;
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionStatus('disconnected');
        setIsConnecting(false);
      };

      wsRef.current.onclose = () => {
        console.log('WebSocket closed');
        setConnectionStatus('disconnected');
        if (recorderRef.current) {
          recorderRef.current.stop();
        }
        setIsRecording(false);
      };

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
        wsRef.current.send(JSON.stringify({ type: 'end_session' }));
        wsRef.current.close();
      }
      if (recorderRef.current) {
        recorderRef.current.stop();
      }
      setIsOpen(false);
      setIsRecording(false);
      setConnectionStatus('disconnected');
      setTranscript([]);
    }
  };

  const handleSendMessage = (message: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'text_message',
        text: message,
      }));
      
      // Add to local transcript immediately
      setTranscript((prev) => [
        ...prev, 
        { role: 'customer', content: message, timestamp: new Date().toISOString() }
      ]);
    }
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
                      message.role === 'customer'
                        ? 'bg-blue-100 ml-8'
                        : message.role === 'assistant'
                        ? 'bg-gray-100 mr-8'
                        : 'bg-green-100'
                    }`}
                  >
                    <p className="text-sm font-semibold mb-1">
                      {message.role === 'customer' ? 'You' : message.role === 'assistant' ? 'AI' : 'System'}:
                    </p>
                    <p>{message.content}</p>
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
