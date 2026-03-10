"use client";

import { LibraryArticleCard } from "@/components/LibraryArticleCard";
import { useArticleStore } from "@/store/useArticleStore";
import { useEffect, useState } from "react";
import { Document } from "@carbon/icons-react";

type SortOption = 'newest' | 'highest_bias' | 'lowest_bias';

export default function FeedPage() {
  const {
    libraryArticles,
    libraryLoaded,
    libraryError,
    fetchLibrary,
  } = useArticleStore();

  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [sortedArticles, setSortedArticles] = useState(libraryArticles);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  useEffect(() => {
    let sorted = [...libraryArticles];

    switch (sortBy) {
      case 'highest_bias':
        sorted.sort((a, b) => b.likelihood - a.likelihood);
        break;
      case 'lowest_bias':
        sorted.sort((a, b) => a.likelihood - b.likelihood);
        break;
      case 'newest':
      default:
        sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    setSortedArticles(sorted);
  }, [libraryArticles, sortBy]);

  return (
    <>
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="font-display text-5xl font-black tracking-tight mb-4">
            ARTICLE LIBRARY
          </h1>
          <div className="w-32 h-0.5 bg-accent mx-auto mb-6"></div>
        </div>

        <div className="max-w-2xl mx-auto text-center mb-6">
          <p className="text-text-secondary leading-relaxed">
            A collection of articles analyzed for potential bias using The Bias Post classifier.
            Each entry includes AI-generated summaries and key signal phrases.
          </p>
        </div>

        {libraryLoaded && libraryArticles.length > 0 && (
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-1 text-xs text-text-secondary">
              <span className="mr-2">Sort:</span>
              <button
                onClick={() => setSortBy('newest')}
                className={`px-3 py-1 rounded transition-colors ${
                  sortBy === 'newest'
                    ? 'text-accent font-medium'
                    : 'hover:text-text-primary'
                }`}
              >
                Newest
              </button>
              <span className="text-text-secondary opacity-50">·</span>
              <button
                onClick={() => setSortBy('highest_bias')}
                className={`px-3 py-1 rounded transition-colors ${
                  sortBy === 'highest_bias'
                    ? 'text-accent font-medium'
                    : 'hover:text-text-primary'
                }`}
              >
                Highest Bias
              </button>
              <span className="text-text-secondary opacity-50">·</span>
              <button
                onClick={() => setSortBy('lowest_bias')}
                className={`px-3 py-1 rounded transition-colors ${
                  sortBy === 'lowest_bias'
                    ? 'text-accent font-medium'
                    : 'hover:text-text-primary'
                }`}
              >
                Lowest Bias
              </button>
            </div>
          </div>
        )}

        <div className="border-b border-border-color mb-8"></div>

        {!libraryLoaded ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-text-secondary">Loading library...</p>
          </div>
        ) : libraryError ? (
          <div className="text-center py-16">
            <Document size={48} className="mx-auto text-text-secondary mb-4" />
            <p className="text-text-secondary">Failed to load library</p>
            <p className="text-sm text-text-secondary mt-2">{libraryError}</p>
          </div>
        ) : sortedArticles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedArticles.map((article) => (
              <LibraryArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Document size={48} className="mx-auto text-text-secondary mb-4" />
            <p className="text-text-secondary mb-2">No articles in the library yet</p>
            <p className="text-sm text-text-secondary">
              Analyze articles and save them to build your collection
            </p>
          </div>
        )}
      </main>
    </>
  );
}
