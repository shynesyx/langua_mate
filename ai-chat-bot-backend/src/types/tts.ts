export interface TTSOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  format?: 'mp3' | 'wav';
}

export interface Voice {
  id: string;
  name: string;
  language: string;
  gender: 'male' | 'female';
}

export interface AudioMetadata {
  url?: string;
  duration?: number;
  voiceId?: string;
}

export type TTSError = {
  code: 'UNSUPPORTED_LANGUAGE' | 'SYNTHESIS_FAILED' | 'INVALID_OPTIONS';
  message: string;
}; 