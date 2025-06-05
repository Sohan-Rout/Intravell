import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Animatable from 'react-native-animatable';

const AIStatus: React.FC = () => {
  return (
    <View style={styles.aiStatusContainer}>
      <View style={styles.aiStatusContent}>
        <Animatable.View
          animation="pulse"
          iterationCount="infinite"
          style={styles.aiStatusIndicator}
        />
        <Text style={styles.aiStatusText}>AI Assistant Ready</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  aiStatusContainer: {
    backgroundColor: '#F0F9FF',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#BFDBFE',
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
    backgroundColor: '#60A5FA',
    marginRight: 8,
  },
  aiStatusText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
});

export default AIStatus;