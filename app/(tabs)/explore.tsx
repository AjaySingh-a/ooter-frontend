import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import Constants from 'expo-constants';
import { BASE_URL } from '@/constants/endpoints';
import { getToken } from '@/utils/storage';
import { router } from 'expo-router';
import LocationPermissionDialog from '@/components/LocationPermissionDialog';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Hoarding = {
  id: number;
  location: string;
  city: string;
  imageUrl: string;
  price: number;
  discount?: number;
  printingCharges?: number;
  mountingCharges?: number;
};

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [nearby, setNearby] = useState<Hoarding[]>([]);
  const [searchResults, setSearchResults] = useState<Hoarding[]>([]);
  const [loading, setLoading] = useState(false);
  const [nearbyFetched, setNearbyFetched] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [pendingLocationAction, setPendingLocationAction] = useState<(() => void) | null>(null);
  const [hasAskedLocationPermission, setHasAskedLocationPermission] = useState(false);

  // Calculate final price (same as HomeScreen)
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
    fetchRecent();
  }, []);

  // Check if location permission was already asked
  useEffect(() => {
    const checkLocationPermissionStatus = async () => {
      try {
        const hasAsked = await AsyncStorage.getItem('location_permission_asked');
        setHasAskedLocationPermission(hasAsked === 'true');
      } catch (error) {
        console.error('Error checking location permission status:', error);
      }
    };
    
    checkLocationPermissionStatus();
  }, []);

  const fetchRecent = async () => {
    const token = await getToken();
    if (!token) return;

    try {
      const res = await axios.get(`${BASE_URL}/users/recent-searches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecentSearches(res.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  const handleSearch = async (query?: string) => {
    const searchTerm = query || searchQuery.trim();
    if (!searchTerm) return;
    
    const token = await getToken();
    if (!token) return;

    try {
      setLoading(true);
      setSearchDone(true);
      setNearbyFetched(false);
      
      if (query) {
        setSearchQuery(query);
      }

      await axios.post(
        `${BASE_URL}/users/recent-searches`,
        { query: searchTerm },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const res = await axios.get(`${BASE_URL}/hoardings/search?location=${searchTerm}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSearchResults(res.data || []);
      fetchRecent();
    } catch (err) {
      Alert.alert('Error', 'Search failed');
    } finally {
      setLoading(false);
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

  const handleNearby = async () => {
    // Show prominent disclosure dialog before requesting permission
    showLocationPermissionDialog(async () => {
      setLoading(true);
      setNearbyFetched(false);
      setSearchDone(false);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location access is required.');
          return;
        }

      const location = await Location.getCurrentPositionAsync({});
      const token = await getToken();

      const res = await axios.get(
        `${BASE_URL}/hoardings/nearby?lat=${location.coords.latitude}&lng=${location.coords.longitude}&radius=15`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setNearby(res.data || []);
      setNearbyFetched(true);
      } catch (err) {
        Alert.alert('Error', 'Failed to fetch nearby hoardings');
      } finally {
        setLoading(false);
      }
    });
  };

  const handleRecentSearchPress = (item: string) => {
    setSearchQuery(item);
    handleSearch(item);
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      
      {/* Search Bar */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          placeholder="Search for location, city or Hoarding site"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={() => handleSearch()}
          style={styles.input}
          placeholderTextColor="#333"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Nearby */}
      <TouchableOpacity style={styles.nearbyBtn} onPress={handleNearby}>
        <View style={styles.nearbyIcon}>
          <Ionicons name="location" size={16} color="#2DC653" />
        </View>
        <Text style={styles.nearbyText}>Search Nearby Hoardings</Text>
      </TouchableOpacity>

      {/* Continue your search - Minimal Version */}
      {recentSearches.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Continue your search</Text>
          {recentSearches.map((item, index) => (
            <TouchableOpacity 
              key={`${item}-${index}`} 
              style={styles.listItem}
              onPress={() => handleRecentSearchPress(item)}
            >
              <Ionicons name="time" size={18} color="#555" style={styles.listIcon} />
              <Text style={styles.listText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Loading spinner */}
      {loading && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="small" color="#2DC653" />
        </View>
      )}

      {/* Search Results */}
      {searchDone && !loading && (
        <View style={styles.resultsContainer}>
          <Text style={styles.sectionTitle}>Search Results</Text>
          {searchResults.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search" size={40} color="#ddd" />
              <Text style={styles.emptyMsg}>No hoardings found</Text>
            </View>
          ) : (
            searchResults.map((h) => (
              <TouchableOpacity
                key={h.id}
                style={styles.hoardingItem}
                onPress={() => router.push({ pathname: '/(modals)/booking/[id]', params: { id: String(h.id) } })}
              >
                <View style={styles.hoardingIcon}>
                  <Ionicons name="location" size={16} color="#444" />
                </View>
                <View style={styles.hoardingDetails}>
                  <Text style={styles.hoardingLocation}>{h.location} ({h.city})</Text>
                  <Text style={styles.hoardingPrice}>
                    ₹{calculateFinalPrice(h).toLocaleString()}/month
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#ccc" />
              </TouchableOpacity>
            ))
          )}
        </View>
      )}

      {/* Nearby Hoardings */}
      {nearbyFetched && !loading && (
        <View style={styles.resultsContainer}>
          <Text style={styles.sectionTitle}>Nearby Hoardings</Text>
          {nearby.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="map" size={40} color="#ddd" />
              <Text style={styles.emptyMsg}>No nearby hoardings</Text>
            </View>
          ) : (
            nearby.map((h) => (
              <TouchableOpacity
                key={h.id}
                style={styles.hoardingItem}
                onPress={() => router.push({ pathname: '/(modals)/booking/[id]', params: { id: String(h.id) } })}
              >
                <View style={styles.hoardingIcon}>
                  <Ionicons name="pin" size={16} color="#444" />
                </View>
                <View style={styles.hoardingDetails}>
                  <Text style={styles.hoardingLocation}>{h.location} ({h.city})</Text>
                  <Text style={styles.hoardingPrice}>
                    ₹{calculateFinalPrice(h).toLocaleString()}/month
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#ccc" />
              </TouchableOpacity>
            ))
          )}
        </View>
      )}
      
      <LocationPermissionDialog
        visible={showLocationDialog}
        onAccept={handleLocationAccept}
        onDecline={handleLocationDecline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: Constants.statusBarHeight + 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0,
    marginLeft: 10,
    color: '#333',
  },
  nearbyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    marginBottom: 20,
    gap: 10,
  },
  nearbyIcon: {
    backgroundColor: '#e8f8ed',
    padding: 6,
    borderRadius: 20,
  },
  nearbyText: {
    color: '#2DC653',
    fontWeight: '600',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  listIcon: {
    marginRight: 12,
  },
  listText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  resultsContainer: {
    marginTop: 8,
  },
  hoardingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f0f0f0',
  },
  hoardingIcon: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  hoardingDetails: {
    flex: 1,
  },
  hoardingLocation: {
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
  },
  hoardingPrice: {
    fontSize: 14,
    color: '#2DC653',
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyMsg: {
    fontSize: 14,
    color: '#888',
    marginTop: 12,
  },
  loaderContainer: {
    paddingVertical: 20,
  },
});