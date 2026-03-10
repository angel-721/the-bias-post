import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `You are an expert media analyst comparing two news articles for bias.
Your goal is to provide an objective, insightful comparison that helps readers understand differences in perspective, framing, and potential bias.

Focus on:
1. Differences in headline framing and language choices
2. Contrasting perspectives or agendas each article may promote
3. Signal phrases that indicate different biases or viewpoints
4. How the articles might influence readers' perceptions differently

Be specific and evidence-based. Quote phrases from the articles when relevant.
Avoid taking political sides or judging which article is "better."
Be concise but thorough - aim for 3-5 paragraphs.`;

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
      console.error('[API] Comparison fetch error:', comparisonError);
      return NextResponse.json(
        { error: 'Comparison not found' },
        { status: 404 }
      );
    }

    // Check if analysis has already been generated - hard stop if true
    if (comparison.comparison_generated) {
      console.log('[API] Comparison already generated, returning 409');
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
      console.error('[API] Article fetch error:', { errorA, errorB });
      return NextResponse.json(
        { error: 'Failed to fetch articles for comparison' },
        { status: 500 }
      );
    }

    // Generate the comparison prompt
    const prompt = buildComparisonPrompt(articleA, articleB);

    console.log('[API] Generating comparison analysis...');

    const stream = await openai.chat.completions.create({
      model: 'gpt-5-nano',
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: prompt,
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
              console.log(`[API] Chunk ${chunkCount}: ${content.length} chars, total: ${totalChars}`);
              controller.enqueue(encoder.encode(content));
            }
          }

          console.log(`[API] Stream complete: ${chunkCount} chunks, ${totalChars} total chars`);

          // Save to database after generation completes
          await saveComparisonAnalysis(comparisonId, fullResponse);

          controller.close();
        } catch (error) {
          console.error('[API] Stream error:', error);
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
    console.error('[API] Request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function buildComparisonPrompt(
  articleA: any,
  articleB: any
): string {
  const getTopPhrases = (article: any) => {
    return article.signal_phrases
      .filter((sp: any) => sp.rank >= 1 && sp.rank <= 4)
      .map((sp: any) => `${sp.rank}. "${sp.phrase}" (weight: ${sp.weight.toFixed(4)})`)
      .join('\n');
  };

  return `Compare these two news articles for bias and perspective:

**Article A:**
- Headline: "${articleA.headline}"
- Source: ${articleA.source_name || 'Unknown'}
- Bias Likelihood: ${articleA.likelihood}%
- AI Summary: ${articleA.ai_summary || 'N/A'}
- Top Signal Phrases:
${getTopPhrases(articleA)}

**Article B:**
- Headline: "${articleB.headline}"
- Source: ${articleB.source_name || 'Unknown'}
- Bias Likelihood: ${articleB.likelihood}%
- AI Summary: ${articleB.ai_summary || 'N/A'}
- Top Signal Phrases:
${getTopPhrases(articleB)}

Provide an objective comparison highlighting differences in framing, bias, and perspective between these two articles.`;
}

async function saveComparisonAnalysis(
  comparisonId: string,
  comparisonText: string
): Promise<void> {
  try {
    const { error } = await supabaseService
      .from('article_comparisons')
      .update({
        comparison_text: comparisonText,
        comparison_generated: true,
      })
      .eq('id', comparisonId);

    if (error) {
      console.error('[API] Failed to save comparison analysis:', error);
    } else {
      console.log('[API] Comparison analysis saved successfully');
    }
  } catch (error) {
    console.error('[API] Error saving comparison analysis:', error);
  }
}
