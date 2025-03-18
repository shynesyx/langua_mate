import { TTSService } from './services/TTSService';

async function testTTS() {
  const ttsService = new TTSService();

  try {
    // Test a simple English phrase
    console.log('\n=== Testing English TTS with Bark ===');
    const englishPath = await ttsService.synthesizeToAudio(
      'Hello! This is a test.',
      'en',
      { rate: 1.0 }
    );
    console.log('English audio generated at:', englishPath);

    console.log('\n=== Testing Japanese TTS with Bark ===');
    const japanesePath = await ttsService.synthesizeToAudio(
      'こんにちは！日本語のテストです。',
      'ja',
      { rate: 0.8 } // Slightly slower for Japanese
    );
    console.log('Japanese audio generated at:', japanesePath);

    console.log('\n=== Testing Ollama Response Format ===');
    const ollamaResponse = {
      response: 'すごいですね！',
      translation: "You're great!",
      teachingPoints: {
        explanation: "In Japanese, 'すごい' (sugoi) means 'great' or 'awesome'.",
        examples: ["この映画はすごいです。", "彼女はすごくうまいです。"],
        practice: "What do you think of the park?"
      }
    };

    // Test Japanese response
    const responseAudioPath = await ttsService.synthesizeToAudio(
      ollamaResponse.response,
      'ja',
      { rate: 0.8 }
    );
    console.log('Ollama Japanese response audio generated at:', responseAudioPath);

    // Test examples
    console.log('\n=== Testing Example Sentences ===');
    for (const example of ollamaResponse.teachingPoints.examples) {
      const examplePath = await ttsService.synthesizeToAudio(
        example,
        'ja',
        { rate: 0.7 } // Even slower for example sentences
      );
      console.log('Example audio generated at:', examplePath);
    }

    // Get available voices
    console.log('\n=== Available Japanese Voices ===');
    const voices = await ttsService.getVoices('ja');
    console.log(JSON.stringify(voices, null, 2));

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the tests
testTTS().catch(console.error); 