import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const apiKey = process.env.OPENAI_API_KEY;
console.log('OpenAI API Key available:', !!apiKey);
console.log('API Key starts with:', apiKey ? apiKey.substring(0, 10) + '...' : 'N/A');

if (!apiKey) {
  console.error('OpenAI API key is missing. Please set the OPENAI_API_KEY environment variable.');
}

const openai = new OpenAI({
  apiKey: apiKey,
});

/**
 * Chat with the OpenAI API
 * @param message The user's message
 * @returns The AI's response
 */
export async function chatWithAI(message: string): Promise<string> {
  try {
    console.log('Received message:', message);
    
    // For testing, return a mock response if there's an issue with the API
    if (!apiKey || apiKey.trim() === '') {
      console.log('Using mock response due to missing API key');
      return `This is a mock response. You said: "${message}"`;
    }
    
    // Call the OpenAI API
    // Try with a different model that might be more widely available
    const model = 'gpt-3.5-turbo';
    console.log(`Calling OpenAI API with model: ${model}`);
    
    try {
      const response = await openai.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 150,
      });

      console.log('OpenAI API response received');
      
      // Extract and return the AI's response
      const aiResponse = response.choices[0]?.message?.content || 'Sorry, I could not generate a response.';
      console.log('AI response:', aiResponse);
      
      return aiResponse;
    } catch (apiError) {
      console.error('Error in OpenAI API call:', apiError);
      
      // Try with a fallback model if the first one fails
      if (apiError instanceof Error && apiError.message.includes('model')) {
        console.log('Trying with fallback model: text-davinci-003');
        try {
          const completion = await openai.completions.create({
            model: 'text-davinci-003',
            prompt: `User: ${message}\nAI:`,
            max_tokens: 150,
            temperature: 0.7,
          });
          
          const fallbackResponse = completion.choices[0]?.text?.trim() || 'Sorry, I could not generate a response.';
          console.log('Fallback AI response:', fallbackResponse);
          return fallbackResponse;
        } catch (fallbackError) {
          console.error('Error in fallback API call:', fallbackError);
          throw fallbackError;
        }
      } else {
        throw apiError;
      }
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      // Return a more helpful error message
      if (error.message.includes('API key')) {
        return 'There seems to be an issue with the API key. The API key might be invalid or expired.';
      } else if (error.message.includes('model')) {
        return 'There was an issue with the AI models. The server might be using models that are not available with your current API key.';
      } else if (error.message.includes('billing')) {
        return 'There seems to be a billing issue with the OpenAI account. Please check your account status.';
      } else if (error.message.includes('rate limit')) {
        return 'The OpenAI API rate limit has been reached. Please try again later.';
      }
    }
    
    // Return a user-friendly error message instead of throwing
    return 'I encountered an error while processing your request. This might be due to API limits or configuration issues.';
  }
} 