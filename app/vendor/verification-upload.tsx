import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { BASE_URL } from '@/constants/endpoints';
import { getToken } from '@/utils/storage';
import { useRouter } from 'expo-router';

// Cloudinary upload helper for PDFs only
const uploadPdfToCloudinary = async (uri: string, fileName: string): Promise<string | null> => {
  const formData = new FormData();
  formData.append('file', {
    uri,
    type: 'application/pdf',
    name: fileName,
  } as any);
  
  formData.append('upload_preset', 'ooter_upload');
  formData.append('resource_type', 'raw'); // Explicitly set resource type for PDFs
  
  try {
    const res = await fetch('https://api.cloudinary.com/v1_1/dj6qosspd/raw/upload', {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - let fetch set it automatically with boundary
    });
    
    // Check if response is OK
    if (!res.ok) {
      const errorData = await res.json();
      console.error('Cloudinary upload failed:', errorData);
      return null;
    }
    
    const data = await res.json();
    console.log('Cloudinary PDF upload response:', data);
    
    // Check if secure_url exists
    if (!data.secure_url) {
      console.error('No secure_url in response:', data);
      return null;
    }
    
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary PDF upload error:', error);
    return null;
  }
};

export default function VerificationUpload() {
  const [gstFile, setGstFile] = useState<any>(null);
  const [cinFile, setCinFile] = useState<any>(null);
  const [allotmentFile, setAllotmentFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const pickFile = async (type: 'GST' | 'CIN' | 'ALLOTMENT') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf', // Only PDF files
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) {
        console.log('Document picker canceled or no assets');
        return;
      }

      const file = result.assets[0];
      console.log('Selected file:', file);
      
      // Validate that it's actually a PDF
      if (!file.mimeType || !file.mimeType.includes('pdf')) {
        Alert.alert('Invalid File', 'Please select a PDF file only.');
        return;
      }
      
      // Validate file size (10MB limit for Cloudinary free plan)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size && file.size > maxSize) {
        Alert.alert('File Too Large', 'File size must be less than 10MB. Please select a smaller file.');
        return;
      }
      
      if (type === 'GST') {
        setGstFile(file);
      } else if (type === 'CIN') {
        setCinFile(file);
      } else if (type === 'ALLOTMENT') {
        setAllotmentFile(file);
      }
    } catch (error) {
      console.error('Error picking file:', error);
      Alert.alert('Error', 'Failed to pick file. Please try again.');
    }
  };

  const uploadVerification = async () => {
    if (!gstFile) {
      Alert.alert('Required', 'Please upload GST Certificate.');
      return;
    }

    setLoading(true);
    const token = await getToken();

    if (!token) {
      Alert.alert('Unauthorized', 'Please login again.');
      setLoading(false);
      return;
    }

    try {
      // 1. Upload GST to Cloudinary
      const gstUrl = await uploadPdfToCloudinary(gstFile.uri, gstFile.name);
      
      if (!gstUrl) {
        Alert.alert(
          'Upload Failed', 
          'GST certificate upload to Cloudinary failed. Please check:\n1. File size is under 10MB\n2. File is a valid PDF\n3. Internet connection is stable'
        );
        setLoading(false);
        return;
      }

      // 2. Upload CIN if exists
      let cinUrl = null;
      if (cinFile) {
        cinUrl = await uploadPdfToCloudinary(cinFile.uri, cinFile.name);
        if (!cinUrl) {
          Alert.alert('Upload Failed', 'CIN certificate upload to Cloudinary failed.');
          setLoading(false);
          return;
        }
      }

      // 3. Upload Allotment if exists
      let allotmentUrl = null;
      if (allotmentFile) {
        allotmentUrl = await uploadPdfToCloudinary(allotmentFile.uri, allotmentFile.name);
        if (!allotmentUrl) {
          Alert.alert('Upload Failed', 'Allotment certificate upload to Cloudinary failed.');
          setLoading(false);
          return;
        }
      }

      // 4. Send URLs to backend
      const response = await fetch(`${BASE_URL}/api/users/upload-certificates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          gstCertificateUrl: gstUrl,
          cinCertificateUrl: cinUrl,
          allotmentCertificateUrl: allotmentUrl,
        }),
      });

      // Check if response has JSON content
      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error('Failed to parse response:', e);
        Alert.alert('Error', 'Failed to submit verification. Please try again.');
        setLoading(false);
        return;
      }

      if (response.ok) {
        Alert.alert('Success', 'Verification submitted successfully!');
        router.replace('/vendor');
      } else {
        const errorMessage = data.message || data.error || 'Upload failed. Please try again.';
        console.error('Backend error:', data);
        Alert.alert('Error', errorMessage);
      }
    } catch (e) {
      console.error('Upload error:', e);
      Alert.alert('Error', 'Failed to submit verification. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#fff" barStyle="dark-content" />
      
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Certificates</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* GST Certificate */}
        <Text style={styles.label}>GST Certificate *</Text>
        <TouchableOpacity
          style={styles.uploadBox}
          onPress={() => pickFile('GST')}
          disabled={loading}
        >
          {gstFile ? (
            <View style={styles.fileInfo}>
              <Ionicons name="document-text-outline" size={24} color="#333" />
              <Text style={styles.fileName} numberOfLines={1}>{gstFile.name}</Text>
            </View>
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={30} color="#888" />
              <Text style={styles.uploadText}>Tap to upload GST Certificate</Text>
              <Text style={styles.uploadSubText}>(PDF only)</Text>
            </>
          )}
        </TouchableOpacity>

        {/* CIN Certificate */}
        <Text style={styles.label}>CIN Certificate</Text>
        <TouchableOpacity
          style={styles.uploadBox}
          onPress={() => pickFile('CIN')}
          disabled={loading}
        >
          {cinFile ? (
            <View style={styles.fileInfo}>
              <Ionicons name="document-text-outline" size={24} color="#333" />
              <Text style={styles.fileName} numberOfLines={1}>{cinFile.name}</Text>
            </View>
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={30} color="#888" />
              <Text style={styles.uploadText}>Tap to upload CIN Certificate</Text>
              <Text style={styles.uploadSubText}>(PDF only)</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Allotment Certificate */}
        <Text style={styles.label}>Allotment letter provided by Government</Text>
        <TouchableOpacity
          style={styles.uploadBox}
          onPress={() => pickFile('ALLOTMENT')}
          disabled={loading}
        >
          {allotmentFile ? (
            <View style={styles.fileInfo}>
              <Ionicons name="document-text-outline" size={24} color="#333" />
              <Text style={styles.fileName} numberOfLines={1}>{allotmentFile.name}</Text>
            </View>
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={30} color="#888" />
              <Text style={styles.uploadText}>Tap to upload Allotment Certificate</Text>
              <Text style={styles.uploadSubText}>(PDF only)</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.spacer} />

        <TouchableOpacity
          style={[styles.button, (!gstFile || loading) && styles.buttonDisabled]}
          disabled={!gstFile || loading}
          onPress={uploadVerification}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Submit Verification</Text>
          )}
        </TouchableOpacity>
        
        {/* Extra padding at bottom */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerRightPlaceholder: {
    width: 32,
  },
  container: { 
    padding: 20,
    paddingTop: 12,
  },
  title: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 20,
    color: '#000',
  },
  label: { 
    fontSize: 14, 
    marginBottom: 8, 
    color: '#333',
    fontWeight: '500',
  },
  uploadBox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
    backgroundColor: '#f9f9f9',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  fileName: { 
    fontSize: 14, 
    color: '#333',
    marginLeft: 8,
    flex: 1,
  },
  uploadText: {
    fontSize: 12,
    color: '#888',
    marginTop: 8,
  },
  uploadSubText: {
    fontSize: 10,
    color: '#aaa',
    marginTop: 2,
  },
  button: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    marginTop: 20,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  spacer: {
    flex: 1,
  },
  bottomSpacer: {
    height: 20,
  },
});