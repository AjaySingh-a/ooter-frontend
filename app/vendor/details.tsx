import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { BASE_URL } from '@/constants/endpoints';
import { getToken, removeToken, refreshToken } from '@/utils/storage';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const getUserIdFromToken = (token: string): string => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload?.userId || 'guest';
  } catch (err) {
    console.error('Error parsing token:', err);
    return 'guest';
  }
};

export default function VendorDetailsScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: '',
    email: '',
    designation: '',
    mobile: '',
    gstin: '',
    pan: '',
    cin: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);
  const [isGstinValid, setIsGstinValid] = useState(false);
  const [gstinError, setGstinError] = useState('');
  const [isEmailEditable, setIsEmailEditable] = useState(true);
  const [isMobileEditable, setIsMobileEditable] = useState(true);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const validateGSTIN = (gstin: string) => {
    if (gstin.length !== 15) {
      setGstinError('GSTIN must be 15 characters long');
      return false;
    }
    
    const alphanumericRegex = /^[a-zA-Z0-9]+$/;
    if (!alphanumericRegex.test(gstin)) {
      setGstinError('GSTIN must be alphanumeric');
      return false;
    }
    
    setGstinError('');
    return true;
  };

  const handleChange = (key: string, value: string) => {
    const newForm = { ...form, [key]: value };
    setForm(newForm);
    
    if (key === 'gstin') {
      setIsGstinValid(validateGSTIN(value));
    }
  };

  useEffect(() => {
    setIsGstinValid(validateGSTIN(form.gstin));

    const fetchUser = async () => {
      const token = await getToken();
      try {
        const res = await fetch(`${BASE_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (res.ok) {
          const updatedForm = { ...form };

          if (data.email) {
            updatedForm.email = data.email;
            setIsEmailEditable(false);
          }

          if (data.phone) {
            updatedForm.mobile = data.phone;
            setIsMobileEditable(false);
          }

          setForm(updatedForm);
        }
      } catch (err) {
        console.error('Failed to fetch user info:', err);
      }
    };

    fetchUser();
  }, []);

  const handleSubmit = async () => {
    if (!isGstinValid) {
      Alert.alert('Error', 'Please enter a valid GSTIN');
      return;
    }

    if (!acceptTerms) {
      Alert.alert('Error', 'Please accept the Terms & Conditions to continue');
      return;
    }

    const token = await getToken();
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/vendors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => null);

      if (res.ok) {
        // ✅ Clear all cached data to force fresh fetch
        if (token) {
          const userId = getUserIdFromToken(token);
          await AsyncStorage.multiRemove([
            'userData',
            `vendorDashboard-${userId}`,
            `verificationStatus-${userId}`
          ]);
        }

        // ✅ CRITICAL: Refresh token to get new token with VENDOR role
        // This prevents session expired errors
        try {
          const newToken = await refreshToken();
          if (newToken) {
            console.log('Token refreshed successfully with updated role');
          } else {
            console.warn('Token refresh failed, but continuing with navigation');
          }
        } catch (err) {
          console.warn('Token refresh error:', err);
          // Continue anyway - vendor layout will handle it
        }

        // ✅ Set flag for drawer refresh (in case user goes back to user tabs)
        await AsyncStorage.setItem('vendorRegistrationComplete', Date.now().toString());

        // ✅ Wait a bit for token refresh and cache to propagate
        await new Promise(resolve => setTimeout(resolve, 500));

        // ✅ Navigate directly to vendor dashboard tabs
        // Don't show alert - navigate immediately for better UX
        router.replace('/vendor/(tabs)');
        
        // ✅ Show success message after navigation (non-blocking)
        setTimeout(() => {
          Alert.alert(
            'Success',
            data?.message || 'Vendor registration successful!'
          );
        }, 300);
      } else {
        // ✅ Better error handling for "User not found" error
        const errorMessage = data?.message || 'Something went wrong';
        
        if (errorMessage.includes('not found') || errorMessage.includes('login')) {
          Alert.alert(
            'Session Expired',
            'Your session has expired. Please login again to continue.',
            [
              {
                text: 'Login',
                onPress: async () => {
                  // Clear token and redirect to login
                  await removeToken();
                  router.replace('/login');
                }
              }
            ]
          );
        } else {
          Alert.alert('Error', errorMessage);
        }
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to submit vendor details');
    } finally {
      setLoading(false);
    }
  };

  // 🚀 SMART BACK BUTTON HANDLER - ADDED THIS FUNCTION
  const handleBackPress = () => {
    // Check if user has started filling any form field
    const hasFormProgress = form.companyName || form.gstin || form.pan || 
                           form.designation || form.mobile || form.address;
    
    if (hasFormProgress) {
      // User has started filling form, show confirmation
      Alert.alert(
        'Discard Changes?',
        'Are you sure you want to go back? Your progress will be lost.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Discard', 
            style: 'destructive',
            onPress: () => router.replace('/(tabs)') 
          }
        ]
      );
    } else {
      // No progress, go back directly
      router.replace('/(tabs)');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F4F4F4' }}>
      {/* StatusBar with dynamic color */}
      <View style={styles.statusBar}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        {/* Dynamic Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={handleBackPress}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={22} color="#4A2DD8" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Vendor Details</Text>
        </View>

        {/* Dynamic Form Fields */}
        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Company Name</Text>
            <TextInput
              placeholder="Enter company name"
              placeholderTextColor="#888"
              value={form.companyName}
              onChangeText={(val) => handleChange('companyName', val)}
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Official Email</Text>
            <TextInput
              placeholder="Enter official email"
              placeholderTextColor="#888"
              value={form.email}
              onChangeText={(val) => handleChange('email', val)}
              style={[styles.input, !isEmailEditable && styles.disabledInput]}
              editable={isEmailEditable}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Designation</Text>
            <TextInput
              placeholder="Enter your designation"
              placeholderTextColor="#888"
              value={form.designation}
              onChangeText={(val) => handleChange('designation', val)}
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Mobile Number</Text>
            <TextInput
              placeholder="Enter mobile number"
              placeholderTextColor="#888"
              value={form.mobile}
              onChangeText={(val) => handleChange('mobile', val)}
              style={[styles.input, !isMobileEditable && styles.disabledInput]}
              editable={isMobileEditable}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.labelRow}>
              <Text style={styles.fieldLabel}>GSTIN</Text>
              <Text style={styles.required}>*</Text>
            </View>
            <TextInput
              placeholder="Enter 15-character GSTIN"
              placeholderTextColor="#888"
              value={form.gstin}
              onChangeText={(val) => handleChange('gstin', val)}
              style={[
                styles.input,
                form.gstin ? (isGstinValid ? styles.validInput : styles.invalidInput) : null
              ]}
              maxLength={15}
            />
            {gstinError ? <Text style={styles.errorText}>{gstinError}</Text> : null}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>PAN Number</Text>
            <TextInput
              placeholder="Enter PAN number"
              placeholderTextColor="#888"
              value={form.pan}
              onChangeText={(val) => handleChange('pan', val)}
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>CIN (if any)</Text>
            <TextInput
              placeholder="Enter CIN number"
              placeholderTextColor="#888"
              value={form.cin}
              onChangeText={(val) => handleChange('cin', val)}
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.fieldLabel}>Company Address</Text>
            <TextInput
              placeholder="Enter registered address"
              placeholderTextColor="#888"
              value={form.address}
              onChangeText={(val) => handleChange('address', val)}
              style={[styles.input, styles.multilineInput]}
              multiline
            />
          </View>

          {/* Terms and Conditions Checkbox */}
          <View style={styles.termsContainer}>
            <TouchableOpacity 
              style={styles.checkboxContainer}
              onPress={() => setAcceptTerms(!acceptTerms)}
            >
              <View style={[
                styles.checkbox,
                acceptTerms ? styles.checkboxChecked : styles.checkboxUnchecked
              ]}>
                {acceptTerms && (
                  <Ionicons name="checkmark" size={16} color="#fff" />
                )}
              </View>
              <Text style={styles.termsText}>
                I accept the{' '}
                <Text 
                  style={styles.termsLink}
                  onPress={() => setShowTermsModal(true)}
                >
                  Terms & Conditions
                </Text>
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[
              styles.button, 
              (!isGstinValid || !acceptTerms) && styles.disabledButton
            ]} 
            onPress={handleSubmit} 
            disabled={loading || !isGstinValid || !acceptTerms}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Let's Start</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Terms and Conditions Modal */}
      <Modal
        visible={showTermsModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowTermsModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Terms & Conditions</Text>
            <TouchableOpacity 
              onPress={() => setShowTermsModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalText}>
              Welcome to OOTER App, owned and operated by Adbook Communication Pvt. Ltd. ("we," "our," or "us"). By accessing or using our mobile application, website, and related services (the "Platform"), you agree to comply with these Terms & Conditions. Please read them carefully.
              {'\n\n'}
              <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
              {'\n'}
              By registering or using OOTER, you agree to these Terms & Conditions and our Privacy Policy. If you do not agree, please discontinue use of the app.
              {'\n\n'}
              <Text style={styles.sectionTitle}>2. Services Provided</Text>
              {'\n'}
              OOTER is a digital platform that connects hoarding/billboard vendors with advertisers/marketers for seamless booking, management, and execution of outdoor advertising campaigns.
              {'\n\n'}
              <Text style={styles.sectionTitle}>3. Eligibility</Text>
              {'\n'}
              • You must be 18 years or older to use OOTER.{'\n'}
              • Vendors must provide valid business licenses and ownership/authorization documents for listed media assets.{'\n'}
              • Advertisers must ensure campaigns comply with legal and ethical advertising standards.
              {'\n\n'}
              <Text style={styles.sectionTitle}>4. User Accounts</Text>
              {'\n'}
              • Users must provide accurate and complete information during registration.{'\n'}
              • You are responsible for maintaining the confidentiality of your login credentials.{'\n'}
              • Any unauthorized activity on your account must be reported immediately.
              {'\n\n'}
              <Text style={styles.sectionTitle}>5. Vendor Responsibilities</Text>
              {'\n'}
              Vendors listing media inventory on OOTER agree to:{'\n'}
              • Provide accurate details (location, size, availability, pricing).{'\n'}
              • Ensure the hoarding/billboard is legally owned or managed by them.{'\n'}
              • Deliver services as agreed once a booking is confirmed.
              {'\n\n'}
              <Text style={styles.sectionTitle}>6. Advertiser Responsibilities</Text>
              {'\n'}
              Advertisers using OOTER agree to:{'\n'}
              • Provide accurate campaign details.{'\n'}
              • Avoid illegal, offensive, or misleading advertising content.{'\n'}
              • Make payments on time as per agreed terms.
              {'\n\n'}
              <Text style={styles.sectionTitle}>7. Payments</Text>
              {'\n'}
              • All payments are processed securely via third-party gateways.{'\n'}
              • Vendors receive payouts after applicable service charges/commission.{'\n'}
              • OOTER may apply a service fee (Take Rate) on transactions.
              {'\n\n'}
              <Text style={styles.sectionTitle}>8. Cancellations & Refunds</Text>
              {'\n'}
              • Cancellation policies may vary per vendor and will be displayed during booking.{'\n'}
              • Refunds (if applicable) will follow vendor policy and payment gateway timelines.
              {'\n\n'}
              <Text style={styles.sectionTitle}>9. Intellectual Property</Text>
              {'\n'}
              • All content, logos, designs, and software of OOTER belong to Adbook Communication Pvt. Ltd.{'\n'}
              • Users may not copy, modify, or resell any part of the platform.
              {'\n\n'}
              <Text style={styles.sectionTitle}>10. Prohibited Activities</Text>
              {'\n'}
              Users may not:{'\n'}
              • Upload false, illegal, or harmful content.{'\n'}
              • Attempt to hack, damage, or misuse the platform.{'\n'}
              • Circumvent the platform by making direct deals outside OOTER after discovery.
              {'\n\n'}
              <Text style={styles.sectionTitle}>11. Limitation of Liability</Text>
              {'\n'}
              • OOTER acts as a technology intermediary between vendors and advertisers.{'\n'}
              • We are not responsible for disputes, campaign failures, or vendor delays.{'\n'}
              • Our liability is limited to the extent permitted by law.
              {'\n\n'}
              <Text style={styles.sectionTitle}>12. Termination</Text>
              {'\n'}
              We reserve the right to suspend or terminate accounts that violate these Terms & Conditions or applicable laws.
              {'\n\n'}
              <Text style={styles.sectionTitle}>13. Governing Law</Text>
              {'\n'}
              These Terms are governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in Delhi, India.
              {'\n\n'}
              <Text style={styles.sectionTitle}>14. Changes to Terms</Text>
              {'\n'}
              We may update these Terms periodically. Users will be notified via the app or email. Continued use of OOTER means acceptance of updated terms.
              {'\n\n'}
              <Text style={styles.sectionTitle}>15. Contact Us</Text>
              {'\n'}
              For questions or support:{'\n\n'}
              <Text style={styles.contactInfo}>
                Adbook Communication Pvt. Ltd.{'\n'}
                Email: support@ooterapp.in{'\n'}
                Phone: +91 9650514960{'\n'}
                Office Address: C-37, Street No. 7, Prem Vihar, Shiv Vihar New Delhi 110094
              </Text>
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  statusBar: {
    height: Constants.statusBarHeight,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  backText: {
    marginLeft: 6,
    fontSize: 16,
    color: '#4A2DD8',
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  formContainer: {
    paddingHorizontal: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  required: {
    color: 'red',
    marginLeft: 2,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#333',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  validInput: {
    borderColor: '#4CAF50',
  },
  invalidInput: {
    borderColor: '#F44336',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#4A2DD8',
    paddingVertical: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: '#aaa',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Terms and Conditions styles
  termsContainer: {
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4A2DD8',
    borderColor: '#4A2DD8',
  },
  checkboxUnchecked: {
    backgroundColor: 'transparent',
    borderColor: '#4A2DD8',
  },
  termsText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  termsLink: {
    color: '#4A2DD8',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333',
    textAlign: 'justify',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4A2DD8',
    marginTop: 8,
    marginBottom: 4,
  },
  contactInfo: {
    fontSize: 14,
    lineHeight: 20,
    color: '#555',
    fontStyle: 'italic',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
});