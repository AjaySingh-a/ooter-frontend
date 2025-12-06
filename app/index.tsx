import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { getToken } from '@/utils/storage';
import { View } from 'react-native';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getToken();
        if (!token) {
          // No token - redirect to first screen
          router.replace('/first');
        } else {
          // Has token - redirect to tabs
          router.replace('/(tabs)');
        }
      } catch (error) {
        // On error - redirect to first screen
        router.replace('/first');
      }
    };

    checkAuth();
  }, []);

  // Show loading while checking auth
  return <View style={{ flex: 1, backgroundColor: '#fff' }} />;
}