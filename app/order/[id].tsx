import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Linking, Alert, Image as RNImage } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { getToken } from '@/utils/storage';
import { BASE_URL } from '@/constants/endpoints';
import * as DocumentPicker from 'expo-document-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import HoardingImage from '@/components/HoardingImage';

export default function OrderDetailsScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<any>(null);
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = await getToken();

        const res = await fetch(`${BASE_URL}/bookings/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('Failed to fetch booking details');

        const json = await res.json();
        setBooking(json);
      } catch (err) {
        console.error('Booking fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchData();
  }, [id]);

  const handleCancelBooking = async () => {
    try {
      Alert.alert(
        'Confirm Cancellation',
        'Are you sure you want to cancel this booking?',
        [
          {
            text: 'No',
            style: 'cancel',
          },
          {
            text: 'Yes, Cancel',
            onPress: async () => {
              const token = await getToken();
              const res = await fetch(`${BASE_URL}/bookings/${id}/cancel`, {
                method: 'PUT',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (res.ok) {
                Alert.alert('Cancelled', 'Your booking has been cancelled successfully.');
                router.replace('/vendor/booking');
              } else {
                const data = await res.json();
                Alert.alert('Cancellation Failed', data.message || 'You cannot cancel this booking.');
              }
            },
            style: 'destructive',
          },
        ]
      );
    } catch (error) {
      console.error('Cancel booking error:', error);
      Alert.alert('Error', 'Something went wrong while cancelling.');
    }
  };

  const handleAddFile = async () => {
    if (selectedFiles.length >= 3) {
      Alert.alert('Limit Reached', 'You can upload a maximum of 3 files (Images, PDFs, CDRs)');
      return;
    }

    try {
      console.log('Opening document picker...');
      const permissionResult = await DocumentPicker.getDocumentAsync({
        type: ['image/jpeg', 'image/png', 'application/pdf', 'application/cdr', 'application/coreldraw'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      console.log('Document picker result:', JSON.stringify(permissionResult, null, 2));

      if (!permissionResult.canceled && permissionResult.assets && permissionResult.assets.length > 0) {
        const { name, uri, mimeType, size } = permissionResult.assets[0];
        console.log('Selected file:', { name, uri, mimeType, size });

        const allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf', 'cdr'];
        const fileExtension = name.split('.').pop()?.toLowerCase();

        if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
          Alert.alert('Invalid File Type', 'Only JPG, PNG, PDF, and CDR files are allowed.');
          return;
        }

        if (size && size > 10 * 1024 * 1024) {
          Alert.alert('File Too Large', 'File size exceeds 10MB limit.');
          return;
        }

        setSelectedFiles(prev => [...prev, { uri, name, mimeType: mimeType || `application/${fileExtension}` }]);
      } else {
        console.log('No file selected or picker cancelled:', permissionResult);
        Alert.alert('No File Selected', 'Please select a file to upload.');
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert('Error', 'Failed to pick a file. Please try again.');
    }
  };

  const handleDeleteFile = (index: number) => {
    Alert.alert(
      'Delete File',
      'Are you sure you want to delete this file?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          onPress: () => {
            setSelectedFiles(prev => prev.filter((_, i) => i !== index));
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleSaveFiles = async () => {
    try {
      const token = await getToken();
      const formData = new FormData();

      selectedFiles.forEach((file, index) => {
        formData.append('files', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType,
        } as any);
      });

      Alert.alert('Uploading', 'Please wait while we upload your files...');

      const res = await fetch(`${BASE_URL}/bookings/${id}/files/save`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (res.ok) {
        Alert.alert('Success', 'Files sent to vendor successfully!');
        setSelectedFiles([]);
      } else {
        throw new Error('Failed to save files');
      }
    } catch (err) {
      console.error('Save files error:', err);
      Alert.alert('Error', 'Failed to save files');
    }
  };

  const isWithinCancellationWindow = () => {
    if (!booking?.createdAt) return false;

    const bookingDate = new Date(booking.createdAt);
    const now = new Date();
    const diffHours = (now.getTime() - bookingDate.getTime()) / (1000 * 60 * 60);

    return diffHours <= 24;
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#FF3B30" />
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={styles.loader}>
        <Text style={{ textAlign: 'center' }}>No booking found.</Text>
      </View>
    );
  }

  const statusItems = [
    {
      id: 1,
      text: 'Site is booked',
      date: booking.bookingDate || '-',
      completed: true,
    },
    {
      id: 2,
      text: 'Media file is downloaded for printing',
      date: booking.mediaDownloadDate || '-',
      completed: booking.mediaDownloaded,
    },
    {
      id: 3,
      text: 'Printing started',
      date: booking.printingStartDate || '-',
      completed: booking.printingStarted,
    },
    {
      id: 4,
      text: 'Mounting Started',
      date: booking.mountingStartDate || '-',
      completed: booking.mountingStarted,
    },
    {
      id: 5,
      text: 'Site is Live',
      date: booking.siteLiveDate || '-',
      completed: booking.siteLive,
    },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#000" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        {/* Order ID and Site Booked at the top */}
        <View style={styles.topInfoContainer}>
          <View style={styles.topInfoRow}>
            <Text style={styles.topInfoLabel}>ORDER ID</Text>
            <Text style={styles.topInfoValue}>{booking.orderId}</Text>
          </View>
          <View style={styles.topInfoRow}>
            <Text style={styles.topInfoLabel}>Site Booked</Text>
            <Text style={styles.topInfoValue}>{booking.bookedFrom} to {booking.bookedTill}</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Hoarding Card */}
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
              style={styles.mapBtn}
              onPress={() => {
                Linking.openURL(`https://maps.google.com?q=${booking.latitude},${booking.longitude}`);
              }}
            >
              <Text style={styles.mapBtnText}>View in Maps</Text>
            </TouchableOpacity>
          </View>

          {/* Downloads Section */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Downloads</Text>
            {/* Upload Button */}
            {selectedFiles.length < 3 && (
              <TouchableOpacity style={styles.uploadBox} onPress={handleAddFile}>
                <Text style={styles.uploadText}>Click here to upload your files (Max 3: Images, PDFs, CDRs)</Text>
              </TouchableOpacity>
            )}
            {/* Uploaded Files Preview */}
            {selectedFiles.length > 0 && (
              <View style={{ marginTop: 12 }}>
                {selectedFiles.map((file, index) => (
                  <View key={index} style={styles.uploadedFileContainer}>
                    {file.mimeType.startsWith('image/') ? (
                      <RNImage source={{ uri: file.uri }} style={styles.uploadedImagePreview} />
                    ) : (
                      <View style={styles.filePreview}>
                        <Text style={styles.filePreviewText}>{file.name}</Text>
                      </View>
                    )}
                    <TouchableOpacity onPress={() => handleDeleteFile(index)}>
                      <Ionicons name="trash" size={22} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            {/* Save Button */}
            {selectedFiles.length > 0 && (
              <TouchableOpacity style={styles.saveBtn} onPress={handleSaveFiles}>
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Status Timeline */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Booking Status</Text>
            {statusItems.map((item, index) => (
              <View key={item.id} style={styles.statusItemContainer}>
                <View style={styles.statusLeftSection}>
                  <View style={styles.statusIndicatorContainer}>
                    {item.completed ? (
                      <View style={[styles.statusIndicator, { backgroundColor: '#4CAF50' }]}>
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      </View>
                    ) : (
                      <View style={[styles.statusIndicator, { borderColor: '#C7C7CC' }]} />
                    )}
                    {index < statusItems.length - 1 && (
                      <View
                        style={[
                          styles.statusConnector,
                          item.completed ? { backgroundColor: '#4CAF50' } : { backgroundColor: '#E5E5EA' },
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.statusTextContainer}>
                    <Text style={styles.statusText}>{item.text}</Text>
                    <Text style={styles.statusDate}>{item.date}</Text>
                  </View>
                </View>
                {item.completed && (
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                )}
              </View>
            ))}
          </View>

          {/* Download Execution Proof Kit Button */}
          <TouchableOpacity style={styles.executionProofButton}>
            <Text style={styles.executionProofButtonText}>Download execution proof kit</Text>
            <Ionicons name="download-outline" size={20} color="#007AFF" />
          </TouchableOpacity>

          {/* Payment Status */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Payment Status</Text>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Payment Status</Text>
              <Text style={[styles.paymentValue, { color: '#4CAF50' }]}>Paid</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Transaction ID</Text>
              <Text style={styles.paymentValue}>{booking.transactionId || '-'}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Payment date</Text>
              <Text style={styles.paymentValue}>{booking.paymentDate || '-'}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Amount Paid</Text>
              <Text style={styles.paymentValue}>₹{booking.amountPaid}</Text>
            </View>
          </View>

          {/* Invoice Section */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Invoice</Text>
            <TouchableOpacity style={styles.downloadButton}>
              <Text style={styles.downloadButtonText}>Download Tax Invoice</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.downloadButton}>
              <Text style={styles.downloadButtonText}>Download Order ID</Text>
            </TouchableOpacity>
          </View>

          {/* Cancellation Section */}
          <View style={styles.section}>
            <Text style={styles.cancelNotice}>Cancellation only available within 24 hours after booking</Text>
            <TouchableOpacity
              style={[styles.cancelButton, !isWithinCancellationWindow() && { backgroundColor: '#ccc' }]}
              onPress={isWithinCancellationWindow() ? handleCancelBooking : undefined}
              disabled={!isWithinCancellationWindow()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#F2F2F7',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    fontSize: 18,
    marginLeft: 8,
  },
  topInfoContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  topInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  topInfoLabel: {
    fontSize: 14,
    color: '#666',
  },
  topInfoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    padding: 16,
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
  executionProofButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  executionProofButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  siteName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  siteDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  uploadBox: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 4,
    padding: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  uploadText: {
    color: '#007AFF',
    fontSize: 14,
  },
  uploadedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderRadius: 6,
  },
  uploadedImagePreview: {
    width: 80,
    height: 80,
    borderRadius: 6,
  },
  filePreview: {
    width: 80,
    height: 80,
    borderRadius: 6,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filePreviewText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
  },
  saveBtn: {
    marginTop: 10,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
    fontSize: 16,
    marginBottom: 4,
  },
  statusDate: {
    fontSize: 14,
    color: '#666',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#666',
  },
  paymentValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  downloadButton: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginBottom: 8,
  },
  downloadButtonText: {
    color: '#007AFF',
    fontSize: 14,
  },
  cancelNotice: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginVertical: 16,
  },
  cancelButton: {
    backgroundColor: '#ff3b30',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
});
