import { NextRequest } from "next/server";
import { SignalPhraseExplanationPrompt } from "@/lib/prompts/signal-phrase-explanation";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { signalPhrase, context, likelyPercent } = await request.json();

    if (!signalPhrase || !context || typeof likelyPercent !== "number") {
      return new Response("Missing required fields", { status: 400 });
    }

    const { system, user } = SignalPhraseExplanationPrompt({
      signalPhrase,
      context,
      likelyPercent,
    });

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

    // Create a readable stream from the OpenAI stream
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
              controller.enqueue(encoder.encode(content));
            }
          }

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
    return new Response("Internal server error", { status: 500 });
  }
}
