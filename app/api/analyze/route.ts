import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text } = body;

    // Validate input
    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Text is required and must be a string" },
        { status: 400 }
      );
    }

    const huggingFaceUrl = process.env.HUGGING_FACE_URL;
    if (!huggingFaceUrl) {
      return NextResponse.json(
        { error: "HuggingFace URL not configured" },
        { status: 500 }
      );
    }

    // Forward request to HuggingFace API
    const response = await fetch(`${huggingFaceUrl}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        top_k: 8,
        context_words: 12,
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "HuggingFace API request failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in analyze API route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
