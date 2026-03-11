import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const limit = parseInt(searchParams.get('limit') || '8');

    if (!query.trim()) {
      return NextResponse.json({
        articles: [],
        count: 0
      });
    }

    // Search in headline and source_name with case-insensitive match
    const { data, error } = await supabaseService
      .from('analyzed_articles')
      .select('*')
      .or(`headline.ilike.%${query}%,source_name.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to search articles' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      articles: data || [],
      count: data?.length || 0
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
