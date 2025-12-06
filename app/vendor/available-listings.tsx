import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getToken } from '@/utils/storage';
import { BASE_URL } from '@/constants/endpoints';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import HoardingImage from '@/components/HoardingImage';
import { fetchWithCache } from '@/utils/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Listing {
  id: number;
  name: string;
  imageUrl: string;
  city: string;
  state: string;
  district: string;
  pricePerMonth: number;
  status: string;
  sku: string;
  bookedTill: string | null;
}

interface PaginatedResponse {
  content: Listing[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  last: boolean;
  totalPages: number;
  totalElements: number;
  first: boolean;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  empty: boolean;
}

export default function AvailableListingsScreen() {
  const [data, setData] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<'priceAsc' | 'priceDesc' | 'nameAsc' | 'nameDesc'>('priceAsc');
  const [refreshing, setRefreshing] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  // Cache duration constants
  const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes for normal usage
  const PULL_REFRESH_LOCK = 10 * 1000;   // 10 seconds for pull-to-refresh
  const lastFetchTime = useRef(0);

  const getUserIdFromToken = async (): Promise<string> => {
    const token = await getToken();
    if (!token) return 'guest';
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload?.userId || 'guest';
    } catch (err) {
      console.error('Error parsing token:', err);
      return 'guest';
    }
  };

  const fetchListings = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        router.replace('/login');
        return;
      }

      // Smart refresh: 15 minutes for normal usage
      const timeSinceLastFetch = Date.now() - lastFetchTime.current;
      const shouldForceRefresh = forceRefresh || (timeSinceLastFetch > CACHE_DURATION);
      
      if (!shouldForceRefresh && data.length > 0) {
        console.log('Using cached data (15min fresh), no API call needed');
        setLoading(false);
        return; // Use existing cached data
      }

      const userId = await getUserIdFromToken();
      const springSort = 
        sort === 'nameAsc' ? 'name,asc' :
        sort === 'nameDesc' ? 'name,desc' :
        sort === 'priceAsc' ? 'pricePerMonth,asc' :
        'pricePerMonth,desc';

      const cacheKey = `vendor-listings-${userId}-${sort}`;
      
      const response = await fetchWithCache<PaginatedResponse | Listing[]>(
        `${BASE_URL}/vendors/available-listings?page=0&size=20&sort=${springSort}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
        cacheKey,
        shouldForceRefresh
      );

      // Handle both array and paginated response formats
      const listings = Array.isArray(response) 
        ? response 
        : response?.content || [];

      setData(listings);
      lastFetchTime.current = Date.now();
      console.log('Fetched fresh available listings:', listings);
    } catch (e: any) {
      console.error('API Error:', e);
      if (e.message.includes('401')) {
        router.replace('/login');
      } else {
        Alert.alert('Error', 'Failed to fetch available listings');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const clearCache = async () => {
    const token = await getToken();
    if (!token) return;
    
    const userId = await getUserIdFromToken();
    const cacheKeys = [
      `vendor-listings-${userId}-priceAsc`,
      `vendor-listings-${userId}-priceDesc`,
      `vendor-listings-${userId}-nameAsc`,
      `vendor-listings-${userId}-nameDesc`
    ];
    
    await Promise.all(
      cacheKeys.map(key => AsyncStorage.removeItem(key))
    );
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
    await clearCache(); // Clear cache before refresh
    await fetchListings(true);
  }, []);

  // Smart refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const smartRefresh = async () => {
        // Case 1: First time (no data) - always fetch
        if (!data.length || !lastFetchTime.current) {
          console.log('First load, fetching available listings...');
          await fetchListings(false);
          return;
        }
        
        // Case 2: Data older than 15 minutes - refresh
        if (Date.now() - lastFetchTime.current > CACHE_DURATION) {
          console.log('Data stale (>15min), refreshing available listings...');
          await fetchListings(true);
          return;
        }
        
        // Case 3: Data fresh (within 15min) - use cache, no API call
        console.log('Available listings data is fresh (within 15min), using cache');
      };
      
      smartRefresh();
    }, [sort])
  );

  const renderCard = (item: Listing) => (
    <View key={item.id} style={styles.card}>
      <View style={{ flexDirection: 'row' }}>
        <HoardingImage
          publicId={item.imageUrl || ''}
          width={100}
          height={100}
          borderRadius={10}
        />
        <View style={{ flex: 1, padding: 10 }}>
          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.subText}>SKU ID: {item.sku}</Text>
          <Text style={styles.subText}>City: {item.city}</Text>
          <Text style={styles.subText}>District: {item.district}</Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <View style={styles.column}>
          <Text style={styles.columnLabel}>Status</Text>
          <View style={[styles.statusPill, styles.green]}>
            <Text style={styles.statusText}>Available</Text>
          </View>
        </View>

        <View style={styles.column}>
          <Text style={styles.columnLabel}>Price</Text>
          <Text style={styles.price}>₹{item.pricePerMonth.toLocaleString('en-IN')}</Text>
        </View>

        <View style={styles.column}>
          <Text style={styles.columnLabel}>View</Text>
          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => router.push({
              pathname: '/vendor/hoarding/[id]',
              params: { id: item.id.toString() }
            })}
          >
            <Text style={styles.viewText}>View</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading && !data.length) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MY LISTINGS</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
        </View>
      </View>

      <Text style={styles.activeTitle}>Available ({data.length})</Text>

      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          <FilterButton 
            label="A to Z" 
            active={sort === 'nameAsc'} 
            onPress={() => setSort('nameAsc')} 
          />
          <FilterButton 
            label="Z to A" 
            active={sort === 'nameDesc'} 
            onPress={() => setSort('nameDesc')} 
          />
          <FilterButton 
            label="Low to High" 
            active={sort === 'priceAsc'} 
            onPress={() => setSort('priceAsc')} 
          />
          <FilterButton 
            label="High to Low" 
            active={sort === 'priceDesc'} 
            onPress={() => setSort('priceDesc')} 
          />
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.listingsContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#000']}
            tintColor="#000"
          />
        }
      >
        {data.length > 0 ? (
          data.map(renderCard)
        ) : (
          <Text style={styles.emptyText}>No listings available</Text>
        )}
      </ScrollView>
    </View>
  );
}

function FilterButton({ 
  label, 
  active, 
  onPress 
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.filterButton, active && styles.activeFilter]}
    >
      <Text style={[styles.filterText, active && styles.activeText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f4f4f4' 
  },
  loader: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  header: {
    backgroundColor: '#000',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  activeTitle: {
    fontSize: 13,
    fontWeight: '500',
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 2,
    color: '#111',
  },
  filterRow: { 
    backgroundColor: '#fff', 
    marginBottom: 2 
  },
  filterContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    height: 40,
    alignItems: 'center',
  },
  listingsContainer: { 
    paddingBottom: 120, 
    paddingTop: 2 
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginRight: 6,
    borderRadius: 20,
    backgroundColor: '#eee',
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 90,
  },
  filterText: { 
    fontSize: 12, 
    color: '#444', 
    fontWeight: '500' 
  },
  activeFilter: { 
    backgroundColor: '#000' 
  },
  activeText: { 
    color: '#fff' 
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginTop: 4,
    marginBottom: 6,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  title: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: '#111' 
  },
  subText: { 
    fontSize: 12, 
    color: '#666', 
    marginTop: 2 
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
  },
  column: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  columnLabel: { 
    fontSize: 12, 
    color: '#777', 
    marginBottom: 4 
  },
  statusPill: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  green: { 
    backgroundColor: '#4CAF50' 
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  viewButton: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  viewText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#666',
    fontSize: 14,
  },
});