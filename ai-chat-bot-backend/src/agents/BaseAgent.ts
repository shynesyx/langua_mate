import { Agent, AgentResponse } from './types';
import { LanguageContext, MessageMetadata } from '../types';
import { chatWithOllama } from '../services/ollama';

export abstract class BaseAgent implements Agent {
  name: string;
  description: string;
  protected systemPrompt: string;

  constructor(name: string, description: string, systemPrompt: string) {
    this.name = name;
    this.description = description;
    this.systemPrompt = systemPrompt;
  }

  protected buildPrompt(message: string, context: LanguageContext): string {
    return `${this.systemPrompt}

Target Language: ${context.targetLanguage}
Native Language: ${context.nativeLanguage}
Current Level: ${context.currentLevel}
Learning Goals: ${context.learningGoals.join(', ')}
Recent Topics: ${context.recentTopics.slice(-3).join(', ')}
Recent Grammar Points: ${context.grammarPoints.slice(-3).join(', ')}
Recent Vocabulary: ${context.vocabulary.slice(-10).join(', ')}

User Message: ${message}

Response:`;
  }

  async process(message: string, context: LanguageContext): Promise<AgentResponse> {
    const prompt = this.buildPrompt(message, context);
    const response = await chatWithOllama(prompt);
    
    // Enhance the metadata with agent-specific information
    const enhancedMetadata: MessageMetadata = {
      ...response.metadata,
      context: this.name
    };
    
    return {
      text: response.response,
      metadata: enhancedMetadata
    };
  }
} 