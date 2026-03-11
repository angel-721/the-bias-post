import { create } from "zustand";
import type {
  ComparisonStep,
  LibraryArticle,
  ComparisonSummary,
  ComparisonDetail,
} from "@/types";

interface ComparisonStore {
  // Comparison state
  comparisonStep: ComparisonStep;
  comparisonArticleA: LibraryArticle | null;
  comparisonArticleB: LibraryArticle | null;
  comparisonResult: string | null;
  comparisonLoading: boolean;
  comparisonCached: boolean;
  comparisonError: string | null;

  // Comparison list state
  comparisonList: ComparisonSummary[];
  comparisonListLoading: boolean;
  comparisonListError: string | null;

  // Active comparison state
  activeComparison: ComparisonDetail | null;

  // Actions
  setComparisonStep: (step: ComparisonStep) => void;
  setComparisonArticle: (
    slot: "A" | "B",
    article: LibraryArticle | null,
  ) => void;
  setComparisonResult: (text: string | null) => void;
  setComparisonLoading: (loading: boolean) => void;
  setComparisonCached: (cached: boolean) => void;
  setComparisonError: (error: string | null) => void;
  generateComparison: () => Promise<void>;
  clearComparison: () => void;

  // Comparison list actions
  setComparisonList: (list: ComparisonSummary[]) => void;
  setComparisonListLoading: (loading: boolean) => void;
  setComparisonListError: (error: string | null) => void;
  fetchComparisonList: () => Promise<void>;

  // Active comparison actions
  setActiveComparison: (comparison: ComparisonDetail | null) => void;
  fetchComparisonById: (id: string) => Promise<void>;
  createComparison: () => Promise<string | null>;
  generateComparisonAnalysis: (comparisonId: string) => Promise<void>;
}

export const useComparisonStore = create<ComparisonStore>((set, get) => ({
  // Comparison state
  comparisonStep: "selection",
  comparisonArticleA: null,
  comparisonArticleB: null,
  comparisonResult: null,
  comparisonLoading: false,
  comparisonCached: false,
  comparisonError: null,

  // Comparison list state
  comparisonList: [],
  comparisonListLoading: false,
  comparisonListError: null,

  // Active comparison state
  activeComparison: null,

  // Actions
  setComparisonStep: (step) => set({ comparisonStep: step }),

  setComparisonArticle: (slot, article) => {
    if (slot === "A") {
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
      set({ comparisonError: "Please select two articles to compare" });
      return;
    }

    set({
      comparisonLoading: true,
      comparisonError: null,
      comparisonResult: null,
      comparisonCached: false,
    });

    try {
      const response = await fetch("/api/compare/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleAId: comparisonArticleA.id,
          articleBId: comparisonArticleB.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate comparison");
      }

      const contentType = response.headers.get("content-type");

      // Handle JSON response (cached comparison)
      if (contentType && contentType.includes("application/json")) {
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
        let result = "";

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
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to generate comparison";
      set({ comparisonError: errorMessage });
    } finally {
      set({ comparisonLoading: false });
    }
  },

  clearComparison: () =>
    set({
      comparisonStep: "selection",
      comparisonArticleA: null,
      comparisonArticleB: null,
      comparisonResult: null,
      comparisonLoading: false,
      comparisonCached: false,
      comparisonError: null,
    }),

  // Comparison list actions
  setComparisonList: (list) => set({ comparisonList: list }),
  setComparisonListLoading: (loading) =>
    set({ comparisonListLoading: loading }),
  setComparisonListError: (error) => set({ comparisonListError: error }),

  fetchComparisonList: async () => {
    set({ comparisonListLoading: true, comparisonListError: null });

    try {
      const response = await fetch("/api/compare/list?limit=50&offset=0");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch comparisons");
      }

      const data = await response.json();
      set({ comparisonList: data.comparisons || [] });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch comparisons";
      set({ comparisonListError: errorMessage });
    } finally {
      set({ comparisonListLoading: false });
    }
  },

  // Active comparison actions
  setActiveComparison: (comparison) => set({ activeComparison: comparison }),

  fetchComparisonById: async (id) => {
    try {
      const response = await fetch(
        `/api/compare/get?id=${encodeURIComponent(id)}`,
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch comparison");
      }

      const data = await response.json();
      const comparison = data.comparison;

      // Set the active comparison
      set({ activeComparison: comparison });

      // If the comparison already has generated text, set it in the store
      if (comparison.comparison_generated && comparison.comparison_text) {
        set({
          comparisonResult: comparison.comparison_text,
          comparisonCached: true,
          comparisonError: null,
        });
      } else {
        // Clear previous results if not generated yet
        set({
          comparisonResult: null,
          comparisonCached: false,
          comparisonError: null,
        });
      }
    } catch (error) {
      throw error;
    }
  },

  createComparison: async () => {
    const state = get();
    const { comparisonArticleA, comparisonArticleB } = state;

    if (!comparisonArticleA || !comparisonArticleB) {
      set({ comparisonError: "Please select two articles to compare" });
      return null;
    }

    if (comparisonArticleA.id === comparisonArticleB.id) {
      set({ comparisonError: "Please select two different articles" });
      return null;
    }

    try {
      const response = await fetch("/api/compare/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleAId: comparisonArticleA.id,
          articleBId: comparisonArticleB.id,
        }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          const data = await response.json();
          set({
            comparisonError: data.error || "This comparison already exists",
          });
          return null;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create comparison");
      }

      const data = await response.json();
      set({ comparisonError: null });
      return data.comparisonId;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create comparison";
      set({ comparisonError: errorMessage });
      return null;
    }
  },

  generateComparisonAnalysis: async (comparisonId) => {
    set({
      comparisonLoading: true,
      comparisonError: null,
      comparisonResult: null,
    });

    try {
      const response = await fetch("/api/compare/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comparisonId }),
      });

      if (!response.ok) {
        if (response.status === 409) {
          const data = await response.json();
          // Already generated - display the existing text
          set({
            comparisonResult: data.comparisonText,
            comparisonCached: true,
            comparisonError: null,
          });
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate comparison");
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let result = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          result += chunk;
          set({ comparisonResult: result });
        }
      }

      set({
        comparisonResult: result,
        comparisonCached: false,
        comparisonError: null,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to generate comparison";
      set({ comparisonError: errorMessage });
    } finally {
      set({ comparisonLoading: false });
    }
  },
}));
