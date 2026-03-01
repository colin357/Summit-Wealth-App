import { supabase } from './supabase';

export async function fetchProfileWithLO() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, loan_officer_id, loan_officers(id, code, name, company, nmls, phone, email, photo_url)')
    .eq('id', auth.user.id)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchTransactions(search?: string) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Not authenticated');

  let query = supabase
    .from('transactions')
    .select('id, name, merchant_name, amount, date, category_primary, user_category_override, pending')
    .eq('user_id', auth.user.id)
    .order('date', { ascending: false })
    .limit(100);

  if (search) {
    query = query.or(`name.ilike.%${search}%,merchant_name.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function fetchAccounts() {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('plaid_accounts')
    .select('id, name, subtype, current_balance, available_balance, updated_at')
    .eq('user_id', auth.user.id)
    .order('name');

  if (error) throw error;
  return data;
}

export async function fetchLatestRiskAlert() {
  const { data, error } = await supabase
    .from('risk_alerts')
    .select('id, type, severity, message, effective_date, created_at')
    .is('dismissed_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createPlaidLinkToken() {
  const { data, error } = await supabase.functions.invoke('create_link_token', { body: {} });
  if (error) throw error;
  return data as { link_token: string };
}

export async function exchangePlaidPublicToken(publicToken: string) {
  const { data, error } = await supabase.functions.invoke('exchange_public_token', {
    body: { public_token: publicToken },
  });
  if (error) throw error;
  return data;
}

export async function upsertPushToken(expoPushToken: string) {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error('Not authenticated');

  const { error } = await supabase.from('push_tokens').upsert(
    {
      user_id: auth.user.id,
      expo_push_token: expoPushToken,
      enabled: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'expo_push_token' },
  );

  if (error) throw error;
}
