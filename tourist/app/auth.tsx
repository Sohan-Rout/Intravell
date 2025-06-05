import React, { useState } from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Animatable from 'react-native-animatable';
import Icon from 'react-native-vector-icons/FontAwesome';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [nationality, setNationality] = useState('');

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && (!name || !nationality))) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    try {
      console.log('Auth data:', { email, password, name, nationality });
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.replace('/dashboard');
    } catch (error) {
      Alert.alert('Error', 'Authentication failed. Please try again.');
    }
  };

  return (
    <LinearGradient
      colors={['#FFFFFF', '#D1D5DB']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <Animatable.View
          animation="fadeInUp"
          duration={1000}
          style={styles.formContainer}
        >
          <Animatable.View
            animation="pulse"
            iterationCount="infinite"
            duration={2000}
            style={styles.iconContainer}
          >
            <Icon name="paper-plane" size={40} color="#60A5FA" />
          </Animatable.View>
          <Animatable.Text
            animation="zoomIn"
            duration={1200}
            style={styles.title}
          >
            {isLogin ? 'Your journey Continues' : 'Create Account'}
          </Animatable.Text>

          {!isLogin && (
            <Animatable.View animation="fadeIn" delay={200}>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor="#93C5FD"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </Animatable.View>
          )}

          {!isLogin && (
            <Animatable.View animation="fadeIn" delay={300}>
              <TextInput
                style={styles.input}
                placeholder="Nationality"
                placeholderTextColor="#93C5FD"
                value={nationality}
                onChangeText={setNationality}
                autoCapitalize="words"
              />
            </Animatable.View>
          )}

          <Animatable.View animation="fadeIn" delay={400}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#93C5FD"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </Animatable.View>

          <Animatable.View animation="fadeIn" delay={500}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#93C5FD"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </Animatable.View>

          <Animatable.View animation="fadeIn" delay={600}>
            <TouchableOpacity style={styles.button} onPress={handleAuth}>
              <LinearGradient
                colors={['#60A5FA', '#3B82F6']}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>
                  {isLogin ? 'Login' : 'Sign Up'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animatable.View>

          <Animatable.View animation="fadeIn" delay={700}>
            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setIsLogin(!isLogin)}
            >
              <Text style={styles.switchButtonText}>
                {isLogin
                  ? "Don't have an account? Sign Up"
                  : 'Already have an account? Login'}
              </Text>
            </TouchableOpacity>
          </Animatable.View>
        </Animatable.View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#F0F9FF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 16,
    color: '#3B82F6',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  button: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
  },
  buttonGradient: {
    padding: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#60A5FA',
    fontSize: 16,
    fontWeight: '500',
  },
});