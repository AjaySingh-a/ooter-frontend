import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image as RNImage,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BASE_URL } from '@/constants/endpoints';
import { getToken } from '@/utils/storage';
import { useFocusEffect } from '@react-navigation/native';
import HoardingImage from '@/components/HoardingImage';

interface BookingItem {
  orderId: string;
  siteName: string;
  siteType: string;
  imageUrl: string;
  sku: string;
  latitude: number;
  longitude: number;
  bookedTill: string;
  bookingProgressStatus: string;
}

export default function BookingScreen() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      const fetchBookings = async () => {
        const token = await getToken();
        try {
          const res = await fetch(`${BASE_URL}/vendors/bookings/in-progress`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (res.ok) setBookings(data);
        } catch (err) {
          console.error('Failed to load bookings', err);
        } finally {
          setLoading(false);
        }
      };
      fetchBookings();
      return () => {};
    }, [])
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={['top']} style={styles.topBlackBar}>
        <Text style={styles.headerText}>BOOKINGS</Text>
        <View style={styles.searchBarZone}>
          <Text style={styles.searchLabel}>Search Bookings</Text>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder="Find site by SKU or Site Name"
              placeholderTextColor="#999"
            />
          </View>
        </View>
      </SafeAreaView>
      
      {bookings.length === 0 ? (
        <View style={styles.noBookingsContainer}>
          <Text style={styles.noBookingsText}>No bookings found</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {bookings.map((item, idx) => (
            <View style={styles.card} key={idx}>
              <View style={styles.imgHolder}>
                <HoardingImage
                  publicId={item.imageUrl || ''}
                  width={360}
                  height={133}
                  borderRadius={0}
                />
              </View>
              <Text style={styles.ordId}>ORDER ID : {item.orderId}</Text>
              <Text style={styles.siteName}>{item.siteName}</Text>
              <Text style={styles.siteType}>Site Type : {item.siteType}</Text>
              <Text style={styles.siteLoc}>
                Longitude : {item.longitude} | Latitude : {item.latitude}
              </Text>
              <Text style={styles.sku}>SKU : {item.sku}</Text>
              <View style={styles.rowBtnStatus}>
                <TouchableOpacity
                  style={styles.btn}
                  onPress={() => router.push(`/vendor/booking/${item.orderId}`)}
                >
                  <Text style={styles.btnText}>View Booking</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.btn}
                  onPress={() => router.push({
                    pathname: '/vendor/booking/[id]',
                    params: { id: item.orderId, open: 'design' }
                  })}
                >
                  <Text style={styles.btnText}>View Design</Text>
                </TouchableOpacity>
                <View style={styles.statusBox}>
                  <Text style={styles.statusText}>{item.bookingProgressStatus}</Text>
                </View>
              </View>
              <Text style={styles.bookedTill}>Booked till: {item.bookedTill}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ececec',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ececec',
  },
  topBlackBar: {
    backgroundColor: '#000',
    paddingTop: 8,
    paddingBottom: 18,
    paddingHorizontal: 0,
  },
  headerText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
    letterSpacing: 0.5,
    textAlign: 'center',
    marginTop: 0,
    marginBottom: 8,
  },
  searchBarZone: {
    paddingHorizontal: 19,
    marginTop: 0,
  },
  searchLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
    marginBottom: 7,
    letterSpacing: 0.8,
  },
  searchBar: {
    backgroundColor: '#fff',
    borderRadius: 7,
    height: 38,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  searchInput: {
    fontSize: 14,
    color: '#000',
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 22,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 7,
    padding: 0,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
  },
  imgHolder: {
    backgroundColor: '#efefef',
    width: '100%',
    aspectRatio: 2.7,
  },
  ordId: {
    fontSize: 12,
    color: '#444',
    marginTop: 14,
    marginLeft: 14,
    fontWeight: 'bold',
  },
  siteName: {
    fontSize: 14,
    color: '#111',
    marginTop: 2,
    marginLeft: 14,
    fontWeight: 'bold',
  },
  siteType: {
    fontSize: 12,
    color: '#333',
    marginTop: 2,
    marginLeft: 14,
  },
  siteLoc: {
    fontSize: 12,
    color: '#333',
    marginTop: 2,
    marginLeft: 14,
  },
  sku: {
    fontSize: 12,
    color: '#333',
    marginTop: 2,
    marginLeft: 14,
  },
  rowBtnStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginLeft: 10,
  },
  btn: {
    backgroundColor: '#e7e7e7',
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  btnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBox: {
    marginLeft: 'auto',
    backgroundColor: '#ff5656',
    borderRadius: 4,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  bookedTill: {
    color: '#888',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 8,
    marginRight: 14,
    marginBottom: 10,
  },
  noBookingsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  noBookingsText: {
    fontSize: 18,
    color: '#555',
    fontStyle: 'italic',
  },
});