
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Verifies the caller's subscription against the RevenueCat REST API and
// mirrors it into public.subscriptions, which analyze-palm trusts for tier
// limits. Clients cannot write that table directly, so entitlements can't be
// self-granted. Requires the REVENUECAT_SECRET_KEY function secret.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const revenueCatKey = Deno.env.get('REVENUECAT_SECRET_KEY');

    if (!revenueCatKey) {
      console.error('REVENUECAT_SECRET_KEY not configured');
      return json({ ok: false, reason: 'Service configuration error' }, 500);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ ok: false, reason: 'Not authenticated' }, 401);
    }
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();
    if (userError || !user) {
      return json({ ok: false, reason: 'Not authenticated' }, 401);
    }

    // The app configures RevenueCat with the Supabase user id as app_user_id.
    const rcResponse = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(user.id)}`,
      { headers: { Authorization: `Bearer ${revenueCatKey}` } },
    );
    if (!rcResponse.ok) {
      console.error('RevenueCat API error:', rcResponse.status);
      return json({ ok: false, reason: 'Could not verify subscription' }, 502);
    }
    const rcData = await rcResponse.json();
    const entitlements: Record<string, { expires_date: string | null }> =
      rcData.subscriber?.entitlements ?? {};

    const now = Date.now();
    const isActive = (name: string) => {
      const ent = entitlements[name];
      if (!ent) return false;
      return !ent.expires_date || new Date(ent.expires_date).getTime() > now;
    };

    let tier: 'premium' | 'standard' | null = null;
    if (isActive('premium')) tier = 'premium';
    else if (isActive('standard')) tier = 'standard';

    const admin = createClient(supabaseUrl, serviceRoleKey);
    if (tier) {
      const expiresDate = entitlements[tier]?.expires_date ?? null;
      const { error } = await admin.from('subscriptions').upsert(
        {
          user_id: user.id,
          tier,
          status: 'active',
          expires_at: expiresDate,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' },
      );
      if (error) {
        console.error('Failed to upsert subscription:', error);
        return json({ ok: false, reason: 'Failed to save subscription' }, 500);
      }
    } else {
      await admin
        .from('subscriptions')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('user_id', user.id);
    }

    return json({ ok: true, tier: tier ?? 'free' }, 200);
  } catch (error) {
    console.error('Unhandled error in sync-subscription:', error);
    return json({ ok: false, reason: 'An unexpected error occurred' }, 500);
  }
});
