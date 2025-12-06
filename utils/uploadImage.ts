// utils/uploadImage.ts
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

export async function pickAndUploadImage(token: string): Promise<string | null> {
  // Step 1: Ask for permission
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    alert('Permission to access gallery is required!');
    return null;
  }

  // Step 2: Launch image picker
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.7,
  });

  if (result.canceled || !result.assets || !result.assets.length) {
    return null;
  }

  const image = result.assets[0];
  const uri = image.uri;
  const fileName = uri.split('/').pop() || 'image.jpg';
  const type = image.type ? `image/${fileName.split('.').pop()}` : `image`;

  const formData = new FormData();
  formData.append('file', {
    uri,
    name: fileName,
    type,
  } as any);

  try {
    const response = await axios.post(
      'http://localhost:8080/api/upload/image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data.url; // ✅ Cloudinary URL
  } catch (error: any) {
    console.error('Image upload failed:', error.response?.data || error.message);
    return null;
  }
}
