import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Button, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; // Add this import

// Define the log entry type
interface LogEntry {
  id: string;
  text: string;
  date: string; // ISO string
}

interface TerminalDiaryPageProps {
  storageKey: string;
  title: string;
}

const TerminalDiaryPage: React.FC<TerminalDiaryPageProps> = ({ storageKey, title }) => {
  const [text, setText] = useState('');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  // Load logs on mount
  useEffect(() => {
    const loadLogs = async () => {
      const saved = await AsyncStorage.getItem(storageKey);
      if (saved) setLogs(JSON.parse(saved));
    };
    loadLogs();
  }, [storageKey]);

  // Save logs to storage
  const saveLogsToStorage = async (updatedLogs: LogEntry[]) => {
    setLogs(updatedLogs);
    await AsyncStorage.setItem(storageKey, JSON.stringify(updatedLogs));
  };

  // Add new log
  const saveLog = async () => {
    if (!text.trim()) return;
    const newLog: LogEntry = {
      id: Date.now().toString(),
      text: text.trim(),
      date: new Date().toISOString(),
    };
    const updatedLogs = [...logs, newLog];
    await saveLogsToStorage(updatedLogs);
    setText('');
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  };

  // Start editing a log
  const startEdit = (id: string, currentText: string) => {
    setEditingId(id);
    setEditingText(currentText);
  };

  // Save edited log
  const saveEdit = async () => {
    if (!editingId) return;
    const updatedLogs = logs.map(log =>
      log.id === editingId ? { ...log, text: editingText } : log
    );
    await saveLogsToStorage(updatedLogs);
    setEditingId(null);
    setEditingText('');
  };

  // Delete a log
  const deleteLog = async (id: string) => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          const updatedLogs = logs.filter(log => log.id !== id);
          await saveLogsToStorage(updatedLogs);
        }
      }
    ]);
  };

  // Format date/time
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleString();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#000' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.terminal} ref={scrollRef}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {logs.length === 0 && (
          <Text style={styles.emptyText}>No entries yet.</Text>
        )}
        {logs.map((log) => (
          <View key={log.id} style={styles.logContainer}>
            <View style={styles.logHeader}>
              <Text style={styles.dateText}>{formatDate(log.date)}</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity onPress={() => startEdit(log.id, log.text)}>
                  <Text style={styles.editBtn}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteLog(log.id)}>
                  <Text style={styles.deleteBtn}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
            {editingId === log.id ? (
              <View style={styles.editArea}>
                <TextInput
                  style={styles.editInput}
                  value={editingText}
                  onChangeText={setEditingText}
                  multiline
                  autoFocus
                />
                <Button title="Save" onPress={saveEdit} color="#0f0" />
                <Button title="Cancel" onPress={() => setEditingId(null)} color="#888" />
              </View>
            ) : (
              <Text style={styles.logText}>{log.text}</Text>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type your entry..."
          placeholderTextColor="#666"
          multiline
        />
        <Button title="Enter" onPress={saveLog} color="#0f0" />
      </View>
    </KeyboardAvoidingView>
  );
};

export default function JournalScreen() {
  const [page, setPage] = useState<'thoughts' | 'problems' | 'insights' | 'quotes'>('thoughts');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Page switcher */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.navScroll}
        style={{ maxHeight: 48 }}
      >
        {['thoughts', 'problems', 'insights', 'quotes'].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setPage(tab as any)}
            style={[
              styles.tabBtn,
              page === tab && styles.activeTabBtn,
            ]}
          >
            <Text
              style={[
                styles.tabBtnText,
                page === tab && styles.activeTabBtnText,
              ]}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Render selected terminal page */}
      {page === 'thoughts' && <TerminalDiaryPage storageKey="thoughts" title="Thoughts" />}
      {page === 'problems' && <TerminalDiaryPage storageKey="problems" title="Problems" />}
      {page === 'insights' && <TerminalDiaryPage storageKey="insights" title="Insights" />}
      {page === 'quotes' && <TerminalDiaryPage storageKey="quotes" title="Quotes" />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  terminal: {
    flex: 1,
    padding: 15,
  },
  sectionTitle: {
    color: '#0ff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    letterSpacing: 1,
    alignSelf: 'center',
  },
  emptyText: {
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 30,
  },
  logContainer: {
    backgroundColor: '#111',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#0f0',
    shadowColor: '#0f0',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  dateText: {
    color: '#0ff',
    fontSize: 13,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  editBtn: {
    color: '#ff0',
    marginRight: 10,
    fontWeight: 'bold',
  },
  deleteBtn: {
    color: '#f55',
    fontWeight: 'bold',
  },
  logText: {
    color: '#0f0',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 16,
    marginBottom: 4,
    marginLeft: 5,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#222',
    backgroundColor: '#000',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: '#0f0',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 16,
    padding: 8,
    marginRight: 10,
    backgroundColor: '#111',
    borderRadius: 6,
  },
  navScroll: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#000',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#39FF14',
    paddingHorizontal: 4,
  },
  tabBtn: {
    paddingVertical: 4, // reduced
    paddingHorizontal: 10, // reduced
    borderRadius: 6,
    marginHorizontal: 2,
  },
  activeTabBtn: {
    borderBottomWidth: 3,
    borderBottomColor: '#39FF14',
    backgroundColor: '#111',
  },
  tabBtnText: {
    color: '#39FF14',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 15, // reduced
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  activeTabBtnText: {
    color: '#39FF14',
    textShadowColor: '#39FF14',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  editArea: {
    marginTop: 8,
    marginBottom: 4,
  },
  editInput: {
    color: '#0f0',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 16,
    backgroundColor: '#222',
    borderRadius: 6,
    padding: 8,
    marginBottom: 6,
    minHeight: 40,
  },
});
