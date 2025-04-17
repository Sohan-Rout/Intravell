import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
  Modal
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { callService } from '../services/voiceCallService';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import OpenAI from 'openai';
import { guideService, LocalGuide } from '../services/guideService';
import { tourRequestService, TourRequest } from '../services/tourRequestService';
import * as FileSystem from 'expo-file-system';

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  type?: 'text' | 'transcript' | 'agent_response' | 'itinerary';
  data?: any;
};

type ItineraryDay = {
  day: number;
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
};

type TravelInfo = {
  budget: string;
  duration: string;
  bestTime: string;
  visaRequirements: string;
  healthTips: string;
  emergencyContacts: {
    name: string;
    number: string;
    type: string;
  }[];
  generalTips?: {
    category: string;
    tips: string[];
  }[];
  city: string;
};

type Currency = {
  code: string;
  symbol: string;
  name: string;
  rate: number;
};

type TravelPreferences = {
  budget: string;
  duration: number;
  travelStyle: string;
  interests: string[];
  dietaryRestrictions: string[];
  mobilityNeeds: string[];
  accommodationPreference: string;
  transportationPreference: string;
  pace: string;
  tips?: string[];
};

type GuideFilter = {
  city: string;
  language: string;
};

const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', rate: 83.25 },
  { code: 'EUR', symbol: '€', name: 'Euro', rate: 89.50 },
  { code: 'GBP', symbol: '£', name: 'British Pound', rate: 104.75 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 54.50 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 61.25 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 1 }
];

type CallStatus = 'idle' | 'connecting' | 'connected' | 'active' | 'error';

interface CallServiceMessage {
  type: string;
  content?: string;
}

// Define icon type for better type safety
type IconName = keyof typeof Ionicons.glyphMap;

interface PreferenceOption {
  id: string;
  label: string;
  icon: IconName;
}

// Add hardcoded guide data
const HARDCODED_GUIDES: LocalGuide[] = [
  {
    id: 'guide_1',
    name: 'Rajesh Kumar',
    image: 'https://randomuser.me/api/portraits/men/32.jpg',
    rating: 4.8,
    languages: ['Hindi', 'English', 'Punjabi'],
    city: 'Gurgaon',
    experience: '5 years of experience in local tours',
    hourlyRate: 1200
  },
  {
    id: 'guide_2',
    name: 'Priya Sharma',
    image: 'https://randomuser.me/api/portraits/women/44.jpg',
    rating: 4.9,
    languages: ['Hindi', 'English', 'Gujarati'],
    city: 'Gurgaon',
    experience: '7 years of experience in cultural tours',
    hourlyRate: 1500
  },
  {
    id: 'guide_3',
    name: 'Amit Patel',
    image: 'https://randomuser.me/api/portraits/men/67.jpg',
    rating: 4.7,
    languages: ['Hindi', 'English', 'Marathi'],
    city: 'Delhi',
    experience: '3 years of experience in food tours',
    hourlyRate: 1000
  },
  {
    id: 'guide_4',
    name: 'Neha Gupta',
    image: 'https://randomuser.me/api/portraits/women/22.jpg',
    rating: 4.6,
    languages: ['Hindi', 'English', 'Bengali'],
    city: 'Noida',
    experience: '4 years of experience in heritage tours',
    hourlyRate: 1300
  }
];

function Dashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [budget, setBudget] = useState<string>('');
  const [duration, setDuration] = useState<number>(1);
  const [showPreferences, setShowPreferences] = useState(true);
  const [travelPreferences, setTravelPreferences] = useState<TravelPreferences | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentItinerary, setCurrentItinerary] = useState<ItineraryDay[]>([]);
  const [travelInfo, setTravelInfo] = useState<TravelInfo | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(CURRENCIES[0]);
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);
  const [convertedAmount, setConvertedAmount] = useState<string>('');
  const [customDuration, setCustomDuration] = useState<string>('');
  const [showCustomDuration, setShowCustomDuration] = useState(false);
  const [travelTips, setTravelTips] = useState<string[]>([]);
  const [selectedGuide, setSelectedGuide] = useState<LocalGuide | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [filters, setFilters] = useState<GuideFilter>({ city: '', language: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [guides, setGuides] = useState<LocalGuide[]>([]);
  const [loadingGuides, setLoadingGuides] = useState(false);
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [agentResponse, setAgentResponse] = useState('');
  const openai = useRef(new OpenAI({
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  }));
  const [travelStyle, setTravelStyle] = useState<string>('balanced');
  const [interests, setInterests] = useState<string[]>([]);
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [mobilityNeeds, setMobilityNeeds] = useState<string[]>([]);
  const [accommodationPreference, setAccommodationPreference] = useState<string>('comfortable');
  const [transportationPreference, setTransportationPreference] = useState<string>('mixed');
  const [pace, setPace] = useState<string>('moderate');
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const TRAVEL_STYLES: PreferenceOption[] = [
    { id: 'luxury', label: 'Luxury', icon: 'diamond' },
    { id: 'comfortable', label: 'Comfortable', icon: 'bed' },
    { id: 'balanced', label: 'Balanced', icon: 'scale' },
    { id: 'budget', label: 'Budget', icon: 'wallet' },
  ];

  const INTERESTS: PreferenceOption[] = [
    { id: 'culture', label: 'Culture & Heritage', icon: 'book' },
    { id: 'nature', label: 'Nature & Wildlife', icon: 'leaf' },
    { id: 'food', label: 'Food & Cuisine', icon: 'restaurant' },
    { id: 'shopping', label: 'Shopping', icon: 'cart' },
    { id: 'adventure', label: 'Adventure', icon: 'trending-up' },
    { id: 'spiritual', label: 'Spiritual', icon: 'heart' },
  ];

  const DIETARY_RESTRICTIONS: PreferenceOption[] = [
    { id: 'vegetarian', label: 'Vegetarian', icon: 'leaf' },
    { id: 'vegan', label: 'Vegan', icon: 'leaf' },
    { id: 'halal', label: 'Halal', icon: 'checkmark-circle' },
    { id: 'kosher', label: 'Kosher', icon: 'checkmark-circle' },
    { id: 'gluten-free', label: 'Gluten Free', icon: 'ban' },
  ];

  const MOBILITY_NEEDS: PreferenceOption[] = [
    { id: 'wheelchair', label: 'Wheelchair Accessible', icon: 'medical' },
    { id: 'limited-mobility', label: 'Limited Mobility', icon: 'walk' },
    { id: 'no-stairs', label: 'No Stairs', icon: 'arrow-down' },
    { id: 'none', label: 'No Special Needs', icon: 'checkmark-circle' },
  ];

  const ACCOMMODATION_TYPES: PreferenceOption[] = [
    { id: 'luxury', label: 'Luxury Hotels', icon: 'star' },
    { id: 'comfortable', label: 'Comfortable Hotels', icon: 'bed' },
    { id: 'budget', label: 'Budget Hotels', icon: 'wallet' },
    { id: 'homestay', label: 'Homestays', icon: 'home' },
  ];

  const TRANSPORTATION_TYPES: PreferenceOption[] = [
    { id: 'private', label: 'Private Transport', icon: 'car' },
    { id: 'mixed', label: 'Mixed Transport', icon: 'swap-horizontal' },
    { id: 'public', label: 'Public Transport', icon: 'bus' },
  ];

  const PACE_OPTIONS: PreferenceOption[] = [
    { id: 'relaxed', label: 'Relaxed', icon: 'time' },
    { id: 'moderate', label: 'Moderate', icon: 'speedometer' },
    { id: 'intensive', label: 'Intensive', icon: 'flash' },
  ];

  useEffect(() => {
    setupAudio();
    setupCallService();
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
      callService.endCall();
    };
  }, []);

  const setupAudio = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
      console.error('Error setting up audio:', error);
      Alert.alert('Error', 'Failed to set up audio recording');
    }
  };

  const setupCallService = () => {
    callService.on('callStatus', (status: CallStatus) => {
      setCallStatus(status === 'connected' ? 'active' : status);
    });

    callService.on('message', (message: CallServiceMessage) => {
      if (message.type === 'transcript' && message.content) {
        const newMessage: Message = {
          id: Date.now().toString(),
          text: message.content,
          sender: 'assistant',
          timestamp: new Date(),
          type: 'transcript'
        };
        setMessages(prev => [...prev, newMessage]);
      }
    });

    callService.on('error', (error: Error) => {
      console.error('Call service error:', error);
      Alert.alert('Error', 'An error occurred during the call');
    });
  };

  


  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');

    try {
      setIsLoading(true);
      callService.sendTextMessage(inputText);
      setIsLoading(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsLoading(false);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  // Add this function to convert amount to INR
  const convertToINR = (amount: string, fromCurrency: Currency): number => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return 0;
    return numAmount * fromCurrency.rate;
  };

  // Update budget when currency or amount changes
  useEffect(() => {
    if (convertedAmount && selectedCurrency) {
      const inrAmount = convertToINR(convertedAmount, selectedCurrency);
      setBudget(inrAmount.toString());
    }
  }, [convertedAmount, selectedCurrency]);

  const generateItinerary = async (userPreferences: string) => {
    try {
      const budgetContext = budget 
        ? `Exact Budget: ₹${parseInt(budget).toLocaleString()}`
        : '';
      
      const durationContext = travelPreferences?.duration
        ? `Duration: ${travelPreferences.duration} ${travelPreferences.duration === 1 ? 'day' : 'days'}`
        : '';

      const completion = await openai.current.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a travel expert specializing in Indian tourism. Create detailed, practical itineraries with real-time information.
            ${budgetContext}
            ${durationContext}
            Important: 
            - All activities and accommodations must fit within the exact budget specified
            - Include specific prices for each activity and ensure the total cost stays within the budget
            - Search TripAdvisor forums, Quora, and travel blogs for real-time tips and recommendations
            - Include local insights and hidden gems
            - Consider weather conditions and seasonal factors
            - Provide practical tips for each activity
            
            Return a JSON object with the following structure:
            {
              "itinerary": [
                {
                  "day": 1,
                  "summary": "Day summary",
                  "activities": [
                    {
                      "time": "9:00 AM",
                      "activity": "Activity name",
                      "location": "Location name",
                      "description": "Description",
                      "price": "Exact price in INR",
                      "duration": "Duration",
                      "tips": ["Tip 1", "Tip 2"],
                      "bookingLink": "Booking URL",
                      "weather": "Weather info",
                      "localInsights": ["Local insight 1", "Local insight 2"],
                      "hiddenGems": ["Hidden gem 1", "Hidden gem 2"]
                    }
                  ]
                }
              ],
              "travelInfo": {
                "budget": "Total budget breakdown",
                "duration": "Trip duration",
                "bestTime": "Best time to visit",
                "visaRequirements": "Visa info",
                "healthTips": ["Health tip 1", "Health tip 2"],
                "emergencyContacts": [
                  {
                    "name": "Contact name",
                    "number": "Phone number",
                    "type": "Contact type"
                  }
                ],
                "generalTips": [
                  {
                    "category": "Category name",
                    "tips": ["Tip 1", "Tip 2"]
                  }
                ]
              }
            }`
          },
          {
            role: "user",
            content: `Create a detailed travel itinerary for India based on these preferences: ${userPreferences}
            ${budgetContext}
            ${durationContext}
            Include real-time information about attractions, weather, and local tips. Ensure all activities and accommodations fit within the specified budget.`
          }
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0].message.content;
      
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      try {
        // Parse the JSON response
        const parsedResponse = JSON.parse(response);
        
        // Validate the response structure
        if (!parsedResponse.itinerary || !Array.isArray(parsedResponse.itinerary) || 
            !parsedResponse.travelInfo || typeof parsedResponse.travelInfo !== 'object') {
          console.error('Invalid response structure:', parsedResponse);
          throw new Error('Invalid response structure from OpenAI');
        }

        // Validate each day in the itinerary
        parsedResponse.itinerary.forEach((day: any, index: number) => {
          if (!day.day || !day.summary || !Array.isArray(day.activities)) {
            console.error(`Invalid day structure at index ${index}:`, day);
            throw new Error(`Invalid day structure at index ${index}`);
          }
        });

        // Validate travel info
        const requiredTravelInfoFields = ['budget', 'duration', 'bestTime', 'visaRequirements', 'healthTips', 'emergencyContacts'];
        requiredTravelInfoFields.forEach(field => {
          if (!parsedResponse.travelInfo[field]) {
            console.error(`Missing required field in travelInfo: ${field}`);
            throw new Error(`Missing required field in travelInfo: ${field}`);
          }
        });

        return {
          itinerary: parsedResponse.itinerary,
          travelInfo: parsedResponse.travelInfo
        };
      } catch (parseError) {
        console.error('JSON parsing error:', parseError);
        console.error('Raw response:', response);
        throw new Error('Failed to parse itinerary data. Please try again.');
      }
    } catch (error) {
      console.error('OpenAI API error:', error);
      if (error instanceof Error) {
        throw new Error(`Failed to generate itinerary: ${error.message}`);
      }
      throw new Error('An unexpected error occurred while generating your itinerary.');
    }
  };

  const handlePreferencesSubmit = () => {
    if (!convertedAmount.trim() || isNaN(parseFloat(convertedAmount))) {
      Alert.alert(
        "Invalid Amount",
        "Please enter a valid amount.",
        [{ text: "OK" }]
      );
      return;
    }

    setShowPreferences(false);
    const inrAmount = convertToINR(convertedAmount, selectedCurrency);
    const preferences: TravelPreferences = {
      budget: inrAmount.toString(),
      duration: duration,
      travelStyle,
      interests,
      dietaryRestrictions,
      mobilityNeeds,
      accommodationPreference,
      transportationPreference,
      pace
    };
    setTravelPreferences(preferences);
    setBudget(inrAmount.toString());

    const preferencesMessage: Message = {
      id: Date.now().toString(),
      text: `Travel preferences set:\nBudget: ${selectedCurrency.symbol}${parseFloat(convertedAmount).toLocaleString()} (₹${inrAmount.toLocaleString()})\nDuration: ${duration} ${duration === 1 ? 'day' : 'days'}\nTravel Style: ${TRAVEL_STYLES.find(s => s.id === travelStyle)?.label}\nPace: ${PACE_OPTIONS.find(p => p.id === pace)?.label}`,
      sender: 'assistant',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, preferencesMessage]);
  };

  const handleCustomDurationSubmit = () => {
    const numDuration = parseInt(customDuration);
    if (isNaN(numDuration) || numDuration < 1 || numDuration > 30) {
      Alert.alert(
        "Invalid Duration",
        "Please enter a valid duration between 1 and 30 days.",
        [{ text: "OK" }]
      );
      return;
    }
    setDuration(numDuration);
    setShowCustomDuration(false);
    setCustomDuration('');
  };

  useEffect(() => {
    const loadAllGuides = async () => {
      try {
        setLoadingGuides(true);
        // Use hardcoded guides instead of API call
        console.log('Loading hardcoded guides:', HARDCODED_GUIDES.length);
        setGuides(HARDCODED_GUIDES);
      } catch (error) {
        console.error('Error loading guides:', error);
        Alert.alert(
          'Guide Loading Error',
          'Unable to load guides at this time. Please try again later.'
        );
      } finally {
        setLoadingGuides(false);
      }
    };

    loadAllGuides();
  }, []);

  const handleSend = async () => {
    setIsLoading(true);
    try {
      const result = await generateItinerary(inputText.trim());
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I've created a personalized itinerary with real-time information. Here's what I suggest:",
        sender: 'assistant',
        timestamp: new Date(),
        type: 'itinerary',
        data: result.itinerary
      };

      setMessages(prev => [...prev, assistantMessage]);
      setCurrentItinerary(result.itinerary);
      setTravelInfo(result.travelInfo);
      
      // Update filters with the city from the itinerary
      if (result.travelInfo && result.travelInfo.city) {
        setFilters(prev => ({ ...prev, city: result.travelInfo.city }));
      }
    } catch (error) {
      console.error('Error generating itinerary:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I apologize, but I encountered an error while generating your itinerary. Please try again with more specific preferences or check your API key configuration.",
        sender: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  };

  // Update the filtered guides to only use language filter
  const filteredGuides = guides.filter(guide => {
    if (filters.city && !guide.city.toLowerCase().includes(filters.city.toLowerCase())) return false;
    if (filters.language && !guide.languages.includes(filters.language)) return false;
    return true;
  });

  // Update the renderItinerary function's guides section
  const renderGuides = () => {
    if (loadingGuides) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#4CAF50" />
          <Text style={styles.loadingText}>Loading guides...</Text>
        </View>
      );
    }

    if (guides.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="people-outline" size={48} color="#666" />
          <Text style={styles.emptyStateText}>No guides available in the system</Text>
          <Text style={[styles.emptyStateText, { fontSize: 12, marginTop: 8 }]}>
            Please check back later or contact support
          </Text>
        </View>
      );
    }

    return (
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.guidesScrollView}
        contentContainerStyle={{ paddingRight: 16 }}
      >
        {filteredGuides.map((guide) => (
          <TouchableOpacity 
            key={guide.id} 
            style={styles.guideCard}
            onPress={() => {
              setSelectedGuide(guide);
              setShowGuideModal(true);
            }}
          >
            <View style={styles.guideImageContainer}>
              <Image 
                source={{ uri: guide.image }} 
                style={styles.guideImage}
              />
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={12} color="#FFD700" />
                <Text style={styles.ratingText}>{guide.rating}</Text>
              </View>
            </View>
            <Text style={styles.guideName}>{guide.name}</Text>
            <Text style={styles.guideCity}>{guide.city}</Text>
            <Text style={styles.guideRate}>₹{guide.hourlyRate}/hour</Text>
            <View style={styles.languagesContainer}>
              {guide.languages.slice(0, 2).map((lang, index) => (
                <View key={index} style={styles.languageTag}>
                  <Text style={styles.languageText}>{lang}</Text>
                </View>
              ))}
              {guide.languages.length > 2 && (
                <View style={styles.languageTag}>
                  <Text style={styles.languageText}>+{guide.languages.length - 2} more</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
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

            {/* Local Guides Section */}
            <View style={styles.guidesSection}>
              <View style={styles.guidesHeader}>
                <Text style={styles.guidesSectionTitle}>Local Guides</Text>
                <TouchableOpacity 
                  style={styles.filterButton}
                  onPress={() => setShowFilters(!showFilters)}
                >
                  <Ionicons name="filter" size={20} color="#4CAF50" />
                </TouchableOpacity>
              </View>

              {showFilters && (
                <View style={styles.filtersContainer}>
                  <TextInput
                    style={styles.filterInput}
                    placeholder="Filter by language"
                    value={filters.language}
                    onChangeText={(text) => setFilters(prev => ({ ...prev, language: text }))}
                  />
                </View>
              )}

              {renderGuides()}
            </View>

            {/* General Tips Section */}
            {travelInfo.generalTips && (
              <View style={styles.tipsSection}>
                <Text style={styles.tipsSectionTitle}>Travel Tips & Insights</Text>
                {travelInfo.generalTips.map((category, index) => (
                  <View key={index} style={styles.tipsCategory}>
                    <Text style={styles.tipsCategoryTitle}>{category.category}</Text>
                    {category.tips.map((tip, tipIndex) => (
                      <View key={tipIndex} style={styles.tipItem}>
                        <Ionicons name="bulb-outline" size={16} color="#4CAF50" style={styles.tipIcon} />
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}

            {/* Emergency Contacts */}
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
                {activity.price && (
                  <Text style={styles.activityPrice}>Price: {activity.price}</Text>
                )}
                {activity.duration && (
                  <Text style={styles.activityDuration}>Duration: {activity.duration}</Text>
                )}
                {activity.weather && (
                  <Text style={styles.activityWeather}>Weather: {activity.weather}</Text>
                )}
                
                {/* Local Insights */}
                {activity.localInsights && activity.localInsights.length > 0 && (
                  <View style={styles.insightsContainer}>
                    <Text style={styles.insightsTitle}>Local Insights</Text>
                    {activity.localInsights.map((insight, insightIndex) => (
                      <View key={insightIndex} style={styles.insightItem}>
                        <Ionicons name="information-circle-outline" size={16} color="#4CAF50" style={styles.insightIcon} />
                        <Text style={styles.insightText}>{insight}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Hidden Gems */}
                {activity.hiddenGems && activity.hiddenGems.length > 0 && (
                  <View style={styles.hiddenGemsContainer}>
                    <Text style={styles.hiddenGemsTitle}>Hidden Gems</Text>
                    {activity.hiddenGems.map((gem, gemIndex) => (
                      <View key={gemIndex} style={styles.hiddenGemItem}>
                        <Ionicons name="star-outline" size={16} color="#FFD700" style={styles.gemIcon} />
                        <Text style={styles.hiddenGemText}>{gem}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Tips */}
                {activity.tips && activity.tips.length > 0 && (
                  <View style={styles.tipsContainer}>
                    <Text style={styles.tipsTitle}>Pro Tips</Text>
                    {activity.tips.map((tip, tipIndex) => (
                      <View key={tipIndex} style={styles.tipItem}>
                        <Ionicons name="bulb-outline" size={16} color="#4CAF50" style={styles.tipIcon} />
                        <Text style={styles.tipText}>{tip}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {activity.bookingLink && (
                  <TouchableOpacity 
                    style={styles.bookingButton}
                    onPress={() => Linking.openURL(activity.bookingLink!)}
                  >
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

  const GuideModal = ({ guide, onClose }: { guide: LocalGuide; onClose: () => void }) => {
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [showEndDatePicker, setShowEndDatePicker] = useState(false);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [numberOfPeople, setNumberOfPeople] = useState('1');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [bookingSuccess, setBookingSuccess] = useState(false);

    const calculateTotalCost = () => {
      if (!startDate || !endDate) return 0;
      const hours = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
      return hours * guide.hourlyRate * parseInt(numberOfPeople);
    };

    const handleSubmit = async () => {
      try {
        setIsSubmitting(true);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simulate successful booking
        setBookingSuccess(true);
        
        // Show success message
        Alert.alert(
          'Booking Successful!',
          `Your tour with ${guide.name} has been booked successfully. The guide will contact you shortly to confirm the details.`,
          [{ text: 'OK', onPress: onClose }]
        );
      } catch (error) {
        console.error('Error submitting tour request:', error);
        Alert.alert(
          'Error',
          'Failed to send tour request. Please try again later.'
        );
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleStartDateChange = (event: any, selectedDate?: Date) => {
      setShowStartDatePicker(false);
      if (selectedDate) {
        setStartDate(selectedDate);
      }
    };

    const handleEndDateChange = (event: any, selectedDate?: Date) => {
      setShowEndDatePicker(false);
      if (selectedDate) {
        setEndDate(selectedDate);
      }
    };

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={true}
        onRequestClose={onClose}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Guide Details</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <Image source={{ uri: guide.image }} style={styles.modalGuideImage} />
              <Text style={styles.modalGuideName}>{guide.name}</Text>
              <Text style={styles.modalGuideCity}>{guide.city}</Text>
              
              <View style={styles.modalRatingContainer}>
                <Ionicons name="star" size={16} color="#FFD700" />
                <Text style={styles.modalRatingText}>{guide.rating}</Text>
              </View>

              <View style={styles.modalInfoContainer}>
                <Text style={styles.modalInfoLabel}>Experience</Text>
                <Text style={styles.modalInfoValue}>{guide.experience}</Text>
                
                <Text style={styles.modalInfoLabel}>Rate</Text>
                <Text style={styles.modalInfoValue}>₹{guide.hourlyRate}/hour</Text>
              </View>
              
              <View style={styles.modalLanguagesContainer}>
                <Text style={styles.modalLanguagesTitle}>Languages</Text>
                <View style={styles.modalLanguagesList}>
                  {guide.languages.map((lang, index) => (
                    <View key={index} style={styles.modalLanguageTag}>
                      <Text style={styles.modalLanguageText}>{lang}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Start Date</Text>
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Text style={styles.datePickerButtonText}>
                    {startDate ? startDate.toLocaleDateString() : 'Select Start Date'}
                  </Text>
                </TouchableOpacity>
              </View>

              {showStartDatePicker && (
                <DateTimePicker
                  value={startDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={handleStartDateChange}
                />
              )}

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>End Date</Text>
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Text style={styles.datePickerButtonText}>
                    {endDate ? endDate.toLocaleDateString() : 'Select End Date'}
                  </Text>
                </TouchableOpacity>
              </View>

              {showEndDatePicker && (
                <DateTimePicker
                  value={endDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={handleEndDateChange}
                />
              )}

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Number of People</Text>
                <TextInput
                  style={styles.formInput}
                  value={numberOfPeople}
                  onChangeText={setNumberOfPeople}
                  keyboardType="numeric"
                  placeholder="Enter number of people"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Notes (Optional)</Text>
                <TextInput
                  style={styles.formInput}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Any special requirements or preferences?"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.costContainer}>
                <Text style={styles.costLabel}>Estimated Total Cost</Text>
                <Text style={styles.costValue}>₹{calculateTotalCost()}</Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  isSubmitting && styles.submitButtonDisabled
                ]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Send Request</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Travel Assistant</Text>
          <Text style={styles.headerSubtitle}>Your AI Travel Companion</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.profileButton}>
            <Ionicons name="person-circle-outline" size={24} color="#4CAF50" />
          </TouchableOpacity>
        </View>
      </View>

      {/* AI Assistant Status */}
      <View style={styles.aiStatusContainer}>
        <View style={styles.aiStatusContent}>
          <View style={styles.aiStatusIndicator} />
          <Text style={styles.aiStatusText}>AI Assistant Ready</Text>
        </View>
      </View>

      {/* Travel Preferences */}
      {showPreferences && (
        <ScrollView style={styles.preferencesScrollView}>
          <View style={styles.preferencesContainer}>
            <Text style={styles.preferencesTitle}>Personalize Your Journey</Text>
            
            {/* Budget Input */}
            <View style={styles.preferenceSection}>
              <Text style={styles.sectionTitle}>Budget</Text>
              <View style={styles.budgetInputContainer}>
                <View style={styles.budgetInputWrapper}>
                  <TouchableOpacity
                    style={styles.currencySelector}
                    onPress={() => setShowCurrencySelector(!showCurrencySelector)}
                  >
                    <Text style={styles.currencySymbol}>{selectedCurrency.symbol}</Text>
                    <Text style={styles.currencyCode}>{selectedCurrency.code}</Text>
                    <Ionicons name="chevron-down" size={16} color="#666" />
                  </TouchableOpacity>
                  <TextInput
                    style={styles.budgetInput}
                    value={convertedAmount}
                    onChangeText={setConvertedAmount}
                    placeholder="Enter your budget"
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>
                {showCurrencySelector && (
                  <View style={styles.currencyList}>
                    {CURRENCIES.map((currency) => (
                      <TouchableOpacity
                        key={currency.code}
                        style={[
                          styles.currencyOption,
                          selectedCurrency.code === currency.code && styles.selectedCurrency
                        ]}
                        onPress={() => {
                          setSelectedCurrency(currency);
                          setShowCurrencySelector(false);
                        }}
                      >
                        <Text style={styles.currencySymbol}>{currency.symbol}</Text>
                        <Text style={styles.currencyCode}>{currency.code}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Duration Selector */}
            <View style={styles.preferenceSection}>
              <Text style={styles.sectionTitle}>Duration</Text>
              <View style={styles.durationSelector}>
                {[1, 2, 3, 4, 5].map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[styles.durationButton, duration === day && styles.selectedDuration]}
                    onPress={() => setDuration(day)}
                  >
                    <Text style={[styles.durationButtonText, duration === day && styles.selectedDurationText]}>
                      {day} {day === 1 ? 'Day' : 'Days'}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[styles.durationButton, showCustomDuration && styles.selectedDuration]}
                  onPress={() => setShowCustomDuration(!showCustomDuration)}
                >
                  <Text style={[styles.durationButtonText, showCustomDuration && styles.selectedDurationText]}>
                    Custom
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Travel Style */}
            <View style={styles.preferenceSection}>
              <Text style={styles.sectionTitle}>Travel Style</Text>
              <View style={styles.optionsGrid}>
                {TRAVEL_STYLES.map((style) => (
                  <TouchableOpacity
                    key={style.id}
                    style={[styles.optionButton, travelStyle === style.id && styles.selectedOption]}
                    onPress={() => setTravelStyle(style.id)}
                  >
                    <Ionicons name={style.icon} size={24} color={travelStyle === style.id ? '#fff' : '#666'} />
                    <Text style={[styles.optionButtonText, travelStyle === style.id && styles.selectedOptionText]}>
                      {style.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Interests */}
            <View style={styles.preferenceSection}>
              <Text style={styles.sectionTitle}>Interests</Text>
              <View style={styles.optionsGrid}>
                {INTERESTS.map((interest) => (
                  <TouchableOpacity
                    key={interest.id}
                    style={[
                      styles.optionButton,
                      interests.includes(interest.id) && styles.selectedOption
                    ]}
                    onPress={() => {
                      setInterests(prev =>
                        prev.includes(interest.id)
                          ? prev.filter(i => i !== interest.id)
                          : [...prev, interest.id]
                      );
                    }}
                  >
                    <Ionicons
                      name={interest.icon}
                      size={24}
                      color={interests.includes(interest.id) ? '#fff' : '#666'}
                    />
                    <Text style={[
                      styles.optionButtonText,
                      interests.includes(interest.id) && styles.selectedOptionText
                    ]}>
                      {interest.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Dietary Restrictions */}
            <View style={styles.preferenceSection}>
              <Text style={styles.sectionTitle}>Dietary Restrictions</Text>
              <View style={styles.optionsGrid}>
                {DIETARY_RESTRICTIONS.map((diet) => (
                  <TouchableOpacity
                    key={diet.id}
                    style={[
                      styles.optionButton,
                      dietaryRestrictions.includes(diet.id) && styles.selectedOption
                    ]}
                    onPress={() => {
                      setDietaryRestrictions(prev =>
                        prev.includes(diet.id)
                          ? prev.filter(d => d !== diet.id)
                          : [...prev, diet.id]
                      );
                    }}
                  >
                    <Ionicons
                      name={diet.icon}
                      size={24}
                      color={dietaryRestrictions.includes(diet.id) ? '#fff' : '#666'}
                    />
                    <Text style={[
                      styles.optionButtonText,
                      dietaryRestrictions.includes(diet.id) && styles.selectedOptionText
                    ]}>
                      {diet.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Mobility Needs */}
            <View style={styles.preferenceSection}>
              <Text style={styles.sectionTitle}>Mobility Needs</Text>
              <View style={styles.optionsGrid}>
                {MOBILITY_NEEDS.map((need) => (
                  <TouchableOpacity
                    key={need.id}
                    style={[
                      styles.optionButton,
                      mobilityNeeds.includes(need.id) && styles.selectedOption
                    ]}
                    onPress={() => {
                      setMobilityNeeds(prev =>
                        prev.includes(need.id)
                          ? prev.filter(m => m !== need.id)
                          : [...prev, need.id]
                      );
                    }}
                  >
                    <Ionicons
                      name={need.icon}
                      size={24}
                      color={mobilityNeeds.includes(need.id) ? '#fff' : '#666'}
                    />
                    <Text style={[
                      styles.optionButtonText,
                      mobilityNeeds.includes(need.id) && styles.selectedOptionText
                    ]}>
                      {need.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Accommodation Preference */}
            <View style={styles.preferenceSection}>
              <Text style={styles.sectionTitle}>Accommodation Preference</Text>
              <View style={styles.optionsGrid}>
                {ACCOMMODATION_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.optionButton,
                      accommodationPreference === type.id && styles.selectedOption
                    ]}
                    onPress={() => setAccommodationPreference(type.id)}
                  >
                    <Ionicons
                      name={type.icon}
                      size={24}
                      color={accommodationPreference === type.id ? '#fff' : '#666'}
                    />
                    <Text style={[
                      styles.optionButtonText,
                      accommodationPreference === type.id && styles.selectedOptionText
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Transportation Preference */}
            <View style={styles.preferenceSection}>
              <Text style={styles.sectionTitle}>Transportation Preference</Text>
              <View style={styles.optionsGrid}>
                {TRANSPORTATION_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.optionButton,
                      transportationPreference === type.id && styles.selectedOption
                    ]}
                    onPress={() => setTransportationPreference(type.id)}
                  >
                    <Ionicons
                      name={type.icon}
                      size={24}
                      color={transportationPreference === type.id ? '#fff' : '#666'}
                    />
                    <Text style={[
                      styles.optionButtonText,
                      transportationPreference === type.id && styles.selectedOptionText
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Travel Pace */}
            <View style={styles.preferenceSection}>
              <Text style={styles.sectionTitle}>Travel Pace</Text>
              <View style={styles.optionsGrid}>
                {PACE_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.optionButton,
                      pace === option.id && styles.selectedOption
                    ]}
                    onPress={() => setPace(option.id)}
                  >
                    <Ionicons
                      name={option.icon}
                      size={24}
                      color={pace === option.id ? '#fff' : '#666'}
                    />
                    <Text style={[
                      styles.optionButtonText,
                      pace === option.id && styles.selectedOptionText
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.preferencesSubmitButton}
              onPress={handlePreferencesSubmit}
            >
              <Text style={styles.preferencesSubmitText}>Create My Travel Plan</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}

      {/* Selected Preferences Display */}
      {travelPreferences && !showPreferences && (
        <TouchableOpacity
          style={styles.selectedPreferencesContainer}
          onPress={() => setShowPreferences(true)}
        >
          <Text style={styles.selectedPreferencesText}>
            Budget: {selectedCurrency.symbol}{parseFloat(convertedAmount).toLocaleString()} ({selectedCurrency.code})
          </Text>
          <Text style={styles.selectedPreferencesText}>
            Duration: {duration} {duration === 1 ? 'day' : 'days'}
          </Text>
          <Ionicons name="pencil" size={20} color="#4CAF50" />
        </TouchableOpacity>
      )}

      {/* Chat Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.message,
              message.sender === 'user' ? styles.userMessage : styles.assistantMessage
            ]}
          >
            {message.type === 'itinerary' ? (
              <View style={styles.itineraryMessage}>
                <Text style={styles.messageText}>{message.text}</Text>
                {message.data && renderItinerary(message.data)}
              </View>
            ) : (
              <Text style={[
                styles.messageText,
                message.sender === 'assistant' && styles.assistantMessageText
              ]}>
                {message.text}
              </Text>
            )}
          </View>
        ))}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#4CAF50" />
            <Text style={styles.loadingText}>Creating your personalized itinerary...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type your message..."
          placeholderTextColor="#666"
          multiline
        />
        {/* <TouchableOpacity
          style={[styles.micButton, isRecording && styles.micButtonActive]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Ionicons
              name={isRecording ? "mic" : "mic-outline"}
              size={24}
              color="#fff"
            />
          )}
        </TouchableOpacity> */}
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Ionicons name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </KeyboardAvoidingView>

      {showGuideModal && selectedGuide && (
        <GuideModal 
          guide={selectedGuide} 
          onClose={() => {
            setShowGuideModal(false);
            setSelectedGuide(null);
          }} 
        />
      )}
    </SafeAreaView>
  );
}

export default Dashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flex: 1,
  },
  headerRight: {
    marginLeft: 16,
  },
  profileButton: {
    padding: 8,
  },
  aiStatusContainer: {
    backgroundColor: '#f8f9fa',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  aiStatusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiStatusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  aiStatusText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  preferencesScrollView: {
    flex: 1,
  },
  preferencesContainer: {
    padding: 16,
  },
  preferenceSection: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 8,
    minWidth: '48%',
  },
  selectedOption: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  optionButtonText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  selectedOptionText: {
    color: '#fff',
  },
  messagesContainer: {
    flex: 1,
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
    backgroundColor: '#007AFF',
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
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    fontSize: 16,
    maxHeight: 100,
    color: '#333',
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  micButtonActive: {
    backgroundColor: '#FF3B30',
    shadowColor: '#FF3B30',
    transform: [{ scale: 1.1 }],
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  preferencesTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  budgetInputContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  budgetInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
  },
  currencyCode: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  currencyList: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedCurrency: {
    backgroundColor: '#f0f9f0',
  },
  currencySymbol: {
    fontSize: 18,
    color: '#666',
    marginRight: 4,
  },
  currencyInput: {
    flex: 1,
    fontSize: 18,
    color: '#333',
    paddingVertical: 8,
  },
  budgetSubmitButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  budgetSubmitText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  durationContainer: {
    marginTop: 16,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  durationSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedDuration: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  durationButtonText: {
    fontSize: 14,
    color: '#666',
  },
  selectedDurationText: {
    color: '#fff',
  },
  tipsSection: {
    marginTop: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
  },
  tipsSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  tipsCategory: {
    marginBottom: 12,
  },
  tipsCategoryTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4CAF50',
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
    color: '#666',
    lineHeight: 18,
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
    color: '#666',
    lineHeight: 18,
  },
  hiddenGemsContainer: {
    marginTop: 12,
    backgroundColor: '#fff9e6',
    borderRadius: 8,
    padding: 12,
  },
  hiddenGemsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFB800',
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
    color: '#666',
    lineHeight: 18,
  },
  guidesSection: {
    marginTop: 16,
    marginBottom: 16,
  },
  guidesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  guidesSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  filterButton: {
    padding: 8,
  },
  filtersContainer: {
    marginBottom: 12,
    gap: 8,
  },
  filterInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
  },
  guidesScrollView: {
    flexGrow: 0,
  },
  guideCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    width: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  guideImageContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  guideImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
  },
  ratingContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  guideName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  guideCity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  guideRate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  languagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  languageTag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  languageText: {
    fontSize: 12,
    color: '#666',
  },
  modalContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalScrollView: {
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f8f8f8',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  modalGuideImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalGuideName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  modalGuideCity: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  modalRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalRatingText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 4,
  },
  modalInfoContainer: {
    marginBottom: 16,
  },
  modalInfoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  modalInfoValue: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  modalLanguagesContainer: {
    marginBottom: 20,
  },
  modalLanguagesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modalLanguagesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalLanguageTag: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modalLanguageText: {
    fontSize: 14,
    color: '#666',
  },
  contactGuideButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  contactGuideButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  requestFormContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  datePickerButton: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginVertical: 8,
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  costContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  costLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  costValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  selectedPreferencesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    gap: 16,
  },
  selectedPreferencesText: {
    fontSize: 14,
    color: '#333',
  },
  itineraryMessage: {
    width: '100%',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#666',
  },
  travelInfoContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
    color: '#333',
    fontWeight: '500',
  },
  emergencyContainer: {
    marginTop: 16,
  },
  emergencyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emergencyContact: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  contactNumber: {
    fontSize: 14,
    color: '#4CAF50',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  daySummary: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  activityItem: {
    backgroundColor: '#f8f9fa',
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
    color: '#333',
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
    color: '#4CAF50',
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
    backgroundColor: '#fff9e6',
    borderRadius: 8,
    padding: 12,
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFB800',
    marginBottom: 8,
  },
  tipsContainer: {
    marginTop: 12,
    backgroundColor: '#fff9e6',
    borderRadius: 8,
    padding: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFB800',
    marginBottom: 8,
  },
  bookingButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  bookingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  budgetInput: {
    flex: 1,
    fontSize: 18,
    color: '#333',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  preferencesSubmitButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  preferencesSubmitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  messagesContent: {
    padding: 16,
  },
  formInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  formFieldLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
});