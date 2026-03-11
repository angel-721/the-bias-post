import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Missing comparison ID' },
        { status: 400 }
      );
    }

    // Fetch comparison with full article data
    const { data, error } = await supabaseService
      .from('article_comparisons')
      .select(`
        id,
        created_at,
        comparison_text,
        comparison_generated,
        article_a:analyzed_articles!article_a_id(*),
        article_b:analyzed_articles!article_b_id(*)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: 'Comparison not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      comparison: data,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
