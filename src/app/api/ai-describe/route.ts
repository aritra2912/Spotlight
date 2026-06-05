import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { title, category, prompt } = await request.json();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.startsWith('sk-proj-YOUR_KEY')) {
      // Fallback response for testing if no key or dummy key is set
      return NextResponse.json({
        success: true,
        variants: [
          `Get ready for the ultimate ${category} experience! Join us for "${title}" where we showcase the best of contemporary talent. Don't miss out on this spectacular night of expression.`,
          `Are you looking for the perfect ${category} escape? "${title}" features a curated roster of artists bringing their best work directly to you. An intimate evening guaranteed to inspire.`,
          `Uncensored. Live. Relentless. "${title}" brings you up close and personal with the raw energy of ${category}. Gather your friends, book your passes, and make memories.`
        ]
      });
    }

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert copywriter for live events. Generate 3 short, high-conversion marketing description variants (max 80 words each) for an event. Return the response as a JSON object with a key "variants" containing an array of 3 string items. Do not include markdown code block formats around the JSON, just return raw JSON.'
          },
          {
            role: 'user',
            content: `Event Title: "${title}", Category: "${category}", Additional Prompt/Context: "${prompt || 'General promo'}".`
          }
        ],
        response_format: { type: 'json_object' }
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error('OpenAI fetch error:', errorData);
      throw new Error(`OpenAI request failed: ${openaiResponse.statusText}`);
    }

    const data = await openaiResponse.json();
    const result = JSON.parse(data.choices[0].message.content);

    return NextResponse.json({
      success: true,
      variants: result.variants || []
    });

  } catch (error) {
    const err = error as Error;
    console.error('AI describe handler error:', err);
    return NextResponse.json(
      { success: false, message: err.message || 'Failed to generate descriptions' },
      { status: 500 }
    );
  }
}
