// app/(tabs)/pomodoro.tsx - Psychological Warfare RPG
import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, StatusBar, ScrollView, Modal } from "react-native";
import AutoBattleScreen from "@/components/AutoBattleScreen";
import TaskCompletionInterface from "@/components/TaskCompletionInterface";
import TodoManager, { Todo } from "@/components/TodoManager";
import TodoCompletionSelector from "@/components/TodoCompletionSelector";
import PreBattleTauntScreen from "@/components/PreBattleTauntScreen";
import AmbientTauntDisplay from "@/components/AmbientTauntDisplay";
import { QuestManager } from "@/utils/questUtils";
import { BattleTauntManager } from "@/utils/battleTauntManager";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useKeepAwake } from "expo-keep-awake";
import {
  HeroData,
  createDefaultHero,
  calculateHeroState,
  getCurrentAct,
  getStatEmoji,
  getStatName,
  getStatColor,
  allocateStatPoints,
  TaskCompletion,
  StatType
} from "@/constants/gameSystem";
import { ALL_ENEMIES, getUnlockedEnemies, getEnemyById, Enemy } from "@/constants/enemies";

export default function DemonCrusherRPG() {
  useKeepAwake();

  // RPG Core State
  const [heroData, setHeroData] = useState<HeroData>(createDefaultHero());
  const [unlockedEnemies, setUnlockedEnemies] = useState<Enemy[]>([]);
  const [availableEnemies, setAvailableEnemies] = useState<Enemy[]>([]);

  // Battle System
  const [showBattle, setShowBattle] = useState(false);
  const [currentEnemy, setCurrentEnemy] = useState<Enemy | null>(null);
  const [showPreBattleTaunt, setShowPreBattleTaunt] = useState(false);
  const [pendingEnemy, setPendingEnemy] = useState<Enemy | null>(null);

  // Timer System
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [onBreak, setOnBreak] = useState(false);

  // UI State
  const [selectedView, setSelectedView] = useState<'quest' | 'battle' | 'stats' | 'enemies'>('quest');
  const [showTaskCompletion, setShowTaskCompletion] = useState(false);
  const [showTodoManager, setShowTodoManager] = useState(false);
  const [showTodoSelector, setShowTodoSelector] = useState(false);
  const [activeTodos, setActiveTodos] = useState<Todo[]>([]);
  const [showAmbientTaunts, setShowAmbientTaunts] = useState(true);

  const intervalRef = useRef<number | null>(null);

  // Load hero data on mount and pre-generate taunts
  useEffect(() => {
    loadHeroData();
    loadActiveTodos();

    // Pre-generate taunts for available enemies to avoid waiting
    const preGenerateTaunts = async () => {
      try {
        await BattleTauntManager.preGenerateTaunts(availableEnemies);
        console.log('Pre-battle taunts cached for available enemies');
      } catch (error) {
        console.error('Error pre-generating taunts:', error);
      }
    };

    if (availableEnemies.length > 0) {
      preGenerateTaunts();
    }
  }, []);

  // Update unlocked enemies when hero data changes
  useEffect(() => {
    updateUnlockedEnemies();
  }, [heroData.streakDays, heroData.stats, heroData.totalPomodoros]);

  // Countdown logic
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((prev) => {
          if (prev === 0) {
            if (minutes === 0) {
              completePomodoroSession();
              return 0;
            }
            setMinutes((m) => m - 1);
            return 59;
          }
          return prev - 1;
        });
      }, 1000) as unknown as number;
    } else if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [running, minutes]);

  // Save hero data when it changes
  useEffect(() => {
    saveHeroData();
  }, [heroData]);

  // Core RPG Functions
  const loadHeroData = async () => {
    try {
      const stored = await AsyncStorage.getItem('heroData');
      if (stored) {
        const data = JSON.parse(stored);
        setHeroData(data);
      }
    } catch (error) {
      console.error('Error loading hero data:', error);
    }
  };

  const saveHeroData = async () => {
    try {
      await AsyncStorage.setItem('heroData', JSON.stringify(heroData));
    } catch (error) {
      console.error('Error saving hero data:', error);
    }
  };

  const updateUnlockedEnemies = () => {
    const unlocked = getUnlockedEnemies(
      heroData.streakDays,
      heroData.stats,
      heroData.totalPomodoros
    );
    setUnlockedEnemies(unlocked);

    // Available enemies are unlocked enemies not yet defeated
    const available = unlocked.filter(enemy =>
      !heroData.defeatedEnemies.includes(enemy.id)
    );
    setAvailableEnemies(available);

    console.log('🔓 Enemies updated:', {
      streak: heroData.streakDays,
      totalStats: Object.values(heroData.stats).reduce((sum, val) => sum + val, 0),
      totalPomodoros: heroData.totalPomodoros,
      defeated: heroData.defeatedEnemies.length,
      unlocked: unlocked.length,
      available: available.length,
      nextAvailable: available.slice(0, 3).map(e => e.name)
    });
  };

  // Complete a pomodoro session - triggers RPG progression
  const completePomodoroSession = async () => {
    if (onBreak) {
      // End break, reset to Pomodoro
      setOnBreak(false);
      setMinutes(pomodoroMinutes);
      setSeconds(0);
      setRunning(false);
      return;
    }

    console.log('🍅 POMODORO COMPLETED! Checking for enemies...');

    // Pomodoro complete - update hero progress
    const newHeroData = {
      ...heroData,
      totalPomodoros: heroData.totalPomodoros + 1,
      exp: heroData.exp + 25, // Base EXP for completing session
      completedToday: heroData.completedToday + 1
    };

    // Update hero state
    newHeroData.heroState = calculateHeroState(newHeroData);
    newHeroData.currentAct = getCurrentAct(newHeroData);

    setHeroData(newHeroData);

    console.log('Hero Data:', {
      streak: newHeroData.streakDays,
      stats: newHeroData.stats,
      totalPomodoros: newHeroData.totalPomodoros,
      defeatedEnemies: newHeroData.defeatedEnemies
    });

    // Check for available enemies to battle
    console.log('Available enemies:', availableEnemies.length);
    console.log('Unlocked enemies:', unlockedEnemies.length);

    if (availableEnemies.length > 0) {
      // Select an enemy for battle (prioritize by tier and unlock day)
      const enemy = selectNextEnemy();
      console.log('Selected enemy for battle:', enemy?.name);
      if (enemy) {
        triggerBattle(enemy);
        return;
      }
    } else {
      console.log('No available enemies - checking unlock requirements...');

      // Force check unlocked enemies with current stats
      const forceUnlocked = getUnlockedEnemies(
        newHeroData.streakDays,
        newHeroData.stats,
        newHeroData.totalPomodoros
      );
      console.log('Force unlocked enemies:', forceUnlocked.length, forceUnlocked.map(e => e.name));

      // If we have unlocked enemies but no available ones, trigger the first unlocked
      if (forceUnlocked.length > 0) {
        const firstUnlocked = forceUnlocked.find(enemy =>
          !newHeroData.defeatedEnemies.includes(enemy.id)
        );
        if (firstUnlocked) {
          console.log('Forcing battle with:', firstUnlocked.name);
          triggerBattle(firstUnlocked);
          return;
        }
      }
    }

    // No battle available, show pomodoro-completable quests
    const pomodoroQuests = activeTodos.filter(todo =>
      todo.completionMethod === 'pomodoro' || todo.completionMethod === 'both'
    );

    if (pomodoroQuests.length > 0) {
      setShowTodoSelector(true);
    } else {
      setShowTaskCompletion(true);
    }
    setMinutes(breakMinutes);
    setSeconds(0);
    setOnBreak(true);
    setRunning(false);
  };

  const selectNextEnemy = (): Enemy | null => {
    if (availableEnemies.length === 0) return null;

    // Prioritize by act and unlock day
    const sorted = [...availableEnemies].sort((a, b) => {
      if (a.act !== b.act) return a.act - b.act;
      return a.unlockDay - b.unlockDay;
    });

    return sorted[0];
  };

  const triggerBattle = (enemy: Enemy) => {
    console.log('Triggering battle with:', enemy.name);
    setPendingEnemy(enemy);
    setShowPreBattleTaunt(true);
    setShowAmbientTaunts(false); // Hide ambient taunts during battle
    setRunning(false);
  };

  const handleStartBattle = () => {
    if (pendingEnemy) {
      setCurrentEnemy(pendingEnemy);
      setShowPreBattleTaunt(false);
      setShowBattle(true);
      setPendingEnemy(null);
    }
  };

  const handleSkipTaunt = () => {
    if (pendingEnemy) {
      setCurrentEnemy(pendingEnemy);
      setShowPreBattleTaunt(false);
      setShowBattle(true);
      setPendingEnemy(null);
    }
  };

  const handleBattleVictory = (expGained: number, statsGained: any) => {
    const newHeroData = {
      ...heroData,
      exp: heroData.exp + expGained,
      defeatedEnemies: [...heroData.defeatedEnemies, currentEnemy!.id]
    };

    // Add stat gains
    Object.entries(statsGained).forEach(([stat, value]) => {
      const statKey = stat as keyof typeof newHeroData.stats;
      newHeroData.stats[statKey] += value as number;
    });

    // Update hero state and act
    newHeroData.heroState = calculateHeroState(newHeroData);
    newHeroData.currentAct = getCurrentAct(newHeroData);

    console.log('🏆 VICTORY! Enemy defeated:', currentEnemy?.name);
    console.log('💪 Stats gained:', statsGained);
    console.log('📊 Updated stats:', newHeroData.stats);

    setHeroData(newHeroData);
    setShowBattle(false);
    setCurrentEnemy(null);

    // CRITICAL: Force immediate enemy list update after victory
    setTimeout(() => {
      const unlocked = getUnlockedEnemies(
        newHeroData.streakDays,
        newHeroData.stats,
        newHeroData.totalPomodoros
      );
      const available = unlocked.filter(enemy =>
        !newHeroData.defeatedEnemies.includes(enemy.id)
      );

      setUnlockedEnemies(unlocked);
      setAvailableEnemies(available);

      console.log('🔄 Force updated enemies after victory:', {
        defeated: newHeroData.defeatedEnemies.length,
        available: available.length,
        nextEnemies: available.slice(0, 3).map(e => e.name)
      });
    }, 100);

    // Start break after victory
    setMinutes(breakMinutes);
    setSeconds(0);
    setOnBreak(true);

    // Show ambient taunts again after battle
    setTimeout(() => setShowAmbientTaunts(true), 2000);
  };

  const handleBattleDefeat = () => {
    // Penalty for defeat - lose some HP but keep progress
    const newHeroData = {
      ...heroData,
      hp: Math.max(10, heroData.hp - 20)
    };

    setHeroData(newHeroData);
    setShowBattle(false);
    setCurrentEnemy(null);

    // Still get break after defeat
    setMinutes(breakMinutes);
    setSeconds(0);
    setOnBreak(true);

    // Show ambient taunts again after defeat
    setTimeout(() => setShowAmbientTaunts(true), 2000);
  };

  const handleBattleFlee = () => {
    setShowBattle(false);
    setCurrentEnemy(null);

    // Start break after fleeing
    setMinutes(breakMinutes);
    setSeconds(0);
    setOnBreak(true);

    // Show ambient taunts again after fleeing
    setTimeout(() => setShowAmbientTaunts(true), 1000);
  };

  // Timer control functions
  const handleStart = () => {
    setRunning(true);
  };

  const handlePause = () => {
    setRunning(false);
  };

  const handleReset = () => {
    setRunning(false);
    setMinutes(onBreak ? breakMinutes : pomodoroMinutes);
    setSeconds(0);
  };

  const handleStartBreak = () => {
    setOnBreak(true);
    setMinutes(breakMinutes);
    setSeconds(0);
    setRunning(true);
  };

  // Manual enemy battle trigger
  const startBattleWithEnemy = (enemyId: string) => {
    const enemy = getEnemyById(enemyId);
    if (enemy && !heroData.defeatedEnemies.includes(enemyId)) {
      triggerBattle(enemy);
    }
  };

  // Handle task completion for stat allocation
  const loadActiveTodos = async () => {
    try {
      // Use QuestManager to handle expiration and cleanup
      const activeQuests = await QuestManager.getActiveQuests();
      setActiveTodos(activeQuests);

      // Ensure daily quests exist
      await QuestManager.ensureDailyQuests();
    } catch (error) {
      console.error('Error loading todos:', error);
    }
  };

  const handleTodoCompletion = async (todo: Todo) => {
    try {
      // Complete quest using QuestManager
      const completedQuest = await QuestManager.completeQuestManually(todo.id);

      if (completedQuest) {
        // Convert todo to task completion for stat allocation
        const taskCompletion: TaskCompletion = {
          id: completedQuest.id,
          title: completedQuest.title,
          description: completedQuest.description,
          category: completedQuest.category,
          pointsEarned: completedQuest.pointsWorth,
          completedAt: completedQuest.completedAt || new Date().toISOString(),
          sessionId: `session_${Date.now()}`
        };

        // Allocate stat points based on task category
        const updatedHeroData = allocateStatPoints(heroData, completedQuest.category, completedQuest.pointsWorth);

        // Add EXP for task completion
        updatedHeroData.exp += Math.floor(completedQuest.pointsWorth / 2);

        // Add to completed tasks for the session
        updatedHeroData.tasksThisSession.push(taskCompletion);

        // Update hero state and act
        updatedHeroData.heroState = calculateHeroState(updatedHeroData);
        updatedHeroData.currentAct = getCurrentAct(updatedHeroData);

        setHeroData(updatedHeroData);
      }

      // Refresh active todos
      loadActiveTodos();
    } catch (error) {
      console.error('Error completing quest:', error);
    }
  };

  const handleTaskCompletion = (task: TaskCompletion) => {
    // Allocate stat points based on task category
    const updatedHeroData = allocateStatPoints(heroData, task.category, task.pointsEarned);

    // Add EXP for task completion
    updatedHeroData.exp += Math.floor(task.pointsEarned / 2); // Half points as EXP

    // Add to completed tasks for the session
    updatedHeroData.tasksThisSession.push(task);

    // Update hero state and act
    updatedHeroData.heroState = calculateHeroState(updatedHeroData);
    updatedHeroData.currentAct = getCurrentAct(updatedHeroData);

    setHeroData(updatedHeroData);
    setShowTaskCompletion(false);
  };

  const handleTodoSelectorChoice = async (todo: Todo | null) => {
    setShowTodoSelector(false);

    if (todo) {
      try {
        // Complete quest via pomodoro session
        const completedQuest = await QuestManager.completePomodoroSession(todo.id);

        if (completedQuest && completedQuest.completed) {
          // Quest is fully completed - allocate stats
          const taskCompletion: TaskCompletion = {
            id: completedQuest.id,
            title: completedQuest.title,
            description: completedQuest.description,
            category: completedQuest.category,
            pointsEarned: completedQuest.pointsWorth,
            completedAt: completedQuest.completedAt || new Date().toISOString(),
            sessionId: `session_${Date.now()}`
          };

          // Allocate stat points
          const updatedHeroData = allocateStatPoints(heroData, completedQuest.category, completedQuest.pointsWorth);
          updatedHeroData.exp += Math.floor(completedQuest.pointsWorth / 2);
          updatedHeroData.tasksThisSession.push(taskCompletion);
          updatedHeroData.heroState = calculateHeroState(updatedHeroData);
          updatedHeroData.currentAct = getCurrentAct(updatedHeroData);
          setHeroData(updatedHeroData);
        }

        // Refresh todos to show updated progress
        loadActiveTodos();
      } catch (error) {
        console.error('Error completing pomodoro quest:', error);
      }
    } else {
      // Skip to task completion interface
      setShowTaskCompletion(true);
    }
  };


  // Update timer when user edits Pomodoro or Break length
  useEffect(() => {
    if (!running && !onBreak) setMinutes(pomodoroMinutes);
  }, [pomodoroMinutes]);
  useEffect(() => {
    if (!running && onBreak) setMinutes(breakMinutes);
  }, [breakMinutes]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Ambient Taunts - Show when not in battle and enemies available */}
      <AmbientTauntDisplay
        availableEnemies={availableEnemies}
        visible={showAmbientTaunts && !running && !showBattle && !showPreBattleTaunt}
      />

      {/* Pre-Battle Taunt Screen */}
      {pendingEnemy && (
        <PreBattleTauntScreen
          visible={showPreBattleTaunt}
          enemy={pendingEnemy}
          onStartBattle={handleStartBattle}
          onSkip={handleSkipTaunt}
        />
      )}

      {/* Battle Modal */}
      <Modal visible={showBattle} animationType="fade" presentationStyle="fullScreen">
        {currentEnemy && (
          <AutoBattleScreen
            enemy={currentEnemy}
            heroData={heroData}
            onVictory={handleBattleVictory}
            onDefeat={handleBattleDefeat}
            onFlee={handleBattleFlee}
          />
        )}
      </Modal>

      {/* Task Completion Modal */}
      <TaskCompletionInterface
        visible={showTaskCompletion}
        onClose={() => setShowTaskCompletion(false)}
        onTaskComplete={handleTaskCompletion}
      />

      {/* Todo Manager Modal */}
      <TodoManager
        visible={showTodoManager}
        onClose={() => {
          setShowTodoManager(false);
          loadActiveTodos();
        }}
        onTodoComplete={handleTodoCompletion}
      />

      {/* Todo Completion Selector */}
      <TodoCompletionSelector
        visible={showTodoSelector}
        onClose={() => setShowTodoSelector(false)}
        onTodoSelect={(todo) => handleTodoSelectorChoice(todo)}
        onSkip={() => handleTodoSelectorChoice(null)}
        activeTodos={activeTodos.filter(todo =>
          todo.completionMethod === 'pomodoro' || todo.completionMethod === 'both'
        )}
      />

      {/* Navigation Tabs */}
      <View style={styles.navigationTabs}>
        <TouchableOpacity
          style={[styles.navTab, selectedView === 'quest' && styles.activeNavTab]}
          onPress={() => setSelectedView('quest')}
        >
          <Text style={[styles.navTabText, selectedView === 'quest' && styles.activeNavTabText]}>
            🗡️ QUEST
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navTab, selectedView === 'stats' && styles.activeNavTab]}
          onPress={() => setSelectedView('stats')}
        >
          <Text style={[styles.navTabText, selectedView === 'stats' && styles.activeNavTabText]}>
            📊 STATS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navTab, selectedView === 'enemies' && styles.activeNavTab]}
          onPress={() => setSelectedView('enemies')}
        >
          <Text style={[styles.navTabText, selectedView === 'enemies' && styles.activeNavTabText]}>
            👹 ENEMIES
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navTab, selectedView === 'battle' && styles.activeNavTab]}
          onPress={() => setSelectedView('battle')}
        >
          <Text style={[styles.navTabText, selectedView === 'battle' && styles.activeNavTabText]}>
            ⚔️ BATTLE
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Quest View */}
        {selectedView === 'quest' && (
          <View style={styles.questView}>
            <Text style={styles.mainTitle}>⚔️ DEMON CRUSHER ⚔️</Text>

            {/* Hero Status */}
            <View style={styles.heroStatusCard}>
              <Text style={styles.cardTitle}>HERO STATUS</Text>
              <View style={styles.heroInfo}>
                <Text style={styles.heroName}>Level {Math.floor(heroData.exp / 100) + 1} Hero</Text>
                <Text style={styles.heroState}>{heroData.heroState.toUpperCase()}</Text>
                <Text style={styles.heroAct}>Act {heroData.currentAct}/6</Text>
              </View>

              <View style={styles.hpBar}>
                <Text style={styles.hpLabel}>HP:</Text>
                <Text style={styles.hpText}>{heroData.hp}/{heroData.maxHp}</Text>
              </View>

              <View style={styles.statsGrid}>
                <Text style={styles.statItem}>💰 {heroData.stats.wealth}</Text>
                <Text style={styles.statItem}>💪 {heroData.stats.strength}</Text>
                <Text style={styles.statItem}>🧠 {heroData.stats.wisdom}</Text>
                <Text style={styles.statItem}>🎯 {heroData.stats.luck}</Text>
              </View>
            </View>

            {/* Current Progress */}
            <View style={styles.progressCard}>
              <Text style={styles.cardTitle}>PROGRESS</Text>
              <Text style={styles.progressText}>
                Streak: {heroData.streakDays} days | Total: {heroData.totalPomodoros} sessions
              </Text>
              <Text style={styles.progressText}>
                EXP: {heroData.exp} | Defeated: {heroData.defeatedEnemies.length} enemies
              </Text>
            </View>

            {/* Active Todos */}
            <View style={styles.todosCard}>
              <View style={styles.todosHeader}>
                <Text style={styles.cardTitle}>🎯 ACTIVE QUESTS ({activeTodos.length})</Text>
                <TouchableOpacity
                  style={styles.manageTodosBtn}
                  onPress={() => setShowTodoManager(true)}
                >
                  <Text style={styles.manageTodosBtnText}>MANAGE</Text>
                </TouchableOpacity>
              </View>
              {activeTodos.length === 0 ? (
                <View style={styles.noTodosContainer}>
                  <Text style={styles.noTodosText}>No active quests. Add some to focus your demon-crushing!</Text>
                  <TouchableOpacity
                    style={styles.addFirstTodoBtn}
                    onPress={() => setShowTodoManager(true)}
                  >
                    <Text style={styles.addFirstTodoBtnText}>+ ADD FIRST QUEST</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                activeTodos.slice(0, 3).map(todo => (
                  <TouchableOpacity
                    key={todo.id}
                    style={styles.todoQuickItem}
                    onPress={() => handleTodoCompletion(todo)}
                  >
                    <View style={styles.todoQuickInfo}>
                      <Text style={styles.todoQuickTitle}>{todo.title}</Text>
                      <Text style={styles.todoQuickCategory}>
                        {getStatEmoji(todo.category)} {getStatName(todo.category)} (+{todo.pointsWorth} pts)
                      </Text>
                    </View>
                    <Text style={styles.todoQuickComplete}>TAP TO COMPLETE</Text>
                  </TouchableOpacity>
                ))
              )}
            </View>

            {/* Available Enemies */}
            {availableEnemies.length > 0 && (
              <View style={styles.enemiesCard}>
                <Text style={styles.cardTitle}>AVAILABLE BATTLES</Text>
                {availableEnemies.slice(0, 3).map(enemy => (
                  <TouchableOpacity
                    key={enemy.id}
                    style={styles.enemyItem}
                    onPress={() => startBattleWithEnemy(enemy.id)}
                  >
                    <Text style={styles.enemyName}>{enemy.name}</Text>
                    <Text style={styles.enemyHp}>HP: {enemy.hp}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Main Timer - Prominent Display */}
            <View style={styles.mainTimerCard}>
              <Text style={styles.mainTimerDisplay}>
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </Text>
              <Text style={styles.mainTimerStatus}>
                {onBreak ? "💤 RECOVERY BREAK" : "⚔️ CRUSHING DEMONS"}
              </Text>

              <View style={styles.mainTimerControls}>
                <TouchableOpacity
                  style={[styles.mainTimerBtn, { backgroundColor: running ? '#444' : '#FF4444' }]}
                  onPress={running ? handlePause : handleStart}
                >
                  <Text style={styles.mainTimerBtnText}>{running ? '⏸️ PAUSE' : '▶️ START'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                  <Text style={styles.resetBtnText}>🔄 RESET</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Stats View */}
        {selectedView === 'stats' && (
          <View style={styles.statsView}>
            <Text style={styles.mainTitle}>📊 HERO STATISTICS</Text>

            {/* Detailed Stats */}
            <View style={styles.detailedStatsCard}>
              <Text style={styles.cardTitle}>POWER LEVELS</Text>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>💰 WEALTH:</Text>
                <Text style={styles.statValue}>{heroData.stats.wealth}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>💪 STRENGTH:</Text>
                <Text style={styles.statValue}>{heroData.stats.strength}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>🧠 WISDOM:</Text>
                <Text style={styles.statValue}>{heroData.stats.wisdom}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>🎯 LUCK:</Text>
                <Text style={styles.statValue}>{heroData.stats.luck}</Text>
              </View>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>📊 TOTAL:</Text>
                <Text style={styles.statValueTotal}>
                  {Object.values(heroData.stats).reduce((sum, val) => sum + val, 0)}
                </Text>
              </View>
            </View>

            {/* Act Progress */}
            <View style={styles.actProgressCard}>
              <Text style={styles.cardTitle}>ACT PROGRESSION</Text>
              <Text style={styles.currentAct}>ACT {heroData.currentAct}/6</Text>
              <Text style={styles.actDescription}>
                {heroData.currentAct === 1 && "The Awakening - Face your smallest critics"}
                {heroData.currentAct === 2 && "The Grind - Prove your consistency"}
                {heroData.currentAct === 3 && "The Test - Confront personal tormentors"}
                {heroData.currentAct === 4 && "The Crucible - Face psychological destroyers"}
                {heroData.currentAct === 5 && "Inner Hell - Battle your deepest demons"}
                {heroData.currentAct === 6 && "The Ultimate Battle - Face your Inner Demon Lord"}
              </Text>
              <Text style={styles.streakInfo}>
                Streak: {heroData.streakDays} days | EXP: {heroData.exp}
              </Text>
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActionsCard}>
              <Text style={styles.cardTitle}>QUICK ACTIONS</Text>
              <View style={styles.quickActionsRow}>
                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => setShowTodoManager(true)}
                >
                  <Text style={styles.quickActionBtnText}>📝 MANAGE QUESTS</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => setShowTaskCompletion(true)}
                >
                  <Text style={styles.quickActionBtnText}>🏆 RECORD WORK</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Defeated Enemies */}
            <View style={styles.defeatedCard}>
              <Text style={styles.cardTitle}>CONQUERED ENEMIES ({heroData.defeatedEnemies.length})</Text>
              {heroData.defeatedEnemies.length === 0 ? (
                <Text style={styles.noEnemiesText}>No enemies defeated yet. Start your first pomodoro!</Text>
              ) : (
                heroData.defeatedEnemies.slice(-5).map(enemyId => {
                  const enemy = getEnemyById(enemyId);
                  return enemy ? (
                    <Text key={enemyId} style={styles.defeatedEnemy}>✅ {enemy.name}</Text>
                  ) : null;
                })
              )}
            </View>
          </View>
        )}

        {/* Enemies View */}
        {selectedView === 'enemies' && (
          <View style={styles.enemiesView}>
            <Text style={styles.mainTitle}>👹 ENEMY DATABASE</Text>

            <Text style={styles.debugInfo}>
              Current Stats: 💰{heroData.stats.wealth} 💪{heroData.stats.strength} 🧠{heroData.stats.wisdom} 🎯{heroData.stats.luck} | Streak: {heroData.streakDays}
            </Text>

            {/* Show ALL enemies with their status */}
            <View style={styles.allEnemiesCard}>
              <Text style={styles.cardTitle}>ALL ENEMIES ({ALL_ENEMIES.length})</Text>
              {ALL_ENEMIES.map(enemy => {
                const isDefeated = heroData.defeatedEnemies.includes(enemy.id);
                const isUnlocked = getUnlockedEnemies(heroData.streakDays, heroData.stats, heroData.totalPomodoros).some(e => e.id === enemy.id);
                const isAvailable = availableEnemies.some(e => e.id === enemy.id);

                let statusIcon = '🔒';
                let statusText = 'LOCKED';
                let statusColor = '#666';

                if (isDefeated) {
                  statusIcon = '✅';
                  statusText = 'DEFEATED';
                  statusColor = '#44FF44';
                } else if (isAvailable) {
                  statusIcon = '⚔️';
                  statusText = 'READY TO BATTLE';
                  statusColor = '#FF4444';
                } else if (isUnlocked) {
                  statusIcon = '🔓';
                  statusText = 'UNLOCKED';
                  statusColor = '#FFAA00';
                }

                return (
                  <TouchableOpacity
                    key={enemy.id}
                    style={[styles.enemyItem, isAvailable && styles.availableEnemyItem]}
                    onPress={() => isAvailable ? triggerBattle(enemy) : null}
                    disabled={!isAvailable}
                  >
                    <View style={styles.enemyHeader}>
                      <Text style={styles.enemyName}>{statusIcon} {enemy.name}</Text>
                      <Text style={[styles.enemyStatus, { color: statusColor }]}>{statusText}</Text>
                    </View>
                    <Text style={styles.enemyDetails}>
                      Tier {enemy.tier} | HP: {enemy.hp} | Act: {enemy.act}
                    </Text>
                    <Text style={styles.enemyRequirements}>
                      Requires: Streak {enemy.requirements.minStreak || 0}+ days
                      {enemy.requirements.minTotalStats && ` | Total Stats: ${enemy.requirements.minTotalStats}+`}
                    </Text>
                    {isAvailable && (
                      <Text style={styles.battlePrompt}>⚡ TAP TO BATTLE! ⚡</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Battle View */}
        {selectedView === 'battle' && (
          <View style={styles.battleView}>
            <Text style={styles.mainTitle}>⚔️ DEMON BATTLE ARENA ⚔️</Text>

            {/* Current Target Enemy */}
            {availableEnemies.length > 0 && (
              <View style={styles.targetEnemyCard}>
                <Text style={styles.cardTitle}>🎯 CURRENT TARGET</Text>
                <View style={styles.targetEnemyInfo}>
                  <Text style={styles.targetEnemyName}>{availableEnemies[0].name}</Text>
                  <Text style={styles.targetEnemyStats}>
                    HP: {availableEnemies[0].hp} | Tier: {availableEnemies[0].tier.toUpperCase().replace('_', ' ')}
                  </Text>
                  <TouchableOpacity
                    style={styles.grindButton}
                    onPress={() => triggerBattle(availableEnemies[0])}
                  >
                    <Text style={styles.grindButtonText}>🔄 GRIND THIS ENEMY</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Timer Settings */}
            <View style={styles.timerSettingsCard}>
              <Text style={styles.cardTitle}>⏱️ BATTLE TIMER</Text>
              <View style={styles.inputRow}>
                <Text style={styles.label}>Focus (min):</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(pomodoroMinutes)}
                  onChangeText={v => setPomodoroMinutes(Number(v) || 1)}
                />
                <Text style={styles.label}>Break (min):</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  value={String(breakMinutes)}
                  onChangeText={v => setBreakMinutes(Number(v) || 1)}
                />
              </View>
            </View>

            {/* Big Timer Display */}
            <View style={styles.bigTimerCard}>
              <Text style={styles.bigClock}>
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </Text>
              <Text style={styles.timerMode}>
                {onBreak ? "💤 RECOVERY BREAK" : "⚔️ DEMON CRUSHING MODE"}
              </Text>

              <View style={styles.timerButtonsRow}>
                <TouchableOpacity style={styles.timerActionBtn} onPress={handleStart}>
                  <Text style={styles.timerActionBtnText}>▶️ START BATTLE</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.timerActionBtn} onPress={handlePause}>
                  <Text style={styles.timerActionBtnText}>⏸️ PAUSE</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.timerActionBtn} onPress={handleReset}>
                  <Text style={styles.timerActionBtnText}>🔄 RESET</Text>
                </TouchableOpacity>
              </View>

              {!onBreak && (
                <TouchableOpacity style={styles.breakBtn} onPress={handleStartBreak}>
                  <Text style={styles.breakBtnText}>Skip to Break</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Enemy Selection for Grinding */}
            <View style={styles.grindingCard}>
              <Text style={styles.cardTitle}>🔥 GRINDING TARGETS</Text>
              <Text style={styles.grindingHint}>Fight weaker enemies to farm EXP, or challenge stronger ones for taunts!</Text>

              {availableEnemies.slice(0, 3).map(enemy => {
                const playerLevel = Math.floor(heroData.exp / 100) + 1;
                const enemyLevel = Math.floor(enemy.hp / 20); // Rough enemy level calculation
                const canWin = playerLevel >= enemyLevel - 2; // Can beat enemies up to 2 levels higher

                return (
                  <TouchableOpacity
                    key={enemy.id}
                    style={[styles.grindEnemyItem, canWin ? styles.winnable : styles.challenging]}
                    onPress={() => triggerBattle(enemy)}
                  >
                    <View style={styles.grindEnemyInfo}>
                      <Text style={styles.grindEnemyName}>{enemy.name}</Text>
                      <Text style={styles.grindEnemyLevel}>
                        Level {enemyLevel} | {canWin ? '💰 EXP Gain' : '💀 Taunt Only'}
                      </Text>
                    </View>
                    <Text style={styles.grindAction}>
                      {canWin ? '⚔️ FIGHT' : '👂 LISTEN'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Session Info */}
            <View style={styles.sessionInfoCard}>
              <Text style={styles.cardTitle}>📊 BATTLE STATS</Text>
              <Text style={styles.sessionText}>
                Today: {heroData.completedToday} battles won
              </Text>
              <Text style={styles.sessionText}>
                Total: {heroData.totalPomodoros} battles
              </Text>
              <Text style={styles.sessionText}>
                Demons Defeated: {heroData.defeatedEnemies.length}
              </Text>
              <Text style={styles.sessionText}>
                Current Streak: {heroData.streakDays} days
              </Text>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000000",
  },
  navigationTabs: {
    flexDirection: "row",
    backgroundColor: "#111111",
    borderBottomWidth: 2,
    borderBottomColor: "#FF0000",
  },
  navTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  activeNavTab: {
    borderBottomColor: "#FF0000",
    backgroundColor: "#1A0000",
  },
  navTabText: {
    color: "#666666",
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  activeNavTabText: {
    color: "#FF0000",
    textShadowColor: "#FF0000",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 40,
  },

  // Main Views
  questView: {
    flex: 1,
  },
  statsView: {
    flex: 1,
  },
  enemiesView: {
    flex: 1,
  },
  timerView: {
    flex: 1,
  },

  // Titles
  mainTitle: {
    fontSize: 24,
    color: "#FF0000",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "monospace",
    textShadowColor: "#FF0000",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },

  // Cards
  heroStatusCard: {
    backgroundColor: "#0A0A0A",
    borderWidth: 2,
    borderColor: "#FF0000",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  progressCard: {
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#666666",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  enemiesCard: {
    backgroundColor: "#0A0A0A",
    borderWidth: 2,
    borderColor: "#FF6600",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  // Main Timer Card
  mainTimerCard: {
    backgroundColor: "#0A0A0A",
    borderWidth: 3,
    borderColor: "#FF4444",
    borderRadius: 15,
    padding: 25,
    marginBottom: 20,
    alignItems: "center",
  },
  mainTimerDisplay: {
    fontSize: 72,
    color: "#FF4444",
    fontWeight: "bold",
    fontFamily: "monospace",
    textAlign: "center",
    marginBottom: 10,
    textShadowColor: "#FF4444",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  mainTimerStatus: {
    color: "#FF6600",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "monospace",
    marginBottom: 25,
  },
  mainTimerControls: {
    flexDirection: "row",
    gap: 15,
  },
  mainTimerBtn: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#FF4444",
    minWidth: 120,
    alignItems: "center",
  },
  mainTimerBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  resetBtn: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    backgroundColor: "#444",
    borderWidth: 1,
    borderColor: "#666",
    alignItems: "center",
  },
  resetBtnText: {
    color: "#CCCCCC",
    fontSize: 14,
    fontFamily: "monospace",
  },

  // Card Content
  cardTitle: {
    color: "#FF0000",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    fontFamily: "monospace",
  },
  heroInfo: {
    alignItems: "center",
    marginBottom: 15,
  },
  heroName: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  heroState: {
    color: "#FF6600",
    fontSize: 16,
    fontFamily: "monospace",
    marginTop: 5,
  },
  heroAct: {
    color: "#CCCCCC",
    fontSize: 14,
    fontFamily: "monospace",
    marginTop: 5,
  },

  // HP Bar
  hpBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  hpLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "monospace",
  },
  hpText: {
    color: "#FF0000",
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "monospace",
  },

  // Stats
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  statItem: {
    color: "#39FF14",
    fontSize: 14,
    fontFamily: "monospace",
    width: "48%",
    textAlign: "center",
    marginBottom: 5,
  },

  // Progress
  progressText: {
    color: "#CCCCCC",
    fontSize: 14,
    fontFamily: "monospace",
    marginBottom: 5,
  },

  // Enemies
  enemyItem: {
    backgroundColor: "#222222",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#FF0000",
  },
  enemyName: {
    color: "#FF0000",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  enemyHp: {
    color: "#CCCCCC",
    fontSize: 12,
    fontFamily: "monospace",
  },

  // Timer Display in Quest
  timerDisplay: {
    fontSize: 48,
    color: "#39FF14",
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "monospace",
    marginBottom: 10,
  },
  timerStatus: {
    color: "#39FF14",
    fontSize: 16,
    textAlign: "center",
    fontFamily: "monospace",
    marginBottom: 15,
  },
  timerControls: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  timerBtn: {
    backgroundColor: "#003300",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#39FF14",
  },
  timerBtnText: {
    color: "#39FF14",
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "monospace",
  },

  // Detailed Stats View
  detailedStatsCard: {
    backgroundColor: "#0A0A0A",
    borderWidth: 2,
    borderColor: "#39FF14",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  statLabel: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "monospace",
  },
  statValue: {
    color: "#39FF14",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  statValueTotal: {
    color: "#FFD700",
    fontSize: 18,
    fontWeight: "bold",
    fontFamily: "monospace",
  },

  // Act Progress
  actProgressCard: {
    backgroundColor: "#111111",
    borderWidth: 2,
    borderColor: "#FF6600",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  currentAct: {
    color: "#FF6600",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "monospace",
    marginBottom: 5,
  },
  actDescription: {
    color: "#CCCCCC",
    fontSize: 14,
    textAlign: "center",
    fontFamily: "monospace",
    marginBottom: 10,
  },
  streakInfo: {
    color: "#39FF14",
    fontSize: 14,
    textAlign: "center",
    fontFamily: "monospace",
  },

  // Defeated Enemies
  defeatedCard: {
    backgroundColor: "#001100",
    borderWidth: 2,
    borderColor: "#39FF14",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  noEnemiesText: {
    color: "#666666",
    fontSize: 14,
    textAlign: "center",
    fontStyle: "italic",
    fontFamily: "monospace",
  },
  defeatedEnemy: {
    color: "#39FF14",
    fontSize: 14,
    fontFamily: "monospace",
    marginBottom: 3,
  },

  // Enemy Details
  availableEnemiesCard: {
    backgroundColor: "#0A0A0A",
    borderWidth: 2,
    borderColor: "#FF0000",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  enemyDetailItem: {
    backgroundColor: "#222222",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#FF0000",
  },
  enemyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  enemyDetailName: {
    color: "#FF0000",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  enemyTier: {
    color: "#666666",
    fontSize: 10,
    fontFamily: "monospace",
  },
  enemyStats: {
    color: "#CCCCCC",
    fontSize: 12,
    fontFamily: "monospace",
    marginBottom: 5,
  },
  battlePrompt: {
    color: "#FF6600",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "monospace",
  },

  // Locked Enemies
  lockedEnemiesCard: {
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#666666",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  lockedEnemyItem: {
    marginBottom: 8,
  },
  lockedEnemyName: {
    color: "#666666",
    fontSize: 14,
    fontFamily: "monospace",
  },
  lockedRequirement: {
    color: "#444444",
    fontSize: 12,
    fontFamily: "monospace",
  },

  // Timer View
  timerSettingsCard: {
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#39FF14",
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: "#39FF14",
    fontSize: 14,
    marginHorizontal: 8,
    fontFamily: "monospace",
  },
  input: {
    backgroundColor: "#222222",
    color: "#39FF14",
    borderWidth: 1,
    borderColor: "#39FF14",
    borderRadius: 6,
    width: 50,
    height: 35,
    textAlign: "center",
    marginHorizontal: 8,
    fontSize: 16,
    fontFamily: "monospace",
  },

  // Big Timer
  bigTimerCard: {
    backgroundColor: "#0A0A0A",
    borderWidth: 3,
    borderColor: "#39FF14",
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    alignItems: "center",
  },
  bigClock: {
    fontSize: 60,
    color: "#39FF14",
    fontWeight: "bold",
    fontFamily: "monospace",
    textShadowColor: "#39FF14",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  timerMode: {
    color: "#FF6600",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "monospace",
  },
  timerButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginBottom: 15,
  },
  timerActionBtn: {
    backgroundColor: "#003300",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "#39FF14",
    minWidth: 80,
    alignItems: "center",
  },
  timerActionBtnText: {
    color: "#39FF14",
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  breakBtn: {
    backgroundColor: "#330000",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#666666",
  },
  breakBtnText: {
    color: "#666666",
    fontSize: 12,
    fontFamily: "monospace",
  },

  // Session Info
  sessionInfoCard: {
    backgroundColor: "#111111",
    borderWidth: 1,
    borderColor: "#39FF14",
    borderRadius: 8,
    padding: 15,
  },
  sessionText: {
    color: "#39FF14",
    fontSize: 14,
    fontFamily: "monospace",
    marginBottom: 5,
  },

  // Todos Card
  todosCard: {
    backgroundColor: "#0A0A0A",
    borderWidth: 2,
    borderColor: "#4488FF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  todosHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  manageTodosBtn: {
    backgroundColor: "#4488FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  manageTodosBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  noTodosContainer: {
    alignItems: "center",
    padding: 10,
  },
  noTodosText: {
    color: "#666666",
    fontSize: 14,
    textAlign: "center",
    fontFamily: "monospace",
    marginBottom: 10,
  },
  addFirstTodoBtn: {
    backgroundColor: "#4488FF",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addFirstTodoBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  todoQuickItem: {
    backgroundColor: "#222222",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#4488FF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  todoQuickInfo: {
    flex: 1,
  },
  todoQuickTitle: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "monospace",
    marginBottom: 2,
  },
  todoQuickCategory: {
    color: "#4488FF",
    fontSize: 12,
    fontFamily: "monospace",
  },
  todoQuickComplete: {
    color: "#44FF44",
    fontSize: 10,
    fontWeight: "bold",
    fontFamily: "monospace",
  },

  // Quick Actions Card
  quickActionsCard: {
    backgroundColor: "#001100",
    borderWidth: 2,
    borderColor: "#FFD700",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  quickActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: "#FFD700",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  quickActionBtnText: {
    color: "#000000",
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "monospace",
  },

  // New Enemy Display Styles
  debugInfo: {
    color: "#FFAA00",
    fontSize: 12,
    fontFamily: "monospace",
    textAlign: "center",
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#111111",
    borderRadius: 5,
  },
  allEnemiesCard: {
    backgroundColor: "#111111",
    borderWidth: 2,
    borderColor: "#FF4444",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  enemyItem: {
    backgroundColor: "#222222",
    borderWidth: 1,
    borderColor: "#444444",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  availableEnemyItem: {
    borderColor: "#FF4444",
    backgroundColor: "#331111",
  },
  enemyName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "monospace",
    flex: 1,
  },
  enemyStatus: {
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  enemyDetails: {
    color: "#CCCCCC",
    fontSize: 12,
    fontFamily: "monospace",
    marginTop: 4,
  },
  enemyRequirements: {
    color: "#888888",
    fontSize: 11,
    fontFamily: "monospace",
    marginTop: 2,
  },

  // Battle View Styles
  battleView: {
    flex: 1,
  },
  targetEnemyCard: {
    backgroundColor: "#0A0A0A",
    borderWidth: 3,
    borderColor: "#FF0000",
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  targetEnemyIcon: {
    fontSize: 48,
    marginBottom: 10,
  },
  targetEnemyName: {
    color: "#FF0000",
    fontSize: 20,
    fontWeight: "bold",
    fontFamily: "monospace",
    textAlign: "center",
    marginBottom: 5,
  },
  targetEnemyLevel: {
    color: "#CCCCCC",
    fontSize: 14,
    fontFamily: "monospace",
    textAlign: "center",
    marginBottom: 10,
  },
  targetEnemyHp: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "monospace",
    textAlign: "center",
    marginBottom: 10,
  },
  targetEnemyWeakness: {
    color: "#FFD700",
    fontSize: 12,
    fontFamily: "monospace",
    textAlign: "center",
  },
  grindingCard: {
    backgroundColor: "#111111",
    borderWidth: 2,
    borderColor: "#FF6600",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  grindingTitle: {
    color: "#FF6600",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "monospace",
    textAlign: "center",
    marginBottom: 15,
  },
  grindingSubtitle: {
    color: "#CCCCCC",
    fontSize: 12,
    fontFamily: "monospace",
    textAlign: "center",
    marginBottom: 15,
  },
  grindEnemyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#222222",
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  winnable: {
    borderColor: "#44FF44",
    backgroundColor: "#001100",
  },
  challenging: {
    borderColor: "#FF4444",
    backgroundColor: "#110000",
  },
  grindEnemyName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "monospace",
    flex: 1,
  },
  grindEnemyLevel: {
    fontSize: 12,
    fontFamily: "monospace",
    fontWeight: "bold",
  },
  grindEnemyInfo: {
    flex: 1,
  },
  grindAction: {
    color: "#FFD700",
    fontSize: 12,
    fontFamily: "monospace",
    fontWeight: "bold",
  },
  grindButton: {
    backgroundColor: "#FF0000",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 10,
    alignItems: "center",
  },
  grindButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  targetEnemyInfo: {
    alignItems: "center",
    width: "100%",
  },
  targetEnemyStats: {
    color: "#CCCCCC",
    fontSize: 12,
    fontFamily: "monospace",
    textAlign: "center",
    marginBottom: 10,
  },
  timerSettingsCard: {
    backgroundColor: "#111111",
    borderWidth: 2,
    borderColor: "#4488FF",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  label: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "monospace",
  },
  input: {
    backgroundColor: "#333333",
    borderWidth: 1,
    borderColor: "#666666",
    borderRadius: 6,
    padding: 8,
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "monospace",
    textAlign: "center",
    minWidth: 50,
  },
  bigTimerCard: {
    backgroundColor: "#0A0A0A",
    borderWidth: 3,
    borderColor: "#FF4444",
    borderRadius: 15,
    padding: 25,
    marginBottom: 20,
    alignItems: "center",
  },
  bigClock: {
    fontSize: 64,
    color: "#FF4444",
    fontWeight: "bold",
    fontFamily: "monospace",
    textAlign: "center",
    marginBottom: 10,
    textShadowColor: "#FF4444",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
  },
  timerMode: {
    color: "#FF6600",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    fontFamily: "monospace",
    marginBottom: 20,
  },
  timerButtonsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 15,
  },
  timerActionBtn: {
    backgroundColor: "#FF4444",
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#FF6666",
  },
  timerActionBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  breakBtn: {
    backgroundColor: "#666666",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  breakBtnText: {
    color: "#CCCCCC",
    fontSize: 12,
    fontFamily: "monospace",
  },
  grindingHint: {
    color: "#888888",
    fontSize: 11,
    fontFamily: "monospace",
    textAlign: "center",
    marginBottom: 15,
  },
});
