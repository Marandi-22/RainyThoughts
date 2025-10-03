import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Character } from '../constants/characters';
import { CharacterTauntService } from '../services/characterTauntService';
import { getCharacterImage } from '../constants/imageMapping';

interface PreBattleTauntScreenProps {
  visible: boolean;
  character: Character;
  onStartBattle: () => void;
  onSkip: () => void;
}

export const PreBattleTauntScreen: React.FC<PreBattleTauntScreenProps> = ({
  visible,
  character,
  onStartBattle,
  onSkip,
}) => {
  const [taunt, setTaunt] = useState<string>('Get ready...');
  const [loading, setLoading] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (visible) {
      startPulseAnimation();
      // Load taunt in background with a subtle loading indicator
      loadTauntInBackground();
    }
  }, [visible, character]);

  const loadTauntInBackground = async () => {
    setLoading(true);
    try {
      const fetchedTaunt = await CharacterTauntService.getPreBattleTaunt(character);
      setTaunt(fetchedTaunt);
      setLoading(false);
    } catch (error) {
      console.error('Error loading taunt:', error);
      const fallback = character.fallbackMessages?.[0] || character.messages?.preBattle?.[0] || 'Get ready...';
      setTaunt(fallback);
      setLoading(false);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Animated.View
            style={[
              styles.imageContainer,
              {
                transform: [{ scale: pulseAnim }],
                borderColor: character.themeColor,
              },
            ]}
          >
            <Image
              source={getCharacterImage(character.image)}
              style={styles.characterImage}
              resizeMode="cover"
            />
          </Animated.View>

          <Text style={styles.characterName}>{character.name}</Text>
          <Text style={[styles.personality, { color: character.themeColor }]}>
            {character.personality.replace(/_/g, ' ').toUpperCase()}
          </Text>

          <View style={[styles.tauntBubble, { borderColor: character.themeColor }]}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={character.themeColor} />
                <Text style={styles.loadingText}>Generating taunt...</Text>
              </View>
            ) : (
              <Text style={styles.tauntText}>{taunt}</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.startButton, { backgroundColor: character.themeColor }]}
            onPress={onStartBattle}
          >
            <Text style={styles.startButtonText}>LET'S WORK! 🔥</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipButton} onPress={onSkip}>
            <Text style={styles.skipButtonText}>Skip Taunt</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    overflow: 'hidden',
    marginBottom: 20,
  },
  characterImage: {
    width: '100%',
    height: '100%',
  },
  characterName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  personality: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 30,
    textAlign: 'center',
  },
  tauntBubble: {
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    width: '100%',
  },
  tauntText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 26,
  },
  startButton: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  skipButton: {
    paddingVertical: 12,
  },
  skipButtonText: {
    fontSize: 14,
    color: '#888888',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    minHeight: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#888888',
  },
});
