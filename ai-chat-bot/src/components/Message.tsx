import React, { useState } from 'react';
import styled from 'styled-components';
import { MessageType } from '../types';
import { audioService } from '../services/AudioService';
import AudioPlayer from './AudioPlayer';

interface MessageProps {
  message: MessageType;
}

const MessageContainer = styled.div<{ isUser: boolean }>`
  display: flex;
  flex-direction: ${({ isUser }) => (isUser ? 'row-reverse' : 'row')};
  align-items: flex-start;
  max-width: 80%;
  align-self: ${({ isUser }) => (isUser ? 'flex-end' : 'flex-start')};
  flex-shrink: 0;
`;

const Avatar = styled.div<{ isUser: boolean }>`
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: 50%;
  background-color: ${({ isUser, theme }) => (isUser ? theme.colors.primary : '#6c757d')};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.background};
  font-weight: bold;
  margin: ${({ isUser }) => (isUser ? '0 0 0 10px' : '0 10px 0 0')};
`;

const MessageBubble = styled.div<{ isUser: boolean }>`
  background-color: ${({ isUser, theme }) => (isUser ? theme.colors.hover : '#f8f9fa')};
  border-radius: 18px;
  padding: 12px 16px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  position: relative;
  flex: 1;
  min-width: 0;
  max-width: 100%;
  overflow-wrap: break-word;
`;

const MessageText = styled.div`
  margin: 0;
  font-size: 16px;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
  position: relative;
`;

const TranslationTooltip = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  margin-top: 8px;
  z-index: 1000;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s, visibility 0.2s;

  ${MessageText}:hover & {
    opacity: 1;
    visibility: visible;
  }

  &::before {
    content: '';
    position: absolute;
    top: -6px;
    left: 20px;
    border-left: 6px solid transparent;
    border-right: 6px solid transparent;
    border-bottom: 6px solid rgba(0, 0, 0, 0.8);
  }
`;

const Timestamp = styled.span`
  font-size: 12px;
  color: #999;
  margin-top: 5px;
  display: block;
`;

const LearningDetails = styled.div`
  margin-top: 10px;
  padding: 10px;
  background-color: #f8f9fa;
  border-left: 3px solid #007bff;
  border-radius: 4px;
`;

const DetailToggle = styled.button`
  background: none;
  border: none;
  color: #007bff;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  margin-top: 5px;
  text-decoration: underline;
  
  &:hover {
    color: #0056b3;
  }
`;

const Section = styled.div`
  margin-bottom: 15px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h4`
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #495057;
  font-weight: 600;
`;

const ExampleList = styled.ul`
  margin: 8px 0;
  padding-left: 20px;
  list-style-type: disc;
`;

const PracticePrompt = styled.div`
  margin-top: 8px;
  font-style: italic;
  color: #6c757d;
`;

const ErrorList = styled.ul`
  margin: 8px 0;
  padding-left: 20px;
  list-style-type: none;

  li {
    margin: 4px 0;
    color: #dc3545;
    position: relative;

    &::before {
      content: "!";
      color: #dc3545;
      position: absolute;
      left: -15px;
      font-weight: bold;
    }
  }
`;

const SuggestionList = styled.ul`
  margin: 8px 0;
  padding-left: 20px;
  list-style-type: none;

  li {
    margin: 4px 0;
    color: #28a745;
    position: relative;

    &::before {
      content: "✓";
      color: #28a745;
      position: absolute;
      left: -15px;
    }
  }
`;

const Message: React.FC<MessageProps> = ({ message }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const isUser = message.sender === 'user';
  const formattedTime = message.timestamp.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  const messageText = message.text || 'No message content';

  const hasLearningContent = !isUser && message.metadata && (
    message.metadata.teachingPoints ||
    message.metadata.evaluationResult ||
    message.metadata.constraints
  );

  const handlePlayClick = async () => {
    try {
      if (isPlaying) {
        audioService.stop();
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
        await audioService.speak({
          ...message,
          text: messageText
        });
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Failed to play audio:', error);
      setIsPlaying(false);
    }
  };

  return (
    <MessageContainer isUser={isUser}>
      <Avatar isUser={isUser}>
        {isUser ? 'U' : 'AI'}
      </Avatar>
      <MessageBubble isUser={isUser}>
        <MessageText>
          <span style={{ position: 'relative' }}>
            {messageText}
            {!isUser && message.metadata?.translation && (
              <TranslationTooltip>
                {message.metadata.translation}
              </TranslationTooltip>
            )}
          </span>
        </MessageText>
        {!isUser && (
          <AudioPlayer 
            audioUrl={`http://localhost:5000/api/tts/synthesize`}
            text={messageText}
            language={message.metadata?.language || 'en'}
            onPlaybackEnd={() => setIsPlaying(false)}
          />
        )}
        <Timestamp>{formattedTime}</Timestamp>
        
        {hasLearningContent && (
          <>
            <DetailToggle onClick={() => setShowDetails(!showDetails)}>
              {showDetails ? 'Hide Learning Details' : 'Show Learning Details'}
            </DetailToggle>
            {showDetails && message.metadata && (
              <LearningDetails>
                {message.metadata.teachingPoints && (
                  <Section>
                    <SectionTitle>Grammar & Vocabulary</SectionTitle>
                    {message.metadata.teachingPoints.explanation && (
                      <div>{message.metadata.teachingPoints.explanation}</div>
                    )}
                    {Array.isArray(message.metadata.teachingPoints.examples) && message.metadata.teachingPoints.examples.length > 0 && (
                      <>
                        <SectionTitle>Examples</SectionTitle>
                        <ExampleList>
                          {message.metadata.teachingPoints.examples.map((example, index) => (
                            <li key={index}>{example}</li>
                          ))}
                        </ExampleList>
                      </>
                    )}
                    {message.metadata.teachingPoints.practice && (
                      <>
                        <SectionTitle>Practice</SectionTitle>
                        <PracticePrompt>{message.metadata.teachingPoints.practice}</PracticePrompt>
                      </>
                    )}
                  </Section>
                )}
                {message.metadata.evaluationResult && (
                  <Section>
                    <SectionTitle>Your Progress</SectionTitle>
                    {Array.isArray(message.metadata.evaluationResult.errors) && message.metadata.evaluationResult.errors.length > 0 && (
                      <>
                        <SectionTitle>Areas to Improve</SectionTitle>
                        <ErrorList>
                          {message.metadata.evaluationResult.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ErrorList>
                      </>
                    )}
                    {Array.isArray(message.metadata.evaluationResult.suggestions) && message.metadata.evaluationResult.suggestions.length > 0 && (
                      <>
                        <SectionTitle>Suggestions</SectionTitle>
                        <SuggestionList>
                          {message.metadata.evaluationResult.suggestions.map((suggestion, index) => (
                            <li key={index}>{suggestion}</li>
                          ))}
                        </SuggestionList>
                      </>
                    )}
                  </Section>
                )}
              </LearningDetails>
            )}
          </>
        )}
      </MessageBubble>
    </MessageContainer>
  );
};

export default Message;