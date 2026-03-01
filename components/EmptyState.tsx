import { Text } from 'react-native-paper';

export function EmptyState({ message }: { message: string }) {
  return <Text variant="bodyMedium">{message}</Text>;
}
