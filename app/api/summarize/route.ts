import { NextRequest, NextResponse } from "next/server";
import { ArticleSummaryPrompt } from "@/lib/prompts/article-summary";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { signal_phrases, likelihood, headline, article_lede, is_low_bias } =
      await request.json();

    if (
      !signal_phrases ||
      !Array.isArray(signal_phrases) ||
      signal_phrases.length === 0
    ) {
      return NextResponse.json(
        { error: "signal_phrases array is required" },
        { status: 400 },
      );
    }

    if (typeof likelihood !== "number") {
      return NextResponse.json(
        { error: "likelihood number is required" },
        { status: 400 },
      );
    }

    const { system, user } = ArticleSummaryPrompt({
      signalPhrases: signal_phrases,
      likelihood,
      headline,
      articleLede: article_lede,
      isLowBias: is_low_bias,
    });

    const response = await openai.chat.completions.create({
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
    });

    const summary = response.choices[0]?.message?.content;

    if (!summary) {
      throw new Error("Empty response from OpenAI");
    }

    return NextResponse.json({ summary });
  } catch (error) {

    // Handle OpenAI-specific errors
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "OpenAI API key is missing or invalid" },
          { status: 500 },
        );
      }
      if (
        error.message.includes("quota") ||
        error.message.includes("billing")
      ) {
        return NextResponse.json(
          { error: "OpenAI quota exceeded. Please check your billing." },
          { status: 429 },
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to generate summary" },
      { status: 500 },
    );
  }
}
