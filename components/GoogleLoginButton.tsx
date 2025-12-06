import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native';
import { useGoogleAuth } from '../utils/googleLogin';

export default function GoogleLoginButton({ 
  onSuccess,
  onError 
}: {
  onSuccess: (idToken: string) => Promise<void>;
  onError?: (error: any) => void;
}) {
  const [request, _, promptAsync] = useGoogleAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handlePress = async () => {
    console.log('=== Google Login Button Pressed ===');
    console.log('Request object:', request);
    console.log('Prompt function:', promptAsync);
    
    if (!request) {
      console.log('❌ Request object is null/undefined');
      Alert.alert('Error', 'Google authentication not ready. Please try again.');
      return;
    }

    if (!promptAsync) {
      console.log('❌ Prompt function is null/undefined');
      Alert.alert('Error', 'Google authentication prompt not available.');
      return;
    }

    setIsLoading(true);
    try {
      console.log('🔄 Calling promptAsync...');
      const result = await promptAsync();
      console.log('📱 Prompt result:', result);
      
      if (result?.type === 'success') {
        console.log('✅ Google login successful');
        console.log('🔑 Authentication object:', result.authentication);
        
        // Get the ID token instead of access token for backend
        const idToken = result.authentication?.idToken;
        if (idToken) {
          console.log('🎯 Got ID token, length:', idToken.length);
          console.log('🎯 ID token preview:', idToken.substring(0, 20) + '...');
          await onSuccess(idToken);
        } else {
          console.log('❌ No ID token in authentication object');
          console.log('🔍 Available properties:', Object.keys(result.authentication || {}));
          throw new Error('No ID token received from Google');
        }
      } else if (result?.type === 'cancel') {
        console.log('🚫 Google login cancelled by user');
        // Don't show error for user cancellation
      } else {
        console.log('❌ Login failed with type:', result?.type);
        console.log('🔍 Full result:', result);
        throw new Error(`Login failed: ${result?.type}`);
      }
    } catch (error: any) {
      console.error('💥 Google login error:', error);
      console.error('💥 Error stack:', error.stack);
      const errorMessage = error.message || 'Google authentication failed';
      Alert.alert('Login Error', errorMessage);
      onError?.(error);
    } finally {
      setIsLoading(false);
      console.log('🏁 Google login process completed');
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.googleBtn, isLoading && styles.googleBtnDisabled]} 
      onPress={handlePress}
      disabled={!request || isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="#4285F4" />
      ) : (
        <Image
          source={require('@/assets/images/google-icon.png')}
          style={styles.googleIcon}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  googleBtn: {
    padding: 10,
    alignItems: 'center',
    marginBottom: 30,
    minHeight: 50,
    justifyContent: 'center',
  },
  googleBtnDisabled: {
    opacity: 0.6,
  },
  googleIcon: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
  },
});