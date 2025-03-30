import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { profileService, GuideProfile } from '../services/profileService';
import { router } from 'expo-router';
import AvailabilityModal from './availability-modal';
import CertificationModal from './certification-modal';

export default function ProfileEditScreen() {
  const [profile, setProfile] = useState<GuideProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [showCertificationModal, setShowCertificationModal] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await profileService.getProfile();
      setProfile(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      await profileService.updateProfile(profile);
      Alert.alert('Success', 'Profile updated successfully');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAvailability = (availability: GuideProfile['availability']) => {
    if (profile) {
      setProfile({ ...profile, availability });
    }
  };

  const handleAddCertification = (certification: GuideProfile['certifications'][0]) => {
    if (profile) {
      setProfile({
        ...profile,
        certifications: [...(profile.certifications || []), certification],
      });
    }
  };

  const handleAddPortfolioItem = async () => {
    try {
      const imageUrl = await profileService.uploadPortfolioImage();
      if (profile) {
        setProfile({
          ...profile,
          portfolio: [
            ...profile.portfolio,
            {
              images: [imageUrl],
              description: '',
            },
          ],
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to upload portfolio image');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load profile</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#4CAF50" />
          ) : (
            <Text style={styles.saveButton}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={profile.name}
              onChangeText={(text) => setProfile({ ...profile, name: text })}
              placeholder="Your name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              value={profile.city}
              onChangeText={(text) => setProfile({ ...profile, city: text })}
              placeholder="Your city"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={profile.phoneNumber}
              onChangeText={(text) => setProfile({ ...profile, phoneNumber: text })}
              placeholder="Your phone number"
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Hourly Rate (₹)</Text>
            <TextInput
              style={styles.input}
              value={profile.hourlyRate.toString()}
              onChangeText={(text) => setProfile({ ...profile, hourlyRate: parseInt(text) || 0 })}
              placeholder="Your hourly rate"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={profile.bio}
            onChangeText={(text) => setProfile({ ...profile, bio: text })}
            placeholder="Tell us about yourself"
            multiline
            numberOfLines={6}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Languages</Text>
          <TextInput
            style={styles.input}
            value={profile.languages.join(', ')}
            onChangeText={(text) => setProfile({ ...profile, languages: text.split(',').map(lang => lang.trim()) })}
            placeholder="Languages (comma separated)"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Specialties</Text>
          <TextInput
            style={styles.input}
            value={profile.specialties.join(', ')}
            onChangeText={(text) => setProfile({ ...profile, specialties: text.split(',').map(spec => spec.trim()) })}
            placeholder="Specialties (comma separated)"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience</Text>
          <TextInput
            style={styles.input}
            value={profile.experience}
            onChangeText={(text) => setProfile({ ...profile, experience: text })}
            placeholder="Your experience"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Availability</Text>
            <TouchableOpacity onPress={() => setShowAvailabilityModal(true)}>
              <Text style={styles.editButton}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Days: {profile.availability.days.join(', ')}
            </Text>
            <Text style={styles.infoText}>
              Hours: {profile.availability.hours.start} - {profile.availability.hours.end}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            <TouchableOpacity onPress={() => setShowCertificationModal(true)}>
              <Text style={styles.editButton}>Add</Text>
            </TouchableOpacity>
          </View>
          {profile.certifications?.map((cert, index) => (
            <View key={index} style={styles.certificationItem}>
              <Text style={styles.certName}>{cert.name}</Text>
              <Text style={styles.certIssuer}>{cert.issuer}</Text>
              <Text style={styles.certDate}>{cert.date}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Portfolio</Text>
            <TouchableOpacity onPress={handleAddPortfolioItem}>
              <Text style={styles.editButton}>Add</Text>
            </TouchableOpacity>
          </View>
          {profile.portfolio.map((item, index) => (
            <View key={index} style={styles.portfolioItem}>
              <TextInput
                style={styles.input}
                value={item.description}
                onChangeText={(text) => {
                  const newPortfolio = [...profile.portfolio];
                  newPortfolio[index] = { ...item, description: text };
                  setProfile({ ...profile, portfolio: newPortfolio });
                }}
                placeholder="Portfolio item description"
              />
            </View>
          ))}
        </View>
      </ScrollView>

      <AvailabilityModal
        visible={showAvailabilityModal}
        onClose={() => setShowAvailabilityModal(false)}
        onSave={handleUpdateAvailability}
        initialAvailability={profile.availability}
      />

      <CertificationModal
        visible={showCertificationModal}
        onClose={() => setShowCertificationModal(false)}
        onSave={handleAddCertification}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  saveButton: {
    fontSize: 16,
    color: '#4CAF50',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  editButton: {
    fontSize: 14,
    color: '#4CAF50',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  infoContainer: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  certificationItem: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  certName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  certIssuer: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  certDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  portfolioItem: {
    marginBottom: 16,
  },
}); 