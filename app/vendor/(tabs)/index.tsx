import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getToken } from '@/utils/storage';
import { BASE_URL } from '@/constants/endpoints';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { fetchWithCache } from '@/utils/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface VendorStats {
  totalSites: number;
  bookedSites: number;
  liveSites: number;
  totalSales: number;
  inventorySold: number;
  newOrders: number;
  pendingRTM: number;
  previousPayment: number;
  upcomingPayment: number;
  siteBooked: number;
  siteAvailable: number;
  available: number; // Available count from listing dashboard
  onHold: boolean;
  verified?: boolean;
}

const getUserIdFromToken = (token: string): string => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload?.userId || 'guest';
  } catch (err) {
    console.error('Error parsing token:', err);
    return 'guest';
  }
};

export default function VendorDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const lastFetchTime = useRef(0);
  
  // Cache duration constants
  const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes for normal usage
  const PULL_REFRESH_LOCK = 10 * 1000;   // 10 seconds for pull-to-refresh

  const clearAllCache = async () => {
    const token = await getToken();
    if (!token) return;
    
    const userId = getUserIdFromToken(token);
    const cacheKeys = [
      `vendorDashboard-${userId}`,
      `verificationStatus-${userId}`,
      `vendor-stats-${userId}-MY`,
      `vendor-stats-${userId}-PROGRESS`
    ];
    
    await Promise.all(
      cacheKeys.map(key => AsyncStorage.removeItem(key))
    );
  };

  const fetchData = async (forceRefresh = false) => {
    const token = await getToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    // ✅ Check if user is vendor - with retry logic for fresh registrations
    try {
      let userRes = await fetch(`${BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store' // Force fresh fetch
      });
      
      if (!userRes.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      let userData = await userRes.json();
      
      // ✅ If role is not VENDOR, wait and retry once (for fresh registrations)
      if (userData.role !== 'VENDOR') {
        console.log('User role is not VENDOR, retrying after 1 second...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        userRes = await fetch(`${BASE_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store'
        });
        
        if (userRes.ok) {
          userData = await userRes.json();
        }
        
        if (userData.role !== 'VENDOR') {
          Alert.alert('Access Denied', 'Only vendors can access this dashboard');
          router.replace('/(tabs)');
          return;
        }
      }
      
      // ✅ Store updated user data
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      
    } catch (err) {
      console.error('Failed to verify user role:', err);
      router.replace('/login');
      return;
    }

    setLoading(true);
    const userId = getUserIdFromToken(token);
    const cacheKey = `vendorDashboard-${userId}`;

    try {
      // Smart caching: Only force refresh when absolutely necessary
      const shouldForceRefresh = forceRefresh || 
        (Date.now() - lastFetchTime.current > 300000); // 5 minutes
      
      const dashboardData = await fetchWithCache<VendorStats>(
        `${BASE_URL}/vendors/dashboard`,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Accept': 'application/json'
          }
        },
        cacheKey,
        shouldForceRefresh // Smart refresh, not always
      );

      // Fetch verification status (always fresh)
      let verified = false;
      try {
        const verificationData = await fetchWithCache<{verified?: boolean}>(
          `${BASE_URL}/bookings/verification-status`,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Accept': 'application/json'
            }
          },
          `verificationStatus-${userId}`,
          true
        );
        verified = verificationData?.verified ?? false;
      } catch (verificationError) {
        console.warn('Verification status fetch failed:', verificationError);
      }

      // Fetch listing stats for accurate available count
      let listingStats = null;
      try {
        listingStats = await fetchWithCache<{
          active: number;
          nonActive: number;
          booked: number;
          available: number;
        }>(
          `${BASE_URL}/vendors/listing-dashboard`,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Accept': 'application/json'
            }
          },
          `vendor-stats-${userId}-MY`,
          shouldForceRefresh
        );
      } catch (listingError) {
        console.warn('Listing stats fetch failed:', listingError);
      }

      setStats({
        ...dashboardData,
        available: listingStats?.available ?? 0, // Use available count from listing dashboard
        verified
      });
      
      lastFetchTime.current = Date.now();
      console.log('Fetched dashboard data:', shouldForceRefresh ? 'FRESH' : 'CACHED', dashboardData);
      console.log('Fetched listing stats:', listingStats);

    } catch (err) {
      console.error('Dashboard fetch error:', err);
      
      // Fallback to cached data if available
      try {
        const cachedData = await AsyncStorage.getItem(cacheKey);
        if (cachedData) {
          setStats(JSON.parse(cachedData));
          console.log('Using cached dashboard data as fallback');
        } else {
          Alert.alert(
            'Error', 
            err instanceof Error ? err.message : 'Failed to load dashboard'
          );
        }
      } catch (cacheError) {
        Alert.alert('Error', 'Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(async () => {
    console.log('Manual refresh triggered');
    
    // Check if 10 seconds have passed since last API call
    const timeSinceLastFetch = Date.now() - lastFetchTime.current;
    
    if (timeSinceLastFetch < PULL_REFRESH_LOCK) {
      // Less than 10 seconds - silently ignore, no message
      setRefreshing(false);
      return;
    }
    
    // 10 seconds passed - allow refresh
    setRefreshing(true);
    await clearAllCache();
    await fetchData(true);
  }, []);

  // Smart refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const smartRefresh = async () => {
        // Case 1: First time (no data) - always fetch
        if (!stats || !lastFetchTime.current) {
          console.log('First load, fetching dashboard data...');
          await fetchData(false);
          return;
        }
        
        // Case 2: Data older than 15 minutes - refresh
        if (Date.now() - lastFetchTime.current > 900000) { // 15 minutes
          console.log('Data stale (>15min), refreshing dashboard...');
          await fetchData(true);
          return;
        }
        
        // Case 3: Data fresh (within 15min) - use cache, no API call
        console.log('Dashboard data is fresh (within 15min), using cache');
      };
      
      smartRefresh();
    }, [])
  );

  if (loading && !stats) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#000']}
          tintColor="#000"
        />
      }
    >
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => navigation.openDrawer()}
        >
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.topBarTitle}>OOTER VENDORBOARD</Text>
      </View>

      <View style={styles.dashboardContainer}>
        <Text style={styles.dashboardTitle}>Your Dashboard</Text>

        <View style={styles.cardBox}>
          <View style={styles.cardRowHeader}>
            <Text style={styles.cardTitle}>Account Overview</Text>
          </View>

          <View style={styles.noticeBox}>
            <View style={styles.noticeRow}>
              <Text style={styles.noticeText}>
                Account is {stats?.verified ? 'verified ✅' : 'not verified'}
              </Text>
              {!stats?.verified && (
                <TouchableOpacity onPress={() => router.push('/vendor/verification-upload')}>
                  <Text style={styles.noticeAction}>Apply Verification</Text>
                </TouchableOpacity>
              )}
            </View>
            {stats?.onHold && (
              <View style={styles.noticeRow}>
                <Text style={styles.noticeText}>Your account is on hold</Text>
                <TouchableOpacity>
                  <Text style={styles.noticeAction}>View reason</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <DashboardSection
          title="This Month's Overview"
          stats={[
            { label: 'Total Sales', value: `₹${stats?.totalSales || 0}`, onPress: () => router.push('/vendor/sales-overview') },
            { label: 'Inventory Sold', value: stats?.inventorySold || 0, onPress: () => router.push('/vendor/inventory-sold') },
          ]}
        />

        <DashboardSection
          title="Listing"
          stats={[
            { 
              label: 'Site Booked', 
              value: stats?.siteBooked ?? stats?.bookedSites ?? 0,
              onPress: () => router.push('/vendor/booked-listings') 
            },
            { 
              label: 'Available', 
              value: stats?.available ?? 0, // Use available count from listing dashboard
              onPress: () => router.push('/vendor/available-listings') 
            },
          ]}
        />
      </View>
    </ScrollView>
  );
}

function DashboardSection({
  title,
  stats,
}: {
  title: string;
  stats: { label: string; value: string | number; onPress: () => void }[];
}) {
  return (
    <View style={styles.cardBox}>
      <Text style={styles.cardTitle}>{title}</Text>
      <View style={styles.rowTwoBoxes}>
        {stats.map((item, idx) => (
          <TouchableOpacity 
            key={idx} 
            style={styles.whiteBox} 
            onPress={item.onPress}
          >
            <Text style={styles.whiteBoxValue}>{item.value}</Text>
            <Text style={styles.whiteBoxLabel}>{item.label}</Text>
            <Ionicons
              name="chevron-forward"
              size={20}
              color="#999"
              style={{ position: 'absolute', right: 12, top: 12 }}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    flex: 1,
  },
  menuButton: {
    zIndex: 1,
  },
  topIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dashboardContainer: { paddingHorizontal: 16, paddingBottom: 100 },
  dashboardTitle: { fontSize: 20, fontWeight: '700', marginVertical: 12 },
  cardBox: { 
    marginTop: 10,
    padding: 12,
  },
  cardRowHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111' },
  noticeBox: { backgroundColor: '#F3F4F6', borderRadius: 8, padding: 10 },
  noticeRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  noticeText: { fontSize: 14, color: '#555', fontWeight: '500' },
  noticeAction: { fontSize: 14, color: '#555', fontWeight: '500', textDecorationLine: 'underline' },
  rowTwoBoxes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  whiteBox: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginVertical: 6,
  },
  whiteBoxValue: { fontSize: 18, fontWeight: '700', color: '#111' },
  whiteBoxLabel: { fontSize: 14, color: '#666', marginTop: 4, fontWeight: '500' },
});