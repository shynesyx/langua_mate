import { Agent, AgentType, AgentResponse } from './types';
import { LanguageContext, MessageMetadata } from '../types';
import { EvaluatorAgent } from './EvaluatorAgent';
import { ResponseGeneratorAgent } from './ResponseGeneratorAgent';

export class AgentManager {
  private agents: Map<AgentType, Agent>;
  private context: LanguageContext | null = null;
  private evaluator: EvaluatorAgent;
  private responseGenerator: ResponseGeneratorAgent;

  constructor() {
    this.agents = new Map();
    
    // Initialize specialized agents
    this.evaluator = new EvaluatorAgent();
    this.responseGenerator = new ResponseGeneratorAgent();
    
    // Register agents
    this.registerAgent(this.evaluator);
    this.registerAgent(this.responseGenerator);
  }

  registerAgent(agent: Agent): void {
    this.agents.set(agent.name as AgentType, agent);
  }

  setContext(context: LanguageContext): void {
    this.context = {
      ...context,
      isLevelEvaluated: false // Initialize as false for new contexts
    };
  }

  getContext(): LanguageContext | null {
    return this.context;
  }

  updateContext(metadata: MessageMetadata): void {
    if (!this.context) return;

    // Update last interaction time
    this.context.lastInteractionTime = new Date();

    // Update context based on metadata
    if (metadata.context && !this.context.recentTopics.includes(metadata.context)) {
      this.context.recentTopics.push(metadata.context);
    }

    // Keep only the last 5 topics
    if (this.context.recentTopics.length > 5) {
      this.context.recentTopics = this.context.recentTopics.slice(-5);
    }
  }

  async routeMessage(message: string): Promise<AgentResponse> {
    if (!this.context) {
      throw new Error('Context not initialized. Call setContext() before routing messages.');
    }

    try {
      // Set fixed beginner level and skip evaluation
      this.context.currentLevel = 'beginner';
      this.context.isLevelEvaluated = true;
      // Add user message to history
      this.context.conversationHistory.push({ role: 'user', content: message });
      this.context.recentTopics.push(message);
      this.context.lastInteractionTime = new Date();
      // Generate response directly
      console.log('Generating response...');
      const response = await this.responseGenerator.process(message, this.context);
      // Add AI response to history
      this.context.conversationHistory.push({ role: 'ai', content: response.text });
      
      // Update context with new information
      this.updateContext(response.metadata);

      return {
        text: response.text,
        metadata: response.metadata
      };
    } catch (error) {
      console.error('Error in message routing:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const agentManager = new AgentManager(); 