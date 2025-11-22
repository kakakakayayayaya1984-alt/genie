import { synthesizeSpeech } from '#services/TTS.service.js';
import { transcribeAudio } from '#services/STT.service.js';
import { handleConversation } from '#services/Conversation.service.js';
import { ulid } from 'ulid';
import { sendVoiceAgentTrialNotification } from '#services/Slack.service.js';

const TRIAL_LIMIT_MS = 5 * 60 * 1000; // 5 minutes

async function generateAgentReply(userText, conversationId) {
  const text = (userText || '').trim();

  if (!text) {
    // We really shouldn’t get here anymore, but just in case:
    return 'How can I help you?';
  }

  const conversationData = {
    hotelId: process.env.DEMO_HOTEL_ID,
    conversationId,
    userContent: text,
    isProspect: true,
  };

  return await handleConversation(conversationData);
}

// Send one text + TTS reply
async function sendTTSReply(ws, replyText) {
  ws.send(JSON.stringify({ type: 'reply_text', text: replyText }));

  const audioContent = await synthesizeSpeech(replyText);
  if (!audioContent || !audioContent.length) {
    console.error('[TTS] No audio bytes to send');
    ws.send(
      JSON.stringify({
        type: 'error',
        message: 'TTS failed or returned empty audio.',
      })
    );
    return;
  }

  ws.send(JSON.stringify({ type: 'audio_start', format: 'mp3' }));
  ws.send(audioContent, { binary: true });
  ws.send(JSON.stringify({ type: 'audio_end' }));
}

function endCall(ws, code = 1000, reason = 'agent_completed', options = {}) {
  const { delayMs = 150 } = options;

  if (!ws || ws.readyState !== ws.OPEN) {
    console.warn('[WS] endCall called but socket is not open.');
    return;
  }

  // console.log('[WS] Ending call. Reason:', reason);

  // 1. Notify client that the agent is ending the call
  ws.send(
    JSON.stringify({
      type: 'call_end',
      reason,
    })
  );

  // 2. Small delay to allow message (and any remaining audio frames) to flush
  setTimeout(() => {
    try {
      ws.close(code, reason);
      // console.log('[WS] Socket closed with reason:', reason);
    } catch (err) {
      console.error('[WS] Failed to close socket:', err);
    }
  }, delayMs);
}

// Handle a full utterance (STT -> reply -> TTS)
async function processUtterance(ws, audioBufferRef) {
  const audioBuffer = audioBufferRef.current;

  // 1) Skip if the audio is too short (e.g. < 200 ms)
  // 16000 samples/sec * 2 bytes/sample ≈ 32000 bytes/sec
  const MIN_AUDIO_BYTES = 32000 * 0.2; // ~0.2 seconds
  if (!audioBuffer || audioBuffer.length < MIN_AUDIO_BYTES) {
    // console.log(
    //   '[WS] END_UTTERANCE: audio too short (',
    //   audioBuffer?.length || 0,
    //   'bytes). Skipping STT.'
    // );
    audioBufferRef.current = Buffer.alloc(0);
    return;
  }

  // Clear buffer for next utterance
  audioBufferRef.current = Buffer.alloc(0);

  // console.log('[WS] Processing utterance. Audio bytes:', audioBuffer.length);

  const userText = await transcribeAudio(audioBuffer);

  if (userText === 'Transcription failed.') {
    ws.send(
      JSON.stringify({
        type: 'error',
        message: 'Transcription failed due to server error. Check server logs for details.',
      })
    );
    return;
  }

  const cleaned = (userText || '').trim();

  // 2) If STT returned nothing or almost nothing, don't reply.
  //    We also skip the "sorry, I couldn’t hear that" in this case.
  const MIN_TRANSCRIPT_CHARS = 5;
  if (!cleaned || cleaned.length < MIN_TRANSCRIPT_CHARS) {
    // console.log(
    //   '[WS] Empty/short transcription, skipping reply. Transcript:',
    //   JSON.stringify(cleaned)
    // );

    // Optional: you can send a transcript back if you want to debug, but
    // the client ignores empty text anyway.
    ws.send(
      JSON.stringify({
        type: 'transcript',
        text: cleaned,
      })
    );

    return;
  }

  // 3) Send transcript text (user side)
  ws.send(
    JSON.stringify({
      type: 'transcript',
      text: cleaned,
    })
  );

  // 4) Generate and speak reply
  const reply = await generateAgentReply(cleaned, ws.conversationId);
  await sendTTSReply(ws, reply.message);

  // 5) If the conversation can be ended, close the socket
  if (reply.canEndCall) {
    endCall(ws, 1000, 'no_more_actions');
  }
}

// --- Main connection handler ---

export function connection(ws, request) {
  const user = request.user;

  if (!user) {
    // Should not happen if upgrade auth is correct, but just in case:
    endCall(ws, 4003, 'unauthorized');
    return;
  }

  const callStartedAt = Date.now();
  ws.callStartedAt = callStartedAt;

  const TRIAL_MESSAGE =
    'This was a trial call with Room Mitra and is limited to 5 minutes. I will end the call now. To continue, please request a full demo from our website.';

  // Set up a timer that ends the call after 5 minutes
  const trialTimer = setTimeout(async () => {
    if (!ws || ws.readyState !== ws.OPEN) {
      console.warn('[WS] Trial timer fired but socket is not open.');
      return;
    }

    console.log('[WS] Trial limit reached. Sending final TTS.');

    try {
      // 1) Send the text + audio fully
      await sendTTSReply(ws, TRIAL_MESSAGE);
    } catch (err) {
      console.error('[WS] Error sending trial TTS reply:', err);
    }

    // 2) Now signal call end and close socket (optionally with a slightly longer delay)
    endCall(ws, 4000, 'trial_ended', { delayMs: 2000 }); // 2s to let buffers flush
  }, TRIAL_LIMIT_MS);

  ws.trialTimer = trialTimer;

  const conversationId = ulid();
  ws.conversationId = conversationId;

  // Use a wrapper object so we can mutate .current from async function safely
  const audioBufferRef = { current: Buffer.alloc(0) };
  let isClosing = false;

  ws.on('message', async function incoming(message, isBinary) {
    // 1) Binary = PCM16 audio chunks
    if (isBinary) {
      const messageBuffer = Buffer.isBuffer(message) ? message : Buffer.from(message);

      audioBufferRef.current = Buffer.concat([audioBufferRef.current, messageBuffer]);
      // console.log('[WS] Audio buffer size:', audioBufferRef.current.length);
      return;
    }

    // 2) Text = control messages (START_CALL, END_UTTERANCE, etc.)
    const text = typeof message === 'string' ? message : message.toString('utf8');

    let command;
    try {
      command = JSON.parse(text);
    } catch (e) {
      console.warn('[WS] Non-JSON text frame received, ignoring:', text);
      return;
    }

    // Ignore commands if socket is closing
    if (isClosing) return;

    switch (command.type) {
      case 'START_CALL': {
        // console.log('[WS] START_CALL received');

        const greetingText =
          'Hi, this is Room Mitra. I am your virtual assistant for the hotel. How can I help you today?';

        await sendTTSReply(ws, greetingText);
        break;
      }

      // New continuous listening name
      case 'END_UTTERANCE': {
        // console.log('[WS] END_UTTERANCE / STOP_RECORDING received');
        await processUtterance(ws, audioBufferRef);
        break;
      }

      case 'PING': {
        ws.send(JSON.stringify({ type: 'PONG' }));
        break;
      }

      default: {
        console.warn('[WS] Unknown command type:', command.type);
      }
    }
  });

  ws.on('close', (_code, reasonBuf) => {
    // Always clear the timer so it does not fire after the socket is already closed
    if (ws.trialTimer) {
      clearTimeout(ws.trialTimer);
    }

    const durationMs = Date.now() - callStartedAt;
    const reason = reasonBuf.toString();

    sendVoiceAgentTrialNotification(
      { name: user.name, email: user.sub },
      durationMs,
      reason,
      conversationId
    );

    isClosing = true;
    // console.log('[WS] Client disconnected');
  });

  ws.on('error', (error) => {
    isClosing = true;
    console.error('[WS] WebSocket Error:', error);
  });
}
