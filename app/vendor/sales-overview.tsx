import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Modal from 'react-native-modal';
import { LinearGradient } from 'expo-linear-gradient';

const SalesOverview: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const today = new Date(); // Dynamic current date
  const [startDate, setStartDate] = useState(new Date(today.getFullYear(), 2, 1)); // March 1st of current year
  const [endDate, setEndDate] = useState(new Date(today.getFullYear(), 2, 31)); // March 31st of current year
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'end' | null>(null);

  useEffect(() => {
    console.log('Rendering SalesOverview');
  }, []);

  const onChangeDate = (type: 'start' | 'end', event: any, selectedDate?: Date) => {
    if (selectedDate) {
      const newDate = new Date(selectedDate);
      if (type === 'start') {
        // Set start date and calculate end date with 1-month gap
        newDate.setMonth(newDate.getMonth() + 1);
        const newEndDate = new Date(newDate);
        newEndDate.setDate(newDate.getDate() - 1); // Ensure 1-month gap
        setStartDate(selectedDate);
        setEndDate(newEndDate > today ? today : newEndDate);
      } else {
        // Set end date and adjust start date with 1-month gap
        newDate.setMonth(newDate.getMonth() - 1);
        const newStartDate = new Date(newDate);
        newStartDate.setDate(newDate.getDate() + 1); // Ensure 1-month gap
        setEndDate(selectedDate);
        setStartDate(newStartDate < minDate ? minDate : newStartDate);
      }
    }
    setShowDatePicker(null);
  };

  const minDate = new Date(today);
  minDate.setFullYear(today.getFullYear() - 20); // 20 years back from today

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).replace(/ /g, ' ');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar with Back Button */}
      <View style={[styles.topBar, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>MONTHLY OVERVIEW</Text>
        <View style={styles.topIcons}>
          <Ionicons name="notifications-outline" size={20} color="#000" style={{ marginRight: 16 }} />
          <Ionicons name="ellipsis-vertical" size={20} color="#000" />
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.contentContainer}>
        {/* Header with Filter */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Total Sales</Text>
        </View>

        <View style={styles.dateRange}>
          <TouchableOpacity onPress={() => setShowDatePicker('start')}>
            <Text style={styles.dateText}>{formatDate(startDate)}</Text>
          </TouchableOpacity>
          <Text style={styles.dateText}>To</Text>
          <TouchableOpacity onPress={() => setShowDatePicker('end')}>
            <Text style={styles.dateText}>{formatDate(endDate)}</Text>
          </TouchableOpacity>
        </View>

        <Modal isVisible={showDatePicker !== null} onBackdropPress={() => setShowDatePicker(null)}>
          <View style={styles.modalContainer}>
            <DateTimePicker
              value={showDatePicker === 'start' ? startDate : endDate}
              mode="date"
              display="spinner"
              onChange={(event, date) => onChangeDate(showDatePicker!, event, date)}
              minimumDate={minDate}
              maximumDate={today}
            />
          </View>
        </Modal>

        <View style={styles.divider} />

        <View style={styles.totalSalesContainer}>
          <Text style={styles.totalSalesLabel}>Total Sales</Text>
          <Text style={styles.totalSalesPeriod}>{formatDate(startDate)} - {formatDate(endDate)}</Text>
          <Text style={styles.totalSalesAmount}>₹0</Text>
          <Text style={styles.dataInfo}>31 Days Data Showing</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#000000',
    paddingVertical: 15,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  topIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  headerText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#000000',
  },
  dateRange: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#F5F5F5',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  dateText: {
    fontSize: 16,
    color: '#000000',
    marginHorizontal: 15,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#CCCCCC',
    marginVertical: 20,
  },
  totalSalesContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  totalSalesLabel: {
    fontSize: 18,
    color: '#666666',
    fontWeight: '500',
  },
  totalSalesPeriod: {
    fontSize: 16,
    color: '#888888',
    marginTop: 10,
  },
  totalSalesAmount: {
    fontSize: 36,
    fontWeight: '800',
    color: '#000000',
    marginTop: 15,
  },
  dataInfo: {
    fontSize: 14,
    color: '#888888',
    marginTop: 10,
    fontStyle: 'italic',
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  orderImage: {
    width: 30,
    height: 30,
    marginRight: 15,
  },
  orderTextContainer: {
    flex: 1,
  },
  textRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  orderDate: {
    fontSize: 14,
    color: '#666666',
    marginTop: 5,
  },
  orderAmount: {
    fontSize: 14,
    color: '#666666',
    marginTop: 5,
  },
  viewButton: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    backgroundColor: '#000000',
    borderRadius: 8,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default SalesOverview;