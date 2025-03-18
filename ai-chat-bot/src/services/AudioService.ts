import { MessageType } from '../types';

class AudioService {
  private audio: HTMLAudioElement | null = null;
  private isPlaying = false;

  async speak(message: MessageType): Promise<void> {
    try {
      // Stop any currently playing audio
      if (this.isPlaying) {
        this.stop();
      }

      // Make the TTS request
      const response = await fetch('http://localhost:5000/api/tts/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message.text,
          language: message.metadata?.language || 'en',
          options: {
            rate: 1.0
          }
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to synthesize speech');
      }

      // Get the audio blob from the response
      const audioBlob = await response.blob();
      
      // Verify we got a WAV file
      if (audioBlob.type !== 'audio/wav') {
        console.warn('Unexpected audio type:', audioBlob.type);
      }
      
      // Create a new audio element
      this.audio = new Audio();
      
      // Create object URL
      const audioUrl = URL.createObjectURL(audioBlob);
      this.audio.src = audioUrl;
      
      // Set up event handlers
      this.audio.onplay = () => {
        this.isPlaying = true;
      };
      
      this.audio.onended = () => {
        this.isPlaying = false;
        if (this.audio) {
          URL.revokeObjectURL(audioUrl);
          this.audio = null;
        }
      };
      
      this.audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        this.isPlaying = false;
        if (this.audio) {
          URL.revokeObjectURL(audioUrl);
          this.audio = null;
        }
      };

      // Load the audio before playing
      await new Promise((resolve, reject) => {
        if (this.audio) {
          this.audio.oncanplaythrough = resolve;
          this.audio.onerror = reject;
        }
      });

      // Play the audio
      if (this.audio) {
        await this.audio.play();
      }
    } catch (error) {
      console.error('Failed to play audio:', error);
      this.isPlaying = false;
      throw error;
    }
  }

  stop(): void {
    if (this.audio && this.isPlaying) {
      this.audio.pause();
      this.audio.currentTime = 0;
      URL.revokeObjectURL(this.audio.src);
      this.audio = null;
      this.isPlaying = false;
    }
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }
}

export const audioService = new AudioService(); 