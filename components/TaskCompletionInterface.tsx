import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Character } from '../constants/characters';
import { HeroStats, getStatColor, getStatEmoji, calculatePointsForCompletion } from '../constants/gameSystem';
import { CharacterTauntService } from '../services/characterTauntService';

interface TaskCompletionInterfaceProps {
  visible: boolean;
  character: Character;
  streakDays: number;
  defeatCount?: number;  // For stage-aware taunts
  onComplete: (quality: number, allocatedStats: HeroStats) => void;
  onCancel: () => void;
}

export const TaskCompletionInterface: React.FC<TaskCompletionInterfaceProps> = ({
  visible,
  character,
  streakDays,
  defeatCount = 0,
  onComplete,
  onCancel,
}) => {
  const [quality, setQuality] = useState(3);
  const [allocatedPoints, setAllocatedPoints] = useState<HeroStats>({
    wealth: 0,
    strength: 0,
    wisdom: 0,
    luck: 0,
  });
  const [totalPoints, setTotalPoints] = useState(0);
  const [victoryTaunt, setVictoryTaunt] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      resetState();
      loadVictoryTaunt();
    }
  }, [visible]);

  useEffect(() => {
    const points = calculatePointsForCompletion(quality, streakDays);
    setTotalPoints(points);
  }, [quality, streakDays]);

  const resetState = () => {
    setQuality(3);
    setAllocatedPoints({ wealth: 0, strength: 0, wisdom: 0, luck: 0 });
    setLoading(true);
  };

  const loadVictoryTaunt = async () => {
    try {
      const taunt = await CharacterTauntService.getVictoryTaunt(character, defeatCount);
      setVictoryTaunt(taunt);
    } catch (error) {
      console.error('Error loading victory taunt:', error);
      setVictoryTaunt(character.messages.victory[0]);
    } finally {
      setLoading(false);
    }
  };

  const getRemainingPoints = (): number => {
    const used = allocatedPoints.wealth + allocatedPoints.strength + allocatedPoints.wisdom + allocatedPoints.luck;
    return totalPoints - used;
  };

  const canAllocate = (stat: keyof HeroStats, amount: number): boolean => {
    const newValue = allocatedPoints[stat] + amount;
    if (newValue < 0) return false;
    if (amount > 0 && getRemainingPoints() < amount) return false;
    return true;
  };

  const allocateStat = (stat: keyof HeroStats, amount: number) => {
    if (canAllocate(stat, amount)) {
      setAllocatedPoints((prev) => ({
        ...prev,
        [stat]: prev[stat] + amount,
      }));
    }
  };

  const handleComplete = () => {
    if (getRemainingPoints() === 0) {
      onComplete(quality, allocatedPoints);
    }
  };

  const statKeys: (keyof HeroStats)[] = ['wealth', 'strength', 'wisdom', 'luck'];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.container}>
            <Text style={styles.title}>SESSION COMPLETE! 🎉</Text>

            {loading ? (
              <ActivityIndicator size="large" color={character.themeColor} />
            ) : (
              <>
                <View style={[styles.tauntContainer, { borderColor: character.themeColor }]}>
                  <Text style={[styles.characterName, { color: character.themeColor }]}>
                    {character.name}:
                  </Text>
                  <Text style={styles.tauntText}>{victoryTaunt}</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>How well did you work?</Text>
                  <View style={styles.qualityContainer}>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <TouchableOpacity
                        key={rating}
                        style={[
                          styles.qualityButton,
                          quality === rating && {
                            backgroundColor: character.themeColor,
                            borderColor: character.themeColor,
                          },
                        ]}
                        onPress={() => setQuality(rating)}
                      >
                        <Text
                          style={[
                            styles.qualityButtonText,
                            quality === rating && styles.qualityButtonTextActive,
                          ]}
                        >
                          {rating}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.qualityLabel}>
                    {quality === 5
                      ? 'Excellent! +2 bonus'
                      : quality === 4
                      ? 'Good! +1 bonus'
                      : quality === 3
                      ? 'Okay'
                      : quality === 2
                      ? 'Could be better'
                      : 'Barely tried'}
                  </Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>
                    Allocate Points: {getRemainingPoints()} remaining
                  </Text>

                  {statKeys.map((stat) => (
                    <View key={stat} style={styles.statRow}>
                      <View style={styles.statInfo}>
                        <Text style={styles.statEmoji}>{getStatEmoji(stat)}</Text>
                        <Text style={[styles.statName, { color: getStatColor(stat) }]}>
                          {stat.charAt(0).toUpperCase() + stat.slice(1)}
                        </Text>
                      </View>

                      <View style={styles.statControls}>
                        <TouchableOpacity
                          style={[
                            styles.controlButton,
                            !canAllocate(stat, -1) && styles.controlButtonDisabled,
                          ]}
                          onPress={() => allocateStat(stat, -1)}
                          disabled={!canAllocate(stat, -1)}
                        >
                          <Text style={styles.controlButtonText}>-</Text>
                        </TouchableOpacity>

                        <Text style={styles.statValue}>{allocatedPoints[stat]}</Text>

                        <TouchableOpacity
                          style={[
                            styles.controlButton,
                            !canAllocate(stat, 1) && styles.controlButtonDisabled,
                          ]}
                          onPress={() => allocateStat(stat, 1)}
                          disabled={!canAllocate(stat, 1)}
                        >
                          <Text style={styles.controlButtonText}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.completeButton,
                    getRemainingPoints() === 0
                      ? { backgroundColor: character.themeColor }
                      : styles.completeButtonDisabled,
                  ]}
                  onPress={handleComplete}
                  disabled={getRemainingPoints() !== 0}
                >
                  <Text style={styles.completeButtonText}>
                    {getRemainingPoints() === 0
                      ? 'CONFIRM & LEVEL UP'
                      : `Allocate ${getRemainingPoints()} more points`}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 24,
  },
  tauntContainer: {
    backgroundColor: '#0a0a0a',
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  characterName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tauntText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  qualityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  qualityButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#444444',
    backgroundColor: '#0a0a0a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qualityButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#888888',
  },
  qualityButtonTextActive: {
    color: '#FFFFFF',
  },
  qualityLabel: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#0a0a0a',
    padding: 12,
    borderRadius: 8,
  },
  statInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  statName: {
    fontSize: 18,
    fontWeight: '600',
  },
  statControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF8C00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonDisabled: {
    backgroundColor: '#333333',
    opacity: 0.5,
  },
  controlButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginHorizontal: 16,
    fontFamily: 'monospace',
    minWidth: 30,
    textAlign: 'center',
  },
  completeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  completeButtonDisabled: {
    backgroundColor: '#333333',
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cancelButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#888888',
  },
});
