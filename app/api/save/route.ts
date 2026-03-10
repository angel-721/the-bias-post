import { NextRequest, NextResponse } from 'next/server';
import { supabaseService } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.headline || typeof body.headline !== 'string') {
      return NextResponse.json(
        { error: 'headline is required' },
        { status: 400 }
      );
    }

    if (!body.prediction || typeof body.prediction !== 'string') {
      return NextResponse.json(
        { error: 'prediction is required' },
        { status: 400 }
      );
    }

    if (typeof body.likelihood !== 'number') {
      return NextResponse.json(
        { error: 'likelihood is required' },
        { status: 400 }
      );
    }

    if (typeof body.weightStd !== 'number') {
      return NextResponse.json(
        { error: 'weightStd is required' },
        { status: 400 }
      );
    }

    if (!body.signalPhrases || !Array.isArray(body.signalPhrases)) {
      return NextResponse.json(
        { error: 'signalPhrases array is required' },
        { status: 400 }
      );
    }

    // aiSummary is required for all articles
    if (!body.aiSummary || typeof body.aiSummary !== 'string') {
      return NextResponse.json(
        { error: 'aiSummary is required' },
        { status: 400 }
      );
    }

    console.log('[API] Saving article:', body.headline.trim());

    // Check for duplicate before insert
    const { data: existing, error: checkError } = await supabaseService
      .from('analyzed_articles')
      .select('id')
      .ilike('headline', body.headline.trim())
      .limit(1);

    if (checkError) {
      console.error('[API] Duplicate check error:', checkError);
      return NextResponse.json(
        { error: 'Database query failed' },
        { status: 500 }
      );
    }

    if (existing?.length > 0) {
      console.log('[API] Duplicate article detected');
      return NextResponse.json(
        { error: 'duplicate' },
        { status: 409 }
      );
    }

    // Insert the article
    const { data, error } = await supabaseService
      .from('analyzed_articles')
      .insert({
        headline: body.headline.trim(),
        author: body.author?.trim() || null,
        source_name: body.sourceName?.trim() || null,
        source_url: body.sourceUrl?.trim() || null,
        image_url: body.imageUrl?.trim() || null,
        prediction: body.prediction,
        likelihood: body.likelihood,
        weight_std: body.weightStd,
        signal_phrases: body.signalPhrases,
        ai_summary: body.aiSummary.trim(),
        ai_summary_generated: true,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[API] Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to save article' },
        { status: 500 }
      );
    }

    if (!data || !data.id) {
      console.error('[API] No ID returned from insert');
      return NextResponse.json(
        { error: 'Failed to save article' },
        { status: 500 }
      );
    }

    console.log('[API] Article saved successfully:', data.id);

    return NextResponse.json({
      success: true,
      articleId: data.id
    });
  } catch (error) {
    console.error('[API] Save error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
