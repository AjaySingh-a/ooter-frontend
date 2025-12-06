import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Dimensions, 
  TouchableOpacity, 
  Alert, 
  Platform,
  ActivityIndicator,
  StatusBar 
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import LocationPermissionDialog from '@/components/LocationPermissionDialog';

export default function MapPicker() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [initialRegion, setInitialRegion] = useState({
    latitude: 28.6139, // Default to Delhi
    longitude: 77.2090,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [pendingLocationAction, setPendingLocationAction] = useState<(() => void) | null>(null);

  const showLocationPermissionDialog = (onAccept: () => void) => {
    setPendingLocationAction(() => onAccept);
    setShowLocationDialog(true);
  };

  const handleLocationAccept = async () => {
    setShowLocationDialog(false);
    if (pendingLocationAction) {
      pendingLocationAction();
    }
    setPendingLocationAction(null);
  };

  const handleLocationDecline = () => {
    setShowLocationDialog(false);
    setPendingLocationAction(null);
    setError('Location permission denied. Using default location.');
    setIsLoading(false);
  };

  useEffect(() => {
    console.log('MapPicker: Component mounted with params:', params);
    
    // Check if coordinates are passed from previous screen
    if (params.lat && params.lng) {
      const lat = parseFloat(params.lat as string);
      const lng = parseFloat(params.lng as string);
      if (!isNaN(lat) && !isNaN(lng)) {
        console.log('MapPicker: Using coordinates from params:', lat, lng);
        setSelectedLocation({ latitude: lat, longitude: lng });
        setInitialRegion({
          latitude: lat,
          longitude: lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setIsLoading(false);
        return;
      }
    }

    // Otherwise get current location
    showLocationPermissionDialog(async () => {
      try {
        console.log('MapPicker: Getting current location...');
        setIsLoading(true);
        setError(null);
        
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log('MapPicker: Location permission status:', status);
        
        if (status !== 'granted') {
          setError('Location permission denied. Using default location.');
          setIsLoading(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced
        });
        
        console.log('MapPicker: Current location obtained:', location.coords);
        
        setInitialRegion({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
        setSelectedLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });
      } catch (err) {
        console.error('MapPicker: Location error:', err);
        setError('Failed to get current location. Using default location.');
        // Keep default Delhi coordinates
      } finally {
        setIsLoading(false);
      }
    });
  }, [params.lat, params.lng]);

  const handleMapPress = (event: any) => {
    console.log('MapPicker: Map pressed at:', event.nativeEvent.coordinate);
    setSelectedLocation(event.nativeEvent.coordinate);
  };

  const handleConfirm = () => {
    if (!selectedLocation) {
      Alert.alert('Select a location', 'Please tap on the map to choose a location.');
      return;
    }

    console.log('MapPicker: Confirming location:', selectedLocation);

    // Check where to return based on the source
    const returnScreen = params.returnTo === '/vendor/hoarding/edit' 
      ? '/vendor/hoarding/edit' 
      : '/vendor/add-listing';
    
    // Use replace to ensure proper navigation and data passing
    router.replace({
      pathname: returnScreen,
      params: {
        lat: selectedLocation.latitude.toString(),
        lng: selectedLocation.longitude.toString(),
        id: params.id || '', // Pass id if editing
        locationUpdated: 'true' // Flag to indicate location was updated
      },
    });
  };

  const handleBack = () => {
    console.log('MapPicker: Going back without saving');
    // Use replace instead of back to ensure correct navigation
    if (params.returnTo === '/vendor/hoarding/edit') {
      router.replace({
        pathname: '/vendor/hoarding/edit',
        params: { id: params.id }
      });
    } else {
      router.replace('/vendor/add-listing');
    }
  };

  const handleMapLoad = () => {
    console.log('MapPicker: Map loaded successfully');
    setMapLoaded(true);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <StatusBar backgroundColor="#fff" barStyle="dark-content" />
        <ActivityIndicator size="large" color="#4A2DD8" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      
      {/* Back Button Header - Fixed position */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color="#000" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsText}>Tap on the map to select a location</Text>
      </View>

      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={20} color="#fff" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Single Clean Map View */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={initialRegion}
          onPress={handleMapPress}
          showsUserLocation={true}
          showsMyLocationButton={true}
          zoomEnabled={true}
          scrollEnabled={true}
          loadingEnabled={true}
          onMapLoaded={handleMapLoad}
        >
          {selectedLocation && (
            <Marker 
              coordinate={selectedLocation} 
              title="Selected Location"
              description="This location will be saved"
              pinColor="#4A2DD8"
            />
          )}
        </MapView>
      </View>

      {/* Map Test Info */}
      <View style={styles.mapTestInfo}>
        <Text style={styles.mapTestText}>Map Status: {mapLoaded ? 'Loaded ✅' : 'Loading...'}</Text>
        <Text style={styles.mapTestText}>Coordinates: {initialRegion.latitude.toFixed(6)}, {initialRegion.longitude.toFixed(6)}</Text>
        {selectedLocation && (
          <Text style={styles.mapTestText}>Selected: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}</Text>
        )}
      </View>

      {/* Footer with Confirm Button */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.confirmBtn, !selectedLocation && styles.confirmBtnDisabled]} 
          onPress={handleConfirm}
          disabled={!selectedLocation}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
          <Text style={styles.confirmText}>
            {selectedLocation ? 'Confirm Location' : 'Select a location first'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Debug Info */}
      {__DEV__ && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugText}>
            Map Loaded: {mapLoaded ? 'Yes' : 'No'} | 
            Location: {selectedLocation ? 'Selected' : 'None'} | 
            Region: {initialRegion.latitude.toFixed(6)}, {initialRegion.longitude.toFixed(6)}
          </Text>
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
    backgroundColor: '#fff'
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 30,
    left: 16,
    zIndex: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 8,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
  },
  backButtonText: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: '500',
  },
  mapContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  map: { 
    flex: 1,
    width: '100%',
    height: '100%',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    backgroundColor: '#4A2DD8',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: '#ccc',
  },
  confirmText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 16,
  },
  instructions: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 110 : 80,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  instructionsText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  errorContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 150 : 120,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 152, 0, 0.9)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  errorText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center',
    fontWeight: '500',
    marginLeft: 8,
  },
  mapTestInfo: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 190 : 160,
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  mapTestText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  debugContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 4,
    zIndex: 1000,
  },
  debugText: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
  },
});