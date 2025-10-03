import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Quest {
  id: string;
  title: string;
  description?: string;
  deadline?: string; // ISO date string
  completed: boolean;
  completedDate?: string; // ISO date string
  recurring: 'none' | 'daily' | 'weekly'; // Recurring frequency
  createdAt: string; // ISO date string
  category?: string; // Optional category like "work", "health", etc.
}

const QUESTS_KEY = 'quests_data';

export async function loadQuests(): Promise<Quest[]> {
  try {
    const data = await AsyncStorage.getItem(QUESTS_KEY);
    if (data) {
      const quests: Quest[] = JSON.parse(data);

      // Check and reset daily recurring quests
      const today = new Date().toISOString().split('T')[0];
      let updated = false;

      quests.forEach((quest) => {
        if (quest.recurring === 'daily' && quest.completed) {
          const completedDate = quest.completedDate?.split('T')[0];
          if (completedDate !== today) {
            // Reset daily quest
            quest.completed = false;
            quest.completedDate = undefined;
            updated = true;
          }
        }
      });

      if (updated) {
        await saveQuests(quests);
      }

      return quests;
    }
    return [];
  } catch (error) {
    console.error('Error loading quests:', error);
    return [];
  }
}

export async function saveQuests(quests: Quest[]): Promise<void> {
  try {
    await AsyncStorage.setItem(QUESTS_KEY, JSON.stringify(quests));
  } catch (error) {
    console.error('Error saving quests:', error);
  }
}

export async function addQuest(quest: Omit<Quest, 'id' | 'createdAt' | 'completed'>): Promise<Quest> {
  const quests = await loadQuests();

  const newQuest: Quest = {
    ...quest,
    id: Date.now().toString(),
    createdAt: new Date().toISOString(),
    completed: false,
  };

  quests.push(newQuest);
  await saveQuests(quests);

  return newQuest;
}

export async function updateQuest(questId: string, updates: Partial<Quest>): Promise<void> {
  const quests = await loadQuests();
  const index = quests.findIndex((q) => q.id === questId);

  if (index !== -1) {
    quests[index] = { ...quests[index], ...updates };
    await saveQuests(quests);
  }
}

export async function deleteQuest(questId: string): Promise<void> {
  const quests = await loadQuests();
  const filtered = quests.filter((q) => q.id !== questId);
  await saveQuests(filtered);
}

export async function toggleQuestComplete(questId: string): Promise<void> {
  const quests = await loadQuests();
  const index = quests.findIndex((q) => q.id === questId);

  if (index !== -1) {
    const quest = quests[index];
    quest.completed = !quest.completed;

    if (quest.completed) {
      quest.completedDate = new Date().toISOString();
    } else {
      quest.completedDate = undefined;
    }

    await saveQuests(quests);
  }
}

export function getQuestsByDate(quests: Quest[], date: string): Quest[] {
  // Get quests for a specific date
  const dateStr = date.split('T')[0];

  return quests.filter((quest) => {
    // Include if it's a daily recurring quest
    if (quest.recurring === 'daily') {
      return true;
    }

    // Include if deadline matches this date
    if (quest.deadline) {
      const deadlineStr = quest.deadline.split('T')[0];
      return deadlineStr === dateStr;
    }

    // Include if it was created on this date
    const createdStr = quest.createdAt.split('T')[0];
    return createdStr === dateStr;
  });
}

export function getOverdueQuests(quests: Quest[]): Quest[] {
  const today = new Date().toISOString().split('T')[0];

  return quests.filter((quest) => {
    if (quest.completed || !quest.deadline) return false;

    const deadlineStr = quest.deadline.split('T')[0];
    return deadlineStr < today;
  });
}

export function getTodayQuests(quests: Quest[]): Quest[] {
  const today = new Date().toISOString().split('T')[0];

  return quests.filter((quest) => {
    // Daily recurring quests always show today
    if (quest.recurring === 'daily') {
      return true;
    }

    // One-time quests with today's deadline
    if (quest.deadline) {
      const deadlineStr = quest.deadline.split('T')[0];
      return deadlineStr === today;
    }

    // Completed today
    if (quest.completedDate) {
      const completedStr = quest.completedDate.split('T')[0];
      return completedStr === today;
    }

    return false;
  });
}

export function getUpcomingQuests(quests: Quest[]): Quest[] {
  const today = new Date().toISOString().split('T')[0];

  return quests.filter((quest) => {
    if (quest.completed || !quest.deadline || quest.recurring === 'daily') return false;

    const deadlineStr = quest.deadline.split('T')[0];
    return deadlineStr > today;
  }).sort((a, b) => {
    return (a.deadline || '').localeCompare(b.deadline || '');
  });
}

export function formatDate(dateStr: string): string {
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
}
