import { apiService } from './apiService';

export type TouristAuth = {
  id: string;
  email: string;
  fullName: string;
  nationality: string;
  hasProfile: boolean;
  createdAt: string;
  updatedAt: string;
};

export const touristAuthService = {
  register: async (email: string, password: string, fullName: string, nationality: string) => {
    try {
      const response = await apiService.post('/tourist-auth/register', {
        email,
        password,
        fullName,
        nationality
      });
      return response.data;
    } catch (error) {
      console.error('Error registering tourist:', error);
      throw error;
    }
  },

  login: async (email: string, password: string) => {
    try {
      const response = await apiService.post('/tourist-auth/login', {
        email,
        password
      });
      return response.data;
    } catch (error) {
      console.error('Error logging in tourist:', error);
      throw error;
    }
  },

  getProfile: async () => {
    try {
      const response = await apiService.get('/tourist-auth/profile');
      return response.data;
    } catch (error) {
      console.error('Error getting tourist profile:', error);
      throw error;
    }
  }
}; 