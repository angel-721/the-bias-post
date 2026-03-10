import { create } from 'zustand';
import type { AnalysisResult, ArticleState, Step, SignalPhraseMatch } from '@/types';

interface ArticleStore {
  // Article metadata
  headline: string;
  author: string;
  body: string;

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

  // Actions
  setField: (field: keyof ArticleState | 'theme', value: string) => void;
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
}

export const useArticleStore = create<ArticleStore>((set, get) => ({
  // Article metadata
  headline: '',
  author: '',
  body: '',

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

  setResult: (result) => set({ result, step: 'results', isAnalyzing: false }),

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

  reset: () => {
    set({
      headline: '',
      author: '',
      body: '',
      step: 'input',
      theme: 'dark',
      result: null,
      matchedPhrases: [],
      isAnalyzing: false,
      error: null,
      activeModal: null,
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

