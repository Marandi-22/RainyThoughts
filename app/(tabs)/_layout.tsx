// app/(tabs)/_layout.tsx
import { useColorScheme } from '@/hooks/useColorScheme';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets(); // <-- Add this

  const activeColor = '#FF4444';
  const inactiveColor = '#666666';

  const TabLabel = ({ label }: { label: string }) => (
    <Text style={{ color: activeColor, fontSize: 12, textShadowColor: activeColor, textShadowRadius: 4 }}>
      {label}
    </Text>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarBackground: () => <View style={styles.tabBarBackground} />,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
            height: 70 + insets.bottom, // <-- Add safe area
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            paddingBottom: insets.bottom, // <-- Add safe area
          },
          android: {
            height: 70 + insets.bottom, // <-- Add safe area
            backgroundColor: '#000000EE',
            borderTopWidth: 0,
            elevation: 0,
            paddingBottom: insets.bottom, // <-- Add safe area
          },
          default: {},
        }),
        tabBarLabelStyle: {
          fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
          fontSize: 13,
          textShadowColor: activeColor,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 6,
        },
      }}
    >
      {/* Index route - this will be the default home screen */}
      <Tabs.Screen
        name="index"
        options={{ title: 'Hero', tabBarIcon: () => <TabLabel label="🔥" /> }}
      />
      <Tabs.Screen
        name="pomodoro"
        options={{ title: 'Battle', tabBarIcon: () => <TabLabel label="⚔️" /> }}
      />
      <Tabs.Screen
        name="journal"
        options={{ title: 'Grimoire', tabBarIcon: () => <TabLabel label="📜" /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarBackground: {
    backgroundColor: '#000000EE',
    borderTopWidth: 1,
    borderTopColor: '#FF4444',
    flex: 1,
  },
});