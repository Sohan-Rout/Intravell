import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { bookingService } from '@/services/bookingService';
import { LinearGradient } from 'expo-linear-gradient';

interface BookingStatus {
  id: string;
  guideName: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
}

interface Props {
  booking: BookingStatus;
}

const BookingStatusCard: React.FC<Props> = ({ booking }) => {
  const getStatusColor = (status: BookingStatus['status']) => {
    switch (status) {
      case 'pending':
        return '#60A5FA';
      case 'accepted':
        return '#10B981';
      case 'rejected':
        return '#EF4444';
      case 'completed':
        return '#6B7280';
      default:
        return '#60A5FA';
    }
  };

  const handleCancelBooking = async () => {
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await bookingService.cancelBooking(booking.id);
              Alert.alert('Success', 'Booking cancelled successfully.');
            } catch (error) {
              console.error('Error cancelling booking:', error);
              Alert.alert('Error', 'Failed to cancel booking. Please try again.');
            }
          },
        },
      ],
    );
  };

  return (
    <LinearGradient colors={['#FFFFFF', '#F0F9FF']} style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <Text style={styles.guideName}>{booking.guideName}</Text>
        <View style={[styles.statusContainer, { backgroundColor: getStatusColor(booking.status) }]}>
          <Text style={styles.statusText}>{booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}</Text>
        </View>
      </View>
      <View style={styles.cardDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#3B82F6" style={styles.detailIcon} />
          <Text style={styles.detailLabel}>Start Date:</Text>
          <Text style={styles.detailValue}>{booking.startDate}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color="#3B82F6" style={styles.detailIcon} />
          <Text style={styles.detailLabel}>End Date:</Text>
          <Text style={styles.detailValue}>{booking.endDate}</Text>
        </View>
      </View>
      {booking.status === 'pending' && (
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancelBooking}>
          <Ionicons name="close-circle-outline" size={20} color="#EF4444" style={styles.cancelIcon} />
          <Text style={styles.cancelButtonText}>Cancel Booking</Text>
        </TouchableOpacity>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  guideName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3B82F6',
  },
  statusContainer: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  cardDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailIcon: {
    marginRight: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  detailValue: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
  },
  cancelIcon: {
    marginRight: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
  },
});

export default BookingStatusCard;