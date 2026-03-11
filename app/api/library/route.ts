import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'newest';

    let query = supabaseService
      .from('analyzed_articles')
      .select('*');

    // Apply sorting
    switch (sortBy) {
      case 'highest_bias':
        query = query.order('likelihood', { ascending: false });
        break;
      case 'lowest_bias':
        query = query.order('likelihood', { ascending: true });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    const { data, error } = await query.range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch library' },
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
