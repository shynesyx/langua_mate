import React, { useState } from 'react';
import styled from 'styled-components';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/';

interface LanguageSelectorProps {
  onContextSet: () => void;
}

const Container = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
`;

const Title = styled.h2`
  color: #333;
  margin-top: 0;
  margin-bottom: 20px;
  text-align: center;
`;

const Subtitle = styled.p`
  color: #666;
  text-align: center;
  margin-bottom: 30px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Label = styled.label`
  font-weight: bold;
  color: #555;
  text-align: center;
`;

const Select = styled.select`
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
  background-color: white;
  cursor: pointer;
  transition: border-color 0.2s;

  &:hover {
    border-color: #007bff;
  }

  &:focus {
    border-color: #007bff;
    outline: none;
  }
`;

const Button = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 14px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: #0056b3;
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: #d9534f;
  font-size: 14px;
  margin-top: 10px;
  text-align: center;
`;

const SuccessMessage = styled.div`
  color: #5cb85c;
  font-size: 14px;
  margin-top: 10px;
  text-align: center;
`;

const languages = [
  'Spanish', 'French', 'German', 'Italian', 'Portuguese', 
  'Japanese', 'Chinese', 'Korean', 'Russian', 'Arabic'
];

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ onContextSet }) => {
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.post(`${API_URL}/context`, {
        targetLanguage,
        nativeLanguage: 'English', // Default to English for now
        currentLevel: 'beginner', // Start with beginner, will be adjusted automatically
        learningGoals: ['Conversation practice'] // Default goal
      });
      
      setSuccess('Great! Let\'s start practicing ' + targetLanguage);
      setTimeout(() => {
        onContextSet();
      }, 1500);
    } catch (error) {
      console.error('Error setting context:', error);
      setError('Failed to set language. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <Title>Welcome to LanguaMate</Title>
      <Subtitle>
        Your friend in the language of select will be with you momentarily.
      </Subtitle>
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="targetLanguage">Which language would you like to learn?</Label>
          <Select 
            id="targetLanguage" 
            value={targetLanguage} 
            onChange={(e) => setTargetLanguage(e.target.value)}
          >
            {languages.map(lang => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </Select>
        </FormGroup>
        
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Setting up...' : 'Start Learning'}
        </Button>
        
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}
      </Form>
    </Container>
  );
};

export default LanguageSelector;