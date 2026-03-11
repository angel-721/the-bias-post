import { NextRequest, NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const headline = searchParams.get("headline");

    if (!headline) {
      return NextResponse.json(
        { error: "headline parameter is required" },
        { status: 400 },
      );
    }

    const { data, error } = await supabaseService
      .from("analyzed_articles")
      .select("id, headline, created_at, likelihood")
      .ilike("headline", headline.trim())
      .limit(1);

    if (error) {
      return NextResponse.json(
        { error: "Database query failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      isDuplicate: data?.length > 0 || false,
      existingArticle: data?.[0] || null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
