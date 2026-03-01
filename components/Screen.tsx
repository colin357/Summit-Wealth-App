import { PropsWithChildren } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

export function Screen({ children }: PropsWithChildren) {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View>{children}</View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 48,
  },
});
