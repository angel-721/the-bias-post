"use client";

import { useState, useEffect } from "react";
import { useArticleStore } from "@/store/useArticleStore";
import { Close } from "@carbon/icons-react";
import { LOADING_FACTS } from "@/lib/loadingFacts";

export function SignalPhraseModal() {
  const { activeModal, matchedPhrases, closeModal, result, setLlmLoading, setLlmExplanation } = useArticleStore();
  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  // Rotate through loading facts while LLM is loading
  useEffect(() => {
    if (activeModal === null) {
      setCurrentFactIndex(0);
      return;
    }

    const match = matchedPhrases.find(m => m.index === activeModal);
    if (!match || !match.llmLoading) {
      setCurrentFactIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % LOADING_FACTS.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeModal, matchedPhrases]);

  if (activeModal === null) return null;

  const match = matchedPhrases.find(m => m.index === activeModal);
  if (!match || !match.found || !match.context) return null;

  const phraseRank = matchedPhrases.filter(m => m.found).sort((a, b) => b.weight - a.weight).findIndex(m => m.index === activeModal) + 1;
  const totalPhrases = matchedPhrases.filter(m => m.found).length;

  const likelyPercent = result ? Math.round(result.confidence.Likely * 100) : 0;

  const handleAnalyzeBias = async () => {
    if (match.llmLoading || match.llmAnalyzed) return;

    console.log('[Modal] Starting analysis for phrase', match.index);
    setLlmLoading(match.index, true);

    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signalPhrase: match.phrase,
          context: match.context,
          likelyPercent,
        }),
      });

      console.log('[Modal] Response status:', res.status);
      console.log('[Modal] Response headers:', Object.fromEntries(res.headers.entries()));

      if (!res.ok) {
        throw new Error(`Failed to get explanation: ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) {
        throw new Error('No reader available');
      }

      const decoder = new TextDecoder();
      let accumulated = '';
      let chunkCount = 0;

      console.log('[Modal] Starting to read stream...');

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log('[Modal] Stream complete, total chunks:', chunkCount);
          console.log('[Modal] Final explanation length:', accumulated.length);
          break;
        }

        chunkCount++;
        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        console.log(`[Modal] Chunk ${chunkCount}: ${chunk.length} chars, accumulated: ${accumulated.length}`);

        setLlmExplanation(match.index, accumulated);
      }

      console.log('[Modal] Analysis complete for phrase', match.index);
    } catch (error) {
      console.error('[Modal] Error analyzing phrase:', error);
      setLlmLoading(match.index, false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={closeModal}
    >
      <div
        className="bg-bg-primary border border-border-color text-text-primary max-w-4xl w-full mx-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-color">
          <h2 className="text-lg font-bold font-display">
            SIGNAL PHRASE <span className="text-amber-500">{match.index + 1}</span>
          </h2>
          <button
            onClick={closeModal}
            className="text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Close modal"
          >
            <Close size={20} />
          </button>
        </div>

        {/* Two-column content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-6 py-6">
          {/* Left column - Phrase details */}
          <div>
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wide mb-4">
              PHRASE DETAILS
            </h3>

            {/* Context blockquote */}
            <blockquote className="font-serif text-base leading-relaxed text-text-secondary border-l-4 border-amber-500 pl-4 mb-6 italic">
              "{match.context}"
            </blockquote>

            {/* Stats */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">Signal weight</span>
                <span className="font-mono font-bold">{match.weight.toFixed(4)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-secondary">Phrase rank</span>
                <span className="font-mono font-bold">{phraseRank} of {totalPhrases}</span>
              </div>
            </div>

            {/* Analyze button */}
            <div className="mt-6">
              {match.llmAnalyzed ? (
                <div className="px-6 py-3 bg-bg-surface text-text-secondary text-center text-sm font-medium">
                  Analysis complete
                </div>
              ) : (
                <button
                  onClick={handleAnalyzeBias}
                  disabled={match.llmLoading || match.llmAnalyzed}
                  className="w-full px-6 py-3 bg-accent hover:bg-accent-hover text-text-primary font-semibold tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {match.llmLoading ? 'Analyzing...' : 'Analyze Bias'}
                </button>
              )}
            </div>

            {/* Disclaimer */}
            <div className="mt-4 text-xs text-text-secondary">
              ⚠ AI analysis may not be fully accurate.
            </div>
          </div>

          {/* Right column - AI Analysis */}
          <div>
            <h3 className="text-sm font-bold text-text-secondary uppercase tracking-wide mb-4">
              AI ANALYSIS
            </h3>

            <div className="h-full min-h-[200px]">
              {match.llmLoading || match.llmAnalyzed ? (
                <>
                  {/* AI Generated label */}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-accent text-sm">✦</span>
                    <span className="text-xs text-text-secondary uppercase tracking-wide">
                      AI Generated
                    </span>
                  </div>

                  {match.llmLoading ? (
                    <>
                      {/* Pulsing placeholder */}
                      <div className="animate-pulse bg-bg-surface rounded h-20 mb-4"></div>

                      {/* Did you know section */}
                      <div className="text-sm">
                        <div className="text-text-secondary uppercase tracking-wide mb-2">
                          Did you know?
                        </div>
                        <div className="transition-opacity duration-500">
                          {LOADING_FACTS[currentFactIndex]}
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Complete explanation */
                    <div className="font-serif text-base leading-relaxed text-text-primary">
                      {match.llmExplanation}
                    </div>
                  )}
                </>
              ) : (
                /* Placeholder before analysis */
                <div className="text-text-secondary italic text-sm">
                  Click "Analyze Bias" to get an AI explanation of why this phrase was flagged.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
