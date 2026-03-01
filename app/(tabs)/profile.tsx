import { useMutation, useQuery } from '@tanstack/react-query';
import { Alert, Linking } from 'react-native';
import { Avatar, Button, Card, Switch, Text } from 'react-native-paper';
import { Screen } from '@/components/Screen';
import { fetchAccounts, fetchProfileWithLO, upsertPushToken } from '@/lib/api';
import { registerForPushNotificationsAsync } from '@/lib/notifications';
import { supabase } from '@/lib/supabase';

export default function ProfileScreen() {
  const profileQuery = useQuery({ queryKey: ['profile-lo'], queryFn: fetchProfileWithLO });
  const accountsQuery = useQuery({ queryKey: ['accounts'], queryFn: fetchAccounts });
  const pushMutation = useMutation({ mutationFn: upsertPushToken });

  const handleEnablePush = async () => {
    const token = await registerForPushNotificationsAsync();
    if (!token) {
      Alert.alert('Permission required', 'Please enable notifications on your device settings.');
      return;
    }
    await pushMutation.mutateAsync(token);
    Alert.alert('Success', 'Push notifications enabled.');
  };

  const handleDeleteAccount = async () => {
    const { error } = await supabase.functions.invoke('delete_account', { body: {} });
    if (error) {
      Alert.alert('Error', error.message);
      return;
    }
    await supabase.auth.signOut();
  };

  const profile = profileQuery.data;
  const loanOfficer = profile?.loan_officers;

  return (
    <Screen>
      <Text variant="headlineSmall">Profile</Text>
      <Text style={{ marginTop: 8 }}>{profile?.full_name ?? 'Loading...'}</Text>
      <Text>Plaid connected: {(accountsQuery.data?.length ?? 0) > 0 ? 'Yes' : 'No'}</Text>

      <Card style={{ marginTop: 16 }}>
        <Card.Content>
          <Text variant="titleMedium">Referring Loan Officer</Text>
          <Avatar.Image
            size={64}
            style={{ marginTop: 12 }}
            source={{ uri: loanOfficer?.photo_url ?? 'https://picsum.photos/200' }}
          />
          <Text style={{ marginTop: 8 }}>{loanOfficer?.name}</Text>
          <Text>{loanOfficer?.company}</Text>
          <Text>NMLS: {loanOfficer?.nmls}</Text>
          <Button mode="outlined" style={{ marginTop: 8 }} onPress={() => loanOfficer?.phone && Linking.openURL(`tel:${loanOfficer.phone}`)}>
            Call
          </Button>
          <Button mode="outlined" style={{ marginTop: 8 }} onPress={() => loanOfficer?.email && Linking.openURL(`mailto:${loanOfficer.email}`)}>
            Email
          </Button>
        </Card.Content>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Card.Content>
          <Text variant="titleMedium">Notifications</Text>
          <Switch value={false} onValueChange={handleEnablePush} />
        </Card.Content>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Card.Content>
          <Text variant="titleMedium">Data & Privacy</Text>
          <Text style={{ marginTop: 8 }}>
            We collect account balances, transactions, and debt details to compute budgeting and risk estimates.
          </Text>
          <Button style={{ marginTop: 8 }} onPress={() => Alert.alert('TODO', 'Disconnect Plaid edge function will be added in Phase 7')}>
            Disconnect Plaid (TODO)
          </Button>
          <Button mode="contained-tonal" style={{ marginTop: 8 }} onPress={handleDeleteAccount}>
            Delete account
          </Button>
        </Card.Content>
      </Card>

      <Button style={{ marginTop: 20 }} onPress={() => supabase.auth.signOut()}>
        Log out
      </Button>
    </Screen>
  );
}
