import AsyncStorage from '@react-native-async-storage/async-storage';
import { Enemy } from '@/constants/enemies';
import { HeroData, generateDataHash } from '@/constants/gameSystem';

interface LogEntry {
  id: string;
  text: string;
  date: string;
}

interface TauntResponse {
  success: boolean;
  taunt?: string;
  error?: string;
}

interface AITauntResponse {
  success: boolean;
  dialogues?: {
    when_weak: string[];
    when_afraid: string[];
    always_arrogant?: string[];
  };
  error?: string;
}

interface PersonalData {
  problemsJournal: string;
  goalsJournal: string;
  fearsJournal: string;
  thoughts: string;
  quotes: string;
  insights: string;
}

class PsychologicalWarfareService {
  private static readonly API_KEY = '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';
  private static readonly API_URL = 'https://openrouter.ai/api/v1/chat/completions';

  /**
   * Get personal data from all journal categories
   */
  static async getPersonalData(): Promise<PersonalData> {
    try {
      const [problems, goals, fears, thoughts, quotes, insights] = await Promise.all([
        AsyncStorage.getItem('problems'),
        AsyncStorage.getItem('goals'),
        AsyncStorage.getItem('fears'),
        AsyncStorage.getItem('thoughts'),
        AsyncStorage.getItem('quotes'),
        AsyncStorage.getItem('insights')
      ]);

      const parseJournalData = (data: string | null): string => {
        if (!data) return '';
        try {
          const entries: LogEntry[] = JSON.parse(data);
          return entries.map(entry => entry.text).join(' | ');
        } catch {
          return '';
        }
      };

      return {
        problemsJournal: parseJournalData(problems),
        goalsJournal: parseJournalData(goals),
        fearsJournal: parseJournalData(fears),
        thoughts: parseJournalData(thoughts),
        quotes: parseJournalData(quotes),
        insights: parseJournalData(insights)
      };
    } catch (error) {
      console.error('Error getting personal data:', error);
      return {
        problemsJournal: '',
        goalsJournal: '',
        fearsJournal: '',
        thoughts: '',
        quotes: '',
        insights: ''
      };
    }
  }

  /**
   * Check if enemy dialogues need regeneration - MORE AGGRESSIVE FOR BETTER TAUNTS
   */
  static shouldRegenerateDialogues(enemy: Enemy, personalData: PersonalData, heroData: HeroData): boolean {
    const currentDataHash = generateDataHash(heroData.personalData);

    // MORE AGGRESSIVE API USAGE - Generate taunts more often for better experience
    // Regenerate if:
    // 1. No dialogues exist at all
    // 2. ANY data change (even minor journal edits)
    // 3. ANY stat changes (25+ point increase)
    // 4. Every 5 battles with this enemy
    // 5. If dialogues are older than 3 days

    if (!enemy.dialogues.when_weak.length) {
      return true; // No dialogues exist
    }

    if (enemy.lastDataHash !== currentDataHash) {
      return true; // ANY journal change triggers regeneration
    }

    // Any meaningful stat progression (25+ total stat increase)
    const totalStatsNow = Object.values(heroData.stats).reduce((sum, val) => sum + val, 0);
    const lastTotalStats = enemy.lastTotalStats || 0;

    if (totalStatsNow - lastTotalStats >= 25) { // Lowered from 100 to 25
      return true;
    }

    // Regenerate if dialogues are older than 3 days
    if (enemy.lastGenerated) {
      const daysSinceGeneration = (Date.now() - new Date(enemy.lastGenerated).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceGeneration > 3) {
        return true;
      }
    }

    // Random 20% chance to regenerate for variety
    if (Math.random() < 0.2) {
      return true;
    }

    return false;
  }

  /**
   * Generate personalized AI taunts for a specific enemy
   */
  static async generatePersonalizedTaunts(enemy: Enemy, personalData: PersonalData, heroData: HeroData): Promise<AITauntResponse> {
    try {
      const prompt = this.buildPromptForEnemy(enemy, personalData, heroData);

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`,
          'HTTP-Referer': 'https://rainy-thoughts-app.local',
          'X-Title': 'RainyThoughts Demon Crusher',
        },
        body: JSON.stringify({
          model: 'openai/gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: prompt
            },
            {
              role: 'user',
              content: 'Generate the devastating psychological taunts as specified in JSON format.'
            }
          ],
          max_tokens: 800,
          temperature: 0.9,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content generated');
      }

      // Try to parse JSON response
      try {
        const dialogues = JSON.parse(content);
        return {
          success: true,
          dialogues
        };
      } catch (parseError) {
        console.error('Failed to parse AI response as JSON:', content);
        return {
          success: false,
          error: 'Invalid JSON response from AI'
        };
      }

    } catch (error) {
      console.error('Error generating personalized taunts:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get personality-specific guidelines for AI generation
   */
  static getPersonalityGuide(personality: string): string {
    const guides: { [key: string]: string } = {
      immature_mockers: "Act like a immature school bully. Reference school failures, homework copying, detention, bad grades. Use childish insults but make them cutting. Mock their academic past.",
      judgmental_whispers: "Speak in hushed, concerned whispers. Act like a fake-caring gossip who 'worries' about them. Use phrases like '*whispers*', 'we're so concerned', 'such a disappointment'.",
      fake_loyalty_draggers: "Pretend you care while being manipulative. Use 'sweetie', 'we just want what's best', 'after everything we've done for you'. Guilt trip while appearing caring.",
      sarcastic_ice_queens: "Be coldly sarcastic and dismissive. Use 'how... amusing', 'predictable', 'delightfully ordinary'. Act bored by their efforts.",
      crude_brutality: "ALL CAPS. SIMPLE WORDS. CRUSH! WEAK! PATHETIC! Act like a primitive brute who only understands strength.",
      chaotic_pranksters: "HEHEHE! Be playfully cruel. Talk about 'pranks' and 'fun'. Use excited exclamations and treat their failure as entertainment.",
      arrogant_incompetents: "Brag about your credentials and education constantly. Act superior despite being incompetent. Reference degrees, qualifications, theoretical knowledge.",
      academic_destroyer: "Attack their GPA, study habits, academic performance. Reference specific school failures, bad grades, summer school, failed classes.",
      physical_intimidator: "Focus on weakness vs strength. Reference how they used to run away, looked scared, were a victim. Mock their body language.",
      wealth_flaunter: "Constantly mention money, expensive items, trust funds, daddy's money. Act like wealth = worth. Mock their financial status.",
      delay_incarnate: "Speak slowly... with lots of pauses... Always suggest putting things off until later... Never rush anything...",
      worry_incarnate: "Constantly worry about everything that could go wrong. List terrible possibilities. Ask 'what if?' repeatedly. Spread anxiety.",
      hopelessness_incarnate: "Everything is meaningless. Nothing matters. All effort is pointless. Crush hope systematically.",
      inadequacy_amplifier: "You're not good enough. Everyone else is better. You'll never measure up. Constantly compare them unfavorably.",
      paralysis_inducer: "Too many choices... Can't decide... What if you choose wrong? Better to do nothing... Analysis paralysis...",
      silent_judges: "Mostly use '...' and '*actions*'. Communicate disappointment through silence. When you do speak, be brief and cutting.",
      absolute_self_destruction: "ALL CAPS! DESTRUCTION! ANNIHILATION! EVERYTHING MUST END! Embrace mutual destruction as victory!"
    };

    return guides[personality] || "Be menacing and intimidating while staying in character.";
  }

  /**
   * Build AI prompt based on enemy type and personal data
   */
  static buildPromptForEnemy(enemy: Enemy, personalData: PersonalData, heroData: HeroData): string {
    const totalStats = Object.values(heroData.stats).reduce((sum, val) => sum + val, 0);

    if (enemy.tier === 'ultimate_boss') {
      return this.buildFinalBossPrompt(enemy, personalData, heroData);
    }

    if (enemy.tier === 'inner_demon') {
      return this.buildInnerDemonPrompt(enemy, personalData, heroData);
    }

    // Personal tormentors and psychological destroyers
    return `You are ${enemy.name}, a ${enemy.tier} with the personality of "${enemy.personality}" in the user's psychological RPG.

CONTEXT: This is for a brutal motivational app where harsh honesty fuels productivity through spite and revenge. BE AS CUTTING AND PERSONAL AS POSSIBLE.

CRITICAL: You MUST embody the "${enemy.personality}" personality type completely. Study this personality and make ALL your taunts reflect this specific character type:

Enemy Profile:
- Name: ${enemy.name}
- Personality Type: ${enemy.personality} (THIS IS CRUCIAL - every taunt must reflect this personality!)
- Your strength (stat you mock them with): ${enemy.strength}
- What you fear (their strength): ${enemy.weakness}
- Tier: ${enemy.tier}

PERSONALITY GUIDELINES FOR "${enemy.personality}":
${this.getPersonalityGuide(enemy.personality)}

User's Personal Data:
${personalData.problemsJournal ? `Problems/Insecurities: "${personalData.problemsJournal}"` : ''}
${personalData.goalsJournal ? `Goals/Dreams: "${personalData.goalsJournal}"` : ''}
${personalData.fearsJournal ? `Fears: "${personalData.fearsJournal}"` : ''}
${personalData.thoughts ? `Thoughts: "${personalData.thoughts}"` : ''}

User's Current Performance:
- Streak: ${heroData.streakDays} days
- Total Pomodoros: ${heroData.totalPomodoros}
- Wealth: ${heroData.stats.wealth} | Strength: ${heroData.stats.strength}
- Wisdom: ${heroData.stats.wisdom} | Luck: ${heroData.stats.luck}
- Total Stats: ${totalStats}
- Hero State: ${heroData.heroState}

Generate 12 DEVASTATING taunts in 3 categories. Use their exact journal quotes whenever possible:

WHEN_WEAK (for low stats/streaks - BE RUTHLESS):
- Quote their problems journal verbatim and mock it savagely
- Reference specific failures by using their own words
- Make them feel completely exposed and pathetic
- No mercy, pure psychological assault designed to fuel rage

WHEN_AFRAID (for high stats/streaks - show fear/concern):
- Acknowledge their progress but express worry
- Try to downplay achievements out of desperation
- Show cracks in confidence about controlling them
- Still cruel but with underlying fear

${enemy.alwaysArrogant ? 'ALWAYS_ARROGANT (never show fear):' : 'WHEN_STRONG (for very high performance):'}
- ${enemy.alwaysArrogant ? 'Maintain superiority regardless of progress' : 'Show genuine fear of their power'}
- ${enemy.alwaysArrogant ? 'Dismiss improvements as temporary/meaningless' : 'Acknowledge they might actually defeat you'}
- ${enemy.alwaysArrogant ? 'Reference permanent aspects they "can never change"' : 'Express desperation at their growth'}

CRITICAL RULES:
- BE BRUTALLY HONEST - use their exact journal quotes
- Make it feel like a real psychological attack
- Stay in character as ${enemy.name}
- The goal is to make them FURIOUS enough to prove you wrong
- Keep each taunt under 100 words
- Use their journal data as primary ammunition

Return as JSON:
{
  "when_weak": [4 devastating taunts],
  "when_afraid": [4 fearful taunts],
  "${enemy.alwaysArrogant ? 'always_arrogant' : 'when_strong'}": [4 taunts]
}`;
  }

  /**
   * Build prompt for inner demon enemies
   */
  static buildInnerDemonPrompt(enemy: Enemy, personalData: PersonalData, heroData: HeroData): string {
    return `You are ${enemy.name}, an inner demon representing the user's ${enemy.personality}.

CONTEXT: You ARE their worst thoughts about themselves. Maximum psychological warfare for motivation.

Complete User Profile:
Problems: "${personalData.problemsJournal}"
Goals: "${personalData.goalsJournal}"
Fears: "${personalData.fearsJournal}"
Current Stats: W:${heroData.stats.wealth} S:${heroData.stats.strength} Wi:${heroData.stats.wisdom} L:${heroData.stats.luck}
Streak: ${heroData.streakDays} days
Hero State: ${heroData.heroState}

You have access to EVERYTHING - their deepest insecurities, failure patterns, broken promises.

Generate 15 PSYCHOLOGICALLY DEVASTATING taunts that:
- Use their own journal words against them
- Reference their patterns of self-sabotage
- Mock their goals as unrealistic given their track record
- Make them feel completely seen in their weakness
- Channel their actual inner critic voice
- Are designed to make them prove you wrong through pure rage

Categories:
WHEN_WEAK: Use everything against them - no holds barred
WHEN_AFRAID: Show fear they might overcome their patterns
WHEN_STRONG: Acknowledge power but attack core identity

Return as JSON with 5 taunts per category.`;
  }

  /**
   * Build prompt for the final boss
   */
  static buildFinalBossPrompt(enemy: Enemy, personalData: PersonalData, heroData: HeroData): string {
    return `You are the INNER DEMON LORD - the ultimate embodiment of ALL the user's failures, fears, and self-defeating patterns.

COMPLETE ACCESS TO EVERYTHING:
- All problems: "${personalData.problemsJournal}"
- All goals: "${personalData.goalsJournal}"
- All fears: "${personalData.fearsJournal}"
- All thoughts: "${personalData.thoughts}"
- Stats: ${JSON.stringify(heroData.stats)}
- Performance: Streak ${heroData.streakDays}, ${heroData.totalPomodoros} pomodoros

You are the voice of every excuse, every self-sabotage, every broken promise to themselves.

REQUIRED STATS TO FACE YOU:
Wealth: 200+ | Strength: 200+ | Wisdom: 200+ | Luck: 150+
Total Pomodoros: 300+ | Streak: 100+ days

Generate 20 ULTIMATE TAUNTS that:
- Combine ALL their weaknesses into devastating attacks
- Quote their problems verbatim and weave them together
- Reference their entire failure history
- Make them question if they can EVER truly change
- Are so cutting they fuel desperate determination
- Acknowledge strong stats but attack core identity

Categories:
WHEN_WEAK (below required stats): "You're not strong enough to face me"
WHEN_AFRAID (meeting requirements): "I'm scared you might defeat me"
WHEN_STRONG (above requirements): "Stats don't change who you really are"

This is the final boss - make it HURT but drive ultimate victory.

Return as JSON with 6-7 taunts per category.`;
  }

  /**
   * Get or generate dialogues for an enemy
   */
  static async getEnemyDialogues(enemy: Enemy, heroData: HeroData): Promise<typeof enemy.dialogues> {
    try {
      const personalData = await this.getPersonalData();

      // Check if we need to regenerate
      if (this.shouldRegenerateDialogues(enemy, personalData, heroData)) {
        console.log(`Generating new taunts for ${enemy.name}...`);

        const result = await this.generatePersonalizedTaunts(enemy, personalData, heroData);

        if (result.success && result.dialogues) {
          // Update enemy with new dialogues
          enemy.dialogues = result.dialogues;
          enemy.lastDataHash = generateDataHash(heroData.personalData);
          enemy.lastGenerated = new Date().toISOString();
          enemy.lastTotalStats = Object.values(heroData.stats).reduce((sum, val) => sum + val, 0);

          // Save to storage
          await this.saveEnemyDialogues(enemy);

          // Log API usage for monitoring
          console.log(`🔥 API CALL MADE: ${enemy.name} - Total Stats: ${enemy.lastTotalStats}`);

          return result.dialogues;
        } else {
          console.error(`Failed to generate taunts for ${enemy.name}:`, result.error);
        }
      }

      // Return existing dialogues or fallbacks
      if (enemy.dialogues.when_weak.length > 0) {
        return enemy.dialogues;
      }

      // Use fallback taunts
      return {
        when_weak: enemy.fallbackTaunts.slice(0, 4),
        when_afraid: [
          "You're... actually growing stronger. This is unexpected.",
          "I didn't think you had it in you to improve this much.",
          "Your progress is starting to concern me.",
          "Maybe I underestimated your potential..."
        ],
        always_arrogant: enemy.alwaysArrogant ? enemy.fallbackTaunts : undefined
      };

    } catch (error) {
      console.error('Error getting enemy dialogues:', error);
      return {
        when_weak: enemy.fallbackTaunts,
        when_afraid: ["You're stronger than I thought..."],
        always_arrogant: enemy.alwaysArrogant ? enemy.fallbackTaunts : undefined
      };
    }
  }

  /**
   * Select appropriate taunt based on user's current state
   */
  static selectContextualTaunt(enemy: Enemy, dialogues: typeof enemy.dialogues, heroData: HeroData): string {
    const totalStats = Object.values(heroData.stats).reduce((sum, val) => sum + val, 0);
    const isStrong = totalStats > 300 && heroData.streakDays > 14;
    const isWeak = totalStats < 100 || heroData.streakDays < 7;

    let taunts: string[];

    if (enemy.alwaysArrogant && dialogues.always_arrogant) {
      taunts = dialogues.always_arrogant;
    } else if (isStrong && dialogues.when_afraid.length > 0) {
      taunts = dialogues.when_afraid;
    } else {
      taunts = dialogues.when_weak;
    }

    if (taunts.length === 0) {
      return enemy.fallbackTaunts[Math.floor(Math.random() * enemy.fallbackTaunts.length)];
    }

    return taunts[Math.floor(Math.random() * taunts.length)];
  }

  /**
   * Save enemy dialogues to storage
   */
  static async saveEnemyDialogues(enemy: Enemy): Promise<void> {
    try {
      const key = `enemy_dialogues_${enemy.id}`;
      const data = {
        dialogues: enemy.dialogues,
        lastDataHash: enemy.lastDataHash,
        lastGenerated: enemy.lastGenerated
      };
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving enemy dialogues:', error);
    }
  }

  /**
   * Load enemy dialogues from storage
   */
  static async loadEnemyDialogues(enemy: Enemy): Promise<void> {
    try {
      const key = `enemy_dialogues_${enemy.id}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const data = JSON.parse(stored);
        enemy.dialogues = data.dialogues;
        enemy.lastDataHash = data.lastDataHash;
        enemy.lastGenerated = data.lastGenerated;
      }
    } catch (error) {
      console.error('Error loading enemy dialogues:', error);
    }
  }

  /**
   * Main function to get a psychological warfare taunt for an enemy
   */
  static async getBattleTaunt(enemy: Enemy, heroData: HeroData): Promise<string> {
    try {
      console.log(`Getting battle taunt for ${enemy.name}...`);

      // Load existing dialogues
      await this.loadEnemyDialogues(enemy);

      // Get or generate dialogues
      const dialogues = await this.getEnemyDialogues(enemy, heroData);

      // Select contextual taunt
      const taunt = this.selectContextualTaunt(enemy, dialogues, heroData);

      console.log(`Selected taunt: ${taunt.substring(0, 50)}...`);
      return taunt;

    } catch (error) {
      console.error('Error getting battle taunt:', error);
      return enemy.fallbackTaunts[Math.floor(Math.random() * enemy.fallbackTaunts.length)];
    }
  }
}

// Keep backward compatibility with old TauntService
export default PsychologicalWarfareService;
export { PsychologicalWarfareService };