
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

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

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('=== Palm Analysis Request Started ===');
    console.log('Method:', req.method);
    console.log('Headers:', Object.fromEntries(req.headers.entries()));

    // Parse request body
    let body: PalmReadingRequest;
    try {
      const rawBody = await req.text();
      console.log('Raw body length:', rawBody.length);
      body = JSON.parse(rawBody);
      console.log('Parsed body - tier:', body.tier, 'imageBase64 length:', body.imageBase64?.length || 0);
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError);
      return new Response(
        JSON.stringify({
          ok: false,
          reason: 'Invalid request format',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { imageBase64, tier } = body;

    if (!imageBase64) {
      console.error('Missing image data');
      return new Response(
        JSON.stringify({
          ok: false,
          reason: 'Missing image data',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate base64 image
    if (imageBase64.length < 100) {
      console.error('Image data too short:', imageBase64.length);
      return new Response(
        JSON.stringify({
          ok: false,
          reason: 'Invalid image data - too short',
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Image validation passed');

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({
          ok: false,
          reason: 'Service configuration error',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('OpenAI API key found');

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

    console.log('Calling OpenAI API...');
    console.log('Model: gpt-4o-mini');
    console.log('Max tokens:', isPremium ? 2000 : 800);

    // Call OpenAI Vision API
    let openaiResponse: Response;
    try {
      openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
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
    } catch (fetchError) {
      console.error('Failed to call OpenAI API:', fetchError);
      return new Response(
        JSON.stringify({
          ok: false,
          reason: 'Failed to connect to AI service',
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('OpenAI response status:', openaiResponse.status);

    if (!openaiResponse.ok) {
      let errorData: any;
      try {
        errorData = await openaiResponse.json();
        console.error('OpenAI API error:', JSON.stringify(errorData));
      } catch {
        const errorText = await openaiResponse.text();
        console.error('OpenAI API error (text):', errorText);
        errorData = { error: { message: errorText } };
      }

      return new Response(
        JSON.stringify({
          ok: false,
          reason: `AI service error: ${errorData.error?.message || 'Unknown error'}`,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const openaiData = await openaiResponse.json();
    console.log('OpenAI response received successfully');
    console.log('Choices:', openaiData.choices?.length || 0);

    // Parse the response
    const content = openaiData.choices?.[0]?.message?.content;
    if (!content) {
      console.error('No content in OpenAI response');
      return new Response(
        JSON.stringify({
          ok: false,
          reason: 'No response from AI service',
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Content received, length:', content.length);
    console.log('Content preview:', content.substring(0, 200));

    // Try to parse JSON from the response
    let result: PalmReadingResponse;
    try {
      // Remove markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(cleanContent);
      console.log('Successfully parsed response JSON');
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      console.error('Content was:', content);
      return new Response(
        JSON.stringify({
          ok: false,
          reason: 'Failed to parse AI response',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('=== Palm Analysis Request Completed Successfully ===');

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('=== Unhandled Error in Palm Analysis ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

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
