import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native';
import { CHARACTERS, Character } from '../../constants/characters';
import { loadHeroData, HeroData } from '../../constants/gameSystem';
import { CharacterTauntService } from '../../services/characterTauntService';
import { getCharacterImage } from '../../constants/imageMapping';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'mentor';
  timestamp: Date;
}

export default function MentorsScreen() {
  const [selectedMentor, setSelectedMentor] = useState<Character | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [heroData, setHeroData] = useState<HeroData | null>(null);
  const [loading, setLoading] = useState(false);

  const mentors = CHARACTERS.filter((c) => c.category === 'mentor');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await loadHeroData();
    setHeroData(data);
  };

  const handleSelectMentor = (mentor: Character) => {
    setSelectedMentor(mentor);
    setMessages([
      {
        id: Date.now().toString(),
        text: `Hey! I'm ${mentor.name}. I can see your progress, stats, and journal. Ask me anything about your journey!`,
        sender: 'mentor',
        timestamp: new Date(),
      },
    ]);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedMentor || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      // Get AI response from mentor
      const response = await CharacterTauntService.getMentorChatResponse(
        selectedMentor,
        inputText,
        heroData!
      );

      const mentorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        sender: 'mentor',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, mentorMessage]);
    } catch (error) {
      console.error('Error getting mentor response:', error);
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: selectedMentor.fallbackMessages[0],
        sender: 'mentor',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {!selectedMentor ? (
        // Mentor Selection
        <View style={styles.selectionContainer}>
          <Text style={styles.title}>🧭 Choose Your Mentor</Text>
          <Text style={styles.subtitle}>
            Mentors can see your full progress, stats, streak, and journal
          </Text>

          {heroData && (
            <View style={styles.statsPreview}>
              <Text style={styles.statsTitle}>Your Stats:</Text>
              <View style={styles.statsRow}>
                <Text style={styles.statText}>💰 {heroData.stats.wealth}</Text>
                <Text style={styles.statText}>💪 {heroData.stats.strength}</Text>
                <Text style={styles.statText}>🧠 {heroData.stats.wisdom}</Text>
                <Text style={styles.statText}>🍀 {heroData.stats.luck}</Text>
              </View>
              <Text style={styles.streakText}>🔥 {heroData.streakDays} day streak</Text>
              <Text style={styles.levelText}>Level {heroData.level}</Text>
            </View>
          )}

          <ScrollView style={styles.mentorsList}>
            {mentors.map((mentor) => (
              <TouchableOpacity
                key={mentor.id}
                style={[styles.mentorCard, { borderColor: mentor.themeColor }]}
                onPress={() => handleSelectMentor(mentor)}
              >
                <Image
                  source={getCharacterImage(mentor.image)}
                  style={styles.mentorImage}
                  resizeMode="cover"
                />
                <View style={styles.mentorInfo}>
                  <Text style={styles.mentorName}>{mentor.name}</Text>
                  <Text style={[styles.mentorRole, { color: mentor.themeColor }]}>
                    {mentor.personality.replace(/_/g, ' ').toUpperCase()}
                  </Text>
                  <Text style={styles.mentorDesc}>
                    {mentor.id === 'goggins'
                      ? 'Motivational warrior - Push you to be your best'
                      : mentor.id === 'peterson'
                      ? 'Philosophical guide - Help you find meaning'
                      : mentor.id === 'machiavelli'
                      ? 'Pure evil strategist - Serve you as his dear prince'
                      : 'Strategic advisor - Teach you to build wisely'}
                  </Text>
                </View>
                <Text style={styles.arrow}>→</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      ) : (
        // Chat Interface
        <KeyboardAvoidingView
          style={styles.chatContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={100}
        >
          {/* Chat Header */}
          <View style={[styles.chatHeader, { borderBottomColor: selectedMentor.themeColor }]}>
            <TouchableOpacity onPress={() => setSelectedMentor(null)}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
            <Image
              source={getCharacterImage(selectedMentor.image)}
              style={styles.chatHeaderImage}
              resizeMode="cover"
            />
            <View style={styles.mentorHeaderInfo}>
              <Text style={styles.chatMentorName}>{selectedMentor.name}</Text>
              <Text style={[styles.chatMentorRole, { color: selectedMentor.themeColor }]}>
                {selectedMentor.personality.replace(/_/g, ' ')}
              </Text>
            </View>
          </View>

          {/* Messages */}
          <ScrollView
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageBubble,
                  message.sender === 'user' ? styles.userBubble : styles.mentorBubble,
                  message.sender === 'mentor' && {
                    borderLeftColor: selectedMentor.themeColor,
                  },
                ]}
              >
                <Text style={styles.messageText}>{message.text}</Text>
                <Text style={styles.messageTime}>
                  {message.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            ))}
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={selectedMentor.themeColor} />
                <Text style={styles.loadingText}>Thinking...</Text>
              </View>
            )}
          </ScrollView>

          {/* Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder={`Ask ${selectedMentor.name} for advice...`}
              placeholderTextColor="#666"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: selectedMentor.themeColor },
                (!inputText.trim() || loading) && styles.sendButtonDisabled,
              ]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || loading}
            >
              <Text style={styles.sendButtonText}>→</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  selectionContainer: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  statsPreview: {
    backgroundColor: '#1a1a1a',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statText: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  streakText: {
    fontSize: 14,
    color: '#FF8C00',
    textAlign: 'center',
    marginBottom: 4,
  },
  levelText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  mentorsList: {
    flex: 1,
  },
  mentorCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mentorImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    borderWidth: 2,
    borderColor: '#333',
  },
  mentorInfo: {
    flex: 1,
  },
  mentorName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  mentorRole: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  mentorDesc: {
    fontSize: 14,
    color: '#888',
  },
  arrow: {
    fontSize: 24,
    color: '#666',
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 2,
  },
  backButton: {
    fontSize: 16,
    color: '#4A90E2',
    marginRight: 12,
  },
  chatHeaderImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#333',
  },
  mentorHeaderInfo: {
    flex: 1,
  },
  chatMentorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  chatMentorRole: {
    fontSize: 12,
    marginTop: 2,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#4A90E2',
  },
  mentorBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1a1a1a',
    borderLeftWidth: 3,
  },
  messageText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 11,
    color: '#888',
    alignSelf: 'flex-end',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 16,
  },
  loadingText: {
    fontSize: 14,
    color: '#888',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#1a1a1a',
    alignItems: 'flex-end',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
