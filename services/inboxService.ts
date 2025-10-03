import AsyncStorage from '@react-native-async-storage/async-storage';
import { Character } from '../constants/characters';
import { HeroData, loadHeroData } from '../constants/gameSystem';
import { loadRotTracker } from './rotTrackerService';

export interface Letter {
  id: string;
  from: Character;
  subject: string;
  message: string;
  read: boolean;
  createdAt: string;
  expiresAt?: string;
}

const LETTERS_KEY = 'mentor_letters';
const API_KEY = 'sk-ant-api03-Y3YJaTa2WCZ0eeFjgW_Cyi2Wjf5uLXRXRp-hBd81IjORBtNDdjEUusgNzlB7b02WO4ohm2qgCDhtqTwUiRkrvQ-Zy0XGQAA';
const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-3-5-haiku-20241022';

export async function loadLetters(): Promise<Letter[]> {
  try {
    const data = await AsyncStorage.getItem(LETTERS_KEY);
    if (data) {
      const letters: Letter[] = JSON.parse(data);

      // Filter out expired letters
      const now = new Date().toISOString();
      const validLetters = letters.filter(letter => {
        if (!letter.expiresAt) return true;
        return letter.expiresAt > now;
      });

      if (validLetters.length !== letters.length) {
        await saveLetters(validLetters);
      }

      return validLetters.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return [];
  } catch (error) {
    console.error('Error loading letters:', error);
    return [];
  }
}

export async function saveLetters(letters: Letter[]): Promise<void> {
  try {
    await AsyncStorage.setItem(LETTERS_KEY, JSON.stringify(letters));
  } catch (error) {
    console.error('Error saving letters:', error);
  }
}

export async function markLetterAsRead(letterId: string): Promise<void> {
  const letters = await loadLetters();
  const letter = letters.find(l => l.id === letterId);
  if (letter) {
    letter.read = true;
    await saveLetters(letters);
  }
}

export async function deleteLetter(letterId: string): Promise<void> {
  const letters = await loadLetters();
  const filtered = letters.filter(l => l.id !== letterId);
  await saveLetters(filtered);
}

export async function generateMentorLetter(mentor: Character, type: 'motivation' | 'wisdom' = 'motivation'): Promise<Letter> {
  try {
    const heroData = await loadHeroData();
    const rotData = await loadRotTracker();

    // Load goals
    const goalsData = await AsyncStorage.getItem('goals');
    const goals = goalsData ? JSON.parse(goalsData) : [];

    let contextPrompt = '';

    if (type === 'wisdom') {
      // Random wisdom/life lesson letter
      contextPrompt = `You are ${mentor.name}, a mentor character with personality: ${mentor.personality}.

Your bio: ${mentor.bio}

Write a personal letter (150-200 words) sharing a life lesson, wisdom, or philosophical insight from your experience. This is NOT about their current performance - just share valuable wisdom that relates to your background and expertise.

Topics you might cover:
- Life lessons from your field/expertise
- Philosophical insights about growth and discipline
- Stories from your own journey
- Timeless wisdom about success and failure
- Advice on mindset and character
- Inspiration for the long journey ahead

Match your character's personality strictly:
- Use your characteristic speech patterns
- Reference your background authentically
- Share wisdom that fits YOUR expertise
- Be genuine to your personality type

Return ONLY valid JSON:
{
  "subject": "Brief subject line (5-8 words)",
  "message": "Your letter content here"
}`;
    } else {
      // Motivation letter based on current stats
      contextPrompt = `You are ${mentor.name}, a mentor character with personality: ${mentor.personality}.

Your bio: ${mentor.bio}

Current student stats:
- Level: ${heroData.level}
- Wealth: ${heroData.stats.wealth}
- Strength: ${heroData.stats.strength}
- Wisdom: ${heroData.stats.wisdom}
- Luck: ${heroData.stats.luck}
- Total Pomodoros: ${heroData.totalPomodoros}
- Streak: ${heroData.streakDays} days
- State: ${heroData.heroState}

Rot Tracker:
- Rot Days (days without work): ${rotData.rotDays}
- Productive Days: ${rotData.productiveDays}

Life Goals:
${goals.length > 0 ? goals.map((g: string, i: number) => `${i + 1}. ${g}`).join('\n') : 'No goals set yet.'}

Write a personal letter (150-200 words) to motivate them to work. Reference their stats, rot status, or goals naturally. Match your character's personality strictly:
- Use your characteristic speech patterns
- Reference your background and expertise
- Be authentic to your personality type
- If rot days > 5, address this with concern
- If they have a good streak, acknowledge it
- If they have goals, reference them

Return ONLY valid JSON:
{
  "subject": "Brief subject line (5-8 words)",
  "message": "Your letter content here"
}`;
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 500,
        temperature: 0.8,
        messages: [
          { role: 'user', content: contextPrompt }
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.content[0].text;

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    const letter: Letter = {
      id: Date.now().toString(),
      from: mentor,
      subject: parsed.subject,
      message: parsed.message,
      read: false,
      createdAt: new Date().toISOString(),
      expiresAt: undefined, // No expiration
    };

    const letters = await loadLetters();
    letters.unshift(letter);
    await saveLetters(letters);

    return letter;
  } catch (error) {
    console.error('Error generating mentor letter:', error);

    // Fallback letter
    const letter: Letter = {
      id: Date.now().toString(),
      from: mentor,
      subject: 'A message for you',
      message: `${mentor.name} wanted to reach out, but couldn't find the right words at the moment. Keep pushing forward!`,
      read: false,
      createdAt: new Date().toISOString(),
    };

    const letters = await loadLetters();
    letters.unshift(letter);
    await saveLetters(letters);

    return letter;
  }
}

export async function getUnreadCount(): Promise<number> {
  const letters = await loadLetters();
  return letters.filter(l => !l.read).length;
}

export async function shouldSendLetter(): Promise<{ shouldSend: boolean; type: 'motivation' | 'wisdom' }> {
  const letters = await loadLetters();
  const rotData = await loadRotTracker();

  // Don't spam - check last letter time
  if (letters.length > 0) {
    const lastLetter = letters[0];
    const lastLetterTime = new Date(lastLetter.createdAt).getTime();
    const now = new Date().getTime();
    const hoursSinceLastLetter = (now - lastLetterTime) / (1000 * 60 * 60);

    // Don't send more than one letter every 12 hours
    if (hoursSinceLastLetter < 12) {
      return { shouldSend: false, type: 'motivation' };
    }
  }

  // Send motivation letter if:
  // - Rot days >= 3 (starting to slack) - HIGH priority
  // - Good streak (>= 5 days) to encourage - MEDIUM priority
  if (rotData.rotDays >= 3) return { shouldSend: true, type: 'motivation' };
  if (rotData.currentStreak >= 5) return { shouldSend: true, type: 'motivation' };

  // Send random wisdom letter (30% chance per check) - share life lessons!
  if (Math.random() < 0.3) return { shouldSend: true, type: 'wisdom' };

  return { shouldSend: false, type: 'motivation' };
}
