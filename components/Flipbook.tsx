import React from 'react';
import { View, StyleSheet } from 'react-native';

const Flipbook = ({ children }: { children: React.ReactNode | React.ReactNode[] }) => {
  return (
    <View style={styles.container}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default Flipbook;
