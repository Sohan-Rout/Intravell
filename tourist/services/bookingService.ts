import { apiService } from './apiService';

export interface BookingRequest {
  guideId: string;
  startDate: Date;
  endDate: Date;
  numberOfPeople: number;
  notes?: string;
  itineraryId?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
}

export interface BookingResponse {
  id: string;
  guideId: string;
  touristId: string;
  startDate: Date;
  endDate: Date;
  numberOfPeople: number;
  notes?: string;
  itineraryId?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export const bookingService = {
  async createBooking(request: Omit<BookingRequest, 'status'>): Promise<BookingResponse> {
    try {
      const response = await apiService.post('/bookings', {
        ...request,
        status: 'pending'
      });
      return response.data as BookingResponse;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw new Error('Failed to create booking');
    }
  },

  async getTouristBookings(touristId: string): Promise<BookingResponse[]> {
    try {
      const response = await apiService.get(`/bookings/tourist/${touristId}`);
      return response.data as BookingResponse[];
    } catch (error) {
      console.error('Error fetching tourist bookings:', error);
      throw new Error('Failed to fetch bookings');
    }
  },

  async cancelBooking(bookingId: string): Promise<void> {
    try {
      await apiService.put(`/bookings/${bookingId}/cancel`);
    } catch (error) {
      console.error('Error canceling booking:', error);
      throw new Error('Failed to cancel booking');
    }
  }
}; 