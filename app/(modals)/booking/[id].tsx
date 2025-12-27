import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  StatusBar,
  Dimensions,
  Platform,
  Share,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import axios from 'axios';
import { BASE_URL } from '@/constants/endpoints';
import { getToken } from '@/utils/storage';
import { Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, addDays, isAfter, isBefore, isEqual } from 'date-fns';
import HoardingImage from '@/components/HoardingImage';
import UltimateCalendar from '@/components/UltimateCalendar';

const { width } = Dimensions.get('window');

const formatDate = (date: Date) =>
  date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

type Hoarding = {
  id: number;
  name: string;
  location: string;
  city: string;
  imageUrl: string;
  price: number;
  pinCode: string; // Changed from pincode to pinCode to match backend
  latitude: number;
  longitude: number;
  material: string;
  siteType: string;
  state: string;
  district: string;
  country: string;
  landmark: string;
  size: string;
  description?: string;
  discount?: number;
  printingCharges?: number;
  mountingCharges?: number;
  screenType: string;
  screenWidth: string;
  screenHeight: string;
  screenDepth: string;
  sizeUnit: string;
  sku: string;
  hshCode: string;
  gst: string;
  verifiedProperty: boolean;
  eyeCatching: boolean;
  mainHighway: boolean;
  currentlyAvailable: boolean;
  availableDate: string;
};

type BookedDateRange = {
  startDate: string;
  endDate: string;
};

export default function BookingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [hoarding, setHoarding] = useState<Hoarding | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [isSelectingStartDate, setIsSelectingStartDate] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookedDateRanges, setBookedDateRanges] = useState<BookedDateRange[]>([]);

  // Fetch hoarding details
  useEffect(() => {
    const fetchHoarding = async () => {
      const token = await getToken();
      if (!token) {
        Alert.alert('Not logged in', 'Please log in again.');
        router.replace('/login');
        return;
      }

      try {
        const res = await axios.get(`${BASE_URL}/hoardings/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Debug: Log the response data to see what fields are available
        console.log('Backend response data:', res.data);
        console.log('PinCode from backend:', res.data.pinCode);
        console.log('All available fields:', Object.keys(res.data));
        
        setHoarding(res.data);
      } catch (err: any) {
        console.error('Failed to load hoarding:', err);
        Alert.alert('Error', 'Failed to load hoarding data.');
      }
    };

    fetchHoarding();
  }, [id]);

  // Fetch booked dates with debug
  useEffect(() => {
    const fetchBookedDates = async () => {
      const token = await getToken();
      if (!token || !id) {
        console.log('Token or ID missing:', { token, id });
        return;
      }

      try {
        const res = await axios.get(`${BASE_URL}/bookings/hoarding/${id}/booked-dates`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (typeof res.data === 'string' && res.data.includes('<html>')) {
          console.log('API returned HTML, setting bookedDateRanges to empty');
          setBookedDateRanges([]);
          return;
        }

        const validRanges = Array.isArray(res.data)
          ? res.data.filter(range => range.startDate && range.endDate)
          : [];
        console.log('Fetched bookedDateRanges:', validRanges);
        setBookedDateRanges(validRanges);
      } catch (err: any) {
        console.error('Failed to load booked dates - Error:', err.response ? err.response.data : err.message);
        setBookedDateRanges([]);
      }
    };

    fetchBookedDates();
  }, [id]);

  // Check wishlist status
  useEffect(() => {
    const checkWishlist = async () => {
      if (!hoarding) return;
      const json = await AsyncStorage.getItem('ooter_wishlist');
      const saved = json ? JSON.parse(json) : [];
      setIsWishlisted(saved.includes(hoarding.id));
    };

    checkWishlist();
  }, [hoarding]);

  const toggleWishlist = async () => {
    if (!hoarding) return;
    const json = await AsyncStorage.getItem('ooter_wishlist');
    let saved = json ? JSON.parse(json) : [];

    if (saved.includes(hoarding.id)) {
      saved = saved.filter((hid: number) => hid !== hoarding.id);
      setIsWishlisted(false);
      Alert.alert('Removed from Wishlist');
    } else {
      saved.push(hoarding.id);
      setIsWishlisted(true);
      Alert.alert('Added to Wishlist');
    }

    await AsyncStorage.setItem('ooter_wishlist', JSON.stringify(saved));
  };

  const calculateMonths = () => {
    if (!startDate || !endDate) return 1;
    const diff = endDate.getTime() - startDate.getTime();
    const diffMonths = diff / (1000 * 60 * 60 * 24 * 30);
    return Math.max(1, Math.ceil(diffMonths));
  };

  const isRangeBooked = (start: Date, end: Date) => {
    return bookedDateRanges.some(range => {
      const bookedStart = new Date(range.startDate);
      const bookedEnd = new Date(range.endDate);
      return (
        (start >= bookedStart && start <= bookedEnd) ||
        (end >= bookedStart && end <= bookedEnd) ||
        (start <= bookedStart && end >= bookedEnd)
      );
    });
  };

  const validateDates = () => {
    if (!startDate || !endDate) {
      Alert.alert('Invalid Selection', 'Please select both start and end dates');
      return false;
    }

    if (isRangeBooked(startDate, endDate)) {
      Alert.alert('Invalid Range', 'Selected dates include booked period');
      return false;
    }

    if (isBefore(endDate, startDate)) {
      Alert.alert('Invalid Dates', 'End date must be on or after start date');
      return false;
    }

    return true;
  };

  const handleDateSelect = (date: Date) => {
    if (isSelectingStartDate) {
      setStartDate(date);
      setIsSelectingStartDate(false);
      setEndDate(null);
    } else {
      if (startDate && (isAfter(date, startDate) || isEqual(date, startDate))) {
        setEndDate(date);
        setShowCalendarModal(false);
      } else {
        // Removed the alert that was causing the warning
        return;
      }
    }
  };

  const openDatePicker = (selectingStart: boolean) => {
    setIsSelectingStartDate(selectingStart);
    setShowCalendarModal(true);
  };

  const handleBooking = async () => {
    const token = await getToken();
    if (!token || !hoarding) return;

    if (!validateDates()) return;

    setIsProcessing(true);

    try {
      const response = await axios.post(
        `${BASE_URL}/api/payments/create-order`,
        {
          hoardingId: hoarding.id,
          startDate: startDate?.toISOString().split('T')[0],
          endDate: endDate?.toISOString().split('T')[0],
          totalPrice: basePrice,
          printingCharges,
          mountingCharges,
          discount,
          gst,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.orderId) {
        router.push({
          pathname: '/payment/[orderId]',
          params: {
            orderId: response.data.orderId,
            amount: response.data.amount / 100,
            currency: response.data.currency,
          },
        });
      }
    } catch (error: any) {
      Alert.alert('Booking Failed', error.response?.data?.message || 'Failed to create payment order');
    } finally {
      setIsProcessing(false);
    }
  };

  const addToCart = async () => {
    const token = await getToken();
    if (!token || !hoarding) return;

    if (!validateDates()) return;

    try {
      const res = await axios.post(
        `${BASE_URL}/cart/add`,
        {
          hoardingId: hoarding.id,
          startDate: format(startDate!, 'yyyy-MM-dd'),
          endDate: format(endDate!, 'yyyy-MM-dd'),
          pricePerMonth: hoarding.price,
          discount: discount,
          printingCharges: printingCharges,
          mountingCharges: mountingCharges,
          totalMonths: totalMonths,
          finalPrice: uiTotal,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      Alert.alert('✅ Added to Cart');
    } catch (err: any) {
      if (err?.response?.data?.toString()?.includes('Already added')) {
        Alert.alert('🛒 Already in Cart', 'This site is already in your cart.');
      } else {
        Alert.alert('❌ Error', 'Failed to add to cart');
      }
    }
  };

  const handleShare = async () => {
    if (!hoarding) return;
    
    try {
      // Deep link for in-app navigation (expo-router format)
      const deepLink = `ooterfrontend://(modals)/booking/${hoarding.id}`;
      // Play Store URL as fallback
      const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.ajay.s_16.ooterfrontend';
      
      // Create share message - if app installed, deep link opens; otherwise Play Store
      const shareText = `Check out this hoarding site: ${hoarding.name} in ${hoarding.city}, ${hoarding.location}. Price: ₹${hoarding.price}/month.\n\nOpen in app: ${deepLink}\n\nDon't have OOTER? Download: ${playStoreUrl}`;
      
      const result = await Share.share({
        message: shareText,
        url: Platform.OS === 'ios' ? deepLink : undefined, // iOS can use url, Android uses message
        title: 'Hoarding Site Details',
      });
      
      if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Error', 'Failed to share hoarding details.');
    }
  };

  const totalMonths = calculateMonths();
  const basePrice = (hoarding?.price || 0) * totalMonths;
  const discount = hoarding?.discount || 0;
  const printingCharges = hoarding?.printingCharges || 0;
  const mountingCharges = hoarding?.mountingCharges || 0;

  const subtotal = basePrice + printingCharges + mountingCharges;
  const commission = subtotal * 0.15;
  const grossTotal = subtotal + commission;
  const afterDiscount = grossTotal - discount;
  const gst = afterDiscount * 0.18;
  const finalTotal = Math.round(afterDiscount + gst);

  const uiBasePrice = basePrice + commission;
  const uiSubtotal = afterDiscount;
  const uiTotal = finalTotal;

  const renderDescription = () => {
    if (!hoarding?.description) return null;

    return (
      <View style={styles.descriptionContainer}>
        <Text style={styles.sectionTitle}>Why book this site?</Text>
        {hoarding.description.split('\n').map((line, index) => (
          <View key={index} style={styles.bulletPoint}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.descriptionText}>{line.replace('•', '').trim()}</Text>
          </View>
        ))}
      </View>
    );
  };

  const renderLocationInfo = () => {
    if (!hoarding) return null;

    return (
      <View style={styles.locationGrid}>
        <View style={styles.locationRow}>
          <Text style={styles.locationLabel}>Country</Text>
          <Text style={styles.locationValue}>{hoarding.country || '-'}</Text>
        </View>
        <View style={styles.locationRow}>
          <Text style={styles.locationLabel}>City</Text>
          <Text style={styles.locationValue}>{hoarding.city || '-'}</Text>
        </View>
        <View style={styles.locationRow}>
          <Text style={styles.locationLabel}>State</Text>
          <Text style={styles.locationValue}>{hoarding.state || '-'}</Text>
        </View>
        <View style={styles.locationRow}>
          <Text style={styles.locationLabel}>District</Text>
          <Text style={styles.locationValue}>{hoarding.district || '-'}</Text>
        </View>
        <View style={styles.locationRow}>
          <Text style={styles.locationLabel}>Route of Site</Text>
          <Text style={styles.locationValue}>{hoarding.location || '-'}</Text>
        </View>
        <View style={styles.locationRow}>
          <Text style={styles.locationLabel}>Landmark</Text>
          <Text style={styles.locationValue}>{hoarding.landmark || '-'}</Text>
        </View>
        <View style={styles.locationRow}>
          <Text style={styles.locationLabel}>Size</Text>
          <Text style={styles.locationValue}>
            {hoarding.screenWidth && hoarding.screenHeight
              ? `${hoarding.screenWidth}x${hoarding.screenHeight} (${hoarding.size || '-'})`
              : hoarding.size || '-'}
          </Text>
        </View>
        <View style={styles.locationRow}>
          <Text style={styles.locationLabel}>Pincode</Text>
          <Text style={styles.locationValue}>{hoarding.pinCode || '-'}</Text>
        </View>
      </View>
    );
  };

  const renderPriceBreakdown = () => {
    if (!hoarding || !showBreakdown) return null;

    return (
      <View style={styles.priceBreakdownContainer}>
        <Text style={styles.priceBreakdownTitle}>Price Breakdown</Text>
        <View style={styles.priceBreakdownRow}>
          <Text style={styles.priceBreakdownLabel}>Base Price ({totalMonths} months)</Text>
          <Text style={styles.priceBreakdownValue}>₹{uiBasePrice.toFixed(2)}</Text>
        </View>
        {discount > 0 && (
          <View style={styles.priceBreakdownRow}>
            <Text style={styles.priceBreakdownLabel}>Discount</Text>
            <Text style={[styles.priceBreakdownValue, { color: '#E53935' }]}>
              -₹{discount.toFixed(2)}
            </Text>
          </View>
        )}
        {printingCharges > 0 && (
          <View style={styles.priceBreakdownRow}>
            <Text style={styles.priceBreakdownLabel}>Printing Charges</Text>
            <Text style={styles.priceBreakdownValue}>₹{printingCharges.toFixed(2)}</Text>
          </View>
        )}
        {mountingCharges > 0 && (
          <View style={styles.priceBreakdownRow}>
            <Text style={styles.priceBreakdownLabel}>Mounting Charges</Text>
            <Text style={styles.priceBreakdownValue}>₹{mountingCharges.toFixed(2)}</Text>
          </View>
        )}
        <View style={styles.priceBreakdownRow}>
          <Text style={styles.priceBreakdownLabel}>Subtotal</Text>
          <Text style={styles.priceBreakdownValue}>₹{uiSubtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.priceBreakdownRow}>
          <Text style={styles.priceBreakdownLabel}>GST (18%)</Text>
          <Text style={styles.priceBreakdownValue}>₹{gst.toFixed(2)}</Text>
        </View>
        <View style={[styles.priceBreakdownRow, styles.totalPriceRow]}>
          <Text style={[styles.priceBreakdownLabel, styles.totalPriceLabel]}>Total Payable</Text>
          <Text style={[styles.priceBreakdownValue, styles.totalPriceValue]}>₹{uiTotal.toFixed(2)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      
      {/* Fixed Header - Always visible */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hoarding Details</Text>
        <View style={styles.headerRightButtons}>
          <TouchableOpacity onPress={toggleWishlist} style={styles.headerButton}>
            <Ionicons
              name={isWishlisted ? 'heart' : 'heart-outline'}
              size={24}
              color={isWishlisted ? 'red' : '#000'}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} style={styles.headerButton}>
            <Ionicons name="share-social" size={24} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.container}>
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent} nestedScrollEnabled={true}>
          {hoarding && (
            <>
              {/* Image Container - Pushed down below fixed header */}
              <View style={styles.imageContainer}>
                <HoardingImage
                  publicId={hoarding.imageUrl || ''}
                  width={width}
                  height={300}
                  borderRadius={0}
                />
              </View>
              
              <View style={styles.content}>
                <Text style={styles.title}>{hoarding.name || '-'}</Text>
                <View style={styles.coordinates}>
                  <Text style={styles.coordinateText}>Latitude: {hoarding.latitude?.toFixed(6) || '-'}</Text>
                  <Text style={styles.coordinateText}>Longitude: {hoarding.longitude?.toFixed(6) || '-'}</Text>
                </View>
                <View style={styles.propertyDetails}>
                  <Text style={styles.detailText}>Material: {hoarding.material || 'Non-Lit'}</Text>
                  <Text style={styles.detailText}>Site type: {hoarding.siteType || 'Billboard'}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => Linking.openURL(`https://maps.google.com?q=${hoarding.latitude},${hoarding.longitude}`)}
                  style={styles.mapButton}
                >
                  <Text style={styles.mapButtonText}>View on map</Text>
                  <Ionicons name="map" size={16} color="#fff" style={styles.mapIcon} />
                </TouchableOpacity>
                {renderLocationInfo()}
                {renderDescription()}
                <View style={styles.dateRow}>
                  <TouchableOpacity
                    onPress={() => {
                      setEndDate(null);
                      openDatePicker(true);
                    }}
                    style={styles.dateBox}
                  >
                    <Text style={styles.dateLabel}>Start Date</Text>
                    <Text style={styles.dateValue}>{startDate ? formatDate(startDate) : 'Select date'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      if (!startDate) {
                        Alert.alert('Select Start Date', 'Please select start date first');
                        return;
                      }
                      openDatePicker(false);
                    }}
                    style={styles.dateBox}
                  >
                    <Text style={styles.dateLabel}>End Date</Text>
                    <Text style={styles.dateValue}>{endDate ? formatDate(endDate) : 'Select date'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}
        </ScrollView>
        {hoarding && (
          <View style={styles.fixedActionContainer}>
            {renderPriceBreakdown()}
            <View style={styles.fixedActionButtons}>
              <View style={styles.priceToggleContainer}>
                <Text style={styles.finalPrice}>₹{uiTotal.toFixed(2)}</Text>
                <Text style={styles.finalPriceNote}>Total for {totalMonths} month{totalMonths > 1 ? 's' : ''}</Text>
                <TouchableOpacity onPress={() => setShowBreakdown(!showBreakdown)} style={styles.priceToggleButton}>
                  <Ionicons name={showBreakdown ? 'chevron-up' : 'chevron-down'} size={20} color="#4A2DD8" />
                </TouchableOpacity>
              </View>
              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.cartButton} onPress={addToCart} disabled={isProcessing}>
                  <MaterialIcons name="add-shopping-cart" size={22} color="white" />
                  <Text style={styles.cartButtonText}>Add to Cart</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.bookButton} onPress={handleBooking} disabled={isProcessing}>
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.bookButtonText}>Book Site & Pay Now</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        <Modal visible={showCalendarModal} animationType="slide" transparent={true} onRequestClose={() => setShowCalendarModal(false)}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{isSelectingStartDate ? 'Select Start Date' : 'Select End Date'}</Text>
              <UltimateCalendar
                bookedRanges={bookedDateRanges}
                onDatesSelected={(start, end) => {
                  if (start) handleDateSelect(start);
                  if (end) handleDateSelect(end);
                }}
                initialStart={isSelectingStartDate ? null : startDate}
                initialEnd={isSelectingStartDate ? null : endDate}
                minBookingDays={1}
                maxBookingDays={365}
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  if ((isSelectingStartDate && startDate) || (!isSelectingStartDate && endDate)) {
                    setShowCalendarModal(false);
                  } else {
                    Alert.alert('Selection Required', 'Please select a date before closing');
                  }
                }}
              >
                <Text style={styles.closeButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  // Fixed Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#fff',
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerRightButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 4,
  },
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 180,
  },
  imageContainer: {
    marginTop: 0, // No margin - image starts right below header
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  coordinates: {
    marginBottom: 12,
  },
  coordinateText: {
    fontSize: 14,
    color: '#666',
  },
  propertyDetails: {
    marginBottom: 12,
  },
  detailText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 4,
  },
  mapButton: {
    backgroundColor: '#4A2DD8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mapButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginRight: 8,
  },
  mapIcon: {
    marginLeft: 4,
  },
  locationGrid: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  locationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  locationLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  locationValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  descriptionContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  bullet: {
    marginRight: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  dateBox: {
    flex: 1,
    backgroundColor: '#eee',
    borderRadius: 10,
    padding: 10,
  },
  bookedDateBox: {
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
    borderWidth: 1,
  },
  dateLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#555',
  },
  dateValue: {
    fontSize: 14,
    color: '#000',
    marginTop: 4,
  },
  fixedActionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  priceBreakdownContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  priceBreakdownTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  priceBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceBreakdownLabel: {
    fontSize: 14,
    color: '#666',
  },
  priceBreakdownValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalPriceRow: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 8,
    marginTop: 8,
  },
  totalPriceLabel: {
    fontWeight: 'bold',
  },
  totalPriceValue: {
    fontWeight: 'bold',
  },
  fixedActionButtons: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  priceToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  finalPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  finalPriceNote: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  priceToggleButton: {
    marginLeft: 'auto',
    padding: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
  },
  cartButton: {
    backgroundColor: '#4A2DD8',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  cartButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  bookButton: {
    backgroundColor: '#2DC653',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 2,
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: '#4A2DD8',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});