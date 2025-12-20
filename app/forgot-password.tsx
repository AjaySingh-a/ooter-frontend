import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Image,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { BASE_URL } from '@/constants/endpoints';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState('');

  const validatePhone = () => {
    setPhoneError('');
    
    if (!phone.trim()) {
      setPhoneError('Phone number is required');
      return false;
    }
    
    if (phone.length !== 10 || !/^\d+$/.test(phone)) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validatePhone()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(`${BASE_URL}/auth/forgot-password`, {
        phone: phone.trim()
      });
      
      Alert.alert(
        'Success!', 
        'Password reset OTP has been sent to your phone number. Please check your SMS and enter the OTP.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to OTP verification page with phone
              router.navigate({
                pathname: '/verify-forgot-password-otp' as any,
                params: { phone: phone.trim() }
              });
            }
          }
        ]
      );
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Failed to send reset OTP. Please try again.';
      Alert.alert('Error', message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* StatusBar with border */}
      <View style={styles.statusBar}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      </View>
      
      <Image source={require('@/assets/images/worldmap.jpg')} style={styles.bg} />

      <View style={styles.overlay}>
        {/* Header */}
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>

        <Text style={styles.heading}>
          Forgot <Text style={styles.highlight}>Password</Text>
        </Text>

        <Image source={require('@/assets/images/logo.png')} style={styles.logo} />

        <Text style={styles.subtitle}>
          Enter your phone number and we'll send you an OTP to reset your password.
        </Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, phoneError ? styles.inputError : null]}
            placeholder="Enter your phone number"
            placeholderTextColor="#888"
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={(text) => {
              // Only allow numbers
              const numericText = text.replace(/[^0-9]/g, '');
              setPhone(numericText);
              if (phoneError) setPhoneError('');
            }}
            editable={!isLoading}
          />
          {phoneError ? (
            <Text style={styles.errorText}>{phoneError}</Text>
          ) : null}
        </View>

        <TouchableOpacity 
          style={[styles.submitBtn, isLoading && styles.submitBtnDisabled]} 
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitText}>Send OTP</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.backToLogin}
          onPress={() => router.back()}
        >
          <Text style={styles.backToLoginText}>Back to Login</Text>
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
  statusBar: {
    height: Constants.statusBarHeight,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    resizeMode: 'cover',
    zIndex: -1,
    opacity: 0.2,
  },
  overlay: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: Constants.statusBarHeight + 20,
    left: 24,
    zIndex: 10,
    padding: 8,
  },
  heading: {
    fontSize: 28,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 20,
    color: '#000',
  },
  highlight: {
    fontWeight: 'bold',
    color: '#4A2DD8',
  },
  logo: {
    width: 200,
    height: 120,
    alignSelf: 'center',
    marginBottom: 30,
    resizeMode: 'contain',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#4A2DD8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 8,
    backgroundColor: '#fff',
    color: '#000',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  submitBtn: {
    backgroundColor: '#4A2DD8',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  submitBtnDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backToLogin: {
    alignItems: 'center',
    padding: 10,
  },
  backToLoginText: {
    color: '#4A2DD8',
    fontSize: 16,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
