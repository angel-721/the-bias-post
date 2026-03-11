import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';
import { ComparisonPrompt } from '@/lib/prompts/article-comparison';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { comparisonId } = await request.json();

    if (!comparisonId) {
      return NextResponse.json(
        { error: 'Missing comparison ID' },
        { status: 400 }
      );
    }

    // Fetch the comparison record
    const { data: comparison, error: comparisonError } = await supabaseService
      .from('article_comparisons')
      .select('*')
      .eq('id', comparisonId)
      .single();

    if (comparisonError || !comparison) {
      return NextResponse.json(
        { error: 'Comparison not found' },
        { status: 404 }
      );
    }

    // Check if analysis has already been generated - hard stop if true
    if (comparison.comparison_generated) {
      return NextResponse.json(
        {
          error: 'Comparison analysis has already been generated',
          comparisonText: comparison.comparison_text,
        },
        { status: 409 }
      );
    }

    // Fetch both articles with full data
    const { data: articleA, error: errorA } = await supabaseService
      .from('analyzed_articles')
      .select('*')
      .eq('id', comparison.article_a_id)
      .single();

    const { data: articleB, error: errorB } = await supabaseService
      .from('analyzed_articles')
      .select('*')
      .eq('id', comparison.article_b_id)
      .single();

    if (errorA || errorB || !articleA || !articleB) {
      return NextResponse.json(
        { error: 'Failed to fetch articles for comparison' },
        { status: 500 }
      );
    }

    // Generate the comparison prompt
    const { system, user } = ComparisonPrompt(articleA, articleB);

    const stream = await openai.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [
        {
          role: 'system',
          content: system,
        },
        {
          role: 'user',
          content: user,
        },
      ],
      stream: true,
    });

    // Collect the full response for saving
    let fullResponse = '';
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          let chunkCount = 0;
          let totalChars = 0;

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              chunkCount++;
              totalChars += content.length;
              fullResponse += content;
              controller.enqueue(encoder.encode(content));
            }
          }


          // Save to database after generation completes
          await saveComparisonAnalysis(comparisonId, fullResponse);

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function saveComparisonAnalysis(
  comparisonId: string,
  comparisonText: string
): Promise<void> {
  try {
    await supabaseService
      .from('article_comparisons')
      .update({
        comparison_text: comparisonText,
        comparison_generated: true,
      })
      .eq('id', comparisonId);
  } catch {
    // Silently fail - the comparison was already streamed to the user
  }
}

