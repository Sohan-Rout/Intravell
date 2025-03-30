import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type AvailabilityModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (availability: {
    days: string[];
    hours: {
      start: string;
      end: string;
    };
  }) => void;
  initialAvailability?: {
    days: string[];
    hours: {
      start: string;
      end: string;
    };
  };
};

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const HOURS = Array.from({ length: 24 }, (_, i) => {
  const hour = i % 12 || 12;
  const period = i < 12 ? 'AM' : 'PM';
  return `${hour}:00 ${period}`;
});

export default function AvailabilityModal({
  visible,
  onClose,
  onSave,
  initialAvailability,
}: AvailabilityModalProps) {
  const [selectedDays, setSelectedDays] = useState<string[]>(
    initialAvailability?.days || []
  );
  const [startHour, setStartHour] = useState(
    initialAvailability?.hours.start || '9:00 AM'
  );
  const [endHour, setEndHour] = useState(
    initialAvailability?.hours.end || '5:00 PM'
  );

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day]
    );
  };

  const handleSave = () => {
    if (selectedDays.length === 0) {
      return;
    }
    onSave({
      days: selectedDays,
      hours: {
        start: startHour,
        end: endHour,
      },
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Update Availability</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            <Text style={styles.sectionTitle}>Available Days</Text>
            <View style={styles.daysContainer}>
              {DAYS.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayButton,
                    selectedDays.includes(day) && styles.selectedDay,
                  ]}
                  onPress={() => toggleDay(day)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      selectedDays.includes(day) && styles.selectedDayText,
                    ]}
                  >
                    {day.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>Available Hours</Text>
            <View style={styles.hoursContainer}>
              <View style={styles.hourSelector}>
                <Text style={styles.hourLabel}>Start Time</Text>
                <ScrollView style={styles.hoursList}>
                  {HOURS.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.hourButton,
                        startHour === hour && styles.selectedHour,
                      ]}
                      onPress={() => setStartHour(hour)}
                    >
                      <Text
                        style={[
                          styles.hourText,
                          startHour === hour && styles.selectedHourText,
                        ]}
                      >
                        {hour}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.hourSelector}>
                <Text style={styles.hourLabel}>End Time</Text>
                <ScrollView style={styles.hoursList}>
                  {HOURS.map((hour) => (
                    <TouchableOpacity
                      key={hour}
                      style={[
                        styles.hourButton,
                        endHour === hour && styles.selectedHour,
                      ]}
                      onPress={() => setEndHour(hour)}
                    >
                      <Text
                        style={[
                          styles.hourText,
                          endHour === hour && styles.selectedHourText,
                        ]}
                      >
                        {hour}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={selectedDays.length === 0}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedDay: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  dayText: {
    fontSize: 14,
    color: '#666',
  },
  selectedDayText: {
    color: '#fff',
  },
  hoursContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  hourSelector: {
    flex: 1,
  },
  hourLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  hoursList: {
    maxHeight: 200,
  },
  hourButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  selectedHour: {
    backgroundColor: '#4CAF50',
  },
  hourText: {
    fontSize: 14,
    color: '#333',
  },
  selectedHourText: {
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  saveButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
}); 