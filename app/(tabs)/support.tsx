import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

export default function SupportScreen() {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.98)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const openEmail = () => {
    Linking.openURL('mailto:support@ooterapp.in');
  };

  const openWhatsApp = () => {
    Linking.openURL('https://wa.me/+919650514960');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Support</Text>
      </View>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.card}>
          <Text style={styles.title}>💬 Need Help with Your Booking?</Text>
          <Text style={styles.description}>
            At OOTER, we're here to make outdoor advertising smooth and simple.
            Whether you're a user planning your next campaign or a vendor managing your listings — we've got your back.
          </Text>
          <Text style={styles.description}>
            Facing an issue, have a question, or just need assistance?
          </Text>
          <TouchableOpacity style={styles.contactButton} onPress={openEmail}>
            <Feather name="mail" size={20} color="#FFFFFF" />
            <Text style={styles.contactButtonText}>Email us</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.contactButton} onPress={openWhatsApp}>
            <Feather name="message-circle" size={20} color="#FFFFFF" />
            <Text style={styles.contactButtonText}>WhatsApp us</Text>
          </TouchableOpacity>
          <Text style={styles.supportInfo}>
            Support is available 24×7.
            If we don't pick up your call or you're unable to reach us, just drop a message on WhatsApp — we'll get back to you shortly.
          </Text>
        </View>
        <View style={styles.footer}>
          <Feather name="help-circle" size={24} color="#9CA3AF" />
          <Text style={styles.footerText}>OOTER Support Team</Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#346660ff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 24,
  },
  headerText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
    lineHeight: 32,
  },
  description: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  contactButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  supportInfo: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});