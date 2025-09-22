import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Enemy } from '@/constants/enemies';
import { BattleTauntManager } from '@/utils/battleTauntManager';

interface AmbientTauntDisplayProps {
  availableEnemies: Enemy[];
  visible: boolean;
}

export default function AmbientTauntDisplay({ availableEnemies, visible }: AmbientTauntDisplayProps) {
  const [currentTaunt, setCurrentTaunt] = useState<string>('');
  const [currentEnemy, setCurrentEnemy] = useState<Enemy | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible && availableEnemies.length > 0) {
      loadRandomTaunt();
      startFadeAnimation();

      // Rotate taunts every 10 seconds
      const interval = setInterval(() => {
        if (availableEnemies.length > 0) {
          loadRandomTaunt();
        }
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [visible, availableEnemies]);

  const loadRandomTaunt = async () => {
    if (availableEnemies.length === 0) return;

    const randomEnemy = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
    setCurrentEnemy(randomEnemy);

    try {
      const taunt = await BattleTauntManager.getPreBattleTaunt(randomEnemy);
      setCurrentTaunt(taunt);
    } catch (error) {
      // Fallback to random personality taunt
      const fallbackTaunts = [
        "Your weakness amuses me...",
        "I can smell your fear from here.",
        "Soon you will face me in battle!",
        "Your productivity means nothing!",
        "I am waiting for you...",
        "You cannot hide from your demons forever."
      ];
      setCurrentTaunt(fallbackTaunts[Math.floor(Math.random() * fallbackTaunts.length)]);
    }
  };

  const startFadeAnimation = () => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
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

  if (!visible || !currentEnemy || !currentTaunt || availableEnemies.length === 0) {
    return null;
  }

  const themeColor = getEnemyThemeColor(currentEnemy.tier);
  const enemyIcon = getEnemyIcon(currentEnemy.tier);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={[styles.tauntCard, { borderColor: themeColor }]}>
        <View style={styles.enemyHeader}>
          <Text style={styles.enemyIcon}>{enemyIcon}</Text>
          <View style={styles.enemyInfo}>
            <Text style={styles.enemyName}>{currentEnemy.name}</Text>
            <Text style={styles.threatLevel}>THREAT LEVEL: {currentEnemy.tier.toUpperCase().replace('_', ' ')}</Text>
          </View>
        </View>

        <View style={[styles.tauntBubble, { backgroundColor: themeColor + '22' }]}>
          <Text style={styles.tauntText}>"{currentTaunt}"</Text>
        </View>

        <View style={styles.warningFooter}>
          <Text style={styles.warningText}>
            💀 This demon awaits your next pomodoro session 💀
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 100,
  },
  tauntCard: {
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  enemyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  enemyIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  enemyInfo: {
    flex: 1,
  },
  enemyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  threatLevel: {
    fontSize: 10,
    color: '#FF4444',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  tauntBubble: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  tauntText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'monospace',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 18,
  },
  warningFooter: {
    alignItems: 'center',
  },
  warningText: {
    fontSize: 11,
    color: '#888888',
    fontFamily: 'monospace',
    textAlign: 'center',
  },
});