// LetterBox.tsx
import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";

// Define props type
type LetterBoxProps = {
  letters: string[];
};

export default function LetterBox({ letters }: LetterBoxProps) {
  const [displayedLetters, setDisplayedLetters] = useState<string[]>([]);
  const indexRef = useRef(0);
  const timeoutRef = useRef<any>(null); // fix Timeout type issue

  useEffect(() => {
    // Reset letters when new letters are passed
    setDisplayedLetters([]);
    indexRef.current = 0;

    if (letters.length === 0) return;

    const displayNext = () => {
      if (indexRef.current < letters.length) {
        setDisplayedLetters((prev) => [...prev, letters[indexRef.current]]);
        indexRef.current += 1;
        timeoutRef.current = setTimeout(displayNext, 200); // speed of letters
      }
    };

    displayNext();

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [letters]);

  return (
    <View style={styles.container}>
      {displayedLetters.map((letter, idx) => (
        <Text key={idx} style={styles.letter}>
          {letter}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 20,
  },
  letter: {
    fontSize: 28,
    color: "#f0e5d8",
    fontWeight: "bold",
    margin: 2,
  },
});
