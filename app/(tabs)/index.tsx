import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TextInput,
  TouchableOpacity, ScrollView, ActivityIndicator, Alert, RefreshControl, AppState,
  StatusBar, SafeAreaView, Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken } from '@/utils/storage';
import { router } from 'expo-router';
import { BASE_URL } from '@/constants/endpoints';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import HoardingImage from '@/components/HoardingImage';
import { fetchWithCache } from '@/utils/apiClient';
import Constants from 'expo-constants';
import LocationPermissionDialog from '@/components/LocationPermissionDialog';

const CITIES = [
  { name: 'Nearby', image: require('@/assets/images/nearby.png') },
  { name: 'Delhi', image: require('@/assets/images/delhi.png') },
  { name: 'Gurgaon', image: require('@/assets/images/gurgaon.png') },
  { name: 'Goa', image: require('@/assets/images/goa.png') },
  { name: 'Mumbai', image: require('@/assets/images/Mumbai.png') },
  { name: 'Bangalore', image: require('@/assets/images/bangalore.png') },
];

const CATEGORIES = ['Recommended', 'Past Ads', 'Super+', 'Saved', 'Most Searched'];

type Hoarding = {
  id: number;
  name: string;
  city: string;
  location: string;
  imageUrl?: string;
  rating?: number;
  price: number;
  discount?: number;
  printingCharges?: number;
  mountingCharges?: number;
};

type ApiCall = {
  abortController: AbortController;
  cleanup: () => void;
};

export default function HomeScreen() {
  const [hoardings, setHoardings] = useState<Hoarding[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchText, setSearchText] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [locationPermission, setLocationPermission] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [pressedCardId, setPressedCardId] = useState<number | null>(null);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [pendingLocationAction, setPendingLocationAction] = useState<(() => void) | null>(null);
  const [hasAskedLocationPermission, setHasAskedLocationPermission] = useState(false);
  
  const activeApiCalls = useRef<Record<string, ApiCall>>({});
  const lastSyncTime = useRef(0);
  const navigation = useNavigation();

  // Check if location permission was already asked
  useEffect(() => {
    const checkLocationPermissionStatus = async () => {
      try {
        const hasAsked = await AsyncStorage.getItem('location_permission_asked');
        setHasAskedLocationPermission(hasAsked === 'true');
        
        // Also check current permission status
        const { status } = await Location.getForegroundPermissionsAsync();
        setLocationPermission(status === 'granted');
      } catch (error) {
        console.error('Error checking location permission status:', error);
      }
    };
    
    checkLocationPermissionStatus();
  }, []);

  // Get screen width for responsive image sizing
  const screenWidth = Dimensions.get('window').width;
  const cardPadding = 16; // Left and right padding of scroll container
  const cardContentPadding = 12; // Left and right padding of card content
  const imageWidth = screenWidth - (cardPadding * 2) - (cardContentPadding * 2);

  const getUserIdFromToken = (token: string): string => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload?.userId || 'guest';
    } catch (err) {
      console.error('Error parsing token:', err);
      return 'guest';
    }
  };

  const formatCategory = (cat: string) => {
    switch (cat) {
      case 'Super+': return 'SUPER_PLUS';
      case 'Recommended': return 'RECOMMENDED';
      case 'Past Ads': return 'PAST_ADS';
      case 'Saved': return 'SAVED';
      case 'Most Searched': return 'MOST_SEARCHED';
      default: return cat.toUpperCase().replace(' ', '_');
    }
  };

  const registerApiCall = (callId: string) => {
    if (activeApiCalls.current[callId]) {
      activeApiCalls.current[callId].cleanup();
    }

    const abortController = new AbortController();
    const cleanup = () => {
      abortController.abort();
      delete activeApiCalls.current[callId];
    };

    activeApiCalls.current[callId] = { abortController, cleanup };
    return abortController;
  };

  const cancelAllApiCalls = () => {
    Object.values(activeApiCalls.current).forEach(({ cleanup }) => cleanup());
    activeApiCalls.current = {};
  };

  const fetchHoardings = async (query = '', callId = 'hoardings', forceRefresh = false) => {
    if (isRedirecting) return;
    const abortController = registerApiCall(callId);
    const token = await getToken();
    if (!token) {
      setIsRedirecting(true);
      await AsyncStorage.removeItem('authToken');
      router.replace('/login');
      return;
    }

    try {
      setLoading(true);
      const userId = getUserIdFromToken(token);
      
      // Add limit=10 for city/category searches, limit=5 for default app open
      const isCityOrCategorySearch = query.includes('city=') || query.includes('category=');
      const limit = isCityOrCategorySearch ? 10 : 5;
      const queryWithLimit = query ? `${query}&limit=${limit}&sort=latest` : `limit=${limit}&sort=latest`;
      
      // Debug logging for city searches
      if (query.includes('city=')) {
        console.log('City search query:', queryWithLimit);
      }
      
      const data = await fetchWithCache<Hoarding[]>(
        `${BASE_URL}/hoardings?${queryWithLimit}`,
        {
          method: 'GET',
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          signal: abortController.signal
        },
        `hoardings-user_${userId}-${queryWithLimit}`,
        forceRefresh
      );

      if (!abortController.signal.aborted) {
        setHoardings(Array.isArray(data) ? data : []);
        lastSyncTime.current = Date.now();
        
        // Debug logging for results
        if (query.includes('city=')) {
          console.log('City search results:', Array.isArray(data) ? data.length : 0, 'hoardings found');
        }
      }
    } catch (err: any) {
      if (!abortController.signal.aborted) {
        console.error('Error fetching hoardings:', err.message);
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          // Handle authentication errors silently - no automatic redirect
          console.log('Authentication error handled silently');
        } else {
          Alert.alert('Error', 'Failed to fetch hoardings');
        }
        setHoardings([]);
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  const showLocationPermissionDialog = (onAccept: () => void) => {
    // If permission was already asked, don't show dialog again
    if (hasAskedLocationPermission) {
      onAccept();
      return;
    }
    
    setPendingLocationAction(() => onAccept);
    setShowLocationDialog(true);
  };

  const handleLocationAccept = async () => {
    setShowLocationDialog(false);
    // Mark that we've asked for permission
    await AsyncStorage.setItem('location_permission_asked', 'true');
    setHasAskedLocationPermission(true);
    
    if (pendingLocationAction) {
      pendingLocationAction();
    }
    setPendingLocationAction(null);
  };

  const handleLocationDecline = async () => {
    setShowLocationDialog(false);
    // Mark that we've asked for permission (even if declined)
    await AsyncStorage.setItem('location_permission_asked', 'true');
    setHasAskedLocationPermission(true);
    
    setPendingLocationAction(null);
    Alert.alert('Location Required', 'Location access is required for nearby hoardings feature.');
  };

  const fetchNearby = async (callId = 'nearby', forceRefresh = false) => {
    if (isRedirecting) return;
    
    // Show prominent disclosure dialog before requesting permission
    showLocationPermissionDialog(async () => {
      const abortController = registerApiCall(callId);
      
      try {
        setLoading(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationPermission(false);
          Alert.alert('Permission Denied', 'Location access is required for nearby hoardings.');
          return;
        }
        setLocationPermission(true);

      const location = await Location.getCurrentPositionAsync({});
      const token = await getToken();
      if (!token) {
        setIsRedirecting(true);
        await AsyncStorage.removeItem('authToken');
        router.replace('/login');
        return;
      }

      const userId = getUserIdFromToken(token);
      
      // No limit for nearby - fetch all hoardings in radius
      const data = await fetchWithCache<Hoarding[]>(
        `${BASE_URL}/hoardings/nearby?lat=${location.coords.latitude}&lng=${location.coords.longitude}&radius=15&sort=latest`,
        {
          method: 'GET',
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          signal: abortController.signal
        },
        `nearby-user_${userId}-${location.coords.latitude}-${location.coords.longitude}`,
        forceRefresh
      );

      if (!abortController.signal.aborted) {
        setHoardings(data?.length ? data : []);
        lastSyncTime.current = Date.now();
      }
    } catch (err: any) {
      if (!abortController.signal.aborted) {
        console.error('Error fetching nearby:', err.message);
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          // Handle authentication errors silently - no automatic redirect
          console.log('Authentication error handled silently');
        } else {
          Alert.alert('Error', 'Failed to fetch nearby hoardings');
        }
      }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    });
  };

  const fetchRecentSearches = async (forceRefresh = false) => {
    if (isRedirecting) return;
    const abortController = registerApiCall('recent-searches');
    const token = await getToken();
    if (!token) {
      setIsRedirecting(true);
      await AsyncStorage.removeItem('authToken');
      router.replace('/login');
      return;
    }

    const userId = getUserIdFromToken(token);
    try {
      const data = await fetchWithCache<string[]>(
        `${BASE_URL}/users/recent-searches`,
        {
          method: 'GET',
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          signal: abortController.signal,
        },
        `recent-searches-user_${userId}`,
        forceRefresh
      );
      if (!abortController.signal.aborted) {
        setRecentSearches(Array.isArray(data) ? data : []);
      }
    } catch (err: any) {
      if (!abortController.signal.aborted) {
        console.error('Error fetching recent searches:', err.message);
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          // Handle authentication errors silently - no automatic redirect
          console.log('Authentication error handled silently');
        }
      }
    }
  };

  const handleCitySelect = async (city: string) => {
    if (isRedirecting) return;
    
    // TOGGLE FUNCTIONALITY: If same city is tapped again, deselect and show default
    if (selectedCity === city) {
      setSelectedCity('');
      setSearchText('');
      setSelectedCategory('');
      // Fetch default hoardings (app open wali 5 hoardings)
      await fetchHoardings('', 'default-hoardings');
      return;
    }
    
    // First time city selection
    setSelectedCity(city);
    setSearchText('');
    setSelectedCategory('');

    if (city === 'Nearby') {
      // CACHE OPTIMIZATION: Remove timestamp for better cache hits
      await fetchNearby(`nearby-${city}`);
    } else {
      // Fix: Use proper city parameter format for API
      await fetchHoardings(`city=${encodeURIComponent(city)}`, `city-${city}`);
    }
  };

  const handleSearchSubmit = async () => {
    const trimmedSearch = searchText.trim();
    if (isRedirecting || !trimmedSearch) return;
    
    if (trimmedSearch.length < 3) {
      Alert.alert('Search Error', 'Please enter at least 3 characters');
      return;
    }

    const callId = `search-${trimmedSearch}-${Date.now()}`;
    setSelectedCity('');
    setSelectedCategory('');
    setLoading(true);

    const controller = registerApiCall(callId);
    try {
      const token = await getToken();
      if (!token) {
        setIsRedirecting(true);
        await AsyncStorage.removeItem('authToken');
        router.replace('/login');
        return;
      }

      // Save search query to recent searches
      await fetchWithCache(
        `${BASE_URL}/users/recent-searches`,
        {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query: trimmedSearch }),
          signal: controller.signal,
        },
        `recent-searches-post-user_${getUserIdFromToken(token)}-${trimmedSearch}`,
        true
      );

      // Add limit=10 to search query with latest first
      const response = await fetchWithCache<Hoarding[]>(
        `${BASE_URL}/hoardings/search?location=${encodeURIComponent(trimmedSearch)}&limit=10&sort=latest`,
        {
          method: 'GET',
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          signal: controller.signal
        },
        `search-results-user_${getUserIdFromToken(token)}-${trimmedSearch}`,
        true
      );

      if (!controller.signal.aborted) {
        setHoardings(Array.isArray(response) ? response : []);
        lastSyncTime.current = Date.now();
        
        if (Array.isArray(response) && response.length === 0) {
          Alert.alert('No Results', `No hoardings found for "${trimmedSearch}"`);
        }
      }
    } catch (err: any) {
      if (!controller.signal.aborted) {
        console.error('Search error:', err);
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          // Handle authentication errors silently - no automatic redirect
          console.log('Authentication error handled silently');
        } else {
          Alert.alert('Search Error', 
            err.message.includes('JSON Parse error') 
              ? 'Invalid response from server' 
              : err.message || 'Failed to perform search'
          );
          setHoardings([]);
        }
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  const handleCategorySelect = async (category: string) => {
    if (isRedirecting) return;
    
    // TOGGLE FUNCTIONALITY: If same category is tapped again, deselect
    if (selectedCategory === category) {
      setSelectedCategory('');
      setSelectedCity('');
      setSearchText('');
      // Fetch default hoardings
      await fetchHoardings('', 'default-hoardings');
      return;
    }
    
    // CACHE OPTIMIZATION: Remove timestamp
    const callId = `category-${category}`;
    setSelectedCategory(category);
    setSelectedCity('');
    setSearchText('');
    await fetchHoardings(`category=${formatCategory(category)}`, callId);
  };

  const handleRefresh = async () => {
    if (isRedirecting) return;
    const now = Date.now();
    if (now - lastSyncTime.current < 2 * 60 * 1000) {
      setRefreshing(false);
      return;
    }

    setRefreshing(true);
    const callId = `refresh-${now}`;
    
    try {
      if (selectedCity === 'Nearby') {
        await fetchNearby(callId, true);
      } else if (searchText) {
        await fetchHoardings(`location=${encodeURIComponent(searchText)}`, callId, true);
      } else if (selectedCategory) {
        await fetchHoardings(`category=${formatCategory(selectedCategory)}`, callId, true);
      } else if (selectedCity) {
        await fetchHoardings(`city=${encodeURIComponent(selectedCity)}`, callId, true);
      } else {
        await fetchHoardings('', callId, true);
      }
      await fetchRecentSearches(true);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const calculateFinalPrice = (hoarding: Hoarding) => {
    const basePrice = hoarding.price;
    const printing = hoarding.printingCharges || 0;
    const mounting = hoarding.mountingCharges || 0;
    const subtotal = basePrice + printing + mounting;
    const commission = subtotal * 0.15;
    const grossTotal = subtotal + commission;
    const discount = hoarding.discount || 0;
    const afterDiscount = grossTotal - discount;
    const gst = afterDiscount * 0.18;
    return Math.round(afterDiscount + gst);
  };

  useEffect(() => {
    const handleAppStateChange = (state: string) => {
      if (state === 'active' && Date.now() - lastSyncTime.current > 5 * 60 * 1000 && !isRedirecting) {
        handleRefresh();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const initialFetch = async () => {
      if (isRedirecting) return;
      const token = await getToken();
      if (!token) {
        setIsRedirecting(true);
        await AsyncStorage.removeItem('authToken');
        router.replace('/login');
        return;
      }
      await fetchRecentSearches();
      await fetchHoardings();
    };
    initialFetch();
    
    return () => {
      cancelAllApiCalls();
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      const callId = `focus-refresh-${Date.now()}`;
      const fetchData = async () => {
        if (isRedirecting) return;
        const token = await getToken();
        if (!token) {
          setIsRedirecting(true);
          await AsyncStorage.removeItem('authToken');
          router.replace('/login');
          return;
        }
        try {
          if (Date.now() - lastSyncTime.current > 5 * 60 * 1000) {
            await fetchRecentSearches();
          }
          if (selectedCity === 'Nearby') {
            await fetchNearby(callId);
          } else if (searchText) {
            await fetchHoardings(`location=${encodeURIComponent(searchText)}`, callId);
          } else if (selectedCategory) {
            await fetchHoardings(`category=${formatCategory(selectedCategory)}`, callId);
          } else if (selectedCity) {
            await fetchHoardings(`city=${encodeURIComponent(selectedCity)}`, callId);
          }
        } catch (error) {
          console.error('Focus refresh error:', error);
        }
      };

      fetchData();

      return () => {
        if (activeApiCalls.current[callId]) {
          activeApiCalls.current[callId].cleanup();
        }
      };
    }, [selectedCity, selectedCategory, searchText])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.statusBar}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      </View>
      
      <ScrollView 
        style={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4A2DD8']}
            tintColor="#4A2DD8"
          />
        }
      >
        <View style={styles.headerRow}>
          <TouchableOpacity 
            onPress={() => (navigation as any).openDrawer()} 
            style={styles.drawerButton}
          >
            <Ionicons name="menu" size={28} color="black" />
          </TouchableOpacity>
          <Image 
            source={require('@/assets/images/logo.png')} 
            style={styles.logo} 
          />
        </View>

        <View style={styles.searchBox}>
          <TextInput
            placeholder="Search your preference"
            placeholderTextColor="#666"
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearchSubmit}
          />
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.cityRow}
        >
          {CITIES.map((city, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleCitySelect(city.name)}
              style={styles.cityItem}
            >
              <Image source={city.image} style={styles.cityIcon} />
              <Text style={[
                styles.cityLabel,
                selectedCity === city.name && styles.selectedCityLabel
              ]}>
                {city.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Quick picks for you</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filterRow}
        >
          {CATEGORIES.map((tag, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleCategorySelect(tag)}
              style={[
                styles.filterPill,
                selectedCategory === tag && {
                  backgroundColor: '#4A2DD8',
                  borderColor: '#4A2DD8',
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  selectedCategory === tag && { color: '#fff' },
                ]}
              >
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Continue your search</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.filterRow}
        >
          {recentSearches.map((term, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => {
                setSearchText(term);
                handleSearchSubmit();
              }}
              style={styles.filterPill}
            >
              <Text style={styles.filterText}>{term}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading && !hoardings.length ? (
          <ActivityIndicator size="large" style={{ marginVertical: 40 }} />
        ) : hoardings.length === 0 && selectedCity === 'Nearby' ? (
          <View style={styles.welcomeMessage}>
            <Text style={styles.welcomeText}>
              No nearby hoardings found. Please check your location settings or try a different city.
            </Text>
          </View>
        ) : hoardings.length === 0 ? (
          <Text style={styles.emptyText}>No hoardings found</Text>
        ) : (
          <FlatList
            data={hoardings}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
              const finalPrice = calculateFinalPrice(item);
              const printing = item.printingCharges || 0;
              const mounting = item.mountingCharges || 0;
              
              return (
                <TouchableOpacity
                  style={[
                    styles.card,
                    pressedCardId === item.id && styles.cardPressed
                  ]}
                  onPressIn={() => setPressedCardId(item.id)}
                  onPressOut={() => setPressedCardId(null)}
                  onPress={() =>
                    router.push({ 
                      pathname: '/(modals)/booking/[id]', 
                      params: { id: String(item.id) } 
                    })
                  }
                >
                    {item.discount ? (
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountText}>
                          ₹{item.discount.toLocaleString('en-IN')} OFF
                        </Text>
                      </View>
                    ) : null}
                    <HoardingImage
                      publicId={item.imageUrl || ''}
                      borderRadius={12}
                      style={{ width: '100%', height: 180 }}
                    />
                    <View style={styles.cardContent}>
                      <Text style={styles.cardTitle}>{item.name}</Text>
                      <Text style={styles.cardLocation}>
                        {item.city} • {item.location}
                      </Text>
                      <Text style={styles.price}>
                        ₹{finalPrice.toLocaleString('en-IN')}
                        <Text style={styles.priceSubtext}> /month</Text>
                      </Text>
                      <Text style={styles.taxBreakdown}>
                        {printing > 0 ? `Printing ₹${printing} • ` : ''}
                        {mounting > 0 ? `Mounting ₹${mounting} • ` : ''}
                        Includes GST
                      </Text>
                      <TouchableOpacity
                        style={styles.bookBtn}
                        onPress={() =>
                          router.push({ 
                            pathname: '/(modals)/booking/[id]', 
                            params: { id: String(item.id) } 
                          })
                        }
                      >
                        <Text style={styles.bookText}>Book Now</Text>
                      </TouchableOpacity>
                    </View>
                </TouchableOpacity>
              );
            }}
            scrollEnabled={false}
            contentContainerStyle={{ paddingBottom: 80 }}
          />
        )}

        {!locationPermission && (
          <View style={styles.welcomeMessage}>
            <Text style={styles.welcomeText}>
              Welcome to OOTER - India's Smartest Outdoor Ad Platform!
            </Text>
          </View>
        )}
      </ScrollView>
      
      <LocationPermissionDialog
        visible={showLocationDialog}
        onAccept={handleLocationAccept}
        onDecline={handleLocationDecline}
      />
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
  scrollContainer: {
    flex: 1,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
    paddingHorizontal: 10,
  },
  drawerButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#f2f2f2',
  },
  logo: { width: 150, height: 34, resizeMode: 'contain' },
  searchBox: { 
    backgroundColor: '#eee', 
    borderRadius: 16, 
    padding: 12, 
    marginBottom: 12 
  },
  searchInput: { 
    fontSize: 16, 
    color: '#333',
  },
  cityRow: { flexDirection: 'row', marginBottom: 16 },
  cityItem: { 
    alignItems: 'center', 
    marginRight: 14,
    padding: 4,
  },
  cityIcon: { 
    width: 50, 
    height: 50, 
    borderRadius: 25, 
    marginBottom: 4 
  },
  cityLabel: { 
    fontSize: 12, 
    color: '#333',
  },
  selectedCityLabel: {
    color: '#4A2DD8',
    fontWeight: 'bold',
  },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 8 
  },
  filterRow: { 
    flexDirection: 'row', 
    marginBottom: 16 
  },
  filterPill: {
    backgroundColor: '#F3F0FF',
    borderColor: '#4A2DD8',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  filterText: { 
    color: '#4A2DD8', 
    fontSize: 13 
  },
    card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  cardPressed: {
    borderWidth: 2,
    borderColor: '#4A2DD8',
    backgroundColor: '#F8F7FF',
    transform: [{ scale: 0.98 }],
  },
  discountBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#E53935',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    zIndex: 2,
  },
  discountText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cardContent: { 
    padding: 12 
  },
  cardTitle: { 
    fontSize: 16, 
    fontWeight: 'bold' 
  },
  cardBoldText: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#000',
    marginVertical: 2
  },
  cardLocation: { 
    fontSize: 13, 
    color: '#555', 
    marginVertical: 2 
  },
  price: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: '#000' 
  },
  priceSubtext: {
    fontSize: 14,
    color: '#666',
    fontWeight: 'normal',
  },
  taxBreakdown: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
  },
  bookBtn: { 
    backgroundColor: '#2DC653', 
    paddingVertical: 8, 
    borderRadius: 8, 
    alignItems: 'center' 
  },
  bookText: { 
    color: '#fff', 
    fontSize: 14, 
    fontWeight: '600' 
  },
  emptyText: { 
    textAlign: 'center', 
    marginTop: 40, 
    color: '#888' 
  },
  welcomeMessage: { 
    padding: 16, 
    backgroundColor: '#F3F0FF', 
    borderRadius: 12, 
    marginBottom: 16 
  },
  welcomeText: { 
    fontSize: 14, 
    color: '#4A2DD8', 
    textAlign: 'center' 
  },
});