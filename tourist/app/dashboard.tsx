import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  SafeAreaView,
  StyleSheet,
  StatusBar,
  View,
  ScrollView,
  Alert,
  Text,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import OpenAI from "openai";
import { callService } from "@/services/apiService";
import { Audio } from "expo-av";
import { guideService, LocalGuide } from "@/services/apiService";
import { useAuth } from "@/context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import ChatMessages from "@/app/components/ChatMessages";
import InputArea from "@/app/components/InputArea";
import GuideModal from "@/app/components/GuideModal";
import TravelPreferencesForm from "@/app/components/TravelPreferencesForm";

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  type?: 'text' | 'transcript' | 'agent_response' | 'itinerary' | 'action';
  data?: any;
}

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
    language?: string[];
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

interface Currency {
  code: string;
  symbol: string;
  name: string;
  rate: number;
}

interface TravelPreferences {
  budget: string;
  duration: number;
  travelStyle: string;
  interests: string[];
  dietaryRestrictions: string[];
  mobilityNeeds: string[];
  accommodationPreference: string;
  transportationPreference: string;
  pace: string;
}

interface BookingStatus {
  id: string;
  guideName: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
}

const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", name: "US Dollar", rate: 83.25 },
  { code: "EUR", symbol: "€", name: "Euro", rate: 89.50 },
  { code: "GBP", symbol: "£", name: "British Pound", rate: 104.75 },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", rate: 54.50 },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", rate: 61.25 },
  { code: "INR", symbol: "₹", name: "Indian Rupee", rate: 1 },
];

const Dashboard: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [budget, setBudget] = useState<string>("");
  const [duration, setDuration] = useState<number>(1);
  const [showPreferences, setShowPreferences] = useState(false);
  const [travelPreferences, setTravelPreferences] =
    useState<TravelPreferences | null>(null);
  const [currentItinerary, setCurrentItinerary] = useState<ItineraryDay[]>([]);
  const [travelInfo, setTravelInfo] = useState<TravelInfo | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(
    CURRENCIES[0]
  );
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);
  const [convertedAmount, setConvertedAmount] = useState<string>("");
  const [showCustomDuration, setShowCustomDuration] = useState(false);
  const [customDuration, setCustomDuration] = useState<string>("");
  const [selectedGuide, setSelectedGuide] = useState<LocalGuide | null>(null);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [guides, setGuides] = useState<LocalGuide[]>([]);
  const [loadingGuides, setLoadingGuides] = useState(false);
  const [callStatus, setCallStatus] = useState<
    "idle" | "connecting" | "connected" | "active" | "error"
  >("idle");
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [bookings, setBookings] = useState<BookingStatus[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [defaultPhoneNumber] = useState("+1 (267) 415-8223");
  const scrollViewRef = useRef<ScrollView>(null);
  const { user } = useAuth();

  if (!process.env.EXPO_PUBLIC_OPENAI_API_KEY) {
    console.error(
      "OpenAI API key is missing. Please set EXPO_PUBLIC_OPENAI_API_KEY in your environment variables."
    );
    Alert.alert("Error", "OpenAI API key is not configured. Please contact support.");
  }

  const openai = useRef(
    process.env.EXPO_PUBLIC_OPENAI_API_KEY
      ? new OpenAI({ apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY })
      : null
  );

  useEffect(() => {
    const setupAudio = async () => {
      try {
        await Audio.requestPermissionsAsync();
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      } catch (error) {
        console.error("Error setting up audio:", error);
        Alert.alert("Error", "Failed to set up audio recording");
      }
    };

    const setupCallService = () => {
      callService.on("callStatus", (status: string) => {
        const validStatuses = ["idle", "connecting", "connected", "active", "error"] as const;
        if (status === "connected") {
          setCallStatus("active");
        } else if (validStatuses.includes(status as typeof validStatuses[number])) {
          setCallStatus(status as typeof validStatuses[number]);
        } else {
          setCallStatus("error");
        }
      });
      callService.on("message", (message: { type: string; content?: string }) => {
        if (message.type === "transcript" && typeof message.content === "string") {
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              text: message.content ?? "",
              sender: "assistant",
              timestamp: new Date(),
              type: "transcript",
            },
          ]);
        }
      });
      callService.on("error", async (error: Error) => {
        console.error("Call service error:", error);
        if (recording) {
          try {
            await recording.stopAndUnloadAsync();
          } catch (err) {
            console.error("Error stopping recording:", err);
          }
        }
        Alert.alert("Error", "An error occurred during the call");
      });
    };

    setupAudio();
    setupCallService();
    return () => {
      if (recording) recording.stopAndUnloadAsync().catch(console.error);
      callService.endCall();
    };
  }, [recording]);

  useEffect(() => {
    const loadAllGuides = async () => {
      try {
        setLoadingGuides(true);
        const fetchedGuides = await guideService.getAllGuides();
        setGuides(fetchedGuides);
      } catch (error) {
        console.error("Error loading guides:", error);
        Alert.alert("Guide Loading Error", "Unable to load guides at this time.");
      } finally {
        setLoadingGuides(false);
      }
    };
    loadAllGuides();
  }, []);

  useEffect(() => {
    const loadBookings = async () => {
      if (!user) return;
      try {
        setLoadingBookings(true);
        const response = await bookingService.getTouristBookings(user.id);
        const convertedBookings: BookingStatus[] = response.map((booking) => ({
          id: booking.id,
          guideName: booking.guideName || "Guide",
          startDate: booking.startDate.toString(),
          endDate: booking.endDate.toString(),
          status: booking.status,
        }));
        setBookings(convertedBookings);
      } catch (error) {
        console.error("Error loading bookings:", error);
        Alert.alert("Error", "Failed to load bookings");
      } finally {
        setLoadingBookings(false);
      }
    };
    loadBookings();
  }, [user]);

  const convertToINR = (amount: string, fromCurrency: Currency): number => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return 0;
    return numAmount * fromCurrency.rate;
  };

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
        : "";
      const durationContext = travelPreferences?.duration
        ? `Duration: ${travelPreferences.duration} ${
            travelPreferences.duration === 1 ? "day" : "days"
          }`
        : "";
      if (!openai.current) {
        throw new Error("OpenAI client is not initialized.");
      }
      const completion = await openai.current.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a travel expert specializing in Indian tourism. Provide detailed, accurate, and practical travel itineraries in JSON format, including activities, locations, descriptions, prices, durations, tips, booking links, weather, local insights, and hidden gems where applicable. Include travel information such as budget, duration, best time to visit, visa requirements, health tips, emergency contacts, and general tips categorized by topic (e.g., culture, safety). Ensure all recommendations are tailored to the user's preferences, budget, and duration, and are feasible for travel in India. Do not include external links unless they are verifiable booking platforms. Avoid vague or generic suggestions, and ensure all prices are in INR unless otherwise specified.`,
          },
          {
            role: "user",
            content: `Create a detailed travel itinerary for India based on these preferences: ${userPreferences}\n${budgetContext}\n${durationContext}. Return the response in JSON format with two top-level keys: "itinerary" (array of days with activities) and "travelInfo" (object with budget, duration, bestTime, visaRequirements, healthTips, emergencyContacts, generalTips, city).`,
          },
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: "json_object" },
      });

      let response;
      try {
        response = JSON.parse(completion.choices[0].message.content!);
      } catch (parseError) {
        console.error("Error parsing API response:", parseError);
        throw new Error("Invalid API response format");
      }
      return { itinerary: response.itinerary, travelInfo: response.travelInfo };
    } catch (error) {
      console.error("Error generating itinerary:", error);
      throw new Error("Failed to generate itinerary");
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    setIsLoading(true);
    try {
      const userMessage: Message = {
        id: Date.now().toString(),
        text: inputText,
        sender: "user",
        timestamp: new Date(),
        type: "text",
      };
      setMessages((prev) => [...prev, userMessage]);
      setInputText("");

      const result = await generateItinerary(inputText);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "I've created a personalized itinerary with real-time information. Here's what I suggest:",
          sender: "assistant",
          timestamp: new Date(),
          type: "itinerary",
          data: result.itinerary,
        },
        {
          id: (Date.now() + 2).toString(),
          text: "Would you like to set travel preferences, view guides, or see your bookings?",
          sender: "assistant",
          timestamp: new Date(),
          type: "action",
          data: {
            actions: [
              { label: "Set Preferences", action: () => setShowPreferences(true) },
              { label: "View Guides", action: () => setShowGuideModal(true) },
              { label: "View Bookings", action: () => {
                setMessages((prev) => [
                  ...prev,
                  {
                    id: (Date.now() + 3).toString(),
                    text: bookings.length
                      ? "Here are your bookings:"
                      : "You have no bookings yet.",
                    sender: "assistant",
                    timestamp: new Date(),
                    type: "text",
                    data: { bookings },
                  },
                ]);
              }},
            ],
          },
        },
      ]);
      setCurrentItinerary(result.itinerary);
      setTravelInfo(result.travelInfo);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          text: "I apologize, but I encountered an error while generating your itinerary.",
          sender: "assistant",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  };

  const handleCall = () => {
    if (callStatus === "idle" || callStatus === "error") {
      callService.startCall(defaultPhoneNumber);
      setCallStatus("connecting");
    } else {
      callService.endCall();
      setCallStatus("idle");
    }
  };

  return (
    <LinearGradient colors={["#FFFFFF", "#D1D5DB"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Travel Buddy</Text>
          <TouchableOpacity style={styles.callButton} onPress={handleCall}>
            <Ionicons
              name={callStatus === "active" ? "call-outline" : "call"}
              size={24}
              color={callStatus === "active" ? "#EF4444" : "#3B82F6"}
            />
            {callStatus !== "idle" && (
              <Text style={styles.callStatusText}>
                {callStatus.charAt(0).toUpperCase() + callStatus.slice(1)}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        <ChatMessages
          messages={messages}
          isLoading={isLoading}
          scrollViewRef={scrollViewRef}
          currentItinerary={currentItinerary}
          travelInfo={travelInfo}
          guides={guides}
          loadingGuides={loadingGuides}
          setSelectedGuide={setSelectedGuide}
          setShowGuideModal={setShowGuideModal}
          bookings={bookings}
          loadingBookings={loadingBookings}
        />
        <InputArea
          inputText={inputText}
          setInputText={setInputText}
          handleSend={handleSend}
          callStatus={callStatus}
          defaultPhoneNumber={defaultPhoneNumber}
        />
        {showPreferences && (
          <TravelPreferencesForm
            showPreferences={showPreferences}
            setShowPreferences={setShowPreferences}
            convertedAmount={convertedAmount}
            setConvertedAmount={setConvertedAmount}
            selectedCurrency={selectedCurrency}
            setSelectedCurrency={setSelectedCurrency}
            showCurrencySelector={showCurrencySelector}
            setShowCurrencySelector={setShowCurrencySelector}
            duration={duration}
            setDuration={setDuration}
            showCustomDuration={showCustomDuration}
            setShowCustomDuration={setShowCustomDuration}
            customDuration={customDuration}
            setCustomDuration={setCustomDuration}
            setBudget={setBudget}
            setTravelPreferences={setTravelPreferences}
            onSubmit={() => {
              setShowPreferences(false);
              setMessages((prev) => [
                ...prev,
                {
                  id: Date.now().toString(),
                  text: "Preferences saved! Type your travel query to get a new itinerary.",
                  sender: "assistant",
                  timestamp: new Date(),
                },
              ]);
            }}
          />
        )}
        {showGuideModal && selectedGuide && (
          <GuideModal
            guide={selectedGuide}
            onClose={() => {
              setShowGuideModal(false);
              setSelectedGuide(null);
            }}
            currentItinerary={currentItinerary}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#BFDBFE",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3B82F6",
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  callStatusText: {
    fontSize: 12,
    color: "#3B82F6",
    marginLeft: 8,
  },
});

export default Dashboard;