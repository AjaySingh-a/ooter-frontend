import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getToken } from '@/utils/storage';
import { BASE_URL } from '@/constants/endpoints';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { fetchWithCache } from '@/utils/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ListingStats {
  active: number;
  nonActive: number;
  booked: number;
  available: number;
  preBooking: number;
  inventoryPassed: number;
  inventoryFailed: number;
  inProgress: number;
  draft: number;
  error: number;
}

export default function ListingScreen() {
  const [stats, setStats] = useState<ListingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'MY' | 'PROGRESS'>('MY');
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const lastFetchTime = useRef(0);
  const refreshTrigger = useRef(0);
  
  // Cache duration constants
  const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes for normal usage
  const PULL_REFRESH_LOCK = 10 * 1000;   // 10 seconds for pull-to-refresh

  const getUserIdFromToken = (token: string): string => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload?.userId || 'unknown';
    } catch {
      return 'unknown';
    }
  };

  const clearAllCache = async () => {
    const token = await getToken();
    if (!token) return;
    
    const userId = getUserIdFromToken(token);
    const cacheKeys = [
      `vendor-stats-${userId}-MY`,
      `vendor-stats-${userId}-PROGRESS`,
      `vendor-stats-${userId}-MY_time`,
      `vendor-stats-${userId}-PROGRESS_time`
    ];
    
    await Promise.all(
      cacheKeys.map(key => AsyncStorage.removeItem(key))
    );
  };

  const fetchStats = async (forceRefresh = false) => {
    const token = await getToken();
    if (!token) {
      router.replace('/login');
      return;
    }

    try {
      setLoading(true);
      const userId = getUserIdFromToken(token);
      
      // Smart refresh: 15 minutes for normal usage
      const timeSinceLastFetch = Date.now() - lastFetchTime.current;
      const shouldForceRefresh = forceRefresh || (timeSinceLastFetch > CACHE_DURATION);
      
      if (!shouldForceRefresh && stats) {
        console.log('Using cached data (15min fresh), no API call needed');
        setLoading(false);
        return; // Use existing cached data
      }
      
      // Only API call when needed
      const data = await fetchWithCache<ListingStats>(
        `${BASE_URL}/vendors/listing-dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
        },
        `vendor-stats-${userId}-${activeTab}`,
        shouldForceRefresh
      );

      setStats(data);
      lastFetchTime.current = Date.now();
      console.log('Fetched fresh stats:', data); // Debug log
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      // If fresh fetch fails, try to get cached data as fallback
      if (!forceRefresh) {
        try {
          const token = await getToken();
          if (token) {
            const userId = getUserIdFromToken(token);
            const cachedData = await AsyncStorage.getItem(`vendor-stats-${userId}-${activeTab}`);
            if (cachedData) {
              setStats(JSON.parse(cachedData));
              console.log('Using cached stats as fallback:', JSON.parse(cachedData));
            }
          }
        } catch (cacheErr) {
          console.error('Failed to get cached stats:', cacheErr);
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Smart refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const smartRefresh = async () => {
        // Case 1: First time (no data) - always fetch
        if (!stats || !lastFetchTime.current) {
          console.log('First load, fetching data...');
          await fetchStats(false);
          return;
        }
        
        // Case 2: Data older than 15 minutes - refresh
        if (Date.now() - lastFetchTime.current > CACHE_DURATION) {
          console.log('Data stale (>15min), refreshing...');
          await fetchStats(true);
          return;
        }
        
        // Case 3: Data fresh (within 15min) - use cache, no API call
        console.log('Data is fresh (within 15min), using cache');
      };
      
      smartRefresh();
    }, [activeTab])
  );

  const onRefresh = useCallback(async () => {
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
    await fetchStats(true);
  }, []);

  const handleTabChange = (tab: 'MY' | 'PROGRESS') => {
    setActiveTab(tab);
    
    // Check if we have fresh cached data for this tab
    const checkTabData = async () => {
      const token = await getToken();
      if (token) {
        const userId = getUserIdFromToken(token);
        const tabCacheKey = `vendor-stats-${userId}-${tab}`;
        const cachedData = await AsyncStorage.getItem(tabCacheKey);
        
        if (cachedData && (Date.now() - lastFetchTime.current < CACHE_DURATION)) {
          // Use cached data if fresh, no API call
          setStats(JSON.parse(cachedData));
          console.log('Using fresh cached data for tab switch');
        } else {
          // Fetch fresh data only when needed
          fetchStats(true);
        }
      }
    };
    
    checkTabData();
  };

  const handleAddListing = async () => {
    const token = await getToken();
    if (!token) {
      router.replace('/login');
      return;
    }
    
    // Clear all cache before navigating
    await clearAllCache();
    
    // Set a flag to refresh when returning
    refreshTrigger.current = Date.now();
    
    router.push('/vendor/add-listing');
  };

  // Listen for navigation events to refresh stats
  useFocusEffect(
    useCallback(() => {
      const checkForRefresh = async () => {
        // If we have a recent refresh trigger, refresh the stats
        if (refreshTrigger.current > 0 && Date.now() - refreshTrigger.current < 30000) {
          console.log('Detected recent add listing, refreshing stats...');
          refreshTrigger.current = 0; // Reset trigger
          await clearAllCache();
          fetchStats(true);
        }
      };
      
      checkForRefresh();
    }, [])
  );

  if (loading && !stats) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Black Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>LISTING</Text>
      </View>

      {/* Tab Labels */}
      <View style={styles.tabsRow}>
        <TouchableOpacity onPress={() => handleTabChange('MY')}>
          <Text style={[styles.tabText, activeTab === 'MY' && styles.activeTab]}>
            MY LISTING
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleTabChange('PROGRESS')}>
          <Text style={[styles.tabText, activeTab === 'PROGRESS' && styles.activeTab]}>
            IN PROGRESS LISTING
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 140 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#000000']}
            tintColor="#000000"
          />
        }
      >
        <View style={styles.cardsGrid}>
          {activeTab === 'MY' ? (
            <>
              <StatCard 
                label="Active" 
                count={stats?.active || 0} 
                onPress={() => router.push('/vendor/active-listings')} 
              />
              <StatCard 
                label="Non Active" 
                count={stats?.nonActive || 0} 
                onPress={() => router.push('/vendor/non-active-listings')} 
              />
              <StatCard 
                label="Booked" 
                count={stats?.booked || 0} 
                onPress={() => router.push('/vendor/booked-listings')} 
              />
              <StatCard 
                label="Available for Booking" 
                count={stats?.available || 0} 
                onPress={() => router.push('/vendor/available-listings')} 
              />
            </>
          ) : (
            <>
              <StatCard 
                label="Draft Listing" 
                count={stats?.draft || 0} 
                onPress={() => router.push('/vendor/draft-listings')}
              />
              <StatCard 
                label="Error" 
                count={stats?.error || 0} 
                onPress={() => router.push('/vendor/error-listings')} 
              />
            </>
          )}
        </View>
      </ScrollView>

      {/* Add Listing Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddListing}
      >
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text style={styles.addText}>Add Listing</Text>
      </TouchableOpacity>
    </View>
  );
}

function StatCard({ label, count, onPress }: { label: string; count: number; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.statCard} activeOpacity={0.8}>
      <View>
        <Text style={styles.statCount}>{count}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#888" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f0f0' },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header: {
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
    letterSpacing: 1,
    flex: 1,
    textAlign: 'center',
  },

  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginHorizontal: 16,
    elevation: 1,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999',
  },
  activeTab: {
    color: '#000',
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    paddingBottom: 4,
  },

  cardsGrid: {
    paddingHorizontal: 16,
    gap: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 10,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statCount: { fontSize: 16, fontWeight: 'bold', color: '#111' },
  statLabel: { fontSize: 12, color: '#555', marginTop: 4 },

  addButton: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    backgroundColor: '#000',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    elevation: 4,
  },
  addText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 13,
  },
});