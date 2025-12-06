import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Linking, 
  Image as RNImage 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '@/constants/endpoints';
import { getToken } from '@/utils/storage';
import HoardingImage from '@/components/HoardingImage';

export default function BookingDetailsScreen() {
  const router = useRouter();
  const { id, open } = useLocalSearchParams();
  const [showMenu, setShowMenu] = useState(false);
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const scrollRef = useRef<ScrollView>(null);
  const downloadsRef = useRef<View>(null);

  const fetchBooking = async () => {
    const token = await getToken();
    try {
      const res = await fetch(`${BASE_URL}/vendors/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setBooking(data);
      else setError(data.message || 'Failed to fetch booking');
    } catch (err) {
      setError('Error fetching booking');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (field: string) => {
    const token = await getToken();
    try {
      const res = await fetch(`${BASE_URL}/vendors/bookings/${id}/${field.toLowerCase()}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      const data = await res.json();
      if (res.ok) {
        setBooking(data);
      } else {
        console.log('Status update failed:', data.message);
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [id]);

  useEffect(() => {
    if (open === 'design' && scrollRef.current && downloadsRef.current) {
      setTimeout(() => {
        downloadsRef.current?.measure((x, y, width, height, pageX, pageY) => {
          scrollRef.current?.scrollTo({ y: pageY - 80, animated: true });
        });
      }, 300);
    }
  }, [open, booking]);

  if (loading) {
    return <View style={styles.loader}><ActivityIndicator size="large" color="#FF3B30" /></View>;
  }

  if (error || !booking) {
    return <Text style={styles.errorText}>{error || 'Booking not found'}</Text>;
  }

  const statusItems = [
    {
      id: 1,
      text: 'Site is booked',
      date: booking.bookingDate || '-',
      completed: true,
      action: null,
      field: '',
    },
    {
      id: 2,
      text: 'Media file is downloaded to printing',
      date: booking.mediaDownloadDate || '-',
      completed: booking.mediaDownloaded,
      action: booking.mediaDownloaded ? 'Downloaded' : 'Download',
      field: 'media',
    },
    {
      id: 3,
      text: 'Printing is started',
      date: booking.printingStartDate || '-',
      completed: booking.printingStarted,
      action: booking.printingStarted ? 'Started' : 'Start',
      field: 'printing',
    },
    {
      id: 4,
      text: 'Mounting Started',
      date: booking.mountingStartDate || '-',
      completed: booking.mountingStarted,
      action: booking.mountingStarted ? 'Started' : 'Start',
      field: 'mounting',
    },
    {
      id: 5,
      text: 'Site is Live',
      date: booking.siteLiveDate || booking.bookedTill || '-',
      completed: booking.siteLive,
      action: booking.siteLive ? 'Live Done' : 'Live',
      field: 'live',
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#000" />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        ref={scrollRef}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.orderInfoContainer}>
          <Text style={styles.orderId}>ORDER ID: {booking.orderId}</Text>
          <Text style={styles.bookedTill}>Booked till: {booking.bookedTill}</Text>
        </View>

        <View style={styles.card}>
          <HoardingImage
            publicId={booking.imageUrl || ''}
            width={360}
            height={180}
            borderRadius={8}
          />
          <Text style={styles.siteName}>{booking.siteName}</Text>
          <Text style={styles.siteDetail}>Site Type: {booking.siteType}</Text>
          <Text style={styles.siteDetail}>Longitude: {booking.longitude} | Latitude: {booking.latitude}</Text>
          <Text style={styles.siteDetail}>SKU: {booking.sku}</Text>
          
          <TouchableOpacity 
            onPress={() => Linking.openURL(`https://maps.google.com/?q=${booking.latitude},${booking.longitude}`)} 
            style={styles.mapBtn}
          >
            <Text style={styles.mapBtnText}>View in Maps</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card} ref={downloadsRef} collapsable={false}>
          <View style={styles.downloadHeader}>
            <Text style={styles.sectionTitle}>Downloads</Text>
            <TouchableOpacity onPress={() => setShowMenu(!showMenu)}>
              <Ionicons name="ellipsis-vertical" size={20} color="#000" />
            </TouchableOpacity>
          </View>

          {showMenu && (
            <View style={styles.menuOptions}>
              <TouchableOpacity style={styles.menuOption}>
                <Text style={styles.menuOptionText}>unsupported file</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuOption}>
                <Text style={styles.menuOptionText}>Request to Change</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuOption}>
                <Text style={styles.menuOptionText}>Give Feedback</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuOption}>
                <Text style={styles.menuOptionText}>Help & Support</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity 
            style={styles.downloadItem} 
            onPress={() => Linking.openURL(`${BASE_URL}/bookings/${id}/files/media`)}
          >
            <Text style={styles.downloadText}>Download Media & Design File</Text>
            <Ionicons name="download-outline" size={20} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.downloadItem} 
            onPress={() => Linking.openURL(`${BASE_URL}/bookings/${id}/files/other`)}
          >
            <Text style={styles.downloadText}>Other Files</Text>
            <Ionicons name="download-outline" size={20} color="#000" />
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bookings Status</Text>
            <Text style={styles.helpText}>Help & Support</Text>
          </View>

          {statusItems.map((item, index) => (
            <View key={item.id} style={styles.statusItemContainer}>
              <View style={styles.statusLeftSection}>
                <View style={styles.statusIndicatorContainer}>
                  {item.completed ? (
                    <View style={[styles.statusIndicator, { backgroundColor: '#FF3B30' }]}>
                      <Ionicons name="checkmark" size={14} color="#fff" />
                    </View>
                  ) : (
                    <View style={[styles.statusIndicator, { borderColor: '#C7C7CC' }]} />
                  )}
                  {index < statusItems.length - 1 && (
                    <View style={[
                      styles.statusConnector,
                      item.completed ? { backgroundColor: '#FF3B30' } : { backgroundColor: '#E5E5EA' }
                    ]} />
                  )}
                </View>
                <View style={styles.statusTextContainer}>
                  <Text style={styles.statusText}>- {item.text}</Text>
                  <Text style={styles.statusDate}>{item.date}</Text>
                </View>
              </View>
              
              {item.action && (
                <TouchableOpacity 
                  style={[
                    styles.statusActionButton,
                    item.action.includes('Live') ? { backgroundColor: '#FF3B30' } : { backgroundColor: '#000' }
                  ]}
                  onPress={() => !item.completed && handleStatusUpdate(item.field)}
                >
                  <Text style={styles.statusActionText}>{item.action}</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Payments Status</Text>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Payment Date</Text>
            <Text style={styles.paymentValue}>{booking.paymentDate || '-'}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Transaction ID</Text>
            <Text style={styles.paymentValue}>{booking.transactionId || '-'}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Settlement Amount</Text>
            <Text style={styles.paymentValue}>¥{booking.settlementAmount}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>Payment Status</Text>
            <Text style={[styles.paymentValue, { color: booking.paidToVendor ? 'green' : '#FF3B30' }]}>
              {booking.paidToVendor ? 'Paid to vendor' : 'Not Paid to vendor account yet'}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Invoice</Text>
          <TouchableOpacity 
            style={styles.downloadItem}
            onPress={() => Linking.openURL(`${BASE_URL}/bookings/${id}/files/invoice`)}
          >
            <Text style={styles.downloadText}>Download invoice</Text>
            <Ionicons name="download-outline" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F2F2F7',
    flex: 1,
  },
  headerContainer: {
    paddingTop: 40,
    paddingHorizontal: 16,
    backgroundColor: '#F2F2F7',
  },
  scrollContainer: {
    padding: 16,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    marginLeft: 4,
    fontWeight: '600',
  },
  orderInfoContainer: {
    marginBottom: 16,
  },
  orderId: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bookedTill: {
    fontSize: 14,
    color: '#8E8E93',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  siteName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1C1C1E',
  },
  siteDetail: {
    fontSize: 14,
    color: '#636366',
    marginBottom: 6,
  },
  mapBtn: {
    backgroundColor: '#000',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  mapBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  downloadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  menuOptions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  menuOptionText: {
    fontSize: 14,
    color: '#1C1C1E',
  },
  downloadItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  downloadText: {
    fontSize: 14,
    color: '#1C1C1E',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    color: '#636366',
  },
  statusItemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusLeftSection: {
    flexDirection: 'row',
    flex: 1,
  },
  statusIndicatorContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 8,
  },
  statusIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  statusConnector: {
    width: 2,
    flex: 1,
    marginVertical: 2,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    color: '#1C1C1E',
    marginBottom: 4,
  },
  statusDate: {
    fontSize: 14,
    color: '#8E8E93',
  },
  statusActionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#636366',
  },
  paymentValue: {
    fontSize: 14,
    color: '#1C1C1E',
    fontWeight: '500',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 24,
    fontWeight: 'bold',
  },
});