import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { guideService, GuideProfile } from '../services/guideService';
import { tourRequestService, TourRequest } from '../services/tourRequestService';
import { useAuth } from '../contexts/AuthContext';
import { guideAuthService } from '../services/guideAuthService';
import { apiService } from '../services/apiService';

type GuideRequest = {
  _id: string;
  id: string;
  guideId: string;
  touristId: string;
  startDate: string;
  endDate: string;
  numberOfPeople: number;
  notes?: string;
  status: 'pending' | 'accepted' | 'rejected';
  progressStatus?: 'started' | 'ongoing' | 'completed';
  itineraryId: string;
  totalCost: number;
  createdAt: string;
  updatedAt: string;
};

export default function GuideDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'requests' | 'earnings'>('profile');
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<GuideProfile | null>(null);
  const [requests, setRequests] = useState<GuideRequest[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [progressFilter, setProgressFilter] = useState<'all' | 'started' | 'ongoing' | 'completed'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (!user) {
        Alert.alert('Error', 'You must be logged in to view this page.');
        router.replace('/');
        return;
      }
      
      const guideId = user.id;
      
      // Load profile and bookings in parallel
      const [profileData, bookingsResponse] = await Promise.all([
        guideService.getProfile(guideId),
        apiService.get(`/bookings/guide/${guideId}`),
      ]);
      
      setProfile(profileData);
      setRequests(bookingsResponse || []);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert(
        'Error',
        `Failed to load data: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      setLoading(true);
      const status = action === 'accept' ? 'accepted' : 'rejected';
      
      await apiService.patch(`/bookings/${requestId}/status`, { status });
      await loadData(); // Reload bookings
      
      Alert.alert(
        'Success',
        `Booking ${action}ed successfully`
      );
    } catch (error) {
      console.error('Error updating booking:', error);
      Alert.alert('Error', 'Failed to update booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('Error', 'Failed to logout. Please try again.');
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'started':
        return '#4CAF50';
      case 'ongoing':
        return '#2196F3';
      case 'completed':
        return '#9C27B0';
      default:
        return '#666';
    }
  };

  const renderProfile = () => {
    if (!profile) return null;

    return (
      <View style={styles.section}>
        <View style={styles.profileHeader}>
          <Image 
            source={{ uri: profile.profileImage || 'https://via.placeholder.com/150' }} 
            style={styles.profileImage} 
          />
          <View style={styles.profileInfo}>
            <Text style={styles.name}>{profile.fullName}</Text>
            <Text style={styles.city}>{profile.city}</Text>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.rating}>{profile.rating.toFixed(1)}</Text>
              <Text style={styles.tours}>({profile.totalTours} tours)</Text>
            </View>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.totalTours}</Text>
            <Text style={styles.statLabel}>Total Tours</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹{profile.hourlyRate}/hr</Text>
            <Text style={styles.statLabel}>Rate</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.experience}</Text>
            <Text style={styles.statLabel}>Experience</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Languages</Text>
          <View style={styles.languageTags}>
            {profile.languages && profile.languages.length > 0 ? (
              profile.languages.map((lang, index) => (
                <View key={index} style={styles.languageTag}>
                  <Text style={styles.languageText}>{lang}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No languages specified</Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bio}>{profile.bio || 'No bio provided'}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.contactInfo}>
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={16} color="#666" />
              <Text style={styles.contactText}>{profile.email}</Text>
            </View>
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={16} color="#666" />
              <Text style={styles.contactText}>{profile.phone || 'No phone number provided'}</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderRequests = () => {
    if (requests.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="calendar-outline" size={48} color="#666" />
          <Text style={styles.emptyStateText}>No booking requests yet</Text>
        </View>
      );
    }

    const filteredRequests = requests.filter(request => {
      if (request.status !== 'accepted') return true;
      if (progressFilter === 'all') return true;
      return request.progressStatus === progressFilter;
    });

    return (
      <View style={styles.requestsContainer}>
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Progress Status:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterButton, progressFilter === 'all' && styles.filterButtonActive]}
              onPress={() => setProgressFilter('all')}
            >
              <Text style={[styles.filterButtonText, progressFilter === 'all' && styles.filterButtonTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, progressFilter === 'started' && styles.filterButtonActive]}
              onPress={() => setProgressFilter('started')}
            >
              <Text style={[styles.filterButtonText, progressFilter === 'started' && styles.filterButtonTextActive]}>
                Started
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, progressFilter === 'ongoing' && styles.filterButtonActive]}
              onPress={() => setProgressFilter('ongoing')}
            >
              <Text style={[styles.filterButtonText, progressFilter === 'ongoing' && styles.filterButtonTextActive]}>
                Ongoing
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterButton, progressFilter === 'completed' && styles.filterButtonActive]}
              onPress={() => setProgressFilter('completed')}
            >
              <Text style={[styles.filterButtonText, progressFilter === 'completed' && styles.filterButtonTextActive]}>
                Completed
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {filteredRequests.map((request) => (
            <View key={request._id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View style={styles.touristInfo}>
                  <Ionicons name="person-circle-outline" size={24} color="#4A90E2" />
                  <Text style={styles.touristName}>Tourist Request</Text>
                </View>
                <View style={styles.statusContainer}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                    <Text style={styles.statusText}>{request.status.toUpperCase()}</Text>
                  </View>
                  {request.status === 'accepted' && request.progressStatus && (
                    <View style={[styles.progressBadge, { backgroundColor: getProgressColor(request.progressStatus) }]}>
                      <Text style={styles.statusText}>{request.progressStatus.toUpperCase()}</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.requestDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="calendar-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>
                    {formatDate(request.startDate)} - {formatDate(request.endDate)}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="people-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>
                    {request.numberOfPeople} {request.numberOfPeople === 1 ? 'person' : 'people'}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Ionicons name="cash-outline" size={16} color="#666" />
                  <Text style={styles.detailText}>
                    Total Cost: ₹{request.totalCost}
                  </Text>
                </View>

                {request.notes && (
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesLabel}>Notes:</Text>
                    <Text style={styles.notesText}>{request.notes}</Text>
                  </View>
                )}

                <View style={styles.timestamps}>
                  <Text style={styles.timestampText}>
                    Requested on {formatDate(request.createdAt)}
                  </Text>
                  {request.updatedAt !== request.createdAt && (
                    <Text style={styles.timestampText}>
                      Last updated {formatDate(request.updatedAt)}
                    </Text>
                  )}
                </View>
              </View>

              {request.status === 'pending' && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.acceptButton]}
                    onPress={() => handleRequestAction(request.id, 'accept')}
                  >
                    <Ionicons name="checkmark-outline" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.rejectButton]}
                    onPress={() => handleRequestAction(request.id, 'reject')}
                  >
                    <Ionicons name="close-outline" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderEarnings = () => {
    // TODO: Implement earnings view
    return (
      <View style={styles.emptyState}>
        <Ionicons name="cash-outline" size={48} color="#666" />
        <Text style={styles.emptyStateText}>Earnings coming soon</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <View>
          <Text style={styles.welcomeText}>Welcome,</Text>
          <Text style={styles.nameText}>{user?.fullName}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
          onPress={() => setActiveTab('profile')}
        >
          <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
          onPress={() => setActiveTab('requests')}
        >
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>Requests</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'earnings' && styles.activeTab]}
          onPress={() => setActiveTab('earnings')}
        >
          <Text style={[styles.tabText, activeTab === 'earnings' && styles.activeTabText]}>Earnings</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'profile' && renderProfile()}
        {activeTab === 'requests' && renderRequests()}
        {activeTab === 'earnings' && renderEarnings()}
      </ScrollView>
    </View>
  );
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return '#FFA500';
    case 'accepted':
      return '#4CAF50';
    case 'rejected':
      return '#F44336';
    default:
      return '#666';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },
  nameText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  logoutButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4A90E2',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  city: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 4,
  },
  tours: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  languageTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  languageTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  languageText: {
    color: '#666',
    fontSize: 14,
  },
  bio: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  touristInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  touristName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  requestDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
  },
  notesContainer: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  timestamps: {
    marginTop: 8,
    gap: 4,
  },
  timestampText: {
    fontSize: 12,
    color: '#999',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  contactInfo: {
    gap: 12,
    marginTop: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactText: {
    color: '#666',
    fontSize: 14,
  },
  requestsContainer: {
    flex: 1,
  },
  filterContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#4A90E2',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  progressBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
}); 