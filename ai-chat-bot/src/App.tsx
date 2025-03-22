import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ThemeProvider } from 'styled-components';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { theme } from './theme';
import ChatInterface from './components/ChatInterface';
import LanguageSelector from './components/LanguageSelector';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { AuthProvider, useAuth } from './context/AuthContext';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  min-height: 90vh;
  padding: 20px;
  background-color: #f5f8fa;
`;

const Header = styled.header`
  text-align: center;
  margin-bottom: 30px;
  width: 100%;
  background-color: rgb(117, 117, 115);
  padding: 5px;
  border-radius: 8px;
  font-family: 'Arial', sans-serif;
`;

const NavBar = styled.nav`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  width: 100%;
  max-width: 100%;
  margin-bottom: 10px;
  margin-top: 10px;
  margin-right: 50px;
  background-color: rgb(117, 117, 115);
`;

const NavLinkContainer = styled.div`
  display: flex;
  gap: 15px;
`;

const NavLink = styled(Link)`
  color: rgb(220, 233, 241);
  text-decoration: none;
  font-size: 16px;
  transition: color 0.3s ease;
  &:hover {
    color: #0d8bf0;
  }
`;

const LogoutButton = styled.button`
  background: none;
  border: none;
  color: rgb(220, 233, 241);
  font-size: 16px;
  cursor: pointer;
  &:hover {
    color: #0d8bf0;
  }
`;

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const AppContent: React.FC = () => {
  const [contextSet, setContextSet] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user, signOut, userData } = useAuth();
  const navigate = useNavigate(); // Add this hook for navigation

  const handleLogout = async () => {
    console.log('Signing out');
    try {
      await signOut();
      setContextSet(false);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
    console.log('Signed out');
  };

  useEffect(() => {
    // Only update states when we have definitive information about the user
    if (user !== undefined) { // Check that auth state is determined
      if (user) {
        // User is logged in
        if (userData) {
          // User data has loaded
          setContextSet(userData?.target_languages?.length > 0);
          setLoading(false);
        }
      } else {
        // User is not logged in
        setContextSet(false);
        setLoading(false);
      }
    }
  }, [user, userData]);

  if (loading) {
    return <div>Loading...</div>; // or a nicer loading component
  }

  return (
    <>
      <Header>
        <NavBar>
          <NavLinkContainer>
            {user ? (
              <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
            ) : (
              <>
                <NavLink to="/login">Login</NavLink>
                <NavLink to="/signup">Signup</NavLink>
              </>
            )}
          </NavLinkContainer>
        </NavBar>
      </Header>
      <AppContainer>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/chat"
            element={
              !user ? (
                <Navigate to="/login" />
              ) : !contextSet ? (
                <Navigate to="/language-selector" />
              ) : (
                <ChatInterface />
              )
            }
          />
          <Route 
            path="/language-selector" 
            element={
              !user ? (
                <Navigate to="/login" />
              ) : contextSet ? (
                <Navigate to="/chat" />
              ) : (
                <LanguageSelector onContextSet={() => setContextSet(true)} />
              )
            } 
          />
          <Route path="/" element={<Navigate to={user ? (contextSet ? "/chat" : "/language-selector") : "/login"} />} />
        </Routes>
      </AppContainer>
    </>
  );
};

// Modify your App component to wrap the content
const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <AppContent />
      </Router>
    </ThemeProvider>
  );
};

const AppWrapper: React.FC = () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);

export default AppWrapper;