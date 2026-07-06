
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PalmReading {
  summary: string;
  heartLine: string;
  headLine: string;
  lifeLine: string;
  fateLine: string;
  marks: string;
  deeperInsights?: string;
  prompts?: string[];
  practices?: string[];
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function fail(status: number, reason: string, code = 'error'): Response {
  return json({ ok: false, code, reason }, status);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not configured');
      return fail(500, 'Service configuration error');
    }

    // Identify the caller from their JWT.
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return fail(401, 'Sign in to get a palm reading');
    }
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();
    if (userError || !user) {
      return fail(401, 'Sign in to get a palm reading');
    }

    let body: { imageBase64?: string };
    try {
      body = await req.json();
    } catch {
      return fail(400, 'Invalid request format');
    }

    const imageBase64 = body.imageBase64;
    if (!imageBase64 || imageBase64.length < 100) {
      return fail(400, 'Missing or invalid image data');
    }
    // ~15MB base64 ceiling to keep memory bounded
    if (imageBase64.length > 20_000_000) {
      return fail(400, 'Image too large');
    }

    // Tier and quota are derived server-side; the client is not trusted.
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: quotaRows, error: quotaError } = await admin.rpc('get_reading_quota', {
      p_user_id: user.id,
    });
    if (quotaError || !quotaRows || quotaRows.length === 0) {
      console.error('Quota lookup failed:', quotaError);
      return fail(500, 'Could not verify your reading allowance');
    }
    const quota = quotaRows[0] as {
      tier: 'free' | 'standard' | 'premium';
      reads_used: number;
      reads_limit: number;
      remaining: number;
    };

    if (quota.remaining <= 0) {
      return fail(
        403,
        quota.tier === 'free'
          ? 'You have used all your free readings. Subscribe to continue.'
          : 'You have used all your readings for this month.',
        'limit_reached',
      );
    }

    const isPremium = quota.tier === 'premium';
    const wordCount = isPremium ? 1000 : 400;

    const systemPrompt = `You are an expert palm reader with deep knowledge of palmistry.
Analyze the palm image and provide insights in a positive, encouraging tone.
Never make medical, legal, or financial claims. This is for entertainment purposes only.

IMPORTANT: You must respond with ONLY valid JSON. Do not include any markdown formatting, code blocks, or explanatory text.

Return your response as a JSON object with the following structure:
{
  "ok": true,
  "reading": {
    "summary": "Brief overview of the palm reading (2-3 sentences)",
    "heartLine": "Analysis of the heart line and emotional nature",
    "headLine": "Analysis of the head line and mental characteristics",
    "lifeLine": "Analysis of the life line and vitality",
    "fateLine": "Analysis of the fate line and life path",
    "marks": "Interpretation of special marks, crosses, stars, or islands"${
      isPremium
        ? `,
    "deeperInsights": "Deeper spiritual and personal insights",
    "prompts": ["Reflective prompt 1", "Reflective prompt 2", "Reflective prompt 3"],
    "practices": ["Spiritual practice 1", "Spiritual practice 2", "Spiritual practice 3"]`
        : ''
    }
  }
}

Be lenient about image acceptance: if a human palm is visible anywhere in the image —
even partially, at an angle, in imperfect lighting, or with multiple hands present —
provide the reading for the most visible palm. Only reject the image if NO human palm
is visible at all (e.g. a face, an object, an animal, a drawing, or a mannequin).
If you must reject, return:
{
  "ok": false,
  "reason": "Explanation of why the image is not valid"
}

Target approximately ${wordCount} words total for the reading.`;

    let openaiResponse: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Please analyze this palm image and provide a detailed reading. Respond with ONLY valid JSON, no markdown formatting.',
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                    detail: 'high',
                  },
                },
              ],
            },
          ],
          max_tokens: isPremium ? 2000 : 800,
          temperature: 0.7,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
    } catch (fetchError) {
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return fail(504, 'Request timeout - please try again');
      }
      console.error('OpenAI fetch error:', fetchError);
      return fail(502, 'AI service is unreachable - please try again');
    }

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error:', openaiResponse.status, errorText.substring(0, 500));
      return fail(502, 'AI service error - please try again');
    }

    const openaiData = await openaiResponse.json();
    const content = openaiData.choices?.[0]?.message?.content;
    if (!content) {
      console.error('No content in OpenAI response');
      return fail(502, 'No response from AI service');
    }

    let result: { ok: boolean; reason?: string; reading?: PalmReading };
    try {
      let cleanContent = content.trim().replace(/```json\s*/g, '').replace(/```\s*/g, '');
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) cleanContent = jsonMatch[0];
      result = JSON.parse(cleanContent);
    } catch {
      console.error('Failed to parse AI response as JSON');
      return fail(500, 'Failed to parse AI response');
    }

    if (!result.ok) {
      return json(
        { ok: false, code: 'not_a_palm', reason: result.reason || 'That does not look like a palm photo' },
        422,
      );
    }
    if (!result.reading) {
      return fail(500, 'Invalid AI response structure');
    }

    const reading = result.reading;

    // Persist and consume quota server-side. The image itself is never stored.
    const { error: insertError } = await admin.from('readings').insert({
      user_id: user.id,
      summary: reading.summary,
      heart_line: reading.heartLine,
      head_line: reading.headLine,
      life_line: reading.lifeLine,
      fate_line: reading.fateLine,
      marks: reading.marks,
      deeper_insights: reading.deeperInsights ?? null,
      prompts: reading.prompts ?? null,
      practices: reading.practices ?? null,
      is_premium: isPremium,
    });
    if (insertError) {
      console.error('Failed to save reading:', insertError);
    }

    const { data: consumeRows, error: consumeError } = await admin.rpc('consume_reading', {
      p_user_id: user.id,
    });
    if (consumeError) {
      console.error('Failed to consume reading quota:', consumeError);
    }
    const remaining = consumeRows?.[0]?.remaining ?? quota.remaining - 1;

    return json(
      { ok: true, reading: { ...reading, isPremium }, remaining },
      200,
    );
  } catch (error) {
    console.error('Unhandled error in analyze-palm:', error);
    return fail(500, 'An unexpected error occurred');
  }
});
