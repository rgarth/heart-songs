// client/src/App.js - Updated with Terms Checkbox on Login
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import TermsChecker from './components/TermsChecker';
import Login from './pages/Login';
import Home from './pages/Home';
import Game from './pages/Game';
import JoinGame from './pages/JoinGame';
import PrivateRoute from './components/PrivateRoute';
import Terms from './pages/Terms';

function App() {
  return (
    <AuthProvider>
      <Router>
        <TermsChecker>
          <div className="app">
            <Routes>
              <Route path="/login" element={<Login />} />
              
              <Route 
                path="/" 
                element={
                  <PrivateRoute>
                    <Home />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/game/:gameId" 
                element={
                  <PrivateRoute>
                    <Game />
                  </PrivateRoute>
                } 
              />
              
              {/* Route for joining games with a code */}
              <Route 
                path="/join/:gameCode" 
                element={
                  <PrivateRoute>
                    <JoinGame />
                  </PrivateRoute>
                } 
              />
              
              {/* Terms of Service page */}
              <Route path="/terms" element={<Terms />} />
              
              {/* Redirect all other routes to home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </TermsChecker>
      </Router>
    </AuthProvider>
  );
}

export default App;