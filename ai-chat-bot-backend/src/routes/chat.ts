import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { agentManager } from '../agents/AgentManager';
import { LanguageContext } from '../types';

// Load environment variables
dotenv.config();

const router = express.Router();

// Initialize language context
let languageContextInitialized = false;

// POST /api/chat - Send a message to the AI and get a response
router.post('/chat', (req: Request, res: Response) => {
  const handleChat = async () => {
    try {
      console.log('Received request body:', req.body);
      const { message, context } = req.body;
      
      if (!message) {
        console.log('No message provided in request');
        return res.status(400).json({ message: 'Please provide a message to chat with the AI.' });
      }

      // Initialize context if not already done
      if (!languageContextInitialized) {
        const defaultContext: LanguageContext = {
          targetLanguage: context?.targetLanguage || 'Japanese',
          nativeLanguage: context?.nativeLanguage || 'English',
          currentLevel: context?.currentLevel || 'beginner',
          learningGoals: context?.learningGoals || ['Basic conversation'],
          recentTopics: [],
          grammarPoints: [],
          vocabulary: [],
          sessionStartTime: new Date(),
          lastInteractionTime: new Date()
        };
        
        agentManager.setContext(defaultContext);
        languageContextInitialized = true;
        console.log('Language context initialized:', defaultContext);
      } else if (context) {
        // Update context if provided in the request
        const currentContext = agentManager.getContext();
        if (currentContext) {
          const updatedContext: LanguageContext = {
            ...currentContext,
            ...context,
            lastInteractionTime: new Date()
          };
          agentManager.setContext(updatedContext);
          console.log('Language context updated:', updatedContext);
        }
      }
      
      console.log('Processing message:', message);
      
      // Route the message to the appropriate agent
      const response = await agentManager.routeMessage(message);
      
      console.log('Response metadata:', {
        language: response.metadata.language,
        difficulty: response.metadata.difficulty,
        translation: response.metadata.translation
      });
      
      console.log('Sending response back to client:', response);
      
      return res.status(200).json({ 
        message: response.text,
        metadata: response.metadata
      });
    } catch (error) {
      console.error('Error in chat endpoint:', error);
      
      // Even if there's an error, we'll send a response rather than letting the request hang
      return res.status(500).json({ 
        message: error instanceof Error 
          ? `Error: ${error.message}` 
          : 'An unexpected error occurred. Please try again later.'
      });
    }
  };

  handleChat();
});

// POST /api/context - Update the language learning context
router.post('/context', (req: Request, res: Response) => {
  try {
    const context = req.body;
    
    if (!context) {
      return res.status(400).json({ message: 'Please provide a context object.' });
    }
    
    const languageContext: LanguageContext = {
      targetLanguage: context.targetLanguage || 'Spanish',
      nativeLanguage: context.nativeLanguage || 'English',
      currentLevel: context.currentLevel || 'beginner',
      learningGoals: context.learningGoals || [],
      recentTopics: context.recentTopics || [],
      grammarPoints: context.grammarPoints || [],
      vocabulary: context.vocabulary || [],
      sessionStartTime: new Date(),
      lastInteractionTime: new Date()
    };
    
    agentManager.setContext(languageContext);
    languageContextInitialized = true;
    
    return res.status(200).json({ 
      message: 'Context updated successfully',
      context: agentManager.getContext()
    });
  } catch (error) {
    console.error('Error updating context:', error);
    return res.status(500).json({ 
      message: error instanceof Error 
        ? `Error: ${error.message}` 
        : 'An unexpected error occurred while updating the context.'
    });
  }
});

// GET /api/context - Get the current language learning context
router.get('/context', (req: Request, res: Response) => {
  try {
    const context = agentManager.getContext();
    
    if (!context) {
      return res.status(404).json({ message: 'No context has been initialized yet.' });
    }
    
    return res.status(200).json({ context });
  } catch (error) {
    console.error('Error getting context:', error);
    return res.status(500).json({ 
      message: error instanceof Error 
        ? `Error: ${error.message}` 
        : 'An unexpected error occurred while getting the context.'
    });
  }
});

export default router; 