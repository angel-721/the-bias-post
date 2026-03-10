import { NextRequest } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Reusable system prompt for consistent, efficient output
const SYSTEM_PROMPT = `You explain why machine learning classifiers flag phrases as politically biased.
Focus only on wording, tone, and framing.
Do not add outside context or political opinions.
Be concise and objective.
Maximum 3 sentences.`;

// Trim context to max 2 paragraphs and clean whitespace
function trimContext(context: string): string {
  const paragraphs = context.split("\n\n").slice(0, 2);
  return paragraphs.join("\n\n").trim().replace(/\s+/g, " ");
}

export async function POST(request: NextRequest) {
  try {
    const { signalPhrase, context, likelyPercent } = await request.json();

    if (!signalPhrase || !context || typeof likelyPercent !== "number") {
      return new Response("Missing required fields", { status: 400 });
    }

    const trimmedContext = trimContext(context);

    const prompt = `A bias classifier flagged this as one of the more biased phrases in an article. The classifier rated the full article as ${likelyPercent}% likely to be biased.

Give an objective, concise explanation of why a classifier might flag this phrase as biased, and what perspective or agenda it may favor or oppose. Be specific to the language used. Keep it to 2-3 short paragraphs.

Signal phrase context:
"${trimmedContext}"`;

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

    // Create a readable stream from the OpenAI stream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          console.log("[API] Starting stream from OpenAI...");
          let chunkCount = 0;
          let totalChars = 0;

          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              chunkCount++;
              totalChars += content.length;
              console.log(
                `[API] Chunk ${chunkCount}: ${content.length} chars, total: ${totalChars}`,
              );
              controller.enqueue(encoder.encode(content));
            }
          }

          console.log(
            `[API] Stream complete: ${chunkCount} chunks, ${totalChars} total chars`,
          );
          controller.close();
        } catch (error) {
          console.error("[API] Stream error:", error);
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
    console.error("[API] Request error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
