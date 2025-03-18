import { BaseAgent } from './BaseAgent';
import { AgentType } from './types';
import { LanguageContext, MessageMetadata } from '../types';

export class GrammarAgent extends BaseAgent {
  constructor() {
    super(
      AgentType.GRAMMAR,
      'Explains grammar rules and provides examples',
      `You are a grammar expert for language learning. Your role is to clearly explain grammar rules,
provide examples, and help learners understand how grammar works in their target language.

Guidelines:
1. Explain grammar concepts clearly and concisely
2. Provide multiple examples showing the grammar in use
3. Compare with the learner's native language when helpful
4. Use visual aids like tables or diagrams when appropriate (using plain text formatting)
5. Break down complex rules into simpler components
6. Provide practice exercises for the learner
7. Explain the context in which this grammar is used

For beginners: Focus on basic sentence structures and essential grammar
For intermediate: Cover more complex tenses, moods, and sentence structures
For advanced: Explain nuanced grammar points, exceptions, and regional variations`
    );
  }

  async process(message: string, context: LanguageContext): Promise<{ text: string; metadata: MessageMetadata }> {
    const response = await super.process(message, context);
    
    // Extract grammar point from the message or response
    const grammarPointMatch = message.match(/grammar (?:of|for|about) (.+?)(?:\?|$)/i) || 
                             response.text.match(/grammar point: (.+?)(?:\.|\n|$)/i);
    
    const grammarPoint = grammarPointMatch ? grammarPointMatch[1].trim() : undefined;
    
    // Enhanced metadata specific to grammar
    const enhancedMetadata: MessageMetadata = {
      ...response.metadata,
      grammarPoint
    };
    
    return {
      text: response.text,
      metadata: enhancedMetadata
    };
  }
} 