import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Todo } from './TodoManager';
import { getStatEmoji, getStatName } from '@/constants/gameSystem';
import { QuestManager } from '@/utils/questUtils';

interface TodoCompletionSelectorProps {
  visible: boolean;
  onClose: () => void;
  onTodoSelect: (todo: Todo) => void;
  onSkip: () => void;
  activeTodos: Todo[];
}

export default function TodoCompletionSelector({
  visible,
  onClose,
  onTodoSelect,
  onSkip,
  activeTodos
}: TodoCompletionSelectorProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>🎯 QUEST COMPLETED!</Text>
            <Text style={styles.subtitle}>Which quest did you just finish?</Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {activeTodos.length === 0 ? (
              <View style={styles.noTodosContainer}>
                <Text style={styles.noTodosText}>No active quests found.</Text>
                <Text style={styles.noTodosHint}>Add some quests to track your progress!</Text>
              </View>
            ) : (
              activeTodos.map(todo => (
                <TouchableOpacity
                  key={todo.id}
                  style={styles.todoOption}
                  onPress={() => onTodoSelect(todo)}
                >
                  <View style={styles.todoInfo}>
                    <Text style={styles.todoTitle}>{todo.title}</Text>
                    <Text style={styles.todoCategory}>
                      {getStatEmoji(todo.category)} {getStatName(todo.category)} (+{todo.pointsWorth} points)
                    </Text>
                    {todo.pomodorosRequired && (
                      <Text style={styles.pomodoroProgress}>
                        🍅 {todo.pomodorosCompleted}/{todo.pomodorosRequired} sessions
                      </Text>
                    )}
                    {todo.completionMethod === 'pomodoro' && (
                      <Text style={styles.methodIndicator}>⏱️ Pomodoro Only</Text>
                    )}
                    {todo.description && (
                      <Text style={styles.todoDescription}>{todo.description}</Text>
                    )}
                  </View>
                  <View style={styles.selectIndicator}>
                    <Text style={styles.selectText}>SELECT</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
              <Text style={styles.skipText}>Skip - No Quest</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
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
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#1a1a1a',
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#4488FF',
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4488FF',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  noTodosContainer: {
    alignItems: 'center',
    padding: 20,
  },
  noTodosText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'monospace',
    marginBottom: 5,
  },
  noTodosHint: {
    fontSize: 12,
    color: '#555',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  todoOption: {
    backgroundColor: '#2a2a2a',
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  todoInfo: {
    flex: 1,
  },
  todoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
    fontFamily: 'monospace',
  },
  todoCategory: {
    fontSize: 14,
    color: '#4488FF',
    marginBottom: 3,
    fontFamily: 'monospace',
  },
  todoDescription: {
    fontSize: 12,
    color: '#aaa',
    fontFamily: 'monospace',
  },
  pomodoroProgress: {
    fontSize: 12,
    color: '#ff6600',
    fontFamily: 'monospace',
    marginBottom: 3,
  },
  methodIndicator: {
    fontSize: 11,
    color: '#4488ff',
    fontFamily: 'monospace',
    marginBottom: 3,
  },
  selectIndicator: {
    backgroundColor: '#44FF44',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
  },
  selectText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  footer: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#333',
    gap: 10,
  },
  skipButton: {
    flex: 1,
    padding: 15,
    backgroundColor: '#666',
    borderRadius: 8,
    alignItems: 'center',
  },
  skipText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: 'monospace',
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
    fontSize: 14,
    fontFamily: 'monospace',
  },
});