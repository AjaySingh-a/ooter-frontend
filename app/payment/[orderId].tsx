import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ActivityIndicator, 
  Alert, 
  Text 
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';
import { BASE_URL } from '@/constants/endpoints';
import { getToken } from '@/utils/storage';

export default function PaymentScreen() {
  const { orderId, amount, bookingId, currency } = useLocalSearchParams<{
    orderId: string;
    amount: string;
    bookingId?: string;
    currency?: string;
  }>();
  const router = useRouter();
  
  const [state, setState] = useState({
    loading: true,
    retryCount: 0,
    verificationAttempts: 0
  });

  // Timeout for payment gateway loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (state.loading) {
        setState(prev => ({ ...prev, loading: false }));
        Alert.alert('Timeout', 'Payment gateway is taking too long to load');
      }
    }, 15000);
    
    return () => clearTimeout(timer);
  }, [state.loading]);

  // Verify payment with backend
  const verifyPaymentWithBackend = async (paymentId: string, signature: string) => {
    try {
      const token = await getToken();
      const response = await axios.post(
        `${BASE_URL}/api/payments/verify`,
        {
          razorpayOrderId: orderId,
          razorpayPaymentId: paymentId,
          razorpaySignature: signature,
          ...(bookingId && { bookingId })
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Verification failed:', error);
      throw error;
    }
  };

  // Handle payment failure scenarios
  const handlePaymentFailure = (error: string, code?: string) => {
    let message = error || 'Payment failed. Please try again.';
    
    if (code === 'INTERNATIONAL_CARD_NOT_SUPPORTED') {
      message = 'Only Indian-issued cards are accepted. Please use another card.';
    } else if (code === 'PAYMENT_CARD_INSUFFICIENT_BALANCE') {
      message = 'Insufficient balance on card. Please use another payment method.';
    }

    Alert.alert('Payment Failed', message, [
      { 
        text: 'Try Again', 
        onPress: () => {
          if (state.retryCount < 2) {
            setState(prev => ({ 
              ...prev, 
              retryCount: prev.retryCount + 1,
              loading: true 
            }));
          } else {
            router.back();
          }
        } 
      },
      { 
        text: 'Cancel', 
        style: 'destructive',
        onPress: () => router.back() 
      }
    ]);
  };

  // Process messages from WebView
  const handleMessage = async (event: { nativeEvent: { data: string } }) => {
    try {
      const result = JSON.parse(event.nativeEvent.data);
      
      switch(result.status) {
        case 'success':
          setState(prev => ({ ...prev, loading: true }));
          try {
            const verification = await verifyPaymentWithBackend(
              result.paymentId,
              result.signature
            );
            
            router.replace({
              pathname: '/payment-success',
              params: { 
                bookingId: verification.bookingId || bookingId,
                paymentId: result.paymentId
              }
            });
          } catch (error) {
            Alert.alert(
              'Verification Failed', 
              'Payment could not be confirmed with our servers'
            );
          } finally {
            setState(prev => ({ ...prev, loading: false }));
          }
          break;

        case 'failed':
          setState(prev => ({ ...prev, loading: false }));
          handlePaymentFailure(result.error, result.code);
          break;

        case 'closed':
          setState(prev => ({ ...prev, loading: false }));
          Alert.alert('Payment Cancelled', 'You closed the payment window');
          break;

        default:
          setState(prev => ({ ...prev, loading: false }));
          Alert.alert('Error', 'Received unknown payment status');
      }
    } catch (error) {
      setState(prev => ({ ...prev, loading: false }));
      Alert.alert('Error', 'Failed to process payment response');
    }
  };

  // Generate Razorpay HTML content
  const getHtmlContent = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        </head>
        <body>
          <script>
            var options = {
              key: "${process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID}",
              amount: "${Number(amount) * 100}",
              currency: "${currency || 'INR'}",
              order_id: "${orderId}",
              name: "Ooter",
              description: "${bookingId ? 'Booking ID: ' + bookingId : 'Payment'}",
              prefill: {
                email: "customer@ooter.com",
                contact: "+919876543210"
              },
              notes: {
                ${bookingId ? `bookingId: "${bookingId}"` : ''}
              },
              handler: function(response) {
                window.ReactNativeWebView.postMessage(
                  JSON.stringify({ 
                    status: 'success',
                    paymentId: response.razorpay_payment_id,
                    signature: response.razorpay_signature
                  })
                );
              },
              modal: {
                ondismiss: function() {
                  window.ReactNativeWebView.postMessage(
                    JSON.stringify({ status: 'closed' })
                  );
                }
              },
              theme: { color: "#4A2DD8" }
            };
            
            var rzp = new Razorpay(options);
            rzp.open();
            
            rzp.on('payment.failed', function(response) {
              window.ReactNativeWebView.postMessage(
                JSON.stringify({ 
                  status: 'failed',
                  error: response.error.description,
                  code: response.error.code
                })
              );
            });
          </script>
        </body>
      </html>
    `;
  };

  return (
    <View style={styles.container}>
      <WebView
        source={{ html: getHtmlContent() }}
        onMessage={handleMessage}
        onLoadEnd={() => setState(prev => ({ ...prev, loading: false }))}
        onError={() => {
          setState(prev => ({ ...prev, loading: false }));
          Alert.alert(
            'Error', 
            'Failed to load payment gateway. Please check your internet connection.'
          );
        }}
        incognito={true}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        mixedContentMode="always"
      />
      
      {state.loading && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#4A2DD8" />
          {state.retryCount > 0 && (
            <Text style={styles.retryText}>
              Attempt {state.retryCount + 1} of 3
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#fff'
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)'
  },
  retryText: {
    marginTop: 10,
    color: '#4A2DD8',
    fontSize: 14
  }
});