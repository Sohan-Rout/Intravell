import React, { RefObject } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';
import BookingStatusCard from '@/app/components/BookingStatusCard';
import GuideCard from '@/app/components/GuideCard';

interface ItineraryDay {
  day: number;
  itineraryId: string;
  activities: {
    time: string;
    activity: string;
    location: string;
    description: string;
    price?: string;
    duration?: string;
    tips?: string[];
    bookingLink?: string;
    weather?: string;
    localInsights?: string[];
    hiddenGems?: string[];
  }[];
  summary: string;
}

interface TravelInfo {
  budget: string;
  duration: string;
  bestTime: string;
  visaRequirements: string;
  healthTips: string;
  emergencyContacts: { name: string; number: string; type: string }[];
  generalTips?: { category: string; tips: string[] }[];
  city: string;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  type?: 'text' | 'transcript' | 'agent_response' | 'itinerary';
  data?: any;
}

interface BookingStatus {
  id: string;
  guideName: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
}

interface LocalGuide {
  id: string;
  fullName: string;
  city: string;
  profileImage: string;
  rating: number;
  hourlyRate: number;
  languages: string[];
  experience: string;
}

interface Props {
  messages: Message[];
  isLoading: boolean;
  scrollViewRef: RefObject<ScrollView>;
  currentItinerary: ItineraryDay[];
  travelInfo: TravelInfo | null;
  guides: LocalGuide[];
  loadingGuides: boolean;
  setSelectedGuide: (guide: LocalGuide | null) => void;
  setShowGuideModal: (value: boolean) => void;
  bookings: BookingStatus[];
  loadingBookings: boolean;
}

const ChatMessages: React.FC<Props> = ({
  messages,
  isLoading,
  scrollViewRef,
  currentItinerary,
  travelInfo,
  guides,
  loadingGuides,
  setSelectedGuide,
  setShowGuideModal,
  bookings,
  loadingBookings,
}) => {
  const renderGuides = () => {
    if (loadingGuides) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#60A5FA" />
          <Text style={styles.loadingText}>Loading guides...</Text>
        </View>
      );
    }

    if (guides.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color="#666" />
          <Text style={styles.emptyStateText}>No guides available</Text>
        </View>
      );
    }

    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.guidesScrollView}>
        {guides.map((guide) => (
          <GuideCard key={guide.id} guide={guide} onPress={() => {
            setSelectedGuide(guide);
            setShowGuideModal(true);
          }} />
        ))}
      </ScrollView>
    );
  };

  const renderItinerary = (itinerary: ItineraryDay[]) => {
    return (
      <View>
        {travelInfo && (
          <View style={styles.travelInfoContainer}>
            <Text style={styles.sectionTitle}>Travel Information</Text>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Budget</Text>
                <Text style={styles.infoValue}>{travelInfo.budget}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Duration</Text>
                <Text style={styles.infoValue}>{travelInfo.duration}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Best Time</Text>
                <Text style={styles.infoValue}>{travelInfo.bestTime}</Text>
              </View>
            </View>

            <View style={styles.guidesSection}>
              <Text style={styles.guidesSectionTitle}>Local Guides</Text>
              {renderGuides()}
            </View>

            {travelInfo.generalTips && (
              <View style={styles.tipsSection}>
                <Text style={styles.tipsSectionTitle}>Travel Tips & Insights</Text>
                {travelInfo.generalTips.map((category, index) => (
                  <View key={index} style={styles.tipsCategory}>
                    <Text style={styles.tipsCategoryTitle}>{category.category}</Text>
                    {category.tips.map((tip, tipIndex) => (
                      <View key={tipIndex} style={styles.tipItem}>
                        <Ionicons name="bulb-outline" size={16} color="#60A5FA" style={styles.tipIcon} />
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}

            <View style={styles.emergencyContainer}>
              <Text style={styles.emergencyTitle}>Emergency Contacts</Text>
              {travelInfo.emergencyContacts.map((contact, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.emergencyContact}
                  onPress={() => Linking.openURL(`tel:${contact.number}`)}
                >
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactNumber}>{contact.number}</Text>
                  <Text style={styles.contactType}>{contact.type}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {itinerary.map((day, index) => (
          <View key={index} style={styles.itineraryDay}>
            <Text style={styles.dayTitle}>Day {day.day}</Text>
            <Text style={styles.daySummary}>{day.summary}</Text>
            {day.activities.map((activity, actIndex) => (
              <View key={actIndex} style={styles.activityItem}>
                <Text style={styles.activityTime}>{activity.time}</Text>
                <Text style={styles.activityTitle}>{activity.activity}</Text>
                <Text style={styles.activityLocation}>{activity.location}</Text>
                <Text style={styles.activityDescription}>{activity.description}</Text>
                {activity.price && <Text style={styles.activityPrice}>Price: {activity.price}</Text>}
                {activity.duration && <Text style={styles.activityDuration}>Duration: {activity.duration}</Text>}
                {activity.weather && <Text style={styles.activityWeather}>Weather: {activity.weather}</Text>}
                {activity.localInsights && activity.localInsights.length > 0 && (
                  <View style={styles.insightsContainer}>
                    <Text style={styles.insightsTitle}>Local Insights</Text>
                    {activity.localInsights.map((insight, insightIndex) => (
                      <View key={insightIndex} style={styles.insightItem}>
                        <Ionicons name="information-circle-outline" size={16} color="#60A5FA" style={styles.insightIcon} />
                        <Text style={styles.insightText}>{insight}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {activity.hiddenGems && activity.hiddenGems.length > 0 && (
                  <View style={styles.hiddenGemsContainer}>
                    <Text style={styles.hiddenGemsTitle}>Hidden Gems</Text>
                    {activity.hiddenGems.map((gem, gemIndex) => (
                      <View key={gemIndex} style={styles.hiddenGemItem}>
                        <Ionicons name="star-outline" size={16} color="#60A5FA" style={styles.gemIcon} />
                        <Text style={styles.hiddenGemText}>{gem}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {activity.tips && activity.tips.length > 0 && (
                  <View style={styles.tipsContainer}>
                    <Text style={styles.tipsTitle}>Pro Tips</Text>
                    {activity.tips.map((tip, tipIndex) => (
                      <View key={tipIndex} style={styles.tipItem}>
                        <Ionicons name="bulb-outline" size={16} color="#60A5FA" style={styles.tipIcon} />
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                )}
                {activity.bookingLink && (
                  <TouchableOpacity style={styles.bookingButton} onPress={() => Linking.openURL(activity.bookingLink!)}>
                    <Text style={styles.bookingButtonText}>Book Now</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>
    );
  };

  return (
    <ScrollView
      ref={scrollViewRef}
      style={styles.messagesContainer}
      contentContainerStyle={styles.messagesContent}
      onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
    >
      {messages.map((message) => (
        <View
          key={message.id}
          style={[styles.message, message.sender === 'user' ? styles.userMessage : styles.assistantMessage]}
        >
          {message.type === 'itinerary' ? (
            <View style={styles.itineraryMessage}>
              <Text style={styles.messageText}>{message.text}</Text>
              {message.data && renderItinerary(message.data)}
            </View>
          ) : (
            <Text style={[styles.messageText, message.sender === 'assistant' && styles.assistantMessageText]}>
              {message.text}
            </Text>
          )}
        </View>
      ))}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#60A5FA" />
          <Text style={styles.loadingText}>Creating your personalized itinerary...</Text>
        </View>
      )}
      <View style={styles.bookingsSection}>
        <Text style={styles.sectionTitle}>My Bookings</Text>
        {loadingBookings ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#60A5FA" />
          </View>
        ) : bookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No bookings yet</Text>
          </View>
        ) : (
          <View style={styles.bookingsContainer}>
            {bookings.map((booking) => (
              <BookingStatusCard key={booking.id} booking={booking} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messagesContent: {
    padding: 16,
  },
  message: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#60A5FA',
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
  },
  assistantMessageText: {
    color: '#3B82F6',
  },
  itineraryMessage: {
    width: '100%',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#3B82F6',
  },
  travelInfoContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  infoItem: {
    width: '33%',
    padding: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  guidesSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  guidesSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 12,
  },
  guidesScrollView: {
    flexGrow: 0,
  },
  tipsSection: {
    marginTop: 16,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
  },
  tipsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 12,
  },
  tipsCategory: {
    marginBottom: 12,
  },
  tipsCategoryTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#60A5FA',
    marginBottom: 8,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: '#3B82F6',
    lineHeight: 18,
  },
  emergencyContainer: {
    marginTop: 16,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 8,
  },
  emergencyContact: {
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3B82F6',
  },
  contactNumber: {
    fontSize: 14,
    color: '#60A5FA',
    marginTop: 2,
  },
  contactType: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  itineraryDay: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 8,
  },
  daySummary: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  activityItem: {
    backgroundColor: '#F0F9FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  activityTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3B82F6',
    marginBottom: 4,
  },
  activityLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  activityDescription: {
    fontSize: 14,
    color: '#666',
  },
  activityPrice: {
    fontSize: 14,
    color: '#60A5FA',
    fontWeight: 'bold',
  },
  activityDuration: {
    fontSize: 14,
    color: '#666',
  },
  activityWeather: {
    fontSize: 14,
    color: '#666',
  },
  insightsContainer: {
    marginTop: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#60A5FA',
    marginBottom: 8,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  insightIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  insightText: {
    flex: 1,
    fontSize: 13,
    color: '#3B82F6',
    lineHeight: 18,
  },
  hiddenGemsContainer: {
    marginTop: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
  },
  hiddenGemsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#60A5FA',
    marginBottom: 8,
  },
  hiddenGemItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  gemIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  hiddenGemText: {
    flex: 1,
    fontSize: 13,
    color: '#3B82F6',
    lineHeight: 18,
  },
  tipsContainer: {
    marginTop: 12,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#60A5FA',
    marginBottom: 8,
  },
  bookingButton: {
    backgroundColor: '#60A5FA',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  bookingsSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 16,
  },
  bookingsContainer: {
    marginTop: 8,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#3B82F6',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    marginBottom: 16,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default ChatMessages;