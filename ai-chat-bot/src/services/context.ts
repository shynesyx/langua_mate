import { LanguageContext, MessageMetadata } from '../types';

class ContextService {
  private context: LanguageContext | null = null;

  initializeContext(targetLanguage: string, nativeLanguage: string, level: 'beginner' | 'intermediate' | 'advanced') {
    this.context = {
      targetLanguage,
      nativeLanguage,
      currentLevel: level,
      learningGoals: [],
      recentTopics: [],
      grammarPoints: [],
      vocabulary: [],
      sessionStartTime: new Date(),
      lastInteractionTime: new Date()
    };
  }

  getContext(): LanguageContext | null {
    return this.context;
  }

  updateContext(metadata: MessageMetadata) {
    if (!this.context) return;

    this.context.lastInteractionTime = new Date();

    if (metadata.grammarPoint) {
      this.context.grammarPoints.push(metadata.grammarPoint);
    }

    if (metadata.vocabulary) {
      this.context.vocabulary.push(...metadata.vocabulary);
    }

    if (metadata.context) {
      this.context.recentTopics.push(metadata.context);
    }
  }

  setLearningGoals(goals: string[]) {
    if (this.context) {
      this.context.learningGoals = goals;
    }
  }

  clearContext() {
    this.context = null;
  }
}

export const contextService = new ContextService(); 