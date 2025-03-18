import { TTSService } from './TTSService';

describe('TTSService', () => {
  let ttsService: TTSService;

  beforeEach(() => {
    ttsService = new TTSService();
  });

  it('should be defined', () => {
    expect(ttsService).toBeDefined();
  });

  it('should have synthesizeToAudio method', () => {
    expect(ttsService.synthesizeToAudio).toBeDefined();
  });

  it('should have getVoices method', () => {
    expect(ttsService.getVoices).toBeDefined();
  });
});