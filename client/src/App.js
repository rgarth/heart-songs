// client/src/App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Home from './pages/Home';
import Game from './pages/Game';
import Callback from './pages/Callback';
import JoinGame from './pages/JoinGame'; // New import for JoinGame component
import PrivateRoute from './components/PrivateRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/callback" element={<Callback />} />
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
            {/* New route for joining games with a code */}
            <Route 
              path="/join/:gameCode" 
              element={
                <PrivateRoute>
                  <JoinGame />
                </PrivateRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;