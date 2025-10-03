import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import PagerView from 'react-native-pager-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from './index';
import QuestsScreen from './quests';
import MentorsScreen from './mentors';
import PomodoroScreen from './pomodoro';
import InboxScreen from './inbox';

const { width } = Dimensions.get('window');

export default function TabLayout() {
  const [currentPage, setCurrentPage] = useState(0);
  const pagerRef = useRef<PagerView>(null);
  const insets = useSafeAreaInsets();

  const tabs = [
    { name: 'Home', icon: '🏠', component: HomeScreen },
    { name: 'Quests', icon: '📋', component: QuestsScreen },
    { name: 'Mentors', icon: '🧭', component: MentorsScreen },
    { name: 'Battle', icon: '⚔️', component: PomodoroScreen },
    { name: 'Inbox', icon: '📬', component: InboxScreen },
  ];

  const handleTabPress = (index: number) => {
    pagerRef.current?.setPage(index);
  };

  return (
    <View style={styles.container}>
      <PagerView
        style={styles.pagerView}
        initialPage={0}
        ref={pagerRef}
        onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
      >
        {tabs.map((tab, index) => (
          <View key={index} style={styles.page}>
            <tab.component />
          </View>
        ))}
      </PagerView>

      <View style={[styles.tabBar, { paddingBottom: Math.max(insets.bottom, 12), height: 70 + Math.max(insets.bottom, 12) }]}>
        {tabs.map((tab, index) => (
          <TouchableOpacity
            key={index}
            style={styles.tabItem}
            onPress={() => handleTabPress(index)}
          >
            <Text style={[styles.tabIcon, currentPage === index && styles.activeTab]}>
              {tab.icon}
            </Text>
            <Text
              style={[
                styles.tabLabel,
                currentPage === index ? styles.activeTabText : styles.inactiveTabText,
              ]}
            >
              {tab.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0a0a0a',
    borderTopColor: '#1a1a1a',
    borderTopWidth: 1,
    paddingTop: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  activeTab: {
    transform: [{ scale: 1.1 }],
  },
  activeTabText: {
    color: '#FF4444',
  },
  inactiveTabText: {
    color: '#888888',
  },
});
