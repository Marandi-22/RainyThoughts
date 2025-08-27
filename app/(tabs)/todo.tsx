import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Button } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { dailyTasks } from '@/constants/Tasks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link } from 'expo-router';

const TODO_STORAGE_KEY_PREFIX = 'todo_data_';

const ToDoScreen = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState<{ id: string; text: string }[]>([]);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [newTaskText, setNewTaskText] = useState('');

  const getStorageKey = (date: Date) => {
    return `${TODO_STORAGE_KEY_PREFIX}${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  };

  useEffect(() => {
    const loadTasks = async () => {
      const storageKey = getStorageKey(selectedDate);
      try {
        const data = await AsyncStorage.getItem(storageKey);
        if (data) {
          setTasks(JSON.parse(data));
        } else {
          setTasks(dailyTasks[selectedDate.getDay()] || []);
        }
      } catch (error) {
        console.error('Failed to load tasks', error);
        setTasks(dailyTasks[selectedDate.getDay()] || []);
      }
    };

    const loadCompletedTasks = async () => {
      try {
        const data = await AsyncStorage.getItem('completed_tasks');
        if (data) {
          setCompletedTasks(JSON.parse(data));
        }
      } catch (error) {
        console.error('Failed to load completed tasks', error);
      }
    };

    loadTasks();
    loadCompletedTasks();
  }, [selectedDate]);

  const saveTasks = async (newTasks: { id: string; text: string }[]) => {
    const storageKey = getStorageKey(selectedDate);
    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(newTasks));
      setTasks(newTasks);
    } catch (error) {
      console.error('Failed to save tasks', error);
    }
  };

  const saveCompletedTasks = async (newCompletedTasks: string[]) => {
    try {
      await AsyncStorage.setItem('completed_tasks', JSON.stringify(newCompletedTasks));
      setCompletedTasks(newCompletedTasks);
    } catch (error) {
      console.error('Failed to save completed tasks', error);
    }
  };

  const addTask = () => {
    if (newTaskText.trim()) {
      const newTask = { id: Date.now().toString(), text: newTaskText.trim() };
      const newTasks = [...tasks, newTask];
      saveTasks(newTasks);
      setNewTaskText('');
    }
  };

  const removeTask = (taskId: string) => {
    const newTasks = tasks.filter((task) => task.id !== taskId);
    saveTasks(newTasks);
  };

  const toggleTaskCompletion = (taskId: string) => {
    const newCompletedTasks = completedTasks.includes(taskId)
      ? completedTasks.filter((id) => id !== taskId)
      : [...completedTasks, taskId];
    saveCompletedTasks(newCompletedTasks);
  };

  const renderCalendar = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() - date.getDay() + i);
      dates.push(date);
    }

    return (
      <View style={styles.calendarContainer}>
        {dates.map((date, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dateContainer,
              selectedDate.toDateString() === date.toDateString() && styles.selectedDate,
            ]}
            onPress={() => setSelectedDate(date)}
          >
            <Text style={styles.dayText}>{days[date.getDay()]}</Text>
            <Text style={styles.dateText}>{date.getDate()}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={styles.title}>To-Do List</ThemedText>
        <Link href="/WeeklyStats" asChild>
          <TouchableOpacity style={styles.statsButton}>
            <ThemedText style={styles.statsButtonText}>Stats</ThemedText>
          </TouchableOpacity>
        </Link>
      </View>
      {renderCalendar()}
      <View style={styles.addTaskContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a new task..."
          placeholderTextColor="#888"
          value={newTaskText}
          onChangeText={setNewTaskText}
        />
        <Button title="Add" onPress={addTask} color="#0f0" />
      </View>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.taskContainer}>
            <TouchableOpacity
              style={styles.taskTouchable}
              onPress={() => toggleTaskCompletion(item.id)}
            >
              <View style={[
                styles.checkbox,
                completedTasks.includes(item.id) && styles.checked,
              ]} />
              <Text style={[
                styles.taskText,
                completedTasks.includes(item.id) && styles.completedTaskText,
              ]}>
                {item.text}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => removeTask(item.id)}>
              <Text style={styles.deleteButton}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#0f0',
    textAlign: 'center',
  },
  statsButton: {
    backgroundColor: '#0f0',
    padding: 10,
    borderRadius: 5,
  },
  statsButtonText: {
    color: '#000',
    fontWeight: 'bold',
  },
  calendarContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  dateContainer: {
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
  },
  selectedDate: {
    backgroundColor: '#0f0',
  },
  dayText: {
    color: '#fff',
  },
  dateText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  addTaskContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: '#111',
    color: '#fff',
    padding: 10,
    borderRadius: 5,
    marginRight: 10,
  },
  taskContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#111',
    borderRadius: 10,
    marginBottom: 10,
  },
  taskTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#0f0',
    marginRight: 15,
  },
  checked: {
    backgroundColor: '#0f0',
  },
  taskText: {
    color: '#fff',
  },
  completedTaskText: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  deleteButton: {
    color: 'red',
  },
});

export default ToDoScreen;
