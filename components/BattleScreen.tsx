import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Character } from '../constants/characters';
import { getCharacterImage } from '../constants/imageMapping';
import { EnemyData } from '../constants/battleSystem';

interface BattleScreenProps {
  character: Character;
  timeRemaining: number;
  onPause: () => void;
  onQuit: () => void;
  isPaused: boolean;
  enemyData: EnemyData;
  midTaunt?: string;
}

export const BattleScreen: React.FC<BattleScreenProps> = ({
  character,
  timeRemaining,
  onPause,
  onQuit,
  isPaused,
  enemyData,
  midTaunt,
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getMotivationalMessage = (): string => {
    if (timeRemaining > 1200) return "Let's crush this session!";
    if (timeRemaining > 900) return 'Stay focused. You got this.';
    if (timeRemaining > 600) return "You're doing great!";
    if (timeRemaining > 300) return 'Keep pushing! Almost there!';
    if (timeRemaining > 120) return 'Final stretch! Stay strong!';
    return "You're almost done! FINISH!";
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { borderBottomColor: character.themeColor }]}>
        <Text style={styles.headerText}>BATTLE IN PROGRESS</Text>
        <Text style={[styles.vsText, { color: character.themeColor }]}>VS</Text>
        <Text style={styles.characterName}>{character.name}</Text>
      </View>

      <View style={styles.characterContainer}>
        <View style={[styles.imageContainer, { borderColor: character.themeColor }]}>
          <Image
            source={getCharacterImage(character.image)}
            style={styles.characterImage}
            resizeMode="cover"
          />
        </View>

        {/* Enemy HP Bar */}
        <View style={styles.hpBarContainer}>
          <View style={styles.hpBarBackground}>
            <View
              style={[
                styles.hpBarFill,
                {
                  backgroundColor: character.themeColor,
                  width: `${(enemyData.currentHp / enemyData.maxHp) * 100}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.hpText}>
            {enemyData.currentHp} / {enemyData.maxHp} HP
          </Text>
          {enemyData.defeats > 0 && (
            <Text style={styles.defeatCountText}>💀 Defeated {enemyData.defeats}x</Text>
          )}
        </View>
      </View>

      {/* Mid-Session Taunt */}
      {midTaunt && (
        <View style={[styles.tauntBubble, { borderColor: character.themeColor }]}>
          <Text style={styles.tauntText}>{midTaunt}</Text>
        </View>
      )}

      <View style={styles.timerContainer}>
        <Text style={[styles.timerText, { color: character.themeColor }]}>
          {formatTime(timeRemaining)}
        </Text>
        <Text style={styles.motivationText}>{getMotivationalMessage()}</Text>
      </View>

      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            {
              backgroundColor: character.themeColor,
              width: `${(timeRemaining / 1500) * 100}%`,
            },
          ]}
        />
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.pauseButton]}
          onPress={onPause}
        >
          <Text style={styles.buttonText}>{isPaused ? '▶ Resume' : '⏸ Pause'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.quitButton]}
          onPress={onQuit}
        >
          <Text style={styles.buttonText}>❌ Quit</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.warningText}>
        Quitting means defeat. Face the character's wrath.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    paddingBottom: 20,
    borderBottomWidth: 2,
    marginBottom: 30,
  },
  headerText: {
    fontSize: 16,
    color: '#888888',
    marginBottom: 8,
    letterSpacing: 2,
  },
  vsText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  characterName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  characterContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  imageContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 4,
    overflow: 'hidden',
  },
  characterImage: {
    width: '100%',
    height: '100%',
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 72,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    marginBottom: 16,
  },
  motivationText: {
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#1a1a1a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 40,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  pauseButton: {
    backgroundColor: '#FF8C00',
  },
  quitButton: {
    backgroundColor: '#FF4444',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  warningText: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  hpBarContainer: {
    width: '100%',
    marginTop: 20,
    alignItems: 'center',
  },
  hpBarBackground: {
    width: '80%',
    height: 24,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#333',
  },
  hpBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  hpText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
  },
  defeatCountText: {
    fontSize: 14,
    color: '#FF4444',
    marginTop: 4,
  },
  tauntBubble: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
  },
  tauntText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
