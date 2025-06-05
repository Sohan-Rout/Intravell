import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

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

interface Props {
  showPreferences: boolean;
  setShowPreferences: (value: boolean) => void;
  convertedAmount: string;
  setConvertedAmount: (value: string) => void;
  selectedCurrency: Currency;
  setSelectedCurrency: (value: Currency) => void;
  showCurrencySelector: boolean;
  setShowCurrencySelector: (value: boolean) => void;
  duration: number;
  setDuration: (value: number) => void;
  showCustomDuration: boolean;
  setShowCustomDuration: (value: boolean) => void;
  customDuration: string;
  setCustomDuration: (value: string) => void;
  setBudget: (value: string) => void;
  setTravelPreferences: (value: TravelPreferences) => void;
  onSubmit: () => void;
}

const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", name: "US Dollar", rate: 83.25 },
  { code: "EUR", symbol: "€", name: "Euro", rate: 89.50 },
  { code: "GBP", symbol: "£", name: "British Pound", rate: 104.75 },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", rate: 54.50 },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", rate: 61.25 },
  { code: "INR", symbol: "₹", name: "Indian Rupee", rate: 1 },
];

const TRAVEL_STYLES = ["Adventure", "Cultural", "Relaxation", "Foodie", "Luxury"];
const INTERESTS = [
  "History",
  "Nature",
  "Food",
  "Art",
  "Adventure",
  "Shopping",
  "Nightlife",
];
const DIETARY_RESTRICTIONS = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Halal",
  "Kosher",
];
const MOBILITY_NEEDS = [
  "Wheelchair Accessible",
  "Limited Mobility",
  "No Specific Needs",
];
const ACCOMMODATION_PREFERENCES = [
  "Hotel",
  "Hostel",
  "Apartment",
  "Resort",
  "Homestay",
];
const TRANSPORTATION_PREFERENCES = [
  "Public Transport",
  "Private Car",
  "Walking",
  "Biking",
  "Taxi",
];
const PACE_OPTIONS = ["Relaxed", "Moderate", "Fast-Paced"];

const TravelPreferencesForm: React.FC<Props> = ({
  showPreferences,
  setShowPreferences,
  convertedAmount,
  setConvertedAmount,
  selectedCurrency,
  setSelectedCurrency,
  showCurrencySelector,
  setShowCurrencySelector,
  duration,
  setDuration,
  showCustomDuration,
  setShowCustomDuration,
  customDuration,
  setCustomDuration,
  setBudget,
  setTravelPreferences,
  onSubmit,
}) => {
  const [travelStyle, setTravelStyle] = useState<string>(TRAVEL_STYLES[0]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedDietaryRestrictions, setSelectedDietaryRestrictions] = useState<
    string[]
  >([]);
  const [selectedMobilityNeeds, setSelectedMobilityNeeds] = useState<string[]>([]);
  const [accommodationPreference, setAccommodationPreference] = useState<string>(
    ACCOMMODATION_PREFERENCES[0]
  );
  const [transportationPreference, setTransportationPreference] = useState<
    string
  >(TRANSPORTATION_PREFERENCES[0]);
  const [pace, setPace] = useState<string>(PACE_OPTIONS[0]);

  const handleToggleInterest = (interest: string) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest]
    );
  };

  const handleToggleDietaryRestriction = (restriction: string) => {
    setSelectedDietaryRestrictions((prev) =>
      prev.includes(restriction)
        ? prev.filter((r) => r !== restriction)
        : [...prev, restriction]
    );
  };

  const handleToggleMobilityNeed = (need: string) => {
    setSelectedMobilityNeeds((prev) =>
      prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]
    );
  };

  const handlePreferencesSubmit = () => {
    const numAmount = parseFloat(convertedAmount);
    if (isNaN(numAmount) && convertedAmount !== "") {
      alert("Please enter a valid budget amount.");
      return;
    }

    const finalDuration = showCustomDuration
      ? parseInt(customDuration) || 1
      : duration;

    const preferences: TravelPreferences = {
      budget: convertedAmount
        ? (numAmount * selectedCurrency.rate).toString()
        : "",
      duration: finalDuration,
      travelStyle,
      interests: selectedInterests,
      dietaryRestrictions: selectedDietaryRestrictions,
      mobilityNeeds: selectedMobilityNeeds,
      accommodationPreference,
      transportationPreference,
      pace,
    };

    setBudget(preferences.budget);
    setTravelPreferences(preferences);
    setShowPreferences(false);
    onSubmit();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showPreferences}
      onRequestClose={() => setShowPreferences(false)}
    >
      <View style={styles.modalContainer}>
        <LinearGradient colors={["#FFFFFF", "#D1D5DB"]} style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Travel Preferences</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPreferences(false)}
            >
              <Ionicons name="close" size={24} color="#3B82F6" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.preferencesScrollView}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Budget</Text>
              <View style={styles.budgetContainer}>
                <TextInput
                  style={styles.input}
                  value={convertedAmount}
                  onChangeText={setConvertedAmount}
                  placeholder="Enter amount"
                  placeholderTextColor="#93C5FD"
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.currencyButton}
                  onPress={() => setShowCurrencySelector(!showCurrencySelector)}
                >
                  <Text style={styles.currencyText}>
                    {selectedCurrency.code}
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color="#60A5FA"
                  />
                </TouchableOpacity>
              </View>
              {showCurrencySelector && (
                <View style={styles.currencySelector}>
                  {CURRENCIES.map((currency) => (
                    <TouchableOpacity
                      key={currency.code}
                      style={styles.currencyOption}
                      onPress={() => {
                        setSelectedCurrency(currency);
                        setShowCurrencySelector(false);
                      }}
                    >
                      <Text style={styles.currencyOptionText}>
                        {currency.name} ({currency.symbol})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Duration</Text>
              <View style={styles.durationContainer}>
                {[1, 3, 5, 7].map((day) => (
                  <TouchableOpacity
                    key={day}
                    style={[
                      styles.durationButton,
                      duration === day && !showCustomDuration
                        ? styles.durationButtonSelected
                        : null,
                    ]}
                    onPress={() => {
                      setDuration(day);
                      setShowCustomDuration(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.durationButtonText,
                        duration === day && !showCustomDuration
                          ? styles.durationButtonTextSelected
                          : null,
                      ]}
                    >
                      {day} {day === 1 ? "Day" : "Days"}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={[
                    styles.durationButton,
                    showCustomDuration ? styles.durationButtonSelected : null,
                  ]}
                  onPress={() => setShowCustomDuration(true)}
                >
                  <Text
                    style={[
                      styles.durationButtonText,
                      showCustomDuration ? styles.durationButtonTextSelected : null,
                    ]}
                  >
                    Custom
                  </Text>
                </TouchableOpacity>
              </View>
              {showCustomDuration && (
                <TextInput
                  style={styles.input}
                  value={customDuration}
                  onChangeText={setCustomDuration}
                  placeholder="Enter days"
                  placeholderTextColor="#93C5FD"
                  keyboardType="numeric"
                />
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Travel Style</Text>
              <Picker
                selectedValue={travelStyle}
                onValueChange={setTravelStyle}
                style={styles.picker}
              >
                {TRAVEL_STYLES.map((style) => (
                  <Picker.Item key={style} label={style} value={style} />
                ))}
              </Picker>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Interests</Text>
              <View style={styles.tagContainer}>
                {INTERESTS.map((interest) => (
                  <TouchableOpacity
                    key={interest}
                    style={[
                      styles.tag,
                      selectedInterests.includes(interest)
                        ? styles.tagSelected
                        : null,
                    ]}
                    onPress={() => handleToggleInterest(interest)}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        selectedInterests.includes(interest)
                          ? styles.tagTextSelected
                          : null,
                      ]}
                    >
                      {interest}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Dietary Restrictions</Text>
              <View style={styles.tagContainer}>
                {DIETARY_RESTRICTIONS.map((restriction) => (
                  <TouchableOpacity
                    key={restriction}
                    style={[
                      styles.tag,
                      selectedDietaryRestrictions.includes(restriction)
                        ? styles.tagSelected
                        : null,
                    ]}
                    onPress={() => handleToggleDietaryRestriction(restriction)}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        selectedDietaryRestrictions.includes(restriction)
                          ? styles.tagTextSelected
                          : null,
                      ]}
                    >
                      {restriction}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Mobility Needs</Text>
              <View style={styles.tagContainer}>
                {MOBILITY_NEEDS.map((need) => (
                  <TouchableOpacity
                    key={need}
                    style={[
                      styles.tag,
                      selectedMobilityNeeds.includes(need)
                        ? styles.tagSelected
                        : null,
                    ]}
                    onPress={() => handleToggleMobilityNeed(need)}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        selectedMobilityNeeds.includes(need)
                          ? styles.tagTextSelected
                          : null,
                      ]}
                    >
                      {need}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Accommodation Preference</Text>
              <Picker
                selectedValue={accommodationPreference}
                onValueChange={setAccommodationPreference}
                style={styles.picker}
              >
                {ACCOMMODATION_PREFERENCES.map((pref) => (
                  <Picker.Item key={pref} label={pref} value={pref} />
                ))}
              </Picker>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Transportation Preference</Text>
              <Picker
                selectedValue={transportationPreference}
                onValueChange={setTransportationPreference}
                style={styles.picker}
              >
                {TRANSPORTATION_PREFERENCES.map((pref) => (
                  <Picker.Item key={pref} label={pref} value={pref} />
                ))}
              </Picker>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Pace</Text>
              <Picker
                selectedValue={pace}
                onValueChange={setPace}
                style={styles.picker}
              >
                {PACE_OPTIONS.map((option) => (
                  <Picker.Item key={option} label={option} value={option} />
                ))}
              </Picker>
            </View>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handlePreferencesSubmit}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#fff"
                style={styles.submitIcon}
              />
              <Text style={styles.submitButtonText}>Save Preferences</Text>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    margin: 20,
    borderRadius: 20,
    padding: 16,
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#BFDBFE",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3B82F6",
  },
  closeButton: {
    padding: 8,
  },
  preferencesScrollView: {
    flex: 1,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#3B82F6",
    marginBottom: 8,
  },
  budgetContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: "#3B82F6",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  currencyButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  currencyText: {
    fontSize: 16,
    color: "#3B82F6",
    marginRight: 4,
  },
  currencySelector: {
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    marginTop: 8,
  },
  currencyOption: {
    padding: 12,
  },
  currencyOptionText: {
    fontSize: 16,
    color: "#3B82F6",
  },
  durationContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  durationButton: {
    backgroundColor: "#F0F9FF",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  durationButtonSelected: {
    backgroundColor: "#60A5FA",
    borderColor: "#3B82F6",
  },
  durationButtonText: {
    fontSize: 14,
    color: "#3B82F6",
  },
  durationButtonTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  picker: {
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#BFDBFE",
    padding: 12,
    color: "#3B82F6",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    backgroundColor: "#F0F9FF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  tagSelected: {
    backgroundColor: "#60A5FA",
    borderColor: "#3B82F6",
  },
  tagText: {
    fontSize: 14,
    color: "#3B82F6",
  },
  tagTextSelected: {
    color: "#fff",
    fontWeight: "500",
  },
  submitButton: {
    flexDirection: "row",
    backgroundColor: "#60A5FA",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  submitIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default TravelPreferencesForm;