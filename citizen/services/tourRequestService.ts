import AsyncStorage from '@react-native-async-storage/async-storage';

export type TourRequest = {
  id: string;
  touristId: string;
  touristName: string;
  guideId: string;
  date: string;
  startTime: string;
  duration: string; // e.g., "4 hours", "Full Day"
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
};

const STORAGE_KEY = '@tour_requests';

export const tourRequestService = {
  async createRequest(request: Omit<TourRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>) {
    try {
      const newRequest: TourRequest = {
        ...request,
        id: `req_${Date.now()}`,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const existingRequests = await this.getRequests();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...existingRequests, newRequest]));
      return newRequest;
    } catch (error) {
      console.error('Error creating tour request:', error);
      throw error;
    }
  },

  async getRequests(): Promise<TourRequest[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting tour requests:', error);
      throw error;
    }
  },

  async getGuideRequests(guideId: string): Promise<TourRequest[]> {
    try {
      const requests = await this.getRequests();
      return requests.filter(request => request.guideId === guideId);
    } catch (error) {
      console.error('Error getting guide requests:', error);
      throw error;
    }
  },

  async updateRequestStatus(requestId: string, status: TourRequest['status']) {
    try {
      const requests = await this.getRequests();
      const updatedRequests = requests.map(request => {
        if (request.id === requestId) {
          return {
            ...request,
            status,
            updatedAt: new Date(),
          };
        }
        return request;
      });

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRequests));
      return updatedRequests.find(request => request.id === requestId);
    } catch (error) {
      console.error('Error updating request status:', error);
      throw error;
    }
  },

  async checkAvailability(guideId: string, date: string, startTime: string, duration: string): Promise<boolean> {
    try {
      const requests = await this.getGuideRequests(guideId);
      const requestedDate = new Date(date);
      const requestedStartTime = new Date(`${date}T${startTime}`);
      
      // Calculate end time based on duration
      const [hours] = duration.split(' ').map(Number);
      const requestedEndTime = new Date(requestedStartTime);
      requestedEndTime.setHours(requestedEndTime.getHours() + hours);

      // Check for overlapping requests
      return !requests.some(request => {
        if (request.status === 'rejected' || request.status === 'completed') return false;
        
        const requestDate = new Date(request.date);
        const requestStartTime = new Date(`${request.date}T${request.startTime}`);
        const [requestHours] = request.duration.split(' ').map(Number);
        const requestEndTime = new Date(requestStartTime);
        requestEndTime.setHours(requestEndTime.getHours() + requestHours);

        return (
          requestDate.getTime() === requestedDate.getTime() &&
          (
            (requestedStartTime >= requestStartTime && requestedStartTime < requestEndTime) ||
            (requestedEndTime > requestStartTime && requestedEndTime <= requestEndTime)
          )
        );
      });
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  }
}; 