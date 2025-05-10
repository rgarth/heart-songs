// client/src/hooks/useAuth.js
import { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const useAuth = () => {
  const { user, accessToken, logout, validateUserSession } = useContext(AuthContext);
  const navigate = useNavigate();

  // Check session validity periodically
  useEffect(() => {
    // Check session immediately
    const checkSession = async () => {
      if (user && accessToken) {
        const isValid = await validateUserSession();
        if (!isValid) {
          // The session validation will automatically logout on invalid session
          navigate('/login');
        }
      }
    };

    checkSession();

    // Set up periodic checks (every 5 minutes)
    const intervalId = setInterval(checkSession, 5 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [user, accessToken, validateUserSession, navigate]);

  // Listen for session expired events
  useEffect(() => {
    const handleSessionExpired = () => {
      logout();
      navigate('/login');
    };

    window.addEventListener('sessionExpired', handleSessionExpired);

    return () => {
      window.removeEventListener('sessionExpired', handleSessionExpired);
    };
  }, [logout, navigate]);

  return {
    user,
    accessToken,
    logout,
    validateUserSession,
    isAuthenticated: !!user && !!accessToken,
  };
};

export default useAuth;