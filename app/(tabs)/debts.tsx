import { Card, Text } from 'react-native-paper';
import { Screen } from '@/components/Screen';

export default function DebtsScreen() {
  return (
    <Screen>
      <Text variant="headlineSmall">Debts + Payoff Plan</Text>
      <Card style={{ marginTop: 12 }}>
        <Card.Content>
          <Text>TODO (Phase 6): debt CRUD and snowball/avalanche payoff plan builder.</Text>
        </Card.Content>
      </Card>
    </Screen>
  );
}
