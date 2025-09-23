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

      // More aggressive: generate if no cache OR expired OR less than 5 taunts OR random 10% chance
      if (!cachedTaunts || isExpired || cachedTaunts.preBattle.length < 5 || Math.random() < 0.1) {
        needsUpdate.push(enemy);
      }
    }

    // Generate taunts for enemies that need updates (batch to save API calls)
    if (needsUpdate.length > 0) {
      console.log(`🔥 Generating taunts for ${needsUpdate.length} enemies...`);
      await this.batchGenerateTaunts(needsUpdate, cache);
    }
  }

  /**
   * Generate multiple taunts for enemies in batch
   */
  private static async batchGenerateTaunts(enemies: Enemy[], existingCache: EnemyTauntCache): Promise<void> {
    for (const enemy of enemies) {
      const newTaunts: CachedTaunts = {
        preBattle: this.generateMultipleTaunts(enemy, 'preBattle', 8),
        duringBattle: this.generateMultipleTaunts(enemy, 'duringBattle', 5),
        victory: this.generateMultipleTaunts(enemy, 'victory', 6),
        defeat: this.generateMultipleTaunts(enemy, 'defeat', 6),
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
      },
      fake_loyalty_draggers: {
        preBattle: [
          "Oh sweetie, we just want what's best for you...",
          "You know we only say this because we care, right?",
          "We're just trying to help, but you never listen...",
          "After everything we've done for you, this is how you repay us?",
          "We're so worried about your future choices..."
        ],
        victory: [
          "Well... maybe you actually do know what's best...",
          "Perhaps we were... overprotective?",
          "You've really grown, haven't you?",
          "We're... we're actually proud of you...",
          "Maybe you didn't need our help after all..."
        ],
        defeat: [
          "See? We told you this would happen!",
          "If only you had listened to us from the start...",
          "We tried to warn you, but you were too stubborn!",
          "This is exactly why you need our guidance!",
          "Now do you see why we worry so much?"
        ]
      },
      sarcastic_ice_queens: {
        preBattle: [
          "Oh wow, how... ambitious of you.",
          "This should be entertaining. For me.",
          "Let me guess, you think you're special?",
          "How refreshingly naive.",
          "I suppose someone has to teach you reality."
        ],
        victory: [
          "Well. That's... unexpected.",
          "I may have slightly underestimated you.",
          "Color me... impressed. Slightly.",
          "Perhaps you're not completely hopeless.",
          "Fine. You've earned a modicum of respect."
        ],
        defeat: [
          "Predictable. As always.",
          "Did you really think that would work?",
          "How delightfully ordinary.",
          "Some people never learn, do they?",
          "I'd say I'm surprised, but that would be lying."
        ]
      },
      chaotic_pranksters: {
        preBattle: [
          "HEHEHE! Time for some FUN!",
          "Ooh, ooh! Can we mess with their head first?",
          "This is gonna be HILARIOUS!",
          "Wait till you see what we've got planned!",
          "Ready for the ultimate prank? It's called FAILURE!"
        ],
        victory: [
          "Wait... that wasn't supposed to happen!",
          "Hey! You ruined our prank!",
          "That's... that's actually pretty cool!",
          "Okay fine, you got us good this time!",
          "Hehe... respect. That was epic!"
        ],
        defeat: [
          "HAHAHA! Classic! You fell for it!",
          "Did you see their face? PRICELESS!",
          "Another victim of the ultimate prank!",
          "GOTCHA! You totally bought it!",
          "This is why we LOVE pranking people!"
        ]
      },
      arrogant_incompetents: {
        preBattle: [
          "Please, this is beneath my vast intellect.",
          "I have multiple degrees, you know.",
          "Allow me to demonstrate true superiority.",
          "You clearly don't understand who you're dealing with.",
          "This will be embarrassingly easy for someone of my caliber."
        ],
        victory: [
          "This... this can't be right!",
          "You must have cheated somehow!",
          "My credentials clearly state I should have won!",
          "There's obviously been some mistake here!",
          "This doesn't align with my theoretical models!"
        ],
        defeat: [
          "As expected from someone of my intellectual prowess!",
          "See? Education always wins!",
          "This is what happens when you face true genius!",
          "Perhaps now you'll respect proper qualifications!",
          "I could have told you this outcome from the start!"
        ]
      },
      academic_destroyer: {
        preBattle: [
          "Your GPA was always pathetic anyway.",
          "Remember when you failed that important exam?",
          "You never belonged in advanced classes.",
          "Even the easy courses were too hard for you.",
          "Your study habits are absolutely embarrassing."
        ],
        victory: [
          "How did someone who failed chemistry beat me?",
          "This is worse than when you somehow passed calculus!",
          "Maybe... maybe you actually learned something?",
          "Your study methods must have finally improved...",
          "I guess even you can surprise people sometimes..."
        ],
        defeat: [
          "Just like your transcripts - full of failures!",
          "Another F to add to your collection!",
          "You're still the same academic disappointment!",
          "Some people never improve their study skills!",
          "Back to summer school where you belong!"
        ]
      },
      physical_intimidator: {
        preBattle: [
          "You look even weaker than I remembered.",
          "One look at me and you used to run away.",
          "Still that same scared little weakling?",
          "Time to remind you who's stronger here.",
          "Your body language screams 'victim'."
        ],
        victory: [
          "What?! How did you get so strong?",
          "This... this isn't possible!",
          "You're not supposed to be able to fight back!",
          "When did you stop being afraid?",
          "You've... actually become formidable..."
        ],
        defeat: [
          "Still weak as ever, I see!",
          "Some things never change - you're still a pushover!",
          "Did you really think you could take me on?",
          "Back to being the scared little victim!",
          "This is why strength matters most!"
        ]
      },
      wealth_flaunter: {
        preBattle: [
          "My watch costs more than your car.",
          "Daddy bought me the best trainers money can buy.",
          "You could never afford what I have.",
          "Poor people like you just don't understand quality.",
          "Money can't buy happiness? Well, poverty can't either!"
        ],
        victory: [
          "My trust fund should have guaranteed victory!",
          "How did someone so... financially limited... beat me?",
          "Money can't buy everything, I guess?",
          "Perhaps wealth isn't the only measure of worth...",
          "You've taught me something money couldn't..."
        ],
        defeat: [
          "See? Money DOES buy everything!",
          "This is what happens when you're financially inferior!",
          "Daddy's investments paid off again!",
          "Poor people never win in the end!",
          "Your bank account speaks for itself!"
        ]
      },
      delay_incarnate: {
        preBattle: [
          "Maybe we should do this later...",
          "There's always tomorrow, right?",
          "Why rush? We have all the time in the world...",
          "I'll get around to defeating you eventually...",
          "Let's just... put this off for now..."
        ],
        victory: [
          "Wait... I was supposed to procrastinate more!",
          "How did you finish before I even started?",
          "I should have delayed this battle longer...",
          "You actually... followed through?",
          "I underestimated the power of actually doing things..."
        ],
        defeat: [
          "See? Putting things off always works out!",
          "Why hurry when you can wait and still win?",
          "Time heals all wounds... and defeats all enemies!",
          "I told you there was no rush!",
          "Procrastination is the ultimate strategy!"
        ]
      },
      inadequacy_amplifier: {
        preBattle: [
          "You're just not good enough, are you?",
          "Everyone else seems to have it figured out...",
          "Why do you even bother trying anymore?",
          "You'll never measure up to their standards.",
          "Face it - you're fundamentally flawed."
        ],
        victory: [
          "But... but you're supposed to be inadequate!",
          "This doesn't fit the narrative I created!",
          "How did someone so flawed succeed?",
          "Maybe... maybe you were enough all along?",
          "I may have been wrong about your worth..."
        ],
        defeat: [
          "See? Just as inadequate as I said!",
          "You'll never be good enough for anything!",
          "This proves how fundamentally lacking you are!",
          "Why do you keep trying when you always fail?",
          "Inadequacy wins again!"
        ]
      },
      worry_incarnate: {
        preBattle: [
          "What if everything goes wrong?",
          "Have you considered all the terrible possibilities?",
          "This could end very badly for you...",
          "I can see at least seventeen ways this fails...",
          "Are you sure about this? Really sure?"
        ],
        victory: [
          "Wait... it actually worked out?",
          "But I calculated so many failure scenarios!",
          "How did none of my worries come true?",
          "Maybe... maybe things can go right sometimes?",
          "I may have been overthinking this..."
        ],
        defeat: [
          "See? I TOLD you something would go wrong!",
          "This is exactly what I was worried about!",
          "My anxieties were completely justified!",
          "Why don't people listen when I warn them?",
          "Worry always knows what's coming!"
        ]
      },
      hopelessness_incarnate: {
        preBattle: [
          "What's the point of even trying?",
          "Nothing you do will ever matter.",
          "Give up now and save yourself the pain.",
          "Hope is just delayed disappointment.",
          "Everything ends in failure anyway."
        ],
        victory: [
          "But... but nothing was supposed to matter!",
          "How did hope actually... work?",
          "This changes... everything I believed...",
          "Maybe there is a point after all?",
          "You've shown me something I thought impossible..."
        ],
        defeat: [
          "See? Hopelessness always wins in the end!",
          "I told you nothing would work out!",
          "This is why hope is so dangerous!",
          "Welcome to the reality of meaninglessness!",
          "Another soul joins the hopeless void!"
        ]
      },
      paralysis_inducer: {
        preBattle: [
          "Too many choices... can't decide what to do...",
          "What if you make the wrong move?",
          "Better to do nothing than risk a mistake...",
          "Analysis paralysis is so comforting, isn't it?",
          "Just stand there. It's safer than action."
        ],
        victory: [
          "You... you actually made a decision?",
          "But paralysis is supposed to be permanent!",
          "How did you break free from indecision?",
          "Action over analysis? Impossible!",
          "You've overcome what I thought unconquerable..."
        ],
        defeat: [
          "See? Indecision keeps you safe!",
          "This is what happens when you try to act!",
          "Paralysis protects you from failure!",
          "Standing still is always the right choice!",
          "Another victim of premature action!"
        ]
      },
      silent_judges: {
        preBattle: [
          "...",
          "*disapproving stare*",
          "*judgmental silence*",
          "*knows exactly what you did wrong*",
          "*disappointed but not surprised*"
        ],
        victory: [
          "*shocked silence*",
          "...unexpected.",
          "*grudging nod of approval*",
          "*surprised but impressed*",
          "...well done."
        ],
        defeat: [
          "*knowing nod*",
          "*expected as much*",
          "*silent satisfaction*",
          "*told you so without words*",
          "..."
        ]
      },
      absolute_self_destruction: {
        preBattle: [
          "I AM THE END OF ALL THINGS!",
          "WATCH AS I DESTROY MYSELF TO DESTROY YOU!",
          "MUTUAL ANNIHILATION IS THE ONLY TRUTH!",
          "IF I CANNOT WIN, THEN NOTHING SHALL EXIST!",
          "BEHOLD THE BEAUTY OF ULTIMATE DESTRUCTION!"
        ],
        victory: [
          "IMPOSSIBLE! DESTRUCTION CANNOT BE DEFEATED!",
          "HOW DO YOU SURVIVE WHAT DESTROYS EVERYTHING?!",
          "MY APOCALYPSE... FAILED?",
          "You've found something beyond destruction...",
          "Creation... stronger than annihilation...?"
        ],
        defeat: [
          "YES! BEAUTIFUL DESTRUCTION! WE ALL FALL!",
          "SEE HOW EVERYTHING CRUMBLES IN THE END!",
          "MUTUAL DESTRUCTION IS THE ULTIMATE VICTORY!",
          "THIS IS HOW ALL THINGS MUST END!",
          "EMBRACE THE VOID! EMBRACE THE END!"
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