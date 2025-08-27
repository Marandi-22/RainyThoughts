import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useJournal } from '@/hooks/useJournal';

const JournalWidget = () => {
  const { insights } = useJournal();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Journal Insights</ThemedText>
      <FlatList
        data={insights}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>{item.text}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  card: {
    backgroundColor: '#f0f0f0',
    padding: 20,
    marginVertical: 10,
    borderRadius: 10,
  },
});

export default JournalWidget;
