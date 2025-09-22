import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Animated } from 'react-native';
import { Enemy } from '@/constants/enemies';
import { BattleTauntManager } from '@/utils/battleTauntManager';

interface PreBattleTauntScreenProps {
  visible: boolean;
  enemy: Enemy;
  onStartBattle: () => void;
  onSkip: () => void;
}

export default function PreBattleTauntScreen({
  visible,
  enemy,
  onStartBattle,
  onSkip
}: PreBattleTauntScreenProps) {
  const [taunt, setTaunt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (visible && enemy) {
      loadTaunt();
      startPulseAnimation();
    }
  }, [visible, enemy]);

  const loadTaunt = async () => {
    setIsLoading(true);
    try {
      const preBattleTaunt = await BattleTauntManager.getPreBattleTaunt(enemy);
      setTaunt(preBattleTaunt);
    } catch (error) {
      console.error('Error loading taunt:', error);
      setTaunt(enemy.fallbackTaunts[0] || "Face me if you dare!");
    } finally {
      setIsLoading(false);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const getEnemyThemeColor = (tier: string): string => {
    switch (tier) {
      case 'small_fry': return '#FF6B6B';
      case 'personal_tormentor': return '#FF8C00';
      case 'psychological_destroyer': return '#8B0000';
      case 'inner_demon': return '#4B0082';
      case 'ultimate_boss': return '#FF0000';
      default: return '#FF4444';
    }
  };

  const getEnemyIcon = (tier: string): string => {
    switch (tier) {
      case 'small_fry': return '👿';
      case 'personal_tormentor': return '😈';
      case 'psychological_destroyer': return '👹';
      case 'inner_demon': return '💀';
      case 'ultimate_boss': return '🔥';
      default: return '👹';
    }
  };

  const themeColor = getEnemyThemeColor(enemy.tier);
  const enemyIcon = getEnemyIcon(enemy.tier);

  return (
    <Modal visible={visible} animationType="fade" transparent={true}>
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            { borderColor: themeColor, transform: [{ scale: pulseAnim }] }
          ]}
        >
          {/* Enemy Header */}
          <View style={[styles.enemyHeader, { backgroundColor: themeColor }]}>
            <Text style={styles.enemyIcon}>{enemyIcon}</Text>
            <View style={styles.enemyInfo}>
              <Text style={styles.enemyName}>{enemy.name}</Text>
              <Text style={styles.enemyTier}>{enemy.tier.toUpperCase().replace('_', ' ')}</Text>
              <Text style={styles.enemyStats}>HP: {enemy.hp} | {enemy.strength.toUpperCase()} vs {enemy.weakness.toUpperCase()}</Text>
            </View>
          </View>

          {/* Warning Banner */}
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>⚡ DEMON ENCOUNTER IMMINENT ⚡</Text>
          </View>

          {/* Taunt Section */}
          <View style={styles.tauntSection}>
            <Text style={styles.tauntLabel}>🗣️ ENEMY TAUNT:</Text>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>The demon speaks...</Text>
              </View>
            ) : (
              <View style={[styles.tauntBubble, { borderColor: themeColor }]}>
                <Text style={styles.tauntText}>"{taunt}"</Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <Text style={styles.actionPrompt}>
              🔥 Ready to crush this demon during your focus session? 🔥
            </Text>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.battleButton, { backgroundColor: themeColor }]}
                onPress={onStartBattle}
                disabled={isLoading}
              >
                <Text style={styles.battleButtonText}>
                  ⚔️ CRUSH THIS DEMON!
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipButton}
                onPress={onSkip}
              >
                <Text style={styles.skipButtonText}>Skip Taunt</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Battle Tip */}
          <View style={styles.tipSection}>
            <Text style={styles.tipText}>
              💡 Complete your pomodoro to deal damage and defeat this enemy!
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 15,
  },
  enemyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderTopLeftRadius: 17,
    borderTopRightRadius: 17,
    borderBottomWidth: 2,
    borderBottomColor: '#333',
  },
  enemyIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  enemyInfo: {
    flex: 1,
  },
  enemyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  enemyTier: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'monospace',
    opacity: 0.9,
    marginBottom: 2,
  },
  enemyStats: {
    fontSize: 11,
    color: '#FFFFFF',
    fontFamily: 'monospace',
    opacity: 0.8,
  },
  warningBanner: {
    backgroundColor: '#FF4444',
    paddingVertical: 8,
    alignItems: 'center',
  },
  warningText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  tauntSection: {
    padding: 20,
  },
  tauntLabel: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginBottom: 10,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'monospace',
    fontStyle: 'italic',
  },
  tauntBubble: {
    backgroundColor: '#2a2a2a',
    borderWidth: 2,
    borderRadius: 12,
    padding: 15,
    minHeight: 60,
    justifyContent: 'center',
  },
  tauntText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'monospace',
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  actionSection: {
    padding: 20,
    paddingTop: 10,
  },
  actionPrompt: {
    color: '#FFD700',
    fontSize: 14,
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: 'bold',
  },
  buttonRow: {
    gap: 10,
  },
  battleButton: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  battleButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
  },
  skipButtonText: {
    color: '#888',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  tipSection: {
    backgroundColor: '#0a0a0a',
    padding: 15,
    borderBottomLeftRadius: 17,
    borderBottomRightRadius: 17,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  tipText: {
    color: '#888',
    fontSize: 12,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
});