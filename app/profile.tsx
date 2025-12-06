import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BASE_URL } from '@/constants/endpoints';
import { getToken } from '@/utils/storage';
import Constants from 'expo-constants';

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [role, setRole] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = await getToken();
      if (!token) return;

      try {
        const res = await axios.get(`${BASE_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const { name, email, phone, dateOfBirth, gender, role, companyName, gstin, pan } = res.data;
        const [first, ...rest] = name.split(' ');
        setFirstName(first);
        setLastName(rest.join(' '));
        setEmail(email || '');
        setNewEmail(email || '');
        setPhone(phone);
        if (dateOfBirth) setDateOfBirth(new Date(dateOfBirth));
        if (gender) setGender(gender);
        setRole(role);
        if (role === 'VENDOR') {
          setCompanyName(companyName || '');
          setGstin(gstin || '');
          setPan(pan || '');
        }
      } catch (err) {
        Alert.alert('Error', 'Failed to load profile.');
      }
    };

    fetchProfile();
  }, []);

  const sendOtp = async () => {
    const token = await getToken();
    if (!token || !newEmail) return;

    try {
      await axios.post(
        `${BASE_URL}/users/send-email-otp`,
        { email: newEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('OTP Sent', 'Check console for now.');
      setShowOtpModal(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to send OTP');
    }
  };

  const verifyOtp = async () => {
    const token = await getToken();
    if (!token || !otp) return;

    try {
      await axios.post(
        `${BASE_URL}/users/verify-email-otp`,
        { otp },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Alert.alert('✅ Verified!', 'Email has been verified.');
      setEmail(newEmail);
      setShowOtpModal(false);
    } catch (err) {
      Alert.alert('Invalid OTP', 'Please try again.');
    }
  };

  const saveProfile = async () => {
    const token = await getToken();
    if (!token) return;

    try {
      await axios.put(
        `${BASE_URL}/users/update-profile`,
        {
          firstName,
          lastName,
          gender,
          dateOfBirth: dateOfBirth?.toISOString().split('T')[0],
          email: newEmail || email,
          ...(role === 'VENDOR' && {
            companyName,
            gstin,
            pan,
          }),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      Alert.alert('✅ Success', 'Profile updated');
    } catch (err: any) {
      Alert.alert('❌ Failed', err?.response?.data || 'Error saving profile');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      {/* StatusBar with reduced spacing */}
      <View style={styles.statusBar}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      </View>

      <ScrollView 
        style={styles.container} 
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Header Row moved up closer to status bar */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconTap}>
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Profile</Text>
          <TouchableOpacity onPress={saveProfile} style={styles.iconTap}>
            <Text style={styles.saveText}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Rest of your form fields remain exactly the same */}
        <Text style={styles.fieldLabel}>First Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter first name"
          placeholderTextColor="#888"
          value={firstName}
          onChangeText={setFirstName}
        />
        
        <Text style={styles.fieldLabel}>Last Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter last name"
          placeholderTextColor="#888"
          value={lastName}
          onChangeText={setLastName}
        />
        
        <Text style={styles.fieldLabel}>Phone</Text>
        <TextInput
          style={[styles.input, { backgroundColor: '#eee' }]}
          placeholder="Phone number"
          placeholderTextColor="#888"
          value={phone}
          editable={false}
        />
        
        <Text style={styles.fieldLabel}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter email"
          placeholderTextColor="#888"
          value={newEmail}
          onChangeText={setNewEmail}
        />
        
        <TouchableOpacity style={styles.otpBtn} onPress={sendOtp}>
          <Ionicons name="mail" size={16} color="#fff" />
          <Text style={styles.otpText}>Verify Email</Text>
        </TouchableOpacity>

        {/* DOB Picker */}
        <Text style={styles.fieldLabel}>Date of Birth</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
          <Text style={{ color: dateOfBirth ? '#000' : '#888' }}>
            {dateOfBirth ? dateOfBirth.toDateString() : 'Select Date of Birth'}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            mode="date"
            value={dateOfBirth || new Date()}
            maximumDate={new Date()}
            display="default"
            onChange={(e, selected) => {
              setShowDatePicker(false);
              if (selected) setDateOfBirth(selected);
            }}
          />
        )}

        {/* Gender Selector */}
        <Text style={styles.label}>Select Gender</Text>
        <View style={styles.genderRow}>
          {['Male', 'Female', 'Other'].map((g) => (
            <TouchableOpacity
              key={g}
              onPress={() => setGender(g)}
              style={[
                styles.genderBtn,
                gender === g && { backgroundColor: '#4A2DD8' },
              ]}
            >
              <Text style={[styles.genderText, gender === g && { color: '#fff' }]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Vendor-specific fields */}
        {role === 'VENDOR' && (
          <>
            <Text style={styles.fieldLabel}>Company Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter company name"
              placeholderTextColor="#888"
              value={companyName}
              onChangeText={setCompanyName}
            />
            
            <Text style={styles.fieldLabel}>GSTIN</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter GSTIN"
              placeholderTextColor="#888"
              value={gstin}
              onChangeText={setGstin}
            />
            
            <Text style={styles.fieldLabel}>PAN</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter PAN"
              placeholderTextColor="#888"
              value={pan}
              onChangeText={setPan}
            />
          </>
        )}

        {/* OTP Modal */}
        <Modal visible={showOtpModal} transparent animationType="slide">
          <View style={styles.modalContainer}>
            <View style={styles.modalBox}>
              <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Enter OTP</Text>
              <TextInput
                placeholder="6-digit OTP"
                placeholderTextColor="#888"
                keyboardType="numeric"
                maxLength={6}
                style={styles.input}
                value={otp}
                onChangeText={setOtp}
              />
              <TouchableOpacity style={styles.otpBtn} onPress={verifyOtp}>
                <Text style={styles.otpText}>Submit OTP</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowOtpModal(false)}>
                <Text style={{ marginTop: 12, color: '#4A2DD8' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
    padding: 20,
    paddingTop: 8, // Reduced top padding
  },
  statusBar: {
    height: Constants.statusBarHeight,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4, // Reduced top margin
  },
  iconTap: {
    padding: 8,
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#333' 
  },
  saveText: { 
    fontSize: 16, 
    color: '#4A2DD8', 
    fontWeight: 'bold' 
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: '#555',
    marginLeft: 4,
  },
  otpBtn: {
    flexDirection: 'row',
    backgroundColor: '#4A2DD8',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  otpText: { 
    color: '#fff', 
    marginLeft: 8, 
    fontWeight: '600' 
  },
  label: { 
    fontSize: 14, 
    fontWeight: '600', 
    marginBottom: 6, 
    color: '#333' 
  },
  genderRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginBottom: 20 
  },
  genderBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#eee',
  },
  genderText: { 
    fontSize: 14, 
    fontWeight: '600', 
    color: '#333' 
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
});