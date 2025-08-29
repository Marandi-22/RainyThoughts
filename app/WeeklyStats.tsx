import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';

const TODO_STORAGE_KEY_PREFIX = 'todo_data_';
const COMPLETED_TASKS_KEY = 'completed_tasks';

const StatsScreen = () => {
  const [stats, setStats] = useState<{
    daily: Record<string, number>;
    weekly: Record<string, number>;
    monthly: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const calculateStats = async () => {
    setLoading(true);
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const todoKeys = allKeys.filter(key => key.startsWith(TODO_STORAGE_KEY_PREFIX));
      const completedKeysData = await AsyncStorage.getItem(COMPLETED_TASKS_KEY);
      const completedTaskIds = completedKeysData ? JSON.parse(completedKeysData) : [];

      const dailyTotals: Record<string, number> = {};
      const dailyCompleted: Record<string, number> = {};

      const multiGet = await AsyncStorage.multiGet(todoKeys);

      for (const [key, value] of multiGet) {
        if (value) {
          const date = key.replace(TODO_STORAGE_KEY_PREFIX, '');
          const tasks = JSON.parse(value);
          dailyTotals[date] = tasks.length;
          dailyCompleted[date] = tasks.filter((task: { id: string }) => completedTaskIds.includes(task.id)).length;
        }
      }

      const daily: Record<string, number> = {};
      const weekly: Record<string, { total: number; completed: number }> = {};
      const monthly: Record<string, { total: number; completed: number }> = {};

      for (const date in dailyTotals) {
        if (dailyTotals[date] > 0) {
          daily[date] = (dailyCompleted[date] / dailyTotals[date]) * 100;
        } else {
          daily[date] = 0;
        }

        const d = new Date(date);
        const week = `${d.getFullYear()}-W${getWeekNumber(d)}`;
        const month = `${d.getFullYear()}-${d.getMonth() + 1}`;

        if (!weekly[week]) weekly[week] = { total: 0, completed: 0 };
        weekly[week].total += dailyTotals[date];
        weekly[week].completed += dailyCompleted[date];

        if (!monthly[month]) monthly[month] = { total: 0, completed: 0 };
        monthly[month].total += dailyTotals[date];
        monthly[month].completed += dailyCompleted[date];
      }

      const weeklyPercentages: Record<string, number> = {};
      for (const week in weekly) {
        weeklyPercentages[week] = (weekly[week].completed / weekly[week].total) * 100;
      }

      const monthlyPercentages: Record<string, number> = {};
      for (const month in monthly) {
        monthlyPercentages[month] = (monthly[month].completed / monthly[month].total) * 100;
      }

      setStats({ daily, weekly: weeklyPercentages, monthly: monthlyPercentages });
    } catch (error) {
      console.error("Failed to calculate stats", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      calculateStats();
    }, [])
  );

  const getWeekNumber = (d: Date) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.valueOf() - yearStart.valueOf()) / 86400000) + 1) / 7);
    return weekNo;
  };

  const renderProgressBar = (progress: number) => {
    const filled = Math.round(progress / 10);
    const empty = 10 - filled;
    const isGoalMet = progress >= 51;
    return (
      <Text style={[styles.progressBar, isGoalMet ? styles.goalMet : styles.goalNotMet]}>
        [{'#'.repeat(filled)}{'-'.repeat(empty)}] {progress.toFixed(1)}%
        {isGoalMet && " > TARGET ACQUIRED"}
      </Text>
    );
  };

  const renderStatsSection = (title: string, data: Record<string, number>) => (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>// {title}</ThemedText>
      {Object.entries(data).sort().reverse().map(([key, value]) => (
        <View key={key} style={styles.statItem}>
          <ThemedText style={styles.statLabel}>{'>'} {key}:</ThemedText>
          {renderProgressBar(value)}
        </View>
      ))}
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#0f0" />
        <ThemedText style={styles.loadingText}>Compiling mission data...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>SYSTEM_STATS</ThemedText>
          <Link href="/(tabs)/todo" asChild>
            <TouchableOpacity style={styles.backButton}>
              <ThemedText style={styles.backButtonText}>&lt; Back</ThemedText>
            </TouchableOpacity>
          </Link>
        </View>
        <ScrollView>
          {stats && renderStatsSection('DAILY_LOG', stats.daily)}
          {stats && renderStatsSection('WEEKLY_SUMMARY', stats.weekly)}
          {stats && renderStatsSection('MONTHLY_OVERVIEW', stats.monthly)}
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#000',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#0f0',
    fontFamily: 'monospace',
    fontSize: 28,
  },
  backButton: {
    borderColor: '#0f0',
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  backButtonText: {
    color: '#0f0',
    fontFamily: 'monospace',
  },
  loadingText: {
    marginTop: 10,
    color: '#0f0',
    fontFamily: 'monospace',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    color: '#0f0',
    fontSize: 20,
    fontFamily: 'monospace',
    marginBottom: 10,
    borderBottomColor: '#0f0',
    borderBottomWidth: 1,
    paddingBottom: 5,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    color: '#fff',
    fontFamily: 'monospace',
    fontSize: 16,
  },
  progressBar: {
    fontFamily: 'monospace',
    fontSize: 16,
  },
  goalMet: {
    color: '#0f0', // Green
  },
  goalNotMet: {
    color: '#f00', // Red
  },
});

export default StatsScreen;