// components/HoardingImage.tsx
import React from 'react';
import { Image, StyleSheet, View, ActivityIndicator, ViewStyle, ImageStyle } from 'react-native';

interface HoardingImageProps {
  publicId: string;
  width?: number;
  height?: number;
  borderRadius?: number;
  style?: ImageStyle;
}

const HoardingImage: React.FC<HoardingImageProps> = ({
  publicId,
  width = 300,
  height = 180,
  borderRadius = 12,
  style,
}) => {
  const cloudName = 'dj6qosspd';

  if (!publicId) {
    return (
      <View style={[styles.placeholder, { width, height, borderRadius }]}>
        <ActivityIndicator color="#aaa" />
      </View>
    );
  }

  // Check if publicId is already a full URL
  let imageUrl;
  if (publicId.startsWith('http')) {
    // It's already a full URL, use it directly
    imageUrl = publicId;
  } else {
    // For Cloudinary, use a reasonable width for the API call
    // The actual display width will be controlled by the style
    const apiWidth = typeof width === 'number' ? width : 360;
    const apiHeight = typeof height === 'number' ? height : 180;
    imageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/w_${apiWidth},h_${apiHeight},c_fill,q_auto,f_auto/${publicId}`;
  }

  return (
    <Image
      source={{ uri: imageUrl }}
      style={[{ width, height, borderRadius }, style]}
      resizeMode="cover"
      onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
    />
  );
};

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HoardingImage;