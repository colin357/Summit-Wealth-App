import { supabaseAdminClient } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';

function baseUrl() {
  const env = Deno.env.get('PLAID_ENV') ?? 'sandbox';
  return env === 'production' ? 'https://production.plaid.com' : env === 'development' ? 'https://development.plaid.com' : 'https://sandbox.plaid.com';
}

async function plaidPost(path: string, body: Record<string, unknown>) {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: Deno.env.get('PLAID_CLIENT_ID'),
      secret: Deno.env.get('PLAID_SECRET'),
      ...body,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error_message ?? 'Plaid sync failed');
  return data;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const admin = supabaseAdminClient();
  const { data: items, error: itemError } = await admin
    .from('plaid_items')
    .select('id, user_id, plaid_item_secrets(access_token)');

  if (itemError) {
    return new Response(JSON.stringify({ error: itemError.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  for (const item of items ?? []) {
    const accessToken = item.plaid_item_secrets?.[0]?.access_token;
    if (!accessToken) continue;

    const txSync = await plaidPost('/transactions/sync', { access_token: accessToken });
    const { data: accountRows } = await admin.from('plaid_accounts').select('id, plaid_account_id').eq('user_id', item.user_id);
    const accountMap = new Map((accountRows ?? []).map((r) => [r.plaid_account_id, r.id]));

    const upserts = (txSync.added ?? []).map((tx: any) => ({
      user_id: item.user_id,
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

    if (upserts.length > 0) {
      await admin.from('transactions').upsert(upserts, { onConflict: 'plaid_transaction_id' });
    }
  }

  return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
