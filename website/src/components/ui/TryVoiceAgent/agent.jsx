import { useState, useRef, useEffect, useCallback } from 'react';
import { MicVAD } from '@ricky0123/vad-web';

const SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_IO_URL;

// Must match server
const SAMPLE_RATE = 16000;

export const Agent = ({ token, onClose }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false); // waiting for STT
  const [error, setError] = useState(null);
  const [conversationEnded, setConversationEnded] = useState(false);

  // Chat messages { id, role: 'user' | 'agent' | 'system', text }
  const [messages, setMessages] = useState([
    {
      id: 'init',
      role: 'system',
      text: 'Connecting you to the Room Mitra voice agent...',
    },
  ]);

  const wsRef = useRef(null);
  const vadRef = useRef(null);

  const isRecordingRef = useRef(false);
  const manualCloseRef = useRef(false); // true when we intentionally tear down the WS from client

  // TTS audio tracking so we can stop it on hangup
  const currentAudioRef = useRef(null);
  const currentAudioUrlRef = useRef(null);

  // Used to avoid reacting to our own TTS
  const isAgentSpeakingRef = useRef(false);
  const agentLastSpeechEndTimeRef = useRef(0);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Auto scroll to bottom whenever messages or typing/thinking state changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }
  }, [messages, isTranscribing, isThinking, conversationEnded]);

  // Utility to append a message
  const pushMessage = useCallback((role, text) => {
    if (text == null) {
      return;
    }

    let safeText = text;

    if (typeof text === 'object') {
      console.warn('[Agent] pushMessage got non-string text:', text);
      safeText = JSON.stringify(text, null, 2);
    } else if (typeof text !== 'string') {
      safeText = String(text);
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        role,
        text: safeText,
      },
    ]);
  }, []);

  // Convert Float32 PCM ([-1,1]) to Int16 for server
  function float32ToInt16(float32Array) {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      let s = float32Array[i];
      if (s > 1) s = 1;
      else if (s < -1) s = -1;
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }

    return int16Array;
  }

  const stopCurrentAudio = () => {
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.currentTime = 0;
      }
      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current);
      }
    } catch (e) {
      console.warn('[CLIENT] Error stopping audio', e);
    } finally {
      currentAudioRef.current = null;
      currentAudioUrlRef.current = null;
      isAgentSpeakingRef.current = false;
    }
  };

  // Core cleanup for VAD + socket (+ optional audio stop)
  const cleanupResources = useCallback((options = {}) => {
    const { stopAudio = true } = options;

    // Stop VAD if active
    if (vadRef.current) {
      try {
        if (typeof vadRef.current.pause === 'function') {
          vadRef.current.pause();
        } else if (typeof vadRef.current.stop === 'function') {
          vadRef.current.stop();
        }
      } catch (e) {
        console.warn('[VAD] Error stopping VAD instance', e);
      }
      vadRef.current = null;
    }

    // Stop recording flag
    isRecordingRef.current = false;
    setIsRecording(false);

    // Stop any TTS audio that is playing, if requested
    if (stopAudio) {
      stopCurrentAudio();
    }

    // Close socket
    if (wsRef.current) {
      try {
        wsRef.current.close();
      } catch (e) {
        console.warn('Error closing WebSocket', e);
      }
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsThinking(false);
    setIsTranscribing(false);
  }, []);

  // Start MicVAD: WebRTC-style VAD, no manual silence detection
  const startRecording = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError('Not connected to the server. Cannot start listening.');
      return;
    }

    try {
      setError(null);

      // Only create VAD once
      if (!vadRef.current) {
        const vad = await MicVAD.new({
          onSpeechStart: () => {
            // speech started
          },
          onSpeechEnd: (audio) => {
            const now = Date.now();

            // Ignore segments that are clearly from our own TTS
            if (isAgentSpeakingRef.current || now - agentLastSpeechEndTimeRef.current < 500) {
              return;
            }

            if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
              return;
            }

            if (!audio || !audio.length) {
              return;
            }

            // Tiny filter for coughs, "uh", throat clearing etc.
            const durationSec = audio.length / SAMPLE_RATE;
            const MIN_DURATION_SEC = 0.35;

            let sumSquares = 0;
            for (let i = 0; i < audio.length; i++) {
              const s = audio[i];
              sumSquares += s * s;
            }
            const rms = Math.sqrt(sumSquares / audio.length);
            const MIN_RMS = 0.02;

            if (durationSec < MIN_DURATION_SEC || rms < MIN_RMS) {
              return;
            }

            const pcm16 = float32ToInt16(audio);

            try {
              setIsTranscribing(true);
              wsRef.current.send(pcm16);
              wsRef.current.send(JSON.stringify({ type: 'END_UTTERANCE' }));
            } catch (err) {
              console.error('[CLIENT] Failed to send utterance audio:', err);
              setIsTranscribing(false);
            }
          },
          onnxWASMBasePath: 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/',
          baseAssetPath: 'https://cdn.jsdelivr.net/npm/@ricky0123/vad-web@0.0.29/dist/',
        });

        vadRef.current = vad;
        await vad.start();
      }

      setIsRecording(true);
      isRecordingRef.current = true;
    } catch (err) {
      console.error('Error starting VAD/mic:', err);
      setError(
        'Could not access microphone. Check permissions or ensure the app is served over HTTPS or localhost.'
      );
      setIsRecording(false);
      isRecordingRef.current = false;
    }
  }, [pushMessage]);

  // WebSocket setup
  const connectWebSocket = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      setIsConnected(true);
      return;
    }

    manualCloseRef.current = false;

    const url = `${SERVER_URL}?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;
    ws.binaryType = 'arraybuffer';

    // Local TTS chunk buffer
    let ttsAudioChunks = [];
    let isReceivingAudio = false;

    ws.onopen = () => {
      setIsConnected(true);
      setError(null);
      pushMessage('system', 'Connected. Setting up your call with the agent...');

      // First message: START_CALL
      try {
        ws.send(JSON.stringify({ type: 'START_CALL' }));
      } catch (e) {
        console.error('Failed to send START_CALL:', e);
      }

      // Start microphone + VAD pipeline automatically
      startRecording();
    };

    ws.onclose = (event) => {
      setIsConnected(false);
      isRecordingRef.current = false;
      setIsRecording(false);

      const code = event.code;
      const reason = event.reason || 'No specific reason provided';
      const closeInfo = `Code: ${code}, Reason: ${reason}`;

      // 1. Any intentional close (user pressed End / Close, or server sent call_end / END_CALL)
      if (manualCloseRef.current) {
        // We may already have set conversationEnded and pushed a message,
        // but this is safe to call again.
        if (!conversationEnded) {
          setConversationEnded(true);
          // If for some reason we never got a call_end message, fall back:
        }

        // Let any last TTS audio finish; do not stop it here
        cleanupResources({ stopAudio: false });
        return;
      }

      // 2. Known non retryable closes (for example auth failure)
      if (code === 4003) {
        pushMessage('system', 'Unauthorized connection.');
        setConversationEnded(true);
        cleanupResources({ stopAudio: false });
        return;
      }

      // 3. Otherwise: unexpected disconnect => auto-reconnect
      setError(`Connection lost to ${ws.url} (${closeInfo}). Attempting reconnection...`);
      setTimeout(() => {
        connectWebSocket();
      }, 5000);
    };

    ws.onerror = (e) => {
      console.warn(
        'WebSocket connection error. Check server status and URL:',
        wsRef.current?.url,
        e
      );
      if (ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
        setError(
          `Failed to connect to ${ws.url}. Ensure the Node.js server is running and accessible.`
        );
      } else {
        setError('WebSocket connection error. Check console for details.');
      }
    };

    ws.onmessage = async (event) => {
      // Binary: audio chunks
      if (typeof event.data !== 'string') {
        if (isReceivingAudio) {
          ttsAudioChunks.push(event.data);
        }
        return;
      }

      // Text: JSON control messages
      try {
        const message = JSON.parse(event.data);

        if (message.type === 'transcript') {
          // STT transcript from your speech
          setIsTranscribing(false);
          if (message.text) {
            pushMessage('user', message.text);
          }
          setIsThinking(true);
        } else if (message.type === 'reply_text') {
          // Agent's reply text
          if (message.text) {
            pushMessage('agent', message.text);
          }
        } else if (message.type === 'audio_start') {
          ttsAudioChunks = [];
          isReceivingAudio = true;

          // New audio is about to play, stop any old audio
          stopCurrentAudio();
        } else if (message.type === 'audio_end') {
          isReceivingAudio = false;
          setIsThinking(false);

          if (!ttsAudioChunks.length) {
            console.error('No TTS audio chunks received before audio_end');
            return;
          }

          const audioBlob = new Blob(ttsAudioChunks, { type: 'audio/mpeg' });
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);

          currentAudioRef.current = audio;
          currentAudioUrlRef.current = audioUrl;

          isAgentSpeakingRef.current = true;

          audio.play().catch((e) => {
            console.error('Audio playback error:', e);
            isAgentSpeakingRef.current = false;
            stopCurrentAudio();
          });

          audio.onended = () => {
            stopCurrentAudio();
            agentLastSpeechEndTimeRef.current = Date.now();
          };
        } else if (message.type === 'call_end') {
          // Server has decided to end the call
          manualCloseRef.current = true;
          setConversationEnded(true);

          // For any server initiated end (including trial_ended), we always say:
          pushMessage('system', 'Agent ended the call.');
        } else if (message.type === 'error') {
          setError(`Server Error: ${message.message}`);
          setIsThinking(false);
          setIsTranscribing(false);
          pushMessage('system', `Server error: ${message.message}`);
        }
      } catch (e) {
        console.warn('Received non JSON message:', event.data, e);
      }
    };
  }, [pushMessage, startRecording, cleanupResources]);

  // Init WebSocket when component mounts
  useEffect(() => {
    connectWebSocket();
    return () => {
      // On unmount, we do a full cleanup and stop audio
      cleanupResources({ stopAudio: true });
    };
  }, [connectWebSocket, cleanupResources]);

  // End only the conversation (no onClose)
  const handleEndConversation = () => {
    manualCloseRef.current = true; // user explicitly ended

    // Only here we show "You ended the call."
    pushMessage('system', 'You ended the call.');

    setConversationEnded(true);

    // Immediately interrupt any playing TTS
    stopCurrentAudio();

    // Let server know we are intentionally ending, if possible
    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'END_CALL', reason: 'user_button' }));
      }
    } catch (e) {
      console.warn('[CLIENT] Failed to send END_CALL', e);
    }

    // Tear down mic + socket etc; server will close its side too
    cleanupResources({ stopAudio: false });
  };

  // Close the UI, but first clean up everything (also interrupts audio)
  const handleCloseClick = () => {
    manualCloseRef.current = true; // user closed
    setConversationEnded(true);
    cleanupResources({ stopAudio: true });
    onClose?.();
  };

  const renderMessageBubble = (msg) => {
    const isUser = msg.role === 'user';
    const isAgent = msg.role === 'agent';
    const isSystem = msg.role === 'system';

    if (isSystem) {
      return (
        <div key={msg.id} className="flex justify-center my-2">
          <div className="text-xs text-gray-400 italic">{msg.text}</div>
        </div>
      );
    }

    return (
      <div key={msg.id} className={`flex my-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
            isUser
              ? 'bg-indigo-600 text-white rounded-br-sm'
              : 'bg-gray-200 text-gray-900 rounded-bl-sm'
          }`}
        >
          {msg.text}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-gray-800 max-w-2xl shadow-2xl p-6 space-y-4 flex flex-col h-[480px]">
      {/* Header (no connected indicator now, just a simple title if you want) */}
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-200 font-semibold">Room Mitra Voice Agent</div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-xl border border-red-300 text-xs">
          <strong>Connection Error:</strong> {error}
        </div>
      )}

      {/* Conversation thread */}
      <div className="flex-1 bg-gray-900/40 rounded-2xl p-4 overflow-y-auto space-y-1">
        {messages.map((m) => renderMessageBubble(m))}
        {/* Typing / transcribing / thinking indicators at bottom of thread */}

        {/* User STT transcription in progress – right side, like user bubble */}
        {!conversationEnded && isTranscribing && (
          <div className="flex justify-end my-2">
            <div className="max-w-[60%] rounded-2xl px-3 py-2 text-xs bg-indigo-600 text-white flex items-center gap-2 rounded-br-sm">
              <span>Transcribing</span>
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}

        {/*  Agent thinking / replying – left side, like agent bubble  */}
        {!conversationEnded && !isTranscribing && isThinking && (
          <div className="flex justify-start my-2">
            <div className="max-w-[60%] rounded-2xl px-3 py-2 text-xs bg-gray-200 text-gray-900 flex items-center gap-2 rounded-bl-sm">
              <span>Agent is replying</span>
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-700/80 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-700/60 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-700/40 animate-bounce [animation-delay:300ms]" />
              </span>
            </div>
          </div>
        )}

        {conversationEnded && (
          <div className="mt-3 text-[11px] text-gray-400 italic">
            Conversation has ended. You can close this window.
          </div>
        )}
        {/* Always scroll to here */}
        <div ref={messagesEndRef} />
      </div>

      {/* Soft listening indicator at bottom */}
      {!conversationEnded && isRecording && isConnected && (
        <div className="flex items-center gap-2 text-[11px] text-emerald-200 px-2">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400" />
          </span>
          <span>Listening in the background. You can start speaking at any time.</span>
        </div>
      )}

      {/* Footer buttons */}
      <div className="flex gap-3 px-2 py-2 bg-gray-900/60 rounded-xl">
        <button
          type="button"
          disabled={conversationEnded || !isConnected}
          onClick={handleEndConversation}
          className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold
            ${
              conversationEnded || !isConnected
                ? 'bg-gray-500 text-gray-200 cursor-not-allowed'
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
        >
          End conversation
        </button>

        <button
          type="button"
          data-autofocus
          onClick={handleCloseClick}
          className="inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold bg-white/10 text-white hover:bg-white/20"
        >
          Close
        </button>
      </div>
    </div>
  );
};
