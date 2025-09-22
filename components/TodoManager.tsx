import React, { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatType, getStatEmoji, getStatName, getStatColor } from '@/constants/gameSystem';

export type QuestType = 'daily' | 'main';
export type CompletionMethod = 'pomodoro' | 'manual' | 'both';

export interface Todo {
  id: string;
  title: string;
  description: string;
  category: StatType;
  pointsWorth: number;
  completed: boolean;
  createdAt: string;
  completedAt?: string;

  // New quest system properties
  questType: QuestType;
  completionMethod: CompletionMethod;
  pomodorosRequired?: number;  // For quests requiring multiple sessions
  pomodorosCompleted: number;
  expiresAt?: string;          // For daily quests and deadlines
  deadline?: string;           // Optional specific deadline
}

interface TodoManagerProps {
  visible: boolean;
  onClose: () => void;
  onTodoComplete: (todo: Todo) => void;
}

const STAT_CATEGORIES = [
  {
    stat: 'wealth' as StatType,
    label: '💰 WEALTH BUILDING',
    examples: 'Client work, invoicing, business tasks, marketing, sales calls',
    defaultPoints: 15,
    color: '#FFD700'
  },
  {
    stat: 'strength' as StatType,
    label: '💪 STRENGTH BUILDING',
    examples: 'Gym, exercise, physical work, manual tasks, endurance training',
    defaultPoints: 12,
    color: '#FF4444'
  },
  {
    stat: 'wisdom' as StatType,
    label: '🧠 WISDOM BUILDING',
    examples: 'Studying, reading, courses, research, skill development, college work',
    defaultPoints: 18,
    color: '#4488FF'
  },
  {
    stat: 'luck' as StatType,
    label: '🎯 LUCK BUILDING',
    examples: 'Social tasks, creative work, networking, life admin, experiments',
    defaultPoints: 10,
    color: '#44FF44'
  }
];

export default function TodoManager({ visible, onClose, onTodoComplete }: TodoManagerProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<StatType>('strength');
  const [todoTitle, setTodoTitle] = useState('');
  const [todoDescription, setTodoDescription] = useState('');
  const [customPoints, setCustomPoints] = useState('');
  const [questType, setQuestType] = useState<QuestType>('daily');
  const [completionMethod, setCompletionMethod] = useState<CompletionMethod>('both');
  const [pomodorosRequired, setPomodorosRequired] = useState('');
  const [hasDeadline, setHasDeadline] = useState(false);
  const [deadlineDays, setDeadlineDays] = useState('');

  // Load todos on mount
  useEffect(() => {
    if (visible) {
      loadTodos();
    }
  }, [visible]);

  const loadTodos = async () => {
    try {
      const stored = await AsyncStorage.getItem('rpg_todos');
      if (stored) {
        const todoData = JSON.parse(stored);
        setTodos(todoData);
      }
    } catch (error) {
      console.error('Error loading todos:', error);
    }
  };

  const saveTodos = async (todoList: Todo[]) => {
    try {
      await AsyncStorage.setItem('rpg_todos', JSON.stringify(todoList));
    } catch (error) {
      console.error('Error saving todos:', error);
    }
  };

  const addTodo = () => {
    if (!todoTitle.trim()) {
      Alert.alert('Error', 'Please enter a quest title');
      return;
    }

    const category = STAT_CATEGORIES.find(cat => cat.stat === selectedCategory);
    const points = customPoints ? parseInt(customPoints) : category?.defaultPoints || 10;

    if (points < 1 || points > 50) {
      Alert.alert('Error', 'Points must be between 1 and 50');
      return;
    }

    if (pomodorosRequired && (parseInt(pomodorosRequired) < 1 || parseInt(pomodorosRequired) > 20)) {
      Alert.alert('Error', 'Pomodoros required must be between 1 and 20');
      return;
    }

    // Calculate expiration for daily quests
    const now = new Date();
    const expiresAt = questType === 'daily'
      ? new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0).toISOString()
      : undefined;

    // Calculate deadline if specified
    const deadline = hasDeadline && deadlineDays
      ? new Date(now.getTime() + parseInt(deadlineDays) * 24 * 60 * 60 * 1000).toISOString()
      : undefined;

    const newTodo: Todo = {
      id: Date.now().toString(),
      title: todoTitle.trim(),
      description: todoDescription.trim(),
      category: selectedCategory,
      pointsWorth: points,
      completed: false,
      createdAt: new Date().toISOString(),
      questType,
      completionMethod,
      pomodorosRequired: pomodorosRequired ? parseInt(pomodorosRequired) : undefined,
      pomodorosCompleted: 0,
      expiresAt,
      deadline
    };

    const updatedTodos = [...todos, newTodo];
    setTodos(updatedTodos);
    saveTodos(updatedTodos);

    // Reset form
    setTodoTitle('');
    setTodoDescription('');
    setCustomPoints('');
    setPomodorosRequired('');
    setDeadlineDays('');
    setHasDeadline(false);
    setShowAddForm(false);
  };

  const completeTodo = (todoId: string) => {
    const todoToComplete = todos.find(t => t.id === todoId);
    if (!todoToComplete) return;

    const updatedTodos = todos.map(todo =>
      todo.id === todoId
        ? { ...todo, completed: true, completedAt: new Date().toISOString() }
        : todo
    );

    setTodos(updatedTodos);
    saveTodos(updatedTodos);

    // Trigger stat gain
    onTodoComplete({ ...todoToComplete, completed: true, completedAt: new Date().toISOString() });
  };

  const deleteTodo = (todoId: string) => {
    Alert.alert(
      'Delete Todo',
      'Are you sure you want to delete this todo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedTodos = todos.filter(todo => todo.id !== todoId);
            setTodos(updatedTodos);
            saveTodos(updatedTodos);
          }
        }
      ]
    );
  };

  const activeTodos = todos.filter(todo => !todo.completed);
  const completedTodos = todos.filter(todo => todo.completed);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>⚔️ QUEST MANAGEMENT</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Add Todo Button */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddForm(!showAddForm)}
          >
            <Text style={styles.addButtonText}>
              {showAddForm ? '✕ CANCEL' : '+ ADD NEW QUEST'}
            </Text>
          </TouchableOpacity>

          {/* Add Todo Form */}
          {showAddForm && (
            <View style={styles.addForm}>
              <Text style={styles.formTitle}>CREATE NEW QUEST</Text>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Quest Title</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="What needs to be done?"
                  placeholderTextColor="#666"
                  value={todoTitle}
                  onChangeText={setTodoTitle}
                  maxLength={50}
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Description (Optional)</Text>
                <TextInput
                  style={[styles.textInput, styles.descriptionInput]}
                  placeholder="Additional details..."
                  placeholderTextColor="#666"
                  value={todoDescription}
                  onChangeText={setTodoDescription}
                  multiline
                  maxLength={200}
                />
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Stat Category</Text>
                <View style={styles.categoryGrid}>
                  {STAT_CATEGORIES.map((category) => (
                    <TouchableOpacity
                      key={category.stat}
                      style={[
                        styles.categoryOption,
                        selectedCategory === category.stat && styles.selectedCategory,
                        { borderColor: category.color }
                      ]}
                      onPress={() => setSelectedCategory(category.stat)}
                    >
                      <Text style={styles.categoryEmoji}>{getStatEmoji(category.stat)}</Text>
                      <Text style={[styles.categoryName, { color: category.color }]}>
                        {getStatName(category.stat)}
                      </Text>
                      <Text style={styles.categoryPoints}>+{category.defaultPoints} pts</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Quest Type</Text>
                <View style={styles.questTypeSelector}>
                  <TouchableOpacity
                    style={[styles.questTypeBtn, questType === 'daily' && styles.selectedQuestType]}
                    onPress={() => setQuestType('daily')}
                  >
                    <Text style={styles.questTypeBtnText}>🌅 DAILY</Text>
                    <Text style={styles.questTypeDesc}>Expires at midnight</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.questTypeBtn, questType === 'main' && styles.selectedQuestType]}
                    onPress={() => setQuestType('main')}
                  >
                    <Text style={styles.questTypeBtnText}>🎯 MAIN</Text>
                    <Text style={styles.questTypeDesc}>Persists until done</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Completion Method</Text>
                <View style={styles.completionMethodSelector}>
                  <TouchableOpacity
                    style={[styles.methodBtn, completionMethod === 'pomodoro' && styles.selectedMethod]}
                    onPress={() => setCompletionMethod('pomodoro')}
                  >
                    <Text style={styles.methodBtnText}>⏱️ POMODORO ONLY</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.methodBtn, completionMethod === 'manual' && styles.selectedMethod]}
                    onPress={() => setCompletionMethod('manual')}
                  >
                    <Text style={styles.methodBtnText}>✋ MANUAL ONLY</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.methodBtn, completionMethod === 'both' && styles.selectedMethod]}
                    onPress={() => setCompletionMethod('both')}
                  >
                    <Text style={styles.methodBtnText}>🔄 BOTH</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {completionMethod !== 'manual' && (
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Pomodoros Required (Optional)</Text>
                  <TextInput
                    style={[styles.textInput, styles.pointsInput]}
                    placeholder="1-20"
                    placeholderTextColor="#666"
                    value={pomodorosRequired}
                    onChangeText={setPomodorosRequired}
                    keyboardType="numeric"
                    maxLength={2}
                  />
                  <Text style={styles.inputHint}>Leave empty for single session quests</Text>
                </View>
              )}

              <View style={styles.inputSection}>
                <View style={styles.deadlineToggle}>
                  <TouchableOpacity
                    style={[styles.toggleBtn, hasDeadline && styles.activeToggle]}
                    onPress={() => setHasDeadline(!hasDeadline)}
                  >
                    <Text style={styles.toggleBtnText}>{hasDeadline ? '✅' : '⬜'} Set Deadline</Text>
                  </TouchableOpacity>
                </View>
                {hasDeadline && (
                  <TextInput
                    style={[styles.textInput, styles.pointsInput]}
                    placeholder="Days from now"
                    placeholderTextColor="#666"
                    value={deadlineDays}
                    onChangeText={setDeadlineDays}
                    keyboardType="numeric"
                    maxLength={3}
                  />
                )}
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Custom Points (Optional)</Text>
                <TextInput
                  style={[styles.textInput, styles.pointsInput]}
                  placeholder="1-50"
                  placeholderTextColor="#666"
                  value={customPoints}
                  onChangeText={setCustomPoints}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>

              <TouchableOpacity style={styles.createButton} onPress={addTodo}>
                <Text style={styles.createButtonText}>⚔️ CREATE QUEST</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Active Todos */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 ACTIVE QUESTS ({activeTodos.length})</Text>
            {activeTodos.length === 0 ? (
              <Text style={styles.emptyText}>No active quests. Add some to start gaining power!</Text>
            ) : (
              activeTodos.map(todo => (
                <View key={todo.id} style={styles.todoItem}>
                  <View style={styles.todoHeader}>
                    <View style={styles.todoInfo}>
                      <View style={styles.todoTitleRow}>
                        <Text style={styles.todoTitle}>{todo.title}</Text>
                        <View style={styles.questBadges}>
                          <Text style={[styles.questTypeBadge, todo.questType === 'daily' ? styles.dailyBadge : styles.mainBadge]}>
                            {todo.questType === 'daily' ? '🌅' : '🎯'}
                          </Text>
                          <Text style={styles.methodBadge}>
                            {todo.completionMethod === 'pomodoro' ? '⏱️' :
                             todo.completionMethod === 'manual' ? '✋' : '🔄'}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.todoCategory}>
                        {getStatEmoji(todo.category)} {getStatName(todo.category)} (+{todo.pointsWorth} pts)
                      </Text>

                      {todo.pomodorosRequired && (
                        <Text style={styles.pomodoroProgress}>
                          🍅 {todo.pomodorosCompleted}/{todo.pomodorosRequired} sessions
                        </Text>
                      )}

                      {todo.expiresAt && (
                        <Text style={styles.expirationText}>
                          ⏰ Expires: {new Date(todo.expiresAt).toLocaleDateString()}
                        </Text>
                      )}

                      {todo.deadline && (
                        <Text style={styles.deadlineText}>
                          📅 Deadline: {new Date(todo.deadline).toLocaleDateString()}
                        </Text>
                      )}

                      {todo.description && (
                        <Text style={styles.todoDescription}>{todo.description}</Text>
                      )}
                    </View>
                  </View>
                  <View style={styles.todoActions}>
                    <TouchableOpacity
                      style={styles.completeButton}
                      onPress={() => completeTodo(todo.id)}
                    >
                      <Text style={styles.completeButtonText}>✓ COMPLETE</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteTodo(todo.id)}
                    >
                      <Text style={styles.deleteButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Completed Todos */}
          {completedTodos.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✅ COMPLETED ({completedTodos.length})</Text>
              {completedTodos.slice(-5).map(todo => (
                <View key={todo.id} style={[styles.todoItem, styles.completedTodo]}>
                  <Text style={styles.completedTodoTitle}>✓ {todo.title}</Text>
                  <Text style={styles.completedTodoCategory}>
                    {getStatEmoji(todo.category)} +{todo.pointsWorth} {getStatName(todo.category)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#ff4444',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff4444',
    fontFamily: 'monospace',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 18,
    color: '#ff4444',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  addButton: {
    backgroundColor: '#ff4444',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  addForm: {
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#ff4444',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'monospace',
  },
  inputSection: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    fontFamily: 'monospace',
  },
  textInput: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 6,
    padding: 12,
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  descriptionInput: {
    height: 60,
    textAlignVertical: 'top',
  },
  pointsInput: {
    width: 80,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    width: '48%',
    backgroundColor: '#2a2a2a',
    borderWidth: 2,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  selectedCategory: {
    backgroundColor: '#333',
    borderWidth: 3,
  },
  categoryEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  categoryPoints: {
    fontSize: 10,
    color: '#44ff44',
    fontFamily: 'monospace',
  },

  // Quest Type Selector
  questTypeSelector: {
    flexDirection: 'row',
    gap: 10,
  },
  questTypeBtn: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderWidth: 2,
    borderColor: '#444',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  selectedQuestType: {
    borderColor: '#ff4444',
    backgroundColor: '#331111',
  },
  questTypeBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginBottom: 3,
  },
  questTypeDesc: {
    color: '#888',
    fontSize: 10,
    fontFamily: 'monospace',
    textAlign: 'center',
  },

  // Completion Method Selector
  completionMethodSelector: {
    flexDirection: 'row',
    gap: 5,
  },
  methodBtn: {
    flex: 1,
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
  },
  selectedMethod: {
    borderColor: '#4488ff',
    backgroundColor: '#111133',
  },
  methodBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: 'monospace',
    textAlign: 'center',
  },

  // Deadline Toggle
  deadlineToggle: {
    marginBottom: 10,
  },
  toggleBtn: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 6,
    padding: 10,
    alignItems: 'center',
  },
  activeToggle: {
    borderColor: '#ffd700',
    backgroundColor: '#332211',
  },
  toggleBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'monospace',
  },

  // Input Hint
  inputHint: {
    fontSize: 10,
    color: '#666',
    marginTop: 3,
    fontFamily: 'monospace',
  },
  createButton: {
    backgroundColor: '#44ff44',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff4444',
    marginBottom: 10,
    fontFamily: 'monospace',
  },
  emptyText: {
    color: '#666666',
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    padding: 20,
    fontFamily: 'monospace',
  },
  todoItem: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  todoHeader: {
    marginBottom: 8,
  },
  todoInfo: {
    flex: 1,
  },
  todoTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  todoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    fontFamily: 'monospace',
  },
  questBadges: {
    flexDirection: 'row',
    gap: 5,
  },
  questTypeBadge: {
    fontSize: 14,
  },
  dailyBadge: {
    // Daily quest styling
  },
  mainBadge: {
    // Main quest styling
  },
  methodBadge: {
    fontSize: 12,
  },
  pomodoroProgress: {
    fontSize: 12,
    color: '#ff6600',
    fontFamily: 'monospace',
    marginBottom: 3,
  },
  expirationText: {
    fontSize: 11,
    color: '#ff4444',
    fontFamily: 'monospace',
    marginBottom: 3,
  },
  deadlineText: {
    fontSize: 11,
    color: '#ffd700',
    fontFamily: 'monospace',
    marginBottom: 3,
  },
  todoCategory: {
    fontSize: 12,
    color: '#44ff44',
    marginBottom: 4,
    fontFamily: 'monospace',
  },
  todoDescription: {
    fontSize: 12,
    color: '#cccccc',
    fontFamily: 'monospace',
  },
  todoActions: {
    flexDirection: 'row',
    gap: 8,
  },
  completeButton: {
    backgroundColor: '#44ff44',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    flex: 1,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  deleteButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  completedTodo: {
    backgroundColor: '#0a2a0a',
    borderColor: '#44ff44',
    opacity: 0.7,
  },
  completedTodoTitle: {
    fontSize: 14,
    color: '#44ff44',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  completedTodoCategory: {
    fontSize: 12,
    color: '#88cc88',
    fontFamily: 'monospace',
  },
});