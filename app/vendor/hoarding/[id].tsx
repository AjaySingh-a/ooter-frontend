import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert, Image as RNImage,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getToken } from '@/utils/storage';
import { BASE_URL } from '@/constants/endpoints';
import { Linking } from 'react-native';
import HoardingImage from '@/components/HoardingImage';

export default function HoardingDetailScreen() {
  const { id, bookingStatus: urlBookingStatus } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${BASE_URL}/hoardings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await response.json();
      setData(json);
    } catch (e) {
      Alert.alert('Error', 'Failed to load hoarding.');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) return <View style={styles.loader}><ActivityIndicator size="large" /></View>;

  const {
    name,
    sku,
    city,
    district,
    imageUrl,
    price = 0,
    currentlyAvailable,
    longitude,
    latitude,
    size,
    country,
    state,
    landmark,
    location: route,
    pinCode,
    siteType,
    screenDepth,
    screenWidth,
    screenHeight,
    sizeUnit,
    gst: gstValue = 18,
    hshCode: hsnCode,
    status,
    printingCharges = 0,
    mountingCharges = 0,
    discount = 0,
    ooterCommission = 15,
  } = data || {};

  // Use actual status from backend data
  const actualStatus = status || urlBookingStatus || (currentlyAvailable ? "Available" : "Booked");
  
  // Dynamic status logic with colors - only 3 statuses
  const getStatusInfo = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return { text: 'Available', color: styles.available };
      case 'booked':
        return { text: 'Booked', color: styles.booked };
      case 'non active':
      case 'nonactive':
        return { text: 'Non Active', color: styles.nonActive };
      default:
        // If status not in our 3 categories, show as Non Active (orange)
        return { text: 'Non Active', color: styles.nonActive };
    }
  };
  
  const statusInfo = getStatusInfo(actualStatus);

  // Fixed GST calculation with default 18%
  const afterDiscount = price - discount;
  const subtotal = afterDiscount + printingCharges + mountingCharges;
  const commissionAmount = subtotal * (ooterCommission / 100);
  const amountAfterCommission = subtotal + commissionAmount;
  const gstAmount = amountAfterCommission * (18 / 100); // Always 18% GST
  const finalTotal = amountAfterCommission + gstAmount;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
             <View style={styles.header}>
         <TouchableOpacity onPress={() => router.back()}>
           <Ionicons name="arrow-back" size={24} color="#fff" />
         </TouchableOpacity>
         <Text style={styles.headerTitle}>MY LISTINGS</Text>
         <View style={{ width: 24 }} />
       </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.topSection}>
            <HoardingImage
              publicId={imageUrl || ''}
              width={100}
              height={100}
              borderRadius={4}
            />
            <View style={styles.detailsSection}>
              <Text style={styles.hoardingName}>{name}</Text>
              <Text style={styles.detailText}>SKU ID : {sku}</Text>
              <Text style={styles.detailText}>City : {city}</Text>
              <Text style={styles.detailText}>District : {district}</Text>
            </View>
          </View>

          <View style={styles.bottomSection}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Booking Status</Text>
              <View style={[styles.statusBadge, statusInfo.color]}>
                <Text style={styles.statusText}>{statusInfo.text}</Text>
              </View>
              <TouchableOpacity onPress={() => router.push(`/vendor/hoarding/edit?id=${id}`)}>
                <Text style={styles.editLink}>Edit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Listing Price</Text>
              <Text style={styles.priceText}>₹{price?.toLocaleString('en-IN')}.00</Text>
              <TouchableOpacity onPress={() => router.push(`/vendor/hoarding/edit?id=${id}`)}>
                <Text style={styles.editLink}>Edit</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>OOTER App</Text>
              <TouchableOpacity style={styles.viewButton}>
                <Text style={styles.viewButtonText}>Viewing</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>PRICE</Text>
          </View>
          <View style={styles.sectionContent}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Basic Price</Text>
              <Text style={styles.priceValue}>₹{price?.toLocaleString('en-IN')}.00</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Discount</Text>
              <Text style={styles.priceValue}>-₹{discount?.toLocaleString('en-IN')}.00</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>After Discount</Text>
              <Text style={styles.priceValue}>₹{afterDiscount?.toLocaleString('en-IN')}.00</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Printing Charges</Text>
              <Text style={styles.priceValue}>₹{printingCharges?.toLocaleString('en-IN')}.00</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Mounting Charges</Text>
              <Text style={styles.priceValue}>₹{mountingCharges?.toLocaleString('en-IN')}.00</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Subtotal</Text>
              <Text style={styles.priceValue}>₹{subtotal?.toLocaleString('en-IN')}.00</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>OOTER Commission ({ooterCommission}%)</Text>
              <Text style={styles.priceValue}>₹{commissionAmount?.toLocaleString('en-IN')}.00</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Amount After Commission</Text>
              <Text style={styles.priceValue}>₹{amountAfterCommission?.toLocaleString('en-IN')}.00</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>GST (18%)</Text>
              <Text style={styles.priceValue}>₹{gstAmount?.toFixed(2)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={[styles.priceLabel, styles.bold]}>Grand Total</Text>
              <Text style={[styles.priceValue, styles.bold]}>₹{finalTotal?.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>TAX DETAILS</Text>
            <TouchableOpacity onPress={() => router.push(`/vendor/hoarding/edit?id=${id}`)}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sectionContent}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>HSN CODE</Text>
              <Text style={styles.detailValue}>{hsnCode}</Text>
            </View>
                         <View style={styles.detailItem}>
               <Text style={styles.detailLabel}>GST Rate</Text>
               <Text style={styles.detailValue}>18%</Text>
             </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>STATUS DETAILS</Text>
          </View>
          <View style={styles.sectionContent}>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Listings Status</Text>
              <Text style={styles.statusValue}>{status}</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={styles.statusLabel}>Booking Status</Text>
              <Text style={styles.statusValue}>{statusInfo.text}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>LOCATION DETAILS</Text>
          </View>
          <View style={styles.sectionContent}>
            <TouchableOpacity onPress={() => Linking.openURL(`https://maps.google.com?q=${latitude},${longitude}`)}>
              <Text style={styles.mapLink}>View in Maps</Text>
            </TouchableOpacity>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Longitude</Text>
              <Text style={styles.detailValue}>{longitude}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Latitude</Text>
              <Text style={styles.detailValue}>{latitude}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Size</Text>
              <Text style={styles.detailValue}>{size}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Country</Text>
              <Text style={styles.detailValue}>{country}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>State</Text>
              <Text style={styles.detailValue}>{state}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>City</Text>
              <Text style={styles.detailValue}>{city}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>District</Text>
              <Text style={styles.detailValue}>{district}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Landmark</Text>
              <Text style={styles.detailValue}>{landmark}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Route</Text>
              <Text style={styles.detailValue}>{route}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Pincode</Text>
              <Text style={styles.detailValue}>{pinCode || 'N/A'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>PROPERTY DETAILS</Text>
            <TouchableOpacity onPress={() => router.push(`/vendor/hoarding/edit?id=${id}`)}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sectionContent}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Site Type</Text>
              <Text style={styles.detailValue}>{siteType}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>DIMENSIONS</Text>
            <TouchableOpacity onPress={() => router.push(`/vendor/hoarding/edit?id=${id}`)}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sectionContent}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Depth</Text>
              <Text style={styles.detailValue}>{screenDepth} {sizeUnit}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Width</Text>
              <Text style={styles.detailValue}>{screenWidth} {sizeUnit}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Height</Text>
              <Text style={styles.detailValue}>{screenHeight} {sizeUnit}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Unit</Text>
              <Text style={styles.detailValue}>{sizeUnit}</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>SKU (CODE)</Text>
            <TouchableOpacity onPress={() => router.push(`/vendor/hoarding/edit?id=${id}`)}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.sectionContent}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>SKU</Text>
              <Text style={styles.detailValue}>{sku}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#000',
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  card: {
    backgroundColor: '#fff',
    margin: 8,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
  },
  topSection: {
    flexDirection: 'row',
    padding: 12,
  },
  detailsSection: {
    flex: 1,
    paddingLeft: 12,
  },
  hoardingName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000',
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  bottomSection: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 12,
  },
  infoBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 12,
    color: '##666',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  available: {
    backgroundColor: '#e6f7ee',
  },
  booked: {
    backgroundColor: '#ffebee',
  },
  nonActive: {
    backgroundColor: '#fff3e0',
  },
  default: {
    backgroundColor: '#f5f5f5',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000',
  },
  editLink: {
    color: '#1a73e8',
    fontSize: 12,
    fontWeight: '500',
  },
  viewButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  viewButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  sectionContainer: {
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#eeeeee',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#333',
  },
  sectionContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  priceLabel: {
    fontSize: 12,
    color: '#555',
    flex: 2,
  },
  priceValue: {
    fontSize: 12,
    color: '#000',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  bold: {
    fontWeight: 'bold',
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
  },
  statusValue: {
    fontSize: 12,
    color: '#000',
    fontWeight: '500',
  },
  mapLink: {
    color: '#1a73e8',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
  },
  detailValue: {
    fontSize: 12,
    color: '#000',
    fontWeight: '500',
  },
});