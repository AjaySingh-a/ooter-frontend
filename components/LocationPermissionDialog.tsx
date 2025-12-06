import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

interface LocationPermissionDialogProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
  title?: string;
  description?: string;
}

const { width } = Dimensions.get('window');

export default function LocationPermissionDialog({
  visible,
  onAccept,
  onDecline,
  title = "Location Access Required",
  description
}: LocationPermissionDialogProps) {
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const tintColor = useThemeColor({}, 'tint');

  const defaultDescription = `Ooter needs access to your location to:
• Show nearby hoarding advertisements
• Provide location-based services
• Help you find relevant advertising opportunities

Your location is only used when you are actively using the app and is not shared with third parties.`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <ThemedView style={[styles.dialog, { backgroundColor }]}>
          <ThemedText style={[styles.title, { color: textColor }]}>
            {title}
          </ThemedText>
          
          <ThemedText style={[styles.description, { color: textColor }]}>
            {description || defaultDescription}
          </ThemedText>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.declineButton]}
              onPress={onDecline}
            >
              <Text style={styles.declineText}>Not Now</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.acceptButton]}
              onPress={onAccept}
            >
              <Text style={styles.acceptText}>Allow Location</Text>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    width: width * 0.9,
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'left',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  acceptButton: {
    backgroundColor: '#007AFF', // iOS blue color for better visibility
  },
  declineText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  acceptText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
