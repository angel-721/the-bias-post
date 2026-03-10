"use client";

import { useState } from "react";
import { useArticleStore } from "@/store/useArticleStore";
import { getConfidenceMessage } from "@/lib/matchSignalPhrases";
import type { Step } from "@/types";

export function BiasAnalysisPanel() {
  const { result, matchedPhrases, step, openModal, reset } = useArticleStore();
  const [signalPhrasesOpen, setSignalPhrasesOpen] = useState(true);

  const handleExport = () => {
    const store = useArticleStore.getState();
    const { headline, author, body, result, matchedPhrases } = store;

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
      {/* Verdict Section */}
      <div className="analysis-section">
        <h3 className="analysis-section-title">BIAS ANALYSIS</h3>

        {result.confidence && (
          <div className="space-y-4">
            {/* Confidence Bar */}
            {result.confidence.Likely !== undefined &&
              result.confidence.Unlikely !== undefined && (
              <>
                <div className="flex justify-between text-sm text-text-secondary">
                  <span>Unlikely</span>
                  <span>Likely</span>
                </div>
                <div className="weight-bar-container">
                  <div
                    className="weight-bar-fill"
                    style={{
                      width: `${(result.confidence.Likely || 0) * 100}%`,
                    }}
                  />
                </div>
                <div className="text-center">
                  <span className="text-4xl font-bold text-accent">
                    {Math.round((result.confidence.Likely || 0) * 100)}%
                  </span>
                  <p className="text-sm text-text-secondary mt-1">
                    {Math.round((result.confidence.Likely || 0) * 100) >= 50
                      ? "Likely"
                      : "Unlikely"}{" "}
                    Biased
                  </p>
                </div>
              </>
            )}

            {/* Confidence Message */}
            <p className="text-base leading-relaxed text-text-primary font-serif">
              {getConfidenceMessage(
                Math.round((result.confidence.Likely || 0) * 100)
              )}
            </p>
          </div>
        )}
      </div>

      {/* Signal Phrases Section */}
      {result.signal_phrases && result.signal_phrases.length > 0 && (
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

      {/* Export Button */}
      {step === 'results' && result && (
        <button
          onClick={handleExport}
          className="w-full px-6 py-3 bg-bg-surface border border-border-color text-text-primary hover:bg-bg-surface/80 font-semibold tracking-wide transition-colors text-sm"
        >
          Export JSON
        </button>
      )}

      {/* Footnote */}
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

      {/* Analyze Again Button */}
      <button
        onClick={reset}
        className="w-full px-6 py-3 border-2 border-accent text-accent hover:bg-accent hover:text-text-primary font-semibold tracking-wide transition-colors"
      >
        Analyze Another Article
      </button>
    </div>
  );
}
