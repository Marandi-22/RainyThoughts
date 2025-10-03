import AsyncStorage from '@react-native-async-storage/async-storage';
import { HeroStats } from './gameSystem';

export type QuestCategory = 'wealth' | 'strength' | 'wisdom' | 'luck';
export type QuestStatus = 'active' | 'completed';

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
  pointsReward: number;
  status: QuestStatus;
  createdAt: string;
  completedAt?: string;
  deadline?: string; // ISO date string - when quest must be completed
  recurring?: 'none' | 'daily'; // Recurring frequency
  lastReset?: string; // ISO date string - last time recurring quest was reset
}

const STORAGE_KEY = 'quests';

// Quest templates based on category
export const QUEST_EXAMPLES: Record<QuestCategory, string[]> = {
  wealth: [
    'Complete a client project',
    'Apply for 5 jobs',
    'Work on business plan',
    'Research investment opportunities',
    'Network with 3 professionals',
    'Update resume and portfolio',
    'Learn a marketable skill',
    'Create a side project',
  ],
  strength: [
    'Complete workout session',
    'Go for a run',
    'Do 100 push-ups',
    'Meal prep for the week',
    'Get 8 hours of sleep',
    'Practice yoga or stretching',
    'Go to the gym',
    'Take a walk outside',
  ],
  wisdom: [
    'Read 50 pages of a book',
    'Complete an online course module',
    'Watch an educational video',
    'Practice coding for 1 hour',
    'Learn something new',
    'Write in journal',
    'Study for exam',
    'Research a topic deeply',
  ],
  luck: [
    'Reach out to a mentor',
    'Attend a networking event',
    'Message 3 connections on LinkedIn',
    'Join a community or group',
    'Help someone with their problem',
    'Share your work publicly',
    'Ask for feedback',
    'Collaborate with someone',
  ],
};

export const getCategoryColor = (category: QuestCategory): string => {
  switch (category) {
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

export const getCategoryEmoji = (category: QuestCategory): string => {
  switch (category) {
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

export const getCategoryDescription = (category: QuestCategory): string => {
  switch (category) {
    case 'wealth':
      return 'Money, business, career, income-related tasks';
    case 'strength':
      return 'Physical health, discipline, consistency tasks';
    case 'wisdom':
      return 'Learning, knowledge, skill-building tasks';
    case 'luck':
      return 'Networking, opportunities, connections tasks';
  }
};

export const loadQuests = async (): Promise<Quest[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading quests:', error);
    return [];
  }
};

export const saveQuests = async (quests: Quest[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(quests));
  } catch (error) {
    console.error('Error saving quests:', error);
  }
};

export const createQuest = async (
  title: string,
  description: string,
  category: QuestCategory,
  pointsReward: number = 5
): Promise<Quest> => {
  const quest: Quest = {
    id: Date.now().toString(),
    title,
    description,
    category,
    pointsReward,
    status: 'active',
    createdAt: new Date().toISOString(),
  };

  const quests = await loadQuests();
  quests.unshift(quest);
  await saveQuests(quests);

  return quest;
};

export const completeQuest = async (questId: string): Promise<Quest | null> => {
  const quests = await loadQuests();
  const quest = quests.find((q) => q.id === questId);

  if (quest && quest.status === 'active') {
    quest.status = 'completed';
    quest.completedAt = new Date().toISOString();
    await saveQuests(quests);
    return quest;
  }

  return null;
};

export const deleteQuest = async (questId: string): Promise<void> => {
  const quests = await loadQuests();
  const filtered = quests.filter((q) => q.id !== questId);
  await saveQuests(filtered);
};

export const getActiveQuests = async (): Promise<Quest[]> => {
  const quests = await loadQuests();
  return quests.filter((q) => q.status === 'active');
};

export const getCompletedQuests = async (): Promise<Quest[]> => {
  const quests = await loadQuests();
  return quests.filter((q) => q.status === 'completed');
};

export const getQuestsByCategory = async (category: QuestCategory): Promise<Quest[]> => {
  const quests = await loadQuests();
  return quests.filter((q) => q.category === category && q.status === 'active');
};

export const getTodayCompletedQuests = async (): Promise<Quest[]> => {
  const quests = await loadQuests();
  const today = new Date().toDateString();

  return quests.filter((q) => {
    if (q.status === 'completed' && q.completedAt) {
      const completedDate = new Date(q.completedAt).toDateString();
      return completedDate === today;
    }
    return false;
  });
};

export const getQuestStatsAllocation = (quest: Quest): Partial<HeroStats> => {
  // Allocate points to the quest's category
  return {
    [quest.category]: quest.pointsReward,
  } as Partial<HeroStats>;
};

// ===== NEW CALENDAR & DEADLINE FEATURES =====

export const resetDailyQuests = async (): Promise<void> => {
  const quests = await loadQuests();
  const today = new Date().toISOString().split('T')[0];
  let updated = false;

  quests.forEach((quest) => {
    if (quest.recurring === 'daily' && quest.status === 'completed') {
      const lastReset = quest.lastReset?.split('T')[0];
      if (lastReset !== today) {
        // Reset daily quest
        quest.status = 'active';
        quest.completedAt = undefined;
        quest.lastReset = new Date().toISOString();
        updated = true;
      }
    }
  });

  if (updated) {
    await saveQuests(quests);
  }
};

export const getTodayQuests = async (): Promise<Quest[]> => {
  await resetDailyQuests(); // Ensure daily quests are reset

  const quests = await loadQuests();
  const today = new Date().toISOString().split('T')[0];

  return quests.filter((quest) => {
    // Always show daily recurring quests
    if (quest.recurring === 'daily') {
      return true;
    }

    // Show quests with today's deadline
    if (quest.deadline) {
      const deadlineStr = quest.deadline.split('T')[0];
      if (deadlineStr === today && quest.status === 'active') {
        return true;
      }
    }

    // Show quests completed today
    if (quest.completedAt && quest.status === 'completed') {
      const completedStr = quest.completedAt.split('T')[0];
      if (completedStr === today) {
        return true;
      }
    }

    return false;
  });
};

export const getOverdueQuests = async (): Promise<Quest[]> => {
  const quests = await loadQuests();
  const today = new Date().toISOString().split('T')[0];

  return quests.filter((quest) => {
    if (quest.status !== 'active' || !quest.deadline || quest.recurring === 'daily') {
      return false;
    }

    const deadlineStr = quest.deadline.split('T')[0];
    return deadlineStr < today;
  });
};

export const getUpcomingQuests = async (): Promise<Quest[]> => {
  const quests = await loadQuests();
  const today = new Date().toISOString().split('T')[0];

  return quests.filter((quest) => {
    if (quest.status !== 'active' || !quest.deadline || quest.recurring === 'daily') {
      return false;
    }

    const deadlineStr = quest.deadline.split('T')[0];
    return deadlineStr > today;
  }).sort((a, b) => {
    return (a.deadline || '').localeCompare(b.deadline || '');
  });
};

export const getQuestsByDate = async (date: string): Promise<Quest[]> => {
  const quests = await loadQuests();
  const dateStr = date.split('T')[0];

  return quests.filter((quest) => {
    // Daily recurring quests appear every day
    if (quest.recurring === 'daily') {
      return true;
    }

    // Quests with matching deadline
    if (quest.deadline) {
      const deadlineStr = quest.deadline.split('T')[0];
      if (deadlineStr === dateStr) {
        return true;
      }
    }

    // Quests completed on this date
    if (quest.completedAt) {
      const completedStr = quest.completedAt.split('T')[0];
      if (completedStr === dateStr) {
        return true;
      }
    }

    return false;
  });
};

export const formatQuestDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateOnly = dateStr.split('T')[0];
  const todayStr = today.toISOString().split('T')[0];
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  if (dateOnly === todayStr) return 'Today';
  if (dateOnly === tomorrowStr) return 'Tomorrow';

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
  });
};

export const isQuestOverdue = (quest: Quest): boolean => {
  if (!quest.deadline || quest.status !== 'active' || quest.recurring === 'daily') {
    return false;
  }

  const today = new Date().toISOString().split('T')[0];
  const deadlineStr = quest.deadline.split('T')[0];
  return deadlineStr < today;
};
