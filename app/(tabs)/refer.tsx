import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Image,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { BASE_URL } from '@/constants/endpoints';
import { getToken } from '@/utils/storage';
import { Ionicons, Feather, FontAwesome } from '@expo/vector-icons';

const TABS = ['Invite', 'Rewards', "FAQ's"];

export default function ReferScreen() {
  const [activeTab, setActiveTab] = useState('Invite');
  const [referralCode, setReferralCode] = useState('...');
  const [referralCoins, setReferralCoins] = useState(0);

  useEffect(() => {
    const fetchReferralDetails = async () => {
      const token = await getToken();
      if (!token) return;

      try {
        const res = await fetch(`${BASE_URL}/users/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();
        setReferralCode(data.referralCode || 'NA');
        setReferralCoins(data.referralCoins || 0);
      } catch (err) {
        Alert.alert('Error', 'Failed to load referral data.');
      }
    };

    fetchReferralDetails();
  }, []);

  const handleShare = async () => {
    try {
      const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.ajay.s_16.ooterfrontend';
      const shareMessage = `Hey! Use my OOTER referral code ${referralCode} and earn 100 coins on your first booking.\n\nDownload OOTER: ${playStoreUrl}`;
      
      await Share.share({
        message: shareMessage,
        url: Platform.OS === 'ios' ? playStoreUrl : shareMessage,
        title: 'Refer OOTER',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share code');
    }
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(referralCode);
    Alert.alert('Copied!', 'Referral code copied to clipboard.');
  };

  const handleWhatsApp = async () => {
    const message = `Join OOTER & earn 100 coins on your first booking using my referral code: ${referralCode}`;
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    try {
      await Share.share({ message: url });
    } catch (error) {
      Alert.alert('Error', 'Failed to open WhatsApp');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}>
      <Text style={styles.title}>Refer & Earn</Text>

      {/* Tab Bar */}
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={styles.tabBtn}>
            <Text
              style={[
                styles.tabText,
                activeTab === tab && { color: '#4A2DD8', fontWeight: 'bold' },
              ]}
            >
              {tab}
            </Text>
            {activeTab === tab && <View style={styles.underline} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Invite Section */}
      {activeTab === 'Invite' && (
        <>
          <View style={styles.infoBox}>
            <Text style={styles.step}>STEP - 1</Text>
            <Text style={styles.infoText}>You refer OOTER app to friend and they sign up</Text>
            <Text style={styles.step}>STEP - 2</Text>
            <Text style={styles.infoText}>
              when they buy hoarding for 1st time
            </Text>
            <View style={styles.coinRow}>
              <View style={styles.coinBlock}>
                <FontAwesome name="user-circle" size={30} color="#fff" />
                <Text style={styles.coinLabel}>You get</Text>
                <Text style={styles.coinValue}>100 COINS</Text>
              </View>
              <View style={styles.coinBlock}>
                <FontAwesome name="user-circle" size={30} color="#fff" />
                <Text style={styles.coinLabel}>Your friend get</Text>
                <Text style={styles.coinValue}>100 COINS</Text>
              </View>
            </View>
          </View>

          <Text style={styles.refLabel}>Your invite code</Text>
          <Text style={styles.refCode}>{referralCode}</Text>

          {/* Share Options */}
          <View style={styles.shareOptions}>
            <TouchableOpacity onPress={handleWhatsApp} style={styles.shareBtn}>
              <FontAwesome name="whatsapp" size={28} color="#25D366" />
              <Text style={styles.shareText}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCopy} style={styles.shareBtn}>
              <Feather name="copy" size={24} color="#333" />
              <Text style={styles.shareText}>Copy code</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
              <Ionicons name="share-social-outline" size={24} color="#333" />
              <Text style={styles.shareText}>More</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Rewards Section (optional for future) */}
      {activeTab === 'Rewards' && (
        <View style={{ marginTop: 20 }}>
          <Text>🎁 You’ve earned {referralCoins} coins from referrals.</Text>
        </View>
      )}

      {/* FAQs */}
      {activeTab === "FAQ's" && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ fontWeight: 'bold' }}>Q. How does referral work?</Text>
          <Text>A. Share your code, earn coins after your friend’s first booking.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
  tabRow: { flexDirection: 'row', marginBottom: 12 },
  tabBtn: { marginRight: 24 },
  tabText: { fontSize: 14, color: '#888' },
  underline: {
    height: 2,
    backgroundColor: '#4A2DD8',
    marginTop: 4,
    borderRadius: 10,
  },
  infoBox: {
    backgroundColor: '#1CB5E0',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  step: { color: '#fff', fontWeight: 'bold', marginTop: 8 },
  infoText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 6,
    fontWeight: '600',
  },
  coinRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 16 },
  coinBlock: { alignItems: 'center' },
  coinLabel: { color: '#fff', fontSize: 12 },
  coinValue: { color: '#fff', fontWeight: 'bold' },
  refLabel: { textAlign: 'center', fontSize: 14, color: '#444', marginTop: 8 },
  refCode: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  shareOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  shareBtn: { alignItems: 'center' },
  shareText: { fontSize: 12, marginTop: 6 },
});