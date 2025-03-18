export interface MessageType {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  language?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  context?: string;
  persona?: string;
  translation?: string;
  grammarPoint?: string;
  vocabulary?: string[];
  teachingPoints?: {
    explanation?: string;
    examples?: string[];
    practice?: string;
  };
  evaluationResult?: {
    level?: 'beginner' | 'intermediate' | 'advanced';
    score?: number;
    vocabScore?: number;
    grammarScore?: number;
    errors?: string[];
    suggestions?: string[];
  };
  constraints?: {
    vocabLimit?: number;
    grammarComplexity?: string;
    persona?: string;
  };
  error?: string;
}

export interface LanguageContext {
  targetLanguage: string;
  nativeLanguage: string;
  currentLevel: 'beginner' | 'intermediate' | 'advanced';
  learningGoals: string[];
  recentTopics: string[];
  grammarPoints: string[];
  vocabulary: string[];
  sessionStartTime: Date;
  lastInteractionTime: Date;
  isLevelEvaluated?: boolean;
} 