// client/src/pages/Debug.js
import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const Debug = () => {
  const { user, sessionToken, login, logout } = useContext(AuthContext);
  const [storageData, setStorageData] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [testLoading, setTestLoading] = useState(false);
  
  // Read localStorage values
  useEffect(() => {
    const data = {
      anon_user: localStorage.getItem('anon_user'),
      session_token: localStorage.getItem('session_token'),
      session_expiry: localStorage.getItem('session_expiry')
    };
    setStorageData(data);
  }, [user, sessionToken]);
  
  // Test token with a direct API call
  const testToken = async () => {
    setTestLoading(true);
    try {
      const token = localStorage.getItem('session_token');
      
      const response = await axios.get('http://127.0.0.1:5050/health', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setTestResult({
        success: true,
        token: token,
        data: response.data
      });
    } catch (error) {
      setTestResult({
        success: false,
        token: localStorage.getItem('session_token'),
        error: error.message,
        response: error.response?.data
      });
    } finally {
      setTestLoading(false);
    }
  };
  
  // Create a test user
  const createTestUser = () => {
    const testUser = {
      id: 'test123',
      displayName: 'test_user_1234',
      score: 0,
      isAnonymous: true
    };
    const testToken = 'test_token_' + Date.now();
    login(testUser, testToken);
  };
  
  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold mb-6">Authentication Debug</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-3">Auth Context State</h2>
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-gray-700 p-3 rounded">
              <h3 className="font-medium mb-1">User</h3>
              <pre className="bg-gray-900 p-2 rounded overflow-auto text-sm">
                {user ? JSON.stringify(user, null, 2) : "null"}
              </pre>
            </div>
            
            <div className="bg-gray-700 p-3 rounded">
              <h3 className="font-medium mb-1">Session Token</h3>
              <pre className="bg-gray-900 p-2 rounded overflow-auto text-sm">
                {sessionToken || "null"}
              </pre>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-3">localStorage Values</h2>
          <div className="grid grid-cols-1 gap-3">
            {Object.entries(storageData).map(([key, value]) => (
              <div key={key} className="bg-gray-700 p-3 rounded">
                <h3 className="font-medium mb-1">{key}</h3>
                <pre className="bg-gray-900 p-2 rounded overflow-auto text-sm">
                  {value || "null"}
                </pre>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-3">Test API Request</h2>
          <button 
            onClick={testToken}
            disabled={testLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-4"
          >
            {testLoading ? 'Testing...' : 'Test Token with API Request'}
          </button>
          
          {testResult && (
            <div className={`p-3 rounded ${testResult.success ? 'bg-green-800' : 'bg-red-800'}`}>
              <h3 className="font-medium mb-1">Result</h3>
              <pre className="bg-gray-900 p-2 rounded overflow-auto text-sm">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-3">Actions</h2>
          <div className="flex gap-3">
            <button 
              onClick={createTestUser}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Create Test User
            </button>
            
            <button 
              onClick={logout}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Debug;