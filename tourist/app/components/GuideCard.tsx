import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  onPress: () => void;
}

const GuideCard: React.FC<Props> = ({ guide, onPress }) => {
  return (
    <TouchableOpacity style={styles.guideCard} onPress={onPress}>
      <View style={styles.guideImageContainer}>
        <Image source={{ uri: guide.profileImage }} style={styles.guideImage} />
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={12} color="#FFD700" />
          <Text style={styles.ratingText}>{guide.rating}</Text>
        </View>
      </View>
      <Text style={styles.guideName}>{guide.fullName}</Text>
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
  );
};

const styles = StyleSheet.create({
  guideCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    width: 200,
    borderWidth: 1,
    borderColor: '#BFDBFE',
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
    color: '#3B82F6',
    marginBottom: 4,
  },
  guideCity: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  guideRate: {
    fontSize: 14,
    color: '#60A5FA',
    marginBottom: 8,
  },
  languagesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  languageTag: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  languageText: {
    fontSize: 12,
    color: '#3B82F6',
  },
});

export default GuideCard;