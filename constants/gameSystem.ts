// Core RPG Game System for Psychological Demon-Crushing App

import { StatType } from './enemies';

// Re-export StatType for external use
export { StatType };

export interface HeroStats {
  wealth: number;    // 💰 Money/business tasks
  strength: number;  // 💪 Work/gym/physical tasks
  wisdom: number;    // 🧠 Study/learning tasks
  luck: number;      // 🎯 Miscellaneous/random tasks
}

export interface HeroData {
  // Core RPG stats
  level: number;
  exp: number;
  hp: number;
  maxHp: number;

  // Four power sources (boosted by task completion)
  stats: HeroStats;

  // Story progression (driven by Pomodoros)
  currentAct: number;
  currentEnemy: string | null;
  enemyKillCounts: { [enemyId: string]: number }; // Track how many times each enemy was killed
  availableEnemies: string[];

  // Performance tracking
  streakDays: number;
  totalPomodoros: number;
  heroState: 'struggling' | 'building' | 'strong' | 'legendary';

  // Personal data for AI (the more detailed, the more brutal)
  personalData: {
    problemsJournal: string;      // Their deepest problems and insecurities
    goalsJournal: string;         // Dreams and ambitions to be mocked
    fearsJournal: string;         // Deepest fears about themselves
    failurePatterns: string;      // How they self-sabotage
    specificFailures: string[];   // Actual events/moments of failure
    deepestInsecurities: string;  // Core wounds to exploit
  };

  // Performance metrics for AI targeting
  performanceMetrics: {
    failedDays: number;
    completionRate: number;
    avoidedTasks: string[];
    selfSabotageCount: number;
    distractionTime: number;
  };

  // Data change tracking for AI cache invalidation
  dataTracking: {
    lastDataUpdate: string | null;
    newJournalEntries: number;
    goalsUpdated: boolean;
    statsChanged: boolean;
    lastDataHash: string | null;
  };

  // Battle system
  currentBattle: {
    enemy: string | null;
    enemyHp: number;
    battleState: 'none' | 'active' | 'victory' | 'defeat';
    turnCount: number;
  };

  // Task completion system
  completedToday: number;
  tasksThisSession: TaskCompletion[];
}

export interface TaskCompletion {
  id: string;
  title: string;
  description: string;
  category: StatType;
  pointsEarned: number;
  completedAt: string;
  sessionId?: string;
}

export interface BattleResult {
  victory: boolean;
  expGained: number;
  statsGained: Partial<HeroStats>;
  enemyDefeated?: string;
  specialRewards?: string[];
  damageDealt: number;
  damageTaken: number;
}

export interface ActProgress {
  act: number;
  title: string;
  description: string;
  daysRange: string;
  isCompleted: boolean;
  isActive: boolean;
  progress: number; // 0-100
  enemiesInAct: string[];
  defeatedInAct: string[];
  requirements: {
    minStreak: number;
    minLevel?: number;
    minTotalStats?: number;
    specialRequirements?: string[];
  };
}

// Hero state calculation based on stats and progress
export const calculateHeroState = (heroData: HeroData): typeof heroData.heroState => {
  const totalStats = Object.values(heroData.stats).reduce((sum, val) => sum + val, 0);
  const streak = heroData.streakDays;

  if (totalStats >= 600 && streak >= 70) return 'legendary';
  if (totalStats >= 300 && streak >= 30) return 'strong';
  if (totalStats >= 100 && streak >= 14) return 'building';
  return 'struggling';
};

// Calculate level based on total EXP
export const calculateLevel = (exp: number): number => {
  return Math.floor(exp / 100) + 1; // 100 EXP per level
};

// Calculate EXP needed for next level
export const getExpForNextLevel = (currentExp: number): number => {
  const currentLevel = calculateLevel(currentExp);
  return (currentLevel * 100) - currentExp;
};

// Stat point allocation when completing tasks
export const allocateStatPoints = (
  heroData: HeroData,
  category: StatType,
  points: number
): HeroData => {
  const newStats = { ...heroData.stats };
  newStats[category] += points;

  // Mark stats as changed for AI cache invalidation
  const newDataTracking = {
    ...heroData.dataTracking,
    statsChanged: true
  };

  return {
    ...heroData,
    stats: newStats,
    dataTracking: newDataTracking
  };
};

// Act progression system
export const ACT_DEFINITIONS: ActProgress[] = [
  {
    act: 1,
    title: "The Awakening",
    description: "Face your smallest critics and build initial momentum",
    daysRange: "Days 1-7",
    isCompleted: false,
    isActive: false,
    progress: 0,
    enemiesInAct: ['classroom_kids', 'parents_gossip', 'trash_friends'],
    defeatedInAct: [],
    requirements: {
      minStreak: 7,
      minLevel: 5,
      specialRequirements: ["Defeat 3 small fry enemies"]
    }
  },
  {
    act: 2,
    title: "The Grind",
    description: "Prove you can maintain consistency and face more challenges",
    daysRange: "Days 8-21",
    isCompleted: false,
    isActive: false,
    progress: 0,
    enemiesInAct: ['girls_in_class', 'orcs', 'gremlins'],
    defeatedInAct: [],
    requirements: {
      minStreak: 21,
      minLevel: 10,
      minTotalStats: 100,
      specialRequirements: ["Defeat 6 enemies total", "Complete 50+ Pomodoros"]
    }
  },
  {
    act: 3,
    title: "The Test",
    description: "Confront your personal tormentors with real strength",
    daysRange: "Days 22-42",
    isCompleted: false,
    isActive: false,
    progress: 0,
    enemiesInAct: ['rajest_mishra', 'childhood_bully', 'disappointed_parents', 'girl_who_left'],
    defeatedInAct: [],
    requirements: {
      minStreak: 42,
      minLevel: 20,
      minTotalStats: 300,
      specialRequirements: ["Three stats reach 100+ each", "Complete 100+ Pomodoros"]
    }
  },
  {
    act: 4,
    title: "The Crucible",
    description: "Face psychological destroyers that attack your core identity",
    daysRange: "Days 43-70",
    isCompleted: false,
    isActive: false,
    progress: 0,
    enemiesInAct: ['joker', 'king_joffrey', 'darth_vader'],
    defeatedInAct: [],
    requirements: {
      minStreak: 70,
      minLevel: 35,
      minTotalStats: 500,
      specialRequirements: ["All four stats reach 150+", "Complete 200+ Pomodoros"]
    }
  },
  {
    act: 5,
    title: "Inner Hell",
    description: "Battle your deepest inner demons and self-defeating patterns",
    daysRange: "Days 71-100",
    isCompleted: false,
    isActive: false,
    progress: 0,
    enemiesInAct: ['procrastination_demon', 'anxiety_overlord', 'depression_emperor'],
    defeatedInAct: [],
    requirements: {
      minStreak: 100,
      minLevel: 50,
      minTotalStats: 650,
      specialRequirements: ["Three stats reach 200+", "Complete 300+ Pomodoros"]
    }
  },
  {
    act: 6,
    title: "The Ultimate Battle",
    description: "Face your Inner Demon Lord - the embodiment of all your weaknesses",
    daysRange: "Days 100+",
    isCompleted: false,
    isActive: false,
    progress: 0,
    enemiesInAct: ['inner_demon_lord'],
    defeatedInAct: [],
    requirements: {
      minStreak: 100,
      minLevel: 60,
      minTotalStats: 750,
      specialRequirements: [
        "💰200 💪200 🧠200 🎯150",
        "All previous bosses defeated",
        "14+ day current streak (must be in good form)"
      ]
    }
  }
];

// Calculate current act based on progress
export const getCurrentAct = (heroData: HeroData): number => {
  const { streakDays, stats, enemyKillCounts, totalPomodoros, level } = heroData;
  const totalStats = Object.values(stats).reduce((sum, val) => sum + val, 0);
  const totalKills = Object.values(enemyKillCounts || {}).reduce((sum, kills) => sum + kills, 0);

  // Act 6: Final boss requirements
  if (
    streakDays >= 100 &&
    stats.wealth >= 200 &&
    stats.strength >= 200 &&
    stats.wisdom >= 200 &&
    stats.luck >= 150 &&
    totalKills >= 20
  ) {
    return 6;
  }

  // Act 5: Inner demons (Days 71-100)
  if (streakDays >= 71 && totalStats >= 650 && level >= 50) return 5;

  // Act 4: Psychological destroyers (Days 43-70)
  if (streakDays >= 43 && totalStats >= 500 && level >= 35) return 4;

  // Act 3: Personal tormentors (Days 22-42)
  if (streakDays >= 22 && totalStats >= 300 && level >= 20) return 3;

  // Act 2: More small fries (Days 8-21)
  if (streakDays >= 8 && totalStats >= 100 && level >= 10) return 2;

  // Act 1: Initial awakening (Days 1-7)
  return 1;
};

// Generate a hash of user data for AI cache invalidation
export const generateDataHash = (personalData: HeroData['personalData']): string => {
  const dataString = JSON.stringify(personalData);
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
};

// Default hero data for new users
export const createDefaultHero = (): HeroData => ({
  level: 1,
  exp: 0,
  hp: 100,
  maxHp: 100,

  stats: {
    wealth: 0,
    strength: 0,
    wisdom: 0,
    luck: 0
  },

  currentAct: 1,
  currentEnemy: null,
  enemyKillCounts: {},
  availableEnemies: [],

  streakDays: 0,
  totalPomodoros: 0,
  heroState: 'struggling',

  personalData: {
    problemsJournal: '',
    goalsJournal: '',
    fearsJournal: '',
    failurePatterns: '',
    specificFailures: [],
    deepestInsecurities: ''
  },

  performanceMetrics: {
    failedDays: 0,
    completionRate: 0,
    avoidedTasks: [],
    selfSabotageCount: 0,
    distractionTime: 0
  },

  dataTracking: {
    lastDataUpdate: null,
    newJournalEntries: 0,
    goalsUpdated: false,
    statsChanged: false,
    lastDataHash: null
  },

  currentBattle: {
    enemy: null,
    enemyHp: 0,
    battleState: 'none',
    turnCount: 0
  },

  completedToday: 0,
  tasksThisSession: []
});

// Stat display helpers
export const getStatEmoji = (stat: StatType): string => {
  switch (stat) {
    case 'wealth': return '💰';
    case 'strength': return '💪';
    case 'wisdom': return '🧠';
    case 'luck': return '🎯';
  }
};

export const getStatName = (stat: StatType): string => {
  switch (stat) {
    case 'wealth': return 'WEALTH';
    case 'strength': return 'STRENGTH';
    case 'wisdom': return 'WISDOM';
    case 'luck': return 'LUCK';
  }
};

export const getStatColor = (stat: StatType): string => {
  switch (stat) {
    case 'wealth': return '#FFD700'; // Gold
    case 'strength': return '#FF4444'; // Red
    case 'wisdom': return '#4488FF'; // Blue
    case 'luck': return '#44FF44'; // Green
  }
};