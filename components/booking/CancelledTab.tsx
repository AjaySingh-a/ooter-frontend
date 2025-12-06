import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { getToken } from '@/utils/storage';
import { BASE_URL } from '@/constants/endpoints';
import HoardingImage from '@/components/HoardingImage';
import { fetchWithCache } from '@/utils/apiClient';

type CancelledBooking = {
  id: number;
  city: string;
  location: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  status: string;
  totalPrice: number;
  refundAmount?: number;
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

export default function CancelledTab() {
  const [cancelled, setCancelled] = useState<CancelledBooking[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCancelled = async (forceRefresh = false) => {
    const token = await getToken();
    if (!token) return;

    try {
      setLoading(true);
      const data = await fetchWithCache<CancelledBooking[]>(
        `${BASE_URL}/bookings/cancelled`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` }
        },
        `cancelled-user_${getUserIdFromToken(token)}`,
        forceRefresh
      );
      setCancelled(data);
    } catch (err) {
      console.error('❌ Cancelled fetch failed', err);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: CancelledBooking }) => (
    <View style={styles.card}>
      <HoardingImage
        publicId={item.imageUrl || ''}
        width={60}
        height={60}
        borderRadius={6}
      />
      <View style={styles.details}>
        <Text style={styles.title}>{item.city} (Exit Point)</Text>
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

        {item.refundAmount && (
          <View style={styles.refundBox}>
            <Text style={styles.refundText}>
              ⚠️ Refund of ₹{item.refundAmount.toLocaleString('en-IN')} is on its way
            </Text>
            <TouchableOpacity style={styles.refundBtn}>
              <Text style={styles.refundBtnText}>View Refund status</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  useEffect(() => {
    const interval = setInterval(() => {
      fetchCancelled();
    }, 86400000); // 24 hours interval
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchCancelled();
  }, []);

  if (loading && cancelled.length === 0) {
    return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;
  }

  if (cancelled.length === 0) {
    return <Text style={styles.empty}>No cancelled bookings yet.</Text>;
  }

  return (
    <FlatList 
      data={cancelled} 
      renderItem={renderItem} 
      keyExtractor={(item) => item.id.toString()}
      refreshing={loading}
      onRefresh={() => fetchCancelled(true)}
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
  refundBox: {
    marginTop: 10,
    backgroundColor: '#d6f5e9',
    padding: 10,
    borderRadius: 8,
  },
  refundText: { fontSize: 12, color: '#111', marginBottom: 4 },
  refundBtn: {
    backgroundColor: '#00b894',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  refundBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  empty: {
    textAlign: 'center',
    marginTop: 50,
    color: '#666',
    fontSize: 14,
  },
});