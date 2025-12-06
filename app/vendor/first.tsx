import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function VendorWelcomeScreen() {
  const router = useRouter();

  const handleBackPress = () => {
    // ✅ Always go back to user tabs, not vendor dashboard
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleBackPress} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={22} color="#000" />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Image
        source={require('@/assets/images/firstscreen.png')}
        style={styles.image}
        resizeMode="contain"
      />
      <Text style={styles.title}>Welcome.</Text>
      <Text style={styles.subtitle}>to the OOTER vendor program</Text>

      <TouchableOpacity style={styles.button} onPress={() => router.push('/vendor/details')}>
        <Text style={styles.buttonText}>Let's Start</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F4F4', padding: 20, justifyContent: 'center' },
  image: { width: '100%', height: 220, marginBottom: 40 },
  title: { fontSize: 30, fontWeight: 'bold' },
  subtitle: { fontSize: 16, marginBottom: 30 },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  backBtn: { flexDirection: 'row', alignItems: 'center', position: 'absolute', top: 50, left: 20 },
  backText: { marginLeft: 4, fontSize: 16 },
});
