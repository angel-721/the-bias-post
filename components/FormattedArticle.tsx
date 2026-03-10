"use client";

import { useState } from "react";
import { useArticleStore } from "@/store/useArticleStore";
import { Edit } from "@carbon/icons-react";
import { matchSignalPhrases } from "@/lib/matchSignalPhrases";
import { SignalBadge } from "./SignalBadge";
import { useRouter } from "next/navigation";

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
    checkDuplicate,
    isDuplicate,
  } = useArticleStore();

  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const router = useRouter();

  const handleAnalyze = async () => {
    await checkDuplicate();

    setTimeout(async () => {
      if (isDuplicate) {
        setShowDuplicateWarning(true);
        return;
      }

      performAnalysis();
    }, 100);
  };

  const performAnalysis = async () => {
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

      setResult(data);

      if (data.signal_phrases && data.signal_phrases.length > 0) {
        const matches = matchSignalPhrases(body, data.signal_phrases);
        setMatchedPhrases(matches);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
    } finally {
      setAnalyzing(false);
    }
  };

  const buildSegments = (text: string, matches: typeof matchedPhrases, showHighlights: boolean) => {
    if (!matches.length || !showHighlights) {
      return [{ type: 'text' as const, content: text }];
    }

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

      if (start > cursor) {
        segments.push({
          type: 'text',
          content: text.slice(cursor, start),
        });
      }

      segments.push({
        type: 'highlight',
        content: text.slice(start, end),
        phraseIndex: index,
        weight,
      });

      cursor = end;
    });

    if (cursor < text.length) {
      segments.push({
        type: 'text',
        content: text.slice(cursor),
      });
    }

    return segments;
  };

  const biasLikelihood = result?.confidence?.Likely
    ? Math.round(result.confidence.Likely * 100)
    : 0;
  const showHighlights = biasLikelihood >= 30;
  const segments = buildSegments(body, matchedPhrases, showHighlights);

  return (
    <div className="space-y-8">
      {showDuplicateWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-bg-surface border border-border-color rounded-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-xl font-bold text-text-primary">Duplicate Article Detected</h3>
            <p className="text-sm text-text-secondary">
              An article with the headline "{headline}" already exists in the library.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDuplicateWarning(false);
                  router.push("/");
                }}
                className="flex-1 px-4 py-2 bg-bg-surface border border-border-color text-text-primary hover:bg-bg-primary transition-colors text-sm font-semibold"
              >
                View in Library
              </button>
              <button
                onClick={() => {
                  setShowDuplicateWarning(false);
                  performAnalysis();
                }}
                className="flex-1 px-4 py-2 bg-accent hover:bg-accent-hover text-text-primary transition-colors text-sm font-semibold"
              >
                Analyze Anyway
              </button>
            </div>
          </div>
        </div>
      )}

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

      {headline && (
        <h1 className="font-display text-4xl font-black leading-tight mb-4 text-text-primary">
          {headline}
        </h1>
      )}

      {author && (
        <p className="text-sm text-text-secondary uppercase tracking-widest mb-6 italic">
          By {author}
        </p>
      )}

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
