import React, { useState } from 'react';
import styled from 'styled-components';
import { ThemeProvider } from 'styled-components';
import { theme } from './theme';
import ChatInterface from './components/ChatInterface';
import LanguageSelector from './components/LanguageSelector';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #f5f8fa;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  color: #333;
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  color: #666;
  font-size: 18px;
  margin-top: 0;
`;

function App() {
  const [contextSet, setContextSet] = useState(false);

  return (
    <ThemeProvider theme={theme}>
      <AppContainer>
        <Header>
          <Title>LanguaMate</Title>
          <Subtitle>Your Friend in Any Language</Subtitle>
        </Header>
        
        {contextSet ? (
          <ChatInterface />
        ) : (
          <LanguageSelector onContextSet={() => setContextSet(true)} />
        )}
      </AppContainer>
    </ThemeProvider>
  );
}

export default App;