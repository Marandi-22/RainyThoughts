import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import {
  loadLetters,
  markLetterAsRead,
  deleteLetter,
  generateMentorLetter,
  getUnreadCount,
  Letter,
} from '../../services/inboxService';
import { CHARACTERS } from '../../constants/characters';
import { getCharacterImage } from '../../constants/imageMapping';

export default function InboxScreen() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const allLetters = await loadLetters();
    setLetters(allLetters);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleOpenLetter = async (letter: Letter) => {
    setSelectedLetter(letter);
    if (!letter.read) {
      await markLetterAsRead(letter.id);
      await loadData();
    }
  };

  const handleDeleteLetter = async (letter: Letter) => {
    Alert.alert('Delete Letter?', 'This cannot be undone', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteLetter(letter.id);
          setSelectedLetter(null);
          await loadData();
        },
      },
    ]);
  };

  const handleGenerateLetter = async (type: 'motivation' | 'wisdom' = 'wisdom') => {
    const mentors = CHARACTERS.filter(c => c.category === 'mentor');
    const randomMentor = mentors[Math.floor(Math.random() * mentors.length)];

    setGenerating(true);
    try {
      await generateMentorLetter(randomMentor, type);
      await loadData();
      const letterType = type === 'wisdom' ? 'shared some wisdom' : 'sent you motivation';
      Alert.alert('📬 New Letter!', `${randomMentor.name} has ${letterType}.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to generate letter');
    } finally {
      setGenerating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF4444" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📬 INBOX</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.generateButton, styles.wisdomButton]}
            onPress={() => handleGenerateLetter('wisdom')}
            disabled={generating}
          >
            {generating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.generateButtonText}>💡 Wisdom</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.generateButton, styles.motivationButton]}
            onPress={() => handleGenerateLetter('motivation')}
            disabled={generating}
          >
            <Text style={styles.generateButtonText}>🔥 Motivation</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {letters.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📭</Text>
            <Text style={styles.emptyText}>No letters yet</Text>
            <Text style={styles.emptySubtext}>Your mentors will send you motivational letters</Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={handleGenerateLetter}
              disabled={generating}
            >
              <Text style={styles.emptyButtonText}>Request a Letter</Text>
            </TouchableOpacity>
          </View>
        ) : (
          letters.map((letter) => (
            <TouchableOpacity
              key={letter.id}
              style={[styles.letterCard, !letter.read && styles.unreadCard]}
              onPress={() => handleOpenLetter(letter)}
            >
              <View style={styles.letterHeader}>
                <View style={styles.fromInfo}>
                  <Text style={styles.fromName}>{letter.from.name}</Text>
                  {!letter.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.letterDate}>{formatDate(letter.createdAt)}</Text>
              </View>
              <Text style={styles.letterSubject}>{letter.subject}</Text>
              <Text style={styles.letterPreview} numberOfLines={2}>
                {letter.message}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Letter Detail Modal */}
      {selectedLetter && (
        <Modal visible={true} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalFrom}>From: {selectedLetter.from.name}</Text>
                  <Text style={styles.modalDate}>{formatDate(selectedLetter.createdAt)}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedLetter(null)}>
                  <Text style={styles.modalClose}>×</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubject}>{selectedLetter.subject}</Text>

              <ScrollView style={styles.modalBody}>
                <Text style={styles.modalMessage}>{selectedLetter.message}</Text>

                <View style={styles.modalSignature}>
                  <Text style={styles.modalSignatureName}>— {selectedLetter.from.name}</Text>
                  <Text style={styles.modalSignatureBio}>{selectedLetter.from.bio}</Text>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteLetter(selectedLetter)}
                >
                  <Text style={styles.deleteButtonText}>🗑 Delete</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedLetter(null)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0a0a',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 2,
    borderBottomColor: '#FF4444',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  generateButton: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: 'center',
  },
  wisdomButton: {
    backgroundColor: '#4A90E2',
  },
  motivationButton: {
    backgroundColor: '#FF4444',
  },
  generateButtonText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
    marginTop: 80,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#FF4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  letterCard: {
    backgroundColor: '#1a1a1a',
    marginHorizontal: 20,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#333',
  },
  unreadCard: {
    borderLeftColor: '#FF4444',
    backgroundColor: '#1a1a1a',
  },
  letterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fromInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fromName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF4444',
  },
  letterDate: {
    fontSize: 12,
    color: '#888',
  },
  letterSubject: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  letterPreview: {
    fontSize: 14,
    color: '#999',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalFrom: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  modalDate: {
    fontSize: 13,
    color: '#888',
  },
  modalClose: {
    fontSize: 36,
    color: '#888',
    lineHeight: 32,
  },
  modalSubject: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    padding: 20,
    paddingBottom: 12,
  },
  modalBody: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modalMessage: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 26,
    marginBottom: 24,
  },
  modalSignature: {
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
    marginBottom: 20,
  },
  modalSignatureName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF4444',
    marginBottom: 8,
  },
  modalSignatureBio: {
    fontSize: 13,
    color: '#888',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#333',
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FF4444',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
