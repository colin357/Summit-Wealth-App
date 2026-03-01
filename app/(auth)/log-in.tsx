import { useState } from 'react';
import { Link, router } from 'expo-router';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { Screen } from '@/components/Screen';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (loginError) {
      setError(loginError.message);
      return;
    }

    router.replace('/(tabs)/dashboard');
  };

  return (
    <Screen>
      <Text variant="headlineSmall">Log In</Text>
      <TextInput label="Email" autoCapitalize="none" value={email} onChangeText={setEmail} style={{ marginTop: 16 }} />
      <TextInput label="Password" secureTextEntry value={password} onChangeText={setPassword} style={{ marginTop: 12 }} />
      {error ? <HelperText type="error">{error}</HelperText> : null}
      <Button mode="contained" loading={loading} onPress={handleLogin} style={{ marginTop: 12 }}>
        Continue
      </Button>
      <Link href="/(auth)/forgot-password" style={{ marginTop: 12 }}>
        Forgot Password?
      </Link>
    </Screen>
  );
}
