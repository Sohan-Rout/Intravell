import { apiService } from './apiService';

export type TourRequest = {
  id?: string;
  guideId: string;
  startDate: Date;
  endDate: Date;
  numberOfPeople: number;
  totalCost: number;
  status: 'pending' | 'accepted' | 'rejected';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export const tourRequestService = {
  async createRequest(request: Omit<TourRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<TourRequest> {
    try {
      return await apiService.post('/tour-requests', request);
    } catch (error) {
      console.error('Error creating tour request:', error);
      throw error;
    }
  },

  async getRequestsByTourist(): Promise<TourRequest[]> {
    try {
      return await apiService.get('/tour-requests/tourist');
    } catch (error) {
      console.error('Error fetching tourist requests:', error);
      throw error;
    }
  },

  async cancelRequest(requestId: string): Promise<void> {
    try {
      await apiService.post(`/tour-requests/${requestId}/cancel`, {});
    } catch (error) {
      console.error('Error canceling request:', error);
      throw error;
    }
  }
}; 