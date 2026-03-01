import { useState } from 'react';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { Screen } from '@/components/Screen';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setMessage(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setMessage('Reset instructions sent.');
  };

  return (
    <Screen>
      <Text variant="headlineSmall">Forgot Password</Text>
      <TextInput label="Email" autoCapitalize="none" value={email} onChangeText={setEmail} style={{ marginTop: 16 }} />
      {message ? <HelperText type="info">{message}</HelperText> : null}
      {error ? <HelperText type="error">{error}</HelperText> : null}
      <Button mode="contained" onPress={submit} style={{ marginTop: 12 }}>
        Send reset link
      </Button>
    </Screen>
  );
}
