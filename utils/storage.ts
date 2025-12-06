import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '@/constants/endpoints';

const TOKEN_KEY = 'token';

/**
 * Clear all user-related cache data
 * This should be called on login/signup to prevent stale data
 */
export const clearUserCache = async (): Promise<void> => {
  try {
    // Get all AsyncStorage keys
    const allKeys = await AsyncStorage.getAllKeys();
    
    // Filter keys that are user-related
    const userCacheKeys = allKeys.filter(key => 
      key === 'userData' ||
      key.startsWith('vendorDashboard-') ||
      key.startsWith('verificationStatus-') ||
      key.startsWith('vendor-stats-') ||
      key.startsWith('vendor-listings-') ||
      key.startsWith('vendorRegistrationComplete')
    );
    
    // Remove all user-related cache
    if (userCacheKeys.length > 0) {
      await AsyncStorage.multiRemove(userCacheKeys);
      console.log('✅ Cleared user cache:', userCacheKeys);
    }
  } catch (error) {
    console.error('Error clearing user cache:', error);
  }
};

export const saveToken = async (token: string): Promise<void> => {
  // ✅ CRITICAL: Clear all user cache before saving new token
  // This prevents stale data from previous user sessions
  await clearUserCache();
  await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const getToken = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(TOKEN_KEY);
};

export const removeToken = async (): Promise<void> => {
  await AsyncStorage.removeItem(TOKEN_KEY);
};

export const refreshToken = async (): Promise<string | null> => {
  try {
    const currentToken = await getToken();
    if (!currentToken) {
      return null;
    }

    const response = await axios.post(`${BASE_URL}/auth/refresh-token`, {}, {
      headers: {
        Authorization: `Bearer ${currentToken}`,
        'Content-Type': 'application/json'
      }
    });

    const newToken = response.data.token;
    // ✅ Don't clear cache on token refresh (same user, just updated token)
    // Only save the new token
    await AsyncStorage.setItem(TOKEN_KEY, newToken);
    return newToken;
  } catch (error) {
    console.error('Token refresh failed:', error);
    await removeToken();
    return null;
  }
};

export const getUserIdFromToken = (token: string): string => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.userId?.toString() || '';
  } catch (error) {
    console.error('Error parsing token:', error);
    return '';
  }
};
