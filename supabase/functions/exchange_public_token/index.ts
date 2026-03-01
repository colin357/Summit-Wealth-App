import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdminClient } from '../_shared/supabaseAdmin.ts';

function plaidBaseUrl() {
  const plaidEnv = Deno.env.get('PLAID_ENV') ?? 'sandbox';
  if (plaidEnv === 'production') return 'https://production.plaid.com';
  if (plaidEnv === 'development') return 'https://development.plaid.com';
  return 'https://sandbox.plaid.com';
}

async function plaidPost(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${plaidBaseUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: Deno.env.get('PLAID_CLIENT_ID'),
      secret: Deno.env.get('PLAID_SECRET'),
      ...body,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_message ?? `Plaid request failed (${path})`);
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing auth header');

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) throw new Error('Unauthorized');

    const { public_token } = await req.json();
    if (!public_token) throw new Error('public_token is required');

    const admin = supabaseAdminClient();

    const exchangeData = await plaidPost('/item/public_token/exchange', { public_token });
    const accessToken = exchangeData.access_token as string;
    const itemId = exchangeData.item_id as string;

    const itemData = await plaidPost('/item/get', { access_token: accessToken });
    const institutionName = itemData.item?.institution_id
      ? (await plaidPost('/institutions/get_by_id', {
          institution_id: itemData.item.institution_id,
          country_codes: ['US'],
        }))?.institution?.name
      : null;

    const { data: itemRow, error: itemError } = await admin
      .from('plaid_items')
      .upsert({ user_id: user.id, item_id: itemId, institution_name: institutionName, status: 'connected' }, { onConflict: 'item_id' })
      .select('id')
      .single();
    if (itemError || !itemRow) throw itemError ?? new Error('Unable to save plaid item');

    const { error: secretError } = await admin
      .from('plaid_item_secrets')
      .upsert({ plaid_item_id: itemRow.id, access_token: accessToken }, { onConflict: 'plaid_item_id' });
    if (secretError) throw secretError;

    const accountData = await plaidPost('/accounts/get', { access_token: accessToken });
    const accounts = (accountData.accounts ?? []).map((account: any) => ({
      user_id: user.id,
      plaid_account_id: account.account_id,
      name: account.name,
      type: account.type,
      subtype: account.subtype,
      mask: account.mask,
      current_balance: account.balances?.current,
      available_balance: account.balances?.available,
      iso_currency_code: account.balances?.iso_currency_code,
      updated_at: new Date().toISOString(),
    }));

    if (accounts.length > 0) {
      const { error } = await admin.from('plaid_accounts').upsert(accounts, { onConflict: 'plaid_account_id' });
      if (error) throw error;
    }

    const txData = await plaidPost('/transactions/sync', {
      access_token: accessToken,
      options: { include_personal_finance_category: true, include_original_description: true },
    });

    const { data: accountRows } = await admin
      .from('plaid_accounts')
      .select('id, plaid_account_id')
      .eq('user_id', user.id);

    const accountMap = new Map((accountRows ?? []).map((row) => [row.plaid_account_id, row.id]));

    const newTx = (txData.added ?? []).map((tx: any) => ({
      user_id: user.id,
      plaid_transaction_id: tx.transaction_id,
      account_id: accountMap.get(tx.account_id) ?? null,
      name: tx.name,
      merchant_name: tx.merchant_name,
      amount: tx.amount,
      iso_currency_code: tx.iso_currency_code,
      date: tx.date,
      category_primary: tx.personal_finance_category?.primary,
      category_detailed: tx.personal_finance_category?.detailed,
      pending: tx.pending,
    }));

    if (newTx.length > 0) {
      const { error } = await admin.from('transactions').upsert(newTx, { onConflict: 'plaid_transaction_id' });
      if (error) throw error;
    }

    return new Response(JSON.stringify({ success: true, imported_transactions: newTx.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
