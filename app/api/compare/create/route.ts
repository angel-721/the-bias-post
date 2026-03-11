import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { articleAId, articleBId } = await request.json();

    if (!articleAId || !articleBId) {
      return NextResponse.json(
        { error: 'Missing article IDs' },
        { status: 400 }
      );
    }

    // Check for existing pair using order-agnostic query
    const { data: existingComparison, error: checkError } = await supabaseService
      .from('article_comparisons')
      .select('*')
      .or(`and(article_a_id.eq.${articleAId},article_b_id.eq.${articleBId}),and(article_a_id.eq.${articleBId},article_b_id.eq.${articleAId})`)
      .maybeSingle();

    if (checkError) {
      return NextResponse.json(
        { error: 'Failed to check for existing comparison' },
        { status: 500 }
      );
    }

    // If comparison exists, return it (including comparison_text if generated)
    if (existingComparison) {
      return NextResponse.json({
        comparisonId: existingComparison.id,
        comparisonText: existingComparison.comparison_text,
        comparisonGenerated: existingComparison.comparison_generated,
        createdAt: existingComparison.created_at,
        isNew: false,
      });
    }

    // Create new comparison record (without calling LLM)
    const { data: newComparison, error: insertError } = await supabaseService
      .from('article_comparisons')
      .insert({
        article_a_id: articleAId,
        article_b_id: articleBId,
        comparison_generated: false,
      })
      .select()
      .single();

    if (insertError) {
      // Check if it's a constraint violation (duplicate pair or same article)
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'This comparison already exists' },
          { status: 409 }
        );
      }
      if (insertError.code === '23514') {
        return NextResponse.json(
          { error: 'Cannot compare an article with itself' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create comparison' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      comparisonId: newComparison.id,
      comparisonText: newComparison.comparison_text,
      comparisonGenerated: newComparison.comparison_generated,
      createdAt: newComparison.created_at,
      isNew: true,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
