
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

// Deletes the calling user's account and all associated data.
// Required by App Store Guideline 5.1.1(v).
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

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

    const admin = createClient(supabaseUrl, serviceRoleKey);

    // Remove user data first, then the auth record.
    await admin.from('readings').delete().eq('user_id', user.id);
    await admin.from('subscriptions').delete().eq('user_id', user.id);
    await admin.from('usage_stats').delete().eq('user_id', user.id);

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error('Failed to delete auth user:', deleteError);
      return json({ ok: false, reason: 'Failed to delete account' }, 500);
    }

    return json({ ok: true }, 200);
  } catch (error) {
    console.error('Unhandled error in delete-account:', error);
    return json({ ok: false, reason: 'An unexpected error occurred' }, 500);
  }
});
