import AsyncStorage from '@react-native-async-storage/async-storage';

interface RotTrackerData {
  rotDays: number; // Negative days - days without work
  productiveDays: number; // Positive days - days with work
  lastWorkDate: string; // ISO date string
  currentStreak: number; // Current consecutive work days
  lastChecked: string; // ISO date string
}

const ROT_TRACKER_KEY = 'rot_tracker_data';

export const getRotEmoji = (rotDays: number): string => {
  if (rotDays === 0) return '😊'; // Neutral
  if (rotDays <= 2) return '😐'; // Starting to rot
  if (rotDays <= 5) return '😞'; // Getting worse
  if (rotDays <= 10) return '😩'; // Bad
  if (rotDays <= 15) return '😭'; // Really bad
  if (rotDays <= 20) return '💀'; // Dead
  return '🪦'; // Beyond dead
};

export const getRotMessage = (rotDays: number): string => {
  if (rotDays === 0) return 'Living clean!';
  if (rotDays <= 2) return 'Getting stale...';
  if (rotDays <= 5) return 'Starting to rot';
  if (rotDays <= 10) return 'Deeply rotting';
  if (rotDays <= 15) return 'Completely rotten';
  if (rotDays <= 20) return 'Dead inside';
  return 'Beyond recovery';
};

export const getRotColor = (rotDays: number): string => {
  if (rotDays === 0) return '#00FF00'; // Green
  if (rotDays <= 2) return '#FFD700'; // Gold
  if (rotDays <= 5) return '#FFA500'; // Orange
  if (rotDays <= 10) return '#FF6B6B'; // Light red
  if (rotDays <= 15) return '#FF4444'; // Red
  if (rotDays <= 20) return '#8B0000'; // Dark red
  return '#4A0000'; // Very dark red
};

export async function loadRotTracker(): Promise<RotTrackerData> {
  try {
    const data = await AsyncStorage.getItem(ROT_TRACKER_KEY);

    if (data) {
      const tracker: RotTrackerData = JSON.parse(data);

      // Update rot days based on time passed
      const today = new Date().toISOString().split('T')[0];
      const lastChecked = tracker.lastChecked.split('T')[0];

      if (today !== lastChecked) {
        const daysPassed = Math.floor(
          (new Date(today).getTime() - new Date(lastChecked).getTime()) / (1000 * 60 * 60 * 24)
        );

        // Check if user worked yesterday
        const lastWorkDate = tracker.lastWorkDate.split('T')[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastWorkDate !== yesterdayStr && lastWorkDate !== today) {
          // User didn't work yesterday, increment rot
          tracker.rotDays += daysPassed;
          tracker.currentStreak = 0;
        }

        tracker.lastChecked = new Date().toISOString();
        await saveRotTracker(tracker);
      }

      return tracker;
    }

    // Initialize new tracker
    const newTracker: RotTrackerData = {
      rotDays: 0,
      productiveDays: 0,
      lastWorkDate: new Date().toISOString(),
      currentStreak: 0,
      lastChecked: new Date().toISOString(),
    };

    await saveRotTracker(newTracker);
    return newTracker;
  } catch (error) {
    console.error('Error loading rot tracker:', error);
    return {
      rotDays: 0,
      productiveDays: 0,
      lastWorkDate: new Date().toISOString(),
      currentStreak: 0,
      lastChecked: new Date().toISOString(),
    };
  }
}

export async function saveRotTracker(data: RotTrackerData): Promise<void> {
  try {
    await AsyncStorage.setItem(ROT_TRACKER_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving rot tracker:', error);
  }
}

export async function recordWorkSession(): Promise<RotTrackerData> {
  const tracker = await loadRotTracker();
  const today = new Date().toISOString().split('T')[0];
  const lastWorkDate = tracker.lastWorkDate.split('T')[0];

  if (lastWorkDate !== today) {
    // First work session today
    tracker.productiveDays += 1;

    // Good days cancel rot days! One day of work removes rot
    if (tracker.rotDays > 0) {
      tracker.rotDays = Math.max(0, tracker.rotDays - 1);
    }

    // Check if streak continues
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastWorkDate === yesterdayStr) {
      tracker.currentStreak += 1;
    } else {
      tracker.currentStreak = 1;
    }

    tracker.lastWorkDate = new Date().toISOString();
    tracker.lastChecked = new Date().toISOString();

    await saveRotTracker(tracker);
  }

  return tracker;
}

export async function resetRotTracker(): Promise<void> {
  const newTracker: RotTrackerData = {
    rotDays: 0,
    productiveDays: 0,
    lastWorkDate: new Date().toISOString(),
    currentStreak: 0,
    lastChecked: new Date().toISOString(),
  };
  await saveRotTracker(newTracker);
}
