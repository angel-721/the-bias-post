"use client";

import { useState } from "react";

export default function Home() {
  const [articleText, setArticleText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<object | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getWordCount = (text: string): number => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  };

  const wordCount = getWordCount(articleText);
  const isValidInput = wordCount >= 100;

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setArticleText(e.target.value);
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!isValidInput) {
      setError(`Article must be at least 100 words. Current: ${wordCount} words.`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: articleText }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Analysis failed");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">News Article Analyzer</h1>

      {/* Input Section */}
      <div className="mb-4">
        <textarea
          value={articleText}
          onChange={handleInputChange}
          placeholder="Enter your article here..."
          rows={12}
          className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Word Counter and Validation */}
      <div className="mb-4">
        <p className={`text-sm ${isValidInput ? "text-green-600" : "text-orange-600"}`}>
          Word count: {wordCount}/100
        </p>
        {!isValidInput && articleText.trim() && (
          <p className="text-sm text-red-600 mt-1">
            Article must be at least 100 words. Current: {wordCount} words.
          </p>
        )}
      </div>

      {/* Analyze Button */}
      <button
        onClick={handleAnalyze}
        disabled={!isValidInput || isLoading}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
      >
        {isLoading ? "Analyzing..." : "Analyze Article"}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mt-6 bg-red-100 text-red-700 p-4 rounded-lg border border-red-300">
          <p className="font-semibold">Error</p>
          <p>{error}</p>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div className="mt-6 bg-gray-100 p-4 rounded-lg border border-gray-300">
          <h2 className="text-xl font-semibold mb-3">Analysis Results</h2>
          <pre className="text-sm overflow-auto max-h-96">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
