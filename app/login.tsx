import React, { useState, useRef } from 'react';
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
import Checkbox from 'expo-checkbox';
import { useRouter } from 'expo-router';
import axios from 'axios';
import { BASE_URL } from '@/constants/endpoints';
import { saveToken } from '@/utils/storage';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState(''); // Phone OR Email
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [identifierError, setIdentifierError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const loginAttemptRef = useRef(false);

  const validateInputs = () => {
    let isValid = true;
    
    // Clear previous errors
    setIdentifierError('');
    setPasswordError('');
    
    if (!identifier.trim()) {
      setIdentifierError('Phone/Email is required');
      isValid = false;
    } else if (identifier.includes('@') && !identifier.includes('.')) {
      setIdentifierError('Please enter a valid email');
      isValid = false;
    }
    
    if (!password.trim()) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      isValid = false;
    }
    
    return isValid;
  };

  const handleLogin = async () => {
    // Prevent multiple simultaneous login attempts
    if (loginAttemptRef.current || isLoading) {
      return;
    }
    
    if (!validateInputs()) {
      return;
    }
    
    loginAttemptRef.current = true;
    setIsLoading(true);
    
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        identifier: identifier.trim(),
        password,
      });
      
      const token = response.data.token;
      console.log('Login successful, token:', token);
      await saveToken(token);
      router.replace('/(tabs)');
    } catch (error: any) {
      const message = error?.response?.data?.message || 'Login failed. Please check your credentials.';
      console.error('Login error:', error.message, 'Response:', error?.response?.data);
      Alert.alert('Login Failed', message);
    } finally {
      setIsLoading(false);
      loginAttemptRef.current = false;
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
        <Text style={styles.heading}>
          Welcome <Text style={styles.highlight}>Back</Text>
        </Text>

        <Image source={require('@/assets/images/logo.png')} style={styles.logo} />

        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, identifierError ? styles.inputError : null]}
            placeholder="Phone No. or Email"
            placeholderTextColor="#888"
            keyboardType="default"
            autoCapitalize="none"
            value={identifier}
            onChangeText={(text) => {
              setIdentifier(text);
              if (identifierError) setIdentifierError('');
            }}
            editable={!isLoading}
          />
          {identifierError ? (
            <Text style={styles.errorText}>{identifierError}</Text>
          ) : null}
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.passwordContainer}>
            <TextInput
              style={[styles.passwordInput, passwordError ? styles.inputError : null]}
              placeholder="Password"
              placeholderTextColor="#888"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) setPasswordError('');
              }}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#888"
              />
            </TouchableOpacity>
          </View>
          {passwordError ? (
            <Text style={styles.errorText}>{passwordError}</Text>
          ) : null}
        </View>

        <View style={styles.checkboxRow}>
          <Checkbox
            value={remember}
            onValueChange={setRemember}
            color={remember ? '#000' : undefined}
            disabled={isLoading}
          />
          <Text style={styles.checkboxText}>Remember this device</Text>
        </View>

        <TouchableOpacity 
          onPress={() => router.navigate('/forgot-password' as any)}
          disabled={isLoading}
        >
          <Text style={[styles.forgotText, isLoading && styles.disabledText]}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]} 
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.loginText}>LOG IN</Text>
          )}
        </TouchableOpacity>

        <View style={[styles.footer, { marginTop: 10 }]}>
          <Text style={styles.footerText}>DON'T HAVE AN ACCOUNT?</Text>
          <TouchableOpacity onPress={() => router.push('/signup')}>
            <Text style={styles.signupNow}>SIGN UP NOW</Text>
          </TouchableOpacity>
        </View>
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
  heading: {
    fontSize: 28,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 30,
    color: '#000',
  },
  highlight: {
    fontWeight: 'bold',
    color: '#4A2DD8',
  },
  logo: {
    width: 240,
    height: 150,
    alignSelf: 'center',
    marginBottom: 30,
    resizeMode: 'contain',
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
  inputContainer: {
    marginBottom: 16,
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
  passwordContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#4A2DD8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingRight: 50,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#000',
  },
  eyeButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkboxText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#444',
  },
  forgotText: {
    color: '#000',
    fontSize: 14,
    alignSelf: 'flex-end',
    textDecorationLine: 'underline',
    marginBottom: 20,
  },
  disabledText: {
    color: '#ccc',
  },
  loginBtn: {
    backgroundColor: '#4A2DD8',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 18,
  },
  loginBtnDisabled: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
  loginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orText: {
    textAlign: 'center',
    color: '#888',
    marginBottom: 10,
  },
  googleBtn: {
    padding: 10,
    alignItems: 'center',
    marginBottom: 30,
  },
  googleIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: 20,
  },
  footerText: {
    fontWeight: 'bold',
    color: '#000',
    fontSize: 13,
  },
  signupNow: {
    color: '#4A2DD8',
    fontWeight: '600',
    marginTop: 4,
    fontSize: 13,
  },
});