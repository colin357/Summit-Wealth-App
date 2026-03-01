import { Link } from 'expo-router';
import { Button, Card, Text } from 'react-native-paper';
import { Screen } from '@/components/Screen';

export default function WelcomeScreen() {
  return (
    <Screen>
      <Card>
        <Card.Content>
          <Text variant="headlineMedium">Summit Wealth</Text>
          <Text variant="bodyMedium" style={{ marginTop: 8 }}>
            Budget smarter, track risk, and stay connected with your loan officer.
          </Text>
        </Card.Content>
      </Card>

      <Link href="/(auth)/sign-up" asChild>
        <Button mode="contained" style={{ marginTop: 24 }}>
          Create Account
        </Button>
      </Link>
      <Link href="/(auth)/log-in" asChild>
        <Button mode="outlined" style={{ marginTop: 12 }}>
          Log In
        </Button>
      </Link>
    </Screen>
  );
}
