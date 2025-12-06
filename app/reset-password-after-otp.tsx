import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import axios from 'axios';
import { BASE_URL } from '../constants/endpoints';
import { Ionicons } from '@expo/vector-icons';

export default function ResetPasswordAfterOtp() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!password.match(/[A-Z]/)) {
      return 'Password must contain at least one capital letter';
    }
    if (!password.match(/[a-z]/)) {
      return 'Password must contain at least one small letter';
    }
    if (!password.match(/\d/)) {
      return 'Password must contain at least one number';
    }
    if (!password.match(/[!@#$%^&*(),.?":{}|<>]/)) {
      return 'Password must contain at least one special character';
    }
    return null;
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    if (!confirmPassword.trim()) {
      Alert.alert('Error', 'Please confirm your password');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      Alert.alert('Error', passwordError);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/auth/reset-password-after-otp`, {
        email: email,
        newPassword: newPassword.trim()
      });
      
      Alert.alert(
        'Success!', 
        'Your password has been reset successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to login page
              router.push('/login');
            }
          }
        ]
      );
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to reset password. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Reset Password</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Enter your new password
        </Text>
        
        {/* New Password Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons 
              name={showPassword ? "eye-off" : "eye"} 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>

        {/* Confirm Password Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            <Ionicons 
              name={showConfirmPassword ? "eye-off" : "eye"} 
              size={20} 
              color="#666" 
            />
          </TouchableOpacity>
        </View>

        {/* Password Requirements */}
        <View style={styles.requirementsContainer}>
          <Text style={styles.requirementsTitle}>Password Requirements:</Text>
          <Text style={styles.requirement}>• At least 8 characters</Text>
          <Text style={styles.requirement}>• One capital letter (A-Z)</Text>
          <Text style={styles.requirement}>• One small letter (a-z)</Text>
          <Text style={styles.requirement}>• One number (0-9)</Text>
          <Text style={styles.requirement}>• One special character (!@#$%^&*)</Text>
        </View>
        
        <TouchableOpacity
          style={[styles.resetButton, isLoading && styles.disabledButton]}
          onPress={handleResetPassword}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.resetButtonText}>Reset Password</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  passwordInput: {
    flex: 1,
    height: 50,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  eyeButton: {
    padding: 15,
  },
  requirementsContainer: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 8,
    marginBottom: 30,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  requirement: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  resetButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  resetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
