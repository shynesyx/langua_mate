import { GoogleGenerativeAI } from "@google/generative-ai";
import { LanguageContext, MessageMetadata } from "../types";

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || "your-api-key-here");

interface GeminiResponse {
  response: string;
  translation: string;
  teachingPoints: {
    explanation?: string;
    examples?: string[];
    practice?: string;
  };
}

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

/**
 * Chat with Gemini API
 * @param message The user's message
 * @param context The language learning context
 * @param model The Gemini model to use (defaults to gemini-1.5-flash)
 * @returns The AI's response and metadata
 */
export async function chatWithGemini(
  message: string,
  context: LanguageContext,
  model: string = "gemini-2.0-flash"
): Promise<{ response: string; metadata: MessageMetadata }> {
  try {
    console.log(`Sending message to Gemini (${model}):`, message);

    // Initialize the Gemini model
    const geminiModel = genAI.getGenerativeModel({ model });
    // Add the system prompt to set the context
    const systemPrompt = `
      You are "LinguaMate," a friendly language tutor teaching ${context.targetLanguage} to a ${context.currentLevel} learner whose native language is ${context.nativeLanguage}.
      Respond in ${context.targetLanguage} in a friendly, conversational tone, like chatting with a close friend.
      Use ${context.currentLevel} level ${context.targetLanguage}.
      Do NOT repeat the user's exact words or questions unless you need to clarify something.
      Use the conversation history to continue the topic or introduce a related one.
      If the user gives a short response (e.g., "はい"), acknowledge it and move the conversation forward.
      Include a translation of your response in ${context.nativeLanguage}.
      Provide 1-2 teaching points (e.g., explain a word, grammar point, or cultural note) as a list.
      Format your response as JSON with "response", "translation", and "teachingPoints" fields.
    `;

    // Start a chat session with history
    const chat = geminiModel.startChat({
        generationConfig,
        history: []
    });

    // Send the user's message with the system prompt
    const response = await chat.sendMessage(message);
    console.log('Gemini response received:', response.response.text());

    // Parse the response
    const responseText = response.response.text();
    
    if (response.response && response.response.text()) {
        const metadata: MessageMetadata = {
        language: context?.targetLanguage,
        difficulty: context?.currentLevel,
        context: message
        };

        return {
            response: response.response.text(),
            metadata: {}
        };
    } else {
        console.error('Invalid response format from Gemini:', response);

        return {
        response: 'I couldn’t generate a proper response. Let’s try again!',
        metadata: {}
        };
    }
  } catch (error: unknown) {
    console.error('Error calling Gemini API:', error);
    return {
      response: 'I encountered an error while connecting to the Gemini API. Please check your API key and internet connection.',
      metadata: {}
    };
  }
}