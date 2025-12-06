import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

interface PaymentItem {
  id: string;
  date: string;
  amount: string;
  status: 'Paid' | 'Pending' | 'Failed';
}

const PaymentHistoryItem = ({ date, amount, status }: PaymentItem) => {
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.98)).current;

  React.useEffect(() => {
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
      })
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const statusColor = {
    Paid: '#22C55E',
    Pending: '#F59“.E0',
    Failed: '#EF4444',
  };

  return (
    <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
      <View style={styles.cardHeader}>
        <View style={styles.dateContainer}>
          <View style={[styles.statusDot, { backgroundColor: statusColor[status] }]} />
          <Text style={styles.dateText}>{date}</Text>
        </View>
        <Text style={[styles.statusText, { color: statusColor[status] }]}>
          {status}
        </Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.amountText}>₹{amount}</Text>
      </View>
    </Animated.View>
  );
};

export default function PaymentScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Payment History</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Feather name="loader" size={28} color="#666" />
          <Text style={styles.loadingText}>Loading payments...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Payment History</Text>
        <Text style={styles.subtitle}>No transactions yet</Text>
      </View>
      <View style={styles.emptyContainer}>
        <Feather name="credit-card" size={48} color="#9CA3AF" />
        <Text style={styles.emptyText}>No payments right now</Text>
        <Text style={styles.emptySubText}>
          Your payment history will appear here once you make a transaction
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#D1D5DB',
    marginTop: 8,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#4B5563',
    fontWeight: '500',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
  },
  amountText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
});