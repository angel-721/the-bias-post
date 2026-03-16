"use client";

import { useState, useEffect, useRef } from "react";
import { useArticleStore } from "@/store/useArticleStore";
import { ArticleEditor } from "@/components/ArticleEditor";
import { FormattedArticle } from "@/components/FormattedArticle";
import { BiasAnalysisPanel } from "@/components/BiasAnalysisPanel";
import { SignalPhraseModal } from "@/components/SignalPhraseModal";
import { SingleColumnLayout } from "@/components/SingleColumnLayout";
import { TwoColumnLayout } from "@/components/TwoColumnLayout";
import { Document, Time } from "@carbon/icons-react";
import { LOADING_FACTS } from "@/lib/loadingFacts";

export default function Home() {
  const step = useArticleStore((s) => s.step);
  const { result, isAnalyzing, error, editArticle } = useArticleStore();
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const analysisStartTime = useRef<number | null>(null);

  // Rotate through loading facts during loading
  useEffect(() => {
    if (!isAnalyzing) {
      setCurrentFactIndex(0);
      setElapsedTime(0);
      analysisStartTime.current = null;
      return;
    }

    // Start timer when analysis begins
    if (!analysisStartTime.current) {
      analysisStartTime.current = Date.now();
    }

    // Update elapsed time every second
    const timeInterval = setInterval(() => {
      if (analysisStartTime.current) {
        setElapsedTime(Math.floor((Date.now() - analysisStartTime.current) / 1000));
      }
    }, 1000);

    // Rotate facts every 5 seconds (slower for better readability)
    const factInterval = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % LOADING_FACTS.length);
    }, 5000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(factInterval);
    };
  }, [isAnalyzing]);

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getColdStartMessage = (seconds: number): string | null => {
    if (seconds >= 20 && seconds < 35) {
      return "The AI model is warming up. First analyses take longer...";
    }
    if (seconds >= 35 && seconds < 50) {
      return "Initializing bias detection algorithms. Almost there...";
    }
    if (seconds >= 50) {
      return "Thank you for your patience. The analysis will complete shortly.";
    }
    return null;
  };

  const coldStartMessage = getColdStartMessage(elapsedTime);

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

                {/* Time indicator */}
                <div className="flex items-center justify-center gap-2 mb-4 text-text-secondary">
                  <Time size={16} />
                  <span className="text-sm">{formatTime(elapsedTime)}</span>
                </div>

                {/* Cold start message */}
                {coldStartMessage && (
                  <div className="mb-4 px-4 py-2 bg-bg-surface rounded-lg max-w-md mx-auto">
                    <p className="text-sm text-text-secondary">{coldStartMessage}</p>
                  </div>
                )}

                {/* Loading fact */}
                <div className="bg-bg-surface rounded-lg px-6 py-4 max-w-lg mx-auto border border-border-color">
                  <p className="text-text-secondary italic text-sm leading-relaxed">
                    {LOADING_FACTS[currentFactIndex]}
                  </p>
                </div>

                {/* Progress indicator for longer waits */}
                {elapsedTime >= 20 && (
                  <div className="mt-6 max-w-md mx-auto">
                    <div className="h-1 bg-bg-surface rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-1000 ease-in-out"
                        style={{
                          width: `${Math.min((elapsedTime / 60) * 100, 100)}%`
                        }}
                      />
                    </div>
                    <p className="text-xs text-text-tertiary mt-2">
                      {elapsedTime < 60 ? "Warming up..." : "Processing your article"}
                    </p>
                  </div>
                )}
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
                  onClick={editArticle}
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
