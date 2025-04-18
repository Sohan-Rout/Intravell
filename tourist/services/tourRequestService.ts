import { apiService } from './apiService';
import { guideService } from './guideService';

export interface TourRequest {
  id: string;
  guideId: string;
  touristId: string;
  startDate: Date;
  endDate: Date;
  numberOfPeople: number;
  notes?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

export const tourRequestService = {
  async createRequest(request: Omit<TourRequest, 'id' | 'status' | 'createdAt'>): Promise<TourRequest> {
    try {
      const response = await apiService.post('/tour-requests', request);
      // Increment the guide's request count
      await guideService.incrementRequestCount(request.guideId);
      return response.data;
    } catch (error) {
      console.error('Error creating tour request:', error);
      throw new Error('Failed to create tour request');
    }
  },

  async getRequestsByTourist(touristId: string): Promise<TourRequest[]> {
    try {
      const response = await apiService.get(`/tour-requests/tourist/${touristId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tour requests:', error);
      throw new Error('Failed to fetch tour requests');
    }
  },

  async getRequestsByGuide(guideId: string): Promise<TourRequest[]> {
    try {
      const response = await apiService.get(`/tour-requests/guide/${guideId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching guide requests:', error);
      throw new Error('Failed to fetch guide requests');
    }
  },

  async updateRequestStatus(requestId: string, status: 'accepted' | 'rejected'): Promise<TourRequest> {
    try {
      const response = await apiService.patch(`/tour-requests/${requestId}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating request status:', error);
      throw new Error('Failed to update request status');
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