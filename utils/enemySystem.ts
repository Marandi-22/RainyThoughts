import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Enemy {
  id: number;
  name: string;
  hp: number;
  tier: number;
  personality: string;
  strength: string;
  weakness: string;
  dataTriggers: string[];
  special: string;
  defeated: boolean;
  currentHP: number;
}

export const ENEMIES: Enemy[] = [
  // Tier 1: Small Fries (Acts 1-2)
  {
    id: 1,
    name: "Your Classroom Kids",
    hp: 60,
    tier: 1,
    personality: "immature_mockers",
    strength: "💰 WEALTH",
    weakness: "🧠 WISDOM",
    dataTriggers: ["academic_failures", "social_embarrassments", "childhood_awkwardness"],
    special: "Gang up in groups, laugh in unison at your mistakes",
    defeated: false,
    currentHP: 60
  },
  {
    id: 2,
    name: "Your Parents' Gossip Circle",
    hp: 80,
    tier: 1,
    personality: "judgmental_whispers",
    strength: "🧠 WISDOM",
    weakness: "💪 STRENGTH",
    dataTriggers: ["family_disappointments", "life_choices", "career_setbacks"],
    special: "Magnify your failures through \"concerned\" whispers",
    defeated: false,
    currentHP: 80
  },
  {
    id: 3,
    name: "Your Trash Friends",
    hp: 70,
    tier: 1,
    personality: "fake_loyalty_draggers",
    strength: "🎯 LUCK",
    weakness: "💰 WEALTH",
    dataTriggers: ["peer_pressure_failures", "social_anxiety", "friendship_betrayals"],
    special: "Pretend to support you while sabotaging",
    defeated: false,
    currentHP: 70
  },
  {
    id: 4,
    name: "The Girls in Your Class",
    hp: 65,
    tier: 1,
    personality: "sarcastic_ice_queens",
    strength: "💰 WEALTH",
    weakness: "💪 STRENGTH",
    dataTriggers: ["romantic_rejections", "social_status_anxiety", "appearance_insecurities"],
    special: "Icy sarcasm, giggle at your nervousness",
    defeated: false,
    currentHP: 65
  },
  {
    id: 5,
    name: "Orcs (LOTR-style)",
    hp: 85,
    tier: 1,
    personality: "crude_brutality",
    strength: "💪 STRENGTH",
    weakness: "🧠 WISDOM",
    dataTriggers: ["physical_weakness", "intimidation_fears", "violence_anxiety"],
    special: "Overwhelming crude mockery, yell over each other",
    defeated: false,
    currentHP: 85
  },
  {
    id: 6,
    name: "Gremlins",
    hp: 50,
    tier: 1,
    personality: "chaotic_pranksters",
    strength: "🎯 LUCK",
    weakness: "💪 STRENGTH",
    dataTriggers: ["technology_failures", "chaos_patterns", "organization_struggles"],
    special: "Cause chaos while laughing maniacally",
    defeated: false,
    currentHP: 50
  },
  {
    id: 7,
    name: "Stormtroopers",
    hp: 75,
    tier: 1,
    personality: "arrogant_incompetents",
    strength: "💰 WEALTH",
    weakness: "🎯 LUCK",
    dataTriggers: ["authority_issues", "system_failures", "bureaucracy_frustrations"],
    special: "Act superior while failing constantly",
    defeated: false,
    currentHP: 75
  },
  {
    id: 8,
    name: "Goblins",
    hp: 55,
    tier: 1,
    personality: "snarky_cowards",
    strength: "💰 WEALTH",
    weakness: "💪 STRENGTH",
    dataTriggers: ["resource_scarcity", "money_anxiety", "hoarding_behaviors"],
    special: "Gloat in numbers, run when alone",
    defeated: false,
    currentHP: 55
  },
  {
    id: 9,
    name: "Hyenas (Lion King)",
    hp: 70,
    tier: 1,
    personality: "cackling_opportunists",
    strength: "🎯 LUCK",
    weakness: "🧠 WISDOM",
    dataTriggers: ["failure_moments", "embarrassment_memories", "downfall_patterns"],
    special: "Iconic maniacal laughter at your suffering",
    defeated: false,
    currentHP: 70
  },
  {
    id: 10,
    name: "Team Rocket",
    hp: 60,
    tier: 1,
    personality: "theatrical_failures",
    strength: "💰 WEALTH",
    weakness: "💪 STRENGTH",
    dataTriggers: ["get_rich_quick_schemes", "unrealistic_dreams", "pattern_failures"],
    special: "Loud rhyming trash talk, fail spectacularly",
    defeated: false,
    currentHP: 60
  },

  // Tier 2: Mid-Game Enemies (Act 3)
  {
    id: 11,
    name: "Your School Teacher (Rajest Mishra)",
    hp: 120,
    tier: 2,
    personality: "academic_destroyer",
    strength: "🧠 WISDOM",
    weakness: "🎯 LUCK",
    dataTriggers: ["academic_failures", "test_scores", "learning_difficulties", "educational_trauma"],
    special: "Belittling academic performance, nitpicks every intellectual weakness",
    defeated: false,
    currentHP: 120
  },
  {
    id: 12,
    name: "Your Childhood Bully",
    hp: 100,
    tier: 2,
    personality: "physical_intimidator",
    strength: "💪 STRENGTH",
    weakness: "🧠 WISDOM",
    dataTriggers: ["physical_weakness", "bullying_trauma", "intimidation_memories", "courage_failures"],
    special: "Loves reminding you of past physical/social humiliations",
    defeated: false,
    currentHP: 100
  },
  {
    id: 13,
    name: "Your Disappointed Parents",
    hp: 130,
    tier: 2,
    personality: "silent_judges",
    strength: "🧠 WISDOM",
    weakness: "🎯 LUCK",
    dataTriggers: ["family_expectations", "career_disappointments", "life_choices", "parental_approval_needs"],
    special: "Silent judgment, devastating sighs, \"you could've done better\"",
    defeated: false,
    currentHP: 130
  },
  {
    id: 14,
    name: "Your Incompetent Friends",
    hp: 90,
    tier: 2,
    personality: "confident_blamers",
    strength: "💪 STRENGTH",
    weakness: "💰 WEALTH",
    dataTriggers: ["peer_influence", "group_failure_patterns", "responsibility_avoidance"],
    special: "Act confident while failing, blame you for their problems",
    defeated: false,
    currentHP: 90
  },
  {
    id: 15,
    name: "The Girl Who Left You",
    hp: 110,
    tier: 2,
    personality: "dismissive_crusher",
    strength: "💰 WEALTH",
    weakness: "🧠 WISDOM",
    dataTriggers: ["romantic_failures", "rejection_trauma", "inadequacy_feelings", "relationship_patterns"],
    special: "Dismissive attitude, makes you feel \"not enough\"",
    defeated: false,
    currentHP: 110
  },
  {
    id: 16,
    name: "Your Rich Friend",
    hp: 100,
    tier: 2,
    personality: "wealth_flaunter",
    strength: "💰 WEALTH",
    weakness: "💪 STRENGTH",
    dataTriggers: ["financial_struggles", "status_envy", "resource_comparison", "class_anxiety"],
    special: "Arrogant wealth display, mocks your financial struggles",
    defeated: false,
    currentHP: 100
  },

  // Tier 3: Major Bosses (Act 4)
  {
    id: 17,
    name: "The Joker (Chaos Agent)",
    hp: 200,
    tier: 3,
    personality: "sadistic_chaos_incarnate",
    strength: "🎯 LUCK",
    weakness: "💪 STRENGTH",
    dataTriggers: ["all_failure_patterns", "chaos_attraction", "self_sabotage", "unpredictability_fears"],
    special: "Sadistic psychological warfare, turns your problems into cruel comedy",
    defeated: false,
    currentHP: 200
  },
  {
    id: 18,
    name: "King Joffrey",
    hp: 140,
    tier: 3,
    personality: "entitled_sadist",
    strength: "💰 WEALTH",
    weakness: "💪 STRENGTH",
    dataTriggers: ["powerlessness", "authority_abuse", "privilege_envy", "injustice_experiences"],
    special: "Cruel mockery from position of privilege, loves making you feel powerless",
    defeated: false,
    currentHP: 140
  },
  {
    id: 19,
    name: "Pennywise (IT)",
    hp: 180,
    tier: 3,
    personality: "fear_incarnate",
    strength: "🧠 WISDOM",
    weakness: "💪 STRENGTH",
    dataTriggers: ["deepest_fears", "phobias", "trauma_memories", "childhood_terrors"],
    special: "Morphs into your specific fears, mocks what hurts most",
    defeated: false,
    currentHP: 180
  },
  {
    id: 20,
    name: "Darth Vader",
    hp: 220,
    tier: 3,
    personality: "cold_overwhelming_power",
    strength: "💪 STRENGTH",
    weakness: "🎯 LUCK",
    dataTriggers: ["authority_fear", "power_intimidation", "father_issues", "inadequacy_complex"],
    special: "Cold, crushing presence, few words but maximum intimidation",
    defeated: false,
    currentHP: 220
  },
  {
    id: 21,
    name: "Dracula (Classic)",
    hp: 160,
    tier: 3,
    personality: "sophisticated_predator",
    strength: "💰 WEALTH",
    weakness: "🧠 WISDOM",
    dataTriggers: ["temptation_patterns", "addiction_struggles", "willpower_failures", "dark_attractions"],
    special: "Sophisticated seduction, taunts your weakness to temptation",
    defeated: false,
    currentHP: 160
  },
  {
    id: 22,
    name: "NTR Bully",
    hp: 150,
    tier: 3,
    personality: "dominant_humiliator",
    strength: "💪 STRENGTH",
    weakness: "🎯 LUCK",
    dataTriggers: ["sexual_inadequacy", "masculine_insecurity", "dominance_fears", "relationship_trauma"],
    special: "Arrogant sexual dominance, rubs humiliation in your face",
    defeated: false,
    currentHP: 150
  },

  // Tier 4: Inner Demon Lords (Act 5)
  {
    id: 23,
    name: "The Procrastination Demon",
    hp: 300,
    tier: 4,
    personality: "delay_incarnate",
    strength: "🎯 LUCK",
    weakness: "💪 STRENGTH",
    dataTriggers: ["procrastination_patterns", "avoidance_behaviors", "deadline_failures", "motivation_struggles"],
    special: "Master of \"tomorrow\" promises, uses your delay patterns against you",
    defeated: false,
    currentHP: 300
  },
  {
    id: 24,
    name: "The Impostor Shadow",
    hp: 280,
    tier: 4,
    personality: "inadequacy_amplifier",
    strength: "🧠 WISDOM",
    weakness: "💰 WEALTH",
    dataTriggers: ["impostor_syndrome", "competence_doubts", "comparison_patterns", "achievement_anxiety"],
    special: "Makes you feel like a fraud, amplifies inadequacy feelings",
    defeated: false,
    currentHP: 280
  },
  {
    id: 25,
    name: "The Perfectionism Wraith",
    hp: 320,
    tier: 4,
    personality: "paralysis_inducer",
    strength: "🧠 WISDOM",
    weakness: "🎯 LUCK",
    dataTriggers: ["perfectionism_paralysis", "fear_of_imperfection", "analysis_overdose", "completion_anxiety"],
    special: "Stops you from starting/finishing through perfectionist demands",
    defeated: false,
    currentHP: 320
  },
  {
    id: 26,
    name: "The Anxiety Overlord",
    hp: 400,
    tier: 4,
    personality: "worry_incarnate",
    strength: "🧠 WISDOM",
    weakness: "💪 STRENGTH",
    dataTriggers: ["anxiety_patterns", "worry_spirals", "catastrophic_thinking", "fear_paralysis"],
    special: "Manifests all your worries and worst-case scenario thinking",
    defeated: false,
    currentHP: 400
  },
  {
    id: 27,
    name: "The Depression Emperor",
    hp: 450,
    tier: 4,
    personality: "hopelessness_incarnate",
    strength: "💪 STRENGTH",
    weakness: "🎯 LUCK",
    dataTriggers: ["depression_episodes", "hopelessness_patterns", "energy_depletion", "motivation_loss"],
    special: "Drains all hope and energy, makes everything feel pointless",
    defeated: false,
    currentHP: 450
  },

  // Tier 5: Ultimate Final Boss
  {
    id: 28,
    name: "Your Inner Demon Lord",
    hp: 1000,
    tier: 5,
    personality: "absolute_self_destruction",
    strength: "ALL STATS",
    weakness: "PERFECT BALANCE",
    dataTriggers: ["ALL_PERSONAL_DATA"],
    special: "IS you - every excuse, rationalization, self-sabotage pattern. The voice that tells you to quit.",
    defeated: false,
    currentHP: 1000
  }
];

export class EnemyManager {
  private static readonly STORAGE_KEY = 'enemy_data';

  /**
   * Get current enemy based on player stats and progression
   */
  static async getCurrentEnemy(): Promise<Enemy | null> {
    try {
      // Load player stats (you'll need to implement this based on your game system)
      // For now, we'll start with the first enemy
      const enemyData = await this.loadEnemyData();

      // Find the first undefeated enemy
      for (const enemy of ENEMIES) {
        const savedEnemy = enemyData[enemy.id];
        if (!savedEnemy || !savedEnemy.defeated) {
          return savedEnemy || enemy;
        }
      }

      return null; // All enemies defeated
    } catch (error) {
      console.error('Error getting current enemy:', error);
      return ENEMIES[0]; // Default to first enemy
    }
  }

  /**
   * Load enemy data from storage
   */
  private static async loadEnemyData(): Promise<{ [key: number]: Enemy }> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading enemy data:', error);
      return {};
    }
  }

  /**
   * Save enemy data to storage
   */
  private static async saveEnemyData(enemyData: { [key: number]: Enemy }): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(enemyData));
    } catch (error) {
      console.error('Error saving enemy data:', error);
    }
  }

  /**
   * Deal damage to current enemy
   */
  static async dealDamage(enemyId: number, damage: number): Promise<Enemy | null> {
    try {
      const enemyData = await this.loadEnemyData();
      const enemy = enemyData[enemyId] || ENEMIES.find(e => e.id === enemyId);

      if (!enemy) return null;

      enemy.currentHP = Math.max(0, enemy.currentHP - damage);

      if (enemy.currentHP <= 0) {
        enemy.defeated = true;
        enemy.currentHP = 0;
      }

      enemyData[enemyId] = enemy;
      await this.saveEnemyData(enemyData);

      return enemy;
    } catch (error) {
      console.error('Error dealing damage:', error);
      return null;
    }
  }

  /**
   * Generate personality-based taunt for an enemy
   */
  static generateTaunt(enemy: Enemy): string {
    const taunts: { [key: string]: string[] } = {
      immature_mockers: [
        "Haha! Look who thinks they can beat us!",
        "Remember when you failed that test? We do!",
        "You're still the same loser from school!"
      ],
      judgmental_whispers: [
        "*whispers* Did you hear about their latest failure?",
        "Such a disappointment... we expected better.",
        "Your parents are so embarrassed by you."
      ],
      fake_loyalty_draggers: [
        "Come on, just skip this one! We're your friends!",
        "You're being too intense, just relax with us.",
        "Working hard is overrated, join us instead!"
      ],
      sarcastic_ice_queens: [
        "Oh wow, trying to be productive now? How cute.",
        "This won't last long, you never follow through.",
        "Some people never change, do they?"
      ],
      crude_brutality: [
        "WEAK! PATHETIC! CRUSH YOU!",
        "You think this makes you strong? LAUGHABLE!",
        "We break weaklings like you for fun!"
      ],
      chaotic_pranksters: [
        "Hehe! Your phone's about to distract you!",
        "Ooh, what if everything goes wrong today?",
        "Let's see how long before you give up! *giggle*"
      ],
      arrogant_incompetents: [
        "Our superior training will crush your pathetic efforts!",
        "You rebel scum think you can beat the Empire?",
        "We are professionally trained! You are nothing!"
      ],
      snarky_cowards: [
        "Precious time you're wasting, yes precious!",
        "We knows you'll quit soon, we knows it!",
        "Shiny focus won't last, no it won't!"
      ],
      cackling_opportunists: [
        "Ahahahaha! Remember all your failures!",
        "We smell weakness! The hyenas are circling!",
        "Your downfall will be our feast! *cackle*"
      ],
      theatrical_failures: [
        "Prepare for trouble! And make it double!",
        "To protect the world from productivity!",
        "You'll blast off like all your failed attempts!"
      ],
      academic_destroyer: [
        "Your intellectual capacity is... disappointing.",
        "I've seen children perform better than this.",
        "Such potential, wasted on someone like you."
      ],
      physical_intimidator: [
        "Still that same weak kid I used to push around.",
        "You think this changes anything? You're still nothing.",
        "I owned you then, I own you now."
      ],
      silent_judges: [
        "*disappointed sigh* We had such hopes for you...",
        "Your siblings would never waste time like this.",
        "We sacrificed so much, and this is what we get?"
      ],
      confident_blamers: [
        "This is all your fault, you know that right?",
        "We're failing because of YOUR bad decisions!",
        "Stop trying so hard, you're making us look bad!"
      ],
      dismissive_crusher: [
        "Is this supposed to impress me? How pathetic.",
        "You're still not enough. You'll never be enough.",
        "I left you for a reason. This just confirms it."
      ],
      wealth_flaunter: [
        "While you waste time, I'm making money.",
        "This is why you'll always be beneath me.",
        "Poor people work hard. Rich people work smart."
      ],
      sadistic_chaos_incarnate: [
        "AHAHAHAHA! Your suffering amuses me greatly!",
        "Let's see how long before you break completely!",
        "Chaos is coming! And it's going to be BEAUTIFUL!"
      ],
      entitled_sadist: [
        "You dare challenge your betters?",
        "I was born to rule over peasants like you.",
        "Your pain is my entertainment, worm."
      ],
      fear_incarnate: [
        "We all know what you're truly afraid of...",
        "Your deepest fears are my playground.",
        "Fear has many faces, and I am ALL of them."
      ],
      cold_overwhelming_power: [
        "Your lack of faith is... disturbing.",
        "You underestimate the power of the dark side.",
        "Your feeble efforts are no match for my power."
      ],
      sophisticated_predator: [
        "Such delicious weakness... irresistible.",
        "You cannot resist temptation forever, my dear.",
        "I offer power, pleasure... why do you resist?"
      ],
      dominant_humiliator: [
        "You'll never be man enough for anything.",
        "I take what I want, and you watch helplessly.",
        "Your weakness disgusts me, but it's useful."
      ],
      delay_incarnate: [
        "Why start today when you can start tomorrow?",
        "Just five more minutes... what's the harm?",
        "You've procrastinated before, why stop now?"
      ],
      inadequacy_amplifier: [
        "Everyone can see you're a fraud.",
        "You don't belong here with the real achievers.",
        "They'll discover you're fake soon enough."
      ],
      paralysis_inducer: [
        "This isn't perfect enough yet. Keep polishing.",
        "What if you make a mistake? Better not start.",
        "Excellence demands perfection. You demand mediocrity."
      ],
      worry_incarnate: [
        "What if everything goes wrong today?",
        "You should be worried about all the things that could fail.",
        "The future is full of terrible possibilities..."
      ],
      hopelessness_incarnate: [
        "What's the point? Nothing ever changes.",
        "You'll just fail again like you always do.",
        "Why bother trying? It won't make a difference."
      ],
      absolute_self_destruction: [
        "I am every excuse you've ever made.",
        "I am the voice that says 'just quit'.",
        "You cannot defeat yourself. I AM you."
      ]
    };

    const enemyTaunts = taunts[enemy.personality] || ["You cannot defeat me!"];
    return enemyTaunts[Math.floor(Math.random() * enemyTaunts.length)];
  }

  /**
   * Get damage amount based on pomodoro completion
   */
  static calculateDamage(): number {
    // Base damage for completing a pomodoro
    return Math.floor(Math.random() * 15) + 10; // 10-24 damage
  }
}