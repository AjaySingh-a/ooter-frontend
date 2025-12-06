import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken } from '@/utils/storage';
import { BASE_URL } from '@/constants/endpoints';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type Hoarding = {
  id: number;
  location: string;
  city: string;
  imageUrl: string;
  price: number;
};

export default function SavedSitesScreen() {
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [hoardings, setHoardings] = useState<Hoarding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    const token = await getToken();
    const json = await AsyncStorage.getItem('ooter_wishlist');
    const ids: number[] = json ? JSON.parse(json) : [];

    setWishlist(ids);

    if (token && ids.length > 0) {
      try {
        const promises = ids.map((id) =>
          fetch(`${BASE_URL}/hoardings/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }).then((res) => res.json())
        );

        const data = await Promise.all(promises);
        setHoardings(data);
      } catch (err) {
        console.error('Failed to load wishlist hoardings:', err);
        Alert.alert('Error', 'Failed to load hoardings.');
      }
    } else {
      setHoardings([]);
    }

    setLoading(false);
  };

  const removeFromWishlist = async (id: number) => {
    const updated = wishlist.filter((wid) => wid !== id);
    await AsyncStorage.setItem('ooter_wishlist', JSON.stringify(updated));
    setWishlist(updated);
    setHoardings((prev) => prev.filter((h) => h.id !== id));
  };

  const renderItem = ({ item }: { item: Hoarding }) => (
    <View style={styles.card}>
      <TouchableOpacity onPress={() => router.push(`/(modals)/booking/${item.id}`)} style={{ flexDirection: 'row', flex: 1 }}>
        <Image source={{ uri: item.imageUrl }} style={styles.image} />
        <View style={styles.details}>
          <Text style={styles.title}>{item.city} ({item.location})</Text>
          <Text style={styles.price}>₹{item.price.toLocaleString('en-IN')}</Text>
        </View>
      </TouchableOpacity>

      {/* ❤️ Remove heart */}
      <TouchableOpacity onPress={() => removeFromWishlist(item.id)} style={styles.heartBtn}>
        <Ionicons name="heart" size={20} color="red" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* 🔙 Back Button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color="#000" />
        <Text style={{ fontSize: 16, marginLeft: 6 }}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.header}>Your Saved Sites</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#000" style={{ marginTop: 20 }} />
      ) : hoardings.length === 0 ? (
        <Text style={styles.empty}>You have no saved hoardings.</Text>
      ) : (
        <FlatList
          data={hoardings}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    paddingTop: 50,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    alignItems: 'center',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 10,
  },
  details: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  price: {
    fontSize: 14,
    color: 'green',
    fontWeight: '500',
  },
  heartBtn: {
    padding: 8,
    marginLeft: 10,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
    color: '#888',
  },
});
