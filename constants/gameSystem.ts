import AsyncStorage from '@react-native-async-storage/async-storage';

export type HeroState = 'pathetic' | 'weak' | 'developing' | 'strong' | 'legendary';

export interface HeroStats {
  wealth: number;
  strength: number;
  wisdom: number;
  luck: number;
}

export interface HeroData {
  stats: HeroStats;
  level: number;
  totalPomodoros: number;
  streakDays: number;
  lastCompletionDate: string;
  heroState: HeroState;
}

export interface CompletionRecord {
  id: string;
  date: string;
  characterId: string;
  duration: number;
  quality: number;
  pointsEarned: number;
  statsAllocated: HeroStats;
}

const STORAGE_KEYS = {
  HERO_DATA: 'heroData',
  COMPLETION_HISTORY: 'completionHistory',
  LAST_COMPLETION_DATE: 'lastCompletionDate',
};

export const getDefaultHeroData = (): HeroData => ({
  stats: {
    wealth: 0,
    strength: 0,
    wisdom: 0,
    luck: 0,
  },
  level: 1,
  totalPomodoros: 0,
  streakDays: 0,
  lastCompletionDate: '',
  heroState: 'pathetic',
});

export const calculateHeroState = (stats: HeroStats): HeroState => {
  const total = stats.wealth + stats.strength + stats.wisdom + stats.luck;

  if (total >= 1000) return 'legendary';
  if (total >= 601) return 'strong';
  if (total >= 301) return 'developing';
  if (total >= 101) return 'weak';
  return 'pathetic';
};

export const calculateLevel = (stats: HeroStats): number => {
  const total = stats.wealth + stats.strength + stats.wisdom + stats.luck;
  return Math.floor(total / 50) + 1;
};

export const calculateTotalStats = (stats: HeroStats): number => {
  return stats.wealth + stats.strength + stats.wisdom + stats.luck;
};

export const calculatePointsForCompletion = (
  quality: number,
  streakDays: number
): number => {
  let points = 5; // Base points

  // Quality bonus (0-2 points)
  if (quality >= 5) points += 2;
  else if (quality >= 4) points += 1;

  // Streak bonus (+1 per 7-day streak)
  const streakBonus = Math.floor(streakDays / 7);
  points += streakBonus;

  return points;
};

export const calculateStreak = (lastCompletionDate: string): number => {
  if (!lastCompletionDate) return 1;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastDate = new Date(lastCompletionDate);
  lastDate.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - lastDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);

  // If last completion was today, don't increment
  if (diffDays === 0) return 0;

  // If last completion was yesterday, continue streak
  if (diffDays === 1) return 1;

  // If more than 1 day ago, streak is broken
  return -1; // Signal to reset streak
};

export const loadHeroData = async (): Promise<HeroData> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.HERO_DATA);
    if (data) {
      const heroData: HeroData = JSON.parse(data);
      // Recalculate derived values
      heroData.heroState = calculateHeroState(heroData.stats);
      heroData.level = calculateLevel(heroData.stats);
      return heroData;
    }
    return getDefaultHeroData();
  } catch (error) {
    console.error('Error loading hero data:', error);
    return getDefaultHeroData();
  }
};

export const saveHeroData = async (heroData: HeroData): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.HERO_DATA, JSON.stringify(heroData));
  } catch (error) {
    console.error('Error saving hero data:', error);
  }
};

export const updateHeroAfterCompletion = async (
  characterId: string,
  duration: number,
  quality: number,
  allocatedStats: HeroStats
): Promise<HeroData> => {
  try {
    const heroData = await loadHeroData();

    // Update stats
    heroData.stats.wealth += allocatedStats.wealth;
    heroData.stats.strength += allocatedStats.strength;
    heroData.stats.wisdom += allocatedStats.wisdom;
    heroData.stats.luck += allocatedStats.luck;

    // Update pomodoro count
    heroData.totalPomodoros += 1;

    // Update streak
    const streakUpdate = calculateStreak(heroData.lastCompletionDate);
    if (streakUpdate === -1) {
      // Streak broken, reset to 1
      heroData.streakDays = 1;
    } else if (streakUpdate === 1) {
      // Continue streak
      heroData.streakDays += 1;
    }
    // If streakUpdate === 0, already completed today, don't change

    // Update last completion date
    const today = new Date().toISOString().split('T')[0];
    heroData.lastCompletionDate = today;

    // Recalculate derived values
    heroData.level = calculateLevel(heroData.stats);
    heroData.heroState = calculateHeroState(heroData.stats);

    // Save updated hero data
    await saveHeroData(heroData);

    // Save completion record
    const completionRecord: CompletionRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      characterId,
      duration,
      quality,
      pointsEarned: allocatedStats.wealth + allocatedStats.strength + allocatedStats.wisdom + allocatedStats.luck,
      statsAllocated: allocatedStats,
    };

    await saveCompletionRecord(completionRecord);

    return heroData;
  } catch (error) {
    console.error('Error updating hero after completion:', error);
    throw error;
  }
};

export const saveCompletionRecord = async (record: CompletionRecord): Promise<void> => {
  try {
    const historyData = await AsyncStorage.getItem(STORAGE_KEYS.COMPLETION_HISTORY);
    const history: CompletionRecord[] = historyData ? JSON.parse(historyData) : [];
    history.unshift(record);

    // Keep only last 100 records
    const trimmedHistory = history.slice(0, 100);

    await AsyncStorage.setItem(STORAGE_KEYS.COMPLETION_HISTORY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error('Error saving completion record:', error);
  }
};

export const getCompletionHistory = async (limit: number = 20): Promise<CompletionRecord[]> => {
  try {
    const historyData = await AsyncStorage.getItem(STORAGE_KEYS.COMPLETION_HISTORY);
    const history: CompletionRecord[] = historyData ? JSON.parse(historyData) : [];
    return history.slice(0, limit);
  } catch (error) {
    console.error('Error getting completion history:', error);
    return [];
  }
};

export const resetHeroData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.HERO_DATA,
      STORAGE_KEYS.COMPLETION_HISTORY,
      STORAGE_KEYS.LAST_COMPLETION_DATE,
    ]);
  } catch (error) {
    console.error('Error resetting hero data:', error);
  }
};

export const getStatColor = (statName: keyof HeroStats): string => {
  switch (statName) {
    case 'wealth':
      return '#FFD700';
    case 'strength':
      return '#FF4444';
    case 'wisdom':
      return '#4A90E2';
    case 'luck':
      return '#4CAF50';
  }
};

export const getStatEmoji = (statName: keyof HeroStats): string => {
  switch (statName) {
    case 'wealth':
      return '💰';
    case 'strength':
      return '💪';
    case 'wisdom':
      return '🧠';
    case 'luck':
      return '🍀';
  }
};

export const getHeroStateDescription = (state: HeroState): string => {
  switch (state) {
    case 'pathetic':
      return 'Pathetic - The journey begins...';
    case 'weak':
      return 'Weak - Taking first steps';
    case 'developing':
      return 'Developing - Growth is visible';
    case 'strong':
      return 'Strong - Becoming formidable';
    case 'legendary':
      return 'Legendary - Transcendent power';
  }
};
