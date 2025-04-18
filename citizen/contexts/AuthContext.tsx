import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { guideAuthService, GuideAuth } from '../services/guideAuthService';

export type User = {
  id: string;
  email: string;
  fullName: string;
  hasProfile: boolean;
  token?: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      const userJson = await AsyncStorage.getItem('user');
      
      if (userJson) {
        const userData = JSON.parse(userJson);
        setUser(userData);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Call the guide auth service to authenticate
      const guideData = await guideAuthService.login(email, password);
      
      // Convert GuideAuth to User
      const userData: User = {
        id: guideData.id,
        email: guideData.email,
        fullName: guideData.fullName,
        hasProfile: guideData.hasProfile || false,
        token: guideData.token,
      };
      
      // Store user data in AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      // Redirect to dashboard
      router.replace('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true);
      
      // Call the guide auth service to register
      const guideData = await guideAuthService.register(email, password, fullName);
      
      // Convert GuideAuth to User
      const userData: User = {
        id: guideData.id,
        email: guideData.email,
        fullName: guideData.fullName,
        hasProfile: false,
        token: guideData.token,
      };
      
      // Store user data in AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      // Redirect to profile setup
      router.replace('/profile-setup');
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      // Remove user data from AsyncStorage
      await AsyncStorage.removeItem('user');
      setUser(null);
      
      // Redirect to login
      router.replace('/');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 