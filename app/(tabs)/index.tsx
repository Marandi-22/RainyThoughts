import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Platform, FlatList, TextInput, TouchableOpacity, Alert, ScrollView, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import moment from 'moment';
import { useTracking } from '@/hooks/useTracking';

interface Goal {
  id: string;
  text: string;
}

interface LogEntry {
  id: string;
  text: string;
  date: string;
}

const DOB = moment('2003-12-22'); // your DOB
const LIFESPAN_YEARS = 30;

const HomeScreen: React.FC = () => {
  const { weeklyStats, updateWeeklyStats } = useTracking();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [insights, setInsights] = useState<LogEntry[]>([]);
  const [quotes, setQuotes] = useState<LogEntry[]>([]);
  const [insightIndex, setInsightIndex] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState('');

  // Load goals
  useEffect(() => {
    const loadGoals = async () => {
      const storedGoals = await AsyncStorage.getItem('mainGoals');
      if (storedGoals) setGoals(JSON.parse(storedGoals));
    };
    loadGoals();
  }, []);

  const saveGoals = async (updatedGoals: Goal[]) => {
    setGoals(updatedGoals);
    await AsyncStorage.setItem('mainGoals', JSON.stringify(updatedGoals));
  };

  const addGoal = () => {
    if (!newGoal.trim()) return;
    const updatedGoals = [...goals, { id: Date.now().toString(), text: newGoal.trim() }];
    saveGoals(updatedGoals);
    setNewGoal('');
  };

  const deleteGoal = (id: string) => {
    Alert.alert('Delete Goal', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => saveGoals(goals.filter(g => g.id !== id)) },
    ]);
  };

  // Load all insights & quotes from journals
  useEffect(() => {
    const loadData = async () => {
      const insightsData = await AsyncStorage.getItem('insights');
      if (insightsData) {
        const insightsArr: LogEntry[] = JSON.parse(insightsData);
        setInsights(insightsArr);
      }
      const quotesData = await AsyncStorage.getItem('quotes');
      if (quotesData) {
        const quotesArr: LogEntry[] = JSON.parse(quotesData);
        setQuotes(quotesArr);
      }
    };
    loadData();
  }, []);

  // Rotate insight & quote every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setInsightIndex(prev => insights.length ? (prev + 1) % insights.length : 0);
      setQuoteIndex(prev => quotes.length ? (prev + 1) % quotes.length : 0);
    }, 10000);
    return () => clearInterval(interval);
  }, [insights.length, quotes.length]);

  // Life countdown
  useEffect(() => {
    const interval = setInterval(() => {
      const deathDate = DOB.clone().add(LIFESPAN_YEARS, 'years');
      const now = moment();
      const duration = moment.duration(deathDate.diff(now));
      if (duration.asMilliseconds() <= 0) {
        setTimeLeft('💀 Time is up 💀');
        clearInterval(interval);
        return;
      }
      setTimeLeft(
        `${Math.floor(duration.asYears())}y ${duration.months()}m ${duration.days()}d ${duration.hours()}h ${duration.minutes()}m ${duration.seconds()}s`
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Load weekly stats
  useEffect(() => {
    updateWeeklyStats();
  }, []);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Memento Mori */}
        <View style={styles.mementoContainer}>
          <Text style={styles.skull}>☠️</Text>
          <Text style={styles.mementoText}>Memento Mori: Your life is slipping away</Text>
          <Text style={styles.timeLeft}>{timeLeft}</Text>
          <View style={styles.lifeBarBackground}>
            <View
              style={[
                styles.lifeBarFill,
                {
                  flex: Math.max(
                    0,
                    1 - moment().diff(DOB, 'seconds') / DOB.clone().add(LIFESPAN_YEARS, 'years').diff(DOB, 'seconds')
                  ),
                },
              ]}
            />
          </View>
        </View>

        {/* Insights */}
        {insights.length > 0 && (
          <View style={styles.widget}>
            <ThemedText type="subtitle" style={styles.widgetTitle}>💡 Insight</ThemedText>
            <Text style={styles.widgetText}>{insights[insightIndex]?.text}</Text>
          </View>
        )}

        {/* Quotes */}
        {quotes.length > 0 && (
          <View style={styles.widget}>
            <ThemedText type="subtitle" style={styles.widgetTitle}>📝 Quote</ThemedText>
            <Text style={styles.widgetText}>{quotes[quoteIndex]?.text}</Text>
          </View>
        )}

        {/* Goals */}
        <Text style={styles.sectionTitle}>🎯 Your Main Goals</Text>
                {goals.length === 0 ? (
          <Text style={styles.placeholder}>Add your first goal below 👇</Text>
        ) : (
          goals.map(item => (
            <View key={item.id} style={styles.goalItem}>
              <Text style={styles.goalText}>{item.text}</Text>
              <TouchableOpacity onPress={() => deleteGoal(item.id)}>
                <Text style={styles.deleteText}>❌</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
        <View style={styles.addGoalContainer}>
          <TextInput
            placeholder="New Goal..."
            placeholderTextColor="#888"
            style={styles.input}
            value={newGoal}
            onChangeText={setNewGoal}
          />
          <TouchableOpacity onPress={addGoal} style={styles.addButton}>
            <Text style={styles.addButtonText}>➕</Text>
          </TouchableOpacity>
        </View>

        {/* Weekly Progress */}
        <Text style={styles.sectionTitle}>📊 Weekly Progress</Text>
        {weeklyStats.map((item) => {
          let barColor = '#ff5555'; // red by default
          if (item.progress >= 70) barColor = '#0f0'; // green
          else if (item.progress >= 40) barColor = '#ff0'; // yellow

          return (
            <View key={`${item.year}-${item.week}`} style={{ marginBottom: 10 }}>
              <Text style={{ color: '#39FF14', fontFamily: 'monospace', marginBottom: 2 }}>
                Week {item.week}: {item.progress.toFixed(1)}%
              </Text>
              <View style={{ height: 14, backgroundColor: '#222', borderRadius: 7, overflow: 'hidden', borderWidth: 1, borderColor: '#39FF14' }}>
                <View
                  style={{
                    width: `${Math.min(item.progress, 100)}%`,
                    height: '100%',
                    backgroundColor: barColor,
                    borderRadius: 7,
                  }}
                />
              </View>
            </View>
          );
        })}
      </ScrollView>
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#000' },
  skull: { fontSize: 40, textAlign: 'center', marginBottom: 5 },
  mementoContainer: { marginBottom: 20, alignItems: 'center' },
  mementoText: { color: '#39FF14', fontSize: 16, marginBottom: 5, fontFamily: 'monospace' },
  timeLeft: { color: '#39FF14', fontSize: 20, fontWeight: 'bold', marginBottom: 10, fontFamily: 'monospace' },
  lifeBarBackground: { width: '100%', height: 20, backgroundColor: '#111', borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#39FF14' },
  lifeBarFill: { backgroundColor: '#39FF14' },
  widget: { backgroundColor: '#111', borderRadius: 10, padding: 15, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#39FF14', borderWidth: 1, borderColor: '#39FF14' },
  widgetTitle: { color: '#39FF14', marginBottom: 10, fontFamily: 'monospace' },
  widgetText: { color: '#39FF14', fontFamily: 'monospace', fontSize: 16 },
  sectionTitle: { color: '#39FF14', fontSize: 18, fontWeight: 'bold', marginBottom: 10, marginTop: 10, fontFamily: 'monospace' },
  goalItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#111', padding: 12, borderRadius: 8, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#39FF14', borderWidth: 1, borderColor: '#39FF14' },
  goalText: { color: '#39FF14', fontSize: 16, flex: 1, fontFamily: 'monospace' },
  deleteText: { marginLeft: 10, fontSize: 18, color: '#39FF14' },
  placeholder: { color: '#39FF14', textAlign: 'center', marginTop: 20, fontFamily: 'monospace' },
  addGoalContainer: { flexDirection: 'row', marginTop: 10, alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#000', color: '#39FF14', padding: 10, borderRadius: 8, fontSize: 16, borderWidth: 1, borderColor: '#39FF14', fontFamily: 'monospace' },
  addButton: { marginLeft: 10, backgroundColor: '#000', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#39FF14' },
  addButtonText: { color: '#39FF14', fontSize: 18, fontWeight: 'bold', fontFamily: 'monospace' },
  historyItem: { backgroundColor: '#111', padding: 10, borderRadius: 8, marginRight: 10, alignItems: 'center', borderWidth: 1, borderColor: '#39FF14' },
  historyText: { color: '#39FF14', fontFamily: 'monospace' },
});

export default HomeScreen;
