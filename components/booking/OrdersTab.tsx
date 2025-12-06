import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { getToken } from '@/utils/storage';
import { BASE_URL } from '@/constants/endpoints';
import { useRouter } from 'expo-router';
import HoardingImage from '@/components/HoardingImage';
import { fetchWithCache } from '@/utils/apiClient';

type Booking = {
  id: number;
  city: string;
  name: string;
  location: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  status: string;
  totalPrice: number;
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

export default function OrdersTab() {
  const [orders, setOrders] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const loadOrders = async (forceRefresh = false) => {
    const token = await getToken();
    if (!token) return;

    try {
      setLoading(true);
      const data = await fetchWithCache<Booking[]>(
        `${BASE_URL}/bookings/orders`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` }
        },
        `orders-user_${getUserIdFromToken(token)}`,
        forceRefresh
      );
      setOrders(data);
    } catch (err) {
      console.error('❌ Orders fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Booking }) => (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => router.push({ pathname: '/order/[id]', params: { id: String(item.id) } })}>
        <HoardingImage
          publicId={item.imageUrl || ''}
          width={60}
          height={60}
          borderRadius={6}
        />
      </TouchableOpacity>
      <View style={styles.details}>
        <Text style={styles.title}>{item.city} - {item.name}</Text>
        <Text style={styles.dates}>{item.startDate} - {item.endDate}</Text>
        <Text style={styles.location}>{item.location}</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.outlinedBtn}>
            <Text style={styles.outlinedText}>Book Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlinedBtn}>
            <Text style={styles.outlinedText}>📞 Needs Help</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  useEffect(() => {
    const interval = setInterval(() => {
      loadOrders();
    }, 600000); // 10 minutes interval
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    loadOrders();
  }, []);

  if (loading && orders.length === 0) {
    return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;
  }

  if (orders.length === 0) {
    return <Text style={styles.empty}>No active bookings yet.</Text>;
  }

  return (
    <FlatList 
      data={orders} 
      renderItem={renderItem} 
      keyExtractor={(item) => item.id.toString()}
      refreshing={loading}
      onRefresh={() => loadOrders(true)}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    gap: 10,
  },
  details: { flex: 1 },
  title: { fontSize: 14, fontWeight: 'bold', color: '#222' },
  dates: { fontSize: 12, color: '#555' },
  location: { fontSize: 11, color: '#777' },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 6 },
  outlinedBtn: {
    borderColor: '#aaa',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  outlinedText: { fontSize: 12 },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
    fontSize: 14,
  },
});