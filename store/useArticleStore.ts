import { create } from 'zustand';
import type { AnalysisResult, ArticleState, Step, SignalPhraseMatch, LibraryArticle } from '@/types';

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
    // Auto-generate AI summary after analysis completes
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
    const { result, matchedPhrases } = state;

    if (!result || !result.signal_phrases || result.signal_phrases.length === 0) {
      set({ summaryError: 'No analysis results to summarize' });
      return;
    }

    set({ isSummarizing: true, summaryError: null });

    try {
      const likelihood = Math.round((result.confidence.Likely || 0) * 100);

      // Prepare signal phrases with context
      const signalPhrasesWithDetails = result.signal_phrases.map((sp, index) => {
        const match = matchedPhrases[index];
        return {
          phrase: sp.phrase,
          weight: sp.weight,
          context: match?.context || '',
        };
      });

      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          signal_phrases: signalPhrasesWithDetails,
          likelihood,
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

    // Validate AI summary exists
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
          aiSummary: aiSummary.trim(),
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

