import { apiService } from './apiService';

export interface LocalGuide {
  id: string;
  name: string;
  fullName: string;
  image: string;
  profileImage: string;
  rating: number;
  languages: string[];
  city: string;
  experience: number;
  hourlyRate: number;
  requestCount: number;
}

export const guideService = {
  async getAllGuides(): Promise<LocalGuide[]> {
    try {
      const response = await apiService.get('/guides');
      return response.data;
    } catch (error) {
      console.error('Error fetching guides:', error);
      throw new Error('Failed to fetch guides');
    }
  },

  async getGuidesByCity(city: string): Promise<LocalGuide[]> {
    try {
      const response = await apiService.get(`/guides/city/${city}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching guides for city ${city}:`, error);
      throw new Error(`Failed to fetch guides for ${city}`);
    }
  },

  async searchGuides(query: string): Promise<LocalGuide[]> {
    try {
      const response = await apiService.get(`/guides/search?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      console.error('Error searching guides:', error);
      throw new Error('Failed to search guides');
    }
  },

  async incrementRequestCount(guideId: string): Promise<void> {
    try {
      await apiService.post(`/guides/${guideId}/increment-requests`);
    } catch (error) {
      console.error('Error incrementing request count:', error);
      throw new Error('Failed to increment request count');
    }
  }
}; 