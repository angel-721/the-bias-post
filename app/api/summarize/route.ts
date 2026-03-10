import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { signal_phrases, likelihood } = await request.json();

    if (!signal_phrases || !Array.isArray(signal_phrases) || signal_phrases.length === 0) {
      return NextResponse.json(
        { error: 'signal_phrases array is required' },
        { status: 400 }
      );
    }

    if (typeof likelihood !== 'number') {
      return NextResponse.json(
        { error: 'likelihood number is required' },
        { status: 400 }
      );
    }

    console.log('[API] Generating AI summary for', signal_phrases.length, 'signal phrases');

    // Build the prompt
    const phrasesText = signal_phrases
      .map((sp, i) => `${i + 1}. "${sp.phrase}" (weight: ${sp.weight.toFixed(4)})`)
      .join('\n');

    const userPrompt = `A bias classifier analyzed a news article and flagged these phrases as the top indicators of bias (confidence: ${likelihood}% likely biased):

${phrasesText}

In 2-3 sentences, give an objective summary of what these phrases collectively suggest about the article's framing or perspective. Be specific about what viewpoint or agenda the language may favor or oppose. Do not use absolute language.`;

    console.log('[API] Calling OpenAI API...');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an objective media analyst. You provide neutral, balanced summaries of bias indicators in news articles. Avoid making definitive judgments - focus on describing patterns and tendencies.'
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const summary = response.choices[0]?.message?.content;

    if (!summary) {
      throw new Error('Empty response from OpenAI');
    }

    console.log('[API] AI summary generated successfully');

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('[API] Summary generation error:', error);

    // Handle OpenAI-specific errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'OpenAI API key is missing or invalid' },
          { status: 500 }
        );
      }
      if (error.message.includes('quota') || error.message.includes('billing')) {
        return NextResponse.json(
          { error: 'OpenAI quota exceeded. Please check your billing.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}
