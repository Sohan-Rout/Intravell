import { apiService } from './apiService';

export type GuideProfile = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  languages: string[];
  experience: string;
  hourlyRate: number;
  bio: string;
  profileImage: string;
  rating: number;
  totalTours: number;
  createdAt: Date;
  updatedAt: Date;
};

export const guideService = {
  async createProfile(profile: Omit<GuideProfile, 'rating' | 'totalTours' | 'createdAt' | 'updatedAt'>) {
    try {
      return await apiService.post('/guides', profile);
    } catch (error) {
      console.error('Error creating guide profile:', error);
      throw error;
    }
  },

  async getProfile(id: string): Promise<GuideProfile | null> {
    try {
      return await apiService.get(`/guides/${id}`);
    } catch (error) {
      console.error('Error getting guide profile:', error);
      throw error;
    }
  },

  async updateProfile(id: string, updates: Partial<GuideProfile>) {
    try {
      return await apiService.put(`/guides/${id}`, updates);
    } catch (error) {
      console.error('Error updating guide profile:', error);
      throw error;
    }
  },

  async getGuidesByCity(city: string): Promise<GuideProfile[]> {
    try {
      return await apiService.get(`/guides?city=${city}`);
    } catch (error) {
      console.error('Error getting guides by city:', error);
      throw error;
    }
  },

  async getAllGuides(): Promise<GuideProfile[]> {
    try {
      return await apiService.get('/guides');
    } catch (error) {
      console.error('Error getting all guides:', error);
      throw error;
    }
  },

  async updateRating(id: string, newRating: number) {
    try {
      return await apiService.put(`/guides/${id}/rating`, { newRating });
    } catch (error) {
      console.error('Error updating guide rating:', error);
      throw error;
    }
  },

  async searchGuides(query: {
    city?: string;
    languages?: string[];
    minRating?: number;
    maxPrice?: number;
  }): Promise<GuideProfile[]> {
    try {
      const params = new URLSearchParams();
      if (query.city) params.append('city', query.city);
      if (query.languages?.length) params.append('languages', query.languages.join(','));
      if (query.minRating) params.append('minRating', query.minRating.toString());
      if (query.maxPrice) params.append('maxPrice', query.maxPrice.toString());
      
      return await apiService.get(`/guides/search?${params.toString()}`);
    } catch (error) {
      console.error('Error searching guides:', error);
      throw error;
    }
  }
};