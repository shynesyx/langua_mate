import { LanguageContext, MessageMetadata } from '../types';

export interface AgentResponse {
  text: string;
  metadata: MessageMetadata;
}

export interface Agent {
  name: string;
  description: string;
  process(message: string, context: LanguageContext): Promise<AgentResponse>;
}

export enum AgentType {
  CONVERSATION = 'conversation',
  GRAMMAR = 'grammar',
  VOCABULARY = 'vocabulary',
  PRONUNCIATION = 'pronunciation',
  TRANSLATION = 'translation',
  CORRECTION = 'correction',
  EXERCISE = 'exercise',
  EVALUATOR = 'evaluator',
  RESPONSE_GENERATOR = 'response_generator'
}

export interface ProficiencyLevel {
  level: 'beginner' | 'intermediate' | 'advanced';
  vocabLimit: number;
  grammarComplexity: string;
  persona: string;
  score: number;
}

export interface EvaluationResult {
  proficiencyLevel: ProficiencyLevel;
  vocabScore: number;
  grammarScore: number;
  errors: string[];
  suggestions: string[];
}

export interface SceneInfo {
  trigger: string;
  context: string;
  persona: string;
}

export interface ResponseConstraints {
  vocabLimit: number;
  grammarRules: string[];
  persona: string;
  scene?: SceneInfo;
} 