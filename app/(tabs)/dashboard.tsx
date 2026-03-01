import { useQuery } from '@tanstack/react-query';
import { Card, Text } from 'react-native-paper';
import { Screen } from '@/components/Screen';
import { fetchAccounts, fetchLatestRiskAlert, fetchTransactions } from '@/lib/api';

export default function DashboardScreen() {
  const txQuery = useQuery({ queryKey: ['transactions-summary'], queryFn: () => fetchTransactions() });
  const accountsQuery = useQuery({ queryKey: ['accounts'], queryFn: fetchAccounts });
  const riskQuery = useQuery({ queryKey: ['risk-latest'], queryFn: fetchLatestRiskAlert });

  const monthStart = new Date();
  monthStart.setDate(1);
  const monthTx = (txQuery.data ?? []).filter((t) => new Date(t.date) >= monthStart);
  const spend = monthTx.filter((t) => t.amount > 0).reduce((sum, t) => sum + Number(t.amount), 0);
  const income = monthTx.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
  const net = income - spend;
  const checking = (accountsQuery.data ?? []).find((a) => a.subtype === 'checking');
  const safeToSpend = (checking?.available_balance ?? checking?.current_balance ?? 0) - spend;

  return (
    <Screen>
      <Text variant="headlineSmall">This Month</Text>
      <Card style={{ marginTop: 12 }}>
        <Card.Content>
          <Text>Income: ${income.toFixed(2)}</Text>
          <Text>Spend: ${spend.toFixed(2)}</Text>
          <Text>Net: ${net.toFixed(2)}</Text>
          <Text>Safe to spend (estimate): ${safeToSpend.toFixed(2)}</Text>
        </Card.Content>
      </Card>

      {riskQuery.data ? (
        <Card style={{ marginTop: 12 }}>
          <Card.Content>
            <Text variant="titleMedium">At Risk</Text>
            <Text>{riskQuery.data.message}</Text>
          </Card.Content>
        </Card>
      ) : null}

      {accountsQuery.data?.length ? null : (
        <Card style={{ marginTop: 12 }}>
          <Card.Content>
            <Text variant="titleMedium">Connect your bank</Text>
            <Text>Link Plaid from the Transactions tab to import accounts and transactions.</Text>
          </Card.Content>
        </Card>
      )}
    </Screen>
  );
}
