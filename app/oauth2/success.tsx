import React, { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import * as SecureStore from "expo-secure-store";
import { useRouter, useLocalSearchParams } from "expo-router";

const SuccessPage = () => {
  const router = useRouter();
  const { code } = useLocalSearchParams();

  const actualCode = Array.isArray(code) ? code[0] : code;

  useEffect(() => {
    if (actualCode) {
      SecureStore.setItemAsync("oauth_code", actualCode)
        .then(() => {
          router.replace("/"); // redirect to home or dashboard
        })
        .catch((err) => {
          console.error("Failed to store code:", err);
        });
    }
  }, [actualCode]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text style={styles.text}>Signing you in...</Text>
    </View>
  );
};

export default SuccessPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
  },
});
