"use client";

import { useState } from "react";
import { useArticleStore } from "@/store/useArticleStore";
import { Edit } from "@carbon/icons-react";
import { matchSignalPhrases } from "@/lib/matchSignalPhrases";
import { SignalBadge } from "./SignalBadge";

export function FormattedArticle() {
  const {
    headline,
    author,
    body,
    result,
    matchedPhrases,
    isAnalyzing,
    step,
    editArticle,
    setAnalyzing,
    setResult,
    setMatchedPhrases,
    setError,
    openModal,
  } = useArticleStore();

  const [highlightedPhraseId, setHighlightedPhraseId] = useState<number | null>(null);

  // Analyze article function
  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: body }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Analysis failed");
      }

      const data = await response.json();
      console.log("API Response:", data);

      setResult(data);

      // Match signal phrases for annotation
      if (data.signal_phrases && data.signal_phrases.length > 0) {
        console.log("=== SIGNAL PHRASE MATCHING DEBUG ===");
        console.log("Signal phrases from API:", data.signal_phrases);
        console.log("Article text length:", body.length);

        const matches = matchSignalPhrases(body, data.signal_phrases);
        console.log("Matched phrases:", matches);
        console.log("Found matches:", matches.filter((m) => m.found).length);
        console.log("=== END DEBUG ===");

        setMatchedPhrases(matches);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  };

  // Scroll to highlighted phrase and pulse it
  const scrollToPhrase = (index: number) => {
    setHighlightedPhraseId(index);
    setTimeout(() => {
      const element = document.querySelector(`mark[data-index="${index}"]`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => setHighlightedPhraseId(null), 2000);
      }
    }, 100);
  };

  // Build segments from article body with highlighted phrases
  const buildSegments = (text: string, matches: typeof matchedPhrases) => {
    if (!matches.length) {
      return [{ type: 'text' as const, content: text }];
    }

    // Filter only found matches and sort by position
    const foundMatches = matches
      .filter((m) => m.found)
      .sort((a, b) => a.start - b.start);

    if (!foundMatches.length) {
      return [{ type: 'text' as const, content: text }];
    }

    const segments: Array<{
      type: 'text' | 'highlight';
      content: string;
      phraseIndex?: number;
      weight?: number;
    }> = [];

    let cursor = 0;

    foundMatches.forEach((match) => {
      const { start, end, weight, index } = match;

      // Add text before this match
      if (start > cursor) {
        segments.push({
          type: 'text',
          content: text.slice(cursor, start),
        });
      }

      // Add highlighted match
      segments.push({
        type: 'highlight',
        content: text.slice(start, end),
        phraseIndex: index,
        weight,
      });

      cursor = end;
    });

    // Add remaining text
    if (cursor < text.length) {
      segments.push({
        type: 'text',
        content: text.slice(cursor),
      });
    }

    console.log('Segments:', segments.map(s => ({
      type: s.type,
      content: s.content?.substring(0, 40),
      phraseIndex: s.phraseIndex ?? null
    })));

    return segments;
  };

  // Build segments once for the entire article
  const segments = buildSegments(body, matchedPhrases);

  return (
    <div className="space-y-8">
      {/* Header with title and edit link */}
      <div className="flex items-center justify-between border-b border-border-color pb-4">
        <h2 className="font-display text-2xl font-bold">Article Analysis</h2>
        {step === 'formatted' && (
          <button
            onClick={editArticle}
            className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors text-sm"
          >
            <Edit size={16} />
            Edit
          </button>
        )}
      </div>

      {/* Optional Headline */}
      {headline && (
        <h1 className="font-display text-4xl font-black leading-tight mb-4 text-text-primary">
          {headline}
        </h1>
      )}

      {/* Optional Author Byline */}
      {author && (
        <p className="text-sm text-text-secondary uppercase tracking-widest mb-6 italic">
          By {author}
        </p>
      )}

      {/* Article content */}
      <article className="border-t border-border-color pt-8">
        {segments.length > 0 ? (
          <div className="prose prose-lg max-w-none">
            {segments.map((segment, idx) => {
              if (segment.type === 'highlight') {
                const match = matchedPhrases.find(m => m.index === segment.phraseIndex);
                const isAnalyzed = match?.llmAnalyzed;

                return (
                  <mark
                    key={`seg-${idx}`}
                    data-index={segment.phraseIndex}
                    className={`relative inline px-1 cursor-pointer transition-all border-l-4 ${
                      isAnalyzed
                        ? "bg-blue-500/15 border-blue-500/60"
                        : "bg-amber-500/20 border-b-2 border-amber-500/50 border-l-0"
                    } ${
                      highlightedPhraseId === segment.phraseIndex
                        ? "outline outline-2 " + (isAnalyzed ? "outline-blue-500" : "outline-amber-500")
                        : ""
                    }`}
                  >
                    {segment.content}
                    <SignalBadge
                      number={segment.phraseIndex! + 1}
                      weight={segment.weight!}
                      onClick={() => openModal(segment.phraseIndex!)}
                      analyzed={isAnalyzed || false}
                    />
                  </mark>
                );
              }
              return <span key={`seg-${idx}`}>{segment.content}</span>;
            })}
          </div>
        ) : (
          <p className="text-text-secondary italic">No article content to display.</p>
        )}
      </article>

      {/* Analyze Button (only shown when no results) */}
      {!result && (
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing}
          className="w-full px-8 py-4 bg-accent hover:bg-accent-hover text-text-primary font-semibold tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? "Analyzing..." : "Analyze for Bias"}
        </button>
      )}
    </div>
  );
}
