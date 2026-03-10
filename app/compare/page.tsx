"use client";

import { useArticleStore } from "@/store/useArticleStore";
import { useEffect, useState, Suspense } from "react";
import { ArticleSelector } from "@/components/ArticleSelector";
import { ComparisonView } from "@/components/ComparisonView";
import { ComparisonCard } from "@/components/ComparisonCard";
import { ArrowRight, Add } from "@carbon/icons-react";
import { useSearchParams } from "next/navigation";

function ComparePageContent() {
  const searchParams = useSearchParams();
  const comparisonId = searchParams.get("id");

  const {
    comparisonArticleA,
    comparisonArticleB,
    libraryArticles,
    libraryLoaded,
    comparisonList,
    comparisonListLoading,
    activeComparison,
    fetchLibrary,
    fetchComparisonList,
    fetchComparisonById,
    clearComparison,
    setComparisonArticle,
    setActiveComparison,
    createComparison,
  } = useArticleStore();

  const [showNewComparison, setShowNewComparison] = useState(false);

  useEffect(() => {
    // Fetch library if not loaded
    if (!libraryLoaded) {
      fetchLibrary();
    }

    // Fetch comparison list
    fetchComparisonList();
  }, [libraryLoaded, fetchLibrary, fetchComparisonList]);

  useEffect(() => {
    // If comparisonId is in URL, fetch and display that comparison
    if (comparisonId) {
      fetchComparisonById(comparisonId);
      setShowNewComparison(false);
    } else {
      setActiveComparison(null);
      setShowNewComparison(false);
    }
  }, [comparisonId, fetchComparisonById, setActiveComparison]);

  const handleCompare = async () => {
    if (comparisonArticleA && comparisonArticleB) {
      // Create comparison record
      const newComparisonId = await createComparison();
      if (newComparisonId) {
        // Navigate to the comparison view
        window.location.href = `/compare?id=${newComparisonId}`;
      }
    }
  };

  const canCompare =
    comparisonArticleA !== null &&
    comparisonArticleB !== null &&
    comparisonArticleA.id !== comparisonArticleB.id;

  const disabledIdsForA = comparisonArticleB ? [comparisonArticleB.id] : [];
  const disabledIdsForB = comparisonArticleA ? [comparisonArticleA.id] : [];

  // Active comparison view (when ?id=uuid is present)
  if (comparisonId && activeComparison) {
    return (
      <div className="min-h-screen bg-bg-primary">
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Header with back button */}
          <div className="border-b border-border-color pb-8 mb-12">
            <a
              href="/compare"
              className="text-sm text-accent hover:underline font-medium inline-flex items-center gap-1"
            >
              ← Back to Comparisons
            </a>
            <h1 className="font-display text-5xl font-black tracking-tight text-text-primary mt-4 mb-3">
              Compare Articles
            </h1>
          </div>

          {/* Comparison view */}
          <ComparisonView
            articleA={activeComparison.article_a}
            articleB={activeComparison.article_b}
            onBackToSelection={() => (window.location.href = "/compare")}
            isReadOnly={true}
          />
        </div>
      </div>
    );
  }

  // List view (default)
  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="border-b border-border-color pb-8 mb-12">
          <h1 className="font-display text-5xl font-black tracking-tight text-text-primary mb-3">
            Compare Articles
          </h1>
          <p className="text-text-secondary text-lg">
            Select two articles from your library to compare their bias
            indicators side by side.
          </p>
        </div>

        {/* New Comparison Section */}
        {showNewComparison ? (
          <div className="mb-12 pb-12 border-b border-border-color">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-display text-2xl font-bold text-text-primary">
                New Comparison
              </h2>
              <button
                onClick={() => {
                  setShowNewComparison(false);
                  clearComparison();
                }}
                className="text-sm text-text-secondary hover:text-text-primary"
              >
                Cancel
              </button>
            </div>

            {/* Empty state */}
            {libraryLoaded && libraryArticles.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-text-secondary text-xl mb-6">
                  No articles in your library yet
                </p>
                <a
                  href="/"
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
                  href="/"
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
                    onArticleSelect={(article) =>
                      setComparisonArticle("A", article)
                    }
                    disabledArticleIds={disabledIdsForA}
                  />
                  <ArticleSelector
                    slot="B"
                    selectedArticle={comparisonArticleB}
                    onArticleSelect={(article) =>
                      setComparisonArticle("B", article)
                    }
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
                {comparisonArticleA &&
                  comparisonArticleB &&
                  comparisonArticleA.id === comparisonArticleB.id && (
                    <p className="text-center text-sm text-text-secondary mt-4">
                      Please select two different articles to compare
                    </p>
                  )}
              </div>
            )}
          </div>
        ) : (
          <div className="mb-12 flex items-center justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-text-primary">
                Previous Comparisons
              </h2>
            </div>
            <button
              onClick={() => {
                setShowNewComparison(true);
                clearComparison();
                // Scroll to top
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="px-6 py-3 bg-accent hover:bg-accent-hover text-text-primary font-medium rounded transition-colors inline-flex items-center gap-2"
            >
              <Add size={20} />
              New Comparison
            </button>
          </div>
        )}

        {/* Comparison List */}
        {!showNewComparison && (
          <div>
            {comparisonListLoading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent mb-4"></div>
                <p className="text-text-secondary">Loading comparisons...</p>
              </div>
            ) : comparisonList.length === 0 ? (
              <div className="text-center py-20 border border-border-color rounded-lg bg-bg-surface/20">
                <p className="text-text-secondary text-xl mb-2">
                  No comparisons yet
                </p>
                <p className="text-text-tertiary text-sm mb-6">
                  Create your first comparison to see it here
                </p>
                <button
                  onClick={() => setShowNewComparison(true)}
                  className="px-6 py-3 border border-border-color hover:bg-bg-surface transition-colors text-text-primary font-medium inline-flex items-center gap-2"
                >
                  <Add size={16} />
                  Create Comparison
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {comparisonList.map((comparison) => (
                  <ComparisonCard key={comparison.id} comparison={comparison} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent mb-4"></div>
          <p className="text-text-secondary">Loading comparison...</p>
        </div>
      </div>
    }>
      <ComparePageContent />
    </Suspense>
  );
}
