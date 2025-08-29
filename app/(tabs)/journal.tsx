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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <View style={{ flex: 1 }}>
        <ScrollView
          style={styles.terminal}
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 80 }}
        >
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
            blurOnSubmit={false}
            onSubmitEditing={saveLog}
          />
          <Button title="Enter" onPress={saveLog} color="#0f0" />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const books = [
  { key: 'thoughts', title: 'Thoughts', color: '#8A2BE2' },
  { key: 'problems', title: 'Problems', color: '#FF4500' },
  { key: 'insights', title: 'Insights', color: '#228B22' },
  { key: 'quotes', title: 'Quotes', color: '#4682B4' },
];

export default function JournalScreen() {
  const [selectedBook, setSelectedBook] = useState<string | null>(null);

  if (selectedBook) {
    const book = books.find(b => b.key === selectedBook);
    if (!book) return null;

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
        <TouchableOpacity onPress={() => setSelectedBook(null)} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back to Bookshelf</Text>
        </TouchableOpacity>
        <TerminalDiaryPage storageKey={book.key} title={book.title} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      <Text style={styles.bookshelfTitle}>My Journal</Text>
      <View style={styles.bookshelf}>
        {books.map((book, index) => (
          <TouchableOpacity
            key={book.key}
            style={[styles.book, { backgroundColor: book.color, transform: [{ rotate: '-2deg' }] }]}
            onPress={() => setSelectedBook(book.key)}
          >
            <Text style={styles.bookTitle}>{book.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.shelf} />
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
    minHeight: 54,
  },
  input: {
    flex: 1,
    color: '#0f0',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 16,
    padding: 10,
    marginRight: 10,
    backgroundColor: '#111',
    borderRadius: 6,
    minHeight: 40,
    maxHeight: 90,
    textAlignVertical: 'top',
  },
  navScroll: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 12, // increased
    backgroundColor: '#000',
    marginBottom: 6,
    borderBottomWidth: 1.5, // thinner
    borderBottomColor: '#39FF14',
    paddingHorizontal: 8, // more padding
    minHeight: 54, // ensure height
  },
  tabBtn: {
    paddingVertical: 8, // increased
    paddingHorizontal: 18, // increased
    borderRadius: 6,
    marginHorizontal: 4,
    minWidth: 80, // ensure width for text
  },
  activeTabBtn: {
    borderBottomWidth: 2,
    borderBottomColor: '#39FF14',
    backgroundColor: '#111',
  },
  tabBtnText: {
    color: '#39FF14',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 17, // increased
    fontWeight: 'bold',
    letterSpacing: 1,
    paddingBottom: 2,
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
  bookshelfTitle: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    fontFamily: 'serif',
  },
  bookshelf: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: 250,
    paddingHorizontal: 20,
  },
  book: {
    width: 40,
    height: 200,
    borderRadius: 4,
    marginHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 10,
  },
  bookTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    transform: [{ rotate: '90deg' }],
    width: 180,
    textAlign: 'center',
  },
  shelf: {
    height: 10,
    backgroundColor: '#4a2c2a',
    marginHorizontal: 20,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 5,
  },
  backButton: {
    padding: 10,
    backgroundColor: '#333',
  },
  backButtonText: {
    color: '#fff',
    textAlign: 'center',
  },
});
