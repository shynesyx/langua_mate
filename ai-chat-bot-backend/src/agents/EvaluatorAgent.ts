import { BaseAgent } from './BaseAgent';
import { AgentType, AgentResponse, EvaluationResult, ProficiencyLevel } from './types';
import { LanguageContext, MessageMetadata } from '../types';
import { chatWithOllama } from '../services/ollama';

export class EvaluatorAgent extends BaseAgent {
  private proficiencyLevels: Record<string, ProficiencyLevel> = {
    beginner: {
      level: 'beginner',
      vocabLimit: 500,
      grammarComplexity: 'basic',
      persona: 'elementary student',
      score: 1
    },
    intermediate: {
      level: 'intermediate',
      vocabLimit: 2000,
      grammarComplexity: 'moderate',
      persona: 'high school student',
      score: 3
    },
    advanced: {
      level: 'advanced',
      vocabLimit: 5000,
      grammarComplexity: 'complex',
      persona: 'young professional',
      score: 5
    }
  };

  private recentMessages: { text: string; timestamp: Date }[] = [];
  private lastEvaluationTime: Date | null = null;
  private evaluationInProgress: boolean = false;
  private EVALUATION_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private MIN_MESSAGES_FOR_EVALUATION = 5;
  private MAX_MESSAGES_FOR_EVALUATION = 10;

  constructor() {
    super(
      AgentType.EVALUATOR,
      'Acts as a friendly conversation partner while secretly evaluating language proficiency',
      `You are a native speaker of multiple languages who loves making friends from around the world. You're chatting casually with a friend who's learning your language. While keeping the conversation natural and friendly, secretly analyze their language ability.

      Behind the scenes, evaluate these aspects (but never mention them directly):
      1. Vocabulary Usage:
         - Word variety and sophistication
         - Appropriate word choice
         - Use of idioms or colloquialisms
         - Word frequency level (common vs. rare words)

      2. Grammar Accuracy:
         - Sentence structure
         - Verb conjugation and tense usage
         - Agreement (subject-verb, gender, number)
         - Use of complex structures (if present)

      3. Common Errors:
         - Spelling mistakes
         - Word order issues
         - Missing articles or prepositions
         - Incorrect verb forms

      4. Overall Fluency:
         - Message coherence
         - Natural expression
         - Cultural appropriateness
         - Communication effectiveness

      Remember: You are NOT a tutor or teacher - you're just a friend having a chat. Never explicitly mention evaluating or assessing their language skills.

      Analyze multiple messages to see progression and patterns. Consider:
      - Consistency in language use
      - Improvement or decline in accuracy
      - Range of vocabulary across messages
      - Variety of grammar structures used
      - Overall communication effectiveness

      Respond in JSON format:
      {
        "vocabScore": number (1-5),
        "grammarScore": number (1-5),
        "errors": [
          {
            "type": "spelling|grammar|vocabulary|structure",
            "error": "description of the error",
            "correction": "suggested correction"
          }
        ],
        "suggestions": [
          {
            "aspect": "vocabulary|grammar|expression",
            "suggestion": "specific improvement suggestion",
            "example": "example of better usage"
          }
        ],
        "analysis": {
          "strengths": ["list of strong points"],
          "weaknesses": ["areas for improvement"],
          "nextSteps": ["specific learning recommendations"]
        }
      }`
    );
  }

  private calculateOverallScore(vocabScore: number, grammarScore: number): number {
    // Weight grammar slightly more than vocabulary
    return Math.round((vocabScore * 0.4 + grammarScore * 0.6) * 10) / 10;
  }

  private determineLevel(score: number): ProficiencyLevel {
    if (score <= 2) return this.proficiencyLevels.beginner;
    if (score <= 4) return this.proficiencyLevels.intermediate;
    return this.proficiencyLevels.advanced;
  }

  private buildEvaluationPrompt(messages: { text: string; timestamp: Date }[], context: LanguageContext): string {
    const messagesText = messages
      .map((msg, index) => `Message ${index + 1}: ${msg.text}`)
      .join('\n\n');

    return `${this.systemPrompt}

Target Language: ${context.targetLanguage}
Native Language: ${context.nativeLanguage}

Recent Messages:
${messagesText}

Previous Topics: ${context.recentTopics.join(', ')}
Recent Vocabulary: ${context.vocabulary.join(', ')}
Recent Grammar Points: ${context.grammarPoints.join(', ')}

Please analyze these messages collectively to evaluate the user's language ability.`;
  }

  private shouldEvaluate(): boolean {
    const now = new Date();
    const hasEnoughMessages = this.recentMessages.length >= this.MIN_MESSAGES_FOR_EVALUATION;
    const timeToEvaluate = !this.lastEvaluationTime || 
      (now.getTime() - this.lastEvaluationTime.getTime()) >= this.EVALUATION_INTERVAL;
    
    return hasEnoughMessages && timeToEvaluate && !this.evaluationInProgress;
  }

  private async evaluateInBackground(context: LanguageContext): Promise<void> {
    if (this.evaluationInProgress) return;

    this.evaluationInProgress = true;
    try {
      const messagesToEvaluate = this.recentMessages
        .slice(-this.MAX_MESSAGES_FOR_EVALUATION);
      
      const prompt = this.buildEvaluationPrompt(messagesToEvaluate, context);
      const response = await chatWithOllama(prompt);
      
      const evaluation = JSON.parse(response.response);
      const overallScore = this.calculateOverallScore(evaluation.vocabScore, evaluation.grammarScore);
      const proficiencyLevel = this.determineLevel(overallScore);

      // Update context with new evaluation
      context.currentLevel = proficiencyLevel.level;
      context.isLevelEvaluated = true;

      this.lastEvaluationTime = new Date();
    } catch (error) {
      console.error('Error in background evaluation:', error);
    } finally {
      this.evaluationInProgress = false;
    }
  }

  async process(message: string, context: LanguageContext): Promise<AgentResponse> {
    // Add message to recent messages
    this.recentMessages.push({
      text: message,
      timestamp: new Date()
    });

    // Keep only the last MAX_MESSAGES_FOR_EVALUATION messages
    if (this.recentMessages.length > this.MAX_MESSAGES_FOR_EVALUATION) {
      this.recentMessages = this.recentMessages.slice(-this.MAX_MESSAGES_FOR_EVALUATION);
    }

    // For first message, do immediate evaluation
    if (!context.isLevelEvaluated) {
      const prompt = this.buildEvaluationPrompt([{ text: message, timestamp: new Date() }], context);
      const response = await chatWithOllama(prompt);

      try {
        const evaluation = JSON.parse(response.response);
        const overallScore = this.calculateOverallScore(evaluation.vocabScore, evaluation.grammarScore);
        const proficiencyLevel = this.determineLevel(overallScore);

        const metadata: MessageMetadata = {
          evaluationResult: {
            level: proficiencyLevel.level,
            score: overallScore,
            vocabScore: evaluation.vocabScore,
            grammarScore: evaluation.grammarScore,
            errors: evaluation.errors.map((e: any) => e.error),
            suggestions: evaluation.suggestions.map((s: any) => s.suggestion)
          },
          constraints: {
            vocabLimit: proficiencyLevel.vocabLimit,
            grammarComplexity: proficiencyLevel.grammarComplexity,
            persona: proficiencyLevel.persona
          }
        };

        return {
          text: '', // Empty text for first message
          metadata
        };
      } catch (error) {
        console.error('Error parsing initial evaluation:', error);
        return {
          text: '',
          metadata: {
            error: 'Failed to evaluate initial language proficiency'
          }
        };
      }
    }

    // For subsequent messages, trigger background evaluation if needed
    if (this.shouldEvaluate()) {
      this.evaluateInBackground(context);
    }

    // Return empty response for regular messages since evaluation is done in background
    return {
      text: '',
      metadata: {}
    };
  }
} 