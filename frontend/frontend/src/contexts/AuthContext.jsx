import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  
  // API URL from environment variable or default
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    // Check if user is logged in on initial load
    const token = localStorage.getItem('token');
    if (token) {
      fetchUserProfile(token);
    } else {
      setLoading(false);
      setAuthenticated(false);
    }

    // Set up token refresh interval
    const refreshInterval = setInterval(() => {
      refreshToken();
    }, 20 * 60 * 1000); // Refresh every 20 minutes

    return () => clearInterval(refreshInterval);
  }, []);

  const fetchUserProfile = async (token) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCurrentUser(response.data);
      setAuthenticated(true);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      
      // Try to refresh the token if available
      const refreshed = await refreshToken();
      if (!refreshed) {
        logout(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const response = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
      const { token } = response.data;
      localStorage.setItem('token', token);
      
      // Fetch user profile with new token
      await fetchUserProfile(token);
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return false;
    }
  };

  const login = async (email, password) => {
    try {
      setError('');
      setLoading(true);
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token, refreshToken, user } = response.data;
      
      localStorage.setItem('token', token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      setCurrentUser(user);
      setAuthenticated(true);
      return user;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Failed to login');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError('');
      setLoading(true);
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.response?.data?.message || 'Failed to register');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (callApi = true) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (token && callApi) {
        await axios.post(`${API_URL}/auth/logout`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setCurrentUser(null);
      setAuthenticated(false);
      setLoading(false);
    }
  };

  const value = {
    currentUser,
    authenticated,
    login,
    register,
    logout,
    loading,
    error,
    refreshToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
