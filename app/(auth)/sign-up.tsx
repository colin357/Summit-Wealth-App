import { useState } from 'react';
import { router } from 'expo-router';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { Screen } from '@/components/Screen';
import { supabase } from '@/lib/supabase';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loanOfficerCode, setLoanOfficerCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    setLoading(true);
    setError(null);

    const { data, error: invokeError } = await supabase.functions.invoke('sign_up_with_code', {
      body: {
        email,
        password,
        fullName,
        phone: phone || null,
        loanOfficerCode,
      },
    });

    if (invokeError || data?.error) {
      setError(invokeError?.message ?? data?.error ?? 'Unable to sign up.');
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    router.replace('/(tabs)/dashboard');
  };

  return (
    <Screen>
      <Text variant="headlineSmall">Create account</Text>
      <TextInput label="Full name" value={fullName} onChangeText={setFullName} style={{ marginTop: 16 }} />
      <TextInput label="Email" autoCapitalize="none" value={email} onChangeText={setEmail} style={{ marginTop: 12 }} />
      <TextInput label="Password" secureTextEntry value={password} onChangeText={setPassword} style={{ marginTop: 12 }} />
      <TextInput label="Phone (optional)" value={phone} onChangeText={setPhone} style={{ marginTop: 12 }} />
      <TextInput
        label="Loan Officer Code"
        autoCapitalize="characters"
        value={loanOfficerCode}
        onChangeText={(value) => setLoanOfficerCode(value.trim().toUpperCase())}
        style={{ marginTop: 12 }}
      />
      <HelperText type="info">A valid referral code is required for signup.</HelperText>
      {error ? <HelperText type="error">{error}</HelperText> : null}
      <Button mode="contained" loading={loading} onPress={onSubmit} style={{ marginTop: 12 }}>
        Sign up
      </Button>
    </Screen>
  );
}
