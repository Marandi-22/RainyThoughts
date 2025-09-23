// app/(tabs)/pomodoro.tsx - Psychological Warfare RPG
import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SafeAreaView, StatusBar, ScrollView, Modal } from "react-native";
import AutoBattleScreen from "@/components/AutoBattleScreen";
import TaskCompletionInterface from "@/components/TaskCompletionInterface";
import TodoManager, { Todo } from "@/components/TodoManager";
import TodoCompletionSelector from "@/components/TodoCompletionSelector";
import PreBattleTauntScreen from "@/components/PreBattleTauntScreen";
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
  const [selectedTauntEnemy, setSelectedTauntEnemy] = useState<Enemy | null>(null);
  const [currentLiveTaunt, setCurrentLiveTaunt] = useState<string>('');
  const [battleProgression, setBattleProgression] = useState({
    enemyDeathCount: 0,
    playerStrengthMultiplier: 1.0,
    enemyFearLevel: 0, // 0-100, higher = more afraid
    battleNumber: 0,
    isEnemyTrapped: false
  });

  const intervalRef = useRef<number | null>(null);

  // Load hero data on mount and pre-generate taunts
  useEffect(() => {
    loadHeroData();
    loadActiveTodos();

    // Pre-generate AI taunts for better performance
    const preGenerateTaunts = async () => {
      try {
        await BattleTauntManager.preGenerateTaunts(availableEnemies);
        console.log('AI taunts pre-generated for progression system');
      } catch (error) {
        console.error('Error pre-generating AI taunts:', error);
      }
    };

    if (availableEnemies.length > 0) {
      preGenerateTaunts();
    }
  }, []);

  // Update unlocked enemies when hero data changes
  useEffect(() => {
    if (heroData && heroData.stats) {
      updateUnlockedEnemies();
    }
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

        // Migration: Convert old defeatedEnemies array to new enemyKillCounts object
        if (data.defeatedEnemies && !data.enemyKillCounts) {
          data.enemyKillCounts = {};
          // Convert defeated enemies to kill counts of 1
          if (Array.isArray(data.defeatedEnemies)) {
            data.defeatedEnemies.forEach((enemyId: string) => {
              data.enemyKillCounts[enemyId] = 1;
            });
          }
          // Remove old property
          delete data.defeatedEnemies;
        }

        // Ensure enemyKillCounts exists
        if (!data.enemyKillCounts) {
          data.enemyKillCounts = {};
        }

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
    // Ensure heroData is properly loaded before processing
    if (!heroData || !heroData.stats) {
      return;
    }

    const unlocked = getUnlockedEnemies(
      heroData.streakDays || 0,
      heroData.stats || { wealth: 0, strength: 0, wisdom: 0, luck: 0 },
      heroData.totalPomodoros || 0
    );
    setUnlockedEnemies(unlocked);

    // Available enemies are ALL ENEMIES for maximum taunt availability
    const available = ALL_ENEMIES; // Make EVERYTHING available for grinding and taunts
    setAvailableEnemies(available);

    console.log('🔓 Enemies updated:', {
      streak: heroData.streakDays,
      totalStats: Object.values(heroData.stats).reduce((sum, val) => sum + val, 0),
      totalPomodoros: heroData.totalPomodoros,
      defeated: Object.keys(heroData.enemyKillCounts || {}).length,
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
      enemyKillCounts: newHeroData.enemyKillCounts
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
          true // All enemies are always available for grinding
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
    setCurrentEnemy(enemy);
    setShowBattle(true);
  };

  const selectEnemyForTaunts = async (enemy: Enemy) => {
    console.log('Selecting enemy for taunts:', enemy.name);
    setSelectedTauntEnemy(enemy);
    // Load initial progressive taunt (arrogant phase)
    const initialTaunt = await getProgressiveTaunt(enemy, 0, 0);
    setCurrentLiveTaunt(initialTaunt);
  };

  // Get progressive taunts mixing AI and fear-based progression
  const getProgressiveTaunt = async (enemy: Enemy, fearLevel: number, deathCount: number) => {
    // 80% chance for AI taunt (brutal personal attacks), 20% chance for fear progression taunt
    const useAITaunt = Math.random() < 0.8;

    if (useAITaunt) {
      try {
        // Get AI taunt but modify based on fear level
        let aiTaunt = await BattleTauntManager.getPreBattleTaunt(enemy);

        // Add fear-based modifications to AI taunts
        if (fearLevel >= 75) {
          // Broken phase - enemy is confused and desperate
          aiTaunt = aiTaunt + ` ...wait, I've said this before... Death #${deathCount}... Why do I keep dying?!`;
        } else if (fearLevel >= 50) {
          // Fearful phase - enemy shows panic
          aiTaunt = aiTaunt + ` But... but I've died ${deathCount} times to you already! This isn't right!`;
        } else if (fearLevel >= 25) {
          // Worried phase - enemy shows doubt
          aiTaunt = aiTaunt + ` ...though you're getting stronger each time. How?`;
        }
        // Arrogant phase keeps AI taunt pure

        return aiTaunt;
      } catch (error) {
        // Fallback to progression taunts if AI fails
        return getStaticProgressiveTaunt(enemy, fearLevel, deathCount);
      }
    } else {
      return getStaticProgressiveTaunt(enemy, fearLevel, deathCount);
    }
  };

  // Personality-specific progression taunts
  const getStaticProgressiveTaunt = (enemy: Enemy, fearLevel: number, deathCount: number) => {
    const personality = enemy.personality;

    // Define personality-specific taunts for each fear level
    const personalityTaunts = {
      // SCHOOL KIDS - cruel, vicious mockery of failures
      'immature_mockers': {
        arrogant: ["HAHA! Look at this pathetic loser trying AGAIN!", "Remember when you wet yourself in 3rd grade? We ALL remember!", "You're STILL the same worthless failure we laughed at!", "Nobody likes you! Nobody EVER liked you!"],
        worried: ["Why... why aren't you crying yet?", "You're supposed to break down like always!", "This isn't how this works! You always give up!"],
        fearful: [`Stop! You've humiliated us ${deathCount} times! We're the bullies here!`, "You can't turn this around! WE decide who's worthless!", "I don't wanna be the loser! That's YOUR job!"],
        broken: [`Death ${deathCount + 1}... who's the real failure here?`, "Were we... were we always just your own self-hate?", "I can't remember why we thought we were better than you..."]
      },

      // PARENTS GOSSIP - cruel comparisons and shame
      'judgmental_whispers': {
        arrogant: ["*whispers* Look how pathetic they are compared to Sarah's daughter.", "*tsk tsk* At their age, we had already achieved so much more.", "Such an embarrassment to the family bloodline.", "*whispers* Their siblings are so much more successful."],
        worried: ["*confused whispers* Wait... they're actually not failing this time?", "*nervous* This doesn't fit our narrative about them...", "*worried* What if people stop agreeing with our criticism?"],
        fearful: [`*panicked whispers* They've shamed us ${deathCount} times! We look like fools!`, "*terrified* Everyone will know we were wrong about our own child!", "*desperate* Quick! Find new ways to criticize them!"],
        broken: [`*broken whispers* Death ${deathCount + 1}... were we horrible parents?`, "Did we... did we destroy our own child's confidence?", "*sobbing whispers* We turned love into comparison..."]
      },

      // TRASH FRIENDS - manipulative betrayal and sabotage
      'fake_loyalty_draggers': {
        arrogant: ["Real friends don't abandon each other for some stupid goals.", "You think you're better than us now? Fuck that.", "Remember all the times we were there for you? This is how you repay us?", "You're gonna fail anyway, might as well waste time with us."],
        worried: ["Yo... you're actually not listening to us anymore?", "This is fucked up, you're supposed to need us...", "You're becoming someone we can't control..."],
        fearful: [`Bro! You've abandoned us ${deathCount} times! We're supposed to matter!`, "Stop growing without us! We're your REAL friends!", "Come back! We'll sabotage everything you've built!"],
        broken: [`Death ${deathCount + 1}... we were never real friends, were we?`, "We just... we just wanted to keep you as miserable as us...", "Were we ever there for you... or just there to hold you back?"]
      },

      // GIRLS IN CLASS - complete social invisibility and dismissal
      'sarcastic_ice_queens': {
        arrogant: ["Who? Oh right... you exist. Anyway...", "Literally nobody cares about what you do.", "You're like... not even on our radar. At all.", "Wait, what's your name again? Actually, don't tell me."],
        worried: ["Huh... people are starting to notice you? Weird.", "This is actually confusing... you're supposed to be nobody...", "Since when do invisible people become visible?"],
        fearful: [`What?! You've made yourself known ${deathCount} times! How?!`, "You can't just become somebody! You're supposed to stay nobody!", "Stop existing in our space! Go back to being invisible!"],
        broken: [`Death ${deathCount + 1}... did we even know you existed before this?`, "Were we... were we just ignoring someone who mattered?", "I... I can't remember ever seeing you as a real person..."]
      },

      // ORCS - crude, brutish, simple
      'crude_brutality': {
        arrogant: ["GRAAAH! Crush puny human!", "Orc smash weakling!", "You no match for orc strength!", "Puny human give up now!"],
        worried: ["Grrr... human getting stronger... not good...", "This not how it supposed to go...", "Orc confused... human no quit..."],
        fearful: [`NOOO! Human kill orc ${deathCount} times! Orc scared!`, "Orc no want die again! Human too strong!", "Why orc keep coming back to die?!"],
        broken: [`Death ${deathCount + 1}... orc... orc forgot how to count...`, "Orc... orc not real orc... just angry thought...", "Human... human is god of orc world..."]
      },

      // CHAOTIC PRANKSTERS - silly, annoying
      'chaotic_pranksters': {
        arrogant: ["Hehe! Time for chaos!", "We'll mess with your focus! WHEEE!", "Distraction time! Party!", "Ooh! Shiny things everywhere!"],
        worried: ["Huh? Our chaos isn't working?", "Why aren't you getting distracted?", "This is... actually kinda boring now..."],
        fearful: [`AHHH! You've defeated chaos ${deathCount} times!`, "We just wanted to have fun! Why do we keep dying?!", "Chaos is supposed to win! This isn't fun anymore!"],
        broken: [`Death ${deathCount + 1}... is chaos even real?`, "We've forgotten how to be chaotic...", "Are we just... random thoughts that got organized?"]
      },

      // ACADEMIC DESTROYER - crushing teacher who destroys dreams
      'academic_destroyer': {
        arrogant: ["You're not college material. Accept your limitations.", "I've failed better students than you for less.", "Your parents wasted their money on your education.", "You'll never amount to anything intellectually significant."],
        worried: ["This... this can't be right. You're improving beyond expectations...", "My assessment methods have never been wrong before...", "Students like you don't suddenly become capable..."],
        fearful: [`You've proven my grading wrong ${deathCount} times! This is impossible!`, "I'm supposed to crush dreams, not watch them come true!", "My authority! My expertise! You're destroying everything I believe!"],
        broken: [`Death ${deathCount + 1}... how many dreams did I crush unnecessarily?`, "Was I... was I just a failed academic taking it out on students?", "Did I destroy potential instead of nurturing it?"]
      },

      // ARROGANT INCOMPETENTS - corporate/authority figures
      'arrogant_incompetents': {
        arrogant: ["You clearly don't understand how things work around here.", "I've been doing this longer than you've been alive.", "That's not how we do business.", "Let me explain reality to you..."],
        worried: ["Well... that's... that's not supposed to work...", "This isn't following proper procedure...", "I... I might need to reconsider my methods..."],
        fearful: [`You've made me look incompetent ${deathCount} times!`, "This is impossible! I'm the expert here!", "You're supposed to respect my authority!"],
        broken: [`Death ${deathCount + 1}... was I ever really competent?`, "Authority... what does that even mean anymore?", "I've forgotten what I was supposed to be expert at..."]
      },

      // SNARKY COWARDS - internet trolls/critics
      'snarky_cowards': {
        arrogant: ["LOL nice try, but you'll give up like everyone else.", "Imagine thinking you're special 😂", "This is cringe, just stop.", "You're trying way too hard."],
        worried: ["Wait... you're actually... still going?", "This is getting less funny...", "Okay but you'll probably quit tomorrow..."],
        fearful: [`Dude you've dunked on me ${deathCount} times! Not cool!`, "Stop proving me wrong! I just wanted to make jokes!", "This isn't fair! You're supposed to quit!"],
        broken: [`Death ${deathCount + 1}... I can't even come up with snark anymore...`, "Was I ever funny... or just mean?", "I... I don't remember how to troll anymore..."]
      },

      // PHYSICAL INTIMIDATOR - violent bully who thrashes you
      'physical_intimidator': {
        arrogant: ["I'm gonna beat the shit out of you, weakling.", "You're pathetic. I could snap you like a twig.", "Your scrawny ass has never won a fight in your life.", "I'll make you cry like the little bitch you are."],
        worried: ["Why... why aren't you backing down anymore?", "You used to be so easy to intimidate...", "This mental strength shit is confusing me..."],
        fearful: [`You've beaten me ${deathCount} times! That's impossible!`, "I'm the one who's supposed to dominate! Not you!", "Stop! I can't handle being the weak one!"],
        broken: [`Death ${deathCount + 1}... was I always just compensating for being weak inside?`, "I... I bullied others because I hated myself...", "Real strength... it was never about muscles, was it?"]
      },

      // DISMISSIVE CRUSHER - vicious dream destroyer
      'dismissive_crusher': {
        arrogant: ["Your dreams are laughably unrealistic. Give up now.", "People like you are born to be mediocre. Accept it.", "I've seen a thousand failures like you. You're nothing special.", "Your ambitions are embarrassing. Stop humiliating yourself."],
        worried: ["This... this actually seems to be working somehow...", "Maybe I was wrong to be so harsh... no, impossible...", "Your success is making me question everything I believe..."],
        fearful: [`You've shattered my worldview ${deathCount} times!`, "I was supposed to save you from disappointment! Why are you succeeding?!", "Stop proving that dreams can come true! It ruins everything!"],
        broken: [`Death ${deathCount + 1}... how many dreams did I kill out of my own fear?`, "I... I destroyed hope because I had given up on my own...", "Was I crushing dreams... or was I just jealous of dreamers?"]
      },

      // CACKLING OPPORTUNISTS - opportunistic, profit-driven
      'cackling_opportunists': {
        arrogant: ["Heh! Another easy target!", "Time to profit from your failure!", "This'll be fun!", "Easy money! You're so predictable!"],
        worried: ["Wait... this isn't going as planned...", "Uh oh... maybe we bit off more than we can chew...", "This is getting complicated..."],
        fearful: [`You've turned the tables ${deathCount} times! This isn't profitable anymore!`, "We can't keep losing like this!", "The opportunity is slipping away!"],
        broken: [`Death ${deathCount + 1}... the opportunity was never real...`, "We just wanted easy victories... but nothing's easy...", "Maybe we're the ones being exploited..."]
      },

      // THEATRICAL FAILURES - dramatic, over-the-top villains
      'theatrical_failures': {
        arrogant: ["Behold! Your doom approaches!", "I am inevitable! Your failure is written in the stars!", "Witness my power! You cannot defeat me!", "This is my moment of triumph!"],
        worried: ["This... this wasn't in the script...", "My grand plan is falling apart...", "But I was supposed to be the villain here!"],
        fearful: [`Act ${deathCount}: The hero rises again! This can't be happening!`, "My dramatic monologue means nothing now!", "The audience has turned against me!"],
        broken: [`Final curtain call #${deathCount + 1}... was I ever the real villain?`, "My whole performance was just... empty theater...", "I was so busy playing the part, I forgot who I really was..."]
      },

      // SILENT JUDGES - quiet, judgmental observers
      'silent_judges': {
        arrogant: ["*silent stare of disapproval*", "*shakes head in disappointment*", "*whispers to others about your failures*", "*judges you quietly from the corner*"],
        worried: ["*confused glances*", "*uncertain whispers*", "*nervous fidgeting while watching*", "*unsure looks exchanged*"],
        fearful: [`*${deathCount} deaths later, still judging in terror*`, "*backing away while still staring*", "*whispering fearfully to others*", "*judging from a safe distance*"],
        broken: [`*Death ${deathCount + 1}... were we just afraid to try ourselves?*`, "*silent tears of realization*", "*no more words, just broken stares*", "*the judgment was always about our own fears*"]
      },

      // CONFIDENT BLAMERS - aggressive blame-shifters
      'confident_blamers': {
        arrogant: ["It's YOUR fault, not mine!", "You always mess everything up!", "If you were better, this wouldn't happen!", "Don't blame me for your failures!"],
        worried: ["Wait... maybe it wasn't entirely your fault?", "I'm starting to doubt my accusations...", "Could I have been wrong about who's to blame?"],
        fearful: [`${deathCount} defeats... am I the problem here?`, "My blame isn't working anymore!", "What if I'm the one who needs to change?"],
        broken: [`Death ${deathCount + 1}... I was blaming you for my own inadequacy...`, "All my finger-pointing was just... projection...", "I blamed others because I couldn't face my own faults..."]
      }
    };

    // Get the appropriate taunts for this personality
    const taunts = personalityTaunts[personality] || personalityTaunts['immature_mockers']; // fallback

    if (fearLevel < 25) {
      return taunts.arrogant[Math.floor(Math.random() * taunts.arrogant.length)];
    } else if (fearLevel < 50) {
      return taunts.worried[Math.floor(Math.random() * taunts.worried.length)];
    } else if (fearLevel < 75) {
      return taunts.fearful[Math.floor(Math.random() * taunts.fearful.length)];
    } else {
      return taunts.broken[Math.floor(Math.random() * taunts.broken.length)];
    }
  };

  // Live taunt cycling effect with progression
  useEffect(() => {
    if (selectedTauntEnemy) {
      const interval = setInterval(async () => {
        const progressiveTaunt = await getProgressiveTaunt(
          selectedTauntEnemy,
          battleProgression.enemyFearLevel,
          battleProgression.enemyDeathCount
        );
        setCurrentLiveTaunt(progressiveTaunt);
      }, 8000); // Faster taunt cycling during progression

      return () => clearInterval(interval);
    } else {
      setCurrentLiveTaunt('');
    }
  }, [selectedTauntEnemy, battleProgression]);

  // Progressive battle system
  const startProgressiveBattle = () => {
    if (!selectedTauntEnemy || !running) return;

    const battleInterval = setInterval(() => {
      if (!running || !selectedTauntEnemy) {
        clearInterval(battleInterval);
        return;
      }

      executeSingleBattle();
    }, 12000); // Battle every 12 seconds

    // Store interval to clear on pause/reset
    intervalRef.current = battleInterval;
  };

  const executeSingleBattle = () => {
    if (!selectedTauntEnemy) return;

    setBattleProgression(prev => {
      const newBattleNumber = prev.battleNumber + 1;
      const timeInSession = (pomodoroMinutes * 60) - (minutes * 60 + seconds);
      const progressionPercent = Math.min(timeInSession / (pomodoroMinutes * 60), 1);

      // Player gets stronger throughout pomodoro (starts weak, ends very strong)
      const newStrengthMultiplier = 0.3 + (progressionPercent * 2.0); // 0.3x to 2.3x strength

      // Enemy gets weaker and more afraid
      const newFearLevel = Math.min(progressionPercent * 100, 100);

      // Calculate battle outcome based on progression
      const playerPower = newStrengthMultiplier * 100;
      const enemyPower = Math.max(20, 120 - (newFearLevel * 0.8)); // Enemy weakens as fear increases

      let newDeathCount = prev.enemyDeathCount;
      let battleResult = '';

      if (playerPower > enemyPower) {
        // Player wins
        newDeathCount++;
        battleResult = `⚡ VICTORY #${newDeathCount}! You obliterate ${selectedTauntEnemy.name}!`;
      } else {
        // Enemy wins (early in session)
        battleResult = `💀 ${selectedTauntEnemy.name} crushes you... but you grow stronger.`;
      }

      // Update live taunt with battle result
      setCurrentLiveTaunt(battleResult);

      // Check if enemy is now trapped (after 5+ deaths)
      const isTrapped = newDeathCount >= 5;

      return {
        ...prev,
        battleNumber: newBattleNumber,
        enemyDeathCount: newDeathCount,
        playerStrengthMultiplier: newStrengthMultiplier,
        enemyFearLevel: newFearLevel,
        isEnemyTrapped: isTrapped
      };
    });
  };

  const handleBattleVictory = (expGained: number, statsGained: any) => {
    const playerLevel = Math.floor(heroData.exp / 200) + 1; // Match the new harder leveling
    const enemyLevel = Math.floor(currentEnemy!.hp / 15); // Match enemy scaling
    const isGrindingMode = false; // All battles are now "grinding" since enemies stay available
    const canWin = playerLevel >= enemyLevel - 1; // Stricter win condition

    // Much more grindy exp and stat gains
    let adjustedExpGained = Math.floor(expGained * 0.3); // 70% less exp
    let adjustedStatsGained = { ...statsGained };

    // Further reduce stat gains
    Object.keys(adjustedStatsGained).forEach(stat => {
      adjustedStatsGained[stat] = Math.floor(adjustedStatsGained[stat] * 0.4); // 60% less stats
    });

    if (!canWin) {
      // Tiny rewards for losing to higher level enemies to encourage grinding
      adjustedExpGained = Math.floor(adjustedExpGained * 0.1);
      Object.keys(adjustedStatsGained).forEach(stat => {
        adjustedStatsGained[stat] = Math.floor(adjustedStatsGained[stat] * 0.1);
      });
    }

    const newHeroData = {
      ...heroData,
      exp: heroData.exp + adjustedExpGained,
      // Track kill count instead of defeated status
      enemyKillCounts: {
        ...(heroData.enemyKillCounts || {}),
        [currentEnemy!.id]: ((heroData.enemyKillCounts || {})[currentEnemy!.id] || 0) + 1
      }
    };

    // Add stat gains
    Object.entries(adjustedStatsGained).forEach(([stat, value]) => {
      const statKey = stat as keyof typeof newHeroData.stats;
      newHeroData.stats[statKey] += value as number;
    });

    // Update hero state and act
    newHeroData.heroState = calculateHeroState(newHeroData);
    newHeroData.currentAct = getCurrentAct(newHeroData);

    console.log('🏆 VICTORY! Enemy defeated:', currentEnemy?.name);
    console.log('🔄 Grinding mode:', isGrindingMode);
    console.log('💪 Stats gained:', adjustedStatsGained);
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
      const available = ALL_ENEMIES; // Keep ALL enemies available for maximum taunts

      setUnlockedEnemies(unlocked);
      setAvailableEnemies(available);

      console.log('🔄 Force updated enemies after victory:', {
        defeated: Object.keys(newHeroData.enemyKillCounts || {}).length,
        available: available.length,
        nextEnemies: available.slice(0, 3).map(e => e.name)
      });
    }, 100);

    // Start break after victory
    setMinutes(breakMinutes);
    setSeconds(0);
    setOnBreak(true);
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
  };

  const handleBattleFlee = () => {
    setShowBattle(false);
    setCurrentEnemy(null);

    // Start break after fleeing
    setMinutes(breakMinutes);
    setSeconds(0);
    setOnBreak(true);
  };

  // Timer control functions
  const handleStart = () => {
    setRunning(true);

    // Reset battle progression when starting new pomodoro
    if (selectedTauntEnemy) {
      setBattleProgression({
        enemyDeathCount: 0,
        playerStrengthMultiplier: 1.0,
        enemyFearLevel: 0,
        battleNumber: 0,
        isEnemyTrapped: false
      });

      // Start the progressive battle loop
      startProgressiveBattle();
    }
  };

  const handlePause = () => {
    setRunning(false);
    // Clear battle interval when pausing
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const handleReset = () => {
    setRunning(false);
    setMinutes(onBreak ? breakMinutes : pomodoroMinutes);
    setSeconds(0);

    // Clear battle interval and reset progression
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    setBattleProgression({
      enemyDeathCount: 0,
      playerStrengthMultiplier: 1.0,
      enemyFearLevel: 0,
      battleNumber: 0,
      isEnemyTrapped: false
    });
  };

  const handleStartBreak = () => {
    setOnBreak(true);
    setMinutes(breakMinutes);
    setSeconds(0);
    setRunning(true);
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



      {/* Battle Modal */}
      <Modal visible={showBattle} animationType="fade" presentationStyle="fullScreen">
        {currentEnemy && (
          <AutoBattleScreen
            enemy={currentEnemy}
            heroData={heroData}
            onVictory={handleBattleVictory}
            onDefeat={handleBattleDefeat}
            onFlee={handleBattleFlee}
            isGrindingMode={false}
            canWin={Math.floor(heroData.exp / 100) + 1 >= Math.floor(currentEnemy.hp / 20) - 2}
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
                EXP: {heroData.exp} | Total Kills: {Object.values(heroData.enemyKillCounts || {}).reduce((sum, kills) => sum + kills, 0)}
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


            {/* Live Taunt Box */}
            {selectedTauntEnemy && currentLiveTaunt && (
              <View style={[
                styles.liveTauntBox,
                {
                  borderColor: battleProgression.enemyFearLevel < 25 ? "#FF4444" :
                              battleProgression.enemyFearLevel < 50 ? "#FF8800" :
                              battleProgression.enemyFearLevel < 75 ? "#FFAA00" : "#00FF00"
                }
              ]}>
                <View style={[
                  styles.tauntEnemyHeader,
                  {
                    backgroundColor: battleProgression.enemyFearLevel < 25 ? "#FF4444" :
                                   battleProgression.enemyFearLevel < 50 ? "#FF8800" :
                                   battleProgression.enemyFearLevel < 75 ? "#FFAA00" : "#00FF00"
                  }
                ]}>
                  <Text style={styles.tauntEnemyIcon}>
                    {selectedTauntEnemy.tier === 'small_fry' ? '👿' :
                     selectedTauntEnemy.tier === 'personal_tormentor' ? '😈' :
                     selectedTauntEnemy.tier === 'psychological_destroyer' ? '👹' :
                     selectedTauntEnemy.tier === 'inner_demon' ? '💀' :
                     selectedTauntEnemy.tier === 'ultimate_boss' ? '🔥' : '👹'}
                  </Text>
                  <View style={styles.tauntEnemyInfo}>
                    <Text style={styles.tauntEnemyName}>
                      {selectedTauntEnemy.name}
                      {battleProgression.isEnemyTrapped && " 🔒"}
                    </Text>
                    <Text style={styles.tauntEnemyLevel}>
                      Level {Math.floor(selectedTauntEnemy.hp / 15)} • Deaths: {battleProgression.enemyDeathCount}
                    </Text>
                    <Text style={styles.battleProgressText}>
                      Fear: {Math.round(battleProgression.enemyFearLevel)}% •
                      Your Power: {Math.round(battleProgression.playerStrengthMultiplier * 100)}%
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.dismissTauntBtn}
                    onPress={() => setSelectedTauntEnemy(null)}
                  >
                    <Text style={styles.dismissTauntText}>✕</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.liveTauntBubble}>
                  <Text style={styles.liveTauntText}>"{currentLiveTaunt}"</Text>
                </View>
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

            {/* Enemy Kill Counts */}
            <View style={styles.defeatedCard}>
              <Text style={styles.cardTitle}>DEMON KILL COUNTS ({Object.keys(heroData.enemyKillCounts || {}).length} types slain)</Text>
              {Object.keys(heroData.enemyKillCounts || {}).length === 0 ? (
                <Text style={styles.noEnemiesText}>No demons killed yet. Select an enemy and start a pomodoro!</Text>
              ) : (
                Object.entries(heroData.enemyKillCounts || {}).slice(-5).map(([enemyId, killCount]) => {
                  const enemy = getEnemyById(enemyId);
                  return enemy ? (
                    <Text key={enemyId} style={styles.defeatedEnemy}>💀 {enemy.name}: {killCount} kills</Text>
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
                const killCount = (heroData.enemyKillCounts || {})[enemy.id] || 0;
                const isUnlocked = getUnlockedEnemies(heroData.streakDays, heroData.stats, heroData.totalPomodoros).some(e => e.id === enemy.id);
                const isAvailable = availableEnemies.some(e => e.id === enemy.id);

                let statusIcon = '🔒';
                let statusText = 'LOCKED';
                let statusColor = '#666';

                if (killCount > 0) {
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
              <Text style={styles.cardTitle}>🔥 ALL DEMON TARGETS</Text>
              <Text style={styles.grindingHint}>Fight any demon repeatedly! Get EXP from weaker ones, taunts from stronger ones!</Text>

              {availableEnemies.map(enemy => {
                const playerLevel = Math.floor(heroData.exp / 200) + 1;
                const enemyLevel = Math.floor(enemy.hp / 15);
                const canWin = playerLevel >= enemyLevel - 1;

                return (
                  <TouchableOpacity
                    key={enemy.id}
                    style={[styles.grindEnemyItem, canWin ? styles.winnable : styles.challenging]}
                    onPress={() => selectEnemyForTaunts(enemy)}
                  >
                    <View style={styles.grindEnemyInfo}>
                      <Text style={styles.grindEnemyName}>
                        ⚔️ {enemy.name}
                      </Text>
                      <Text style={styles.grindEnemyLevel}>
                        Level {enemyLevel} | {canWin ? '💰 EXP Gain' : '💀 Taunt Only'}
                      </Text>
                    </View>
                    <Text style={styles.grindAction}>
                      📢 SELECT FOR TAUNTS
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
                Total Demon Kills: {Object.values(heroData.enemyKillCounts || {}).reduce((sum, kills) => sum + kills, 0)}
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

  // Live Taunt Box
  liveTauntBox: {
    backgroundColor: "#1a1a1a",
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#FF4444",
    marginBottom: 15,
    overflow: "hidden",
  },
  tauntEnemyHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF4444",
    padding: 12,
  },
  tauntEnemyIcon: {
    fontSize: 24,
    marginRight: 10,
  },
  tauntEnemyInfo: {
    flex: 1,
  },
  tauntEnemyName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    fontFamily: "monospace",
  },
  tauntEnemyLevel: {
    color: "#FFFFFF",
    fontSize: 10,
    fontFamily: "monospace",
    opacity: 0.9,
  },
  battleProgressText: {
    color: "#FFD700",
    fontSize: 9,
    fontFamily: "monospace",
    opacity: 0.8,
  },
  dismissTauntBtn: {
    padding: 8,
  },
  dismissTauntText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  liveTauntBubble: {
    padding: 15,
    backgroundColor: "#2a2a2a",
  },
  liveTauntText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "monospace",
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 20,
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

  // Enemies (styles moved to avoid duplicates)
  // enemyName moved to avoid duplicates
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

  // Timer View (styles moved to avoid duplicates)

  // Big Timer (styles moved to avoid duplicates)
  // timerButtonsRow moved to avoid duplicates
  // timerActionBtn and timerActionBtnText moved to avoid duplicates
  // breakBtn and breakBtnText moved to avoid duplicates

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
  grindActions: {
    alignItems: "flex-end",
    gap: 5,
  },
});
