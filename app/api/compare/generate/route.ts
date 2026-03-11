import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase";
import { ComparisonPrompt } from "@/lib/prompts/article-comparison";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    const { system, user } = ComparisonPrompt(articleA, articleB);

    const stream = await openai.chat.completions.create({
      model: "gpt-5-nano",
      messages: [
        {
          role: "system",
          content: system,
        },
        {
          role: "user",
          content: user,
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
              controller.enqueue(encoder.encode(content));
            }
          }

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

async function saveComparisonToCache(
  articleAId: string,
  articleBId: string,
  comparisonText: string
): Promise<void> {
  try {
    const { error } = await supabaseService
      .from("article_comparisons")
      .insert({
        article_a_id: articleAId,
        article_b_id: articleBId,
        comparison_text: comparisonText,
      });
  } catch (error) {
    // Silently fail - the comparison was already streamed to the user
  }
}

