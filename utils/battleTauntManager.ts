import AsyncStorage from '@react-native-async-storage/async-storage';
import { Enemy } from '@/constants/enemies';
import { HeroData } from '@/constants/gameSystem';

interface CachedTaunts {
  preBattle: string[];
  duringBattle: string[];
  victory: string[];
  defeat: string[];
  lastUpdated: string;
  dataHash: string;
}

interface EnemyTauntCache {
  [enemyId: string]: CachedTaunts;
}

export class BattleTauntManager {
  private static readonly CACHE_KEY = 'enemy_taunt_cache';
  private static readonly CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Get a random pre-battle taunt for an enemy
   */
  static async getPreBattleTaunt(enemy: Enemy): Promise<string> {
    const cache = await this.loadTauntCache();
    const cachedTaunts = cache[enemy.id];

    if (cachedTaunts && cachedTaunts.preBattle.length > 0) {
      return this.getRandomTaunt(cachedTaunts.preBattle);
    }

    // Return fallback taunt if no cache
    return this.getPersonalityBasedPreBattleTaunt(enemy);
  }

  /**
   * Get a random victory taunt (enemy defeated)
   */
  static async getVictoryTaunt(enemy: Enemy): Promise<string> {
    const cache = await this.loadTauntCache();
    const cachedTaunts = cache[enemy.id];

    if (cachedTaunts && cachedTaunts.victory.length > 0) {
      return this.getRandomTaunt(cachedTaunts.victory);
    }

    return this.getPersonalityBasedVictoryTaunt(enemy);
  }

  /**
   * Get a random defeat taunt (player defeated)
   */
  static async getDefeatTaunt(enemy: Enemy): Promise<string> {
    const cache = await this.loadTauntCache();
    const cachedTaunts = cache[enemy.id];

    if (cachedTaunts && cachedTaunts.defeat.length > 0) {
      return this.getRandomTaunt(cachedTaunts.defeat);
    }

    return this.getPersonalityBasedDefeatTaunt(enemy);
  }

  /**
   * Pre-generate taunts for current unlocked enemies (call this on app start)
   */
  static async preGenerateTaunts(availableEnemies: Enemy[]): Promise<void> {
    const cache = await this.loadTauntCache();
    const needsUpdate: Enemy[] = [];

    for (const enemy of availableEnemies) {
      const cachedTaunts = cache[enemy.id];
      const isExpired = cachedTaunts &&
        Date.now() - new Date(cachedTaunts.lastUpdated).getTime() > this.CACHE_DURATION;

      if (!cachedTaunts || isExpired || cachedTaunts.preBattle.length < 3) {
        needsUpdate.push(enemy);
      }
    }

    // Generate taunts for enemies that need updates (batch to save API calls)
    if (needsUpdate.length > 0) {
      console.log(`Generating taunts for ${needsUpdate.length} enemies...`);
      await this.batchGenerateTaunts(needsUpdate, cache);
    }
  }

  /**
   * Generate multiple taunts for enemies in batch
   */
  private static async batchGenerateTaunts(enemies: Enemy[], existingCache: EnemyTauntCache): Promise<void> {
    for (const enemy of enemies) {
      const newTaunts: CachedTaunts = {
        preBattle: this.generateMultipleTaunts(enemy, 'preBattle', 5),
        duringBattle: this.generateMultipleTaunts(enemy, 'duringBattle', 3),
        victory: this.generateMultipleTaunts(enemy, 'victory', 4),
        defeat: this.generateMultipleTaunts(enemy, 'defeat', 4),
        lastUpdated: new Date().toISOString(),
        dataHash: 'generated'
      };

      existingCache[enemy.id] = newTaunts;
    }

    await this.saveTauntCache(existingCache);
  }

  /**
   * Generate multiple taunts based on enemy personality
   */
  private static generateMultipleTaunts(enemy: Enemy, type: string, count: number): string[] {
    const baseTaunts = this.getPersonalityTaunts(enemy.personality, type);
    const result: string[] = [];

    // Generate variations
    for (let i = 0; i < count; i++) {
      const baseTaunt = baseTaunts[i % baseTaunts.length];
      result.push(this.addPersonalityFlair(baseTaunt, enemy.personality, i));
    }

    return result;
  }

  /**
   * Get personality-based taunts for different situations
   */
  private static getPersonalityTaunts(personality: string, type: string): string[] {
    const taunts: { [key: string]: { [key: string]: string[] } } = {
      immature_mockers: {
        preBattle: [
          "Hah! Remember when you couldn't even answer basic questions in class?",
          "You were always the one copying homework, weren't you?",
          "Still using a timer? What are you, in elementary school?",
          "Bet you still get nervous before presentations!",
          "Your teachers always said you'd never amount to anything!",
          "Remember when you got detention for being late? Classic!",
          "You're still that kid who forgot to bring their lunch money!"
        ],
        victory: [
          "Wait... did the class dummy actually beat us?",
          "No way! You must have cheated on this too!",
          "How did the kid who failed math get stronger than us?",
          "This is worse than when you accidentally got an A!",
          "Maybe... maybe you weren't as stupid as we thought..."
        ],
        defeat: [
          "HAHA! Just like your report card - straight failures!",
          "You couldn't even pass this! Some things never change!",
          "Still failing after all these years!",
          "We're telling everyone you flunked again!",
          "Back to the bottom of the class where you belong!"
        ]
      },
      judgmental_whispers: {
        preBattle: [
          "*whispers* Did you hear about their latest failure?",
          "Such a disappointment... we expected better.",
          "Your parents are so embarrassed by you.",
          "Everyone's talking about your mistakes...",
          "We're so concerned about your poor choices."
        ],
        victory: [
          "*shocked whispers* How did they...?",
          "Perhaps... perhaps we misjudged...",
          "Well... that was unexpected...",
          "Maybe there's hope for them after all...",
          "*reluctant approval* Impressive... we suppose..."
        ],
        defeat: [
          "*knowing whispers* We told you so...",
          "Just as we predicted... failure.",
          "Some people never learn, do they?",
          "We're so disappointed... but not surprised.",
          "Your poor family... they must be so ashamed."
        ]
      },
      crude_brutality: {
        preBattle: [
          "WEAK! PATHETIC! CRUSH YOU!",
          "You think this makes you strong? LAUGHABLE!",
          "We break weaklings like you for fun!",
          "PUNY HUMAN! NO MATCH FOR US!",
          "TIMER NOT MAKE YOU WARRIOR!"
        ],
        victory: [
          "IMPOSSIBLE! HUMAN TOO WEAK!",
          "HOW?! WE STRONGEST! WE...",
          "No... human... actually strong...?",
          "We... we underestimated... small human...",
          "Human warrior... worthy opponent..."
        ],
        defeat: [
          "CRUSH PUNY HUMAN! EASY!",
          "TOLD YOU! WEAK AS ALWAYS!",
          "HUMAN NEVER STRONG ENOUGH!",
          "WE FEAST ON YOUR WEAKNESS!",
          "PATHETIC! AS EXPECTED!"
        ]
      },
      sadistic_chaos_incarnate: {
        preBattle: [
          "AHAHAHAHA! Your suffering amuses me greatly!",
          "Let's see how long before you break completely!",
          "Chaos is coming! And it's going to be BEAUTIFUL!",
          "Your orderly little life is about to CRUMBLE!",
          "I'll turn your hopes into delicious despair!"
        ],
        victory: [
          "What... WHAT?! This isn't how chaos works!",
          "Impossible! Order cannot defeat chaos!",
          "You... you actually brought order to chaos?",
          "This... this isn't funny anymore...",
          "How did you... but chaos always wins..."
        ],
        defeat: [
          "AHAHAHAHA! BEAUTIFUL! MAGNIFICENT FAILURE!",
          "Did you see the hope in their eyes die? EXQUISITE!",
          "Chaos reigns supreme! Order is an ILLUSION!",
          "Your despair feeds my soul! MORE!",
          "This is why I LOVE watching you fail!"
        ]
      }
    };

    const personalityTaunts = taunts[personality];
    if (!personalityTaunts || !personalityTaunts[type]) {
      return ["Your time has come.", "Face your fears.", "This ends now."];
    }

    return personalityTaunts[type];
  }

  /**
   * Add personality flair to make taunts unique
   */
  private static addPersonalityFlair(baseTaunt: string, personality: string, variation: number): string {
    const flairs: { [key: string]: string[] } = {
      immature_mockers: ["", " Loser!", " Like always!", " Hehe!", " *snicker*"],
      judgmental_whispers: ["", " *tsk tsk*", " Dear...", " *sigh*", " Poor thing..."],
      crude_brutality: ["", " GRAAAH!", " WEAK!", " SMASH!", " DESTROY!"],
      sadistic_chaos_incarnate: ["", " *maniacal laughter*", " AHAHA!", " Delicious!", " *evil grin*"]
    };

    const personalityFlairs = flairs[personality] || [""];
    const flair = personalityFlairs[variation % personalityFlairs.length];

    return baseTaunt + flair;
  }

  /**
   * Get fallback pre-battle taunts
   */
  private static getPersonalityBasedPreBattleTaunt(enemy: Enemy): string {
    const taunts = this.getPersonalityTaunts(enemy.personality, 'preBattle');
    return this.getRandomTaunt(taunts);
  }

  private static getPersonalityBasedVictoryTaunt(enemy: Enemy): string {
    const taunts = this.getPersonalityTaunts(enemy.personality, 'victory');
    return this.getRandomTaunt(taunts);
  }

  private static getPersonalityBasedDefeatTaunt(enemy: Enemy): string {
    const taunts = this.getPersonalityTaunts(enemy.personality, 'defeat');
    return this.getRandomTaunt(taunts);
  }

  /**
   * Utility functions
   */
  private static getRandomTaunt(taunts: string[]): string {
    return taunts[Math.floor(Math.random() * taunts.length)];
  }

  private static async loadTauntCache(): Promise<EnemyTauntCache> {
    try {
      const stored = await AsyncStorage.getItem(this.CACHE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading taunt cache:', error);
      return {};
    }
  }

  private static async saveTauntCache(cache: EnemyTauntCache): Promise<void> {
    try {
      await AsyncStorage.setItem(this.CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.error('Error saving taunt cache:', error);
    }
  }
}