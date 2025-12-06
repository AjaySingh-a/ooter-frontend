import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function VendorTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#000',
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: { 
          fontSize: 11,
          paddingBottom: 3,
        },
        tabBarStyle: { 
          backgroundColor: '#fff',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          borderTopWidth: 0.5,
          borderTopColor: '#ccc',
          height: 65,
          position: 'absolute',
          overflow: 'hidden',
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="listing"
        options={{
          title: 'Listing',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="list" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="booking"
        options={{
          title: 'Booking',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Payments',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="card" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          title: 'Support',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="help-circle" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
