import { apiService } from './apiService';

export type LocalGuide = {
  id: string;
  name: string;
  image: string;
  rating: number;
  languages: string[];
  city: string;
  experience: string;
  hourlyRate: number;
};

export const guideService = {
  async getAllGuides(): Promise<LocalGuide[]> {
    try {
      return await apiService.get('/guides');
    } catch (error) {
      console.error('Error fetching guides:', error);
      throw error;
    }
  },

  async getGuidesByCity(city: string): Promise<LocalGuide[]> {
    try {
      return await apiService.get(`/guides?city=${city}`);
    } catch (error) {
      console.error('Error fetching guides by city:', error);
      throw error;
    }
  },

  async searchGuides(query: {
    city?: string;
    languages?: string[];
    minRating?: number;
  }): Promise<LocalGuide[]> {
    try {
      const params = new URLSearchParams();
      if (query.city) params.append('city', query.city);
      if (query.languages?.length) params.append('languages', query.languages.join(','));
      if (query.minRating) params.append('minRating', query.minRating.toString());
      
      return await apiService.get(`/guides/search?${params.toString()}`);
    } catch (error) {
      console.error('Error searching guides:', error);
      throw error;
    }
  }
}; 