"use client";

import { useState } from "react";
import { useArticleStore } from "@/store/useArticleStore";
import { getConfidenceMessage } from "@/lib/matchSignalPhrases";
import Link from "next/link";
import { LikelihoodBar } from "@/components/LikelihoodBar";

export function BiasAnalysisPanel() {
  const {
    result,
    matchedPhrases,
    step,
    openModal,
    reset,
    aiSummary,
    isSummarizing,
    summaryError,
    isSaving,
    saveError,
    lastSavedArticleId,
    saveToLibrary,
  } = useArticleStore();
  const [signalPhrasesOpen, setSignalPhrasesOpen] = useState(true);

  const biasLikelihood = result?.confidence?.Likely
    ? Math.round(result.confidence.Likely * 100)
    : 0;

  const isLowBias = biasLikelihood < 30;

  const handleExport = () => {
    const store = useArticleStore.getState();
    const { headline, author, body, result, matchedPhrases, aiSummary } = store;

    if (!result) return;

    const exportData = {
      exportedAt: new Date().toISOString(),
      article: {
        headline,
        author,
        body,
      },
      analysis: {
        prediction: result.prediction,
        confidence: result.confidence,
        weight_std: result.weight_std,
        aiBiasSummary: aiSummary || null,
        signal_phrases: matchedPhrases.map((match) => {
          const originalPhrase = result.signal_phrases[match.index];
          return {
            rank: match.index + 1,
            phrase: originalPhrase.phrase,
            weight: originalPhrase.weight,
            context: match.context || "",
            llmExplanation: match.llmAnalyzed ? match.llmExplanation : null,
            llmAnalyzed: match.llmAnalyzed,
          };
        }),
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bias-analysis-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!result) {
    return (
      <div className="analysis-panel space-y-4">
        <div className="analysis-section">
          <p className="text-sm text-text-secondary italic">
            No analysis results yet. Analyze the article to see bias detection results.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="analysis-panel space-y-4">
      <div className="analysis-section">
        <h3 className="analysis-section-title">BIAS ANALYSIS</h3>

        {result.confidence && (
          <div className="space-y-4">
            {result.confidence.Likely !== undefined &&
              result.confidence.Unlikely !== undefined && (
              <LikelihoodBar likelihood={biasLikelihood} />
            )}

            <p className="text-base leading-relaxed text-text-primary font-serif">
              {getConfidenceMessage(biasLikelihood)}
            </p>
          </div>
        )}
      </div>

      <div className="analysis-section">
        <h3 className="analysis-section-title">{isLowBias ? 'AI ANALYSIS' : 'AI SUMMARY'}</h3>

        {isSummarizing ? (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
            <p className="text-sm text-text-secondary mt-2">Generating analysis...</p>
          </div>
        ) : aiSummary ? (
          <div className="space-y-2">
            <p className="text-xs text-text-secondary uppercase tracking-widest">✦ AI Generated</p>
            <p className="text-sm leading-relaxed text-text-primary font-serif">{aiSummary}</p>
          </div>
        ) : summaryError ? (
          <p className="text-sm text-danger">Summary generation failed: {summaryError}</p>
        ) : null}
      </div>

      {aiSummary && !lastSavedArticleId && (
        <div className="analysis-section">
          <button
            onClick={saveToLibrary}
            disabled={isSaving}
            className="w-full px-6 py-3 bg-accent hover:bg-accent-hover text-text-primary disabled:opacity-50 font-semibold tracking-wide transition-colors text-sm"
          >
            {isSaving ? "Saving..." : "Save to Library"}
          </button>
          {saveError && <p className="text-sm text-danger mt-2">{saveError}</p>}
        </div>
      )}

      {lastSavedArticleId && (
        <div className="analysis-section">
          <p className="text-sm text-success mb-2">✓ Saved to library</p>
          <Link href="/" className="text-sm text-accent hover:underline">
            View in Library →
          </Link>
        </div>
      )}

      {!isLowBias && result.signal_phrases && result.signal_phrases.length > 0 && (
        <div className="analysis-section">
          <button
            onClick={() => setSignalPhrasesOpen(!signalPhrasesOpen)}
            className="flex items-center justify-between w-full mb-4"
          >
            <h3 className="analysis-section-title mb-0">
              TOP 4 KEY PHRASES
            </h3>
            <span className="text-text-secondary">
              {signalPhrasesOpen ? "▼" : "▶"}
            </span>
          </button>

          {signalPhrasesOpen && (
            <div className="space-y-2">
              {result.signal_phrases.map(
                (sp: { phrase: string; weight: number }, index: number) => {
                  const match = matchedPhrases[index];
                  const isFound = match?.found || false;

                  return (
                    <div
                      key={index}
                      className={`signal-phrase-item ${
                        !isFound ? "not-found" : "cursor-pointer hover:bg-bg-surface"
                      }`}
                      onClick={() => isFound && openModal(index)}
                    >
                      <div className="signal-phrase-number">{index + 1}</div>
                      <div className="signal-phrase-text">
                        {sp.phrase.length > 120
                          ? `${sp.phrase.slice(0, 120)}...`
                          : sp.phrase}
                        {!isFound && (
                          <span className="not-found-label">
                            not found in text
                          </span>
                        )}
                      </div>
                      <div className="signal-phrase-weight">
                        {sp.weight.toFixed(4)}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      )}

      {step === 'results' && result && (
        <button
          onClick={handleExport}
          className="w-full px-6 py-3 bg-bg-surface border border-border-color text-text-primary hover:bg-bg-surface/80 font-semibold tracking-wide transition-colors text-sm"
        >
          Export JSON
        </button>
      )}

      <div className="analysis-section">
        <div className="flex gap-3">
          <span className="text-accent text-lg">⚠</span>
          <p className="text-xs text-text-secondary leading-relaxed">
            This tool uses language pattern detection to flag potential
            indicators of bias. It is not a definitive judgment. Results may
            vary and should be interpreted with discretion.
          </p>
        </div>
      </div>

      <button
        onClick={reset}
        className="w-full px-6 py-3 border-2 border-accent text-accent hover:bg-accent hover:text-text-primary font-semibold tracking-wide transition-colors"
      >
        Analyze Another Article
      </button>
    </div>
  );
}
