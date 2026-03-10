"use client";

import type { LibraryArticle } from "@/types";
import { ArticleColumn } from "@/components/ArticleColumn";
import { ComparativeAnalysisPanel } from "@/components/ComparativeAnalysisPanel";
import { findSharedPhrases } from "@/lib/findSharedPhrases";

interface ComparisonViewProps {
  articleA: LibraryArticle;
  articleB: LibraryArticle;
  onBackToSelection: () => void;
  isReadOnly?: boolean; // When true, disables "Change Articles" button
}

export function ComparisonView({
  articleA,
  articleB,
  onBackToSelection,
  isReadOnly = false,
}: ComparisonViewProps) {
  // Find shared phrases between the two articles
  const sharedPhrases = findSharedPhrases(
    articleA.signal_phrases,
    articleB.signal_phrases
  );

  // Count truly shared phrases (present in both)
  const trulySharedCount = sharedPhrases.filter((sp) => sp.inA && sp.inB).length;

  return (
    <div className="space-y-8">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        {!isReadOnly && (
          <button
            onClick={onBackToSelection}
            className="text-sm text-accent hover:underline font-medium"
          >
            ← Change Articles
          </button>
        )}
        {trulySharedCount > 0 && (
          <div className="text-sm text-text-secondary">
            <span className="inline-block w-3 h-3 border-b-2 border-accent-hover align-middle mr-1"></span>
            {trulySharedCount} shared phrase{trulySharedCount !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Side-by-side comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Article A column */}
        <div className="border border-border-color rounded-lg p-6 bg-bg-surface/20">
          <ArticleColumn
            article={articleA}
            sharedPhrases={sharedPhrases}
            label="Article A"
            showSharedHighlight={true}
          />
        </div>

        {/* Article B column */}
        <div className="border border-border-color rounded-lg p-6 bg-bg-surface/20">
          <ArticleColumn
            article={articleB}
            sharedPhrases={sharedPhrases}
            label="Article B"
            showSharedHighlight={true}
          />
        </div>
      </div>

      {/* AI Comparative Analysis */}
      <ComparativeAnalysisPanel />
    </div>
  );
}
