"use client";

import { useState } from "react";
import type { LibraryArticle } from "@/types";
import { Document, ArrowUpRight } from "@carbon/icons-react";

export function LibraryArticleCard({ article }: { article: LibraryArticle }) {
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  // Check if this is a low bias article (< 30%)
  const isLowBias = article.likelihood < 30;

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  return (
    <div className="bg-bg-surface border border-border-color rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      {/* Article Image or Fallback */}
      <div className="h-48 bg-bg-primary">
        {article.image_url ? (
          <img
            src={article.image_url}
            alt={article.headline}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Document size={48} className="text-text-secondary opacity-30" />
          </div>
        )}
      </div>

      {/* Article Content */}
      <div className="p-4 space-y-3">
        {/* Source and Date */}
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <span className="font-medium">
            {article.source_name || "Unknown Source"}
          </span>
          <span>{formatDate(article.created_at)}</span>
        </div>

        {/* Headline */}
        <h3 className="font-serif text-lg font-bold text-text-primary leading-tight">
          {article.headline}
        </h3>

        {/* Author */}
        {article.author && (
          <p className="text-xs text-text-secondary italic">By {article.author}</p>
        )}

        {/* AI Summary - Show for all articles that have one */}
        {article.ai_summary && (
          <div className="pt-2 border-t border-border-color">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-text-secondary uppercase tracking-widest">
                {isLowBias ? 'Analysis' : 'AI Summary'}
              </p>
              <p className="text-xs text-text-secondary font-normal">
                Bias score: {Math.round(article.likelihood)}%
              </p>
            </div>
            <p className="text-sm text-text-primary leading-relaxed font-serif">
              {summaryExpanded
                ? article.ai_summary
                : article.ai_summary.slice(0, 150) + (article.ai_summary.length > 150 ? "..." : "")
              }
            </p>
            {article.ai_summary.length > 150 && (
              <button
                onClick={() => setSummaryExpanded(!summaryExpanded)}
                className="text-xs text-accent hover:underline mt-1"
              >
                {summaryExpanded ? "Show less" : "Show more"}
              </button>
            )}
          </div>
        )}

        {/* Top Signal Phrases - Only show for articles with bias likelihood >= 30% */}
        {!isLowBias && article.signal_phrases && article.signal_phrases.length > 0 && (
          <div className="pt-2 border-t border-border-color">
            <p className="text-xs text-text-secondary uppercase tracking-widest mb-2">
              Top Indicators
            </p>
            <div className="space-y-1">
              {article.signal_phrases.slice(0, 4).map((sp, index) => (
                <div key={index} className="flex items-start gap-2 text-xs">
                  <span className="text-accent font-semibold">{index + 1}.</span>
                  <span className="text-text-primary line-clamp-2">
                    {sp.phrase.length > 80 ? `${sp.phrase.slice(0, 80)}...` : sp.phrase}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View Original Link */}
        {article.source_url && (
          <a
            href={article.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-accent hover:underline pt-2 border-t border-border-color"
          >
            View Original Article
            <ArrowUpRight size={16} />
          </a>
        )}
      </div>
    </div>
  );
}
