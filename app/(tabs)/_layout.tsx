// app/(tabs)/_layout.tsx
import { useColorScheme } from '@/hooks/useColorScheme';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets(); // <-- Add this

  const neonColor = '#39FF14';
  const dimColor = '#00FF41AA';

  const TabLabel = ({ label }: { label: string }) => (
    <Text style={{ color: neonColor, fontSize: 12, textShadowColor: dimColor, textShadowRadius: 4 }}>
      {label}
    </Text>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: neonColor,
        tabBarInactiveTintColor: dimColor,
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
            backgroundColor: '#101010EE',
            borderTopWidth: 0,
            elevation: 0,
            paddingBottom: insets.bottom, // <-- Add safe area
          },
          default: {},
        }),
        tabBarLabelStyle: {
          fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
          fontSize: 13,
          textShadowColor: dimColor,
          textShadowOffset: { width: 0, height: 0 },
          textShadowRadius: 6,
        },
      }}
    >
      {/* Index route - this will be the default home screen */}
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: () => <TabLabel label="🏠" /> }}
      />
      <Tabs.Screen
        name="pomodoro"
        options={{ title: 'Pomodoro', tabBarIcon: () => <TabLabel label="⏱️" /> }}
      />
      <Tabs.Screen
        name="journal"
        options={{ title: 'Journal', tabBarIcon: () => <TabLabel label="📓" /> }}
      />
      <Tabs.Screen
        name="todo"
        options={{ title: 'To-Do', tabBarIcon: () => <TabLabel label="📋" /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarBackground: {
    backgroundColor: '#101010EE',
    borderTopWidth: 0,
    flex: 1,
  },
});