import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  isBefore,
  isAfter,
  parseISO,
  differenceInDays,
} from 'date-fns';

type BookedDateRange = {
  startDate: string;
  endDate: string;
};

type CalendarProps = {
  bookedRanges: BookedDateRange[];
  onDatesSelected: (start: Date | null, end: Date | null) => void;
  initialStart?: Date | null;
  initialEnd?: Date | null;
  minBookingDays?: number;
  maxBookingDays?: number;
};

const UltimateCalendar: React.FC<CalendarProps> = ({
  bookedRanges,
  onDatesSelected,
  initialStart = null,
  initialEnd = null,
  minBookingDays = 1,
  maxBookingDays = 365,
}) => {
  const [startDate, setStartDate] = useState<Date | null>(initialStart);
  const [endDate, setEndDate] = useState<Date | null>(initialEnd);
  const [currentDate] = useState(new Date());
  const [months, setMonths] = useState<Date[]>([]);
  const [loading, setLoading] = useState(false);
  const [localBookedRanges, setLocalBookedRanges] = useState<BookedDateRange[]>(bookedRanges);

  // Sync bookedRanges with local state
  useEffect(() => {
    setLocalBookedRanges(bookedRanges);
  }, [bookedRanges]);

  // Initialize 24 months (current + 23 future months)
  useEffect(() => {
    const initialMonths: Date[] = [];
    initialMonths.push(currentDate);
    for (let i = 1; i < 24; i++) {
      initialMonths.push(addMonths(currentDate, i));
    }
    setMonths(initialMonths);
  }, []);

  // Convert booked ranges to Date objects
  const bookedIntervals = useCallback(() => {
    return localBookedRanges.map(range => ({
      start: parseISO(range.startDate),
      end: parseISO(range.endDate),
    }));
  }, [localBookedRanges]);

  // Check if date is booked
  const isBooked = useCallback(
    (date: Date) => {
      const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
      const istDate = new Date(date.getTime() + istOffset);
      const intervals = bookedIntervals();
      return intervals.some(interval => {
        const start = new Date(new Date(interval.start).getTime() + istOffset);
        const end = new Date(new Date(interval.end).getTime() + istOffset);
        const isWithin = isWithinInterval(istDate, { start, end });
        const isStart = isSameDay(istDate, start);
        const isEnd = isSameDay(istDate, end);
        return isWithin || isStart || isEnd;
      });
    },
    [bookedIntervals]
  );

  // Check if date is in selected range
  const isInRange = useCallback(
    (date: Date) => {
      if (!startDate || !endDate) return false;
      return isWithinInterval(date, { start: startDate, end: endDate });
    },
    [startDate, endDate]
  );

  // Check if date is start date
  const isStart = useCallback(
    (date: Date) => {
      return startDate ? isSameDay(date, startDate) : false;
    },
    [startDate]
  );

  // Check if date is end date
  const isEnd = useCallback(
    (date: Date) => {
      return endDate ? isSameDay(date, endDate) : false;
    },
    [endDate]
  );

  // Handle date selection with all validations
  const handleDatePress = useCallback(
    (date: Date) => {
      const minStartDate = addDays(new Date(), 4); // Minimum start date is 4 days from today

      if (isBooked(date)) {
        Alert.alert('Unavailable Date', 'This date is already booked');
        return;
      }

      if ((!startDate || (startDate && endDate)) && isBefore(date, minStartDate)) {
        Alert.alert('Invalid Date', 'Start date must be at least 4 days from today');
        return;
      }

      if (!startDate || (startDate && endDate)) {
        setStartDate(date);
        setEndDate(null);
        onDatesSelected(date, null);
        return;
      }

      if (startDate && !endDate) {
        if (isBefore(date, startDate)) {
          if (isBefore(date, minStartDate)) {
            Alert.alert('Invalid Date', 'Start date must be at least 4 days from today');
            return;
          }
          setStartDate(date);
          setEndDate(null);
          onDatesSelected(date, null);
          return;
        }

        const daysSelected = differenceInDays(date, startDate) + 1;
        if (daysSelected < minBookingDays) {
          Alert.alert('Minimum Stay', `Please select at least ${minBookingDays} day${minBookingDays > 1 ? 's' : ''}`);
          return;
        }

        if (daysSelected > maxBookingDays) {
          Alert.alert('Maximum Stay', `You can book maximum ${maxBookingDays} day${maxBookingDays > 1 ? 's' : ''}`);
          return;
        }

        const rangeDays = eachDayOfInterval({ start: startDate, end: date });
        if (rangeDays.some(day => isBooked(day))) {
          Alert.alert('Booked Dates', 'Your selection includes unavailable dates');
          return;
        }

        setEndDate(date);
        onDatesSelected(startDate, date);
      }
    },
    [startDate, endDate, isBooked, minBookingDays, maxBookingDays, onDatesSelected]
  );

  // Generate days for a month including padding days
  const getMonthDays = useCallback((month: Date) => {
    const start = startOfWeek(startOfMonth(month));
    const end = endOfWeek(endOfMonth(month));
    return eachDayOfInterval({ start, end });
  }, []);

  // Render a single month
  const renderMonth = useCallback(
    (month: Date) => {
      const days = getMonthDays(month);
      const monthName = format(month, 'MMMM yyyy');
      const isPastMonth = isBefore(endOfMonth(month), new Date());
      const minStartDate = addDays(new Date(), 4);

      return (
        <View key={monthName} style={styles.monthContainer}>
          <Text style={[styles.monthHeader, isPastMonth && styles.pastMonthHeader]}>
            {monthName}
          </Text>
          <View style={styles.weekDays}>
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
              <Text key={day} style={styles.weekDayText}>{day}</Text>
            ))}
          </View>
          <View style={styles.daysGrid}>
            {days.map((day, index) => {
              const isCurrentMonth = isSameMonth(day, month);
              const isBookedDate = isBooked(day) || false;
              const isPastDate = isBefore(day, new Date()) || false;
              const isTooEarly = (!startDate || (startDate && endDate)) && isBefore(day, minStartDate) || false;
              const isDisabled = !isCurrentMonth || isBookedDate || isPastDate || isTooEarly;
              const isSelected = isInRange(day);
              const isStartDate = isStart(day);
              const isEndDate = isEnd(day);
              const isToday = isSameDay(day, new Date());

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    !isCurrentMonth && styles.nonMonthDay,
                    isDisabled && styles.disabledDay,
                    isStartDate && styles.startDay,
                    isEndDate && styles.endDay,
                    isSelected && !isStartDate && !isEndDate && styles.rangeDay,
                    isToday && styles.today,
                  ]}
                  onPress={() => isCurrentMonth && !isBookedDate && handleDatePress(day)}
                  disabled={isDisabled}
                >
                  <Text
                    style={[
                      styles.dayText,
                      !isCurrentMonth && styles.nonMonthDayText,
                      isDisabled && styles.disabledText,
                      (isStartDate || isEndDate) && styles.selectedDayText,
                      isToday && styles.todayText,
                    ]}
                  >
                    {format(day, 'd')}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      );
    },
    [getMonthDays, isBooked, isInRange, isStart, isEnd, handleDatePress]
  );

  // Load more months when scrolling
  const loadMoreMonths = () => {
    if (loading || months.length >= 60) return;

    setLoading(true);
    const newMonths: Date[] = [];
    const lastMonth = months[months.length - 1];

    for (let i = 1; i <= 12; i++) {
      newMonths.push(addMonths(lastMonth, i));
    }

    setMonths(prev => [...prev, ...newMonths]);
    setLoading(false);
  };

  return (
    <FlatList
      data={months}
      renderItem={({ item }) => renderMonth(item)}
      keyExtractor={(item) => item.toString()}
      initialNumToRender={6}
      maxToRenderPerBatch={6}
      windowSize={10}
      onEndReached={loadMoreMonths}
      onEndReachedThreshold={0.5}
      ListFooterComponent={loading ? <ActivityIndicator /> : null}
      contentContainerStyle={styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  monthContainer: {
    marginBottom: 25,
  },
  monthHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
    color: '#4A2DD8',
  },
  pastMonthHeader: {
    color: '#888',
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekDayText: {
    width: 32,
    textAlign: 'center',
    fontWeight: '500',
    color: '#666',
    fontSize: 12,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dayCell: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 16,
  },
  dayText: {
    fontSize: 14,
    color: '#333',
  },
  nonMonthDay: {
    opacity: 0.3,
  },
  nonMonthDayText: {
    color: '#999',
  },
  disabledDay: {
    backgroundColor: '#f5f5f5',
    opacity: 0.5,
  },
  disabledText: {
    color: '#bdbdbd',
    textDecorationLine: 'line-through',
    fontStyle: 'italic',
  },
  startDay: {
    backgroundColor: '#4A2DD8',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  endDay: {
    backgroundColor: '#4A2DD8',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  rangeDay: {
    backgroundColor: '#E3F2FD',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  today: {
    borderWidth: 1,
    borderColor: '#4A2DD8',
  },
  todayText: {
    color: '#4A2DD8',
    fontWeight: 'bold',
  },
});

export default UltimateCalendar;