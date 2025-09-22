import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';

interface TauntBoxProps {
  taunt: string;
  onDismiss: () => void;
}

export default function TauntBox({ taunt, onDismiss }: TauntBoxProps) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.5));

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleDismiss = () => {
    console.log('TauntBox: Dismiss button pressed');
    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.5,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      console.log('TauntBox: Animation complete, calling onDismiss');
      onDismiss();
    });
  };

  return (
    <TouchableWithoutFeedback onPress={handleDismiss}>
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          }
        ]}
      >
        <TouchableWithoutFeedback onPress={() => {}}>
          <Animated.View
            style={[
              styles.tauntContainer,
              {
                transform: [{ scale: scaleAnim }],
              }
            ]}
          >
        <View style={styles.header}>
          <Text style={styles.bossTitle}>👹 SHADOW BOSS 👹</Text>
          <Text style={styles.subtitle}>Speaks from the void...</Text>
        </View>

        <View style={styles.tauntBody}>
          <Text style={styles.tauntText}>{taunt}</Text>
        </View>

        <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
          <Text style={styles.dismissText}>BANISH THE SHADOW</Text>
        </TouchableOpacity>

        <View style={styles.glowEffect} />
          </Animated.View>
        </TouchableWithoutFeedback>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  tauntContainer: {
    backgroundColor: '#0a0a0a',
    borderWidth: 2,
    borderColor: '#ff0000',
    borderRadius: 15,
    padding: 20,
    margin: 20,
    maxWidth: '90%',
    shadowColor: '#ff0000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ff0000',
    paddingBottom: 10,
  },
  bossTitle: {
    color: '#ff0000',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    letterSpacing: 2,
    textShadowColor: '#ff0000',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    color: '#ff6666',
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 5,
    fontFamily: 'monospace',
  },
  tauntBody: {
    backgroundColor: '#111111',
    borderRadius: 10,
    padding: 15,
    marginVertical: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#ff0000',
  },
  tauntText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  dismissButton: {
    backgroundColor: '#330000',
    borderWidth: 2,
    borderColor: '#ff0000',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 10,
  },
  dismissText: {
    color: '#ff0000',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  glowEffect: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    backgroundColor: 'transparent',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#ff0000',
    opacity: 0.3,
  },
});