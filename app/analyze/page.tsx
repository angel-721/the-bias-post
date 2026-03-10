"use client";

import { useState, useEffect } from "react";
import { useArticleStore } from "@/store/useArticleStore";
import { ArticleEditor } from "@/components/ArticleEditor";
import { FormattedArticle } from "@/components/FormattedArticle";
import { BiasAnalysisPanel } from "@/components/BiasAnalysisPanel";
import { SignalPhraseModal } from "@/components/SignalPhraseModal";
import { SingleColumnLayout } from "@/components/SingleColumnLayout";
import { TwoColumnLayout } from "@/components/TwoColumnLayout";
import { Document } from "@carbon/icons-react";
import { LOADING_FACTS } from "@/lib/loadingFacts";

export default function Home() {
  const step = useArticleStore((s) => s.step);
  const { result, isAnalyzing, error } = useArticleStore();
  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  // Rotate through loading facts during loading
  useEffect(() => {
    if (!isAnalyzing) {
      setCurrentFactIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % LOADING_FACTS.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAnalyzing]);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      {/* Main Content */}
      <main
        className={
          step === "results"
            ? "max-w-7xl mx-auto px-6 py-12"
            : "max-w-3xl mx-auto px-6 py-12"
        }
      >
        {/* Step 1: Input - ArticleEditor */}
        {step === "input" && (
          <SingleColumnLayout>
            <ArticleEditor />
          </SingleColumnLayout>
        )}

        {/* Step 2: Formatted - Single Column */}
        {step === "formatted" && !result && (
          <SingleColumnLayout>
            <FormattedArticle />
          </SingleColumnLayout>
        )}

        {/* Step 3: Results - Two Column Layout */}
        {step === "results" && (
          <>
            {/* Loading State */}
            {isAnalyzing && (
              <div className="text-center py-16">
                <div className="flex justify-center mb-6">
                  <Document size={64} className="text-accent animate-pulse" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-4">
                  Analyzing Your Article...
                </h3>
                <p className="text-text-secondary italic max-w-md mx-auto">
                  {LOADING_FACTS[currentFactIndex]}
                </p>
              </div>
            )}

            {/* Error Display */}
            {error && !isAnalyzing && (
              <div className="bg-bg-surface border-l-4 border-danger p-6">
                <p className="font-semibold text-danger mb-2">
                  Analysis Error
                </p>
                <p className="text-text-secondary">{error}</p>
                <button
                  onClick={() => useArticleStore.getState().editArticle()}
                  className="mt-4 text-accent hover:underline"
                >
                  Start Over
                </button>
              </div>
            )}

            {/* Two-Column Layout with Results */}
            {result && !isAnalyzing && !error && (
              <TwoColumnLayout
                left={<FormattedArticle />}
                right={<BiasAnalysisPanel />}
              />
            )}
          </>
        )}
      </main>

      {/* Signal Phrase Detail Modal */}
      <SignalPhraseModal />
    </div>
  );
}
