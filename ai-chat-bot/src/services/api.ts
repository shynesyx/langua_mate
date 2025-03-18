import axios from 'axios';
import { MessageMetadata } from '../types';

// Configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/';
const useMockResponse = process.env.REACT_APP_USE_MOCK_RESPONSES === 'true';
const TIMEOUT = 300000; // 5 minutes

// Mock response for testing without backend
const getMockResponse = (message: string) => {
  return new Promise<{ message: string; metadata: MessageMetadata }>((resolve) => {
    setTimeout(() => {
      resolve({ 
        message: "こんにちは！お元気ですか？",
        metadata: {
          language: 'ja',
          difficulty: 'beginner',
          context: 'conversation',
          translation: "Hello! How are you?",
          teachingPoints: {
            explanation: "This is a common Japanese greeting. 'こんにちは' (konnichiwa) is used during the day, while 'お元気ですか' (o-genki desu ka) is a polite way to ask about someone's well-being.",
            examples: [
              "おはようございます (Good morning)",
              "こんばんは (Good evening)",
              "元気です (I'm fine)"
            ],
            practice: "Try greeting someone at different times of the day using the appropriate phrase."
          }
        }
      });
    }, 1000);
  });
};

// Send a message to the API
export const sendMessage = async (message: string): Promise<{ 
  response: string; 
  metadata: MessageMetadata;
  translation?: string;
  teachingPoints?: {
    explanation?: string;
    examples?: string[];
    practice?: string;
  };
}> => {
  if (useMockResponse) {
    const mockResponse = await getMockResponse(message);
    return {
      response: mockResponse.message,
      metadata: mockResponse.metadata,
      translation: mockResponse.metadata.translation,
      teachingPoints: mockResponse.metadata.teachingPoints
    };
  }

  try {
    const response = await axios.post(`${API_URL}/chat`, { message }, {
      timeout: TIMEOUT
    });
    
    return {
      response: response.data.message,
      metadata: response.data.metadata || {},
      translation: response.data.metadata?.translation,
      teachingPoints: response.data.metadata?.teachingPoints
    };
  } catch (error) {
    console.error('Error sending message to API:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('Request timed out. The server took too long to respond.');
      }
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 400) {
          throw new Error('Bad request. Please check your message format.');
        } else if (error.response.status === 401) {
          throw new Error('Unauthorized. Please check your API key.');
        } else if (error.response.status === 404) {
          throw new Error('API endpoint not found. Please check your API URL.');
        } else if (error.response.status === 500) {
          throw new Error('Server error. Please check if Ollama is running in WSL.');
        } else {
          throw new Error(`Server responded with status code ${error.response.status}`);
        }
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response received from server. Please check if the backend is running.');
      }
    }
    
    // Something happened in setting up the request that triggered an Error
    throw new Error('An unexpected error occurred while sending the message.');
  }
}; 