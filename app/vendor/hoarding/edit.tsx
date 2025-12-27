import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Switch,
  Platform,
  ActivityIndicator,
  StatusBar,
  Dimensions
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { getToken } from '@/utils/storage';
import { BASE_URL } from '@/constants/endpoints';
import HoardingImage from '@/components/HoardingImage';
import { Image as RNImage } from 'react-native';

const STATUS_OPTIONS = ['AVAILABLE', 'BOOKED'];
const SCREEN_TYPE_OPTIONS = ['Offline', 'Online'];

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
    return data.public_id;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return null;
  }
};

export default function EditHoardingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<any>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showScreenTypeDropdown, setShowScreenTypeDropdown] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);
  const [newImageUri, setNewImageUri] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (form) {
      const requiredFields = [
        form.propertyName,
        form.price,
        form.printingCharges,
        form.mountingCharges,
        form.latitude,
        form.longitude,
        form.city,
        form.state,
        form.pinCode,
        form.country,
        form.district,
        form.landmark,
        form.routeOfSite,
        form.screenWidth,
        form.screenHeight,
        form.sku
      ];
      setIsFormValid(requiredFields.every(field => !!field?.toString().trim()));
    }
  }, [form]);

  const fetchData = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${BASE_URL}/hoardings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      
      // Debug logging for pincode
      console.log('Fetched hoarding data:', json);
      console.log('Pincode from backend:', json.pinCode);
      
      const uiStatus = json.status === 'ACTIVE' ? 'AVAILABLE' : json.status;
      
      setForm({
        ...json,
        propertyName: json.name,
        price: json.price?.toString() || '0',
        routeOfSite: json.location,
        pinCode: json.pinCode || '',
        discount: json.discount?.toString() || '0',
        printingCharges: json.printingCharges?.toString() || '0',
        mountingCharges: json.mountingCharges?.toString() || '0',
        gst: json.gst?.toString() || '0',
        availableDate: json.availableDate ? new Date(json.availableDate) : new Date(),
        available: json.status !== 'NON_ACTIVE',
        currentlyAvailable: json.currentlyAvailable || false,
        verifiedProperty: json.verifiedProperty || false,
        eyeCatching: json.eyeCatching || false,
        mainHighway: json.mainHighway || false,
        status: uiStatus,
      });
      
      // Debug logging for form state
      console.log('Form state after setting:', {
        pinCode: json.pinCode || '',
        city: json.city,
        state: json.state,
        country: json.country
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to load hoarding details');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string | boolean) => {
    setForm((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleToggle = (key: string) => {
    setForm((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleImagePick = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need camera roll permissions to upload images');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setNewImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleCameraOpen = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'We need camera permissions to take photos');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setNewImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setForm((prev: any) => ({
        ...prev,
        availableDate: selectedDate,
      }));
    }
  };

  const generateDescription = () => {
    const points = [];
    if (form?.eyeCatching) points.push('• Eye catching visibility');
    if (form?.mainHighway) points.push('• Site on the Main Highway');
    if (form?.currentlyAvailable) points.push('• Currently Available');
    return points.join('\n');
  };

  const handleSubmit = async () => {
    if (!isFormValid) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      setSaving(true);
      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'Please login again');
        setSaving(false);
        return;
      }

      let imagePublicId = form.imageUrl;
      if (newImageUri) {
        imagePublicId = await uploadImageToCloudinary(newImageUri);
        if (!imagePublicId) {
          Alert.alert('Error', 'Image upload to Cloudinary failed');
          setSaving(false);
          return;
        }
      }

      const backendStatus = !form.available 
        ? 'NON_ACTIVE' 
        : form.status === 'BOOKED' 
          ? 'BOOKED' 
          : 'ACTIVE';

      // Debug logging for pincode
      console.log('Submitting edit form with pincode:', form.pinCode);
      console.log('Edit form data:', {
        propertyName: form.propertyName,
        price: form.price,
        pinCode: form.pinCode,
        city: form.city,
        state: form.state,
        country: form.country,
        district: form.district,
        landmark: form.landmark
      });

      const payload = {
        ...form,
        name: form.propertyName,
        price: parseFloat(form.price),
        pricePerMonth: parseFloat(form.price),
        location: form.routeOfSite,
        pinCode: form.pinCode,
        discount: parseFloat(form.discount),
        printingCharges: parseFloat(form.printingCharges),
        mountingCharges: parseFloat(form.mountingCharges),
        gst: parseFloat(form.gst),
        unit: "1",
        status: backendStatus,
        isBooked: backendStatus === 'BOOKED',
        description: generateDescription(),
        availableDate: form.availableDate.toISOString(),
        imageUrl: imagePublicId || '',
      };

      const res = await fetch(`${BASE_URL}/hoardings/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Update failed');
      }

      Alert.alert('Success', 'Hoarding updated successfully', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      console.error('Update error:', err);
      Alert.alert('Error', 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.pageContainer}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      
      {/* Fixed Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#000" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.saveButton, 
              !isFormValid && styles.disabledButton
            ]} 
            onPress={handleSubmit}
            disabled={!isFormValid || saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.container} 
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
      >
        <Text style={styles.mainTitle}>Edit Photo or Video</Text>
        <View style={styles.imagePickerContainer}>
          <TouchableOpacity style={styles.imageBox} onPress={handleImagePick}>
            {newImageUri ? (
              <RNImage
                source={{ uri: newImageUri }}
                style={{ width: '100%', height: 160, borderRadius: 8 }}
                resizeMode="cover"
              />
            ) : form.imageUrl ? (
              <HoardingImage
                publicId={form.imageUrl || ''}
                width={Dimensions.get('window').width - 32}
                height={160}
                borderRadius={8}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={30} color="#888" />
                <Text style={{ color: '#007bff', marginTop: 4 }}>Edit Photo or Video</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.cameraButton} 
            onPress={handleCameraOpen}
          >
            <Ionicons name="camera" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Name*</Text>
          <TextInput
            style={styles.input}
            value={form.propertyName}
            onChangeText={(value) => handleChange('propertyName', value)}
            placeholder="Enter property name"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.rowWrap}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Property Price (₹)*</Text>
              <TextInput
                style={styles.input}
                value={form.price}
                onChangeText={(value) => handleChange('price', value)}
                keyboardType="numeric"
                placeholder="Enter price per month"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Printing Price (₹)*</Text>
              <TextInput
                style={styles.input}
                value={form.printingCharges}
                onChangeText={(value) => handleChange('printingCharges', value)}
                keyboardType="numeric"
                placeholder="Enter printing price"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.rowWrap}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Discount (%)</Text>
              <TextInput
                style={styles.input}
                value={form.discount}
                onChangeText={(value) => handleChange('discount', value)}
                keyboardType="numeric"
                placeholder="Enter discount"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Mounting Price (₹)*</Text>
              <TextInput
                style={styles.input}
                value={form.mountingCharges}
                onChangeText={(value) => handleChange('mountingCharges', value)}
                keyboardType="numeric"
                placeholder="Enter mounting price"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.rowWrap}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Quantity</Text>
              <TextInput
                style={[styles.input, { backgroundColor: '#f5f5f5', color: '#666' }]}
                value="1"
                placeholder="1"
                editable={false}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>GST (%)</Text>
              <TextInput
                style={styles.input}
                value={form.gst}
                onChangeText={(value) => handleChange('gst', value)}
                keyboardType="numeric"
                placeholder="Enter GST"
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
                returnTo: '/vendor/edit-listing',
                lat: form.latitude,
                lng: form.longitude,
                id: id // Pass the hoarding ID
              } 
            })}
            style={styles.mapBox}
          >
            <RNImage
              source={{ uri: 'https://maps.gstatic.com/tactile/basepage/pegman_sherlock.png' }}
              style={{ width: '100%', height: '100%', borderRadius: 6 }}
              resizeMode="cover"
            />
          </TouchableOpacity> */}

          <View style={styles.rowWrap}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Latitude*</Text>
              <TextInput
                style={styles.input}
                value={form.latitude?.toString()}
                onChangeText={(value) => handleChange('latitude', value)}
                keyboardType="numeric"
                placeholder="Enter latitude"
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Longitude*</Text>
              <TextInput
                style={styles.input}
                value={form.longitude?.toString()}
                onChangeText={(value) => handleChange('longitude', value)}
                keyboardType="numeric"
                placeholder="Enter longitude"
              />
            </View>
          </View>

          <View style={styles.rowWrap}>
            <View style={styles.thirdInput}>
              <Text style={styles.label}>Country*</Text>
              <TextInput
                style={styles.input}
                value={form.country}
                onChangeText={(value) => handleChange('country', value)}
                placeholder="Enter country"
              />
            </View>
            <View style={styles.thirdInput}>
              <Text style={styles.label}>City*</Text>
              <TextInput
                style={styles.input}
                value={form.city}
                onChangeText={(value) => handleChange('city', value)}
                placeholder="Enter city"
              />
            </View>
            <View style={styles.thirdInput}>
              <Text style={styles.label}>District*</Text>
              <TextInput
                style={styles.input}
                value={form.district}
                onChangeText={(value) => handleChange('district', value)}
                placeholder="Enter district"
              />
            </View>
          </View>

          <View style={styles.rowWrap}>
            <View style={styles.thirdInput}>
              <Text style={styles.label}>State*</Text>
              <TextInput
                style={styles.input}
                value={form.state}
                onChangeText={(value) => handleChange('state', value)}
                placeholder="Enter state"
              />
            </View>
            <View style={styles.thirdInput}>
              <Text style={styles.label}>Landmark*</Text>
              <TextInput
                style={styles.input}
                value={form.landmark}
                onChangeText={(value) => handleChange('landmark', value)}
                placeholder="Enter landmark"
              />
            </View>
            <View style={styles.thirdInput}>
              <Text style={styles.label}>Pincode*</Text>
              <TextInput
                style={styles.input}
                value={form.pinCode}
                onChangeText={(value) => handleChange('pinCode', value)}
                placeholder="Enter pincode"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.rowWrap}>
            <View style={styles.fullInput}>
              <Text style={styles.label}>Route of Site*</Text>
              <TextInput
                style={styles.input}
                value={form.routeOfSite}
                onChangeText={(value) => handleChange('routeOfSite', value)}
                placeholder="Enter route"
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
                style={styles.input}
                value={form.screenWidth}
                onChangeText={(value) => handleChange('screenWidth', value)}
                keyboardType="numeric"
                placeholder="Width"
              />
            </View>
            <View style={styles.thirdInput}>
              <Text style={styles.label}>Height*</Text>
              <TextInput
                style={styles.input}
                value={form.screenHeight}
                onChangeText={(value) => handleChange('screenHeight', value)}
                keyboardType="numeric"
                placeholder="Height"
              />
            </View>
            <View style={styles.thirdInput}>
              <Text style={styles.label}>Depth (if any)</Text>
              <TextInput
                style={styles.input}
                value={form.screenDepth}
                onChangeText={(value) => handleChange('screenDepth', value)}
                keyboardType="numeric"
                placeholder="Depth"
              />
            </View>
          </View>
          
          <Text style={styles.subSectionTitle}>Size Unit</Text>
          <TextInput
            style={styles.input}
            value={form.sizeUnit}
            onChangeText={(value) => handleChange('sizeUnit', value)}
            placeholder="Enter size unit"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.subSectionTitle}>Material Type</Text>
          <TextInput
            style={styles.input}
            value={form.material}
            onChangeText={(value) => handleChange('material', value)}
            placeholder="Enter material type"
          />
          <Text style={styles.subSectionTitle}>Property site type</Text>
          <TextInput
            style={styles.input}
            value={form.siteType}
            onChangeText={(value) => handleChange('siteType', value)}
            placeholder="Enter property site type"
          />
          
          <Text style={styles.subSectionTitle}>SKU (code)*</Text>
          <TextInput
            style={styles.input}
            value={form.sku}
            onChangeText={(value) => handleChange('sku', value)}
            placeholder="Enter SKU code"
          />
          <Text style={styles.subSectionTitle}>HSN Code</Text>
          <TextInput
            style={styles.input}
            value={form.hshCode}
            onChangeText={(value) => handleChange('hshCode', value)}
            placeholder="Enter HSN code"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why book this site?</Text>
          <Text style={styles.sectionSub}>select best option to choose this site and why this site is more beneficial to marketer</Text>
          
          <View style={styles.checkboxRow}>
            <TouchableOpacity 
              style={[styles.checkbox, form.eyeCatching && styles.checkedBox]} 
              onPress={() => handleToggle('eyeCatching')}
            >
              {form.eyeCatching && <Ionicons name="checkmark" size={16} color="white" />}
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>Eye catching visibility</Text>
          </View>
          
          <View style={styles.checkboxRow}>
            <TouchableOpacity 
              style={[styles.checkbox, form.mainHighway && styles.checkedBox]} 
              onPress={() => handleToggle('mainHighway')}
            >
              {form.mainHighway && <Ionicons name="checkmark" size={16} color="white" />}
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>Site on the Main Highway</Text>
          </View>
          
          <View style={styles.checkboxRow}>
            <TouchableOpacity 
              style={[styles.checkbox, form.currentlyAvailable && styles.checkedBox]} 
              onPress={() => handleToggle('currentlyAvailable')}
            >
              {form.currentlyAvailable && <Ionicons name="checkmark" size={16} color="white" />}
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
                value={form.available} 
                onValueChange={(value) => handleChange('available', value)}
                thumbColor={form.available ? '#007bff' : '#f4f3f4'}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
              />
              <Text style={styles.switchLabel}>Yes</Text>
            </View>
          </View>
          
          <Text style={{ fontSize: 12, color: '#666', marginTop: -8, marginBottom: 12 }}>
            {form.available ? 
              "Hoarding is active and visible to advertisers" : 
              "Turning this off will mark the hoarding as Non Active and remove it from listings"}
          </Text>
          
          {form.status === 'BOOKED' && (
            <>
              <TouchableOpacity 
                onPress={() => setShowDatePicker(true)} 
                style={styles.dateButton}
              >
                <Text style={styles.dateButtonText}>
                  Available From: {form.availableDate.toDateString()}
                </Text>
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={form.availableDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                />
              )}
            </>
          )}

          {form.available && (
            <>
              <Text style={styles.subSectionTitle}>Status</Text>
              {STATUS_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.statusButton,
                    form.status === option && styles.selectedStatus,
                  ]}
                  onPress={() => handleChange('status', option)}
                >
                  <Text
                    style={{
                      color: form.status === option ? '#fff' : '#333',
                      fontWeight: 'bold',
                    }}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pageContainer: { 
    flex: 1, 
    backgroundColor: '#fff',
  },
  headerContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
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
  scrollView: {
    marginTop: 0,
  },
  container: { 
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 10,
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
    width: '100%',
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
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 14,
    backgroundColor: '#fff',
    marginBottom: 8,
    textAlignVertical: 'center',
    minHeight: 40,
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
    marginBottom: 12,
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
  statusButton: {
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#aaa',
    marginBottom: 6,
    alignItems: 'center',
  },
  selectedStatus: {
    backgroundColor: '#000',
    borderColor: '#000',
  },
});