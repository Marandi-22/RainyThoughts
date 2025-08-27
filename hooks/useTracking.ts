import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { dailyTasks } from '../constants/Tasks';

const TRACKING_STORAGE_KEY = 'tracking_data';
const TODO_STORAGE_KEY_PREFIX = 'todo_data_';
const COMPLETED_TASKS_STORAGE_KEY = 'completed_tasks';

interface WeeklyStat {
  week: number;
  year: number;
  progress: number;
}

interface MonthlyStat {
  month: number;
  year: number;
  progress: number;
}

export const useTracking = () => {
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStat[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStat[]>([]);

  useEffect(() => {
    const loadTrackingData = async () => {
      try {
        const data = await AsyncStorage.getItem(TRACKING_STORAGE_KEY);
        if (data) {
          const { weekly, monthly } = JSON.parse(data);
          setWeeklyStats(weekly || []);
          setMonthlyStats(monthly || []);
        }
      } catch (error) {
        console.error('Failed to load tracking data', error);
      }
    };
    loadTrackingData();
  }, []);

  const saveTrackingData = async (weekly: WeeklyStat[], monthly: MonthlyStat[]) => {
    try {
      await AsyncStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify({ weekly, monthly }));
    } catch (error) {
      console.error('Failed to save tracking data', error);
    }
  };

  const updateWeeklyStats = async () => {
    const today = new Date();
    const week = getWeekNumber(today);
    const year = today.getFullYear();

    const completedTasksData = await AsyncStorage.getItem(COMPLETED_TASKS_STORAGE_KEY);
    if (!completedTasksData) return;

    const completedTasks = JSON.parse(completedTasksData);

    let totalGoals = 0;
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - date.getDay() + i);
      weekDates.push(date);
    }

    for (const date of weekDates) {
      const storageKey = `${TODO_STORAGE_KEY_PREFIX}${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      try {
        const data = await AsyncStorage.getItem(storageKey);
        if (data) {
          const tasks = JSON.parse(data);
          totalGoals += tasks.length;
        } else {
          totalGoals += dailyTasks[date.getDay()]?.length || 0;
        }
      } catch (error) {
        console.error('Failed to load tasks for stats', error);
      }
    }

    const progress = totalGoals > 0 ? (completedTasks.length / totalGoals) * 100 : 0;

    const newWeeklyStats = [...weeklyStats];
    const existingStatIndex = newWeeklyStats.findIndex(
      (stat) => stat.week === week && stat.year === year
    );

    if (existingStatIndex > -1) {
      newWeeklyStats[existingStatIndex].progress = progress;
    } else {
      newWeeklyStats.push({ week, year, progress });
    }

    setWeeklyStats(newWeeklyStats);
    saveTrackingData(newWeeklyStats, monthlyStats);
  };

  const updateMonthlyStats = async () => {
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();

    const relevantWeeklyStats = weeklyStats.filter(stat => {
      const d = new Date(stat.year, 0, 1);
      const weekDate = new Date(d.getTime() + (stat.week - 1) * 7 * 24 * 60 * 60 * 1000);
      return weekDate.getMonth() === month && weekDate.getFullYear() === year;
    });

    if (relevantWeeklyStats.length > 0) {
      const totalProgress = relevantWeeklyStats.reduce((acc, stat) => acc + stat.progress, 0);
      const progress = totalProgress / relevantWeeklyStats.length;

      const newMonthlyStats = [...monthlyStats];
      const existingStatIndex = newMonthlyStats.findIndex(stat => stat.month === month && stat.year === year);

      if (existingStatIndex > -1) {
        newMonthlyStats[existingStatIndex].progress = progress;
      } else {
        newMonthlyStats.push({ month, year, progress });
      }

      setMonthlyStats(newMonthlyStats);
      saveTrackingData(weeklyStats, newMonthlyStats);
    }
  };

  return { weeklyStats, monthlyStats, updateWeeklyStats, updateMonthlyStats };
};

function getWeekNumber(d: Date): number {
  d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.valueOf() - yearStart.valueOf()) / 86400000) + 1) / 7);
  return weekNo;
}
