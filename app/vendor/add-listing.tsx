import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
  Switch,
  Platform,
  ActivityIndicator,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { getToken } from '@/utils/storage';
import { BASE_URL } from '@/constants/endpoints';

// Cloudinary upload helper
const uploadImageToCloudinary = async (uri: string): Promise<string | null> => {
  const formData = new FormData();
  formData.append('file', {
    uri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  } as any);

  formData.append('upload_preset', 'ooter_upload');
  try {
    const res = await fetch('https://api.cloudinary.com/v1_1/dj6qosspd/image/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return null;
  }
};

export default function AddListingScreen() {
  const router = useRouter();
  const { lat, lng } = useLocalSearchParams();

  // Initial state values
  const getInitialState = () => ({
    imageUri: null as string | null,
    propertyName: '',
    price: '',
    discount: '',
    printingPrice: '',
    mountingPrice: '',
    unit: '1',
    latitude: '',
    longitude: '',
    city: '',
    district: '',
    state: '',
    country: '',
    landmark: '',
    pinCode: '',
    routeOfSite: '',
    available: true,
    availableDate: new Date(),
    screenWidth: '',
    screenHeight: '',
    screenDepth: '',
    sizeUnit: 'Sq Ft',
    materialType: '',
    propertySiteType: '',
    sku: '',
    hshCode: '',
    gst: '',
    verifiedProperty: false,
    eyeCatching: false,
    mainHighway: false,
    currentlyAvailable: false,
  });

  const [formData, setFormData] = useState(getInitialState());
  const [loading, setLoading] = useState(false);
  const [imageUploadLoading, setImageUploadLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Reset form when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      resetForm();
    }, [])
  );

  useEffect(() => {
    router.setParams({ headerShown: 'false' });
  }, []);

  // Reset form to initial state
  const resetForm = () => {
    setFormData(getInitialState());
    setLoading(false);
    setImageUploadLoading(false);
  };

  // Update form data
  const updateFormData = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Update location from map picker
  useEffect(() => {
    if (typeof lat === 'string' && typeof lng === 'string') {
      updateFormData('latitude', lat);
      updateFormData('longitude', lng);
    }
  }, [lat, lng]);

  // Request permissions
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need camera roll permissions to upload images');
      }
      const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus.status !== 'granted') {
        Alert.alert('Permission required', 'We need camera permissions to take photos');
      }
    })();
  }, []);

  const generateDescription = () => {
    const points = [];
    if (formData.verifiedProperty) points.push('• Verified Property');
    if (formData.eyeCatching) points.push('• Eye catching visibility');
    if (formData.mainHighway) points.push('• Site on the Main Highway');
    if (formData.currentlyAvailable) points.push('• Currently Available');
    return points.join('\n');
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        updateFormData('imageUri', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleCameraOpen = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        updateFormData('imageUri', result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const validateForm = () => {
    const requiredFields = [
      formData.propertyName, formData.price, formData.printingPrice, formData.mountingPrice,
      formData.latitude, formData.longitude, formData.city, formData.state, formData.pinCode,
      formData.country, formData.district, formData.landmark, formData.routeOfSite,
      formData.screenWidth, formData.screenHeight, formData.sku
    ];
    
    return requiredFields.every(field => field != null && field.toString().trim() !== '');
  };

  const onSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fill all required fields.');
      return;
    }

    if (loading) return; // Prevent multiple submissions

    setLoading(true);
    const token = await getToken();

    if (!token) {
      Alert.alert("Unauthorized", "Please login again.");
      setLoading(false);
      return;
    }

    let uploadedImageUrl: string | null = null;

    if (formData.imageUri) {
      setImageUploadLoading(true);
      uploadedImageUrl = await uploadImageToCloudinary(formData.imageUri);
      setImageUploadLoading(false);
      
      if (!uploadedImageUrl) {
        Alert.alert("Upload Failed", "Image upload to Cloudinary failed.");
        setLoading(false);
        return;
      }
    }

    const payload = {
      name: formData.propertyName,
      pricePerMonth: parseFloat(formData.price) || 0,
      discount: parseFloat(formData.discount) || 0,
      printingCharges: parseInt(formData.printingPrice) || 0,
      mountingCharges: parseInt(formData.mountingPrice) || 0,
      unit: "1",
      latitude: parseFloat(formData.latitude) || 0,
      longitude: parseFloat(formData.longitude) || 0,
      city: formData.city,
      district: formData.district,
      state: formData.state,
      country: formData.country,
      landmark: formData.landmark,
      pinCode: formData.pinCode || "",
      location: formData.routeOfSite,
      description: generateDescription(),
      available: formData.available,
      availableDate: formData.availableDate,
      imageUrl: uploadedImageUrl ?? '',
      screenWidth: formData.screenWidth,
      screenHeight: formData.screenHeight,
      screenDepth: formData.screenDepth,
      sizeUnit: formData.sizeUnit,
      material: formData.materialType,
      siteType: formData.propertySiteType,
      sku: formData.sku,
      hshCode: formData.hshCode,
      gst: formData.gst,
      verifiedProperty: formData.verifiedProperty,
      eyeCatching: formData.eyeCatching,
      mainHighway: formData.mainHighway,
      currentlyAvailable: formData.currentlyAvailable
    };

    console.log("Sending payload:", JSON.stringify(payload, null, 2));

    try {
      const res = await fetch(`${BASE_URL}/hoardings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();

      if (res.ok) {
        Alert.alert("✅ Hoarding Added", "Your listing is saved successfully!", [
          {
            text: "OK",
            onPress: () => {
              resetForm();
              // Navigate back and trigger refresh
        router.back();
            }
          }
        ]);
      } else {
        console.error("Server error response:", text);
        console.error("Response status:", res.status);
        Alert.alert("❌ Failed", text || 'Something went wrong');
      }
    } catch (error) {
      console.error("Network Error:", error);
      Alert.alert("Error", "Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.pageContainer} edges={['top']}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      
      <View style={styles.fixedHeader}>
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.back()}
            disabled={loading}
          >
            <Ionicons name="arrow-back" size={24} color={loading ? "#ccc" : "#000"} />
            <Text style={[styles.backButtonText, loading && styles.disabledText]}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.saveButton, 
              (!validateForm() || loading) && styles.disabledButton
            ]} 
            onPress={onSubmit}
            disabled={!validateForm() || loading}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.loadingText}>
                  {imageUploadLoading ? 'Uploading Image...' : 'Saving...'}
                </Text>
              </View>
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.container} 
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.mainTitle}>Add Photo or Video</Text>
        <View style={styles.imagePickerContainer}>
          <TouchableOpacity 
            style={styles.imageBox} 
            onPress={handleImagePick}
            disabled={loading}
          >
            {formData.imageUri ? (
              <Image source={{ uri: formData.imageUri }} style={styles.image} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={30} color="#888" />
                <Text style={{ color: '#007bff', marginTop: 4 }}>Add Photo or Video</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.cameraButton, loading && styles.disabledButton]} 
            onPress={handleCameraOpen}
            disabled={loading}
          >
            <Ionicons name="camera" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Name*</Text>
          <TextInput
            style={[styles.input, loading && styles.disabledInput]}
            value={formData.propertyName}
            onChangeText={(value) => updateFormData('propertyName', value)}
            placeholder="Enter property name"
            editable={!loading}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.rowWrap}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Property Price (₹)*</Text>
              <TextInput
                style={[styles.input, loading && styles.disabledInput]}
                value={formData.price}
                onChangeText={(value) => updateFormData('price', value)}
                keyboardType="numeric"
                placeholder="Enter price per month"
                editable={!loading}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Printing Price (₹)*</Text>
              <TextInput
                style={[styles.input, loading && styles.disabledInput]}
                value={formData.printingPrice}
                onChangeText={(value) => updateFormData('printingPrice', value)}
                keyboardType="numeric"
                placeholder="Enter printing price"
                editable={!loading}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Discount (₹)</Text>
          <TextInput
            style={[styles.input, loading && styles.disabledInput]}
            value={formData.discount}
            onChangeText={(value) => updateFormData('discount', value)}
            keyboardType="numeric"
            placeholder="Enter discount amount"
            editable={!loading}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.rowWrap}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value="1"
                placeholder="1"
                editable={false}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Mounting Price (₹)*</Text>
              <TextInput
                style={[styles.input, loading && styles.disabledInput]}
                value={formData.mountingPrice}
                onChangeText={(value) => updateFormData('mountingPrice', value)}
                keyboardType="numeric"
                placeholder="Enter mounting price"
                editable={!loading}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location*</Text>
          <Text style={styles.sectionSub}>Details of your property Location</Text>
          
          {/* Map picker temporarily disabled */}
          {/* <TouchableOpacity
            onPress={() => router.push({ 
              pathname: '/vendor/map-picker', 
              params: { 
                lat: formData.latitude || '', 
                lng: formData.longitude || '' 
              } 
            })}
            style={[styles.mapBox, loading && styles.disabledMapBox]}
            disabled={loading}
          >
            <Image
              source={{ uri: 'https://maps.gstatic.com/tactile/basepage/pegman_sherlock.png' }}
              style={{ width: '100%', height: '100%', borderRadius: 6 }}
              resizeMode="cover"
            />
          </TouchableOpacity> */}

          <View style={styles.rowWrap}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Latitude*</Text>
              <TextInput
                style={[styles.input, loading && styles.disabledInput]}
                value={formData.latitude}
                onChangeText={(value) => updateFormData('latitude', value)}
                keyboardType="numeric"
                placeholder="Enter latitude"
                editable={!loading}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Longitude*</Text>
              <TextInput
                style={[styles.input, loading && styles.disabledInput]}
                value={formData.longitude}
                onChangeText={(value) => updateFormData('longitude', value)}
                keyboardType="numeric"
                placeholder="Enter longitude"
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.rowWrap}>
            <View style={styles.thirdInput}>
              <Text style={styles.label}>Country*</Text>
              <TextInput
                style={[styles.input, loading && styles.disabledInput]}
                value={formData.country}
                onChangeText={(value) => updateFormData('country', value)}
                placeholder="Enter country"
                editable={!loading}
              />
            </View>
            <View style={styles.thirdInput}>
              <Text style={styles.label}>City*</Text>
              <TextInput
                style={[styles.input, loading && styles.disabledInput]}
                value={formData.city}
                onChangeText={(value) => updateFormData('city', value)}
                placeholder="Enter city"
                editable={!loading}
              />
            </View>
            <View style={styles.thirdInput}>
              <Text style={styles.label}>District*</Text>
              <TextInput
                style={[styles.input, loading && styles.disabledInput]}
                value={formData.district}
                onChangeText={(value) => updateFormData('district', value)}
                placeholder="Enter district"
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.rowWrap}>
            <View style={styles.thirdInput}>
              <Text style={styles.label}>State*</Text>
              <TextInput
                style={[styles.input, loading && styles.disabledInput]}
                value={formData.state}
                onChangeText={(value) => updateFormData('state', value)}
                placeholder="Enter state"
                editable={!loading}
              />
            </View>
            <View style={styles.thirdInput}>
              <Text style={styles.label}>Pincode*</Text>
              <TextInput
                style={[styles.input, loading && styles.disabledInput]}
                value={formData.pinCode}
                onChangeText={(value) => updateFormData('pinCode', value)}
                placeholder="Enter pincode"
                keyboardType="numeric"
                editable={!loading}
              />
            </View>
            <View style={styles.thirdInput}>
              <Text style={styles.label}>Landmark*</Text>
              <TextInput
                style={[styles.input, loading && styles.disabledInput]}
                value={formData.landmark}
                onChangeText={(value) => updateFormData('landmark', value)}
                placeholder="Enter landmark"
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.rowWrap}>
            <View style={styles.fullInput}>
              <Text style={styles.label}>Route of Site*</Text>
              <TextInput
                style={[styles.input, loading && styles.disabledInput]}
                value={formData.routeOfSite}
                onChangeText={(value) => updateFormData('routeOfSite', value)}
                placeholder="Enter route"
                editable={!loading}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Screen Size*</Text>
          
          <View style={styles.rowWrap}>
            <View style={styles.thirdInput}>
              <Text style={styles.label}>Width*</Text>
              <TextInput
                style={[styles.input, loading && styles.disabledInput]}
                value={formData.screenWidth}
                onChangeText={(value) => updateFormData('screenWidth', value)}
                keyboardType="numeric"
                placeholder="Width"
                editable={!loading}
              />
            </View>
            <View style={styles.thirdInput}>
              <Text style={styles.label}>Height*</Text>
              <TextInput
                style={[styles.input, loading && styles.disabledInput]}
                value={formData.screenHeight}
                onChangeText={(value) => updateFormData('screenHeight', value)}
                keyboardType="numeric"
                placeholder="Height"
                editable={!loading}
              />
            </View>
            <View style={styles.thirdInput}>
              <Text style={styles.label}>Depth (if any)</Text>
              <TextInput
                style={[styles.input, loading && styles.disabledInput]}
                value={formData.screenDepth}
                onChangeText={(value) => updateFormData('screenDepth', value)}
                keyboardType="numeric"
                placeholder="Depth"
                editable={!loading}
              />
            </View>
          </View>
          
          <Text style={styles.subSectionTitle}>Size Unit</Text>
          <TextInput
            style={[styles.input, loading && styles.disabledInput]}
            value={formData.sizeUnit}
            onChangeText={(value) => updateFormData('sizeUnit', value)}
            placeholder="Enter size unit"
            editable={!loading}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.subSectionTitle}>Material Type</Text>
          <TextInput
            style={[styles.input, loading && styles.disabledInput]}
            value={formData.materialType}
            onChangeText={(value) => updateFormData('materialType', value)}
            placeholder="Enter material type"
            editable={!loading}
          />
          <Text style={styles.subSectionTitle}>Property site type</Text>
          <TextInput
            style={[styles.input, loading && styles.disabledInput]}
            value={formData.propertySiteType}
            onChangeText={(value) => updateFormData('propertySiteType', value)}
            placeholder="Enter property site type"
            editable={!loading}
          />
          
          <Text style={styles.subSectionTitle}>SKU (code)*</Text>
          <TextInput
            style={[styles.input, loading && styles.disabledInput]}
            value={formData.sku}
            onChangeText={(value) => updateFormData('sku', value)}
            placeholder="Enter SKU code"
            editable={!loading}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why book this site?</Text>
          <Text style={styles.sectionSub}>select best option to choose this site</Text>
          
          <View style={styles.checkboxRow}>
            <TouchableOpacity 
              style={[styles.checkbox, formData.verifiedProperty && styles.checkedBox]} 
              onPress={() => !loading && updateFormData('verifiedProperty', !formData.verifiedProperty)}
              disabled={loading}
            >
              {formData.verifiedProperty && <Ionicons name="checkmark" size={16} color="white" />}
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>Verified Property</Text>
          </View>
          
          <View style={styles.checkboxRow}>
            <TouchableOpacity 
              style={[styles.checkbox, formData.eyeCatching && styles.checkedBox]} 
              onPress={() => !loading && updateFormData('eyeCatching', !formData.eyeCatching)}
              disabled={loading}
            >
              {formData.eyeCatching && <Ionicons name="checkmark" size={16} color="white" />}
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>Eye catching visibility</Text>
          </View>
          
          <View style={styles.checkboxRow}>
            <TouchableOpacity 
              style={[styles.checkbox, formData.mainHighway && styles.checkedBox]} 
              onPress={() => !loading && updateFormData('mainHighway', !formData.mainHighway)}
              disabled={loading}
            >
              {formData.mainHighway && <Ionicons name="checkmark" size={16} color="white" />}
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>Site on the Main Highway</Text>
          </View>
          
          <View style={styles.checkboxRow}>
            <TouchableOpacity 
              style={[styles.checkbox, formData.currentlyAvailable && styles.checkedBox]} 
              onPress={() => !loading && updateFormData('currentlyAvailable', !formData.currentlyAvailable)}
              disabled={loading}
            >
              {formData.currentlyAvailable && <Ionicons name="checkmark" size={16} color="white" />}
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>Currently Available</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Site Details</Text>
          <Text style={styles.sectionSub}>site is available or not for advertisement.</Text>
          
          <View style={styles.switchRow}>
            <Text style={styles.label}>Site Available?</Text>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>No</Text>
              <Switch 
                value={formData.available} 
                onValueChange={(value) => updateFormData('available', value)}
                thumbColor={formData.available ? '#007bff' : '#f4f3f4'}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                disabled={loading}
              />
              <Text style={styles.switchLabel}>Yes</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            onPress={() => !loading && setShowDatePicker(true)} 
            style={[styles.dateButton, loading && styles.disabledDateButton]}
            disabled={loading}
          >
            <Text style={[styles.dateButtonText, loading && styles.disabledText]}>
              Select Availability Date: {formData.availableDate.toDateString()}
            </Text>
          </TouchableOpacity>
          
          {showDatePicker && (
            <DateTimePicker
              value={formData.availableDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                const currentDate = selectedDate || formData.availableDate;
                setShowDatePicker(false);
                updateFormData('availableDate', currentDate);
              }}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tax Details</Text>
          
          <Text style={styles.subSectionTitle}>HSN Code</Text>
          <TextInput
            style={[styles.input, loading && styles.disabledInput]}
            value={formData.hshCode}
            onChangeText={(value) => updateFormData('hshCode', value)}
            placeholder="Enter HSN code"
            editable={!loading}
          />
          
          <Text style={styles.subSectionTitle}>GST (%)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: '#f2f2f2', color: '#999' }]}
            value="18"
            editable={false}
          />
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pageContainer: { 
    flex: 1, 
    backgroundColor: '#fff',
  },
  fixedHeader: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    zIndex: 1000,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f1f3f5',
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  disabledText: {
    color: '#ccc',
  },
  container: { 
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 8,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  imagePickerContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  imageBox: {
    height: 160,
    backgroundColor: '#e6f0ff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: { 
    width: '100%', 
    height: '100%', 
    borderRadius: 8 
  },
  imagePlaceholder: { 
    alignItems: 'center' 
  },
  cameraButton: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: '#007bff',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  sectionSub: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  halfInput: { 
    flex: 1,
    minWidth: '48%' 
  },
  thirdInput: {
    flex: 1,
    minWidth: '30%'
  },
  fullInput: {
    flex: 1,
    minWidth: '100%'
  },
  label: { 
    fontSize: 12, 
    marginBottom: 4, 
    color: '#333' 
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#999',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 14,
    marginHorizontal: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  checkboxLabel: {
    fontSize: 14,
  },
  dateButton: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  disabledDateButton: {
    backgroundColor: '#f0f0f0',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#333',
  },
  mapBox: {
    height: 120,
    backgroundColor: '#ddd',
    borderRadius: 6,
    marginBottom: 12,
    overflow: 'hidden',
  },
  disabledMapBox: {
    opacity: 0.6,
  },
  spacer: {
    height: 40,
  },
});