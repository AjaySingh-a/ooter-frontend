import { View, Text, Button } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function PaymentSuccess() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();

  const handleViewBookings = () => {
    // Match EXACTLY with your file name (booking.tsx)
    router.replace({
      pathname: '/(tabs)/booking', // Singular "booking" to match your file
    });
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>
        Booking confirmed! ID: {bookingId}
      </Text>
      <Button 
        title="View Bookings" 
        onPress={handleViewBookings} 
      />
    </View>
  );
}