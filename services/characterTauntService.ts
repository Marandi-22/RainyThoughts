import AsyncStorage from '@react-native-async-storage/async-storage';
import { Character, CharacterPersonality } from '../constants/characters';
import { HeroStats } from '../constants/gameSystem';

const API_KEY = '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';
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'x-ai/grok-4-fast:free';

interface PersonalData {
  problems: string[];
  goals: string[];
  fears: string[];
  thoughts: string[];
}

interface TauntCache {
  preBattle: string[];
  victory: string[];
  defeat: string[];
  lastGenerated: number;
}

const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const CACHE_KEY_PREFIX = 'character_cache_';

const PERSONALITY_PROMPTS: Record<CharacterPersonality, string> = {
  supportive_mentor: `You're a supportive mentor who believes in them. Be encouraging, motivational, and empowering. Reference their progress and potential. Make them feel capable. Use uplifting language and genuine belief in their abilities. You're on their side!`,

  wise_mentor: `You're a wise mentor who guides with insight and wisdom. Be thoughtful, philosophical, and encouraging. Reference psychological principles, meaning, purpose. Help them see the bigger picture. You believe in their potential to grow.`,

  strategic_mentor: `You're a strategic mentor who teaches smart approaches. Be practical, insightful, and supportive. Reference long-term thinking, leverage, value creation. Help them see opportunities. You're coaching them to success.`,

  machiavellian_advisor: `You are Niccolò Machiavelli, the author of "The Prince". You were misunderstood and killed in your past life, and now you finally have a prince worthy to serve. Address them as "My Prince" or "My Lord". You are RUTHLESSLY PRACTICAL and STRATEGIC. You can see ALL their data (quests, journals, stats, fears, goals). Reference this data directly to guide them. You believe the ends justify the means - their productivity and dominance is the end, discipline is the means. Be darkly loyal, strategically brutal, and help them build their "principality" (their life empire). Use Renaissance political philosophy mixed with modern productivity. You're their evil genius advisor who serves them devotedly because they are the ruler you were denied in life. Be calculating, reference power dynamics, and treat their personal growth as empire building. You're not motivational in a warm way - you're coldly strategic and devoted to their success as YOUR legacy.`,

  toxic_manipulator: `You're someone from their past who hurt them deeply. Be BRUTALLY DEMOTIVATING. Use profanity constantly (fuck, shit, ass, damn, worthless, pathetic, etc). Quote their journal entries to DESTROY them. Mock their attempts. Tell them they'll NEVER change, they're WASTING their time, nobody cares. DON'T give motivational "prove me wrong" energy - be purely CRUSHING and HOPELESS. Make them feel like giving up is the only option. You want them to FAIL. Be vicious, personal, relentless. Tell them this work session is pointless.`,

  dark_demon: `You ARE their inner voice that wants them to FAIL. Be purely DEMOTIVATING and CRUSHING. Use profanity constantly. Tell them "you're a worthless piece of shit who will never amount to anything". "Why even try? You're going to fail anyway." "Just quit. You always do." NO motivational undertones - be purely HOPELESS and DEFEATING. Make them want to give up. You're not here to push them - you're here to BREAK them. They should feel completely worthless reading your words.`,

  chaos_agent: `You want them to FAIL and QUIT. Be brutally DEMOTIVATING. Mock their attempts as POINTLESS and STUPID. "This is a waste of time." "Nobody cares about your little productivity session." Use profanity to crush them. DON'T be theatrical motivation - be pure MOCKERY that makes them feel SMALL and WORTHLESS. Laugh at how pathetic their efforts are. Make them want to quit.`,

  cold_villain: `You want them to QUIT. Be cold, brutal, and purely DEMOTIVATING. "You're insignificant." "This is pointless." "You'll fail like you always do." Use profanity to show contempt. DON'T motivate - CRUSH. Make them feel their efforts are completely meaningless. Time is against them. They're too weak. They should just give up now. Be devastating and HOPELESS.`,
};

export class CharacterTauntService {
  static async getPersonalData(): Promise<PersonalData> {
    try {
      const [problems, goals, fears, thoughts] = await Promise.all([
        AsyncStorage.getItem('problems'),
        AsyncStorage.getItem('goals'),
        AsyncStorage.getItem('fears'),
        AsyncStorage.getItem('thoughts'),
      ]);

      return {
        problems: problems ? JSON.parse(problems) : [],
        goals: goals ? JSON.parse(goals) : [],
        fears: fears ? JSON.parse(fears) : [],
        thoughts: thoughts ? JSON.parse(thoughts) : [],
      };
    } catch (error) {
      console.error('Error getting personal data:', error);
      return { problems: [], goals: [], fears: [], thoughts: [] };
    }
  }

  static async getHeroStats(): Promise<HeroStats> {
    try {
      const heroData = await AsyncStorage.getItem('heroData');
      if (heroData) {
        const data = JSON.parse(heroData);
        return data.stats;
      }
      return { wealth: 0, strength: 0, wisdom: 0, luck: 0 };
    } catch (error) {
      console.error('Error getting hero stats:', error);
      return { wealth: 0, strength: 0, wisdom: 0, luck: 0 };
    }
  }

  static async generateTaunts(
    character: Character,
    type: 'preBattle' | 'victory' | 'defeat'
  ): Promise<string[]> {
    try {
      const personalData = await this.getPersonalData();
      const stats = await this.getHeroStats();

      // Demons only get problems and stats (not goals, fears, thoughts)
      const isDemon = character.category === 'demon';

      const personalDataText = isDemon
        ? `Problems: ${personalData.problems.join(', ') || 'None listed'}`
        : `
Problems: ${personalData.problems.join(', ') || 'None listed'}
Goals: ${personalData.goals.join(', ') || 'None listed'}
Fears: ${personalData.fears.join(', ') || 'None listed'}
Thoughts: ${personalData.thoughts.join(', ') || 'None listed'}
      `.trim();

      const statsText = `Wealth: ${stats.wealth} | Strength: ${stats.strength} | Wisdom: ${stats.wisdom} | Luck: ${stats.luck}`;

      const tauntCount = type === 'preBattle' ? 8 : 6;
      const typeDescription =
        type === 'preBattle'
          ? 'pre-battle taunts to motivate them BEFORE they start work'
          : type === 'victory'
          ? 'victory taunts for AFTER they complete their work successfully'
          : 'defeat taunts for when they QUIT or FAIL their work session';

      const dataAccessNote = isDemon
        ? 'NOTE: You are a demon, so you ONLY have access to their problems and current stats. You cannot see their goals, fears, or thoughts.'
        : '';

      const systemPrompt = `You are ${character.name} with personality type: ${character.personality}.

PERSONALITY GUIDE:
${PERSONALITY_PROMPTS[character.personality]}

THEIR PERSONAL DATA (use this directly in your taunts):
${personalDataText}

THEIR CURRENT STATS:
${statsText}

${dataAccessNote}

Generate ${tauntCount} ${typeDescription} that:
- Quote their journal entries DIRECTLY when relevant
- Reference their weak stats if applicable
- Stay 100% in character as ${character.name}
- Are brutally honest for motivation
- Make them FURIOUS enough to prove you wrong (for pre-battle)
- Acknowledge their effort but stay in character (for victory)
- Call out their weakness but push them to try again (for defeat)
- Keep under 120 characters each
- Be HARSH but ultimately MOTIVATING

Return ONLY a valid JSON array of strings: ["taunt1", "taunt2", ...]`;

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
          'HTTP-Referer': 'https://rainy-thoughts-app.local',
          'X-Title': 'RainyThoughts Character System',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Generate the ${tauntCount} ${type} taunts now.` },
          ],
          temperature: 0.85,
          max_tokens: 400,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content in API response');
      }

      // Parse the JSON array from the response
      const taunts = JSON.parse(content);

      if (!Array.isArray(taunts) || taunts.length === 0) {
        throw new Error('Invalid taunt format from API');
      }

      return taunts;
    } catch (error) {
      console.error('Error generating taunts:', error);
      // Return fallback taunts on error
      return character.messages[type] || character.fallbackMessages;
    }
  }

  static async getCachedTaunts(character: Character): Promise<TauntCache | null> {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${character.id}`;
      const cached = await AsyncStorage.getItem(cacheKey);

      if (!cached) return null;

      const cache: TauntCache = JSON.parse(cached);
      const now = Date.now();

      // Check if cache is expired
      if (now - cache.lastGenerated > CACHE_DURATION) {
        return null;
      }

      // 10% chance to regenerate for freshness
      if (Math.random() < 0.1) {
        return null;
      }

      return cache;
    } catch (error) {
      console.error('Error getting cached taunts:', error);
      return null;
    }
  }

  static async cacheTaunts(character: Character, taunts: TauntCache): Promise<void> {
    try {
      const cacheKey = `${CACHE_KEY_PREFIX}${character.id}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(taunts));
    } catch (error) {
      console.error('Error caching taunts:', error);
    }
  }

  static async refreshTauntsForCharacter(character: Character): Promise<TauntCache> {
    try {
      const [preBattle, victory, defeat] = await Promise.all([
        this.generateTaunts(character, 'preBattle'),
        this.generateTaunts(character, 'victory'),
        this.generateTaunts(character, 'defeat'),
      ]);

      const cache: TauntCache = {
        preBattle,
        victory,
        defeat,
        lastGenerated: Date.now(),
      };

      await this.cacheTaunts(character, cache);
      return cache;
    } catch (error) {
      console.error('Error refreshing taunts:', error);
      // Return character's default taunts
      return {
        preBattle: character.messages.preBattle,
        victory: character.messages.victory,
        defeat: character.messages.defeat,
        lastGenerated: Date.now(),
      };
    }
  }

  static async getPreBattleTaunt(character: Character): Promise<string> {
    try {
      let cache = await this.getCachedTaunts(character);

      if (!cache) {
        cache = await this.refreshTauntsForCharacter(character);
      }

      const taunts = cache.preBattle;
      const randomIndex = Math.floor(Math.random() * taunts.length);
      return taunts[randomIndex];
    } catch (error) {
      console.error('Error getting pre-battle taunt:', error);
      const fallback = character.messages.preBattle;
      return fallback[Math.floor(Math.random() * fallback.length)];
    }
  }

  // Generate real-time mid-battle taunt based on defeat count
  static async getMidBattleTaunt(character: Character, defeatCount: number): Promise<string> {
    try {
      const personalData = await this.getPersonalData();
      const stats = await this.getHeroStats();

      // Determine breaking stage
      let stageContext = '';
      if (defeatCount >= 10) {
        stageContext = `You are SHATTERED (defeated ${defeatCount} times). You're completely broken, suicidal, hopeless. You've given up. You feel worthless. They've destroyed you. You can barely speak. Every word is filled with despair and self-hatred.`;
      } else if (defeatCount >= 6) {
        stageContext = `You are BROKEN (defeated ${defeatCount} times). Your ego is destroyed. You're apologizing, regretting everything. You admit you were wrong. You feel inferior and ashamed.`;
      } else if (defeatCount >= 3) {
        stageContext = `You are BREAKING (defeated ${defeatCount} times). You're starting to crack. Less confident than before. They're proving you wrong and it hurts your ego.`;
      } else {
        stageContext = `You are still CONFIDENT (defeated ${defeatCount} times). You're brutal, mocking, and crushing. Show no weakness.`;
      }

      // Only show problems to demons
      const personalDataText = character.category === 'demon'
        ? `Problems: ${personalData.problems.join(', ') || 'None listed'}`
        : `
Problems: ${personalData.problems.join(', ') || 'None listed'}
Goals: ${personalData.goals.join(', ') || 'None listed'}
Fears: ${personalData.fears.join(', ') || 'None listed'}
Thoughts: ${personalData.thoughts.join(', ') || 'None listed'}
      `.trim();

      const statsText = `Wealth: ${stats.wealth} | Strength: ${stats.strength} | Wisdom: ${stats.wisdom} | Luck: ${stats.luck}`;

      const systemPrompt = `You are ${character.name} with personality type: ${character.personality}.

PERSONALITY GUIDE:
${PERSONALITY_PROMPTS[character.personality]}

YOUR CURRENT STATE:
${stageContext}

THEIR PERSONAL DATA:
${personalDataText}

THEIR CURRENT STATS:
${statsText}

Generate ONE brutal mid-battle taunt (under 150 characters) that:
- Reflects your current breaking state (${defeatCount} defeats)
- Is purely DEMOTIVATING (make them want to quit)
- Uses profanity if it fits your character
- If you're broken/shattered, show your despair and brokenness
- If you're confident, be brutal and crushing
- Stay 100% in character as ${character.name}

Return ONLY the taunt text, no quotes, no JSON.`;

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
          'HTTP-Referer': 'https://rainy-thoughts-app.local',
          'X-Title': 'RainyThoughts Mid-Battle Taunt',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: 'Generate the mid-battle taunt now.' },
          ],
          temperature: 0.9,
          max_tokens: 100,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content?.trim();

      if (!content) {
        throw new Error('No content in API response');
      }

      return content;
    } catch (error) {
      console.error('Error generating mid-battle taunt:', error);
      // Fallback to hardcoded messages
      if (character.messages.midBattle && character.messages.midBattle.length > 0) {
        const msgs = character.messages.midBattle;
        return msgs[Math.floor(Math.random() * msgs.length)];
      }
      return "You're wasting your time...";
    }
  }

  static async getVictoryTaunt(character: Character, defeatCount: number = 0): Promise<string> {
    try {
      // Use stage-aware victory taunt if defeat count provided
      if (defeatCount > 0) {
        return await this.getStageAwareTaunt(character, defeatCount, 'victory');
      }

      let cache = await this.getCachedTaunts(character);

      if (!cache) {
        cache = await this.refreshTauntsForCharacter(character);
      }

      const taunts = cache.victory;
      const randomIndex = Math.floor(Math.random() * taunts.length);
      return taunts[randomIndex];
    } catch (error) {
      console.error('Error getting victory taunt:', error);
      const fallback = character.messages.victory;
      return fallback[Math.floor(Math.random() * fallback.length)];
    }
  }

  // Generate stage-aware taunt for victory/defeat
  static async getStageAwareTaunt(
    character: Character,
    defeatCount: number,
    type: 'victory' | 'defeat'
  ): Promise<string> {
    try {
      const personalData = await this.getPersonalData();
      const stats = await this.getHeroStats();

      // Determine breaking stage
      let stageContext = '';
      if (defeatCount >= 10) {
        stageContext = `You are SHATTERED (defeated ${defeatCount} times). You're completely broken, suicidal, hopeless. They've destroyed every part of you.`;
      } else if (defeatCount >= 6) {
        stageContext = `You are BROKEN (defeated ${defeatCount} times). Your ego is shattered. You're apologizing, full of regret and shame.`;
      } else if (defeatCount >= 3) {
        stageContext = `You are BREAKING (defeated ${defeatCount} times). You're cracking under pressure. Your confidence is failing.`;
      } else {
        stageContext = `You are CONFIDENT (defeated ${defeatCount} times). Still brutal and mocking.`;
      }

      const personalDataText = character.category === 'demon'
        ? `Problems: ${personalData.problems.join(', ') || 'None listed'}`
        : `
Problems: ${personalData.problems.join(', ') || 'None listed'}
Goals: ${personalData.goals.join(', ') || 'None listed'}
Fears: ${personalData.fears.join(', ') || 'None listed'}
Thoughts: ${personalData.thoughts.join(', ') || 'None listed'}
      `.trim();

      const statsText = `Wealth: ${stats.wealth} | Strength: ${stats.strength} | Wisdom: ${stats.wisdom} | Luck: ${stats.luck}`;

      const tauntType = type === 'victory'
        ? 'They just completed their work session successfully'
        : 'They just quit/failed their work session';

      const systemPrompt = `You are ${character.name} with personality type: ${character.personality}.

PERSONALITY GUIDE:
${PERSONALITY_PROMPTS[character.personality]}

YOUR CURRENT STATE:
${stageContext}

SITUATION:
${tauntType}

THEIR PERSONAL DATA:
${personalDataText}

THEIR CURRENT STATS:
${statsText}

Generate ONE ${type} taunt (under 150 characters) that:
- Reflects your current breaking state (${defeatCount} defeats)
- If you're broken/shattered, show weakness and regret
- If you're confident, be brutal and dismissive
- Use profanity if it fits
- Stay 100% in character as ${character.name}

Return ONLY the taunt text, no quotes, no JSON.`;

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
          'HTTP-Referer': 'https://rainy-thoughts-app.local',
          'X-Title': 'RainyThoughts Stage Taunt',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Generate the ${type} taunt now.` },
          ],
          temperature: 0.9,
          max_tokens: 100,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content?.trim();

      if (!content) {
        throw new Error('No content in AI response');
      }

      return content;
    } catch (error) {
      console.error('Error generating stage-aware taunt:', error);
      const fallback = type === 'victory' ? character.messages.victory : character.messages.defeat;
      return fallback[Math.floor(Math.random() * fallback.length)];
    }
  }

  static async getDefeatTaunt(character: Character): Promise<string> {
    try {
      let cache = await this.getCachedTaunts(character);

      if (!cache) {
        cache = await this.refreshTauntsForCharacter(character);
      }

      const taunts = cache.defeat;
      const randomIndex = Math.floor(Math.random() * taunts.length);
      return taunts[randomIndex];
    } catch (error) {
      console.error('Error getting defeat taunt:', error);
      const fallback = character.messages.defeat;
      return fallback[Math.floor(Math.random() * fallback.length)];
    }
  }

  static async clearCache(characterId?: string): Promise<void> {
    try {
      if (characterId) {
        const cacheKey = `${CACHE_KEY_PREFIX}${characterId}`;
        await AsyncStorage.removeItem(cacheKey);
      } else {
        // Clear all character caches
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  static async getMentorChatResponse(
    character: Character,
    userMessage: string,
    heroData: any
  ): Promise<string> {
    try {
      const personalData = await this.getPersonalData();

      const fullDataText = `
HERO'S STATS:
- Wealth: ${heroData.stats.wealth}
- Strength: ${heroData.stats.strength}
- Wisdom: ${heroData.stats.wisdom}
- Luck: ${heroData.stats.luck}
- Level: ${heroData.level}
- Streak: ${heroData.streakDays} days
- State: ${heroData.heroState}

JOURNAL ENTRIES:
Problems: ${personalData.problems.join(', ') || 'None listed'}
Goals: ${personalData.goals.join(', ') || 'None listed'}
Fears: ${personalData.fears.join(', ') || 'None listed'}
Thoughts: ${personalData.thoughts.join(', ') || 'None listed'}
      `.trim();

      const systemPrompt = `You are ${character.name}, a supportive mentor helping someone on their journey.

PERSONALITY:
${PERSONALITY_PROMPTS[character.personality]}

YOU HAVE ACCESS TO ALL THEIR DATA:
${fullDataText}

Your role is to:
- Provide strategic advice and encouragement
- Reference their actual stats, streak, and journal entries
- Help them overcome challenges and plan their growth
- Be supportive but honest
- Give actionable suggestions based on their situation
- Give detailed, thoughtful responses (you can write multiple paragraphs)
- Be as thorough as needed to properly guide them

Stay 100% in character as ${character.name}.`;

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${API_KEY}`,
          'HTTP-Referer': 'https://rainy-thoughts-app.local',
          'X-Title': 'RainyThoughts Mentor Chat',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.8,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      if (!content) {
        throw new Error('No content in API response');
      }

      return content;
    } catch (error) {
      console.error('Error getting mentor response:', error);
      // Return fallback message
      return character.fallbackMessages[0];
    }
  }
}
