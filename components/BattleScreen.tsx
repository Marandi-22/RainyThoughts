import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Enemy } from '@/constants/enemies';
import { HeroData, getStatEmoji, getStatColor } from '@/constants/gameSystem';
import { PsychologicalWarfareService } from '@/services/tauntService';

interface BattleScreenProps {
  enemy: Enemy;
  heroData: HeroData;
  onVictory: (expGained: number, statsGained: any) => void;
  onDefeat: () => void;
  onFlee: () => void;
}

export default function BattleScreen({ enemy, heroData, onVictory, onDefeat, onFlee }: BattleScreenProps) {
  const [enemyCurrentHp, setEnemyCurrentHp] = useState(enemy.hp);
  const [heroCurrentHp, setHeroCurrentHp] = useState(heroData.hp);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [currentTaunt, setCurrentTaunt] = useState<string>('');
  const [battlePhase, setBattlePhase] = useState<'intro' | 'combat' | 'victory' | 'defeat'>('intro');
  const [isLoadingTaunt, setIsLoadingTaunt] = useState(true);
  const [turnCount, setTurnCount] = useState(0);

  // Animation values
  const [shakeAnimation] = useState(new Animated.Value(0));
  const [enemyHpAnimation] = useState(new Animated.Value(1));
  const [heroHpAnimation] = useState(new Animated.Value(1));

  // Load initial taunt
  useEffect(() => {
    loadBattleTaunt();
  }, []);

  const loadBattleTaunt = async () => {
    setIsLoadingTaunt(true);
    try {
      const taunt = await PsychologicalWarfareService.getBattleTaunt(enemy, heroData);
      setCurrentTaunt(taunt);
      setBattleLog(prev => [...prev, `${enemy.name} speaks with malicious intent...`]);
    } catch (error) {
      console.error('Failed to load taunt:', error);
      setCurrentTaunt(enemy.fallbackTaunts[0]);
    } finally {
      setIsLoadingTaunt(false);
      setBattlePhase('combat');
    }
  };

  const getHpBarColor = (currentHp: number, maxHp: number): string => {
    const percentage = currentHp / maxHp;
    if (percentage > 0.6) return '#39FF14'; // Green
    if (percentage > 0.3) return '#FFFF00'; // Yellow
    return '#FF4444'; // Red
  };

  const getHpBar = (currentHp: number, maxHp: number, width: number = 200): string => {
    const percentage = Math.max(0, currentHp / maxHp);
    const filledBars = Math.floor(percentage * 20);
    const emptyBars = 20 - filledBars;
    return '█'.repeat(filledBars) + '░'.repeat(emptyBars);
  };

  const shakeScreen = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const animateHpBar = (isEnemy: boolean) => {
    const animation = isEnemy ? enemyHpAnimation : heroHpAnimation;
    Animated.sequence([
      Animated.timing(animation, { toValue: 1.2, duration: 200, useNativeDriver: true }),
      Animated.timing(animation, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const calculateDamage = (attackerStat: number, defenderWeakness: string): number => {
    const baseDamage = Math.floor(attackerStat * 0.5) + Math.floor(Math.random() * 20) + 10;
    return Math.max(5, baseDamage);
  };

  const attackEnemy = async (statUsed: keyof typeof heroData.stats) => {
    const damage = calculateDamage(heroData.stats[statUsed], enemy.weakness);
    const newEnemyHp = Math.max(0, enemyCurrentHp - damage);

    setEnemyCurrentHp(newEnemyHp);
    animateHpBar(true);
    shakeScreen();

    const statEmoji = getStatEmoji(statUsed);
    setBattleLog(prev => [...prev, `You attack with ${statEmoji} ${statUsed.toUpperCase()}! Dealt ${damage} damage!`]);

    if (newEnemyHp <= 0) {
      // Victory!
      setBattlePhase('victory');
      const expGained = enemy.hp;
      const statsGained = { [statUsed]: Math.floor(enemy.hp / 10) };
      setBattleLog(prev => [...prev, `${enemy.name} is DEFEATED!`, `+${expGained} EXP, +${statsGained[statUsed]} ${statUsed.toUpperCase()}`]);
      setTimeout(() => onVictory(expGained, statsGained), 2000);
      return;
    }

    // Enemy counterattack
    setTimeout(() => enemyAttack(), 1500);
  };

  const enemyAttack = async () => {
    const damage = calculateDamage(50, heroData.stats[enemy.strength] < 100 ? 'high' : 'low'); // Simplified enemy attack
    const newHeroHp = Math.max(0, heroCurrentHp - damage);

    setHeroCurrentHp(newHeroHp);
    animateHpBar(false);

    // Get a fresh taunt for the counterattack
    try {
      const newTaunt = await PsychologicalWarfareService.getBattleTaunt(enemy, heroData);
      setCurrentTaunt(newTaunt);
    } catch (error) {
      console.error('Failed to get new taunt:', error);
    }

    setBattleLog(prev => [...prev, `${enemy.name} strikes back with psychological warfare!`, `PSYCHOLOGICAL DAMAGE: -${damage} HP`]);

    if (newHeroHp <= 0) {
      // Defeat
      setBattlePhase('defeat');
      setBattleLog(prev => [...prev, `You have been psychologically defeated!`]);
      setTimeout(() => onDefeat(), 2000);
      return;
    }

    setTurnCount(prev => prev + 1);
  };

  const getTierColor = (tier: Enemy['tier']): string => {
    switch (tier) {
      case 'small_fry': return '#666666';
      case 'personal_tormentor': return '#FF6600';
      case 'psychological_destroyer': return '#CC0000';
      case 'inner_demon': return '#9900CC';
      case 'ultimate_boss': return '#000000';
      default: return '#666666';
    }
  };

  const getTierDisplayName = (tier: Enemy['tier']): string => {
    switch (tier) {
      case 'small_fry': return 'SMALL FRY';
      case 'personal_tormentor': return 'PERSONAL TORMENTOR';
      case 'psychological_destroyer': return 'PSYCHOLOGICAL DESTROYER';
      case 'inner_demon': return 'INNER DEMON';
      case 'ultimate_boss': return 'ULTIMATE BOSS';
      default: return tier.toUpperCase();
    }
  };

  if (isLoadingTaunt) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Preparing psychological warfare...</Text>
        <Text style={styles.loadingSubtext}>Analyzing your weaknesses...</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { transform: [{ translateX: shakeAnimation }] }]}>
      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>

        {/* Battle Header */}
        <View style={styles.battleHeader}>
          <Text style={styles.battleTitle}>⚔️ PSYCHOLOGICAL WARFARE ⚔️</Text>
          <View style={[styles.tierBadge, { backgroundColor: getTierColor(enemy.tier) }]}>
            <Text style={styles.tierText}>{getTierDisplayName(enemy.tier)}</Text>
          </View>
        </View>

        {/* Enemy Info */}
        <View style={styles.enemySection}>
          <Text style={styles.enemyName}>{enemy.name}</Text>
          <View style={styles.hpContainer}>
            <Text style={styles.hpLabel}>Enemy HP:</Text>
            <Animated.View style={[styles.hpBarContainer, { transform: [{ scale: enemyHpAnimation }] }]}>
              <Text style={[styles.hpBar, { color: getHpBarColor(enemyCurrentHp, enemy.hp) }]}>
                {getHpBar(enemyCurrentHp, enemy.hp)}
              </Text>
              <Text style={styles.hpText}>{enemyCurrentHp}/{enemy.hp}</Text>
            </Animated.View>
          </View>

          <View style={styles.enemyStats}>
            <Text style={styles.statText}>
              Strength: {getStatEmoji(enemy.strength)} {enemy.strength.toUpperCase()}
            </Text>
            <Text style={styles.statText}>
              Weakness: {getStatEmoji(enemy.weakness)} {enemy.weakness.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Taunt Display */}
        <View style={styles.tauntContainer}>
          <Text style={styles.tauntLabel}>{enemy.name} taunts you:</Text>
          <View style={styles.tauntBox}>
            <Text style={styles.tauntText}>{currentTaunt}</Text>
          </View>
          <Text style={styles.psychologicalDamage}>
            💀 PSYCHOLOGICAL WARFARE ACTIVE 💀
          </Text>
        </View>

        {/* Hero Info */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>YOUR STATUS</Text>
          <View style={styles.hpContainer}>
            <Text style={styles.hpLabel}>Your HP:</Text>
            <Animated.View style={[styles.hpBarContainer, { transform: [{ scale: heroHpAnimation }] }]}>
              <Text style={[styles.hpBar, { color: getHpBarColor(heroCurrentHp, heroData.maxHp) }]}>
                {getHpBar(heroCurrentHp, heroData.maxHp)}
              </Text>
              <Text style={styles.hpText}>{heroCurrentHp}/{heroData.maxHp}</Text>
            </Animated.View>
          </View>

          <View style={styles.heroStats}>
            <Text style={styles.statDisplay}>
              💰 WEALTH: {heroData.stats.wealth}
            </Text>
            <Text style={styles.statDisplay}>
              💪 STRENGTH: {heroData.stats.strength}
            </Text>
            <Text style={styles.statDisplay}>
              🧠 WISDOM: {heroData.stats.wisdom}
            </Text>
            <Text style={styles.statDisplay}>
              🎯 LUCK: {heroData.stats.luck}
            </Text>
          </View>
        </View>

        {/* Battle Actions */}
        {battlePhase === 'combat' && (
          <View style={styles.actionsContainer}>
            <Text style={styles.actionTitle}>CHOOSE YOUR RESPONSE:</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { borderColor: getStatColor('wealth') }]}
                onPress={() => attackEnemy('wealth')}
              >
                <Text style={styles.actionButtonText}>💰 WEALTH ATTACK</Text>
                <Text style={styles.actionButtonDesc}>Prove your success</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { borderColor: getStatColor('strength') }]}
                onPress={() => attackEnemy('strength')}
              >
                <Text style={styles.actionButtonText}>💪 STRENGTH ATTACK</Text>
                <Text style={styles.actionButtonDesc}>Show your power</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { borderColor: getStatColor('wisdom') }]}
                onPress={() => attackEnemy('wisdom')}
              >
                <Text style={styles.actionButtonText}>🧠 WISDOM ATTACK</Text>
                <Text style={styles.actionButtonDesc}>Outsmart them</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { borderColor: getStatColor('luck') }]}
                onPress={() => attackEnemy('luck')}
              >
                <Text style={styles.actionButtonText}>🎯 LUCK ATTACK</Text>
                <Text style={styles.actionButtonDesc}>Trust in chaos</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.fleeButton} onPress={onFlee}>
              <Text style={styles.fleeButtonText}>💨 FLEE (Let their words destroy you...)</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Battle Log */}
        <View style={styles.battleLogContainer}>
          <Text style={styles.battleLogTitle}>BATTLE LOG:</Text>
          <ScrollView style={styles.battleLogScroll}>
            {battleLog.map((entry, index) => (
              <Text key={index} style={styles.battleLogEntry}>
                {'>'} {entry}
              </Text>
            ))}
          </ScrollView>
        </View>

      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingText: {
    color: '#FF0000',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 100,
    fontFamily: 'monospace',
  },
  loadingSubtext: {
    color: '#666666',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'monospace',
  },
  battleHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  battleTitle: {
    color: '#FF0000',
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'monospace',
    textShadowColor: '#FF0000',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
    marginTop: 8,
  },
  tierText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  enemySection: {
    backgroundColor: '#111111',
    borderWidth: 2,
    borderColor: '#FF0000',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  enemyName: {
    color: '#FF0000',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'monospace',
  },
  hpContainer: {
    marginBottom: 10,
  },
  hpLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 5,
  },
  hpBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hpBar: {
    fontSize: 12,
    fontFamily: 'monospace',
    flex: 1,
  },
  hpText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'monospace',
    marginLeft: 10,
  },
  enemyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statText: {
    color: '#CCCCCC',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  tauntContainer: {
    backgroundColor: '#0A0A0A',
    borderWidth: 2,
    borderColor: '#FF0000',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  tauntLabel: {
    color: '#FF6666',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    fontFamily: 'monospace',
  },
  tauntBox: {
    backgroundColor: '#111111',
    borderLeftWidth: 4,
    borderLeftColor: '#FF0000',
    padding: 10,
    marginBottom: 10,
  },
  tauntText: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'monospace',
  },
  psychologicalDamage: {
    color: '#FF0000',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  heroSection: {
    backgroundColor: '#001100',
    borderWidth: 2,
    borderColor: '#39FF14',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  heroTitle: {
    color: '#39FF14',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'monospace',
  },
  heroStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statDisplay: {
    color: '#39FF14',
    fontSize: 12,
    fontFamily: 'monospace',
    width: '48%',
    marginBottom: 5,
  },
  actionsContainer: {
    marginBottom: 20,
  },
  actionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'monospace',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#111111',
    borderWidth: 2,
    borderRadius: 10,
    padding: 12,
    width: '48%',
    marginBottom: 10,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  actionButtonDesc: {
    color: '#CCCCCC',
    fontSize: 10,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  fleeButton: {
    backgroundColor: '#330000',
    borderWidth: 2,
    borderColor: '#666666',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    alignItems: 'center',
  },
  fleeButtonText: {
    color: '#666666',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  battleLogContainer: {
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 10,
    padding: 10,
    height: 150,
  },
  battleLogTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  battleLogScroll: {
    flex: 1,
  },
  battleLogEntry: {
    color: '#39FF14',
    fontSize: 10,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});