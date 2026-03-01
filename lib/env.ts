import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const env = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra.EXPO_PUBLIC_SUPABASE_URL,
  supabaseAnonKey:
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  plaidClientName: process.env.EXPO_PUBLIC_PLAID_CLIENT_NAME ?? 'Summit Wealth',
};

if (!env.supabaseUrl || !env.supabaseAnonKey) {
  console.warn('Missing Supabase env vars. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.');
}
