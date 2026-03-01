import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlatList, View } from 'react-native';
import { Button, Card, Searchbar, Text } from 'react-native-paper';
import { createPlaidLinkToken, exchangePlaidPublicToken, fetchAccounts, fetchTransactions } from '@/lib/api';
import { Screen } from '@/components/Screen';
import { EmptyState } from '@/components/EmptyState';
import { create, LinkExit, open } from 'plaid-react-native';

export default function TransactionsScreen() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const txQuery = useQuery({ queryKey: ['transactions', search], queryFn: () => fetchTransactions(search) });
  const accountsQuery = useQuery({ queryKey: ['accounts'], queryFn: fetchAccounts });

  const linkTokenMutation = useMutation({ mutationFn: createPlaidLinkToken });
  const exchangeMutation = useMutation({
    mutationFn: exchangePlaidPublicToken,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['transactions'] });
      await queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });

  useEffect(() => {
    create({
      token: linkTokenMutation.data?.link_token ?? '',
      noLoadingState: false,
    });
  }, [linkTokenMutation.data?.link_token]);

  const hasAccounts = (accountsQuery.data?.length ?? 0) > 0;

  const handlePlaidOpen = async () => {
    const tokenResult = await linkTokenMutation.mutateAsync();
    if (!tokenResult?.link_token) return;

    const result = await open({
      token: tokenResult.link_token,
    });

    if (result.exit && (result.exit as LinkExit).error) {
      console.warn('Plaid Link exit', result.exit);
      return;
    }

    if (result.metadata?.publicToken) {
      await exchangeMutation.mutateAsync(result.metadata.publicToken);
    }
  };

  const lastSync = useMemo(
    () => accountsQuery.data?.reduce((max, acc) => (acc.updated_at > max ? acc.updated_at : max), ''),
    [accountsQuery.data],
  );

  return (
    <Screen>
      <Button mode="contained" onPress={handlePlaidOpen} loading={linkTokenMutation.isPending || exchangeMutation.isPending}>
        {hasAccounts ? 'Reconnect / Sync via Plaid' : 'Connect your bank'}
      </Button>
      {lastSync ? <Text style={{ marginTop: 8 }}>Last sync: {new Date(lastSync).toLocaleString()}</Text> : null}

      <Searchbar placeholder="Search transactions" value={search} onChangeText={setSearch} style={{ marginTop: 12 }} />

      {txQuery.isLoading ? <Text style={{ marginTop: 12 }}>Loading transactions…</Text> : null}
      {txQuery.error ? <Text style={{ marginTop: 12 }}>Error loading transactions.</Text> : null}
      {!txQuery.isLoading && (txQuery.data?.length ?? 0) === 0 ? <EmptyState message="No transactions yet." /> : null}

      <FlatList
        data={txQuery.data ?? []}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        style={{ marginTop: 12 }}
        renderItem={({ item }) => (
          <Card style={{ marginBottom: 10 }}>
            <Card.Content>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text variant="titleSmall">{item.merchant_name ?? item.name}</Text>
                  <Text variant="bodySmall">{item.user_category_override ?? item.category_primary ?? 'Uncategorized'}</Text>
                  <Text variant="bodySmall">{item.date}</Text>
                </View>
                <Text>${Number(item.amount).toFixed(2)}</Text>
              </View>
            </Card.Content>
          </Card>
        )}
      />
    </Screen>
  );
}
