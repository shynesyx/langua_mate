import express from 'express';
import { languageCodes, TTSService } from '../services/TTSService';
import path from 'path';

const router = express.Router();
const ttsService = new TTSService();

// Synthesize text to speech
router.post('/synthesize', async (req: express.Request, res: express.Response) => {
  console.log('Hit /api/tts/synthesize endpoint');
  try {
    const { text, language, options } = req.body;

    if (!text || !language) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Convert language name to code
    const languageCode = languageCodes[language] || language.toLowerCase();
    
    console.log('TTS Request:', {
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      language,
      languageCode,
      options,
      textLength: text.length
    });

    // Generate audio using TTS service
    const audioFilePath = await ttsService.synthesizeToAudio(text, languageCode, options);
    console.log('Audio file generated:', audioFilePath);

    // Return the audio file path for streaming
    const relativePath = path.relative(process.cwd(), audioFilePath).replace(/\\/g, '/');
    const audioUrl = `/audio/${relativePath}`;
    console.log(audioUrl);
    res.json({ audioUrl });
  } catch (error: any) {
    console.error('TTS error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Failed to synthesize speech' });
    }
  }
});

// Get available voices for a language
router.get('/voices/:language', async (req: express.Request, res: express.Response) => {
  try {
    const { language } = req.params;
    const voices = await ttsService.getVoices(language);
    res.json(voices);
  } catch (error: any) {
    console.error('Failed to get voices:', error);
    res.status(500).json({ error: error.message || 'Failed to get voices' });
  }
});

// Cleanup old audio files (can be called periodically)
router.post('/cleanup', async (req: express.Request, res: express.Response) => {
  try {
    await ttsService.cleanup();
    res.json({ message: 'Cleanup completed successfully' });
  } catch (err: unknown) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
});

export default router;