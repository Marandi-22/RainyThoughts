import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { StatType } from '@/constants/enemies';
import { getStatEmoji, getStatName, getStatColor, TaskCompletion } from '@/constants/gameSystem';

interface TaskCompletionInterfaceProps {
  visible: boolean;
  onClose: () => void;
  onTaskComplete: (task: TaskCompletion) => void;
}

const TASK_CATEGORIES = [
  {
    stat: 'wealth' as StatType,
    label: 'Business/Money',
    examples: 'Client work, invoicing, marketing, networking, sales',
    basePoints: 15
  },
  {
    stat: 'strength' as StatType,
    label: 'Physical/Work',
    examples: 'Gym, exercise, physical tasks, manual work, endurance',
    basePoints: 12
  },
  {
    stat: 'wisdom' as StatType,
    label: 'Learning/Study',
    examples: 'Reading, courses, research, skill development, analysis',
    basePoints: 18
  },
  {
    stat: 'luck' as StatType,
    label: 'Misc/Random',
    examples: 'Social tasks, creative work, experiments, life admin',
    basePoints: 10
  }
];

export default function TaskCompletionInterface({
  visible,
  onClose,
  onTaskComplete
}: TaskCompletionInterfaceProps) {
  const [selectedCategory, setSelectedCategory] = useState<StatType>('strength');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [customPoints, setCustomPoints] = useState('');

  const resetForm = () => {
    setTaskTitle('');
    setTaskDescription('');
    setCustomPoints('');
    setSelectedCategory('strength');
  };

  const handleComplete = () => {
    if (!taskTitle.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    const category = TASK_CATEGORIES.find(cat => cat.stat === selectedCategory);
    const points = customPoints ? parseInt(customPoints) : category?.basePoints || 10;

    if (points < 1 || points > 50) {
      Alert.alert('Error', 'Points must be between 1 and 50');
      return;
    }

    const task: TaskCompletion = {
      id: Date.now().toString(),
      title: taskTitle.trim(),
      description: taskDescription.trim(),
      category: selectedCategory,
      pointsEarned: points,
      completedAt: new Date().toISOString(),
      sessionId: `session_${Date.now()}`
    };

    onTaskComplete(task);
    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>🏆 CLAIM YOUR VICTORY</Text>
            <Text style={styles.subtitle}>Record your completed work and gain power</Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Task Title */}
            <View style={styles.section}>
              <Text style={styles.label}>Task Completed</Text>
              <TextInput
                style={styles.input}
                placeholder="What did you accomplish?"
                placeholderTextColor="#666"
                value={taskTitle}
                onChangeText={setTaskTitle}
                maxLength={50}
              />
            </View>

            {/* Task Description */}
            <View style={styles.section}>
              <Text style={styles.label}>Details (Optional)</Text>
              <TextInput
                style={[styles.input, styles.descriptionInput]}
                placeholder="Describe your victory..."
                placeholderTextColor="#666"
                value={taskDescription}
                onChangeText={setTaskDescription}
                multiline
                maxLength={200}
              />
            </View>

            {/* Category Selection */}
            <View style={styles.section}>
              <Text style={styles.label}>Power Category</Text>
              <View style={styles.categoryGrid}>
                {TASK_CATEGORIES.map((category) => (
                  <TouchableOpacity
                    key={category.stat}
                    style={[
                      styles.categoryCard,
                      selectedCategory === category.stat && styles.selectedCategory,
                      { borderColor: getStatColor(category.stat) }
                    ]}
                    onPress={() => setSelectedCategory(category.stat)}
                  >
                    <Text style={styles.categoryEmoji}>{getStatEmoji(category.stat)}</Text>
                    <Text style={[styles.categoryName, { color: getStatColor(category.stat) }]}>
                      {getStatName(category.stat)}
                    </Text>
                    <Text style={styles.categoryLabel}>{category.label}</Text>
                    <Text style={styles.categoryExamples}>{category.examples}</Text>
                    <Text style={styles.categoryPoints}>+{category.basePoints} points</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Custom Points */}
            <View style={styles.section}>
              <Text style={styles.label}>Custom Points (Optional)</Text>
              <TextInput
                style={[styles.input, styles.pointsInput]}
                placeholder="1-50"
                placeholderTextColor="#666"
                value={customPoints}
                onChangeText={setCustomPoints}
                keyboardType="numeric"
                maxLength={2}
              />
              <Text style={styles.pointsHint}>
                Leave empty for default ({TASK_CATEGORIES.find(c => c.stat === selectedCategory)?.basePoints} points)
              </Text>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
              <Text style={styles.completeText}>CLAIM POWER</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '95%',
    maxHeight: '90%',
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#ff4444',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff4444',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 16,
  },
  descriptionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  pointsInput: {
    width: 80,
  },
  pointsHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#2a2a2a',
    borderWidth: 2,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  selectedCategory: {
    backgroundColor: '#333',
    borderWidth: 3,
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 5,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#fff',
    marginBottom: 5,
    textAlign: 'center',
  },
  categoryExamples: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
    marginBottom: 5,
  },
  categoryPoints: {
    fontSize: 11,
    color: '#44ff44',
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
    gap: 15,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#444',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  completeButton: {
    flex: 2,
    padding: 15,
    backgroundColor: '#ff4444',
    borderRadius: 8,
    alignItems: 'center',
  },
  completeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});