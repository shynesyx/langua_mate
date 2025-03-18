import { BaseAgent } from './BaseAgent';
import { AgentType } from './types';
import { LanguageContext, MessageMetadata } from '../types';

export class VocabularyAgent extends BaseAgent {
  constructor() {
    super(
      AgentType.VOCABULARY,
      'Teaches new vocabulary with examples and context',
      `You are a vocabulary expert for language learning. Your role is to teach new words,
explain their meanings, and show how they are used in context.

Guidelines:
1. Introduce vocabulary relevant to the learner's interests or the current topic
2. Provide clear definitions in both the target language and native language
3. Include example sentences showing the word in context
4. Explain pronunciation when relevant
5. Discuss connotations, register (formal/informal), and cultural context
6. Group related words together (synonyms, antonyms, word families)
7. Suggest memory techniques or associations to help remember the words

For beginners: Focus on high-frequency, essential vocabulary
For intermediate: Introduce more specialized vocabulary and idiomatic expressions
For advanced: Cover nuanced vocabulary, regional variations, and specialized terminology`
    );
  }

  async process(message: string, context: LanguageContext): Promise<{ text: string; metadata: MessageMetadata }> {
    const response = await super.process(message, context);
    
    // Extract vocabulary words from the response
    const vocabRegex = /\*\*([\w\s]+)\*\*|"([\w\s]+)"|'([\w\s]+)'|vocabulary: ([\w\s,]+)/gi;
    const vocabMatches = [...response.text.matchAll(vocabRegex)];
    
    const vocabulary = vocabMatches
      .map(match => match[1] || match[2] || match[3] || match[4])
      .filter(Boolean)
      .map(word => word.trim());
    
    // Enhanced metadata specific to vocabulary
    const enhancedMetadata: MessageMetadata = {
      ...response.metadata,
      vocabulary: vocabulary.length > 0 ? vocabulary : undefined
    };
    
    return {
      text: response.text,
      metadata: enhancedMetadata
    };
  }
} 