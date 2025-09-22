import AsyncStorage from '@react-native-async-storage/async-storage';
import { Todo } from '@/components/TodoManager';

export class QuestManager {
  private static readonly STORAGE_KEY = 'rpg_todos';

  /**
   * Load all quests from storage
   */
  static async loadQuests(): Promise<Todo[]> {
    try {
      const stored = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    } catch (error) {
      console.error('Error loading quests:', error);
      return [];
    }
  }

  /**
   * Save all quests to storage
   */
  static async saveQuests(quests: Todo[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(quests));
    } catch (error) {
      console.error('Error saving quests:', error);
    }
  }

  /**
   * Remove expired daily quests
   */
  static async cleanupExpiredQuests(): Promise<Todo[]> {
    try {
      const quests = await this.loadQuests();
      const now = new Date();

      const activeQuests = quests.filter(quest => {
        // Keep main quests
        if (quest.questType === 'main') return true;

        // Remove expired daily quests
        if (quest.expiresAt) {
          const expiration = new Date(quest.expiresAt);
          return now < expiration;
        }

        return true;
      });

      if (activeQuests.length !== quests.length) {
        await this.saveQuests(activeQuests);
        console.log(`Cleaned up ${quests.length - activeQuests.length} expired daily quests`);
      }

      return activeQuests;
    } catch (error) {
      console.error('Error cleaning up expired quests:', error);
      return [];
    }
  }

  /**
   * Get active quests (non-completed, non-expired)
   */
  static async getActiveQuests(): Promise<Todo[]> {
    const allQuests = await this.cleanupExpiredQuests();
    return allQuests.filter(quest => !quest.completed);
  }

  /**
   * Get quests that can be completed via pomodoro
   */
  static async getPomodoroQuests(): Promise<Todo[]> {
    const activeQuests = await this.getActiveQuests();
    return activeQuests.filter(quest =>
      quest.completionMethod === 'pomodoro' || quest.completionMethod === 'both'
    );
  }

  /**
   * Get quests that can be completed manually
   */
  static async getManualQuests(): Promise<Todo[]> {
    const activeQuests = await this.getActiveQuests();
    return activeQuests.filter(quest =>
      quest.completionMethod === 'manual' || quest.completionMethod === 'both'
    );
  }

  /**
   * Complete a quest via pomodoro session
   */
  static async completePomodoroSession(questId: string): Promise<Todo | null> {
    try {
      const quests = await this.loadQuests();
      const questIndex = quests.findIndex(q => q.id === questId);

      if (questIndex === -1) return null;

      const quest = quests[questIndex];

      // Only pomodoro-completable quests
      if (quest.completionMethod === 'manual') return null;

      // Increment pomodoro count
      quest.pomodorosCompleted += 1;

      // Check if quest is complete
      if (quest.pomodorosRequired) {
        // Multi-session quest
        if (quest.pomodorosCompleted >= quest.pomodorosRequired) {
          quest.completed = true;
          quest.completedAt = new Date().toISOString();
        }
      } else {
        // Single session quest
        quest.completed = true;
        quest.completedAt = new Date().toISOString();
      }

      quests[questIndex] = quest;
      await this.saveQuests(quests);

      return quest;
    } catch (error) {
      console.error('Error completing pomodoro session:', error);
      return null;
    }
  }

  /**
   * Complete a quest manually
   */
  static async completeQuestManually(questId: string): Promise<Todo | null> {
    try {
      const quests = await this.loadQuests();
      const questIndex = quests.findIndex(q => q.id === questId);

      if (questIndex === -1) return null;

      const quest = quests[questIndex];

      // Only manually-completable quests
      if (quest.completionMethod === 'pomodoro') return null;

      quest.completed = true;
      quest.completedAt = new Date().toISOString();

      quests[questIndex] = quest;
      await this.saveQuests(quests);

      return quest;
    } catch (error) {
      console.error('Error completing quest manually:', error);
      return null;
    }
  }

  /**
   * Get quests expiring soon (within 24 hours)
   */
  static async getExpiringQuests(): Promise<Todo[]> {
    const activeQuests = await this.getActiveQuests();
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return activeQuests.filter(quest => {
      if (quest.expiresAt) {
        const expiration = new Date(quest.expiresAt);
        return expiration <= tomorrow;
      }
      if (quest.deadline) {
        const deadline = new Date(quest.deadline);
        return deadline <= tomorrow;
      }
      return false;
    });
  }

  /**
   * Get quest completion rate for today
   */
  static async getTodayCompletionRate(): Promise<{ completed: number; total: number; rate: number }> {
    try {
      const allQuests = await this.loadQuests();
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

      const todayQuests = allQuests.filter(quest => {
        const createdAt = new Date(quest.createdAt);
        return createdAt >= startOfDay;
      });

      const completed = todayQuests.filter(quest => quest.completed).length;
      const total = todayQuests.length;
      const rate = total > 0 ? (completed / total) * 100 : 0;

      return { completed, total, rate };
    } catch (error) {
      console.error('Error calculating completion rate:', error);
      return { completed: 0, total: 0, rate: 0 };
    }
  }

  /**
   * Create default daily quests if none exist
   */
  static async ensureDailyQuests(): Promise<void> {
    try {
      const activeQuests = await this.getActiveQuests();
      const dailyQuests = activeQuests.filter(quest => quest.questType === 'daily');

      // If no daily quests exist, create some defaults
      if (dailyQuests.length === 0) {
        const defaultDailyQuests: Partial<Todo>[] = [
          {
            title: 'Complete 3 Pomodoro Sessions',
            description: 'Focus on crushing demons for 3 sessions',
            category: 'strength',
            questType: 'daily',
            completionMethod: 'pomodoro',
            pomodorosRequired: 3,
            pointsWorth: 20
          },
          {
            title: 'Review Daily Goals',
            description: 'Check and update your conquest goals',
            category: 'wisdom',
            questType: 'daily',
            completionMethod: 'manual',
            pointsWorth: 10
          }
        ];

        const now = new Date();
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);

        const newQuests: Todo[] = defaultDailyQuests.map((quest, index) => ({
          id: `daily_${Date.now()}_${index}`,
          title: quest.title!,
          description: quest.description!,
          category: quest.category!,
          pointsWorth: quest.pointsWorth!,
          completed: false,
          createdAt: now.toISOString(),
          questType: quest.questType!,
          completionMethod: quest.completionMethod!,
          pomodorosRequired: quest.pomodorosRequired,
          pomodorosCompleted: 0,
          expiresAt: tomorrow.toISOString()
        }));

        const allQuests = await this.loadQuests();
        await this.saveQuests([...allQuests, ...newQuests]);

        console.log('Created default daily quests');
      }
    } catch (error) {
      console.error('Error ensuring daily quests:', error);
    }
  }
}