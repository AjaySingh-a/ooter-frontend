import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { BASE_URL } from '@/constants/endpoints';
import { saveToken } from '@/utils/storage';

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Password validation states
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [isFormValid, setIsFormValid] = useState(false);

  // Password complexity validation
  const validatePassword = (pass: string) => {
    const errors: string[] = [];
    
    if (pass.length < 8) {
      errors.push('At least 8 characters');
    }
    if (!/[A-Z]/.test(pass)) {
      errors.push('One capital letter');
    }
    if (!/[a-z]/.test(pass)) {
      errors.push('One small letter');
    }
    if (!/\d/.test(pass)) {
      errors.push('One numeric character');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) {
      errors.push('One special character');
    }
    
    setPasswordErrors(errors);
    return errors.length === 0;
  };

  // Real-time form validation
  const validateForm = () => {
    const isNameValid = name.trim().length > 0;
    const isPhoneValid = phone.length === 10 && /^\d+$/.test(phone);
    const isEmailValid = email.includes('@') && email.trim().length > 0;
    const isPasswordValid = password.length > 0 && passwordErrors.length === 0;
    const isConfirmPasswordValid = password === confirmPassword && password.length > 0;
    
    setIsFormValid(isNameValid && isPhoneValid && isEmailValid && isPasswordValid && isConfirmPasswordValid && acceptTerms);
  };

  // Update validation when any field changes
  useEffect(() => {
    validateForm();
  }, [name, phone, email, password, confirmPassword, acceptTerms]);

  // Update password validation when password changes
  useEffect(() => {
    if (password.length > 0) {
      validatePassword(password);
    } else {
      setPasswordErrors([]);
    }
  }, [password]);

  const handleSignup = async () => {
    if (!isFormValid) {
      Alert.alert('Error', 'Please fill all required fields correctly');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      console.log('Sending signup request to:', `${BASE_URL}/auth/signup`);
      console.log('Signup data:', { name, phone, email, password: '***', referredBy: referralCode || undefined });
      
      const response = await axios.post(`${BASE_URL}/auth/signup`, {
        name,
        phone,
        email,
        password,
        referredBy: referralCode || undefined,
      });
      
      console.log('Signup response:', response.data);
      
      // Auto-login: Save token and redirect to main app
      const token = response.data.token;
      if (token) {
        console.log('Signup successful, auto-logging in with token:', token);
        await saveToken(token);
        
        // Clear form data
        setName('');
        setPhone('');
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setReferralCode('');
        setPasswordErrors([]);
        setIsFormValid(false);
        
        // Navigate directly to main app (tabs)
        router.replace('/(tabs)');
      } else {
        // Fallback: if token is missing, show alert and redirect to login
        Alert.alert(
        '�� Signup Successful!',
        'Your account has been created successfully! You can now login with your phone number or email.',
        [
          { 
            text: 'Login Now', 
            onPress: () => {
              router.replace('/login');
            }
          }
        ]
      );
      }
      
    } catch (error: any) {
      console.error('Signup error details:', error);
      
      let errorMessage = 'Signup failed. Please try again.';
      
      if (error.response) {
        // Server responded with error
        console.log('Error response:', error.response.data);
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data && error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error.request) {
        // Network error
        errorMessage = 'Network error. Please check your internet connection.';
      } else {
        // Other error
        errorMessage = error.message || 'Something went wrong. Please try again.';
      }
      
      Alert.alert('Signup Failed', errorMessage);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.statusBar}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      </View>
      
      <Image
        source={require('@/assets/images/worldmap.jpg')}
        style={styles.bgImage}
        resizeMode="cover"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Create an</Text>
              <Text style={styles.titleBold}>Account!</Text>
            </View>

            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />

            <View style={styles.formContainer}>
              <TextInput
                placeholder="Full Name *"
                placeholderTextColor="#888"
                value={name}
                onChangeText={setName}
                style={[
                  styles.input,
                  name.trim().length > 0 ? styles.inputValid : styles.inputInvalid
                ]}
              />

              <TextInput
                placeholder="Phone No. *"
                placeholderTextColor="#888"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={[
                  styles.input,
                  phone.length === 10 && /^\d+$/.test(phone) ? styles.inputValid : styles.inputInvalid
                ]}
                maxLength={10}
              />

              <TextInput
                placeholder="Email *"
                placeholderTextColor="#888"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[
                  styles.input,
                  email.includes('@') && email.trim().length > 0 ? styles.inputValid : styles.inputInvalid
                ]}
              />

              <View style={[
                styles.passwordContainer,
                password.length > 0 && passwordErrors.length === 0 ? styles.inputValid : styles.inputInvalid
              ]}>
                <TextInput
                  placeholder="Password *"
                  placeholderTextColor="#888"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  style={styles.passwordInput}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showPassword ? 'eye' : 'eye-off'}
                    size={20}
                    color="#444"
                  />
                </TouchableOpacity>
              </View>

              {/* Password requirements */}
              {password.length > 0 && (
                <View style={styles.passwordRequirements}>
                  <Text style={styles.requirementsTitle}>Password must contain:</Text>
                  {[
                    { text: 'At least 8 characters', valid: password.length >= 8 },
                    { text: 'One capital letter', valid: /[A-Z]/.test(password) },
                    { text: 'One small letter', valid: /[a-z]/.test(password) },
                    { text: 'One numeric character', valid: /\d/.test(password) },
                    { text: 'One special character', valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) }
                  ].map((req, index) => (
                    <Text key={index} style={[
                      styles.requirement,
                      req.valid ? styles.requirementValid : styles.requirementInvalid
                    ]}>
                      {req.valid ? '✓' : '✗'} {req.text}
                    </Text>
                  ))}
                </View>
              )}

              <View style={[
                styles.passwordContainer,
                confirmPassword.length > 0 && password === confirmPassword ? styles.inputValid : styles.inputInvalid
              ]}>
                <TextInput
                  placeholder="Confirm Password *"
                  placeholderTextColor="#888"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  style={styles.passwordInput}
                />
                <TouchableOpacity 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye' : 'eye-off'}
                    size={20}
                    color="#444"
                  />
                </TouchableOpacity>
              </View>

              {confirmPassword.length > 0 && password !== confirmPassword && (
                <Text style={styles.errorText}>Passwords do not match</Text>
              )}

              <TextInput
                placeholder="Referral Code (optional)"
                placeholderTextColor="#888"
                value={referralCode}
                onChangeText={setReferralCode}
                style={styles.input}
              />

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
                  styles.signupBtn, 
                  isFormValid ? styles.signupBtnEnabled : styles.signupBtnDisabled
                ]} 
                onPress={handleSignup}
                disabled={!isFormValid}
              >
                <Text style={[
                  styles.signupText,
                  isFormValid ? styles.signupTextEnabled : styles.signupTextDisabled
                ]}>
                  SIGN UP
                </Text>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerLabel}>ALREADY HAVE AN ACCOUNT?</Text>
                <TouchableOpacity onPress={() => router.push('/login')}>
                  <Text style={styles.footerLink}>LOGIN</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
  container: {
    flex: 1,
  },
  statusBar: {
    height: 44,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.2,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '400',
    color: '#000',
    textAlign: 'center',
  },
  titleBold: {
    fontSize: 32,
    fontWeight: '800',
    color: '#4A2DD8',
    textAlign: 'center',
  },
  logo: {
    width: 240,
    height: 150,
    alignSelf: 'center',
    marginBottom: 24,
  },
  formContainer: {
    marginBottom: 24,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#4A2DD8',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    color: '#000',
  },
  inputValid: {
    borderColor: '#4A2DD8',
  },
  inputInvalid: {
    borderColor: '#FF6B6B',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#4A2DD8',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
    color: '#000',
  },
  eyeIcon: {
    padding: 8,
  },
  signupBtn: {
    backgroundColor: '#4A2DD8',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  signupBtnEnabled: {
    backgroundColor: '#4A2DD8',
  },
  signupBtnDisabled: {
    backgroundColor: '#ccc',
  },
  signupText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupTextEnabled: {
    color: '#fff',
  },
  signupTextDisabled: {
    color: '#888',
  },
  passwordRequirements: {
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  requirement: {
    fontSize: 13,
    marginBottom: 4,
    paddingHorizontal: 8,
  },
  requirementValid: {
    color: '#4CAF50',
  },
  requirementInvalid: {
    color: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 13,
    marginTop: -8,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingBottom: 40,
  },
  footerLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#000',
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A2DD8',
    marginTop: 8,
    padding: 8,
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
    color: '#000',
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
    color: '#000',
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