import React, { useEffect, useState } from 'react';
import { Drawer } from 'expo-router/drawer';
import {
  DrawerContentScrollView,
  DrawerItem,
} from '@react-navigation/drawer';
import { useRouter, useSegments } from 'expo-router';
import { View, Text, StyleSheet, Image, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { getToken, removeToken, refreshToken } from '@/utils/storage';
import { BASE_URL } from '@/constants/endpoints';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function VendorDrawerLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [user, setUser] = useState<any>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    const checkVendorRole = async () => {
      let currentToken = await getToken();
      if (!currentToken) {
        router.replace('/login');
        return;
      }

      // ✅ Check if vendor registration was just completed
      const registrationFlag = await AsyncStorage.getItem('vendorRegistrationComplete');
      if (registrationFlag) {
        // Wait a bit longer for role to update in backend
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // ✅ Retry logic with delay to handle cache eviction delay
      let retries = 3;
      let delay = 500;
      
      while (retries > 0) {
        try {
          // ✅ Get fresh token each time (in case it was refreshed)
          currentToken = await getToken();
          if (!currentToken) {
            router.replace('/login');
            return;
          }

          // Force fresh fetch to check role
          const res = await fetch(`${BASE_URL}/users/me`, {
            headers: { Authorization: `Bearer ${currentToken}` },
            cache: 'no-store'
          });
          
          if (res.ok) {
            const data = await res.json();
            setUser(data);
            
            // ✅ Check if user is VENDOR - if not, redirect to user tabs
            // Only check if we're trying to access vendor dashboard (not first/details pages)
            const isVendorRoute = segments.some(seg => seg === '(tabs)');
            
            if (isVendorRoute && data.role !== 'VENDOR') {
              Alert.alert(
                'Access Denied',
                'You need to complete vendor registration first.',
                [
                  {
                    text: 'OK',
                    onPress: () => router.replace('/(tabs)')
                  }
                ]
              );
              return;
            }
            
            // ✅ Success - exit retry loop
            setCheckingRole(false);
            return;
          } else if (res.status === 401 || res.status === 403) {
            // ✅ Session expired or unauthorized - try to refresh token first
            if (retries === 3) {
              // First attempt: Try to refresh token
              try {
                const newToken = await refreshToken();
                if (newToken) {
                  // Token refreshed, get fresh token and retry immediately
                  currentToken = await getToken();
                  await new Promise(resolve => setTimeout(resolve, 300));
                  continue; // Retry with new token
                }
              } catch (refreshErr) {
                console.warn('Token refresh failed:', refreshErr);
              }
            }
            
            // ✅ Wait and retry
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, delay));
              delay += 500; // Increase delay for next retry
              continue;
            } else {
              // All retries failed - redirect to login
              Alert.alert('Session Expired', 'Please login again.');
              await removeToken();
              router.replace('/login');
              return;
            }
          } else {
            throw new Error('Failed to fetch user data');
          }
        } catch (err) {
          console.error('Failed to check vendor role:', err);
          retries--;
          
          if (retries > 0) {
            // Wait before retry
            await new Promise(resolve => setTimeout(resolve, delay));
            delay += 500;
          } else {
            // All retries failed
            Alert.alert('Error', 'Failed to verify vendor access. Please try again.');
            router.replace('/(tabs)');
            setCheckingRole(false);
            return;
          }
        }
      }
      
      setCheckingRole(false);
    };

    checkVendorRole();
  }, [segments]);

  const handleLogout = async () => {
    await removeToken();
    Alert.alert('Logged Out', 'You have been successfully logged out');
    router.replace('/login');
  };

  // ✅ Show loading while checking role
  if (checkingRole) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#4A2DD8" />
        <Text style={{ marginTop: 10, color: '#666' }}>Verifying access...</Text>
      </View>
    );
  }

  // ✅ Don't render drawer if user is not VENDOR and trying to access dashboard
  if (segments.some(seg => seg === '(tabs)') && user && user.role !== 'VENDOR') {
    return null; // Will redirect via useEffect
  }

  return (
    <Drawer
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
      }}
      drawerContent={(props) => (
        <DrawerContentScrollView
          {...props}
          contentContainerStyle={{ flex: 1, backgroundColor: '#ffffff' }}
        >
          {/* Profile Section */}
          <TouchableOpacity
            style={styles.profileBox}
            activeOpacity={0.7}
            onPress={() => router.push('/profile')}
          >
            <FontAwesome name="user-circle-o" size={40} color="#4A2DD8" />
            <View style={styles.profileTextContainer}>
              <Text style={styles.name}>{user?.name || 'Vendor'}</Text>
              <Text style={styles.phone}>+91-{user?.phone?.slice(-10) || 'xxxxx'}</Text>
              {user?.companyName ? (
                <Text style={styles.company}>{user.companyName}</Text>
              ) : null}
            </View>
          </TouchableOpacity>

          <View style={styles.menu}>
            <DrawerItem
              label="HOME"
              onPress={() => props.navigation.navigate('(tabs)')}
              icon={({ color, size }) => (
                <Ionicons name="home-outline" size={size} color="#000000" />
              )}
              labelStyle={styles.labelStyle}
            />
            <DrawerItem
              label="Listing"
              onPress={() => router.push('/vendor/(tabs)/listing')}
              icon={({ color, size }) => (
                <Ionicons name="list-outline" size={size} color="#000000" />
              )}
              labelStyle={styles.labelStyle}
            />
            <DrawerItem
              label="Bookings"
              onPress={() => router.push('/vendor/(tabs)/booking')}
              icon={({ color, size }) => (
                <Ionicons name="calendar-outline" size={size} color="#000000" />
              )}
              labelStyle={styles.labelStyle}
            />
            <DrawerItem
              label="Payments"
              onPress={() => router.push('/vendor/(tabs)/payments')}
              icon={({ color, size }) => (
                <Ionicons name="cash-outline" size={size} color="#000000" />
              )}
              labelStyle={styles.labelStyle}
            />
            <DrawerItem
              label="Help & Support"
              onPress={() => router.push('/vendor/(tabs)/support')}
              icon={({ color, size }) => (
                <Ionicons name="headset-outline" size={size} color="#000000" />
              )}
              labelStyle={styles.labelStyle}
            />
          </View>

          <View style={styles.footer}>
            <DrawerItem
              label="Logout"
              onPress={handleLogout}
              icon={({ color, size }) => (
                <Ionicons name="log-out-outline" size={size} color="#000000" />
              )}
              labelStyle={styles.labelStyle}
            />
            <DrawerItem
              label="Switch to User Mode"
              onPress={() => router.replace('/(tabs)')}
              icon={({ color, size }) => (
                <Ionicons name="person-outline" size={size} color="#000000" />
              )}
              labelStyle={styles.labelStyle}
            />
            <Text style={styles.footerText}>OOTER V 2.00.012</Text>
          </View>
        </DrawerContentScrollView>
      )}
    >
      <Drawer.Screen name="(tabs)" options={{ drawerLabel: 'Dashboard' }} />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  profileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#56544f57',
  },
  profileTextContainer: {
    marginLeft: 12,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  phone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  company: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  menu: {
    flex: 1,
    paddingVertical: 10,
  },
  labelStyle: {
    color: '#000000',
    marginLeft: 10,
    fontSize: 16,
    marginVertical: 5,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  footerText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginTop: 10,
  },
});