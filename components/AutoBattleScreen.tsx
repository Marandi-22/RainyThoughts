import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Enemy } from '@/constants/enemies';
import { HeroData, getStatEmoji } from '@/constants/gameSystem';
import { BattleTauntManager } from '@/utils/battleTauntManager';

interface AutoBattleScreenProps {
  enemy: Enemy;
  heroData: HeroData;
  onVictory: (expGained: number, statsGained: any) => void;
  onDefeat: () => void;
  onFlee: () => void;
}

export default function AutoBattleScreen({ enemy, heroData, onVictory, onDefeat, onFlee }: AutoBattleScreenProps) {
  const [enemyCurrentHp, setEnemyCurrentHp] = useState(enemy.hp);
  const [heroCurrentHp, setHeroCurrentHp] = useState(heroData.hp);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [battlePhase, setBattlePhase] = useState<'intro' | 'combat' | 'victory' | 'defeat'>('intro');
  const [currentAction, setCurrentAction] = useState<string>('');
  const [turnCount, setTurnCount] = useState(0);

  // Animation values
  const [shakeAnimation] = useState(new Animated.Value(0));
  const [enemyHpAnimation] = useState(new Animated.Value(1));
  const [heroHpAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    if (battlePhase === 'intro') {
      startAutoBattle();
    }
  }, []);

  const startAutoBattle = async () => {
    setBattleLog(['🔥 BATTLE BEGINS! 🔥']);
    setCurrentAction('The demon emerges from the shadows...');

    setTimeout(() => {
      setBattlePhase('combat');
      executeAutoBattle();
    }, 2000);
  };

  const executeAutoBattle = async () => {
    let currentEnemyHp = enemyCurrentHp;
    let currentHeroHp = heroCurrentHp;
    let turn = 0;
    const maxTurns = 20; // Prevent infinite battles

    const actionSequences = [
      "💪 You channel your inner strength!",
      "🧠 You analyze the demon's weaknesses!",
      "💰 You leverage your resources!",
      "🎯 You strike with precision!",
      "⚡ Your focus energy builds up!",
      "🔥 The battle intensifies!",
      "✨ Your pomodoro power flows through you!",
      "💥 You unleash a devastating combo!"
    ];

    while (currentEnemyHp > 0 && currentHeroHp > 0 && turn < maxTurns) {
      turn++;

      // Hero turn
      const heroStat = getRandomStat();
      const heroDamage = calculateHeroDamage(heroStat);
      currentEnemyHp = Math.max(0, currentEnemyHp - heroDamage);

      const actionText = actionSequences[turn % actionSequences.length];
      setCurrentAction(actionText);

      await new Promise(resolve => setTimeout(resolve, 1500));

      setBattleLog(prev => [...prev,
        actionText,
        `${getStatEmoji(heroStat)} ${heroStat.toUpperCase()} ATTACK! -${heroDamage} HP!`
      ]);

      setEnemyCurrentHp(currentEnemyHp);
      animateHpBar(true);

      if (currentEnemyHp <= 0) {
        // Victory!
        setBattlePhase('victory');
        await handleVictory();
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Enemy turn
      const enemyDamage = calculateEnemyDamage();
      currentHeroHp = Math.max(0, currentHeroHp - enemyDamage);

      setCurrentAction(`${enemy.name} strikes back with psychological warfare!`);

      await new Promise(resolve => setTimeout(resolve, 1500));

      setBattleLog(prev => [...prev,
        `💀 ${enemy.name} attacks your mental state!`,
        `PSYCHOLOGICAL DAMAGE: -${enemyDamage} HP!`
      ]);

      setHeroCurrentHp(currentHeroHp);
      animateHpBar(false);

      if (currentHeroHp <= 0) {
        // Defeat
        setBattlePhase('defeat');
        await handleDefeat();
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // If we hit max turns, it's a draw (treat as victory with reduced rewards)
    if (turn >= maxTurns) {
      setBattlePhase('victory');
      await handleVictory(true);
    }
  };

  const handleVictory = async (isDraw: boolean = false) => {
    setCurrentAction('🎉 VICTORY! The demon is crushed! 🎉');

    try {
      const victoryTaunt = await BattleTauntManager.getVictoryTaunt(enemy);
      setBattleLog(prev => [...prev,
        `✅ ${enemy.name} is DEFEATED!`,
        `💬 "${victoryTaunt}"`,
        isDraw ? '⚖️ Hard-fought battle!' : '🏆 Flawless victory!'
      ]);
    } catch (error) {
      setBattleLog(prev => [...prev, `✅ ${enemy.name} is DEFEATED!`]);
    }

    const expGained = isDraw ? Math.floor(enemy.hp * 0.7) : enemy.hp;
    const statGained = isDraw ? Math.floor(enemy.hp / 15) : Math.floor(enemy.hp / 10);
    const randomStat = getRandomStat();
    const statsGained = { [randomStat]: statGained };

    setBattleLog(prev => [...prev,
      `💫 +${expGained} EXP gained!`,
      `📈 +${statGained} ${randomStat.toUpperCase()} gained!`
    ]);

    setTimeout(() => onVictory(expGained, statsGained), 3000);
  };

  const handleDefeat = async () => {
    setCurrentAction('💀 DEFEAT! The demon has overwhelmed you... 💀');

    try {
      const defeatTaunt = await BattleTauntManager.getDefeatTaunt(enemy);
      setBattleLog(prev => [...prev,
        `❌ You have been defeated by ${enemy.name}!`,
        `💬 "${defeatTaunt}"`
      ]);
    } catch (error) {
      setBattleLog(prev => [...prev, `❌ You have been defeated by ${enemy.name}!`]);
    }

    setBattleLog(prev => [...prev,
      '🔄 Don\'t give up! Try again with stronger focus!'
    ]);

    setTimeout(onDefeat, 3000);
  };

  const getRandomStat = (): keyof typeof heroData.stats => {
    const stats: (keyof typeof heroData.stats)[] = ['wealth', 'strength', 'wisdom', 'luck'];
    return stats[Math.floor(Math.random() * stats.length)];
  };

  const calculateHeroDamage = (stat: keyof typeof heroData.stats): number => {
    const baseDamage = Math.floor(heroData.stats[stat] * 0.8);
    const randomBonus = Math.floor(Math.random() * 25) + 10;

    // Bonus damage if attacking enemy's weakness
    const weaknessBonus = stat === enemy.weakness ? 15 : 0;

    return Math.max(10, baseDamage + randomBonus + weaknessBonus);
  };

  const calculateEnemyDamage = (): number => {
    // Scale enemy damage based on tier
    const tierMultiplier = {
      'small_fry': 0.6,
      'personal_tormentor': 0.8,
      'psychological_destroyer': 1.0,
      'inner_demon': 1.2,
      'ultimate_boss': 1.5
    };

    const multiplier = tierMultiplier[enemy.tier] || 0.8;
    const baseDamage = Math.floor(enemy.hp * 0.1 * multiplier);
    const randomBonus = Math.floor(Math.random() * 15) + 5;

    return Math.max(5, baseDamage + randomBonus);
  };

  const animateHpBar = (isEnemy: boolean) => {
    const animation = isEnemy ? enemyHpAnimation : heroHpAnimation;
    Animated.sequence([
      Animated.timing(animation, { toValue: 0.8, duration: 200, useNativeDriver: true }),
      Animated.timing(animation, { toValue: 1, duration: 200, useNativeDriver: true })
    ]).start();

    // Shake effect
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 100, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 100, useNativeDriver: true })
    ]).start();
  };

  const getHpBarColor = (currentHp: number, maxHp: number): string => {
    const percentage = currentHp / maxHp;
    if (percentage > 0.6) return '#44FF44';
    if (percentage > 0.3) return '#FFAA00';
    return '#FF4444';
  };

  const getEnemyThemeColor = (): string => {
    switch (enemy.tier) {
      case 'small_fry': return '#FF6B6B';
      case 'personal_tormentor': return '#FF8C00';
      case 'psychological_destroyer': return '#8B0000';
      case 'inner_demon': return '#4B0082';
      case 'ultimate_boss': return '#FF0000';
      default: return '#FF4444';
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.battleArena, { transform: [{ translateX: shakeAnimation }] }]}>
        {/* Enemy Section */}
        <View style={[styles.enemySection, { borderColor: getEnemyThemeColor() }]}>
          <Text style={styles.enemyName}>{enemy.name}</Text>
          <Text style={styles.enemyTier}>{enemy.tier.toUpperCase().replace('_', ' ')}</Text>

          <View style={styles.hpContainer}>
            <Text style={styles.hpLabel}>DEMON HP</Text>
            <View style={styles.hpBarContainer}>
              <Animated.View
                style={[
                  styles.hpBar,
                  {
                    width: `${(enemyCurrentHp / enemy.hp) * 100}%`,
                    backgroundColor: getHpBarColor(enemyCurrentHp, enemy.hp),
                    transform: [{ scaleY: enemyHpAnimation }]
                  }
                ]}
              />
            </View>
            <Text style={styles.hpText}>{enemyCurrentHp}/{enemy.hp}</Text>
          </View>
        </View>

        {/* Current Action */}
        <View style={styles.actionSection}>
          <Text style={styles.actionText}>{currentAction}</Text>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroName}>DEMON CRUSHER</Text>
          <Text style={styles.heroLevel}>Level {Math.floor(heroData.exp / 100) + 1}</Text>

          <View style={styles.hpContainer}>
            <Text style={styles.hpLabel}>YOUR HP</Text>
            <View style={styles.hpBarContainer}>
              <Animated.View
                style={[
                  styles.hpBar,
                  {
                    width: `${(heroCurrentHp / heroData.hp) * 100}%`,
                    backgroundColor: getHpBarColor(heroCurrentHp, heroData.hp),
                    transform: [{ scaleY: heroHpAnimation }]
                  }
                ]}
              />
            </View>
            <Text style={styles.hpText}>{heroCurrentHp}/{heroData.hp}</Text>
          </View>
        </View>

        {/* Battle Log */}
        <View style={styles.battleLogSection}>
          <Text style={styles.battleLogTitle}>⚔️ BATTLE LOG ⚔️</Text>
          <ScrollView
            style={styles.battleLogScroll}
            ref={ref => ref?.scrollToEnd({ animated: true })}
          >
            {battleLog.map((log, index) => (
              <Text key={index} style={styles.battleLogText}>
                {log}
              </Text>
            ))}
          </ScrollView>
        </View>

        {/* Action Buttons */}
        {(battlePhase === 'victory' || battlePhase === 'defeat') && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.continueButton} onPress={battlePhase === 'victory' ? () => {} : onDefeat}>
              <Text style={styles.continueButtonText}>
                {battlePhase === 'victory' ? '✨ CONTINUE' : '🔄 TRY AGAIN'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {battlePhase === 'intro' && (
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.fleeButton} onPress={onFlee}>
              <Text style={styles.fleeButtonText}>🏃 FLEE BATTLE</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  battleArena: {
    flex: 1,
    padding: 20,
  },
  enemySection: {
    backgroundColor: '#1a1a1a',
    borderWidth: 3,
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  enemyName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF4444',
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 5,
  },
  enemyTier: {
    fontSize: 12,
    color: '#CCCCCC',
    fontFamily: 'monospace',
    marginBottom: 15,
  },
  actionSection: {
    backgroundColor: '#111111',
    borderWidth: 2,
    borderColor: '#FFD700',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    minHeight: 60,
    justifyContent: 'center',
  },
  actionText: {
    fontSize: 16,
    color: '#FFD700',
    fontFamily: 'monospace',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  heroSection: {
    backgroundColor: '#1a1a1a',
    borderWidth: 3,
    borderColor: '#44FF44',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
  },
  heroName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#44FF44',
    fontFamily: 'monospace',
    marginBottom: 5,
  },
  heroLevel: {
    fontSize: 12,
    color: '#CCCCCC',
    fontFamily: 'monospace',
    marginBottom: 15,
  },
  hpContainer: {
    width: '100%',
    alignItems: 'center',
  },
  hpLabel: {
    fontSize: 12,
    color: '#CCCCCC',
    fontFamily: 'monospace',
    marginBottom: 5,
  },
  hpBarContainer: {
    width: '100%',
    height: 20,
    backgroundColor: '#333333',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 5,
  },
  hpBar: {
    height: '100%',
    borderRadius: 10,
  },
  hpText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  battleLogSection: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    borderWidth: 2,
    borderColor: '#666666',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  battleLogTitle: {
    fontSize: 14,
    color: '#FFD700',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 10,
  },
  battleLogScroll: {
    flex: 1,
  },
  battleLogText: {
    fontSize: 12,
    color: '#CCCCCC',
    fontFamily: 'monospace',
    marginBottom: 5,
    lineHeight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  continueButton: {
    flex: 1,
    backgroundColor: '#44FF44',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  fleeButton: {
    flex: 1,
    backgroundColor: '#666666',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  fleeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'monospace',
  },
});