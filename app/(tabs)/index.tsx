import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import {
  HeroData,
  createDefaultHero,
  calculateHeroState,
  getCurrentAct,
  getStatEmoji,
  getStatName,
  getStatColor
} from '@/constants/gameSystem';
import { getUnlockedEnemies } from '@/constants/enemies';

interface Goal {
  id: string;
  text: string;
  category: 'wealth' | 'strength' | 'wisdom' | 'luck';
}

interface LogEntry {
  id: string;
  text: string;
  date: string;
}

const DEATH_DATE = moment('2026-12-22'); // Your target death date - adjust as needed

const DemonCrusherHome: React.FC = () => {
  const [heroData, setHeroData] = useState<HeroData>(createDefaultHero());
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [selectedGoalCategory, setSelectedGoalCategory] = useState<'wealth' | 'strength' | 'wisdom' | 'luck'>('strength');
  const [insights, setInsights] = useState<LogEntry[]>([]);
  const [quotes, setQuotes] = useState<LogEntry[]>([]);
  const [insightIndex, setInsightIndex] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [daysLeft, setDaysLeft] = useState(0);

  // Load hero data
  useEffect(() => {
    const loadHeroData = async () => {
      try {
        const stored = await AsyncStorage.getItem('heroData');
        if (stored) {
          setHeroData(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading hero data:', error);
      }
    };
    loadHeroData();
  }, []);

  // Load goals
  useEffect(() => {
    const loadGoals = async () => {
      try {
        const storedGoals = await AsyncStorage.getItem('rpg_goals');
        if (storedGoals) {
          setGoals(JSON.parse(storedGoals));
        }
      } catch (error) {
        console.error('Error loading goals:', error);
      }
    };
    loadGoals();
  }, []);

  // Load journal data
  useEffect(() => {
    const loadJournalData = async () => {
      try {
        const [insightsData, quotesData] = await Promise.all([
          AsyncStorage.getItem('insights'),
          AsyncStorage.getItem('quotes')
        ]);

        if (insightsData) {
          setInsights(JSON.parse(insightsData));
        }
        if (quotesData) {
          setQuotes(JSON.parse(quotesData));
        }
      } catch (error) {
        console.error('Error loading journal data:', error);
      }
    };
    loadJournalData();
  }, []);

  // Rotate insights and quotes
  useEffect(() => {
    const interval = setInterval(() => {
      if (insights.length > 0) {
        setInsightIndex(prev => (prev + 1) % insights.length);
      }
      if (quotes.length > 0) {
        setQuoteIndex(prev => (prev + 1) % quotes.length);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [insights.length, quotes.length]);

  // Days countdown
  useEffect(() => {
    const interval = setInterval(() => {
      const now = moment();
      const days = DEATH_DATE.diff(now, 'days');
      setDaysLeft(Math.max(0, days));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const saveGoals = async (updatedGoals: Goal[]) => {
    try {
      setGoals(updatedGoals);
      await AsyncStorage.setItem('rpg_goals', JSON.stringify(updatedGoals));
    } catch (error) {
      console.error('Error saving goals:', error);
    }
  };

  const addGoal = () => {
    if (!newGoal.trim()) return;

    const updatedGoals = [...goals, {
      id: Date.now().toString(),
      text: newGoal.trim(),
      category: selectedGoalCategory
    }];

    saveGoals(updatedGoals);
    setNewGoal('');
  };

  const deleteGoal = (id: string) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => saveGoals(goals.filter(g => g.id !== id))
        }
      ]
    );
  };

  const unlockedEnemies = getUnlockedEnemies(
    heroData.streakDays,
    heroData.stats,
    heroData.totalPomodoros
  );
  // All enemies are always available for taunts and battles
  const availableEnemies = unlockedEnemies;

  const totalStats = Object.values(heroData.stats).reduce((sum, val) => sum + val, 0);
  const lifeProgress = Math.max(0, Math.min(100, (daysLeft / 1095) * 100)); // Assuming 3 years total

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Death Countdown - Memento Mori */}
        <View style={styles.deathCountdownCard}>
          <Text style={styles.skull}>💀</Text>
          <Text style={styles.mementoText}>MEMENTO MORI</Text>
          <Text style={styles.daysLeft}>{daysLeft} DAYS LEFT</Text>
          <Text style={styles.deathMessage}>Your demons grow stronger each day you waste</Text>
          <View style={styles.lifeBarBackground}>
            <View style={[styles.lifeBarFill, { width: `${lifeProgress}%` }]} />
          </View>
        </View>

        {/* Hero Status */}
        <View style={styles.heroCard}>
          <Text style={styles.cardTitle}>🔥 DEMON CRUSHER STATUS</Text>
          <View style={styles.heroInfo}>
            <Text style={styles.heroLevel}>Level {Math.floor(heroData.exp / 100) + 1}</Text>
            <Text style={styles.heroState}>{heroData.heroState.toUpperCase()}</Text>
            <Text style={styles.heroAct}>Act {heroData.currentAct}/6</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>💰</Text>
              <Text style={styles.statValue}>{heroData.stats.wealth}</Text>
              <Text style={styles.statLabel}>WEALTH</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>💪</Text>
              <Text style={styles.statValue}>{heroData.stats.strength}</Text>
              <Text style={styles.statLabel}>STRENGTH</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>🧠</Text>
              <Text style={styles.statValue}>{heroData.stats.wisdom}</Text>
              <Text style={styles.statLabel}>WISDOM</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>🎯</Text>
              <Text style={styles.statValue}>{heroData.stats.luck}</Text>
              <Text style={styles.statLabel}>LUCK</Text>
            </View>
          </View>

          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>Streak: {heroData.streakDays} days</Text>
            <Text style={styles.progressText}>Sessions: {heroData.totalPomodoros}</Text>
            <Text style={styles.progressText}>Total Kills: {Object.values(heroData.enemyKillCounts || {}).reduce((sum, kills) => sum + kills, 0)}</Text>
            <Text style={styles.progressText}>Total Power: {totalStats}</Text>
          </View>
        </View>

        {/* Rotating Insights */}
        {insights.length > 0 && (
          <View style={styles.insightCard}>
            <Text style={styles.cardTitle}>💡 WARRIOR'S INSIGHT</Text>
            <Text style={styles.insightText}>{insights[insightIndex]?.text}</Text>
          </View>
        )}

        {/* Rotating Quotes */}
        {quotes.length > 0 && (
          <View style={styles.quoteCard}>
            <Text style={styles.cardTitle}>⚔️ BATTLE QUOTE</Text>
            <Text style={styles.quoteText}>"{quotes[quoteIndex]?.text}"</Text>
          </View>
        )}

        {/* Goals System */}
        <View style={styles.goalsCard}>
          <Text style={styles.cardTitle}>🎯 CONQUEST GOALS</Text>

          {goals.length === 0 ? (
            <Text style={styles.noGoalsText}>No conquest goals set. Add some to focus your demon-crushing!</Text>
          ) : (
            goals.map(goal => (
              <View key={goal.id} style={styles.goalItem}>
                <View style={styles.goalInfo}>
                  <Text style={styles.goalText}>{goal.text}</Text>
                  <Text style={[styles.goalCategory, { color: getStatColor(goal.category) }]}>
                    {getStatEmoji(goal.category)} {getStatName(goal.category)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => deleteGoal(goal.id)} style={styles.deleteGoalBtn}>
                  <Text style={styles.deleteGoalText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          {/* Add Goal Form */}
          <View style={styles.addGoalForm}>
            <TextInput
              style={styles.goalInput}
              placeholder="New conquest goal..."
              placeholderTextColor="#666"
              value={newGoal}
              onChangeText={setNewGoal}
            />

            <View style={styles.categorySelector}>
              {(['wealth', 'strength', 'wisdom', 'luck'] as const).map(category => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryBtn,
                    selectedGoalCategory === category && styles.selectedCategoryBtn,
                    { borderColor: getStatColor(category) }
                  ]}
                  onPress={() => setSelectedGoalCategory(category)}
                >
                  <Text style={styles.categoryBtnText}>{getStatEmoji(category)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={addGoal} style={styles.addGoalBtn}>
              <Text style={styles.addGoalBtnText}>+ ADD GOAL</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Battle Status */}
        {availableEnemies.length > 0 && (
          <View style={styles.battleStatusCard}>
            <Text style={styles.cardTitle}>⚔️ ENEMIES AWAITING</Text>
            <Text style={styles.battleStatusText}>
              {availableEnemies.length} enemies are ready for battle
            </Text>
            <Text style={styles.battleHint}>
              Complete pomodoro sessions to face them!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 40,
  },

  // Death Countdown
  deathCountdownCard: {
    backgroundColor: '#0A0A0A',
    borderWidth: 2,
    borderColor: '#FF0000',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  skull: {
    fontSize: 48,
    marginBottom: 5,
  },
  mementoText: {
    color: '#FF0000',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginBottom: 10,
  },
  daysLeft: {
    color: '#FF0000',
    fontSize: 36,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginBottom: 5,
  },
  deathMessage: {
    color: '#FF4444',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'monospace',
    marginBottom: 15,
  },
  lifeBarBackground: {
    width: '100%',
    height: 20,
    backgroundColor: '#222',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#FF0000',
  },
  lifeBarFill: {
    height: '100%',
    backgroundColor: '#FF0000',
  },

  // Hero Card
  heroCard: {
    backgroundColor: '#0A0A0A',
    borderWidth: 2,
    borderColor: '#FF4444',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  cardTitle: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'monospace',
  },
  heroInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  heroLevel: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  heroState: {
    color: '#FF6600',
    fontSize: 16,
    fontFamily: 'monospace',
    marginTop: 5,
  },
  heroAct: {
    color: '#CCCCCC',
    fontSize: 14,
    fontFamily: 'monospace',
    marginTop: 5,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 24,
    marginBottom: 5,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  statLabel: {
    color: '#888',
    fontSize: 10,
    fontFamily: 'monospace',
  },
  progressInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  progressText: {
    color: '#44FF44',
    fontSize: 12,
    fontFamily: 'monospace',
  },

  // Insight Card
  insightCard: {
    backgroundColor: '#001122',
    borderWidth: 2,
    borderColor: '#4488FF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  insightText: {
    color: '#4488FF',
    fontSize: 14,
    fontFamily: 'monospace',
    textAlign: 'center',
  },

  // Quote Card
  quoteCard: {
    backgroundColor: '#110022',
    borderWidth: 2,
    borderColor: '#8844FF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  quoteText: {
    color: '#8844FF',
    fontSize: 14,
    fontFamily: 'monospace',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Goals Card
  goalsCard: {
    backgroundColor: '#0A0A0A',
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
  },
  noGoalsText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'monospace',
    marginBottom: 15,
  },
  goalItem: {
    backgroundColor: '#222',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalInfo: {
    flex: 1,
  },
  goalText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 3,
  },
  goalCategory: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  deleteGoalBtn: {
    padding: 8,
  },
  deleteGoalText: {
    color: '#FF4444',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Add Goal Form
  addGoalForm: {
    marginTop: 15,
  },
  goalInput: {
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#FFD700',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 10,
  },
  categorySelector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  categoryBtn: {
    width: 50,
    height: 50,
    borderWidth: 2,
    borderRadius: 25,
    backgroundColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCategoryBtn: {
    backgroundColor: '#333',
    borderWidth: 3,
  },
  categoryBtnText: {
    fontSize: 20,
  },
  addGoalBtn: {
    backgroundColor: '#FFD700',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  addGoalBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },

  // Battle Status
  battleStatusCard: {
    backgroundColor: '#220000',
    borderWidth: 2,
    borderColor: '#FF4444',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  battleStatusText: {
    color: '#FF4444',
    fontSize: 14,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 5,
  },
  battleHint: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
});

export default DemonCrusherHome;