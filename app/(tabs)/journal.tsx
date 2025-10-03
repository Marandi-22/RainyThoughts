import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type JournalCategory = 'problems' | 'goals' | 'fears' | 'thoughts';

interface JournalEntry {
  id: string;
  text: string;
  date: string;
}

const CATEGORIES: { key: JournalCategory; title: string; emoji: string; color: string; description: string }[] = [
  {
    key: 'problems',
    title: 'Problems',
    emoji: '⚠️',
    color: '#FF4444',
    description: 'Insecurities, struggles, failures',
  },
  {
    key: 'goals',
    title: 'Goals',
    emoji: '🎯',
    color: '#FFD700',
    description: 'Dreams, ambitions, targets',
  },
  {
    key: 'fears',
    title: 'Fears',
    emoji: '😰',
    color: '#9370DB',
    description: 'Anxieties, worries, what scares you',
  },
  {
    key: 'thoughts',
    title: 'Thoughts',
    emoji: '💭',
    color: '#4A90E2',
    description: 'Random reflections, observations',
  },
];

export default function JournalScreen() {
  const [selectedCategory, setSelectedCategory] = useState<JournalCategory>('problems');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [newEntryText, setNewEntryText] = useState('');

  useEffect(() => {
    loadEntries(selectedCategory);
  }, [selectedCategory]);

  const loadEntries = async (category: JournalCategory) => {
    try {
      const data = await AsyncStorage.getItem(category);
      if (data) {
        setEntries(JSON.parse(data));
      } else {
        setEntries([]);
      }
    } catch (error) {
      console.error('Error loading entries:', error);
      setEntries([]);
    }
  };

  const saveEntries = async (category: JournalCategory, updatedEntries: JournalEntry[]) => {
    try {
      await AsyncStorage.setItem(category, JSON.stringify(updatedEntries));
      setEntries(updatedEntries);
    } catch (error) {
      console.error('Error saving entries:', error);
      Alert.alert('Error', 'Failed to save entry. Please try again.');
    }
  };

  const addEntry = () => {
    if (!newEntryText.trim()) {
      Alert.alert('Empty Entry', 'Please write something first.');
      return;
    }

    const newEntry: JournalEntry = {
      id: Date.now().toString(),
      text: newEntryText.trim(),
      date: new Date().toISOString(),
    };

    const updatedEntries = [newEntry, ...entries];
    saveEntries(selectedCategory, updatedEntries);
    setNewEntryText('');

    Alert.alert('Success', 'Entry added! Characters will use this in their taunts.');
  };

  const deleteEntry = (id: string) => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          const updatedEntries = entries.filter((entry) => entry.id !== id);
          saveEntries(selectedCategory, updatedEntries);
        },
      },
    ]);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const currentCategory = CATEGORIES.find((cat) => cat.key === selectedCategory);

  return (
    <View style={styles.container}>
      {/* Category Selector */}
      <View style={styles.categorySelector}>
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.key}
            style={[
              styles.categoryButton,
              selectedCategory === category.key && {
                backgroundColor: category.color,
                borderColor: category.color,
              },
            ]}
            onPress={() => setSelectedCategory(category.key)}
          >
            <Text style={styles.categoryEmoji}>{category.emoji}</Text>
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === category.key && styles.categoryButtonTextActive,
              ]}
            >
              {category.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Category Info */}
      {currentCategory && (
        <View style={[styles.categoryInfo, { borderLeftColor: currentCategory.color }]}>
          <Text style={[styles.categoryTitle, { color: currentCategory.color }]}>
            {currentCategory.emoji} {currentCategory.title}
          </Text>
          <Text style={styles.categoryDescription}>{currentCategory.description}</Text>
          <Text style={styles.warningText}>
            ⚠️ Characters will quote these entries in their taunts!
          </Text>
        </View>
      )}

      {/* New Entry Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={`Add a new ${selectedCategory} entry...`}
          placeholderTextColor="#666666"
          value={newEntryText}
          onChangeText={setNewEntryText}
          multiline
          numberOfLines={3}
        />
        <TouchableOpacity
          style={[
            styles.addButton,
            currentCategory && { backgroundColor: currentCategory.color },
          ]}
          onPress={addEntry}
        >
          <Text style={styles.addButtonText}>Add Entry</Text>
        </TouchableOpacity>
      </View>

      {/* Entries List */}
      <ScrollView style={styles.entriesList}>
        {entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No entries yet.</Text>
            <Text style={styles.emptyStateSubtext}>
              Add your first {selectedCategory} entry above.
            </Text>
            <Text style={styles.emptyStateSubtext}>
              These will fuel the characters' personalized taunts!
            </Text>
          </View>
        ) : (
          entries.map((entry) => (
            <View
              key={entry.id}
              style={[
                styles.entryCard,
                currentCategory && { borderLeftColor: currentCategory.color },
              ]}
            >
              <View style={styles.entryHeader}>
                <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                <TouchableOpacity onPress={() => deleteEntry(entry.id)}>
                  <Text style={styles.deleteButton}>🗑️</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.entryText}>{entry.text}</Text>
            </View>
          ))
        )}
      </ScrollView>

      {/* Stats */}
      <View style={styles.statsBar}>
        <Text style={styles.statsText}>
          {entries.length} {selectedCategory} entries • Fuel for motivation
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  categorySelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  categoryButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333333',
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  categoryButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888888',
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  categoryInfo: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  categoryDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 12,
  },
  warningText: {
    fontSize: 12,
    color: '#FF8C00',
    fontStyle: 'italic',
  },
  inputContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  addButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  entriesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#888888',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 4,
  },
  entryCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  entryDate: {
    fontSize: 12,
    color: '#888888',
  },
  deleteButton: {
    fontSize: 18,
  },
  entryText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  statsBar: {
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#333333',
  },
  statsText: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
  },
});
