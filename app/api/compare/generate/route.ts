import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase";
import OpenAI from "openai";

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
    const { articleAId, articleBId } = await request.json();

    if (!articleAId || !articleBId) {
      return NextResponse.json(
        { error: "Missing article IDs" },
        { status: 400 }
      );
    }

    // Check cache first (order-independent using least/greatest)
    const { data: cachedComparison, error: cacheError } = await supabaseService
      .from("article_comparisons")
      .select("*")
      .or(
        `and(article_a_id.eq.${articleAId},article_b_id.eq.${articleBId}),and(article_a_id.eq.${articleBId},article_b_id.eq.${articleAId})`
      )
      .maybeSingle();

    if (cacheError) {
    }

    if (cachedComparison) {
      return NextResponse.json({
        comparison: cachedComparison.comparison_text,
        cached: true,
      });
    }

    // Cache miss - fetch articles and generate comparison

    const { data: articleA, error: errorA } = await supabaseService
      .from("analyzed_articles")
      .select("*")
      .eq("id", articleAId)
      .single();

    const { data: articleB, error: errorB } = await supabaseService
      .from("analyzed_articles")
      .select("*")
      .eq("id", articleBId)
      .single();

    if (errorA || errorB || !articleA || !articleB) {
      return NextResponse.json(
        { error: "Failed to fetch articles" },
        { status: 500 }
      );
    }

    // Generate the comparison prompt
    const prompt = buildComparisonPrompt(articleA, articleB);


    const stream = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      stream: true,
    });

    // Collect the full response for caching
    let fullResponse = "";
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
                `[API] Chunk ${chunkCount}: ${content.length} chars, total: ${totalChars}`,
              );
              controller.enqueue(encoder.encode(content));
            }
          }

            `[API] Stream complete: ${chunkCount} chunks, ${totalChars} total chars`,
          );

          // Save to cache after generation completes
          await saveComparisonToCache(articleAId, articleBId, fullResponse);

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
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
      .join("\n");
  };

  return `Compare these two news articles for bias and perspective:

**Article A:**
- Headline: "${articleA.headline}"
- Source: ${articleA.source_name || "Unknown"}
- Bias Likelihood: ${articleA.likelihood}%
- AI Summary: ${articleA.ai_summary || "N/A"}
- Top Signal Phrases:
${getTopPhrases(articleA)}

**Article B:**
- Headline: "${articleB.headline}"
- Source: ${articleB.source_name || "Unknown"}
- Bias Likelihood: ${articleB.likelihood}%
- AI Summary: ${articleB.ai_summary || "N/A"}
- Top Signal Phrases:
${getTopPhrases(articleB)}

Provide an objective comparison highlighting differences in framing, bias, and perspective between these two articles.`;
}

async function saveComparisonToCache(
  articleAId: string,
  articleBId: string,
  comparisonText: string
): Promise<void> {
  try {
    // Use least/greatest to ensure consistent ordering regardless of which article was A or B
    const { error } = await supabaseService
      .from("article_comparisons")
      .insert({
        article_a_id: articleAId,
        article_b_id: articleBId,
        comparison_text: comparisonText,
      });

    if (error) {
    } else {
    }
  } catch (error) {
  }
}
