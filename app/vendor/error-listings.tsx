import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ErrorListingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ERROR LISTINGS</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <Ionicons name="search" size={20} color="#fff" />
          <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
        </View>
      </View>

      {/* Active Title with minimal spacing */}
      <Text style={styles.activeTitle}>Error Listings (0)</Text>

      {/* Filters with tight spacing */}
      <View style={styles.filterRow}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.filterContainer}
        >
          <FilterButton label="A to Z" active={false} onPress={() => {}} />
          <FilterButton label="Z to A" active={false} onPress={() => {}} />
          <FilterButton label="Low to High" active={false} onPress={() => {}} />
          <FilterButton label="High to Low" active={false} onPress={() => {}} />
        </ScrollView>
      </View>

      {/* Listings with minimal top margin */}
      <ScrollView contentContainerStyle={styles.listingsContainer}>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No error hoardings currently</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function FilterButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.filterButton, active && styles.activeFilter]}
    >
      <Text style={[styles.filterText, active && styles.activeText]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f4f4f4' 
  },
  header: {
    backgroundColor: '#000',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  activeTitle: {
    fontSize: 13,
    fontWeight: '500',
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 2,
    color: '#111',
  },
  filterRow: {
    backgroundColor: '#fff',
    marginBottom: 2,
  },
  filterContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    height: 40,
    alignItems: 'center',
  },
  listingsContainer: {
    paddingBottom: 120,
    paddingTop: 20,
    alignItems: 'center',
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginRight: 6,
    borderRadius: 20,
    backgroundColor: '#eee',
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 90,
  },
  filterText: { 
    fontSize: 12, 
    color: '#444',
    fontWeight: '500',
  },
  activeFilter: { 
    backgroundColor: '#000' 
  },
  activeText: { 
    color: '#fff' 
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
});