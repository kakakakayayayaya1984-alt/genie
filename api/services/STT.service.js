import { STTClient } from '#clients/STT.client.js';

const AUDIO_CONFIG = {
  encoding: 'LINEAR16',
  sampleRateHertz: 16000,
  languageCode: 'en-US',
};

// --- Helpers ---

export async function transcribeAudio(audioBuffer) {
  try {
    if (!audioBuffer || !audioBuffer.length) {
      console.warn('[STT] Empty audioBuffer passed to transcribeAudio');
      return '';
    }

    const audioBytes = audioBuffer.toString('base64');

    const request = {
      audio: { content: audioBytes },
      config: AUDIO_CONFIG,
    };

    const [response] = await STTClient.recognize(request);

    if (!response.results || response.results.length === 0) {
      console.warn('[STT] No transcription results from STT service');
      return '';
    }

    const transcription = response.results
      .map((result) => result.alternatives?.[0]?.transcript || '')
      .join(' ')
      .trim();

    // console.log('[STT] Final transcription:', transcription);
    return transcription;
  } catch (err) {
    console.error('[STT] Error during transcription:', err);
    return 'Transcription failed.';
  }
}
