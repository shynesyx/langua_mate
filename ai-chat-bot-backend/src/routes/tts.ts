import express from 'express';
import { TTSService } from '../services/TTSService';
import { TTSOptions } from '../types/tts';
import fs from 'fs';

const router = express.Router();
const ttsService = new TTSService();

// Language name to code mapping
const languageCodes: Record<string, string> = {
  'Japanese': 'ja',
  'English': 'en',
  'Spanish': 'es',
  'French': 'fr',
  'German': 'de',
  'Italian': 'it',
  'Korean': 'ko',
  'Chinese': 'zh'
};

// Synthesize text to speech
router.post('/synthesize', async (req, res) => {
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

    // Generate audio using Bark TTS service
    const audioFilePath = await ttsService.synthesizeToAudio(text, languageCode, options);
    console.log('Audio file generated:', audioFilePath);

    // Check if file exists
    if (!fs.existsSync(audioFilePath)) {
      console.error('Audio file not found:', audioFilePath);
      return res.status(500).json({ error: 'Failed to generate audio file' });
    }

    // Get file stats
    const stats = fs.statSync(audioFilePath);
    console.log('Audio file size:', stats.size, 'bytes');

    // Set response headers
    res.set({
      'Content-Type': 'audio/wav',
      'Content-Length': stats.size,
      'Content-Disposition': 'attachment; filename="speech.wav"'
    });

    // Stream the file
    const stream = fs.createReadStream(audioFilePath);
    stream.on('error', (error) => {
      console.error('Stream error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to stream audio file' });
      }
    });

    stream.pipe(res);
  } catch (error: any) {
    console.error('TTS error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Failed to synthesize speech' });
    }
  }
});

// Get available voices for a language
router.get('/voices/:language', async (req, res) => {
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
router.post('/cleanup', async (req, res) => {
  try {
    await ttsService.cleanup();
    res.json({ message: 'Cleanup completed successfully' });
  } catch (err: unknown) {
    const error = err as Error;
    res.status(500).json({ error: error.message });
  }
});

export default router; 