import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  AppState,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getToken } from '@/utils/storage';
import { BASE_URL } from '@/constants/endpoints';
import NetInfo from '@react-native-community/netinfo';
import HoardingImage from '@/components/HoardingImage';
import { fetchWithCache } from '@/utils/apiClient';

type CartItem = {
  id: number;
  hoardingId: number;
  city: string;
  location: string;
  imageUrl: string;
  pricePerMonth: number;
  discount: number;
  printingCharges: number;
  mountingCharges: number;
  startDate?: string;
  endDate?: string;
  totalMonths?: number;
  finalPrice?: number;
};

const formatDate = (date: Date) =>
  date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const calculateExactMonths = (startDateStr: string, endDateStr: string): number => {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  
  let months = (end.getFullYear() - start.getFullYear()) * 12;
  months += end.getMonth() - start.getMonth();
  
  if (end.getDate() >= start.getDate()) {
    months += 1;
  }
  
  return Math.max(1, months);
};

const getUserIdFromToken = (token: string): string => {
  try {
    const payload = token.split('.')[1];
    const decoded = atob(payload);
    return JSON.parse(decoded).id || 'unknown';
  } catch {
    return 'unknown';
  }
};

export default function BasketTab() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkNetworkConnection = async () => {
    const state = await NetInfo.fetch();
    if (!state.isConnected) {
      setError('No internet connection');
      return false;
    }
    return true;
  };

  const fetchCartItems = async (forceRefresh = false) => {
    if (!await checkNetworkConnection()) return;
    
    const token = await getToken();
    if (!token) {
      setError('Authentication required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchWithCache<CartItem[]>(
        `${BASE_URL}/cart`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        },
        `cart-user_${getUserIdFromToken(token)}`,
        forceRefresh
      );

      const itemsWithCorrectMonths = data.map((item: CartItem) => {
        if (item.startDate && item.endDate) {
          const months = calculateExactMonths(item.startDate, item.endDate);
          return { ...item, totalMonths: months };
        }
        return item;
      });
      setCartItems(itemsWithCorrectMonths);
    } catch (err: any) {
      handleApiError(err, 'load cart');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCartItems(true);
  };

  const handleApiError = (err: any, operation: string) => {
    console.error(`❌ Failed to ${operation}:`, err);
    let errorMessage = `Failed to ${operation}. Please try again.`;
    
    if (err.response) {
      // Handle authentication errors silently - no popup for 401/403
      if (err.response.status === 401 || err.response.status === 403) {
        console.log('Authentication error handled silently');
        return; // Don't show popup for auth errors
      } else if (err.response.status === 404) {
        errorMessage = 'Resource not found';
      } else if (err.response.data?.message) {
        errorMessage = err.response.data.message;
      }
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    setError(errorMessage);
    Alert.alert('Error', errorMessage);
  };

  const removeFromCart = async (hoardingId: number) => {
    const token = await getToken();
    if (!token) {
      Alert.alert('Authentication Required', 'Please login to modify your cart');
      return;
    }

    try {
      const response = await fetchWithCache(
        `${BASE_URL}/cart/remove/${hoardingId}`,
        {
          method: 'DELETE',
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        },
        `cart-user_${getUserIdFromToken(token)}`,
        true // Force refresh after removal
      );

      if (response) {
        setCartItems(prev => prev.filter(item => item.hoardingId !== hoardingId));
      }
    } catch (err: any) {
      handleApiError(err, 'remove item');
    }
  };

  const handleBuyNow = () => {
    Alert.alert('Coming Soon', 'Buy Now feature is under development');
  };

  const getFinalPrice = (item: CartItem) => {
    if (item.finalPrice) return item.finalPrice;
    
    const months = item.startDate && item.endDate 
      ? calculateExactMonths(item.startDate, item.endDate)
      : 1;
      
    const base = item.pricePerMonth * months;
    const discount = item.discount || 0;
    const printing = item.printingCharges || 0;
    const mounting = item.mountingCharges || 0;

    const subtotal = base + printing + mounting;
    const commission = subtotal * 0.15;
    const grossTotal = subtotal + commission;
    const afterDiscount = grossTotal - discount;
    const gst = afterDiscount * 0.18;
    return Math.round(afterDiscount + gst);
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + getFinalPrice(item), 0);

  const renderItem = ({ item }: { item: CartItem }) => {
    const finalPrice = getFinalPrice(item);
    
    return (
      <View style={styles.card}>
        <HoardingImage
          publicId={item.imageUrl || ''}
          width={60}
          height={60}
          borderRadius={8}
        />
        <View style={styles.details}>
          <Text style={styles.title}>{item.city} ({item.location})</Text>
          <Text style={styles.sub}>{item.location}</Text>
          
          {item.startDate && item.endDate && (
            <Text style={styles.dates}>
              {formatDate(new Date(item.startDate))} - {formatDate(new Date(item.endDate))}
              {item.totalMonths && ` • ${item.totalMonths} month${item.totalMonths > 1 ? 's' : ''}`}
            </Text>
          )}
          
          <Text style={styles.price}>₹{finalPrice.toLocaleString('en-IN')}</Text>
          <Text style={styles.inc}>Inc GST • Printing • Mounting</Text>
        </View>
        <TouchableOpacity 
          onPress={() => removeFromCart(item.hoardingId)} 
          style={styles.deleteBtn}
        >
          <Ionicons name="trash" size={18} color="red" />
        </TouchableOpacity>
      </View>
    );
  };

  useEffect(() => {
    const interval = setInterval(() => {
      fetchCartItems();
    }, 300000); // 5 minutes interval
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchCartItems();
  }, []);

  if (loading && cartItems.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A2DD8" />
      </View>
    );
  }

  if (error && cartItems.length === 0) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => fetchCartItems(true)}
        >
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={cartItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.empty}>No items in cart</Text>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => fetchCartItems(true)}
            >
              <Text style={styles.retryText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 190 }}
        refreshing={refreshing}
        onRefresh={handleRefresh}
      />

      {cartItems.length > 0 && (
        <View style={styles.bottomBar}>
          <View style={styles.priceBlock}>
            <Text style={styles.priceLabel}>Total Price</Text>
            <Text style={styles.totalText}>₹{totalAmount.toLocaleString('en-IN')}</Text>
          </View>
          <TouchableOpacity 
            style={styles.buyNowBtn} 
            onPress={handleBuyNow}
            disabled={loading}
          >
            <Text style={styles.buyNowText}>
              {loading ? 'Processing...' : 'Buy Now'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: { marginBottom: 16 },
  billingBox: {
    backgroundColor: '#f2f2f2',
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    gap: 6,
  },
  billTo: { fontSize: 13, color: '#222' },
  address: { fontSize: 12, color: '#444' },
  gst: { fontSize: 12, color: '#666' },
  changeBtn: { justifyContent: 'center' },
  changeText: { fontSize: 13, color: '#007aff', fontWeight: '600' },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    elevation: 2,
    borderRadius: 12,
    marginBottom: 12,
    padding: 10,
    alignItems: 'flex-start',
    gap: 10,
  },
  details: { flex: 1 },
  title: { fontWeight: 'bold', fontSize: 14 },
  sub: { fontSize: 12, color: '#777' },
  dates: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
    marginBottom: 2,
  },
  price: { fontSize: 15, color: 'green', fontWeight: 'bold', marginTop: 4 },
  inc: { fontSize: 11, color: '#999' },
  deleteBtn: { paddingTop: 6, paddingRight: 6 },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40
  },
  empty: { 
    textAlign: 'center', 
    fontSize: 14, 
    color: '#777',
    marginBottom: 10
  },
  bottomBar: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderTopWidth: 0.8,
    borderTopColor: '#ccc',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  priceBlock: {
    flexDirection: 'column',
  },
  priceLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  totalText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  buyNowBtn: {
    backgroundColor: '#2DC653',
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 30,
    opacity: 1,
  },
  buyNowText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    color: '#E53935',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center'
  },
  retryButton: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#4A2DD8',
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center'
  },
  retryText: {
    color: 'white',
    fontWeight: 'bold'
  }
});