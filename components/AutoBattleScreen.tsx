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
  isGrindingMode?: boolean;
  canWin?: boolean;
  pomodoroTimeLeft?: number; // Time left in pomodoro session (in seconds)
}

export default function AutoBattleScreen({ enemy, heroData, onVictory, onDefeat, onFlee, isGrindingMode = false, canWin = true, pomodoroTimeLeft = 1500 }: AutoBattleScreenProps) {
  const [enemyCurrentHp, setEnemyCurrentHp] = useState(enemy.hp);
  const [heroCurrentHp, setHeroCurrentHp] = useState(heroData.hp);
  const [battleLog, setBattleLog] = useState<string[]>([]);
  const [battlePhase, setBattlePhase] = useState<'intro' | 'combat' | 'victory' | 'defeat'>('intro');
  const [currentAction, setCurrentAction] = useState<string>('');
  const [turnCount, setTurnCount] = useState(0);
  const [battleTimer, setBattleTimer] = useState<number>(pomodoroTimeLeft);
  const [lastTurnTime, setLastTurnTime] = useState<number>(Date.now());

  // Animation values
  const [shakeAnimation] = useState(new Animated.Value(0));
  const [enemyHpAnimation] = useState(new Animated.Value(1));
  const [heroHpAnimation] = useState(new Animated.Value(1));

  useEffect(() => {
    if (battlePhase === 'intro') {
      startTimerBasedBattle();
    }
  }, []);

  // Timer-based battle system
  useEffect(() => {
    if (battlePhase === 'combat' && battleTimer > 0) {
      const interval = setInterval(() => {
        setBattleTimer(prev => {
          if (prev <= 1) {
            // Pomodoro ended - resolve battle based on current HP
            if (enemyCurrentHp <= heroCurrentHp) {
              setBattlePhase('victory');
              handleVictory();
            } else {
              setBattlePhase('defeat');
              handleDefeat();
            }
            return 0;
          }
          return prev - 1;
        });

        // Execute turns every 10 seconds
        const now = Date.now();
        if (now - lastTurnTime >= 10000) {
          executeTurn();
          setLastTurnTime(now);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [battlePhase, battleTimer, lastTurnTime, enemyCurrentHp, heroCurrentHp]);

  const startTimerBasedBattle = async () => {
    setBattleLog(['🔥 EXTENDED BATTLE BEGINS! 🔥']);
    setCurrentAction('Prepare for a long battle during your focus session...');

    setTimeout(() => {
      setBattlePhase('combat');
      setLastTurnTime(Date.now());
      setBattleLog(prev => [...prev, '⚔️ Battle will continue throughout your pomodoro session!']);
    }, 2000);
  };

  const executeTurn = () => {
    if (battlePhase !== 'combat' || enemyCurrentHp <= 0 || heroCurrentHp <= 0) return;

    setTurnCount(prev => prev + 1);
    const heroStat = getRandomStat();
    const heroDamage = calculateHeroDamage(heroStat);
    const enemyDamage = calculateEnemyDamage();

    // Hero attacks first
    const newEnemyHp = Math.max(0, enemyCurrentHp - heroDamage);
    setEnemyCurrentHp(newEnemyHp);

    setBattleLog(prev => [...prev,
      `💥 You attack with ${heroStat} dealing ${heroDamage} damage! (Enemy: ${newEnemyHp}/${enemy.hp} HP)`
    ]);

    if (newEnemyHp > 0) {
      // Enemy counter-attacks
      const newHeroHp = Math.max(0, heroCurrentHp - enemyDamage);
      setHeroCurrentHp(newHeroHp);

      setBattleLog(prev => [...prev,
        `🔥 ${enemy.name} attacks dealing ${enemyDamage} damage! (You: ${newHeroHp}/${heroData.hp} HP)`
      ]);

      if (newHeroHp <= 0) {
        setBattlePhase('defeat');
        handleDefeat();
      }
    } else {
      setBattlePhase('victory');
      handleVictory();
    }

    animateHpBar(true);
    animateHpBar(false);
  };

  const executeTauntOnlyEncounter = async () => {
    const tauntSequences = [
      "💀 The demon looks down at you with contempt...",
      "😈 Your skills are far too weak to challenge me!",
      "👹 You dare approach a being of my power?",
      "🔥 This is what TRUE strength looks like!",
      "💥 You need much more training before facing me!",
      "⚡ Feel the weight of my overwhelming presence!",
      "💀 Run along, little warrior. Come back when you're stronger."
    ];

    for (let i = 0; i < tauntSequences.length; i++) {
      setCurrentAction(tauntSequences[i]);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setBattleLog(prev => [...prev, tauntSequences[i]]);
    }

    // End with intimidation defeat
    setBattlePhase('defeat');
    await handleTauntOnlyDefeat();
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
    if (isGrindingMode) {
      setCurrentAction('🔄 GRINDING VICTORY! Experience gained! 🔄');
    } else {
      setCurrentAction('🎉 VICTORY! The demon is crushed! 🎉');
    }

    try {
      const victoryTaunt = await BattleTauntManager.getVictoryTaunt(enemy);
      setBattleLog(prev => [...prev,
        `✅ ${enemy.name} is DEFEATED!`,
        `💬 "${victoryTaunt}"`,
        isGrindingMode
          ? '🔄 Grinding success! (Reduced rewards)'
          : isDraw ? '⚖️ Hard-fought battle!' : '🏆 Flawless victory!'
      ]);
    } catch (error) {
      setBattleLog(prev => [...prev, `✅ ${enemy.name} is DEFEATED!`]);
    }

    const baseExpGained = isDraw ? Math.floor(enemy.hp * 0.7) : enemy.hp;
    const baseStatGained = isDraw ? Math.floor(enemy.hp / 15) : Math.floor(enemy.hp / 10);

    // Apply grinding penalty in the AutoBattleScreen (will be applied again in handleBattleVictory)
    const expGained = isGrindingMode ? Math.floor(baseExpGained * 0.5) : baseExpGained;
    const statGained = isGrindingMode ? Math.floor(baseStatGained * 0.5) : baseStatGained;

    const randomStat = getRandomStat();
    const statsGained = { [randomStat]: statGained };

    setBattleLog(prev => [...prev,
      `💫 +${expGained} EXP gained!${isGrindingMode ? ' (Grinding penalty applied)' : ''}`,
      `📈 +${statGained} ${randomStat.toUpperCase()} gained!${isGrindingMode ? ' (Grinding penalty applied)' : ''}`
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

  const handleTauntOnlyDefeat = async () => {
    setCurrentAction('💀 OVERWHELMED! You flee before the superior demon... 💀');

    try {
      const defeatTaunt = await BattleTauntManager.getDefeatTaunt(enemy);
      setBattleLog(prev => [...prev,
        `❌ You have been intimidated by ${enemy.name}!`,
        `💬 "${defeatTaunt}"`,
        `📚 Return when you're stronger! You need more EXP to challenge this foe.`
      ]);
    } catch (error) {
      setBattleLog(prev => [...prev,
        `❌ You have been intimidated by ${enemy.name}!`,
        `📚 Return when you're stronger! You need more EXP to challenge this foe.`
      ]);
    }

    setTimeout(onDefeat, 3000);
  };

  const getRandomStat = (): keyof typeof heroData.stats => {
    const stats: (keyof typeof heroData.stats)[] = ['wealth', 'strength', 'wisdom', 'luck'];
    return stats[Math.floor(Math.random() * stats.length)];
  };

  const calculateHeroDamage = (stat: keyof typeof heroData.stats): number => {
    const playerLevel = Math.floor(heroData.exp / 200) + 1; // Harder leveling (200 exp per level)
    const enemyLevel = Math.floor(enemy.hp / 15); // Enemies are relatively stronger

    // Much harder damage scaling - severely reduced base damage
    const levelDifference = playerLevel - enemyLevel;
    const baseMultiplier = Math.max(0.15, 0.25 + (levelDifference * 0.05)); // Much lower multiplier

    const statValue = heroData.stats[stat];
    const baseDamage = Math.floor(statValue * baseMultiplier * 0.4); // Further reduced by 0.4
    const randomVariation = Math.floor(Math.random() * 8) + 2; // Much less random bonus

    // Smaller bonuses/penalties
    const weaknessBonus = stat === enemy.weakness ? Math.floor(baseDamage * 0.2) : 0;
    const strengthPenalty = stat === enemy.strength ? Math.floor(baseDamage * 0.3) : 0;

    // Much lower minimum damage
    return Math.max(2, baseDamage + randomVariation + weaknessBonus - strengthPenalty);
  };

  const calculateEnemyDamage = (): number => {
    const playerLevel = Math.floor(heroData.exp / 200) + 1; // Match hero leveling
    const enemyLevel = Math.floor(enemy.hp / 15); // Match enemy scaling

    // Much higher enemy damage to make battles grindier
    const tierMultiplier = {
      'small_fry': 1.2,
      'personal_tormentor': 1.5,
      'psychological_destroyer': 1.8,
      'inner_demon': 2.1,
      'ultimate_boss': 2.5
    };

    const levelDifference = enemyLevel - playerLevel;
    const levelMultiplier = Math.max(1.2, 1.5 + (levelDifference * 0.25)); // Much higher scaling

    const multiplier = (tierMultiplier[enemy.tier] || 1.2) * levelMultiplier;
    const baseDamage = Math.floor(enemy.hp * 0.18 * multiplier); // Higher base damage
    const randomVariation = Math.floor(Math.random() * 18) + 12; // Higher random damage

    return Math.max(15, baseDamage + randomVariation); // Higher minimum damage
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