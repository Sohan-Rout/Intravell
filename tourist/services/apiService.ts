import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { EventEmitter } from 'events';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Fallback API URL if environment variable is missing
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.travelbuddy.example.com/v1';
if (!process.env.EXPO_PUBLIC_API_URL) {
  console.warn('EXPO_PUBLIC_API_URL is not set. Using fallback URL:', API_URL);
}

// Interface for API error responses
interface ApiErrorResponse {
  message: string;
  code?: string;
  details?: any;
}

// Interface for LocalGuide (from guideService)
export interface LocalGuide {
  id: string;
  fullName: string;
  city: string;
  profileImage: string;
  rating: number;
  hourlyRate: number;
  languages: string[];
  experience: string;
}

// Interface for BookingRequest (from bookingService)
export interface BookingRequest {
  guideId: string;
  startDate: Date;
  endDate: Date;
  numberOfPeople: number;
  notes?: string;
  itineraryId: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
}

// Interface for Booking (from bookingService)
interface Booking {
  id: string;
  guideName: string;
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
}

// Axios instance for HTTP API calls
export const apiService = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor to add auth token
apiService.interceptors.request.use(
  async (config: import('axios').InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log('API Request:', config.method?.toUpperCase(), config.url);
      return config;
    } catch (error) {
      console.error('Request interceptor error:', error);
      return Promise.reject(error);
    }
  },
  (error: AxiosError) => {
    console.error('Request interceptor failed:', error.message);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiService.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error: AxiosError<ApiErrorResponse>) => {
    const { response, request, message } = error;
    let errorMessage = 'An unexpected error occurred';

    if (response) {
      // Server responded with a status code
      const { status, data } = response;
      errorMessage = data?.message || errorMessage;

      switch (status) {
        case 401:
          errorMessage = 'Unauthorized. Please log in again.';
          AsyncStorage.removeItem('authToken'); // Clear invalid token
          Alert.alert('Session Expired', errorMessage, [
            { text: 'OK', onPress: () => {/* Navigate to login */} },
          ]);
          break;
        case 403:
          errorMessage = 'Access forbidden. You lack the necessary permissions.';
          Alert.alert('Forbidden', errorMessage);
          break;
        case 404:
          errorMessage = 'Resource not found.';
          Alert.alert('Not Found', errorMessage);
          break;
        case 429:
          errorMessage = 'Too many requests. Please try again later.';
          Alert.alert('Rate Limit', errorMessage);
          break;
        case 500:
          errorMessage = 'Server error';
          Alert.alert('Server Error', 'Something went wrong on our end. Please try again later.');
          break;
        default:
          Alert.alert('Error', errorMessage);
      }
      console.error(`HTTP ${status}: ${errorMessage}`, {
        url: response.config.url,
        data,
      });
      } else if (request) {
        // Request was made but no response was received
        errorMessage = 'No response received. Check your internet connection.';
        Alert.alert('Network Error', errorMessage);
        console.error('Network Error:', errorMessage, { url: request.config.url });
      } else {
        // Error setting up the request
        errorMessage = message || 'Failed to configure the request.';
        Alert.alert('Request Error', errorMessage);
        console.error('Setup Error:', errorMessage);
      }

      return Promise.reject(new Error(errorMessage));
    }
);

// Mock call service implementation (replace with Twilio or similar)
export const callService = new EventEmitter();

// Mock call state
let callState: 'idle' | 'connecting' | 'connected' | 'active' | 'error' = 'idle';

// Mock call
export function startCall(phoneNumber: string): boolean {
  if (callState !== 'idle') {
    console.warn('Call already in progress:', callState);
    return false;
  }

  try {
    callState = 'connecting';
    callService.emit('callStatus', callState);
    // Simulate connection (replace with actual Twilio/WebRTC logic)
    setTimeout(() => {
      if (Math.random() < 0.9) {
        // Simulate 90% success rate
        callState = 'connected';
        callService.emit('callStatus', 'connected');
        callService.emit('message', {
          type: 'transcript',
          content: `Connected to ${phoneNumber}. How can I assist you?`
        });
        // Simulate ongoing transcription
        setTimeout(() => {
          callService.emit('message', {
            type: 'transcript',
            content: 'Sample transcript data...',
          });
        }, 5000);
      } else {
        callState = 'error';
        callService.emit('error', new Error('Failed to connect to error'));
      }
    }, 2000);

    console.log('Call initiated:', phoneNumber);
    return true;
  } catch (error) {
    callState = 'error';
    callService.emit('error', error);
    console.error('Call initiation failed:', error);
    return false;
  }
};

// End call
export function endCall() {
  if (callState === 'idle') {
    console.warn('No active call to end');
    return false;
  }

  try {
    callState = 'idle';
    callService.emit('callState', 'idle');
    console.log('Call ended');
    return true;
  } catch (error) {
    console.error('Error ending call:', error);
    callService.emit('error', error);
    return false;
  }
};

// Guide Service
export const guideService = {
  getAllGuides: async (): Promise<LocalGuide[]> => {
    try {
      const response = await apiService.get('/guides');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching guides:', error.message);
      throw new Error('Failed to load guides');
    }
  },
};

// Booking Service
export const bookingService = {
  getTouristBookings: async (userId: string): Promise<Booking[]> => {
    try {
      const response = await apiService.get(`/bookings/tourist/${userId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching bookings:', error.message);
      throw new Error('Failed to load bookings');
    }
  },
  createBooking: async (bookingRequest: Omit<BookingRequest, 'status'>): Promise<void> => {
    try {
      await apiService.post('/bookings', {
        ...bookingRequest,
        status: 'pending',
      });
    } catch (error: any) {
      console.error('Error creating booking:', error.message);
      throw new Error('Failed to create booking');
    }
  },
  cancelBooking: async (bookingId: string): Promise<void> => {
    try {
      await apiService.delete(`/bookings/${bookingId}`);
    } catch (error: any) {
      console.error('Error cancelling booking:', error.message);
      throw new Error('Failed to cancel booking');
    }
  },
};

// Export default for backward compatibility
export default apiService;