import { PowerShell } from 'node-powershell';
import { TTSOptions, Voice, TTSError } from '../types/tts';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

export class TTSService {
  private voices: Map<string, Voice[]> = new Map();
  private readonly cacheDir: string;

  constructor() {
    // Log all relevant paths
    console.log('Current directory:', process.cwd());
    console.log('__dirname:', __dirname);
    
    // Use absolute path from workspace root
    this.cacheDir = path.resolve(process.cwd(), 'cache/audio');
    console.log('Cache directory (absolute):', this.cacheDir);
    
    this.initializeCache();
  }

  private async initializeCache() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      console.log('Cache directory initialized:', this.cacheDir);
      
      // Test write permissions
      const testFile = path.join(this.cacheDir, 'test.txt');
      await fs.writeFile(testFile, 'test');
      await fs.unlink(testFile);
      console.log('Cache directory is writable');
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

    const cacheKey = this.generateCacheKey(text, language, options);
    const cachePath = path.join(this.cacheDir, cacheKey);
    console.log('Attempting to synthesize audio to:', cachePath);

    try {
      await fs.access(cachePath);
      console.log('Using cached audio file:', cachePath);
      return cachePath;
    } catch {
      console.log('No cached file found, generating new audio...');
    }

    const ps = new PowerShell();  // Use Windows PowerShell 5.1

    const escapedText = Buffer.from(text, 'utf8').toString('base64');
    const psPath = cachePath.replace(/\\/g, '\\');

    const script = `
      # Force UTF-8 encoding
      [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
      [Console]::InputEncoding = [System.Text.Encoding]::UTF8
      $ErrorActionPreference = "Stop"
      try {
        Write-Output "Starting TTS synthesis..."
        Add-Type -AssemblyName System.Speech
        $synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer
        
        $voices = $synthesizer.GetInstalledVoices()
        Write-Output "Available voices:"
        foreach ($voice in $voices) {
          Write-Output "$($voice.VoiceInfo.Name) - $($voice.VoiceInfo.Culture)"
        }
        
        $targetVoice = $voices | Where-Object { $_.VoiceInfo.Culture -like "${language}*" } | Select-Object -First 1
        if ($targetVoice) {
          Write-Output "Selected voice: $($targetVoice.VoiceInfo.Name)"
          $synthesizer.SelectVoice($targetVoice.VoiceInfo.Name)
        } else {
          Write-Error "No voice found for language ${language}"
          exit 1
        }
        
        ${options?.rate ? `$synthesizer.Rate = ${Math.floor((options.rate - 1) * 10)}` : ''}
        Write-Output "Setting output to wave file: ${psPath}"
        $synthesizer.SetOutputToWaveFile("${psPath}")
        $decodedText = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String('${escapedText}'))
        Write-Output "Speaking text: $decodedText"
        $synthesizer.Speak($decodedText)
        $synthesizer.Dispose()
        Write-Output "TTS synthesis completed"
        
        if (Test-Path "${psPath}") {
          $fileInfo = Get-Item "${psPath}"
          Write-Output "Audio file created: $($fileInfo.Length) bytes"
        } else {
          Write-Error "Failed to create audio file"
        }
      } catch {
        Write-Error "PowerShell error: $_"
        exit 1
      }
    `;

    try {
      const result = await ps.invoke(script);  // Ensure UTF-8 output
      console.log('PowerShell output:', result.raw);

      const stats = await fs.stat(cachePath);
      console.log(`Audio file generated successfully: ${stats.size} bytes`);
      if (stats.size === 0) {
        throw new Error('Audio file was created but is empty');
      }
      return cachePath;
    } catch (err) {
      console.error('PowerShell execution failed:', err);
      throw this.createError('SYNTHESIS_FAILED', `Failed to synthesize speech: ${(err as Error).message}`);
    } finally {
      await ps.dispose();
    }
  }

  // async synthesizeToAudio(text: string, language: string, options?: TTSOptions): Promise<string> {
  //   if (!this.isLanguageSupported(language)) {
  //     throw this.createError('UNSUPPORTED_LANGUAGE', `Language ${language} is not supported`);
  //   }

  //   try {
  //     // Generate cache key and path
  //     const cacheKey = this.generateCacheKey(text, language, options);
  //     const cachePath = path.join(this.cacheDir, cacheKey);
  //     console.log('Attempting to synthesize audio to:', cachePath);

  //     // Check if audio is already cached
  //     try {
  //       await fs.access(cachePath);
  //       console.log('Using cached audio file:', cachePath);
  //       return cachePath;
  //     } catch {
  //       console.log('No cached file found, generating new audio...');
  //     }

  //     const ps = new PowerShell();
      
  //     // Escape single quotes in the text
  //     const escapedText = text.replace(/'/g, "''");
  //     const psPath = cachePath.replace(/\\/g, '/');
      
  //     console.log('Executing PowerShell script for TTS...');
  //     const script = `
  //       $ErrorActionPreference = "Stop"
  //       Write-Output "Starting TTS synthesis..."
  //       Add-Type -AssemblyName System.Speech
  //       $synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer
        
  //       # Get all installed voices
  //       $voices = $synthesizer.GetInstalledVoices()
  //       Write-Output "Available voices:"
  //       foreach ($voice in $voices) {
  //         Write-Output "$($voice.VoiceInfo.Name) - $($voice.VoiceInfo.Culture)"
  //       }
        
  //       # Try to find a voice for the specified language
  //       $targetVoice = $voices | Where-Object { $_.VoiceInfo.Culture -like "${language}*" } | Select-Object -First 1
  //       if ($targetVoice) {
  //         Write-Output "Selected voice: $($targetVoice.VoiceInfo.Name)"
  //         $synthesizer.SelectVoice($targetVoice.VoiceInfo.Name)
  //       } else {
  //         Write-Output "No voice found for language ${language}, using default"
  //       }
        
  //       ${options?.rate ? `$synthesizer.Rate = ${Math.floor((options.rate - 1) * 10)}` : ''}
  //       Write-Output "Setting output to wave file: ${psPath}"
  //       $synthesizer.SetOutputToWaveFile('${psPath}')
  //       Write-Output "Speaking text: ${escapedText}"
  //       $synthesizer.Speak('${escapedText}')
  //       $synthesizer.Dispose()
  //       Write-Output "TTS synthesis completed"
        
  //       if (Test-Path '${psPath}') {
  //         $fileInfo = Get-Item '${psPath}'
  //         Write-Output "Audio file created: $($fileInfo.Length) bytes"
  //       } else {
  //         Write-Error "Failed to create audio file"
  //       }
  //     `;

  //     const result = await ps.invoke(script);
  //     console.log('PowerShell output:', result.raw);
  //     await ps.dispose();

  //     // Verify the file exists and has content
  //     try {
  //       const stats = await fs.stat(cachePath);
  //       console.log(`Audio file generated successfully: ${stats.size} bytes`);
  //       if (stats.size === 0) {
  //         throw new Error('Audio file was created but is empty');
  //       }
  //     } catch (error) {
  //       console.error('Error verifying audio file:', error);
  //       throw error;
  //     }
      
  //     return cachePath;
  //   } catch (err: unknown) {
  //     const error = err as Error;
  //     console.error('TTS error:', error);
  //     throw this.createError('SYNTHESIS_FAILED', `Failed to synthesize speech: ${error.message}`);
  //   }
  // }

  async getVoices(language: string): Promise<Voice[]> {
    if (!this.voices.has(language)) {
      try {
        const ps = new PowerShell();
        const script = `
          Add-Type -AssemblyName System.Speech
          $synthesizer = New-Object System.Speech.Synthesis.SpeechSynthesizer
          $voices = $synthesizer.GetInstalledVoices()
          $voiceList = @()
          foreach ($voice in $voices) {
            $info = $voice.VoiceInfo
            $voiceList += @{
              Name = $info.Name
              Culture = $info.Culture.Name
              Gender = $info.Gender.ToString()
            }
          }
          $synthesizer.Dispose()
          ConvertTo-Json -InputObject $voiceList -Compress
        `;

        const result = await ps.invoke(script);
        await ps.dispose();

        const voiceList = JSON.parse(result.raw);
        const voices: Voice[] = voiceList
          .filter((v: any) => v.Culture.toLowerCase().startsWith(language.toLowerCase()))
          .map((v: any) => ({
            id: v.Name,
            name: v.Name,
            language: v.Culture,
            gender: v.Gender.toLowerCase() as 'male' | 'female'
          }));

        this.voices.set(language, voices);
      } catch (error) {
        console.error('Failed to get voices:', error);
        // Fallback to default voice
        const defaultVoice: Voice = {
          id: 'default',
          name: 'System Default',
          language: language,
          gender: 'female'
        };
        this.voices.set(language, [defaultVoice]);
      }
    }
    return this.voices.get(language) || [];
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
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days instead of 24 hours

      for (const file of files) {
        const filePath = path.join(this.cacheDir, file);
        const stats = await fs.stat(filePath);
        
        // Only cleanup files older than maxAge
        if (forceAll || (now - stats.mtimeMs > maxAge)) {
          console.log(`Cleaning up old file: ${file}`);
          await fs.unlink(filePath);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup cache:', error);
    }
  }
} 