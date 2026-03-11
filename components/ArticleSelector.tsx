"use client";

import { useState, useEffect } from "react";
import type { LibraryArticle } from "@/types";
import { Search, Close } from "@carbon/icons-react";

interface ArticleSelectorProps {
  slot: "A" | "B";
  selectedArticle: LibraryArticle | null;
  onArticleSelect: (article: LibraryArticle | null) => void;
  disabledArticleIds: string[]; // IDs that cannot be selected (e.g., the other slot's article)
}

export function ArticleSelector({
  slot,
  selectedArticle,
  onArticleSelect,
  disabledArticleIds,
}: ArticleSelectorProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LibraryArticle[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const newTimeout = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/compare/search?q=${encodeURIComponent(query)}&limit=8`
        );
        if (!response.ok) {
          throw new Error("Search failed");
        }
        const data = await response.json();
        setResults(data.articles || []);
      } catch (error) {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // 300ms debounce

    setSearchTimeout(newTimeout);

    return () => {
      if (newTimeout) {
        clearTimeout(newTimeout);
      }
    };
  }, [query]);

  const handleSelectArticle = (article: LibraryArticle) => {
    onArticleSelect(article);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const handleClearSelection = () => {
    onArticleSelect(null);
  };

  const getLikelihoodLabel = (likelihood: number) => {
    if (likelihood >= 70) return "High Bias";
    if (likelihood >= 40) return "Moderate Bias";
    return "Low Bias";
  };

  return (
    <div className="flex-1">
      <label className="block text-sm font-semibold text-text-primary mb-3">
        Article {slot}
      </label>

      {!selectedArticle ? (
        <div className="relative">
          {/* Search input */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Search articles by headline or source..."
              className="w-full pl-10 pr-4 py-3 bg-bg-primary border border-border-color rounded text-text-primary placeholder-text-secondary focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          {/* Search results dropdown */}
          {isOpen && (query.trim().length >= 2 || isLoading) && (
            <div className="absolute z-10 w-full mt-1 bg-bg-primary border border-border-color rounded shadow-lg max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="py-8 text-center text-text-secondary">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-accent mb-2"></div>
                  <p className="text-sm">Searching...</p>
                </div>
              ) : results.length === 0 ? (
                <div className="py-8 text-center text-text-secondary">
                  <p className="text-sm">No articles found</p>
                </div>
              ) : (
                <div className="py-1">
                  {results.map((article) => {
                    const isDisabled = disabledArticleIds.includes(article.id);
                    return (
                      <button
                        key={article.id}
                        onClick={() => !isDisabled && handleSelectArticle(article)}
                        disabled={isDisabled}
                        className={`w-full px-4 py-3 text-left hover:bg-bg-surface transition-colors border-b border-border-color last:border-b-0 ${
                          isDisabled ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-text-primary text-sm line-clamp-2">
                              {article.headline}
                            </p>
                            {article.source_name && (
                              <p className="text-xs text-text-secondary mt-1">
                                {article.source_name}
                              </p>
                            )}
                          </div>
                          <span className="px-2 py-1 text-xs font-medium text-text-secondary border border-border-color italic whitespace-nowrap">
                            {article.likelihood}% bias
                          </span>
                        </div>
                        {isDisabled && (
                          <p className="text-xs text-text-tertiary mt-1 italic">
                            Already selected for Article {slot === "A" ? "B" : "A"}
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Selected article display */
        <div className="border border-border-color rounded p-4 bg-bg-surface/30">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-text-primary line-clamp-2 mb-2">
                {selectedArticle.headline}
              </p>
              {selectedArticle.source_name && (
                <p className="text-sm text-text-secondary mb-2">
                  {selectedArticle.source_name}
                </p>
              )}
              <span className="inline-block px-2 py-1 text-xs font-medium text-text-secondary border border-border-color italic">
                {getLikelihoodLabel(selectedArticle.likelihood)} ({selectedArticle.likelihood}%)
              </span>
            </div>
            <button
              onClick={handleClearSelection}
              className="p-1 hover:bg-bg-surface rounded transition-colors"
              aria-label="Clear selection"
            >
              <Close size={16} className="text-text-secondary" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
