import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { guideService, GuideProfile } from '../services/guideService';

export default function ProfileSetup() {
  const router = useRouter();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    languages: '',
    experience: '',
    hourlyRate: '',
    bio: '',
    profileImage: 'https://via.placeholder.com/150',
  });

  const handleSubmit = async () => {
    try {
      if (!user) return;

      // Validate required fields
      if (!formData.fullName || !formData.email || !formData.city || !formData.experience || !formData.hourlyRate) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const guideData = {
        id: user.id,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone || '',
        city: formData.city,
        languages: formData.languages.split(',').map(lang => lang.trim()),
        experience: formData.experience,
        hourlyRate: parseFloat(formData.hourlyRate),
        bio: formData.bio || '',
        profileImage: formData.profileImage,
      };

      // First check if profile exists
      try {
        await guideService.getProfile(user.id);
      } catch (error) {
        // If profile doesn't exist, create it
        await guideService.createProfile(guideData);
        Alert.alert('Success', 'Profile created successfully!');
        router.replace('/dashboard');
        return;
      }

      // If profile exists, update it
      await guideService.updateProfile(user.id, guideData);
      Alert.alert('Success', 'Profile updated successfully!');
      router.replace('/dashboard');
    } catch (error) {
      console.error('Error handling profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>Complete Your Guide Profile</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={formData.fullName}
            onChangeText={(text) => setFormData({ ...formData, fullName: text })}
            placeholder="Enter your full name"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>City</Text>
          <TextInput
            style={styles.input}
            value={formData.city}
            onChangeText={(text) => setFormData({ ...formData, city: text })}
            placeholder="Enter your city"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Languages (comma-separated)</Text>
          <TextInput
            style={styles.input}
            value={formData.languages}
            onChangeText={(text) => setFormData({ ...formData, languages: text })}
            placeholder="e.g., English, Hindi, Spanish"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Experience</Text>
          <TextInput
            style={styles.input}
            value={formData.experience}
            onChangeText={(text) => setFormData({ ...formData, experience: text })}
            placeholder="e.g., 5 years"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Hourly Rate (₹)</Text>
          <TextInput
            style={styles.input}
            value={formData.hourlyRate}
            onChangeText={(text) => setFormData({ ...formData, hourlyRate: text })}
            placeholder="Enter your hourly rate"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={formData.bio}
            onChangeText={(text) => setFormData({ ...formData, bio: text })}
            placeholder="Tell us about yourself and your guiding experience"
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Complete Profile</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  form: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  bioInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 