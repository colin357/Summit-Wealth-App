import { Redirect } from 'expo-router';
import { ActivityIndicator } from 'react-native-paper';
import { useAuth } from '@/lib/auth';

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) return <ActivityIndicator style={{ marginTop: 64 }} />;
  return <Redirect href={session ? '/(tabs)/dashboard' : '/(auth)/welcome'} />;
}
