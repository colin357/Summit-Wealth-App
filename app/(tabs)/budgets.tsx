import { Card, Text } from 'react-native-paper';
import { Screen } from '@/components/Screen';

export default function BudgetsScreen() {
  return (
    <Screen>
      <Text variant="headlineSmall">Budgets</Text>
      <Card style={{ marginTop: 12 }}>
        <Card.Content>
          <Text>TODO (Phase 5): budget CRUD + progress bars by category.</Text>
        </Card.Content>
      </Card>
    </Screen>
  );
}
