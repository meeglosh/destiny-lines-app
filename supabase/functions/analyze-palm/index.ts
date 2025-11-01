
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

    // Parse request body with error handling
    let body: PalmReadingRequest;
    try {
      body = await req.json();
      console.log('Request body parsed successfully');
      console.log('Tier:', body.tier);
      console.log('Image data present:', !!body.imageBase64);
      console.log('Image data length:', body.imageBase64?.length || 0);
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

    // Validate required fields
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

    if (!tier || (tier !== 'standard' && tier !== 'premium')) {
      console.error('Invalid tier:', tier);
      return new Response(
        JSON.stringify({
          ok: false,
          reason: 'Invalid subscription tier',
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

    console.log('✓ Image validation passed');

    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      console.error('OpenAI API key not configured');
      return new Response(
        JSON.stringify({
          ok: false,
          reason: 'Service configuration error - API key missing',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('✓ OpenAI API key found');

    // Prepare the prompt based on tier
    const isPremium = tier === 'premium';
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

If the image is not a valid palm image, return:
{
  "ok": false,
  "reason": "Explanation of why the image is not valid"
}

Target approximately ${wordCount} words total for the reading.`;

    console.log('Calling OpenAI API...');
    console.log('Model: gpt-4o-mini');
    console.log('Max tokens:', isPremium ? 2000 : 800);

    // Call OpenAI Vision API with timeout
    let openaiResponse: Response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 second timeout

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
      console.error('OpenAI API fetch error:', fetchError);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return new Response(
          JSON.stringify({
            ok: false,
            reason: 'Request timeout - please try again',
          }),
          {
            status: 504,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      return new Response(
        JSON.stringify({
          ok: false,
          reason: `Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('OpenAI response status:', openaiResponse.status);
    console.log('OpenAI response headers:', Object.fromEntries(openaiResponse.headers.entries()));

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text();
      console.error('OpenAI API error response:', errorText);

      let errorMessage = 'AI service error';
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorMessage;
      } catch {
        // If not JSON, use the text directly
        errorMessage = errorText.substring(0, 100);
      }

      return new Response(
        JSON.stringify({
          ok: false,
          reason: `AI service error: ${errorMessage}`,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse OpenAI response
    let openaiData: any;
    try {
      openaiData = await openaiResponse.json();
      console.log('✓ OpenAI response parsed successfully');
      console.log('Response structure:', {
        hasChoices: !!openaiData.choices,
        choicesLength: openaiData.choices?.length,
        hasMessage: !!openaiData.choices?.[0]?.message,
        hasContent: !!openaiData.choices?.[0]?.message?.content,
      });
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      return new Response(
        JSON.stringify({
          ok: false,
          reason: 'Failed to parse AI response',
        }),
        {
          status: 502,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Extract content
    const content = openaiData.choices?.[0]?.message?.content;
    if (!content) {
      console.error('No content in OpenAI response');
      console.error('Full response:', JSON.stringify(openaiData));
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

    console.log('✓ Content received, length:', content.length);
    console.log('Content preview:', content.substring(0, 200));

    // Parse the AI response
    let result: PalmReadingResponse;
    try {
      // Remove any markdown code blocks if present
      let cleanContent = content.trim();
      
      // Remove markdown code blocks
      cleanContent = cleanContent.replace(/```json\s*/g, '');
      cleanContent = cleanContent.replace(/```\s*/g, '');
      
      // Try to find JSON object in the content
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }
      
      console.log('Attempting to parse cleaned content...');
      result = JSON.parse(cleanContent);
      console.log('✓ Successfully parsed response JSON');
      console.log('Result structure:', {
        ok: result.ok,
        hasReading: !!result.reading,
        hasReason: !!result.reason,
      });
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Content was:', content);
      
      return new Response(
        JSON.stringify({
          ok: false,
          reason: 'Failed to parse AI response - invalid format',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate the result structure
    if (result.ok && !result.reading) {
      console.error('Invalid result: ok=true but no reading');
      return new Response(
        JSON.stringify({
          ok: false,
          reason: 'Invalid AI response structure',
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
