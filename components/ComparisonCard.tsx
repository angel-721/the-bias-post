"use client";

import type { ComparisonSummary } from "@/types";
import { ArrowRight } from "@carbon/icons-react";
import { useRouter } from "next/navigation";

interface ComparisonCardProps {
  comparison: ComparisonSummary;
}

export function ComparisonCard({ comparison }: ComparisonCardProps) {
  const router = useRouter();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleClick = () => {
    router.push(`/compare?id=${comparison.id}`);
  };

  const truncateSummary = (text: string | null, maxLines: number = 2) => {
    if (!text) return null;
    // Rough estimate: ~60 characters per line
    const maxChars = maxLines * 60;
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars).trim() + "...";
  };

  return (
    <button
      onClick={handleClick}
      className="w-full text-left border border-border-color rounded-lg p-6 bg-bg-surface/30 hover:bg-bg-surface/50 transition-colors group"
    >
      {/* Article headlines */}
      <div className="space-y-1 mb-4">
        <p className="font-display font-semibold text-text-primary text-sm line-clamp-1">
          {comparison.article_a.headline}
        </p>
        <p className="text-xs text-text-secondary italic">vs</p>
        <p className="font-display font-semibold text-text-primary text-sm line-clamp-1">
          {comparison.article_b.headline}
        </p>
      </div>

      {/* Likelihood bars */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs font-medium text-text-secondary whitespace-nowrap">
          {comparison.article_a.likelihood}%
        </span>
        <div className="flex-1 h-2 bg-bg-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-hover/60 rounded-full"
            style={{ width: `${comparison.article_a.likelihood}%` }}
          />
        </div>
        <div className="flex-1 h-2 bg-bg-surface rounded-full overflow-hidden">
          <div
            className="h-full bg-accent-hover/60 rounded-full"
            style={{ width: `${comparison.article_b.likelihood}%` }}
          />
        </div>
        <span className="text-xs font-medium text-text-secondary whitespace-nowrap">
          {comparison.article_b.likelihood}%
        </span>
      </div>

      {/* AI summary or pending status */}
      <div className="mb-4 min-h-[40px]">
        {comparison.comparison_generated && comparison.comparison_text ? (
          <p className="text-sm text-text-secondary font-serif line-clamp-2">
            "{truncateSummary(comparison.comparison_text, 2)}"
          </p>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-hover animate-pulse" />
            <span className="text-sm text-text-tertiary italic">
              Analysis pending
            </span>
          </div>
        )}
      </div>

      {/* Footer with date and view button */}
      <div className="flex items-center justify-between pt-3 border-t border-border-color">
        <span className="text-xs text-text-tertiary">
          {formatDate(comparison.created_at)}
        </span>
        <span className="text-sm text-accent font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all">
          View
          <ArrowRight size={16} />
        </span>
      </div>
    </button>
  );
}
