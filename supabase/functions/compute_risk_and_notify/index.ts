import { supabaseAdminClient } from '../_shared/supabaseAdmin.ts';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const admin = supabaseAdminClient();

  const { data: users } = await admin.from('profiles').select('id');

  for (const user of users ?? []) {
    const { data: debts } = await admin.from('debts').select('minimum_payment, is_mortgage').eq('user_id', user.id);
    const { data: accounts } = await admin.from('plaid_accounts').select('subtype, current_balance, available_balance').eq('user_id', user.id);
    const { data: tx } = await admin.from('transactions').select('amount, date').eq('user_id', user.id).gte('date', new Date(new Date().setDate(1)).toISOString().slice(0, 10));

    const monthlySpend = (tx ?? []).filter((t) => t.amount > 0).reduce((s, t) => s + Number(t.amount), 0);
    const monthlyIncome = (tx ?? []).filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    const mustPay = (debts ?? []).reduce((s, d) => s + Number(d.minimum_payment || 0), 0);
    const checking = (accounts ?? []).find((a) => a.subtype === 'checking');
    const cash = Number(checking?.available_balance ?? checking?.current_balance ?? 0);
    const buffer = monthlyIncome * 0.05;
    const safeToSpend = cash - mustPay - buffer;

    if (safeToSpend < 100) {
      await admin.from('risk_alerts').insert({
        user_id: user.id,
        type: (debts ?? []).some((d) => d.is_mortgage) ? 'mortgage_risk' : 'debt_risk',
        severity: safeToSpend < 0 ? 'critical' : 'warning',
        message: `Heads up: if you spend about $${Math.max(safeToSpend, 0).toFixed(0)} more this cycle, you may miss a required payment.`,
        effective_date: new Date().toISOString().slice(0, 10),
        computed: { safeToSpend, monthlySpend, monthlyIncome, mustPay, buffer },
      });
    }
  }

  return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
