import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../lib/supabaseClient';
import { MessageMetadata, MessageType } from '../types';


interface Conversation {
  id: string;
  user_id: string;
  title: string | null;
  created_at: Date;
  updated_at: Date;
  context: string | null;
}

export const getUserID = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
  const user = data.user; // Access the user object
  const userId = user.id; // Access the user ID
  return userId;
}

export const getMessages = async (
  limit: number = 50,
  offset: number = 0
): Promise<MessageType[]> => {
  const conversationId = await getConversationId();

  console.log('Fetching messages for conversation:', conversationId);

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true})
    .limit(limit)
    .range(offset, offset + limit);

  if (error) {
    throw new Error('Error fetching messages: ' + error.message);
  }

  return data.map((msg: any) => ({
    id: msg.id,
    text: msg.content,
    sender: msg.is_user ? 'user' : 'bot',
    timestamp: new Date(msg.created_at),
    metadata: msg.metadata
  }));
};

async function createConversation(
    userId: string,
    title: string | null,
  ): Promise<Conversation> {
  const conversationId = uuidv4();

  const { data, error } = await supabase
    .from('conversations')
    .insert([
      {
        id: conversationId,
        user_id: userId,
        title: title,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }

  return data as Conversation;
}
  
export const getConversationId = async (): Promise<string> => {
  const userId = await getUserID();
  const { data: conversationIds, error } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', userId)

  if (error) {
    throw new Error('Error fetching conversation ID: ' + error.message);
  }

  if (conversationIds.length === 0) {
    const conversation = await createConversation(userId, null);
    return conversation.id;
  }

  return conversationIds[0].id as string;
};

// persist data to the server
export const persistMessage = async (message: MessageType) => {
  const conversationId = await getConversationId();
  const userId = await getUserID();
  const isUser = message.sender === 'user';
  const content = message.text;
  const metadata = message.metadata || {};

  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          conversation_id: conversationId,
          user_id: userId,
          is_user: isUser,
          content,
          metadata
        },
      ])
      .select()
      .single();
    if (error) {
      console.error('Error inserting message:', error);
      throw error;
    }
    return data as {
      id: string;
      conversation_id: string;
      user_id: string;
      is_user: boolean;
      content: string;
      metadata: MessageMetadata;
    };
  } catch (error) {
    console.error('Error persisting message data:', error);
    throw error;
  }
};