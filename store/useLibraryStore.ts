import { create } from "zustand";
import type { LibraryArticle } from "@/types";

interface LibraryStore {
  // State
  libraryArticles: LibraryArticle[];
  libraryLoaded: boolean;
  libraryError: string | null;

  // Actions
  setLibraryArticles: (articles: LibraryArticle[]) => void;
  setLibraryLoaded: (loaded: boolean) => void;
  setLibraryError: (error: string | null) => void;
  fetchLibrary: () => Promise<void>;
}

export const useLibraryStore = create<LibraryStore>((set) => ({
  // State
  libraryArticles: [],
  libraryLoaded: false,
  libraryError: null,

  // Actions
  setLibraryArticles: (articles) => set({ libraryArticles: articles }),
  setLibraryLoaded: (loaded) => set({ libraryLoaded: loaded }),
  setLibraryError: (error) => set({ libraryError: error }),

  fetchLibrary: async () => {
    set({ libraryError: null });

    try {
      const response = await fetch("/api/library?limit=50&offset=0");

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch library");
      }

      const data = await response.json();
      set({ libraryArticles: data.articles, libraryLoaded: true });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch library";
      set({ libraryError: errorMessage });
    }
  },
}));
