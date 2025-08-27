import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
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
  const [insight, setInsight] = useState<LogEntry | null>(null);
  const [quote, setQuote] = useState<LogEntry | null>(null);
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

  // Load insight & quote of the day
  useEffect(() => {
    const loadData = async () => {
      const insightsData = await AsyncStorage.getItem('insights');
      if (insightsData) {
        const insights: LogEntry[] = JSON.parse(insightsData);
        if (insights.length > 0) setInsight(insights[Math.floor(Math.random() * insights.length)]);
      }
      const quotesData = await AsyncStorage.getItem('quotes');
      if (quotesData) {
        const quotes: LogEntry[] = JSON.parse(quotesData);
        if (quotes.length > 0) setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
      }
    };
    loadData();
  }, []);

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

      {/* Insight & Quote */}
      {insight && (
        <View style={styles.widget}>
          <ThemedText type="subtitle" style={styles.widgetTitle}>💡 Insight of the Day</ThemedText>
          <Text style={styles.widgetText}>{insight.text}</Text>
        </View>
      )}
      {quote && (
        <View style={styles.widget}>
          <ThemedText type="subtitle" style={styles.widgetTitle}>📝 Quote of the Day</ThemedText>
          <Text style={styles.widgetText}>{quote.text}</Text>
        </View>
      )}

      {/* Goals */}
      <Text style={styles.sectionTitle}>🎯 Your Main Goals</Text>
      <FlatList
        data={goals}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.goalItem}>
            <Text style={styles.goalText}>{item.text}</Text>
            <TouchableOpacity onPress={() => deleteGoal(item.id)}>
              <Text style={styles.deleteText}>❌</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.placeholder}>Add your first goal below 👇</Text>}
      />
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
      <FlatList
        data={weeklyStats}
        horizontal
        keyExtractor={(item) => `${item.year}-${item.week}`}
        renderItem={({ item }) => (
          <View style={styles.historyItem}>
            <Text style={styles.historyText}>W{item.week}</Text>
            <Text style={styles.historyText}>{item.progress.toFixed(1)}%</Text>
          </View>
        )}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#000' },
  skull: { fontSize: 40, textAlign: 'center', marginBottom: 5 },
  mementoContainer: { marginBottom: 20, alignItems: 'center' },
  mementoText: { color: '#ff5555', fontSize: 16, marginBottom: 5 },
  timeLeft: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  lifeBarBackground: { width: '100%', height: 20, backgroundColor: '#111', borderRadius: 10, overflow: 'hidden' },
  lifeBarFill: { backgroundColor: '#ff5555' },
  widget: { backgroundColor: '#111', borderRadius: 10, padding: 15, marginBottom: 15, borderLeftWidth: 4, borderLeftColor: '#0f0' },
  widgetTitle: { color: '#0ff', marginBottom: 10 },
  widgetText: { color: '#0f0', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 16 },
  sectionTitle: { color: '#0ff', fontSize: 18, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
  goalItem: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#111', padding: 12, borderRadius: 8, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: '#0f0' },
  goalText: { color: '#0f0', fontSize: 16, flex: 1 },
  deleteText: { marginLeft: 10, fontSize: 18 },
  placeholder: { color: '#888', textAlign: 'center', marginTop: 20 },
  addGoalContainer: { flexDirection: 'row', marginTop: 10, alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#111', color: '#0f0', padding: 10, borderRadius: 8, fontSize: 16 },
  addButton: { marginLeft: 10, backgroundColor: '#0f0', padding: 12, borderRadius: 8 },
  addButtonText: { color: '#000', fontSize: 18, fontWeight: 'bold' },
  historyItem: { backgroundColor: '#111', padding: 10, borderRadius: 8, marginRight: 10, alignItems: 'center' },
  historyText: { color: '#fff' },
});

export default HomeScreen;
