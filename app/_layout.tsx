import { Stack } from 'expo-router';

export default function RootLayout() {
  const StackComponent = Stack as any;
  
  return (
    <StackComponent screenOptions={{ headerShown: false }}>
      <StackComponent.Screen name="index" />
      <StackComponent.Screen name="first" />
      <StackComponent.Screen name="login" />
      <StackComponent.Screen name="signup" />
      <StackComponent.Screen name="(tabs)" />
      <StackComponent.Screen name="vendor" />
    </StackComponent>
  );
}