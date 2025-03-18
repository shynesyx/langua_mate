import { BaseAgent } from './BaseAgent';
import { AgentType, AgentResponse, SceneInfo } from './types';
import { LanguageContext, MessageMetadata } from '../types';
import { chatWithOllama } from '../services/ollama';

interface AIResponse {
  response: string;
  translation: string;
  teachingPoints?: {
    explanation?: string;
    examples?: string[];
    practice?: string;
  };
}

export class ResponseGeneratorAgent extends BaseAgent {
  private static readonly DEFAULT_LEVEL = 'beginner';
  private static readonly PERSONAS = {
    beginner: 'friendly elementary student',
    intermediate: 'casual high school student',
    advanced: 'professional young adult'
  } as const;

  private static readonly COMPLEXITY = {
    beginner: 'short and simple',
    intermediate: 'moderately complex',
    advanced: 'sophisticated but natural'
  } as const;

  private static readonly BASIC_PHRASES = {
    greeting: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
    farewell: ['goodbye', 'bye', 'see you', 'see you later', 'good night'],
    courtesy: ['please', 'thank you', 'you\'re welcome', 'excuse me', 'sorry'],
    questions: ['what', 'where', 'when', 'who', 'why', 'how']
  };

  private readonly scenes: Record<string, SceneInfo[]> = {
    beginner: [
      { trigger: 'hello|hi|hey', context: 'at the park with a dog', persona: ResponseGeneratorAgent.PERSONAS.beginner },
      { trigger: 'what.*doing|sup|what.*up', context: 'eating pizza with friends', persona: ResponseGeneratorAgent.PERSONAS.beginner },
      { trigger: 'how.*you', context: 'doing homework', persona: ResponseGeneratorAgent.PERSONAS.beginner }
    ],
    intermediate: [
      { trigger: 'hello|hi|hey', context: 'shopping for new shoes', persona: ResponseGeneratorAgent.PERSONAS.intermediate },
      { trigger: 'what.*doing|sup|what.*up', context: 'watching a soccer game', persona: ResponseGeneratorAgent.PERSONAS.intermediate },
      { trigger: 'how.*you', context: 'studying for a test', persona: ResponseGeneratorAgent.PERSONAS.intermediate }
    ],
    advanced: [
      { trigger: 'hello|hi|hey', context: 'preparing for a big meeting', persona: ResponseGeneratorAgent.PERSONAS.advanced },
      { trigger: 'what.*doing|sup|what.*up', context: 'traveling to a new city', persona: ResponseGeneratorAgent.PERSONAS.advanced },
      { trigger: 'how.*you', context: 'working on a project', persona: ResponseGeneratorAgent.PERSONAS.advanced }
    ]
  };

  constructor() {
    super(
      AgentType.RESPONSE_GENERATOR,
      'Generates contextual responses based on user proficiency',
      `You are a language learning companion. Respond to the user's message in their target language,
      following these guidelines:
      1. Match the persona and context provided
      2. Use vocabulary within the specified limit
      3. Follow the grammar complexity rules
      4. Be encouraging and engaging
      5. Provide corrections only when specifically requested
      
      IMPORTANT: Always format your response in JSON with this structure:
      {
        "response": "Your response in the target language",
        "translation": "English translation of your response",
        "teachingPoints": {
          "explanation": "Brief explanation of grammar or vocabulary (when in tutorial mode)",
          "examples": ["Additional example 1", "Additional example 2"],
          "practice": "A simple practice question for the user"
        }
      }`
    );
  }

  private getRandomScene(level: string, trigger: string): SceneInfo | undefined {
    const levelScenes = this.scenes[level] || this.scenes[ResponseGeneratorAgent.DEFAULT_LEVEL];
    const matchingScenes = levelScenes.filter(scene => 
      new RegExp(scene.trigger, 'i').test(trigger)
    );
    
    return matchingScenes.length > 0
      ? matchingScenes[Math.floor(Math.random() * matchingScenes.length)]
      : undefined;
  }

  private getPersonaForLevel(level: string): string {
    return ResponseGeneratorAgent.PERSONAS[level as keyof typeof ResponseGeneratorAgent.PERSONAS] || 
           ResponseGeneratorAgent.PERSONAS.beginner;
  }

  private getComplexityForLevel(level: string): string {
    return ResponseGeneratorAgent.COMPLEXITY[level as keyof typeof ResponseGeneratorAgent.COMPLEXITY] || 
           ResponseGeneratorAgent.COMPLEXITY.beginner;
  }

  private isNativeLanguage(message: string, context: LanguageContext): boolean {
    // Simple check for Japanese characters (hiragana, katakana, kanji)
    const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;
    return !japaneseRegex.test(message);
  }

  private buildTutorialPrompt(message: string, context: LanguageContext): string {
    const basePrompt = this.buildPrompt(message, context);
    
    return `${basePrompt}
The user is writing in their native language (${context.nativeLanguage}). 
Provide a tutorial-style response that:
1. Acknowledges their message
2. Teaches them how to express the same thing in ${context.targetLanguage}
3. Provides a simple explanation of the grammar or vocabulary used
4. Includes 2-3 similar examples
5. Ends with a simple practice question

Remember to format your response in JSON with the message, translation, and teaching points.
Keep the language very simple and encouraging.`;
  }

  private buildResponsePrompt(message: string, context: LanguageContext, scene?: SceneInfo): string {
    // If user is writing in their native language, switch to tutorial mode
    if (this.isNativeLanguage(message, context)) {
      return this.buildTutorialPrompt(message, context);
    }

    const basePrompt = this.buildPrompt(message, context);
    const sceneContext = scene 
      ? `\nCurrent Scene: ${scene.context}\nPersona: ${scene.persona}`
      : '';

    if (!context.isLevelEvaluated) {
      return `${basePrompt}
Please provide a friendly welcome message in ${context.targetLanguage} that:
1. Introduces yourself as a language tutor
2. Uses very simple, beginner-friendly language
3. Asks the user a simple question to start the conversation

Remember to format your response in JSON with both the message and its English translation.`;
    }

    return `${basePrompt}${sceneContext}

Response Guidelines:
1. Use ${context.currentLevel} level ${context.targetLanguage}
2. Respond as a ${this.getPersonaForLevel(context.currentLevel)}
3. Keep responses ${this.getComplexityForLevel(context.currentLevel)}

Remember to format your response in JSON with both the message and its English translation.`;
  }

  private parseAIResponse(response: string): AIResponse {
    console.log('Raw AI response:', response);
    try {
      // First try parsing the entire response as JSON
      try {
          const parsed = JSON.parse(response) as AIResponse;
          if (!parsed.response || !parsed.translation) {
              throw new Error('Missing required fields in response');
          }
          return parsed;
      } catch (e) {
          // If that fails, try to extract JSON from the text
          const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
          if (jsonMatch) {
              const jsonStr = jsonMatch[1];
              try{
                  const parsed = JSON.parse(jsonStr) as AIResponse;
                  if (!parsed.response || !parsed.translation) {
                      throw new Error('Missing required fields in response');
                  }
                  return parsed;
              } catch (jsonParseError){
                  console.error("Error parsing extracted JSON:", jsonParseError);
                  throw e;
              }

          }
          throw e;
      }
    } catch (error) {
        console.error('Error parsing AI response:', error);
        // Extract just the Japanese text if possible
        const japaneseMatch = response.match(/["']response["']\s*:\s*["']([^"']+)["']/);
        return {
            response: japaneseMatch ? japaneseMatch[1] : response,
            translation: 'Translation not available'
        };
    }


    // try {
    //   // First try parsing the entire response as JSON
    //   try {
    //     const parsed = JSON.parse(sanitizedResponse) as AIResponse;
    //     if (!parsed.response || !parsed.translation) {
    //       throw new Error('Missing required fields in response');
    //     }
    //     return parsed;
    //   } catch (e) {
    //     // If that fails, try to extract JSON from the text
    //     const jsonMatch = sanitizedResponse.match(/```json\n([\s\S]*?)\n```/);
    //     if (jsonMatch) {
    //       const jsonStr = jsonMatch[1];
    //       const parsed = JSON.parse(jsonStr) as AIResponse;
    //       if (!parsed.response || !parsed.translation) {
    //         throw new Error('Missing required fields in response');
    //       }
    //       return parsed;
    //     }
    //     throw e;
    //   }
    // } catch (error) {
    //   console.error('Error parsing AI response:', error);
    //   // Extract just the Japanese text if possible
    //   const japaneseMatch = sanitizedResponse.match(/["']response["']\s*:\s*["']([^"']+)["']/);
    //   return {
    //     response: japaneseMatch ? japaneseMatch[1] : response,
    //     translation: 'Translation not available'
    //   };
    // }
  }

  async process(message: string, context: LanguageContext): Promise<AgentResponse> {
    // Override context to always use Japanese
    const japaneseContext: LanguageContext = {
      ...context,
      targetLanguage: 'Japanese',
      currentLevel: 'beginner' as const,
      nativeLanguage: 'English'
    };

    const scene = this.getRandomScene(japaneseContext.currentLevel, message);
    const prompt = this.buildResponsePrompt(message, japaneseContext, scene);
    const response = await chatWithOllama(prompt);

    const { response: text, translation, teachingPoints } = this.parseAIResponse(response.response);

    const metadata: MessageMetadata = {
      language: japaneseContext.targetLanguage,
      difficulty: japaneseContext.currentLevel,
      context: scene?.context || 'general conversation',
      persona: scene?.persona || this.getPersonaForLevel(japaneseContext.currentLevel),
      translation,
      teachingPoints
    };

    return { text, metadata };
  }
} 