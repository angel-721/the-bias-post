import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const articleAId = searchParams.get('articleAId');
    const articleBId = searchParams.get('articleBId');

    if (!articleAId || !articleBId) {
      return NextResponse.json(
        { error: 'Missing article IDs' },
        { status: 400 }
      );
    }

    // Check for existing pair using order-agnostic query
    const { data: existingComparison, error: checkError } = await supabaseService
      .from('article_comparisons')
      .select('id, comparison_generated, created_at')
      .or(`and(article_a_id.eq.${articleAId},article_b_id.eq.${articleBId}),and(article_a_id.eq.${articleBId},article_b_id.eq.${articleAId})`)
      .maybeSingle();

    if (checkError) {
      console.error('[API] Comparison check error:', checkError);
      return NextResponse.json(
        { error: 'Failed to check for existing comparison' },
        { status: 500 }
      );
    }

    if (existingComparison) {
      return NextResponse.json({
        exists: true,
        id: existingComparison.id,
        comparisonGenerated: existingComparison.comparison_generated,
        createdAt: existingComparison.created_at,
      });
    }

    return NextResponse.json({
      exists: false,
    });
  } catch (error) {
    console.error('[API] Request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
