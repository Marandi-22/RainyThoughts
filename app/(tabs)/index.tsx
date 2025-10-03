import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  HeroData,
  loadHeroData,
  getStatColor,
  getStatEmoji,
  getHeroStateDescription,
  calculateTotalStats,
} from '../../constants/gameSystem';
import { CHARACTERS, Character, getAvailableCharacters, getLockedCharacters } from '../../constants/characters';
import { getEnemyData } from '../../constants/battleSystem';
import { getCharacterImage } from '../../constants/imageMapping';
import { loadRotTracker, getRotEmoji, getRotMessage, getRotColor } from '../../services/rotTrackerService';

export default function HomeScreen() {
  const router = useRouter();
  const [heroData, setHeroData] = useState<HeroData | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [suicidedEnemies, setSuicidedEnemies] = useState<Set<string>>(new Set());
  const [lifeGoals, setLifeGoals] = useState<string[]>([]);
  const [rotDays, setRotDays] = useState(0);
  const [productiveDays, setProductiveDays] = useState(0);
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [newGoal, setNewGoal] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await loadHeroData();
    setHeroData(data);

    // Load life goals
    const goalsData = await AsyncStorage.getItem('goals');
    if (goalsData) {
      setLifeGoals(JSON.parse(goalsData));
    }

    // Load rot tracker
    const rotData = await loadRotTracker();
    setRotDays(rotData.rotDays);
    setProductiveDays(rotData.productiveDays);

    // Check which enemies have committed suicide
    const suicided = new Set<string>();
    for (const char of CHARACTERS.filter(c => c.category === 'demon')) {
      const enemy = await getEnemyData(char.id);
      const threshold = char.suicideThreshold || 15;
      if (enemy && enemy.defeats >= threshold) {
        suicided.add(char.id);
      }
    }
    setSuicidedEnemies(suicided);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCharacterSelect = (character: Character) => {
    setSelectedCharacter(character);
    // Navigate to pomodoro tab with character pre-selected
    router.push({
      pathname: '/(tabs)/pomodoro',
      params: {
        characterId: character.id,
        autoStart: 'true' // Flag to indicate we want to auto-start
      },
    });
  };

  const handleAddGoal = async () => {
    if (!newGoal.trim()) {
      Alert.alert('Error', 'Please enter a goal');
      return;
    }

    const updatedGoals = [...lifeGoals, newGoal];
    setLifeGoals(updatedGoals);
    await AsyncStorage.setItem('goals', JSON.stringify(updatedGoals));
    setNewGoal('');
    setShowGoalsModal(false);
  };

  const handleDeleteGoal = async (index: number) => {
    Alert.alert('Delete Goal?', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updatedGoals = lifeGoals.filter((_, i) => i !== index);
          setLifeGoals(updatedGoals);
          await AsyncStorage.setItem('goals', JSON.stringify(updatedGoals));
        },
      },
    ]);
  };

  if (!heroData) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const totalStats = calculateTotalStats(heroData.stats);
  const allAvailable = getAvailableCharacters(totalStats, heroData.streakDays);
  const allLocked = getLockedCharacters(totalStats, heroData.streakDays);

  // Filter out mentors AND suicided enemies - only show demons
  const availableCharacters = allAvailable.filter(c => c.category === 'demon' && !suicidedEnemies.has(c.id));
  const lockedCharacters = allLocked.filter(c => c.category === 'demon' && !suicidedEnemies.has(c.id));

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.appTitle}>⚔️ RAINY THOUGHTS ⚔️</Text>
        <Text style={styles.subtitle}>Psychological Warfare for Productivity</Text>
      </View>

      {/* Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View>
            <Text style={styles.heroLevel}>Level {heroData.level}</Text>
            <Text style={[styles.heroState, { color: getStateColor(heroData.heroState) }]}>
              {getHeroStateDescription(heroData.heroState)}
            </Text>
          </View>
          <View style={styles.heroStats}>
            <Text style={styles.streakText}>🔥 {heroData.streakDays} day streak</Text>
            <Text style={styles.pomodoroText}>⏱ {heroData.totalPomodoros} sessions</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          {(Object.keys(heroData.stats) as Array<keyof typeof heroData.stats>).map((stat) => (
            <View key={stat} style={styles.statRow}>
              <View style={styles.statLabel}>
                <Text style={styles.statEmoji}>{getStatEmoji(stat)}</Text>
                <Text style={[styles.statName, { color: getStatColor(stat) }]}>
                  {stat.charAt(0).toUpperCase() + stat.slice(1)}
                </Text>
              </View>
              <View style={styles.statBarContainer}>
                <View
                  style={[
                    styles.statBar,
                    {
                      width: `${Math.min((heroData.stats[stat] / 200) * 100, 100)}%`,
                      backgroundColor: getStatColor(stat),
                    },
                  ]}
                />
              </View>
              <Text style={styles.statValue}>{heroData.stats[stat]}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalStatsRow}>
          <Text style={styles.totalStatsLabel}>Total Power:</Text>
          <Text style={styles.totalStatsValue}>{totalStats}</Text>
        </View>
      </View>

      {/* Life Goals Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>🎯 LIFE GOALS</Text>
            <Text style={styles.sectionSubtitle}>Your daily reminders</Text>
          </View>
          <TouchableOpacity
            style={styles.editGoalsButton}
            onPress={() => setShowGoalsModal(true)}
          >
            <Text style={styles.editGoalsButtonText}>+ Add Goal</Text>
          </TouchableOpacity>
        </View>
        {lifeGoals.length === 0 ? (
          <View style={styles.emptyGoals}>
            <Text style={styles.emptyGoalsText}>No life goals set yet</Text>
            <Text style={styles.emptyGoalsSubtext}>Tap "+ Add Goal" to create one</Text>
          </View>
        ) : (
          <View style={styles.goalsContainer}>
            {lifeGoals.map((goal, index) => (
              <View key={index} style={styles.goalCard}>
                <Text style={styles.goalBullet}>•</Text>
                <Text style={styles.goalText}>{goal}</Text>
                <TouchableOpacity onPress={() => handleDeleteGoal(index)}>
                  <Text style={styles.deleteGoalBtn}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Rot Tracker */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📊 ROT TRACKER</Text>
        <Text style={styles.sectionSubtitle}>Your decay vs growth</Text>

        <View style={[styles.rotCard, { borderColor: getRotColor(rotDays) }]}>
          <View style={styles.rotHeader}>
            <Text style={styles.rotEmoji}>{getRotEmoji(rotDays)}</Text>
            <View style={styles.rotInfo}>
              <Text style={[styles.rotMessage, { color: getRotColor(rotDays) }]}>
                {getRotMessage(rotDays)}
              </Text>
              <Text style={styles.rotDaysText}>
                {rotDays === 0 ? 'No rot days!' : `${rotDays} ${rotDays === 1 ? 'day' : 'days'} rotting`}
              </Text>
            </View>
          </View>

          <View style={styles.rotStats}>
            <View style={styles.rotStatItem}>
              <Text style={styles.rotStatLabel}>💀 Rot Days</Text>
              <Text style={[styles.rotStatValue, { color: '#FF4444' }]}>{rotDays}</Text>
            </View>
            <View style={styles.rotStatDivider} />
            <View style={styles.rotStatItem}>
              <Text style={styles.rotStatLabel}>✨ Productive Days</Text>
              <Text style={[styles.rotStatValue, { color: '#00FF00' }]}>{productiveDays}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Available Characters */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚔️ FACE YOUR DEMONS</Text>
        <Text style={styles.sectionSubtitle}>Select a character to battle</Text>

        <View style={styles.charactersGrid}>
          {availableCharacters.map((character) => (
            <TouchableOpacity
              key={character.id}
              style={[styles.characterCard, { borderColor: character.themeColor }]}
              onPress={() => handleCharacterSelect(character)}
            >
              <View style={[styles.characterImageContainer, { borderColor: character.themeColor }]}>
                <Image
                  source={getCharacterImage(character.image)}
                  style={styles.characterImage}
                  resizeMode="cover"
                />
              </View>
              <Text style={styles.characterName}>{character.name}</Text>
              <Text style={[styles.characterPersonality, { color: character.themeColor }]}>
                {character.personality.replace(/_/g, ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Locked Characters */}
      {lockedCharacters.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔒 LOCKED CHARACTERS</Text>
          <Text style={styles.sectionSubtitle}>Level up to unlock</Text>

          <View style={styles.charactersGrid}>
            {lockedCharacters.map((character) => (
              <View
                key={character.id}
                style={[styles.characterCard, styles.lockedCard]}
              >
                <View style={styles.characterImageContainer}>
                  <Image
                    source={getCharacterImage(character.image)}
                    style={[styles.characterImage, styles.lockedImage]}
                    resizeMode="cover"
                  />
                  <Text style={styles.lockIcon}>🔒</Text>
                </View>
                <Text style={[styles.characterName, styles.lockedText]}>{character.name}</Text>
                <Text style={styles.requirementText}>
                  {character.minStats && `${character.minStats} total stats`}
                  {character.minStats && character.minStreak && ' • '}
                  {character.minStreak && `${character.minStreak} day streak`}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Life Goals Modal */}
      <Modal visible={showGoalsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🎯 Add Life Goal</Text>
            <Text style={styles.modalSubtitle}>
              What do you want to achieve in life?
            </Text>

            <TextInput
              style={styles.goalInput}
              placeholder="Enter your life goal..."
              placeholderTextColor="#666"
              value={newGoal}
              onChangeText={setNewGoal}
              multiline
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setShowGoalsModal(false);
                  setNewGoal('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalAddBtn}
                onPress={handleAddGoal}
              >
                <Text style={styles.modalAddText}>Add Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function getStateColor(state: string): string {
  switch (state) {
    case 'legendary':
      return '#FFD700';
    case 'strong':
      return '#FF8C00';
    case 'developing':
      return '#4A90E2';
    case 'weak':
      return '#888888';
    default:
      return '#666666';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#FF4444',
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF4444',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    fontStyle: 'italic',
  },
  heroCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FF4444',
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  heroLevel: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  heroState: {
    fontSize: 16,
    marginTop: 4,
  },
  heroStats: {
    alignItems: 'flex-end',
  },
  streakText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  pomodoroText: {
    fontSize: 14,
    color: '#888888',
  },
  statsContainer: {
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
  },
  statEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  statName: {
    fontSize: 16,
    fontWeight: '600',
  },
  statBarContainer: {
    flex: 1,
    height: 24,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    overflow: 'hidden',
    marginRight: 12,
  },
  statBar: {
    height: '100%',
    borderRadius: 12,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'monospace',
    width: 40,
    textAlign: 'right',
  },
  totalStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  totalStatsLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  totalStatsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF4444',
    fontFamily: 'monospace',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 16,
  },
  charactersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  characterCard: {
    width: '47%',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 2,
    padding: 12,
    alignItems: 'center',
  },
  lockedCard: {
    borderColor: '#333333',
    opacity: 0.6,
  },
  characterImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
  },
  characterImage: {
    width: '100%',
    height: '100%',
  },
  lockedImage: {
    opacity: 0.3,
  },
  lockIcon: {
    position: 'absolute',
    fontSize: 32,
    top: '50%',
    left: '50%',
    transform: [{ translateX: -16 }, { translateY: -16 }],
  },
  characterName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  characterPersonality: {
    fontSize: 11,
    textAlign: 'center',
  },
  lockedText: {
    color: '#888888',
  },
  requirementText: {
    fontSize: 10,
    color: '#666666',
    textAlign: 'center',
    marginTop: 4,
  },
  goalsContainer: {
    gap: 12,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  goalBullet: {
    fontSize: 20,
    color: '#4A90E2',
    marginRight: 12,
    marginTop: -2,
  },
  goalText: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  deleteGoalBtn: {
    fontSize: 28,
    color: '#666',
    paddingLeft: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  editGoalsButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editGoalsButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emptyGoals: {
    paddingHorizontal: 20,
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyGoalsText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  emptyGoalsSubtext: {
    fontSize: 14,
    color: '#444',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  goalInput: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 20,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalAddBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
  },
  modalAddText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  rotCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    borderWidth: 3,
  },
  rotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  rotEmoji: {
    fontSize: 48,
    marginRight: 16,
  },
  rotInfo: {
    flex: 1,
  },
  rotMessage: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  rotDaysText: {
    fontSize: 14,
    color: '#888888',
  },
  rotStats: {
    flexDirection: 'row',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  rotStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  rotStatDivider: {
    width: 1,
    backgroundColor: '#333333',
  },
  rotStatLabel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 8,
  },
  rotStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
});
