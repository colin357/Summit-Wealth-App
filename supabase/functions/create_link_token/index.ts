import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing auth header');

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: userResp } = await supabase.auth.getUser();
    const user = userResp.user;
    if (!user) throw new Error('Unauthorized');

    const plaidEnv = Deno.env.get('PLAID_ENV') ?? 'sandbox';
    const plaidBaseUrl = plaidEnv === 'production' ? 'https://production.plaid.com' : plaidEnv === 'development' ? 'https://development.plaid.com' : 'https://sandbox.plaid.com';

    const payload = {
      client_id: Deno.env.get('PLAID_CLIENT_ID'),
      secret: Deno.env.get('PLAID_SECRET'),
      user: { client_user_id: user.id },
      client_name: 'Summit Wealth',
      products: ['transactions'],
      language: 'en',
      country_codes: ['US'],
      webhook: Deno.env.get('PLAID_WEBHOOK_URL') ?? undefined,
    };

    const plaidRes = await fetch(`${plaidBaseUrl}/link/token/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const plaidData = await plaidRes.json();
    if (!plaidRes.ok) throw new Error(plaidData.error_message ?? 'Unable to create Plaid token');

    return new Response(JSON.stringify({ link_token: plaidData.link_token }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
