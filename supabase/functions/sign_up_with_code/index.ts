import { corsHeaders } from '../_shared/cors.ts';
import { supabaseAdminClient } from '../_shared/supabaseAdmin.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { email, password, fullName, phone, loanOfficerCode } = await req.json();
    if (!email || !password || !loanOfficerCode) {
      return new Response(JSON.stringify({ error: 'email, password, and loanOfficerCode are required.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const supabase = supabaseAdminClient();

    const { data: lo, error: loError } = await supabase
      .from('loan_officers')
      .select('id')
      .eq('code', String(loanOfficerCode).toUpperCase())
      .single();

    if (loError || !lo) {
      return new Response(JSON.stringify({ error: 'Invalid Loan Officer code.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError || !created.user) {
      return new Response(JSON.stringify({ error: createError?.message ?? 'Unable to create user.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: created.user.id,
      full_name: fullName,
      phone: phone ?? null,
      loan_officer_id: lo.id,
    });

    if (profileError) {
      await supabase.auth.admin.deleteUser(created.user.id);
      return new Response(JSON.stringify({ error: profileError.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    await supabase.from('eligibility_flags').upsert({ user_id: created.user.id });

    return new Response(JSON.stringify({ user_id: created.user.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
