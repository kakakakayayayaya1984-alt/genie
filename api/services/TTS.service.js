import { TTSClient } from '#clients/TTS.client.js';

export async function synthesizeSpeech(text) {
  const request = {
    input: { text },
    voice: {
      languageCode: 'en-IN',
      name: 'en-IN-Neural2-D',
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 1.2,
    },
  };

  try {
    const [response] = await TTSClient.synthesizeSpeech(request);
    const audioBase64 = response.audioContent;

    if (!audioBase64) {
      console.warn('[TTS] Empty audioContent returned from TTS');
      return Buffer.alloc(0);
    }

    const audioBuffer = Buffer.from(audioBase64, 'base64');
    // console.log('[TTS] Audio buffer size:', audioBuffer.length);
    return audioBuffer;
  } catch (error) {
    console.error('[TTS] Error:', error);
    return Buffer.alloc(0);
  }
}
