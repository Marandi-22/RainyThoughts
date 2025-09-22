import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define the log entry type
interface LogEntry {
  id: string;
  text: string;
  date: string; // ISO string
}

interface GrimoirePageProps {
  storageKey: string;
  title: string;
  emoji: string;
  description: string;
}

const GrimoirePage: React.FC<GrimoirePageProps> = ({ storageKey, title, emoji, description }) => {
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
    Alert.alert('Destroy Entry', 'Are you sure you want to erase this from the grimoire?', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Destroy', style: 'destructive', onPress: async () => {
          const updatedLogs = logs.filter(log => log.id !== id);
          await saveLogsToStorage(updatedLogs);
        }
      }
    ]);
  };

  // Format date/time
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `Day ${Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))} ago • ${d.toLocaleDateString()}`;
  };

  return (
    <KeyboardAvoidingView
      style={styles.pageContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <View style={styles.parchmentContainer}>
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>{emoji} {title.toUpperCase()}</Text>
          <Text style={styles.pageDescription}>{description}</Text>
          <View style={styles.dividerLine} />
        </View>

        <ScrollView
          style={styles.scrollArea}
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollContent}
        >
          {logs.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>This grimoire page awaits your wisdom...</Text>
              <Text style={styles.emptyHint}>Inscribe your first entry below</Text>
            </View>
          )}

          {logs.map((log, index) => (
            <View key={log.id} style={styles.entryContainer}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryNumber}>Entry #{logs.length - index}</Text>
                <Text style={styles.entryDate}>{formatDate(log.date)}</Text>
              </View>

              {editingId === log.id ? (
                <View style={styles.editContainer}>
                  <TextInput
                    style={styles.editInput}
                    value={editingText}
                    onChangeText={setEditingText}
                    multiline
                    autoFocus
                    placeholder="Revise your inscription..."
                    placeholderTextColor="#8B4513"
                  />
                  <View style={styles.editActions}>
                    <TouchableOpacity style={styles.saveBtn} onPress={saveEdit}>
                      <Text style={styles.saveBtnText}>✒️ INSCRIBE</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingId(null)}>
                      <Text style={styles.cancelBtnText}>❌ CANCEL</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <>
                  <Text style={styles.entryText}>{log.text}</Text>
                  <View style={styles.entryActions}>
                    <TouchableOpacity onPress={() => startEdit(log.id, log.text)} style={styles.actionBtn}>
                      <Text style={styles.editBtnText}>✏️ REVISE</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteLog(log.id)} style={styles.actionBtn}>
                      <Text style={styles.deleteBtnText}>🔥 DESTROY</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Writing Area */}
        <View style={styles.writingArea}>
          <Text style={styles.writingLabel}>✒️ INSCRIBE NEW ENTRY</Text>
          <TextInput
            style={styles.writingInput}
            value={text}
            onChangeText={setText}
            placeholder="Share your demon-crushing wisdom..."
            placeholderTextColor="#8B4513"
            multiline
            blurOnSubmit={false}
            onSubmitEditing={saveLog}
          />
          <TouchableOpacity style={styles.inscribeBtn} onPress={saveLog}>
            <Text style={styles.inscribeBtnText}>📜 COMMIT TO GRIMOIRE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const grimoireBooks = [
  {
    key: 'thoughts',
    title: 'Mind Scrolls',
    emoji: '🧠',
    description: 'Record your inner battles and mental victories',
    borderColor: '#8A2BE2'
  },
  {
    key: 'problems',
    title: 'Demon Catalog',
    emoji: '👹',
    description: 'Document the demons you face and their weaknesses',
    borderColor: '#FF4500'
  },
  {
    key: 'insights',
    title: 'War Wisdom',
    emoji: '⚡',
    description: 'Capture battle-tested insights and strategies',
    borderColor: '#FFD700'
  },
  {
    key: 'quotes',
    title: 'Power Words',
    emoji: '🗡️',
    description: 'Forge weapons from words that strengthen your soul',
    borderColor: '#FF6B6B'
  },
];

export default function DemonGrimoire() {
  const [selectedBook, setSelectedBook] = useState<string | null>(null);

  if (selectedBook) {
    const book = grimoireBooks.find(b => b.key === selectedBook);
    if (!book) return null;

    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity onPress={() => setSelectedBook(null)} style={styles.backButton}>
          <Text style={styles.backButtonText}>⬅️ BACK TO GRIMOIRE</Text>
        </TouchableOpacity>
        <GrimoirePage
          storageKey={book.key}
          title={book.title}
          emoji={book.emoji}
          description={book.description}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.grimoireContainer}>
        {/* Grimoire Header */}
        <View style={styles.grimoireHeader}>
          <Text style={styles.grimoireTitle}>📜 DEMON CRUSHER'S GRIMOIRE 📜</Text>
          <Text style={styles.grimoireSubtitle}>Ancient Wisdom for Modern Battles</Text>
          <View style={styles.headerDivider} />
        </View>

        {/* Book Selection */}
        <ScrollView style={styles.booksContainer} contentContainerStyle={styles.booksContent}>
          {grimoireBooks.map((book) => (
            <TouchableOpacity
              key={book.key}
              style={[styles.bookTablet, { borderColor: book.borderColor }]}
              onPress={() => setSelectedBook(book.key)}
            >
              <View style={styles.tabletHeader}>
                <Text style={styles.bookEmoji}>{book.emoji}</Text>
                <Text style={[styles.bookTitle, { color: book.borderColor }]}>{book.title}</Text>
              </View>
              <Text style={styles.bookDescription}>{book.description}</Text>
              <View style={styles.tabletFooter}>
                <Text style={styles.tapHint}>Tap to open grimoire</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Footer Decoration */}
        <View style={styles.grimoireFooter}>
          <Text style={styles.footerText}>⚔️ Knowledge is the sharpest weapon ⚔️</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },

  // Grimoire Main Screen
  grimoireContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  grimoireHeader: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    borderBottomWidth: 2,
    borderBottomColor: '#FF4444',
  },
  grimoireTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF4444',
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 5,
  },
  grimoireSubtitle: {
    fontSize: 14,
    color: '#CCCCCC',
    fontFamily: 'monospace',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  headerDivider: {
    width: '80%',
    height: 2,
    backgroundColor: '#FF4444',
    marginTop: 10,
  },

  // Book Selection
  booksContainer: {
    flex: 1,
  },
  booksContent: {
    padding: 20,
    gap: 20,
  },
  bookTablet: {
    backgroundColor: '#222222',
    borderWidth: 3,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  tabletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  bookEmoji: {
    fontSize: 32,
    marginRight: 15,
  },
  bookTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    flex: 1,
  },
  bookDescription: {
    fontSize: 14,
    color: '#AAAAAA',
    fontFamily: 'monospace',
    lineHeight: 20,
    marginBottom: 15,
  },
  tabletFooter: {
    alignItems: 'center',
  },
  tapHint: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'monospace',
    fontStyle: 'italic',
  },

  // Grimoire Footer
  grimoireFooter: {
    padding: 15,
    backgroundColor: '#0A0A0A',
    borderTopWidth: 1,
    borderTopColor: '#333333',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#888888',
    fontFamily: 'monospace',
    fontStyle: 'italic',
  },

  // Page Container
  pageContainer: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  parchmentContainer: {
    flex: 1,
    backgroundColor: '#2A1F1A',
    margin: 10,
    borderRadius: 15,
    borderWidth: 3,
    borderColor: '#8B4513',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 10,
  },

  // Page Header
  pageHeader: {
    padding: 20,
    backgroundColor: '#3A2F2A',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#8B4513',
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 5,
  },
  pageDescription: {
    fontSize: 12,
    color: '#DEB887',
    fontFamily: 'monospace',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  dividerLine: {
    width: '100%',
    height: 2,
    backgroundColor: '#8B4513',
    marginTop: 10,
  },

  // Scroll Area
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#DEB887',
    fontFamily: 'monospace',
    textAlign: 'center',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  emptyHint: {
    fontSize: 12,
    color: '#8B4513',
    fontFamily: 'monospace',
    textAlign: 'center',
  },

  // Entry Container
  entryContainer: {
    backgroundColor: '#3A2F2A',
    borderWidth: 2,
    borderColor: '#8B4513',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#8B4513',
  },
  entryNumber: {
    fontSize: 12,
    color: '#FFD700',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  entryDate: {
    fontSize: 11,
    color: '#DEB887',
    fontFamily: 'monospace',
    fontStyle: 'italic',
  },
  entryText: {
    fontSize: 16,
    color: '#F5DEB3',
    fontFamily: 'monospace',
    lineHeight: 24,
    marginBottom: 12,
  },
  entryActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 15,
  },
  actionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editBtnText: {
    fontSize: 10,
    color: '#87CEEB',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },
  deleteBtnText: {
    fontSize: 10,
    color: '#FF6B6B',
    fontFamily: 'monospace',
    fontWeight: 'bold',
  },

  // Edit Container
  editContainer: {
    marginTop: 5,
  },
  editInput: {
    backgroundColor: '#4A3F3A',
    borderWidth: 2,
    borderColor: '#8B4513',
    borderRadius: 8,
    padding: 12,
    color: '#F5DEB3',
    fontFamily: 'monospace',
    fontSize: 16,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  saveBtn: {
    backgroundColor: '#228B22',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  cancelBtn: {
    backgroundColor: '#8B4513',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },

  // Writing Area
  writingArea: {
    backgroundColor: '#3A2F2A',
    borderTopWidth: 2,
    borderTopColor: '#8B4513',
    padding: 15,
  },
  writingLabel: {
    fontSize: 12,
    color: '#FFD700',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  writingInput: {
    backgroundColor: '#4A3F3A',
    borderWidth: 2,
    borderColor: '#8B4513',
    borderRadius: 8,
    padding: 12,
    color: '#F5DEB3',
    fontFamily: 'monospace',
    fontSize: 16,
    minHeight: 60,
    maxHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  inscribeBtn: {
    backgroundColor: '#8B4513',
    borderWidth: 2,
    borderColor: '#DEB887',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  inscribeBtnText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },

  // Back Button
  backButton: {
    backgroundColor: '#8B4513',
    padding: 12,
    margin: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#DEB887',
  },
  backButtonText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: 'monospace',
  },
});