import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Fetch comparisons with summary data for list view
    const { data, error, count } = await supabaseService
      .from('article_comparisons')
      .select(`
        id,
        created_at,
        comparison_text,
        comparison_generated,
        article_a:analyzed_articles!article_a_id(id, headline, likelihood),
        article_b:analyzed_articles!article_b_id(id, headline, likelihood)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[API] Comparison list fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comparisons' },
        { status: 500 }
      );
    }

    // Transform the data to match ComparisonSummary type
    const comparisons = (data || []).map((comparison: any) => ({
      id: comparison.id,
      created_at: comparison.created_at,
      article_a: {
        headline: comparison.article_a?.headline || 'Unknown Article',
        likelihood: comparison.article_a?.likelihood || 0,
      },
      article_b: {
        headline: comparison.article_b?.headline || 'Unknown Article',
        likelihood: comparison.article_b?.likelihood || 0,
      },
      comparison_text: comparison.comparison_text,
      comparison_generated: comparison.comparison_generated,
    }));

    return NextResponse.json({
      comparisons,
      count: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[API] Request error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
