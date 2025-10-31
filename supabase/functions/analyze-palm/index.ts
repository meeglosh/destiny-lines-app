
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PalmReadingRequest {
  imageBase64: string;
  tier: 'standard' | 'premium';
}

interface PalmReadingResponse {
  ok: boolean;
  reason?: string;
  reading?: {
    summary: string;
    heartLine: string;
    headLine: string;
    lifeLine: string;
    fateLine: string;
    marks: string;
    deeperInsights?: string;
    prompts?: string[];
    practices?: string[];
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // BYPASSED FOR TESTING: Authentication check removed
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    });

    // COMMENTED OUT FOR TESTING - Allow analysis without authentication
    // if (!authHeader) {
    //   throw new Error('Missing authorization header');
    // }

    // Verify user is authenticated
    // const {
    //   data: { user },
    //   error: userError,
    // } = await supabase.auth.getUser();

    // if (userError || !user) {
    //   throw new Error('Unauthorized');
    // }

    // For testing, use a dummy user ID
    const user = { id: 'test-user-id' };

    // Parse request body
    const { imageBase64, tier }: PalmReadingRequest = await req.json();

    if (!imageBase64) {
      throw new Error('Missing image data');
    }

    console.log('Analyzing palm for user:', user.id, 'tier:', tier);

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Prepare the prompt based on tier
    const isPremium = tier === 'premium';
    const wordCount = isPremium ? 1000 : 400;

    const systemPrompt = `You are an expert palm reader with deep knowledge of palmistry. 
Analyze the palm image and provide insights in a positive, encouraging tone. 
Never make medical, legal, or financial claims. This is for entertainment purposes only.

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

If the image is not a valid palm image, return:
{
  "ok": false,
  "reason": "Explanation of why the image is not valid"
}

Target approximately ${wordCount} words total for the reading.`;

    // Call OpenAI Vision API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Please analyze this palm image and provide a detailed reading.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: isPremium ? 2000 : 800,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const openaiData = await openaiResponse.json();
    console.log('OpenAI response received');

    // Parse the response
    const content = openaiData.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Try to parse JSON from the response
    let result: PalmReadingResponse;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      throw new Error('Failed to parse palm reading response');
    }

    // COMMENTED OUT FOR TESTING - Skip database operations when not authenticated
    // If the reading is valid, save it to the database
    // if (result.ok && result.reading) {
    //   const { error: insertError } = await supabase.from('readings').insert({
    //     user_id: user.id,
    //     summary: result.reading.summary,
    //     heart_line: result.reading.heartLine,
    //     head_line: result.reading.headLine,
    //     life_line: result.reading.lifeLine,
    //     fate_line: result.reading.fateLine,
    //     marks: result.reading.marks,
    //     deeper_insights: result.reading.deeperInsights || null,
    //     prompts: result.reading.prompts || null,
    //     practices: result.reading.practices || null,
    //     is_premium: isPremium,
    //   });

    //   if (insertError) {
    //     console.error('Failed to save reading:', insertError);
    //     // Don't throw - still return the reading to the user
    //   }

    //   // Update usage stats
    //   const { error: usageError } = await supabase.rpc('increment_reads_used', {
    //     p_user_id: user.id,
    //   });

    //   if (usageError) {
    //     console.error('Failed to update usage stats:', usageError);
    //   }
    // }

    console.log('Returning palm reading result (testing mode - no DB save)');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-palm function:', error);
    return new Response(
      JSON.stringify({
        ok: false,
        reason: error instanceof Error ? error.message : 'An unexpected error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
