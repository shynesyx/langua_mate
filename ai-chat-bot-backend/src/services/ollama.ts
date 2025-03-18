import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';
import { LanguageContext, MessageMetadata } from '../types';

// Load environment variables
dotenv.config();

// Get Ollama URL from environment variables or use default
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
console.log('Using Ollama URL:', OLLAMA_URL);

// Get default model from environment variables or use default
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama2';
console.log('Using default Ollama model:', DEFAULT_MODEL);

/**
 * Chat with Ollama API
 * @param message The user's message
 * @param context The language learning context
 * @param model The model to use (defaults to llama2)
 * @returns The AI's response and metadata
 */
export async function chatWithOllama(
  message: string, 
  context: LanguageContext | null = null,
  model: string = DEFAULT_MODEL
): Promise<{ response: string; metadata: MessageMetadata }> {
  try {
    console.log(`Sending message to Ollama (${model}):`, message);
    
    // Construct the prompt with context
    let prompt = message;
    if (context) {
      prompt = `You are a language tutor teaching ${context.targetLanguage} to a ${context.currentLevel} learner.
Their native language is ${context.nativeLanguage}.
Recent topics: ${context.recentTopics.join(', ')}
Recent grammar points: ${context.grammarPoints.join(', ')}
Recent vocabulary: ${context.vocabulary.join(', ')}
Learning goals: ${context.learningGoals.join(', ')}

User: ${message}
Tutor:`;
    }
    
    // Call the Ollama API
    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: model,
      prompt: prompt,
      stream: false
    });
    
    console.log('Ollama response received');
    
    // Extract and return the AI's response
    if (response.data && response.data.response) {
      console.log('Ollama response:', response.data.response);
      
      // Parse the response to extract metadata
      const metadata: MessageMetadata = {
        language: context?.targetLanguage,
        difficulty: context?.currentLevel,
        context: message
      };
      
      return {
        response: response.data.response,
        metadata
      };
    } else {
      console.error('Invalid response format from Ollama:', response.data);
      return {
        response: 'Sorry, I received an invalid response format from the AI model.',
        metadata: {}
      };
    }
  } catch (error: unknown) {
    console.error('Error calling Ollama API:', error);
    
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error('Axios error details:', {
        message: axiosError.message,
        status: axiosError.response?.status,
        data: axiosError.response?.data
      });
      
      // Return a more helpful error message
      if (axiosError.code === 'ECONNREFUSED') {
        return {
          response: 'Could not connect to Ollama. Please make sure Ollama is running on WSL and accessible.',
          metadata: {}
        };
      } else if (axiosError.response?.status === 404) {
        return {
          response: `The model "${model}" was not found. Please check available models with "ollama list".`,
          metadata: {}
        };
      } else if (axiosError.response?.status === 400) {
        return {
          response: 'There was an issue with the request format. Please check the server logs.',
          metadata: {}
        };
      }
    }
    
    // Return a user-friendly error message
    return {
      response: 'I encountered an error while connecting to the Ollama AI service. Please check if Ollama is running properly.',
      metadata: {}
    };
  }
} 