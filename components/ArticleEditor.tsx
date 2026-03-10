"use client";

import { useArticleStore } from "@/store/useArticleStore";
import { getWordCount } from "@/lib/matchSignalPhrases";

export function ArticleEditor() {
  const {
    headline,
    author,
    body,
    sourceName,
    sourceUrl,
    imageUrl,
    error,
    setField,
    saveArticle,
  } = useArticleStore();

  const wordCount = getWordCount(body);
  const isValidInput = wordCount >= 100 && wordCount <= 4000;
  const isOverMax = wordCount > 4000;

  const handleInputChange = (field: "headline" | "author" | "body", value: string) => {
    setField(field, value);
    if (error) setField("body", body); // Clear error on input
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-xs uppercase tracking-widest text-text-secondary mb-3">
          Headline <span className="text-text-secondary opacity-60">(optional)</span>
        </label>
        <input
          type="text"
          value={headline}
          onChange={(e) => handleInputChange("headline", e.target.value)}
          placeholder="Enter article headline..."
          className="w-full p-4 bg-bg-surface border border-border-color text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent resize-none text-2xl font-display font-bold leading-relaxed"
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest text-text-secondary mb-3">
          Author <span className="text-text-secondary opacity-60">(optional)</span>
        </label>
        <input
          type="text"
          value={author}
          onChange={(e) => handleInputChange("author", e.target.value)}
          placeholder="By Author Name"
          className="w-full p-3 bg-bg-surface border border-border-color text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent resize-none text-base font-serif italic"
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest text-text-secondary mb-3">
          Source Name <span className="text-text-secondary opacity-60">(optional)</span>
        </label>
        <input
          type="text"
          value={sourceName}
          onChange={(e) => setField("sourceName", e.target.value)}
          placeholder="e.g., The New York Times"
          className="w-full p-3 bg-bg-surface border border-border-color text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent text-sm"
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest text-text-secondary mb-3">
          Source URL <span className="text-text-secondary opacity-60">(optional)</span>
        </label>
        <input
          type="url"
          value={sourceUrl}
          onChange={(e) => setField("sourceUrl", e.target.value)}
          placeholder="https://example.com/article"
          className="w-full p-3 bg-bg-surface border border-border-color text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent text-sm"
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest text-text-secondary mb-3">
          Image URL <span className="text-text-secondary opacity-60">(optional)</span>
        </label>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setField("imageUrl", e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="w-full p-3 bg-bg-surface border border-border-color text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent text-sm"
        />
      </div>

      <div>
        <label className="block text-xs uppercase tracking-widest text-text-secondary mb-3">
          Article Body <span className="text-danger">*</span>
        </label>
        <textarea
          value={body}
          onChange={(e) => handleInputChange("body", e.target.value)}
          placeholder="Paste or write your article here..."
          rows={16}
          className="w-full p-6 bg-bg-surface border border-border-color text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent resize-none text-base leading-relaxed font-serif"
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm ${isValidInput ? "text-success" : "text-danger"}`}>
            {wordCount} / 100–4000 words
          </p>
          {isOverMax && (
            <p className="text-sm text-danger mt-1">
              Article exceeds the 4000 word maximum
            </p>
          )}
        </div>
        <button
          onClick={saveArticle}
          disabled={!isValidInput}
          className="px-8 py-3 bg-accent hover:bg-accent-hover text-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold tracking-wide"
        >
          Save Article
        </button>
      </div>

      {error && (
        <div className="bg-bg-surface border-l-4 border-danger p-4">
          <p className="text-sm text-danger font-semibold">Error</p>
          <p className="text-sm text-text-secondary">{error}</p>
        </div>
      )}
    </div>
  );
}
