"use client";

import { useArticleStore } from "@/store/useArticleStore";
import { useEffect } from "react";
import { ArticleSelector } from "@/components/ArticleSelector";
import { ComparisonView } from "@/components/ComparisonView";
import { ArrowRight } from "@carbon/icons-react";

export default function ComparePage() {
  const {
    comparisonStep,
    comparisonArticleA,
    comparisonArticleB,
    libraryArticles,
    libraryLoaded,
    fetchLibrary,
    clearComparison,
    setComparisonArticle,
    setComparisonStep,
  } = useArticleStore();

  useEffect(() => {
    // Clear comparison state on mount
    clearComparison();

    // Fetch library if not loaded
    if (!libraryLoaded) {
      fetchLibrary();
    }
  }, [libraryLoaded, fetchLibrary, clearComparison]);

  const handleCompare = () => {
    if (comparisonArticleA && comparisonArticleB) {
      setComparisonStep("comparison");
    }
  };

  const canCompare =
    comparisonArticleA !== null &&
    comparisonArticleB !== null &&
    comparisonArticleA.id !== comparisonArticleB.id;

  const disabledIdsForA = comparisonArticleB ? [comparisonArticleB.id] : [];
  const disabledIdsForB = comparisonArticleA ? [comparisonArticleA.id] : [];

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="border-b border-border-color pb-8 mb-12">
          <h1 className="font-display text-5xl font-black tracking-tight text-text-primary mb-3">
            Compare Articles
          </h1>
          <p className="text-text-secondary text-lg">
            Select two articles from your library to analyze side-by-side
          </p>
        </div>

        {/* Content based on state */}
        {comparisonStep === "selection" && (
          <div>
            {/* Empty state */}
            {libraryLoaded && libraryArticles.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-text-secondary text-xl mb-6">
                  No articles in your library yet
                </p>
                <a
                  href="/analyze"
                  className="inline-block px-8 py-3 bg-accent text-text-primary font-medium rounded hover:bg-accent-hover transition-colors"
                >
                  Analyze Your First Article
                </a>
              </div>
            ) : libraryArticles.length < 2 ? (
              <div className="text-center py-20">
                <p className="text-text-secondary text-xl mb-6">
                  You need at least 2 articles in your library to compare them
                </p>
                <a
                  href="/analyze"
                  className="inline-block px-8 py-3 bg-accent text-text-primary font-medium rounded hover:bg-accent-hover transition-colors"
                >
                  Analyze Another Article
                </a>
              </div>
            ) : (
              <div className="max-w-5xl mx-auto">
                {/* Article selectors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <ArticleSelector
                    slot="A"
                    selectedArticle={comparisonArticleA}
                    onArticleSelect={(article) => setComparisonArticle("A", article)}
                    disabledArticleIds={disabledIdsForA}
                  />
                  <ArticleSelector
                    slot="B"
                    selectedArticle={comparisonArticleB}
                    onArticleSelect={(article) => setComparisonArticle("B", article)}
                    disabledArticleIds={disabledIdsForB}
                  />
                </div>

                {/* Compare button */}
                <div className="flex justify-center">
                  <button
                    onClick={handleCompare}
                    disabled={!canCompare}
                    className="px-8 py-4 bg-accent hover:bg-accent-hover text-text-primary disabled:opacity-50 disabled:cursor-not-allowed font-semibold tracking-wide transition-colors flex items-center gap-3 text-lg"
                  >
                    Compare Articles
                    <ArrowRight size={20} />
                  </button>
                </div>

                {/* Hint text */}
                {comparisonArticleA && comparisonArticleB && comparisonArticleA.id === comparisonArticleB.id && (
                  <p className="text-center text-sm text-text-secondary mt-4">
                    Please select two different articles to compare
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {comparisonStep === "comparison" && comparisonArticleA && comparisonArticleB && (
          <ComparisonView
            articleA={comparisonArticleA}
            articleB={comparisonArticleB}
            onBackToSelection={() => setComparisonStep("selection")}
          />
        )}
      </div>
    </div>
  );
}
