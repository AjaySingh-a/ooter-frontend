import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import OrdersTab from '@/components/booking/OrdersTab';
import CancelledTab from '@/components/booking/CancelledTab';
import BasketTab from '@/components/booking/BasketTab';
import { useLocalSearchParams } from 'expo-router';

const BookingScreen = () => {
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<'orders' | 'cancelled' | 'basket'>('orders');

  useEffect(() => {
    const tabParam = params?.tab as string;
    if (tabParam === 'orders' || tabParam === 'cancelled' || tabParam === 'basket') {
      setActiveTab(tabParam);
    }
  }, [params]);

  const renderTab = () => {
    switch (activeTab) {
      case 'orders':
        return <OrdersTab />;
      case 'cancelled':
        return <CancelledTab />;
      case 'basket':
        return <BasketTab />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
      <Text style={styles.title}>Booking</Text>

      <View style={styles.tabContainer}>
        <View style={styles.tabWrapper}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'orders' && styles.activeTabButton]}
            onPress={() => setActiveTab('orders')}
          >
            <Text style={[styles.tabText, activeTab === 'orders' && styles.activeTabText]}>
              Orders
            </Text>
            {activeTab === 'orders' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>
        
        <View style={styles.tabWrapper}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'cancelled' && styles.activeTabButton]}
            onPress={() => setActiveTab('cancelled')}
          >
            <Text style={[styles.tabText, activeTab === 'cancelled' && styles.activeTabText]}>
              Cancelled
            </Text>
            {activeTab === 'cancelled' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>
        
        <View style={styles.tabWrapper}>
          <TouchableOpacity 
            style={[styles.tabButton, activeTab === 'basket' && styles.activeTabButton]}
            onPress={() => setActiveTab('basket')}
          >
            <Text style={[styles.tabText, activeTab === 'basket' && styles.activeTabText]}>
              View Basket
            </Text>
            {activeTab === 'basket' && <View style={styles.tabIndicator} />}
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.tabContent}>{renderTab()}</View>
    </View>
  );
};

export default BookingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 40,
    backgroundColor: '#fff',
  },
  logo: {
    width: 200,
    height: 60,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    marginBottom: 14,
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabWrapper: {
    flex: 1,
    marginHorizontal: 4, // Added spacing between tabs
  },
  tabButton: {
    paddingBottom: 12,
    alignItems: 'center',
  },
  activeTabButton: {
    // You can add specific active button styles if needed
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#888',
  },
  activeTabText: {
    color: '#000',
    fontWeight: '600',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    width: '70%',
    backgroundColor: '#0066FF',
    borderRadius: 3,
  },
  tabContent: {
    flex: 1,
  },
});