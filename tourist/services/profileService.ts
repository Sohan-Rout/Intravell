import { apiService } from './apiService';
import * as FileSystem from 'expo-file-system';

export type GuideProfile = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  profileImage?: string;
  city: string;
  languages: string[];
  experience: string;
  hourlyRate: number;
  rating: number;
  totalReviews: number;
  bio: string;
  specialties: string[];
  certifications?: {
    name: string;
    issuer: string;
    date: string;
  }[];
  availability: {
    days: string[];
    hours: {
      start: string;
      end: string;
    };
  };
  portfolio: {
    images: string[];
    description: string;
  }[];
  reviews: {
    id: string;
    touristName: string;
    rating: number;
    comment: string;
    date: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
};

export const profileService = {
  async getProfile(): Promise<GuideProfile> {
    try {
      return await apiService.get('/guides/profile');
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error;
    }
  },

  async updateProfile(profile: Partial<GuideProfile>): Promise<GuideProfile> {
    try {
      return await apiService.post('/guides/profile', profile);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  },

  async uploadProfileImage(imageUri: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'profile.jpg'
      } as any);
      
      return await apiService.post('/guides/profile/image', formData);
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw error;
    }
  },

  async uploadPortfolioImage(imageUri: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: imageUri,
        type: 'image/jpeg',
        name: 'portfolio.jpg'
      } as any);
      
      return await apiService.post('/guides/portfolio/image', formData);
    } catch (error) {
      console.error('Error uploading portfolio image:', error);
      throw error;
    }
  },

  async updateAvailability(availability: GuideProfile['availability']): Promise<GuideProfile> {
    try {
      return await apiService.post('/guides/availability', availability);
    } catch (error) {
      console.error('Error updating availability:', error);
      throw error;
    }
  },

  async updateCertifications(certifications: GuideProfile['certifications']): Promise<GuideProfile> {
    try {
      return await apiService.post('/guides/certifications', certifications);
    } catch (error) {
      console.error('Error updating certifications:', error);
      throw error;
    }
  },

  async updatePortfolio(portfolio: GuideProfile['portfolio']): Promise<GuideProfile> {
    try {
      return await apiService.post('/guides/portfolio', portfolio);
    } catch (error) {
      console.error('Error updating portfolio:', error);
      throw error;
    }
  }
}; 