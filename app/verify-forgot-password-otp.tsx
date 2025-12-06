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

export default function VerifyForgotPasswordOtp() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    if (otp.trim().length !== 6) {
      Alert.alert('Error', 'OTP must be 6 digits');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/auth/verify-forgot-password-otp`, {
        email: email,
        otp: otp.trim()
      });
      
      Alert.alert(
        'Success!', 
        'OTP verified successfully! You can now reset your password.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to reset password page with email parameter
              router.navigate({
                pathname: '/reset-password-after-otp' as any,
                params: { email: email }
              });
            }
          }
        ]
      );
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to verify OTP. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      Alert.alert('Error', 'Email not found. Please go back and try again.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/auth/forgot-password`, {
        email: email
      });
      
      Alert.alert('Success!', 'New OTP has been sent to your email.');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to resend OTP. Please try again.';
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
        <Text style={styles.title}>Verify OTP</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Enter the 6-digit OTP sent to:
        </Text>
        <Text style={styles.email}>{email}</Text>
        
        <TextInput
          style={styles.otpInput}
          placeholder="Enter 6-digit OTP"
          value={otp}
          onChangeText={setOtp}
          keyboardType="numeric"
          maxLength={6}
          autoFocus
        />
        
        <TouchableOpacity
          style={[styles.verifyButton, isLoading && styles.disabledButton]}
          onPress={handleVerifyOtp}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.verifyButtonText}>Verify OTP</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.resendButton}
          onPress={handleResendOtp}
          disabled={isLoading}
        >
          <Text style={styles.resendButtonText}>Resend OTP</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  email: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 30,
  },
  otpInput: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
    letterSpacing: 5,
  },
  verifyButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resendButton: {
    padding: 15,
  },
  resendButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
});
