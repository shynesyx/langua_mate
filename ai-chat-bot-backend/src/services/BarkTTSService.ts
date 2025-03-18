import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { TTSOptions, Voice, TTSError } from '../types/tts';

export class BarkTTSService {
  private readonly cacheDir: string;
  private readonly ollamaUrl: string;

  constructor() {
    this.cacheDir = path.resolve(process.cwd(), 'cache/audio');
    this.ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
    this.initializeCache();
  }

  private async initializeCache() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      console.log('Cache directory initialized:', this.cacheDir);
    } catch (error) {
      console.error('Cache directory error:', error);
      throw new Error(`Failed to initialize cache directory: ${error}`);
    }
  }

  private generateCacheKey(text: string, language: string, options?: TTSOptions): string {
    const hash = crypto.createHash('md5')
      .update(text + language + JSON.stringify(options || {}))
      .digest('hex');
    return hash + '.wav';
  }

  async synthesizeToAudio(text: string, language: string, options?: TTSOptions): Promise<string> {
    if (!this.isLanguageSupported(language)) {
      throw this.createError('UNSUPPORTED_LANGUAGE', `Language ${language} is not supported`);
    }

    try {
      // Generate cache key and path
      const cacheKey = this.generateCacheKey(text, language, options);
      const cachePath = path.join(this.cacheDir, cacheKey);
      console.log('Attempting to synthesize audio to:', cachePath);

      // Check if audio is already cached
      try {
        await fs.access(cachePath);
        console.log('Using cached audio file:', cachePath);
        return cachePath;
      } catch {
        console.log('No cached file found, generating new audio...');
      }

      // Prepare the prompt for Bark
      const voicePreset = this.getVoicePreset(language);
      const prompt = `
        You are Bark, a text-to-speech model. Generate audio for the following text in ${language}:
        Text: ${text}
        Voice Preset: ${voicePreset}
        ${options?.rate ? `Speed: ${options.rate}` : ''}
        
        Return the audio data as a base64-encoded WAV file.
      `;

      // Call Ollama API
      const response = await fetch(`${this.ollamaUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'bark',
          prompt,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate audio: ${response.statusText}`);
      }

      const data = await response.json() as { response: string };
      
      // Extract base64 audio data from response
      const audioData = this.extractAudioData(data.response);
      if (!audioData) {
        throw new Error('No audio data found in response');
      }

      // Save audio file
      await fs.writeFile(cachePath, Buffer.from(audioData, 'base64'));

      // Verify the file exists and has content
      const stats = await fs.stat(cachePath);
      console.log(`Audio file generated successfully: ${stats.size} bytes`);
      if (stats.size === 0) {
        throw new Error('Audio file was created but is empty');
      }

      return cachePath;
    } catch (err: unknown) {
      const error = err as Error;
      console.error('TTS error:', error);
      throw this.createError('SYNTHESIS_FAILED', `Failed to synthesize speech: ${error.message}`);
    }
  }

  private getVoicePreset(language: string): string {
    const presets: Record<string, string> = {
      'ja': 'v2/ja_speaker_6',  // Japanese female voice
      'en': 'v2/en_speaker_1',  // English speaker
      'es': 'v2/es_speaker_3',  // Spanish speaker
      'zh': 'v2/zh_speaker_5',  // Chinese speaker
    };
    return presets[language.toLowerCase().split('-')[0]] || presets['en'];
  }

  private extractAudioData(response: string): string | null {
    // Look for base64-encoded WAV data in the response
    const match = response.match(/base64,([A-Za-z0-9+/=]+)/);
    return match ? match[1] : null;
  }

  async getVoices(language: string): Promise<Voice[]> {
    // Return predefined voices for each language
    const voices: Record<string, Voice[]> = {
      'ja': [{
        id: 'ja_speaker_6',
        name: 'Japanese Female',
        language: 'ja',
        gender: 'female'
      }],
      'en': [{
        id: 'en_speaker_1',
        name: 'English Speaker',
        language: 'en',
        gender: 'male'
      }],
      // Add more voices as needed
    };

    return voices[language.toLowerCase().split('-')[0]] || [];
  }

  isLanguageSupported(language: string): boolean {
    const supportedLanguages = ['en', 'es', 'fr', 'de', 'it', 'ja', 'ko', 'zh'];
    return supportedLanguages.includes(language.toLowerCase().split('-')[0]);
  }

  private createError(code: TTSError['code'], message: string): TTSError {
    return { code, message };
  }

  async cleanup(forceAll: boolean = false): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      const now = Date.now();
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days

      for (const file of files) {
        const filePath = path.join(this.cacheDir, file);
        const stats = await fs.stat(filePath);
        
        if (forceAll || (now - stats.mtimeMs > maxAge)) {
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup cache:', error);
    }
  }
} 