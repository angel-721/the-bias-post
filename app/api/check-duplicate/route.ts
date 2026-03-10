import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const headline = searchParams.get('headline');

    if (!headline) {
      return NextResponse.json(
        { error: 'headline parameter is required' },
        { status: 400 }
      );
    }

    console.log('[API] Checking duplicate for headline:', headline.trim());

    const { data, error } = await supabaseService
      .from('analyzed_articles')
      .select('id, headline, created_at, likelihood')
      .ilike('headline', headline.trim())
      .limit(1);

    if (error) {
      console.error('[API] Supabase error:', error);
      return NextResponse.json(
        { error: 'Database query failed' },
        { status: 500 }
      );
    }

    console.log('[API] Duplicate check result:', {
      isDuplicate: data?.length > 0,
      existingArticle: data?.[0] || null
    });

    return NextResponse.json({
      isDuplicate: data?.length > 0 || false,
      existingArticle: data?.[0] || null
    });
  } catch (error) {
    console.error('[API] Duplicate check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
