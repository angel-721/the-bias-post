import { create } from 'zustand';
import type { AnalysisResult, ArticleState, Step, SignalPhraseMatch, LibraryArticle, SharedPhrase, ComparisonStep } from '@/types';

interface ArticleStore {
  // Article metadata
  headline: string;
  author: string;
  body: string;
  sourceName: string;
  sourceUrl: string;
  imageUrl: string;

  // App state machine
  step: Step;

  // Theme
  theme: 'dark' | 'light';

  // Analysis results
  result: AnalysisResult | null;
  matchedPhrases: SignalPhraseMatch[];
  isAnalyzing: boolean;
  error: string | null;

  // Modal state
  activeModal: number | null;

  // AI summary state
  aiSummary: string | null;
  isSummarizing: boolean;
  summaryError: string | null;

  // Save state
  isSaving: boolean;
  saveError: string | null;
  lastSavedArticleId: string | null;

  // Duplicate check state
  isDuplicate: boolean | null;
  duplicateArticleId: string | null;

  // Library state
  libraryArticles: LibraryArticle[];
  libraryLoaded: boolean;
  libraryError: string | null;

  // Comparison state
  comparisonStep: ComparisonStep;
  comparisonArticleA: LibraryArticle | null;
  comparisonArticleB: LibraryArticle | null;
  comparisonResult: string | null;
  comparisonLoading: boolean;
  comparisonCached: boolean;
  comparisonError: string | null;

  // Actions
  setField: (field: keyof ArticleState | 'theme' | 'sourceName' | 'sourceUrl' | 'imageUrl', value: string) => void;
  setStep: (step: Step) => void;
  saveArticle: () => void;
  editArticle: () => void;
  setResult: (result: AnalysisResult) => void;
  setMatchedPhrases: (phrases: SignalPhraseMatch[]) => void;
  setAnalyzing: (analyzing: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // Modal actions
  openModal: (phraseIndex: number) => void;
  closeModal: () => void;

  // LLM actions
  setLlmLoading: (phraseIndex: number, loading: boolean) => void;
  setLlmExplanation: (phraseIndex: number, explanation: string) => void;

  // Source field actions
  setSourceField: (field: 'sourceName' | 'sourceUrl' | 'imageUrl', value: string) => void;

  // AI summary actions
  setAiSummary: (summary: string | null) => void;
  setSummarizing: (summarizing: boolean) => void;
  setSummaryError: (error: string | null) => void;
  generateSummary: () => Promise<void>;

  // Save actions
  setSaving: (saving: boolean) => void;
  setSaveError: (error: string | null) => void;
  saveToLibrary: () => Promise<void>;

  // Duplicate check actions
  checkDuplicate: () => Promise<void>;
  setDuplicate: (isDuplicate: boolean, articleId?: string) => void;

  // Library actions
  setLibraryArticles: (articles: LibraryArticle[]) => void;
  setLibraryLoaded: (loaded: boolean) => void;
  setLibraryError: (error: string | null) => void;
  fetchLibrary: () => Promise<void>;

  // Comparison actions
  setComparisonStep: (step: ComparisonStep) => void;
  setComparisonArticle: (slot: 'A' | 'B', article: LibraryArticle | null) => void;
  setComparisonResult: (text: string | null) => void;
  setComparisonLoading: (loading: boolean) => void;
  setComparisonCached: (cached: boolean) => void;
  setComparisonError: (error: string | null) => void;
  generateComparison: () => Promise<void>;
  clearComparison: () => void;
}

export const useArticleStore = create<ArticleStore>((set, get) => ({
  // Article metadata
  headline: '',
  author: '',
  body: '',
  sourceName: '',
  sourceUrl: '',
  imageUrl: '',

  // App state machine
  step: 'input',

  // Theme
  theme: 'dark',

  // Analysis results
  result: null,
  matchedPhrases: [],
  isAnalyzing: false,
  error: null,

  // Modal state
  activeModal: null,

  // AI summary state
  aiSummary: null,
  isSummarizing: false,
  summaryError: null,

  // Save state
  isSaving: false,
  saveError: null,
  lastSavedArticleId: null,

  // Duplicate check state
  isDuplicate: null,
  duplicateArticleId: null,

  // Library state
  libraryArticles: [],
  libraryLoaded: false,
  libraryError: null,

  // Comparison state
  comparisonStep: 'selection',
  comparisonArticleA: null,
  comparisonArticleB: null,
  comparisonResult: null,
  comparisonLoading: false,
  comparisonCached: false,
  comparisonError: null,

  // Actions
  setField: (field, value) => {
    set({ [field]: value });
    // Save theme to localStorage when it changes
    if (field === 'theme') {
      localStorage.setItem('bias-post-theme', value);
      document.documentElement.classList.toggle('dark', value === 'dark');
    }
  },

  setStep: (step) => set({ step }),

  saveArticle: () => {
    const body = get().body;
    const wordCount = getWordCount(body);
    const isValidInput = wordCount >= 100 && wordCount <= 4000;
    const isOverMax = wordCount > 4000;

    if (isOverMax) {
      set({
        error: `Article exceeds the 4000 word maximum. Current: ${wordCount} words.`,
      });
      return;
    }

    if (!isValidInput) {
      set({
        error: `Article must be at least 100 words. Current: ${wordCount} words.`,
      });
      return;
    }

    set({ step: 'formatted', error: null });
  },

  editArticle: () => {
    set({
      step: 'input',
      result: null,
      matchedPhrases: [],
      error: null
    });
  },

  setResult: (result) => {
    set({ result, step: 'results', isAnalyzing: false });
    // Auto-generate AI summary after analysis completes (for both high and low bias articles)
    setTimeout(() => {
      get().generateSummary();
    }, 100);
  },

  setMatchedPhrases: (phrases) => set({ matchedPhrases: phrases }),

  setAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),

  setError: (error) => set({ error }),

  openModal: (phraseIndex) => set({ activeModal: phraseIndex }),

  closeModal: () => set({ activeModal: null }),

  setLlmLoading: (phraseIndex, loading) => {
    const matches = get().matchedPhrases;
    const updated = matches.map(m =>
      m.index === phraseIndex ? { ...m, llmLoading: loading } : m
    );
    set({ matchedPhrases: updated });
  },

  setLlmExplanation: (phraseIndex, explanation) => {
    const matches = get().matchedPhrases;
    const updated = matches.map(m => {
      if (m.index === phraseIndex) {
        return {
          ...m,
          llmExplanation: explanation,
          llmAnalyzed: true,
          llmLoading: false,
        };
      }
      return m;
    });
    set({ matchedPhrases: updated });
  },

  // Source field actions
  setSourceField: (field, value) => set({ [field]: value }),

  // AI summary actions
  setAiSummary: (summary) => set({ aiSummary: summary }),
  setSummarizing: (summarizing) => set({ isSummarizing: summarizing }),
  setSummaryError: (error) => set({ summaryError: error }),
  generateSummary: async () => {
    const state = get();
    const { result, matchedPhrases, body, headline } = state;

    if (!result || !result.signal_phrases || result.signal_phrases.length === 0) {
      set({ summaryError: 'No analysis results to summarize' });
      return;
    }

    const likelihood = Math.round((result.confidence.Likely || 0) * 100);
    const isLowBias = likelihood < 30;

    set({ isSummarizing: true, summaryError: null });

    try {
      // Prepare signal phrases with context
      const signalPhrasesWithDetails = result.signal_phrases.map((sp, index) => {
        const match = matchedPhrases[index];
        return {
          phrase: sp.phrase,
          weight: sp.weight,
          context: match?.context || '',
        };
      });

      // Extract lede (first 3 sentences) for low bias articles
      const getArticleLede = (text: string): string => {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        return sentences.slice(0, 3).join('. ') + (sentences.length > 3 ? '.' : '');
      };

      const articleLede = isLowBias ? getArticleLede(body) : null;

      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signal_phrases: signalPhrasesWithDetails,
          likelihood,
          headline: headline || null,
          article_lede: articleLede,
          is_low_bias: isLowBias,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Summary generation failed');
      }

      const data = await response.json();
      set({ aiSummary: data.summary, summaryError: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate summary';
      set({ summaryError: errorMessage });
    } finally {
      set({ isSummarizing: false });
    }
  },

  // Save actions
  setSaving: (saving) => set({ isSaving: saving }),
  setSaveError: (error) => set({ saveError: error }),
  saveToLibrary: async () => {
    const state = get();
    const {
      headline,
      author,
      sourceName,
      sourceUrl,
      imageUrl,
      result,
      matchedPhrases,
      aiSummary,
    } = state;

    // Validate AI summary exists (required for all articles now)
    if (!aiSummary) {
      set({ saveError: 'AI summary must be generated before saving' });
      return;
    }

    if (!result) {
      set({ saveError: 'No analysis results to save' });
      return;
    }

    set({ isSaving: true, saveError: null });

    try {
      // Prepare signal phrases with context
      const signalPhrasesWithDetails = result.signal_phrases.map((sp, index) => {
        const match = matchedPhrases[index];
        return {
          rank: index + 1,
          phrase: sp.phrase,
          weight: sp.weight,
          context: match?.context || '',
          llmExplanation: match?.llmExplanation || null,
        };
      });

      const response = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: headline.trim() || 'Untitled Article',
          author: author?.trim() || null,
          sourceName: sourceName?.trim() || null,
          sourceUrl: sourceUrl?.trim() || null,
          imageUrl: imageUrl?.trim() || null,
          prediction: result.prediction,
          likelihood: Math.round((result.confidence.Likely || 0) * 100),
          weightStd: result.weight_std,
          signalPhrases: signalPhrasesWithDetails,
          aiSummary: aiSummary ? aiSummary.trim() : null, // Allow null for low bias articles
        }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          set({ saveError: 'This article has already been saved to the library.' });
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Save failed');
      }

      const data = await response.json();
      set({ lastSavedArticleId: data.articleId, saveError: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save article';
      set({ saveError: errorMessage });
    } finally {
      set({ isSaving: false });
    }
  },

  // Duplicate check actions
  checkDuplicate: async () => {
    const state = get();
    const { headline } = state;

    if (!headline || !headline.trim()) {
      return;
    }

    try {
      const response = await fetch(`/api/check-duplicate?headline=${encodeURIComponent(headline.trim())}`);

      if (!response.ok) {
        console.error('Duplicate check failed');
        return;
      }

      const data = await response.json();
      set({
        isDuplicate: data.isDuplicate,
        duplicateArticleId: data.existingArticle?.id || null,
      });
    } catch (error) {
      console.error('Duplicate check error:', error);
    }
  },
  setDuplicate: (isDuplicate, articleId) => set({ isDuplicate, duplicateArticleId: articleId }),

  // Library actions
  setLibraryArticles: (articles) => set({ libraryArticles: articles }),
  setLibraryLoaded: (loaded) => set({ libraryLoaded: loaded }),
  setLibraryError: (error) => set({ libraryError: error }),
  fetchLibrary: async () => {
    set({ libraryError: null });

    try {
      const response = await fetch('/api/library?limit=50&offset=0');

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch library');
      }

      const data = await response.json();
      set({ libraryArticles: data.articles, libraryLoaded: true });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch library';
      set({ libraryError: errorMessage });
    }
  },

  // Comparison actions
  setComparisonStep: (step) => set({ comparisonStep: step }),

  setComparisonArticle: (slot, article) => {
    if (slot === 'A') {
      set({ comparisonArticleA: article });
    } else {
      set({ comparisonArticleB: article });
    }
  },

  setComparisonResult: (text) => set({ comparisonResult: text }),
  setComparisonLoading: (loading) => set({ comparisonLoading: loading }),
  setComparisonCached: (cached) => set({ comparisonCached: cached }),
  setComparisonError: (error) => set({ comparisonError: error }),

  generateComparison: async () => {
    const state = get();
    const { comparisonArticleA, comparisonArticleB } = state;

    if (!comparisonArticleA || !comparisonArticleB) {
      set({ comparisonError: 'Please select two articles to compare' });
      return;
    }

    set({ comparisonLoading: true, comparisonError: null, comparisonResult: null, comparisonCached: false });

    try {
      const response = await fetch('/api/compare/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleAId: comparisonArticleA.id,
          articleBId: comparisonArticleB.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate comparison');
      }

      const contentType = response.headers.get('content-type');

      // Handle JSON response (cached comparison)
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        set({
          comparisonResult: data.comparison,
          comparisonCached: data.cached || false,
          comparisonError: null,
        });
      } else {
        // Handle streaming response (new comparison)
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let result = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            result += chunk;
            set({ comparisonResult: result }); // Update incrementally
          }
        }

        set({
          comparisonResult: result,
          comparisonCached: false,
          comparisonError: null,
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate comparison';
      set({ comparisonError: errorMessage });
    } finally {
      set({ comparisonLoading: false });
    }
  },

  clearComparison: () => set({
    comparisonStep: 'selection',
    comparisonArticleA: null,
    comparisonArticleB: null,
    comparisonResult: null,
    comparisonLoading: false,
    comparisonCached: false,
    comparisonError: null,
  }),

  reset: () => {
    set({
      headline: '',
      author: '',
      body: '',
      sourceName: '',
      sourceUrl: '',
      imageUrl: '',
      step: 'input',
      theme: 'dark',
      result: null,
      matchedPhrases: [],
      isAnalyzing: false,
      error: null,
      activeModal: null,
      aiSummary: null,
      isSummarizing: false,
      summaryError: null,
      isSaving: false,
      saveError: null,
      lastSavedArticleId: null,
      isDuplicate: null,
      duplicateArticleId: null,
      libraryArticles: get().libraryArticles, // Keep library across resets
      libraryLoaded: get().libraryLoaded,
      libraryError: get().libraryError,
      comparisonStep: 'selection',
      comparisonArticleA: null,
      comparisonArticleB: null,
      comparisonResult: null,
      comparisonLoading: false,
      comparisonCached: false,
      comparisonError: null,
    });
  },
}));

// Initialize theme from localStorage on mount
if (typeof window !== 'undefined') {
  const savedTheme = localStorage.getItem('bias-post-theme') as 'dark' | 'light' | null;
  const initialTheme = savedTheme || 'dark';
  useArticleStore.getState().setField('theme', initialTheme);
}

// Helper function for word counting
function getWordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

