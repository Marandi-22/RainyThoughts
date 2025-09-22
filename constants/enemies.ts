// Complete Enemy Hierarchy for Psychological RPG
// 28 enemies across 5 tiers using personal data for AI-generated taunts

export type StatType = 'wealth' | 'strength' | 'wisdom' | 'luck';

export type EnemyPersonality =
  | 'immature_mockers' | 'judgmental_whispers' | 'fake_loyalty_draggers'
  | 'sarcastic_ice_queens' | 'crude_brutality' | 'chaotic_pranksters'
  | 'arrogant_incompetents' | 'snarky_cowards' | 'cackling_opportunists'
  | 'theatrical_failures' | 'academic_destroyer' | 'physical_intimidator'
  | 'silent_judges' | 'confident_blamers' | 'dismissive_crusher'
  | 'wealth_flaunter' | 'sadistic_chaos_incarnate' | 'entitled_sadist'
  | 'fear_incarnate' | 'cold_overwhelming_power' | 'sophisticated_predator'
  | 'dominant_humiliator' | 'delay_incarnate' | 'inadequacy_amplifier'
  | 'paralysis_inducer' | 'worry_incarnate' | 'hopelessness_incarnate'
  | 'absolute_self_destruction';

export type EnemyTier = 'small_fry' | 'personal_tormentor' | 'psychological_destroyer' | 'inner_demon' | 'ultimate_boss';

export interface Enemy {
  id: string;
  name: string;
  tier: EnemyTier;
  hp: number;
  personality: EnemyPersonality;
  strength: StatType;
  weakness: StatType;

  // AI Integration
  dataTriggers: string[];
  usePersonalData: boolean;
  useGoalData?: boolean;
  useStatData?: boolean;
  alwaysArrogant?: boolean;

  // Cached AI-generated dialogues
  dialogues: {
    when_weak: string[];
    when_afraid: string[];
    always_arrogant?: string[];
  };
  lastDataHash?: string;
  lastGenerated?: string;
  lastTotalStats?: number;

  // Fallback taunts if AI fails
  fallbackTaunts: string[];

  // Requirements to unlock this enemy
  requirements: {
    minStreak?: number;
    minLevel?: number;
    minStats?: Partial<Record<StatType, number>>;
    minTotalStats?: number;
    defeatedEnemies?: string[];
    minPomodoros?: number;
  };

  // Act progression
  act: number;
  unlockDay: number;

  // Special abilities for battle system
  specialAbilities?: string[];
}

// TIER 1: SMALL FRIES (Acts 1-2) - Days 1-21
export const SMALL_FRY_ENEMIES: Enemy[] = [
  {
    id: 'classroom_kids',
    name: 'Your Classroom Kids',
    tier: 'small_fry',
    hp: 60,
    personality: 'immature_mockers',
    strength: 'wealth',
    weakness: 'wisdom',
    dataTriggers: ['academic_failures', 'social_embarrassments', 'childhood_awkwardness'],
    usePersonalData: true,
    dialogues: { when_weak: [], when_afraid: [] },
    fallbackTaunts: [
      "Haha! Look who thinks they can beat us!",
      "Remember when you failed that test? We do!",
      "You're still the same loser from school!"
    ],
    requirements: { minStreak: 0 }, // Changed to 0 so first enemy is always available
    act: 1,
    unlockDay: 1
  },

  {
    id: 'parents_gossip',
    name: "Your Parents' Gossip Circle",
    tier: 'small_fry',
    hp: 80,
    personality: 'judgmental_whispers',
    strength: 'wisdom',
    weakness: 'strength',
    dataTriggers: ['family_disappointments', 'life_choices', 'career_setbacks'],
    usePersonalData: true,
    dialogues: { when_weak: [], when_afraid: [] },
    fallbackTaunts: [
      "*whispers* Did you hear about their latest failure?",
      "Such a disappointment... we expected better.",
      "Your parents are so embarrassed by you."
    ],
    requirements: { minStreak: 1 },
    act: 1,
    unlockDay: 2
  },

  {
    id: 'trash_friends',
    name: 'Your Trash Friends',
    tier: 'small_fry',
    hp: 70,
    personality: 'fake_loyalty_draggers',
    strength: 'luck',
    weakness: 'wealth',
    dataTriggers: ['peer_pressure_failures', 'social_anxiety', 'friendship_betrayals'],
    usePersonalData: true,
    dialogues: { when_weak: [], when_afraid: [] },
    fallbackTaunts: [
      "Come on, just skip this one! We're your friends!",
      "You're being too intense, just relax with us.",
      "Working hard is overrated, join us instead!"
    ],
    requirements: { minStreak: 2 },
    act: 1,
    unlockDay: 3
  },

  {
    id: 'girls_in_class',
    name: 'The Girls in Your Class',
    tier: 'small_fry',
    hp: 65,
    personality: 'sarcastic_ice_queens',
    strength: 'wealth',
    weakness: 'strength',
    dataTriggers: ['romantic_rejections', 'social_status_anxiety', 'appearance_insecurities'],
    usePersonalData: true,
    dialogues: { when_weak: [], when_afraid: [] },
    fallbackTaunts: [
      "Oh wow, trying to be productive now? How cute.",
      "This won't last long, you never follow through.",
      "Some people never change, do they?"
    ],
    requirements: { minStreak: 3 },
    act: 1,
    unlockDay: 4
  },

  {
    id: 'orcs',
    name: 'Orcs (LOTR-style)',
    tier: 'small_fry',
    hp: 85,
    personality: 'crude_brutality',
    strength: 'strength',
    weakness: 'wisdom',
    dataTriggers: ['physical_weakness', 'intimidation_fears', 'violence_anxiety'],
    usePersonalData: true,
    dialogues: { when_weak: [], when_afraid: [] },
    fallbackTaunts: [
      "WEAK! PATHETIC! CRUSH YOU!",
      "You think this makes you strong? LAUGHABLE!",
      "We break weaklings like you for fun!"
    ],
    requirements: { minStreak: 4 },
    act: 1,
    unlockDay: 5
  },

  {
    id: 'gremlins',
    name: 'Gremlins',
    tier: 'small_fry',
    hp: 50,
    personality: 'chaotic_pranksters',
    strength: 'luck',
    weakness: 'strength',
    dataTriggers: ['technology_failures', 'chaos_patterns', 'organization_struggles'],
    usePersonalData: true,
    dialogues: { when_weak: [], when_afraid: [] },
    fallbackTaunts: [
      "Hehe! Your phone's about to distract you!",
      "Ooh, what if everything goes wrong today?",
      "Let's see how long before you give up! *giggle*"
    ],
    requirements: { minStreak: 5 },
    act: 1,
    unlockDay: 6
  },

  {
    id: 'stormtroopers',
    name: 'Stormtroopers',
    tier: 'small_fry',
    hp: 75,
    personality: 'arrogant_incompetents',
    strength: 'wealth',
    weakness: 'luck',
    dataTriggers: ['authority_issues', 'system_failures', 'bureaucracy_frustrations'],
    usePersonalData: true,
    dialogues: { when_weak: [], when_afraid: [] },
    fallbackTaunts: [
      "Our superior training will crush your pathetic efforts!",
      "You rebel scum think you can beat the Empire?",
      "We are professionally trained! You are nothing!"
    ],
    requirements: { minStreak: 6 },
    act: 1,
    unlockDay: 7
  },

  {
    id: 'goblins',
    name: 'Goblins',
    tier: 'small_fry',
    hp: 55,
    personality: 'snarky_cowards',
    strength: 'wealth',
    weakness: 'strength',
    dataTriggers: ['resource_scarcity', 'money_anxiety', 'hoarding_behaviors'],
    usePersonalData: true,
    dialogues: { when_weak: [], when_afraid: [] },
    fallbackTaunts: [
      "Precious time you're wasting, yes precious!",
      "We knows you'll quit soon, we knows it!",
      "Shiny focus won't last, no it won't!"
    ],
    requirements: { minStreak: 7 },
    act: 1,
    unlockDay: 8
  },

  {
    id: 'hyenas',
    name: 'Hyenas (Lion King)',
    tier: 'small_fry',
    hp: 70,
    personality: 'cackling_opportunists',
    strength: 'luck',
    weakness: 'wisdom',
    dataTriggers: ['failure_moments', 'embarrassment_memories', 'downfall_patterns'],
    usePersonalData: true,
    dialogues: { when_weak: [], when_afraid: [] },
    fallbackTaunts: [
      "Ahahahaha! Remember all your failures!",
      "We smell weakness! The hyenas are circling!",
      "Your downfall will be our feast! *cackle*"
    ],
    requirements: { minStreak: 8 },
    act: 2,
    unlockDay: 9
  },

  {
    id: 'team_rocket',
    name: 'Team Rocket',
    tier: 'small_fry',
    hp: 60,
    personality: 'theatrical_failures',
    strength: 'wealth',
    weakness: 'strength',
    dataTriggers: ['get_rich_quick_schemes', 'unrealistic_dreams', 'pattern_failures'],
    usePersonalData: true,
    dialogues: { when_weak: [], when_afraid: [] },
    fallbackTaunts: [
      "Prepare for trouble! And make it double!",
      "To protect the world from productivity!",
      "You'll blast off like all your failed attempts!"
    ],
    requirements: { minStreak: 9 },
    act: 2,
    unlockDay: 10
  }
];

// TIER 2: PERSONAL TORMENTORS (Act 3) - Days 22-42
export const PERSONAL_TORMENTORS: Enemy[] = [
  {
    id: 'rajest_mishra',
    name: 'Rajest Mishra - Your Academic Destroyer',
    tier: 'personal_tormentor',
    hp: 120,
    personality: 'academic_destroyer',
    strength: 'wisdom',
    weakness: 'luck',
    dataTriggers: ['academic_failures', 'test_scores', 'learning_difficulties', 'educational_trauma'],
    usePersonalData: true,
    useGoalData: true,
    dialogues: { when_weak: [], when_afraid: [] },
    fallbackTaunts: [
      "Still the same confused student who never understood the basics.",
      "Your academic record speaks for itself - pathetic.",
      "Intelligence cannot be improved with timers."
    ],
    specialAbilities: ['grade_crusher', 'future_destroyer', 'confidence_killer'],
    requirements: { minStreak: 22, minStats: { wisdom: 75 } },
    act: 3,
    unlockDay: 22
  },

  {
    id: 'childhood_bully',
    name: 'Your Childhood Bully',
    tier: 'personal_tormentor',
    hp: 100,
    personality: 'physical_intimidator',
    strength: 'strength',
    weakness: 'wisdom',
    dataTriggers: ['physical_weakness', 'bullying_trauma', 'intimidation_memories', 'courage_failures'],
    usePersonalData: true,
    dialogues: { when_weak: [], when_afraid: [] },
    fallbackTaunts: [
      "Still the same weakling I used to push around.",
      "Productivity won't give you the courage you never had.",
      "Once weak, always weak."
    ],
    specialAbilities: ['trauma_trigger', 'weakness_exploiter', 'fear_resurrector'],
    requirements: { minStreak: 28, minStats: { strength: 75 } },
    act: 3,
    unlockDay: 28
  },

  {
    id: 'disappointed_parents',
    name: 'Your Disappointed Parents',
    tier: 'personal_tormentor',
    hp: 130,
    personality: 'silent_judges',
    strength: 'wisdom',
    weakness: 'luck',
    dataTriggers: ['family_expectations', 'career_disappointments', 'life_choices', 'parental_approval_needs'],
    usePersonalData: true,
    useGoalData: true,
    dialogues: { when_weak: [], when_afraid: [] },
    fallbackTaunts: [
      "We had such high hopes for you...",
      "Where did we go wrong as parents?",
      "Your siblings never disappointed us like this."
    ],
    requirements: { minStreak: 30, minStats: { wisdom: 80 } },
    act: 3,
    unlockDay: 30
  },

  {
    id: 'girl_who_left',
    name: 'The Girl Who Crushed Your Heart',
    tier: 'personal_tormentor',
    hp: 110,
    personality: 'dismissive_crusher',
    strength: 'wealth',
    weakness: 'wisdom',
    dataTriggers: ['romantic_failures', 'rejection_trauma', 'inadequacy_feelings', 'relationship_patterns'],
    usePersonalData: true,
    useGoalData: true,
    dialogues: { when_weak: [], when_afraid: [] },
    fallbackTaunts: [
      "You're still not the man I need you to be.",
      "My new boyfriend doesn't need productivity apps.",
      "Some people are just... not enough."
    ],
    specialAbilities: ['rejection_replay', 'inadequacy_amplifier', 'replacement_reminder'],
    requirements: { minStreak: 35, minStats: { wealth: 75 } },
    act: 3,
    unlockDay: 35
  },

  {
    id: 'incompetent_friends',
    name: 'Your Incompetent Friends',
    tier: 'personal_tormentor',
    hp: 90,
    personality: 'confident_blamers',
    strength: 'strength',
    weakness: 'wealth',
    dataTriggers: ['peer_influence', 'group_failure_patterns', 'responsibility_avoidance'],
    usePersonalData: true,
    dialogues: { when_weak: [], when_afraid: [] },
    fallbackTaunts: [
      "This is all your fault, you know that right?",
      "We're failing because of YOUR bad decisions!",
      "Stop trying so hard, you're making us look bad!"
    ],
    specialAbilities: ['blame_shifting', 'confidence_masking', 'group_pressure'],
    requirements: { minStreak: 30, minStats: { strength: 60 } },
    act: 3,
    unlockDay: 30
  },

  {
    id: 'rich_friend',
    name: 'Your Rich Friend',
    tier: 'personal_tormentor',
    hp: 100,
    personality: 'wealth_flaunter',
    strength: 'wealth',
    weakness: 'strength',
    dataTriggers: ['financial_struggles', 'status_envy', 'resource_comparison', 'class_anxiety'],
    usePersonalData: true,
    dialogues: { when_weak: [], when_afraid: [] },
    fallbackTaunts: [
      "While you waste time, I'm making money.",
      "This is why you'll always be beneath me.",
      "Poor people work hard. Rich people work smart."
    ],
    specialAbilities: ['status_crushing', 'wealth_display', 'class_warfare'],
    requirements: { minStreak: 32, minStats: { wealth: 50 } },
    act: 3,
    unlockDay: 32
  }
];

// TIER 3: PSYCHOLOGICAL DESTROYERS (Act 4) - Days 43-70
export const PSYCHOLOGICAL_DESTROYERS: Enemy[] = [
  {
    id: 'joker',
    name: 'The Joker - Agent of Chaos',
    tier: 'psychological_destroyer',
    hp: 200,
    personality: 'sadistic_chaos_incarnate',
    strength: 'luck',
    weakness: 'strength',
    dataTriggers: ['all_failure_patterns', 'chaos_attraction', 'self_sabotage', 'unpredictability_fears'],
    usePersonalData: true,
    useGoalData: true,
    useStatData: true,
    dialogues: { when_weak: [], when_afraid: [] },
    fallbackTaunts: [
      "HAHAHA! Order is an illusion, and you're the punchline!",
      "I love watching you try so hard just to fail again!",
      "Your life is the best joke I've ever told!"
    ],
    specialAbilities: ['chaos_predictor', 'joke_maker', 'order_destroyer'],
    requirements: { minStreak: 45, minTotalStats: 300 },
    act: 4,
    unlockDay: 45
  },

  {
    id: 'king_joffrey',
    name: 'King Joffrey - The Entitled Destroyer',
    tier: 'psychological_destroyer',
    hp: 140,
    personality: 'entitled_sadist',
    strength: 'wealth',
    weakness: 'strength',
    dataTriggers: ['powerlessness', 'authority_abuse', 'privilege_envy', 'injustice_experiences'],
    usePersonalData: true,
    useGoalData: true,
    alwaysArrogant: true,
    dialogues: { when_weak: [], when_afraid: [], always_arrogant: [] },
    fallbackTaunts: [
      "You will always be beneath people like me.",
      "Hard work is for peasants who can't afford privilege.",
      "Your productivity is amusing, like a pet's tricks."
    ],
    requirements: { minStreak: 50, minTotalStats: 350 },
    act: 4,
    unlockDay: 50
  },

  {
    id: 'darth_vader',
    name: 'Darth Vader - Dark Lord',
    tier: 'psychological_destroyer',
    hp: 220,
    personality: 'cold_overwhelming_power',
    strength: 'strength',
    weakness: 'luck',
    dataTriggers: ['authority_fear', 'power_intimidation', 'father_issues', 'inadequacy_complex'],
    usePersonalData: true,
    dialogues: { when_weak: [], when_afraid: [] },
    fallbackTaunts: [
      "Your lack of discipline is... disturbing.",
      "You underestimate the power of your own weakness.",
      "Your productivity cannot save you from what you are."
    ],
    requirements: { minStreak: 60, minTotalStats: 400 },
    act: 4,
    unlockDay: 60
  },

  {
    id: 'pennywise',
    name: 'Pennywise (IT)',
    tier: 'psychological_destroyer',
    hp: 180,
    personality: 'fear_incarnate',
    strength: 'wisdom',
    weakness: 'strength',
    dataTriggers: ['deepest_fears', 'phobias', 'trauma_memories', 'childhood_terrors'],
    usePersonalData: true,
    dialogues: { when_weak: [], when_afraid: [] },
    fallbackTaunts: [
      "We all know what you're truly afraid of...",
      "Your deepest fears are my playground.",
      "Fear has many faces, and I am ALL of them."
    ],
    specialAbilities: ['fear_manifestation', 'trauma_resurrection', 'terror_amplification'],
    requirements: { minStreak: 50, minTotalStats: 350 },
    act: 4,
    unlockDay: 50
  },

  {
    id: 'dracula',
    name: 'Dracula (Classic)',
    tier: 'psychological_destroyer',
    hp: 160,
    personality: 'sophisticated_predator',
    strength: 'wealth',
    weakness: 'wisdom',
    dataTriggers: ['temptation_patterns', 'addiction_struggles', 'willpower_failures', 'dark_attractions'],
    usePersonalData: true,
    dialogues: { when_weak: [], when_afraid: [] },
    fallbackTaunts: [
      "Such delicious weakness... irresistible.",
      "You cannot resist temptation forever, my dear.",
      "I offer power, pleasure... why do you resist?"
    ],
    specialAbilities: ['temptation_weaving', 'willpower_draining', 'seductive_manipulation'],
    requirements: { minStreak: 55, minTotalStats: 375 },
    act: 4,
    unlockDay: 55
  },

  {
    id: 'ntr_bully',
    name: 'NTR Bully',
    tier: 'psychological_destroyer',
    hp: 150,
    personality: 'dominant_humiliator',
    strength: 'strength',
    weakness: 'luck',
    dataTriggers: ['sexual_inadequacy', 'masculine_insecurity', 'dominance_fears', 'relationship_trauma'],
    usePersonalData: true,
    dialogues: { when_weak: [], when_afraid: [] },
    fallbackTaunts: [
      "You'll never be man enough for anything.",
      "I take what I want, and you watch helplessly.",
      "Your weakness disgusts me, but it's useful."
    ],
    specialAbilities: ['dominance_assertion', 'humiliation_mastery', 'power_theft'],
    requirements: { minStreak: 45, minTotalStats: 325 },
    act: 4,
    unlockDay: 45
  }
];

// TIER 4: INNER DEMONS (Act 5) - Days 71-100
export const INNER_DEMONS: Enemy[] = [
  {
    id: 'procrastination_demon',
    name: 'The Procrastination Demon',
    tier: 'inner_demon',
    hp: 300,
    personality: 'delay_incarnate',
    strength: 'luck',
    weakness: 'strength',
    dataTriggers: ['procrastination_patterns', 'avoidance_behaviors', 'deadline_failures', 'motivation_struggles'],
    usePersonalData: true,
    useGoalData: true,
    dialogues: { when_weak: [], when_afraid: [] },
    fallbackTaunts: [
      "You can start tomorrow. You always do.",
      "Just five more minutes. Just one more break.",
      "Why do today what you can put off forever?"
    ],
    requirements: { minStreak: 75, minTotalStats: 500 },
    act: 5,
    unlockDay: 75
  },

  {
    id: 'anxiety_overlord',
    name: 'The Anxiety Overlord',
    tier: 'inner_demon',
    hp: 400,
    personality: 'worry_incarnate',
    strength: 'wisdom',
    weakness: 'strength',
    dataTriggers: ['anxiety_patterns', 'worry_spirals', 'catastrophic_thinking', 'fear_paralysis'],
    usePersonalData: true,
    dialogues: { when_weak: [], when_afraid: [] },
    fallbackTaunts: [
      "What if you fail? What if everyone sees your weakness?",
      "Every worst-case scenario will come true.",
      "You're not strong enough to handle what's coming."
    ],
    requirements: { minStreak: 85, minTotalStats: 600 },
    act: 5,
    unlockDay: 85
  },

  {
    id: 'depression_emperor',
    name: 'The Depression Emperor',
    tier: 'inner_demon',
    hp: 450,
    personality: 'hopelessness_incarnate',
    strength: 'strength',
    weakness: 'luck',
    dataTriggers: ['depression_episodes', 'hopelessness_patterns', 'energy_depletion', 'motivation_loss'],
    usePersonalData: true,
    dialogues: { when_weak: [], when_afraid: [] },
    fallbackTaunts: [
      "Nothing you do matters. Nothing will ever change.",
      "You're just going through the motions of a meaningless life.",
      "Why try when failure is inevitable?"
    ],
    requirements: { minStreak: 90, minTotalStats: 650 },
    act: 5,
    unlockDay: 90
  },

  {
    id: 'impostor_shadow',
    name: 'The Impostor Shadow',
    tier: 'inner_demon',
    hp: 280,
    personality: 'inadequacy_amplifier',
    strength: 'wisdom',
    weakness: 'wealth',
    dataTriggers: ['impostor_syndrome', 'competence_doubts', 'comparison_patterns', 'achievement_anxiety'],
    usePersonalData: true,
    dialogues: { when_weak: [], when_afraid: [] },
    fallbackTaunts: [
      "Everyone can see you're a fraud.",
      "You don't belong here with the real achievers.",
      "They'll discover you're fake soon enough."
    ],
    specialAbilities: ['impostor_whispers', 'inadequacy_magnification', 'comparison_torture'],
    requirements: { minStreak: 80, minTotalStats: 550 },
    act: 5,
    unlockDay: 80
  },

  {
    id: 'perfectionism_wraith',
    name: 'The Perfectionism Wraith',
    tier: 'inner_demon',
    hp: 320,
    personality: 'paralysis_inducer',
    strength: 'wisdom',
    weakness: 'luck',
    dataTriggers: ['perfectionism_paralysis', 'fear_of_imperfection', 'analysis_overdose', 'completion_anxiety'],
    usePersonalData: true,
    dialogues: { when_weak: [], when_afraid: [] },
    fallbackTaunts: [
      "This isn't perfect enough yet. Keep polishing.",
      "What if you make a mistake? Better not start.",
      "Excellence demands perfection. You demand mediocrity."
    ],
    specialAbilities: ['paralysis_induction', 'perfection_demands', 'analysis_loops'],
    requirements: { minStreak: 82, minTotalStats: 575 },
    act: 5,
    unlockDay: 82
  }
];

// TIER 5: ULTIMATE BOSS (100+ days)
export const ULTIMATE_BOSS: Enemy = {
  id: 'inner_demon_lord',
  name: 'Your Inner Demon Lord',
  tier: 'ultimate_boss',
  hp: 1000,
  personality: 'absolute_self_destruction',
  strength: 'wisdom', // Uses all stats
  weakness: 'luck', // Requires perfect balance
  dataTriggers: ['ALL_PERSONAL_DATA'],
  usePersonalData: true,
  useGoalData: true,
  useStatData: true,
  dialogues: { when_weak: [], when_afraid: [], always_arrogant: [] },
  fallbackTaunts: [
    "I AM you. Every excuse, every rationalization, every moment of weakness.",
    "You can defeat every enemy except the one that matters - yourself.",
    "I am the voice that tells you to quit, and you ALWAYS listen."
  ],
  requirements: {
    minStreak: 100,
    minPomodoros: 300,
    minStats: { wealth: 200, strength: 200, wisdom: 200, luck: 150 }
  },
  act: 6,
  unlockDay: 100
};

// Combined enemy database
export const ALL_ENEMIES: Enemy[] = [
  ...SMALL_FRY_ENEMIES,
  ...PERSONAL_TORMENTORS,
  ...PSYCHOLOGICAL_DESTROYERS,
  ...INNER_DEMONS,
  ULTIMATE_BOSS
];

// Helper functions
export const getEnemiesForAct = (act: number): Enemy[] => {
  return ALL_ENEMIES.filter(enemy => enemy.act === act);
};

export const getEnemyById = (id: string): Enemy | undefined => {
  return ALL_ENEMIES.find(enemy => enemy.id === id);
};

export const getUnlockedEnemies = (streakDays: number, stats: Record<StatType, number>, totalPomodoros: number): Enemy[] => {
  return ALL_ENEMIES.filter(enemy => {
    const reqs = enemy.requirements;

    // Check streak requirement
    if (reqs.minStreak && streakDays < reqs.minStreak) return false;

    // Check stat requirements
    if (reqs.minStats) {
      for (const [stat, minValue] of Object.entries(reqs.minStats)) {
        if (stats[stat as StatType] < minValue) return false;
      }
    }

    // Check total stats requirement
    if (reqs.minTotalStats) {
      const totalStats = Object.values(stats).reduce((sum, val) => sum + val, 0);
      if (totalStats < reqs.minTotalStats) return false;
    }

    // Check pomodoros requirement
    if (reqs.minPomodoros && totalPomodoros < reqs.minPomodoros) return false;

    return true;
  });
};

export default ALL_ENEMIES;