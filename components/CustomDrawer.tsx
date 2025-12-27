import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  AppState,
} from 'react-native';
import { FontAwesome, Feather, Ionicons } from '@expo/vector-icons';
import { getToken, removeToken } from '@/utils/storage';
import { BASE_URL } from '@/constants/endpoints';
import { useRouter } from 'expo-router';
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CustomDrawerContent(props: DrawerContentComponentProps) {
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const lastFetchTime = useRef(0);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUser = async (force = false) => {
    const token = await getToken();
    if (!token) {
      Alert.alert('Error', 'No token found. Please log in.');
      router.replace('/login');
      return;
    }

    // ✅ Don't fetch too frequently (max once per 2 seconds)
    const now = Date.now();
    if (!force && now - lastFetchTime.current < 2000) {
      return;
    }
    lastFetchTime.current = now;

    try {
      // ✅ Force fresh fetch, no cache
      const res = await fetch(`${BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      if (!res.ok) {
        throw new Error('Failed to fetch user data');
      }
      const data = await res.json();
      setUser(data);
      // ✅ Store in AsyncStorage for consistency
      await AsyncStorage.setItem('userData', JSON.stringify(data));
    } catch (err) {
      console.error('Failed to fetch user in drawer:', err);
      // Don't show alert on every error, just log it
    }
  };

  useEffect(() => {
    fetchUser(true); // Initial fetch
    
    // ✅ Check for vendor registration completion flag with retry logic
    const checkVendorRegistration = async () => {
      try {
        const flag = await AsyncStorage.getItem('vendorRegistrationComplete');
        if (flag) {
          // Vendor registration was completed, force refresh with retries
          await AsyncStorage.removeItem('vendorRegistrationComplete');
          
          // ✅ Retry multiple times to get updated role (cache might be stale)
          let attempts = 0;
          const maxAttempts = 5;
          
          while (attempts < maxAttempts) {
            // Wait before each attempt (increasing delay)
            await new Promise(resolve => setTimeout(resolve, 500 + (attempts * 300)));
            
            // Force fetch user data
            await fetchUser(true);
            
            // Check if role is now VENDOR
            const cachedUserData = await AsyncStorage.getItem('userData');
            if (cachedUserData) {
              const userData = JSON.parse(cachedUserData);
              if (userData.role === 'VENDOR') {
                console.log('✅ Vendor role confirmed after registration!');
                break; // Role updated, exit retry loop
              }
            }
            
            attempts++;
          }
        }
      } catch (err) {
        console.error('Error checking vendor registration flag:', err);
      }
    };
    
    // Check immediately and then periodically
    checkVendorRegistration();
    const flagCheckInterval = setInterval(checkVendorRegistration, 2000);
    
    // ✅ Listen to app state changes to refresh when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        // App came to foreground, refresh user data
        fetchUser(true);
        checkVendorRegistration();
      }
    });

    // ✅ Set up periodic refresh when drawer might be open (every 5 seconds)
    refreshIntervalRef.current = setInterval(() => {
      fetchUser(false);
    }, 5000);

    return () => {
      subscription.remove();
      clearInterval(flagCheckInterval);
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  // Refresh user data when drawer comes into focus
  useFocusEffect(
    useCallback(() => {
      // ✅ Force refresh when drawer opens
      const timer = setTimeout(async () => {
        // Check for vendor registration flag first
        const flag = await AsyncStorage.getItem('vendorRegistrationComplete');
        if (flag) {
          // Force refresh with retry logic
          await AsyncStorage.removeItem('vendorRegistrationComplete');
          let attempts = 0;
          const maxAttempts = 3;
          
          while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 500 + (attempts * 300)));
            await fetchUser(true);
            
            const cachedUserData = await AsyncStorage.getItem('userData');
            if (cachedUserData) {
              const userData = JSON.parse(cachedUserData);
              if (userData.role === 'VENDOR') {
                break;
              }
            }
            attempts++;
          }
        } else {
          fetchUser(true);
        }
      }, 200);
      return () => clearTimeout(timer);
    }, [])
  );

  const handleVendorNavigation = () => {
    if (!user) {
      Alert.alert('Error', 'User data not loaded. Please try again.');
      return;
    }
    if (user.role === 'VENDOR') {
      router.replace('/vendor');
    } else {
      router.push('/vendor/first');
    }
  };

  const handleLogout = async () => {
    await removeToken();
    Alert.alert('Logged Out', 'You have been successfully logged out');
    router.replace('/login');
  };

  // Navigation handler for tabs
  const navigateToTab = (tabName: string) => {
    props.navigation.closeDrawer();
    props.navigation.navigate('MainTabs', { screen: tabName });
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={styles.container}
      style={{ backgroundColor: '#fff' }}
    >
      {/* Profile Section */}
      <TouchableOpacity
        style={styles.profileBox}
        activeOpacity={0.7}
        onPress={() => router.push('/profile')}
      >
        <FontAwesome name="user-circle-o" size={40} color="#4A2DD8" />
        <View style={styles.profileTextContainer}>
          <Text style={styles.name}>{user?.name || 'Guest'}</Text>
          <Text style={styles.phone}>+91-{user?.phone?.slice(-10) || 'xxxxx'}</Text>
          {user?.companyName ? (
            <Text style={styles.company}>{user.companyName}</Text>
          ) : null}
        </View>
      </TouchableOpacity>

      {/* Menu Items */}
      <View style={styles.menuList}>
        <DrawerItem
          icon="gift"
          label="Refer & Earn"
          onPress={() => navigateToTab('refer')}
        />
        <DrawerItem
          icon="heart"
          label="View Saved Sites"
          onPress={() => router.push('/saved')}
        />
        <DrawerItem
          icon="shopping-cart"
          label="View Basket"
          onPress={() => navigateToTab('booking')}
        />
        <DrawerItem
          icon="help-circle"
          label="Support"
          onPress={() => navigateToTab('support')}
        />
      </View>

      {/* Footer with Vendor Mode and Logout buttons */}
      <View style={styles.footer}>
        {/* Vendor Mode Button */}
        <TouchableOpacity 
          onPress={handleVendorNavigation}
          style={styles.vendorButton}
        >
          <Ionicons name="business" size={20} color="#4A2DD8" style={{ marginRight: 16 }} />
          <Text style={styles.vendorButtonText}>
            {user?.role === 'VENDOR' ? 'Switch to Vendor Mode' : 'Become a Vendor'}
          </Text>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity 
          onPress={handleLogout}
          style={styles.logoutButton}
        >
          <Ionicons name="log-out" size={20} color="#FF3B30" style={{ marginRight: 16 }} />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
        
        {/* 🎯 OOTER Title and Version - Now Left Aligned */}
        <Text style={styles.footerTitle}>OOTER</Text>
        <Text style={styles.version}>Version 1.00.03</Text>
      </View>
    </DrawerContentScrollView>
  );
}

function DrawerItem({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.item} activeOpacity={0.7}>
      <Feather name={icon as any} size={20} color="#333" style={{ marginRight: 16 }} />
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
    justifyContent: 'space-between'
  },
  profileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F3F0FF'
  },
  profileTextContainer: {
    marginLeft: 12
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  phone: {
    fontSize: 14,
    color: '#666',
    marginTop: 2
  },
  company: {
    fontSize: 13,
    color: '#888',
    marginTop: 2
  },
  menuList: {
    flex: 1
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 2
  },
  label: {
    fontSize: 16,
    color: '#333'
  },
  vendorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#F3F0FF',
    borderWidth: 1,
    borderColor: '#4A2DD8',
    width: '100%'
  },
  vendorButtonText: {
    fontSize: 16,
    color: '#4A2DD8',
    fontWeight: '500'
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
    marginBottom: 20,
    width: '100%'
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500'
  },
  footer: {
    borderTopWidth: 1,
    borderColor: '#eee',
    paddingTop: 20,
    paddingLeft: 16,        // 🎯 Changed: Left padding for proper spacing
    alignItems: 'flex-start', // 🎯 Changed: Align content to the left
    width: '100%'
  },
  footerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10
  },
  version: {
    fontSize: 12,
    color: '#999',
    marginTop: 6
  }
});