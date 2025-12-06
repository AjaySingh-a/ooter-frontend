// app/_drawer.tsx

import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import CustomDrawerContent from '@/components/CustomDrawer';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5, Entypo } from '@expo/vector-icons';

const Drawer = createDrawerNavigator();

function MainTabs() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2DC653',
        tabBarInactiveTintColor: '#999',
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
        tabBarLabelStyle: {
          fontSize: 11,
          paddingBottom: 3,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <Ionicons name="search" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="booking"
        options={{
          title: 'Booking',
          tabBarIcon: ({ color }) => (
            <FontAwesome5 name="suitcase-rolling" size={18} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="refer"
        options={{
          title: 'Refer & Earn',
          tabBarIcon: ({ color }) => <Entypo name="megaphone" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          title: 'Support',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="support-agent" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

export default function DrawerLayout() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        overlayColor: 'transparent',
        drawerStyle: {
          width: '75%',
          backgroundColor: '#fff',
        },
      }}
    >
      <Drawer.Screen name="MainTabs" component={MainTabs} />
    </Drawer.Navigator>
  );
}