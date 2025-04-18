import { apiService } from './apiService';

export type GuideAuth = {
  id: string;
  email: string;
  password?: string;
  fullName: string;
  hasProfile: boolean;
  token: string;
  createdAt: Date;
  updatedAt: Date;
};

export const guideAuthService = {
  async register(email: string, password: string, fullName: string): Promise<GuideAuth> {
    try {
      return await apiService.post('/guide-auth/register', { email, password, fullName });
    } catch (error) {
      console.error('Error registering guide:', error);
      throw error;
    }
  },

  async login(email: string, password: string): Promise<GuideAuth> {
    try {
      return await apiService.post('/guide-auth/login', { email, password });
    } catch (error) {
      console.error('Error logging in guide:', error);
      throw error;
    }
  },

  async getGuideRequests(guideId: string): Promise<any[]> {
    try {
      return await apiService.get(`/guide-auth/${guideId}/requests`);
    } catch (error) {
      console.error('Error getting guide requests:', error);
      throw error;
    }
  }
}; 