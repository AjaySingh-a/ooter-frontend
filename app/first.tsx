import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Alert,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getToken, saveToken } from '@/utils/storage';
import axios from 'axios';
import { BASE_URL } from '@/constants/endpoints';
import Constants from 'expo-constants';

export default function FirstScreen() {
  const router = useRouter();

  useEffect(() => {
    getToken().then((token) => {
      if (token) {
        router.replace('/(tabs)');
      }
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* StatusBar with border */}
      <View style={styles.statusBar}>
        <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      </View>
      
      <ImageBackground
        source={require('@/assets/images/worldmap.jpg')}
        resizeMode="cover"
        style={styles.background}
      >
        <View style={styles.overlay}>
          <Image source={require('@/assets/images/logo.png')} style={styles.logo} />

          <Text style={styles.title}>
            Let's Get <Text style={styles.highlight}>Started !</Text>
          </Text>

          <TouchableOpacity 
            style={styles.signinBtn} 
            onPress={() => router.push('/login')}
          >
            <Text style={styles.signinText}>SIGN IN</Text>
          </TouchableOpacity>

          <View style={styles.bottomContainer}>
            <View style={styles.bottomRow}>
              <Text style={styles.bottomText}>DON'T HAVE AN ACCOUNT ?</Text>
              <TouchableOpacity 
                style={styles.signupButton}
                onPress={() => router.push('/signup')}
              >
                <Text style={styles.signupNow}>SIGN UP NOW</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBar: {
    height: Constants.statusBarHeight,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 300,
    height: 250,
    marginBottom: 32,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 28,
    fontWeight: '500',
    textAlign: 'center',
    color: '#000',
    marginBottom: 40,
  },
  highlight: {
    fontWeight: 'bold',
    color: '#4A2DD8',
  },
  signinBtn: {
    width: '80%',
    backgroundColor: '#4A2DD8',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 24,
  },
  signinText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orText: {
    color: '#000',
    marginBottom: 16,
    fontSize: 14,
  },
  bottomContainer: {
    width: '100%',
    marginTop: 'auto',
    paddingBottom: 40,
  },
  bottomRow: {
    alignItems: 'center',
  },
  bottomText: {
    fontWeight: 'bold',
    color: '#000',
    fontSize: 13,
    marginBottom: 8,
  },
  signupButton: {
    padding: 8,
  },
  signupNow: {
    color: '#4A2DD8',
    fontWeight: '600',
    fontSize: 13,
  },
});