import AsyncStorage from '@react-native-async-storage/async-storage';
import { Character } from './characters';
import { HeroData } from './gameSystem';

export interface EnemyData {
  characterId: string;
  maxHp: number;
  currentHp: number;
  defeats: number;
  isDefeated: boolean;
  lastBattledAt?: string;
}

export interface BattleSession {
  enemyId: string;
  startTime: string;
  duration: number; // minutes
  damageDealt: number;
  completed: boolean;
}

const ENEMIES_KEY = 'battle_enemies';
const CURRENT_BATTLE_KEY = 'current_battle_session';

// Enemy HP scales with hero's total stats
export const calculateEnemyHP = (character: Character, heroStats: number): number => {
  const baseHP = 100;
  const scaling = Math.floor(heroStats / 50); // Every 50 stats = +100 HP
  return baseHP + (scaling * 100);
};

// Damage dealt based on session duration and quality
export const calculateDamage = (durationMinutes: number, quality: number): number => {
  // Base damage: 1 point per minute of focus
  // Quality multiplier: 1-3x based on quality rating (1-10)
  const qualityMultiplier = 1 + (quality / 10);
  return Math.floor(durationMinutes * qualityMultiplier);
};

export const loadEnemies = async (): Promise<Record<string, EnemyData>> => {
  try {
    const data = await AsyncStorage.getItem(ENEMIES_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error('Error loading enemies:', error);
    return {};
  }
};

export const saveEnemies = async (enemies: Record<string, EnemyData>): Promise<void> => {
  try {
    await AsyncStorage.setItem(ENEMIES_KEY, JSON.stringify(enemies));
  } catch (error) {
    console.error('Error saving enemies:', error);
  }
};

export const initializeEnemy = async (
  character: Character,
  heroData: HeroData
): Promise<EnemyData> => {
  const enemies = await loadEnemies();

  if (enemies[character.id]) {
    // Enemy exists, check if it should respawn
    const enemy = enemies[character.id];
    if (enemy.isDefeated) {
      // Respawn with more HP based on defeat count
      const totalStats =
        heroData.stats.wealth +
        heroData.stats.strength +
        heroData.stats.wisdom +
        heroData.stats.luck;
      const newMaxHp = calculateEnemyHP(character, totalStats) + enemy.defeats * 50;

      enemy.maxHp = newMaxHp;
      enemy.currentHp = newMaxHp;
      enemy.isDefeated = false;
    }

    return enemy;
  }

  // Create new enemy
  const totalStats =
    heroData.stats.wealth +
    heroData.stats.strength +
    heroData.stats.wisdom +
    heroData.stats.luck;

  const newEnemy: EnemyData = {
    characterId: character.id,
    maxHp: calculateEnemyHP(character, totalStats),
    currentHp: calculateEnemyHP(character, totalStats),
    defeats: 0,
    isDefeated: false,
  };

  enemies[character.id] = newEnemy;
  await saveEnemies(enemies);

  return newEnemy;
};

export const startBattleSession = async (
  enemyId: string,
  duration: number
): Promise<void> => {
  const session: BattleSession = {
    enemyId,
    startTime: new Date().toISOString(),
    duration,
    damageDealt: 0,
    completed: false,
  };

  await AsyncStorage.setItem(CURRENT_BATTLE_KEY, JSON.stringify(session));
};

export const completeBattleSession = async (
  quality: number
): Promise<{ enemyDefeated: boolean; damage: number; enemy: EnemyData }> => {
  try {
    const sessionData = await AsyncStorage.getItem(CURRENT_BATTLE_KEY);
    if (!sessionData) {
      throw new Error('No active battle session');
    }

    const session: BattleSession = JSON.parse(sessionData);
    const enemies = await loadEnemies();
    const enemy = enemies[session.enemyId];

    if (!enemy) {
      throw new Error('Enemy not found');
    }

    // Calculate damage
    const damage = calculateDamage(session.duration, quality);
    enemy.currentHp = Math.max(0, enemy.currentHp - damage);

    let enemyDefeated = false;

    // Check if enemy is defeated
    if (enemy.currentHp === 0) {
      enemy.isDefeated = true;
      enemy.defeats += 1;
      enemyDefeated = true;
    }

    enemy.lastBattledAt = new Date().toISOString();

    // Save updated enemy data
    enemies[session.enemyId] = enemy;
    await saveEnemies(enemies);

    // Clear battle session
    await AsyncStorage.removeItem(CURRENT_BATTLE_KEY);

    return { enemyDefeated, damage, enemy };
  } catch (error) {
    console.error('Error completing battle session:', error);
    throw error;
  }
};

export const cancelBattleSession = async (): Promise<void> => {
  await AsyncStorage.removeItem(CURRENT_BATTLE_KEY);
};

export const getEnemyData = async (characterId: string): Promise<EnemyData | null> => {
  const enemies = await loadEnemies();
  return enemies[characterId] || null;
};

// Get all enemies sorted by defeats (most defeated first)
export const getAllEnemies = async (): Promise<EnemyData[]> => {
  const enemies = await loadEnemies();
  return Object.values(enemies).sort((a, b) => b.defeats - a.defeats);
};

// Reset a specific enemy
export const resetEnemy = async (characterId: string): Promise<void> => {
  const enemies = await loadEnemies();
  if (enemies[characterId]) {
    delete enemies[characterId];
    await saveEnemies(enemies);
  }
};

// Reset all enemies (for testing or fresh start)
export const resetAllEnemies = async (): Promise<void> => {
  await AsyncStorage.removeItem(ENEMIES_KEY);
  await AsyncStorage.removeItem(CURRENT_BATTLE_KEY);
};
