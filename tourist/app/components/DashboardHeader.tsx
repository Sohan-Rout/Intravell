import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const DashboardHeader: React.FC = () => {
  return (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.title}>Travel Assistant</Text>
        <Text style={styles.headerSubtitle}>Your AI Travel Companion</Text>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.profileButton}>
          <Ionicons name="person-circle-outline" size={24} color="#60A5FA" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3B82F6',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default DashboardHeader;