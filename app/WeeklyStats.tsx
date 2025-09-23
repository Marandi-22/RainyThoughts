import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router';
import moment from 'moment';
import { Calendar } from 'react-native-calendars';

const TODO_STORAGE_KEY_PREFIX = 'todo_data_';
const COMPLETED_TASKS_KEY = 'completed_tasks';

const StatsScreen = () => {
  const [level, setLevel] = useState(0);
  const [stats, setStats] = useState<{
    daily: Record<string, number>;
    weekly: Record<string, number>;
    monthly: Record<string, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [markedDates, setMarkedDates] = useState<{[date: string]: {marked: boolean, dotColor?: string}}>({});

  const calculateStats = async () => {
    setLoading(true);
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const todoKeys = allKeys.filter(key => key.startsWith(TODO_STORAGE_KEY_PREFIX));
      const completedKeysData = await AsyncStorage.getItem(COMPLETED_TASKS_KEY);
      const completedTaskIds = completedKeysData ? JSON.parse(completedKeysData) : [];

      // Ensure completedTaskIds is always an array
      if (!Array.isArray(completedTaskIds)) {
        console.error('completedTaskIds is not an array:', completedTaskIds);
        return { weeklyData: [], dailyData: [], streakData: {} };
      }

      // Level Calculation
      const totalCompleted = completedTaskIds.length;
      const calculatedLevel = Math.floor(Math.sqrt(totalCompleted / 5));
      setLevel(calculatedLevel);

      if (todoKeys.length === 0) {
        setStats({ daily: {}, weekly: {}, monthly: {} });
        setLoading(false);
        return;
      }

      // 1. Get all daily tasks and completion status
      const multiGet = await AsyncStorage.multiGet(todoKeys);
      const dailyTasks: Record<string, { total: number; completed: number }> = {};
      let firstDate = moment();

      for (const [key, value] of multiGet) {
        if (value) {
          const dateStr = key.replace(TODO_STORAGE_KEY_PREFIX, '');
          const date = moment(dateStr, 'YYYY-M-D');
          if (date.isValid()) {
            if (date.isBefore(firstDate)) {
              firstDate = date;
            }
            const tasks = JSON.parse(value);
            if (tasks.length > 0) {
              dailyTasks[dateStr] = {
                total: tasks.length,
                completed: tasks.filter((task: { id: string }) => completedTaskIds.includes(task.id)).length,
              };
            }
          }
        }
      }

      // 2. Create a full map of daily percentages from the first task until today
      const dailyPercentages: Record<string, number> = {};
      const today = moment();
      for (let m = moment(firstDate); m.isSameOrBefore(today, 'day'); m.add(1, 'days')) {
        const dateStr = m.format('YYYY-M-D');
        const dayData = dailyTasks[dateStr];
        if (dayData && dayData.total > 0) {
          dailyPercentages[dateStr] = (dayData.completed / dayData.total) * 100;
        } else {
          dailyPercentages[dateStr] = 0; // Days with no tasks count as 0%
        }
      }

      // 3. Calculate weekly stats based on daily percentages
      const weeklySums: Record<string, { sum: number; count: number, days: string[] }> = {};
      for (const dateStr in dailyPercentages) {
        const week = moment(dateStr, 'YYYY-M-D').format('YYYY-[W]WW');
        if (!weeklySums[week]) {
          weeklySums[week] = { sum: 0, count: 0, days: [] };
        }
        weeklySums[week].sum += dailyPercentages[dateStr];
        weeklySums[week].count++;
        weeklySums[week].days.push(dateStr);
      }

      const weeklyAverages: Record<string, number> = {};
      for (const week in weeklySums) {
        weeklyAverages[week] = weeklySums[week].sum / weeklySums[week].count;
      }

      // 4. Calculate monthly stats as average of weekly averages for weeks that touch the month
      const monthWeeks: Record<string, Set<string>> = {};
      for (const week in weeklySums) {
        // For each week, check which months its days touch
        const months = new Set<string>();
        for (const day of weeklySums[week].days) {
          months.add(moment(day, 'YYYY-M-D').format('YYYY-MM'));
        }
        for (const month of months) {
          if (!monthWeeks[month]) monthWeeks[month] = new Set();
          monthWeeks[month].add(week);
        }
      }

      const monthlyAverages: Record<string, number> = {};
      for (const month in monthWeeks) {
        const weeks = Array.from(monthWeeks[month]);
        const avg = weeks.reduce((sum, week) => sum + (weeklyAverages[week] || 0), 0) / weeks.length;
        monthlyAverages[month] = avg;
      }

      // Filter out days with 0% to not clutter the daily view unless they had tasks
      const filteredDaily = Object.entries(dailyPercentages)
        .filter(([date, percentage]) => dailyTasks[date] || percentage > 0)
        .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {});

      setStats({ daily: filteredDaily, weekly: weeklyAverages, monthly: monthlyAverages });

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

  const onDayPress = (day: {dateString: string}) => {
    setMarkedDates(prev => {
      const alreadyMarked = prev[day.dateString]?.marked;
      const updated = { ...prev };
      if (alreadyMarked) {
        delete updated[day.dateString];
      } else {
        updated[day.dateString] = { marked: true, dotColor: '#0f0' };
      }
      return updated;
    });
  };

  const renderProgressBar = (progress: number) => {
    const p = Math.max(0, Math.min(100, progress)); // Clamp progress between 0 and 100
    const filled = Math.round(p / 10);
    const empty = 10 - filled;
    const isGoalMet = p >= 51;
    let color = '#f00'; // Red
    if (p > 75) color = '#0f0'; // Green
    else if (p > 40) color = '#ff0'; // Yellow

    return (
      <Text style={[styles.progressBar, { color }]}>
        [{'#'.repeat(filled)}{'-'.repeat(empty)}] {p.toFixed(1)}%
        {isGoalMet && " > TARGET ACQUIRED"}
      </Text>
    );
  };

  const renderStatsSection = (title: string, data: Record<string, number>) => (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>// {title}</ThemedText>
      {Object.keys(data).length === 0 ? (
        <ThemedText style={styles.noDataText}>No data logged.</ThemedText>
      ) : (
        Object.entries(data).sort(([keyA], [keyB]) => keyB.localeCompare(keyA)).map(([key, value]) => (
          <View key={key} style={styles.statItem}>
            <ThemedText style={styles.statLabel}>{'>'} {key}:</ThemedText>
            {renderProgressBar(value)}
          </View>
        ))
      )}
    </View>
  );

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#0f0" />
        <ThemedText style={styles.loadingText}>Recalibrating progress matrix...</ThemedText>
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
        <View style={styles.levelContainer}>
            <ThemedText style={styles.levelText}>LVL: {level}</ThemedText>
        </View>
        <Calendar
          markedDates={markedDates}
          onDayPress={onDayPress}
          theme={{
            backgroundColor: '#000',
            calendarBackground: '#000',
            dayTextColor: '#0f0',
            monthTextColor: '#0f0',
            selectedDayBackgroundColor: '#111',
            selectedDayTextColor: '#0f0',
            todayTextColor: '#39FF14',
            arrowColor: '#0f0',
          }}
        />
        <ScrollView>
          {stats && renderStatsSection('DAILY_HISTORY', stats.daily)}
          {stats && renderStatsSection('WEEKLY_HISTORY', stats.weekly)}
          {stats && renderStatsSection('MONTHLY_HISTORY', stats.monthly)}
        </ScrollView>
      </ThemedView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: 24, // Add this line for extra top padding
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
    marginBottom: 10,
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
  levelContainer: {
    backgroundColor: '#111',
    borderColor: '#0f0',
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    alignItems: 'center',
  },
  levelText: {
    color: '#0f0',
    fontFamily: 'monospace',
    fontSize: 24,
    fontWeight: 'bold',
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
  noDataText: {
    color: '#666',
    fontFamily: 'monospace',
    fontStyle: 'italic',
  },
});

export default StatsScreen;