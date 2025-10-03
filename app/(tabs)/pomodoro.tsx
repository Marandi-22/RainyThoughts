import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, AppState, AppStateStatus } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { PreBattleTauntScreen } from '../../components/PreBattleTauntScreen';
import { BattleScreen } from '../../components/BattleScreen';
import { TaskCompletionInterface } from '../../components/TaskCompletionInterface';
import { CHARACTERS, Character, getCharacterById, getCharacterMessages, getAvailableCharacters, getLockedCharacters } from '../../constants/characters';
import { HeroData, HeroStats, loadHeroData, updateHeroAfterCompletion, calculateTotalStats } from '../../constants/gameSystem';
import { CharacterTauntService } from '../../services/characterTauntService';
import { recordWorkSession } from '../../services/rotTrackerService';
import {
  EnemyData,
  initializeEnemy,
  startBattleSession,
  completeBattleSession,
  cancelBattleSession,
  getEnemyData,
} from '../../constants/battleSystem';

type SessionState = 'idle' | 'preTaunt' | 'battle' | 'completed' | 'defeat';

export default function PomodoroScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const characterId = params.characterId as string | undefined;
  const autoStart = params.autoStart as string | undefined;

  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [sessionState, setSessionState] = useState<SessionState>('idle');
  const [duration, setDuration] = useState(25); // minutes
  const [timeRemaining, setTimeRemaining] = useState(1500); // seconds
  const [isPaused, setIsPaused] = useState(false);
  const [heroData, setHeroData] = useState<HeroData | null>(null);
  const [defeatTaunt, setDefeatTaunt] = useState('');
  const [enemyData, setEnemyData] = useState<EnemyData | null>(null);
  const [midTaunt, setMidTaunt] = useState<string>('');
  const [enemiesData, setEnemiesData] = useState<Record<string, EnemyData>>({});

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const tauntIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const backgroundTimeRef = useRef<number>(0);

  useEffect(() => {
    loadData();

    // Handle background/foreground transitions
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription?.remove();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (tauntIntervalRef.current) {
        clearInterval(tauntIntervalRef.current);
      }
      deactivateKeepAwake();
    };
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (sessionState === 'battle' && !isPaused) {
      // Going to background
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        backgroundTimeRef.current = Date.now();
      }

      // Coming back to foreground
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (backgroundTimeRef.current > 0) {
          const timeInBackground = Math.floor((Date.now() - backgroundTimeRef.current) / 1000);

          // Update timer with time passed in background
          setTimeRemaining((prev) => {
            const newTime = Math.max(0, prev - timeInBackground);
            if (newTime === 0) {
              handleTimerComplete();
            }
            return newTime;
          });

          backgroundTimeRef.current = 0;
        }
      }
    }

    appState.current = nextAppState;
  };

  useEffect(() => {
    if (characterId && heroData) {
      const character = getCharacterById(characterId);
      if (character) {
        handleCharacterSelect(character);
      }
    }
  }, [characterId, heroData]);

  const loadData = async () => {
    const data = await loadHeroData();
    setHeroData(data);

    // Load enemy HP data for all demons
    const demons = CHARACTERS.filter((c) => c.category === 'demon');
    const enemiesMap: Record<string, EnemyData> = {};

    for (const demon of demons) {
      const enemyData = await getEnemyData(demon.id);
      if (enemyData) {
        enemiesMap[demon.id] = enemyData;
      }
    }

    setEnemiesData(enemiesMap);
  };

  const handleCharacterSelect = async (character: Character) => {
    if (sessionState !== 'idle') {
      Alert.alert('Session in progress', 'Finish your current session first!');
      return;
    }

    if (!heroData) {
      Alert.alert('Error', 'Hero data not loaded. Please try again.');
      return;
    }

    // Check if character is locked
    const totalStats = calculateTotalStats(heroData.stats);
    const statsReq = character.minStats ?? 0;
    const streakReq = character.minStreak ?? 0;

    if (totalStats < statsReq || heroData.streakDays < streakReq) {
      Alert.alert(
        '🔒 Character Locked',
        `You need ${statsReq} total stats${streakReq > 0 ? ` and ${streakReq} day streak` : ''} to unlock ${character.name}.`
      );
      return;
    }

    try {
      // Initialize enemy data
      const enemy = await initializeEnemy(character, heroData);
      setEnemyData(enemy);
      setSelectedCharacter(character);
      setSessionState('preTaunt');
    } catch (error) {
      console.error('Error initializing enemy:', error);
      Alert.alert('Error', 'Failed to initialize battle. Please try again.');
    }
  };

  const handleStartBattle = async () => {
    if (!selectedCharacter) return;

    setTimeRemaining(duration * 60);
    setSessionState('battle');
    setIsPaused(false);

    // Start battle session tracking
    await startBattleSession(selectedCharacter.id, duration);

    // Activate keep-awake
    await activateKeepAwakeAsync();

    // Start timer
    startTimer();

    // Start mid-session taunts (every 5 minutes)
    startTauntInterval();
  };

  const startTauntInterval = () => {
    if (tauntIntervalRef.current) {
      clearInterval(tauntIntervalRef.current);
    }

    // Show initial taunt immediately
    showRandomTaunt();

    // Change taunt every 5-10 minutes (random)
    const scheduleNextTaunt = () => {
      const randomInterval = (5 + Math.random() * 5) * 60 * 1000; // 5-10 minutes
      tauntIntervalRef.current = setTimeout(() => {
        if (selectedCharacter && !isPaused) {
          showRandomTaunt();
          scheduleNextTaunt(); // Schedule next one
        }
      }, randomInterval);
    };

    scheduleNextTaunt();
  };

  const showRandomTaunt = async () => {
    if (!selectedCharacter || !enemyData) return;

    // Get messages based on defeat count
    const messages = getCharacterMessages(selectedCharacter, enemyData.defeats);
    if (!messages) {
      setMidTaunt("...");
      return;
    }

    // Generate AI taunt with defeat count context (breaking stage aware)
    const taunt = await CharacterTauntService.getMidBattleTaunt(selectedCharacter, enemyData.defeats);

    setMidTaunt(taunt);
    // Taunt stays visible (don't clear it anymore)
  };

  const handleSkipTaunt = () => {
    handleStartBattle();
  };

  const startTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleTimerComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleTimerComplete = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    deactivateKeepAwake();
    setSessionState('completed');
  };

  const handlePause = () => {
    if (isPaused) {
      setIsPaused(false);
      startTimer();
      startTauntInterval();
    } else {
      setIsPaused(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (tauntIntervalRef.current) {
        clearTimeout(tauntIntervalRef.current);
      }
    }
  };

  const handleQuit = async () => {
    Alert.alert(
      'Quit Session?',
      'You will face the character\'s defeat taunt and lose this session.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Quit',
          style: 'destructive',
          onPress: async () => {
            if (timerRef.current) {
              clearInterval(timerRef.current);
            }
            if (tauntIntervalRef.current) {
              clearInterval(tauntIntervalRef.current);
            }
            deactivateKeepAwake();

            // Cancel battle session
            await cancelBattleSession();

            if (selectedCharacter) {
              const taunt = await CharacterTauntService.getDefeatTaunt(selectedCharacter);
              setDefeatTaunt(taunt);
            }

            setSessionState('defeat');
          },
        },
      ]
    );
  };

  const handleTaskComplete = async (quality: number, allocatedStats: HeroStats) => {
    if (!selectedCharacter) return;

    try {
      // Complete battle session and get damage result
      const { enemyDefeated, damage, enemy } = await completeBattleSession(quality);

      // Update hero stats
      const updatedHero = await updateHeroAfterCompletion(
        selectedCharacter.id,
        duration * 60,
        quality,
        allocatedStats
      );

      // Record work session for rot tracker
      await recordWorkSession();

      setHeroData(updatedHero);

      // Show battle result
      if (enemyDefeated) {
        // Check if enemy has committed suicide
        const threshold = selectedCharacter.suicideThreshold || 15;
        const messages = getCharacterMessages(selectedCharacter, enemy.defeats);

        if (enemy.defeats >= threshold || !messages) {
          // SUICIDE - Character is permanently erased
          Alert.alert(
            '💀 ENEMY ERASED 💀',
            `${selectedCharacter.name} has been defeated ${enemy.defeats} times.\n\n"${selectedCharacter.messages.shattered?.finalWords || 'I can\'t do this anymore... goodbye.'}"\n\n${selectedCharacter.name} has ended themselves. They can no longer be fought.\n\nLevel ${updatedHero.level} - ${updatedHero.heroState.toUpperCase()}`,
            [{ text: 'They\'re gone...', onPress: () => resetSession() }]
          );
        } else {
          // Get enemy defeated message based on defeat count
          let defeatMsg = '';
          if (messages.enemyDefeated && messages.enemyDefeated.length > 0) {
            const msgs = messages.enemyDefeated;
            defeatMsg = msgs[Math.floor(Math.random() * msgs.length)];
          } else {
            defeatMsg = "Damn... you actually won. I'll be back.";
          }

          // Show defeat state
          let stateMsg = '';
          if (enemy.defeats >= 10) {
            stateMsg = '\n\n💔 SHATTERED - Completely broken';
          } else if (enemy.defeats >= 6) {
            stateMsg = '\n\n😰 BROKEN - Ego destroyed';
          } else if (enemy.defeats >= 3) {
            stateMsg = '\n\n😨 BREAKING - Starting to crack';
          }

          Alert.alert(
            '🏆 ENEMY DEFEATED! 🏆',
            `You dealt ${damage} damage and defeated ${selectedCharacter.name}!\n\nDefeat Count: ${enemy.defeats}${stateMsg}\n\n"${defeatMsg}"\n\nThey will respawn with +50 HP...\n\nLevel ${updatedHero.level} - ${updatedHero.heroState.toUpperCase()}`,
            [{ text: 'Victory!', onPress: () => resetSession() }]
          );
        }
      } else {
        Alert.alert(
          '⚔️ BATTLE COMPLETE ⚔️',
          `You dealt ${damage} damage to ${selectedCharacter.name}!\n\nEnemy HP: ${enemy.currentHp}/${enemy.maxHp}\n\nLevel ${updatedHero.level} - ${updatedHero.heroState.toUpperCase()}`,
          [{ text: 'Continue', onPress: () => resetSession() }]
        );
      }

      router.push('/');
    } catch (error) {
      console.error('Error completing task:', error);
      Alert.alert('Error', 'Failed to save progress. Please try again.');
    }
  };

  const handleCancelCompletion = () => {
    resetSession();
  };

  const resetSession = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    deactivateKeepAwake();
    setSessionState('idle');
    setSelectedCharacter(null);
    setTimeRemaining(duration * 60);
    setIsPaused(false);
  };

  const handleDismissDefeat = () => {
    resetSession();
  };

  if (!heroData) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {sessionState === 'idle' && (
        <ScrollView contentContainerStyle={styles.idleContainer}>
          <Text style={styles.title}>⚔️ SELECT YOUR OPPONENT ⚔️</Text>
          <Text style={styles.subtitle}>Choose a character to face in battle</Text>

          <View style={styles.durationContainer}>
            <Text style={styles.durationLabel}>Session Duration (minutes)</Text>
            <View style={styles.durationButtons}>
              {[5, 10, 15, 20, 25, 30, 45, 60].map((mins) => (
                <TouchableOpacity
                  key={mins}
                  style={[
                    styles.durationButton,
                    duration === mins && styles.durationButtonActive,
                  ]}
                  onPress={() => setDuration(mins)}
                >
                  <Text
                    style={[
                      styles.durationButtonText,
                      duration === mins && styles.durationButtonTextActive,
                    ]}
                  >
                    {mins}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.charactersList}>
            {/* Available Characters */}
            {heroData && getAvailableCharacters(calculateTotalStats(heroData.stats), heroData.streakDays)
              .filter((c) => c.category === 'demon')
              .map((character) => {
                const enemy = enemiesData[character.id];

                // Check if enemy has committed suicide
                const threshold = character.suicideThreshold || 15;
                if (enemy && enemy.defeats >= threshold) {
                  return null; // Don't show suicided enemies
                }

                return (
                  <TouchableOpacity
                    key={character.id}
                    style={[styles.characterButton, { borderColor: character.themeColor }]}
                    onPress={() => handleCharacterSelect(character)}
                  >
                    <View style={styles.characterInfo}>
                      <Text style={styles.characterButtonName}>{character.name}</Text>
                      <Text style={[styles.characterButtonType, { color: character.themeColor }]}>
                        {character.personality.replace(/_/g, ' ')}
                      </Text>
                      {enemy && (
                        <View style={styles.enemyHpContainer}>
                          {enemy.isDefeated ? (
                            <Text style={styles.defeatedText}>💀 DEFEATED - Will respawn stronger</Text>
                          ) : (
                            <>
                              <Text style={styles.enemyHpText}>
                                HP: {enemy.currentHp} / {enemy.maxHp}
                              </Text>
                              <View style={styles.miniHpBar}>
                                <View
                                  style={[
                                    styles.miniHpBarFill,
                                    {
                                      backgroundColor: character.themeColor,
                                      width: `${(enemy.currentHp / enemy.maxHp) * 100}%`,
                                    },
                                  ]}
                                />
                              </View>
                            </>
                          )}
                          {enemy.defeats > 0 && (
                            <Text style={styles.defeatsText}>💀 × {enemy.defeats}</Text>
                          )}
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}

            {/* Locked Characters */}
            {heroData && getLockedCharacters(calculateTotalStats(heroData.stats), heroData.streakDays)
              .filter((c) => c.category === 'demon')
              .map((character) => {
                const enemy = enemiesData[character.id];

                // Check if enemy has committed suicide
                const threshold = character.suicideThreshold || 15;
                if (enemy && enemy.defeats >= threshold) {
                  return null; // Don't show suicided enemies
                }

                return (
                  <View
                    key={character.id}
                    style={[styles.characterButton, styles.lockedCharacterButton]}
                  >
                    <View style={styles.characterInfo}>
                      <Text style={[styles.characterButtonName, styles.lockedText]}>
                        🔒 {character.name}
                      </Text>
                      <Text style={[styles.characterButtonType, styles.lockedText]}>
                        {character.personality.replace(/_/g, ' ')}
                      </Text>
                      <Text style={styles.requirementText}>
                        {character.minStats && `${character.minStats} total stats`}
                        {character.minStats && character.minStreak && ' • '}
                        {character.minStreak && `${character.minStreak} day streak`}
                      </Text>
                    </View>
                  </View>
                );
              })}
          </View>
        </ScrollView>
      )}

      {sessionState === 'battle' && selectedCharacter && enemyData && (
        <BattleScreen
          character={selectedCharacter}
          timeRemaining={timeRemaining}
          onPause={handlePause}
          onQuit={handleQuit}
          isPaused={isPaused}
          enemyData={enemyData}
          midTaunt={midTaunt}
        />
      )}

      {sessionState === 'defeat' && selectedCharacter && (
        <View style={styles.defeatContainer}>
          <Text style={styles.defeatTitle}>DEFEAT 💀</Text>
          <Text style={[styles.defeatCharacter, { color: selectedCharacter.themeColor }]}>
            {selectedCharacter.name}:
          </Text>
          <Text style={styles.defeatTaunt}>{defeatTaunt}</Text>
          <TouchableOpacity style={styles.dismissButton} onPress={handleDismissDefeat}>
            <Text style={styles.dismissButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {selectedCharacter && (
        <>
          <PreBattleTauntScreen
            visible={sessionState === 'preTaunt'}
            character={selectedCharacter}
            onStartBattle={handleStartBattle}
            onSkip={handleSkipTaunt}
          />

          <TaskCompletionInterface
            visible={sessionState === 'completed'}
            character={selectedCharacter}
            streakDays={heroData.streakDays}
            defeatCount={enemyData?.defeats || 0}
            onComplete={handleTaskComplete}
            onCancel={handleCancelCompletion}
          />
        </>
      )}
    </View>
  );
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
  idleContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 30,
  },
  durationContainer: {
    marginBottom: 30,
  },
  durationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  durationButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#333333',
    backgroundColor: '#1a1a1a',
  },
  durationButtonActive: {
    borderColor: '#FF4444',
    backgroundColor: '#FF4444',
  },
  durationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#888888',
  },
  durationButtonTextActive: {
    color: '#FFFFFF',
  },
  charactersList: {
    gap: 12,
  },
  characterButton: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    backgroundColor: '#1a1a1a',
  },
  characterInfo: {
    flex: 1,
  },
  characterButtonName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  characterButtonType: {
    fontSize: 14,
    marginBottom: 8,
  },
  enemyHpContainer: {
    marginTop: 8,
  },
  enemyHpText: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  miniHpBar: {
    height: 6,
    backgroundColor: '#0a0a0a',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  miniHpBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  defeatedText: {
    fontSize: 12,
    color: '#FF4444',
    fontStyle: 'italic',
  },
  defeatsText: {
    fontSize: 12,
    color: '#FF4444',
    fontWeight: 'bold',
  },
  defeatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#0a0a0a',
  },
  defeatTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF4444',
    marginBottom: 30,
  },
  defeatCharacter: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  defeatTaunt: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
  },
  dismissButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#FF4444',
  },
  dismissButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  lockedCharacterButton: {
    borderColor: '#333333',
    opacity: 0.6,
  },
  lockedText: {
    color: '#888888',
  },
  requirementText: {
    fontSize: 10,
    color: '#666666',
    marginTop: 4,
  },
});
