"use client";

import type { LibraryArticle, SharedPhrase } from "@/types";
import { LikelihoodBar } from "@/components/LikelihoodBar";

interface ArticleColumnProps {
  article: LibraryArticle;
  sharedPhrases: SharedPhrase[];
  label: string;
  showSharedHighlight?: boolean; // If true, highlight phrases that are shared
}

export function ArticleColumn({
  article,
  sharedPhrases,
  label,
  showSharedHighlight = true,
}: ArticleColumnProps) {
  // Get top 4 signal phrases (rank 1-4)
  const topPhrases = article.signal_phrases
    .filter((sp) => sp.rank >= 1 && sp.rank <= 4)
    .sort((a, b) => a.rank - b.rank);

  // Create a map of phrase text to shared phrase object for quick lookup
  const sharedPhraseMap = new Map<string, SharedPhrase>();
  for (const sp of sharedPhrases) {
    // Use the normalized version for lookup
    const normalized = sp.phrase.toLowerCase().trim();
    sharedPhraseMap.set(normalized, sp);
  }

  // Check if a phrase is shared
  const isPhraseShared = (phrase: string): boolean => {
    const normalized = phrase.toLowerCase().trim();
    // Check for exact match or similar match
    for (const [key, value] of sharedPhraseMap.entries()) {
      if (normalized === key || areSimilarPhrases(normalized, key)) {
        return value.inA && value.inB; // Only highlight if present in BOTH articles
      }
    }
    return false;
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Article header */}
      <div className="mb-6 pb-6 border-b border-border-color">
        <p className="text-xs text-text-secondary uppercase tracking-widest mb-2">
          {label}
        </p>
        <h2 className="font-serif text-2xl font-bold text-text-primary leading-tight mb-3">
          {article.headline}
        </h2>
        {article.source_name && (
          <p className="text-sm text-text-secondary">{article.source_name}</p>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto space-y-8 custom-scrollbar">
        {/* Likelihood Bar */}
        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-wide">
            Bias Analysis
          </h3>
          <div className="space-y-4">
            <LikelihoodBar likelihood={article.likelihood} />
          </div>
        </div>

        {/* AI Summary */}
        {article.ai_summary && (
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-wide">
              AI Summary
            </h3>
            <p className="text-sm leading-relaxed text-text-primary font-serif">
              {article.ai_summary}
            </p>
          </div>
        )}

        {/* Top 4 Signal Phrases */}
        {topPhrases.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-text-primary mb-4 uppercase tracking-wide">
              Top 4 Key Phrases
            </h3>
            <div className="space-y-3">
              {topPhrases.map((sp) => {
                const isShared = showSharedHighlight && isPhraseShared(sp.phrase);

                return (
                  <div
                    key={sp.rank}
                    className={`border-l-2 pl-4 py-2 ${
                      isShared
                        ? "border-accent"
                        : "border-border-color"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xs font-medium text-text-secondary mt-0.5">
                        {sp.rank}.
                      </span>
                      <div className="flex-1">
                        {isShared ? (
                          <span className="text-text-primary font-serif italic border-b border-accent pb-0.5">
                            {sp.phrase.length > 120
                              ? `${sp.phrase.slice(0, 120)}...`
                              : sp.phrase}
                          </span>
                        ) : (
                          <p className="text-sm text-text-primary font-serif">
                            {sp.phrase.length > 120
                              ? `${sp.phrase.slice(0, 120)}...`
                              : sp.phrase}
                          </p>
                        )}
                        {isShared && (
                          <p className="text-xs text-text-secondary mt-1">
                            <em>Also found in the other article</em>
                          </p>
                        )}
                        <p className="text-xs text-text-secondary mt-2">
                          Weight: {sp.weight.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Check if two normalized phrases are similar enough to be considered the same.
 */
function areSimilarPhrases(norm1: string, norm2: string): boolean {
  const clean1 = norm1.replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
  const clean2 = norm2.replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();

  if (clean1 === clean2) return true;

  const minLen = Math.min(clean1.length, clean2.length);
  if (minLen < 10) return false;

  const longer = clean1.length > clean2.length ? clean1 : clean2;
  const shorter = clean1.length > clean2.length ? clean2 : clean1;
  const overlapRatio = (longer.includes(shorter) ? shorter.length : 0) / longer.length;

  return overlapRatio >= 0.7;
}
