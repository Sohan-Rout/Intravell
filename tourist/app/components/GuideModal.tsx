import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TextInput, StyleSheet, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { bookingService, BookingRequest } from '@/services/bookingService';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

interface ItineraryDay {
  itineraryId: string;
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
  guide: LocalGuide;
  onClose: () => void;
  currentItinerary: ItineraryDay[];
}

const GuideModal: React.FC<Props> = ({ guide, onClose, currentItinerary }) => {
  const { user } = useAuth();
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [numberOfPeople, setNumberOfPeople] = useState('1');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateTotalCost = () => {
    if (!startDate || !endDate) return 0;
    const hours = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
    return hours * guide.hourlyRate * parseInt(numberOfPeople || '1');
  };

  const handleSubmit = async () => {
    if (!startDate || !endDate || !user || !numberOfPeople) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (parseInt(numberOfPeople) < 1) {
      Alert.alert('Error', 'Number of people must be at least 1');
      return;
    }

    try {
      setIsSubmitting(true);
      const bookingRequest: Omit<BookingRequest, 'status'> = {
        guideId: guide.id,
        startDate,
        endDate,
        numberOfPeople: parseInt(numberOfPeople),
        notes: notes || undefined,
        itineraryId: currentItinerary?.[0]?.itineraryId || 'default',
      };
      await bookingService.createBooking(bookingRequest);
      Alert.alert('Booking Successful!', `Your tour with ${guide.fullName} has been booked successfully.`, [
        { text: 'OK', onPress: onClose },
      ]);
    } catch (error) {
      console.error('Error submitting tour request:', error);
      Alert.alert('Error', 'Failed to send tour request. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) setStartDate(selectedDate);
  };

  const handleEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(false);
    if (selectedDate) setEndDate(selectedDate);
  };

  return (
    <Modal animationType="slide" transparent={true} visible={true} onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <LinearGradient colors={['#FFFFFF', '#D1D5DB']} style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Guide Details</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#3B82F6" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
            <Image source={{ uri: guide.profileImage }} style={styles.modalGuideImage} />
            <Text style={styles.modalGuideName}>{guide.fullName}</Text>
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
              <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowStartDatePicker(true)}>
                <Text style={styles.datePickerButtonText}>
                  {startDate ? startDate.toLocaleDateString() : 'Select Start Date'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#60A5FA" />
              </TouchableOpacity>
            </View>
            {showStartDatePicker && (
              <DateTimePicker
                value={startDate || new Date()}
                mode="date"
                display="default"
                onChange={handleStartDateChange}
                minimumDate={new Date()}
              />
            )}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>End Date</Text>
              <TouchableOpacity style={styles.datePickerButton} onPress={() => setShowEndDatePicker(true)}>
                <Text style={styles.datePickerButtonText}>
                  {endDate ? endDate.toLocaleDateString() : 'Select End Date'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#60A5FA" />
              </TouchableOpacity>
            </View>
            {showEndDatePicker && (
              <DateTimePicker
                value={endDate || new Date()}
                mode="date"
                display="default"
                onChange={handleEndDateChange}
                minimumDate={startDate || new Date()}
              />
            )}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Number of People</Text>
              <TextInput
                style={styles.modalFormInput}
                value={numberOfPeople}
                onChangeText={setNumberOfPeople}
                keyboardType="numeric"
                placeholder="Enter number of people"
                placeholderTextColor="#93C5FD"
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Additional Notes (Optional)</Text>
              <TextInput
                style={[styles.modalFormInput, styles.notesInput]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Any special requests?"
                placeholderTextColor="#93C5FD"
                multiline
                numberOfLines={4}
              />
            </View>
            <View style={styles.totalCostContainer}>
              <Text style={styles.totalCostLabel}>Estimated Total Cost:</Text>
              <Text style={styles.totalCostValue}>₹{calculateTotalCost().toLocaleString()}</Text>
            </View>
            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="paper-plane-outline" size={20} color="#fff" style={styles.submitIcon} />
                  <Text style={styles.submitButtonText}>Book Guide</Text>
                </>
              )}
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
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    margin: 20,
    borderRadius: 20,
    padding: 16,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#BFDBFE',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  closeButton: {
    padding: 8,
  },
  modalScrollView: {
    flex: 1,
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
    color: '#3B82F6',
    marginBottom: 8,
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
    color: '#3B82F6',
    marginLeft: 4,
  },
  modalInfoContainer: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  modalInfoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  modalInfoValue: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
    marginBottom: 12,
  },
  modalLanguagesContainer: {
    marginBottom: 16,
  },
  modalLanguagesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
    marginBottom: 8,
  },
  modalLanguagesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  modalLanguageTag: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  modalLanguageText: {
    fontSize: 14,
    color: '#3B82F6',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3B82F6',
    marginBottom: 8,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    justifyContent: 'space-between',
  },
  datePickerButtonText: {
    fontSize: 16,
    color: '#3B82F6',
  },
  modalFormInput: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#3B82F6',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  totalCostContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  totalCostLabel: {
    fontSize: 16,
    color: '#3B82F6',
  },
  totalCostValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#60A5FA',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#60A5FA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  disabledButton: {
    backgroundColor: '#93C5FD',
  },
  submitIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GuideModal;