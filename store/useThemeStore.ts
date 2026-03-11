import { create } from "zustand";

interface ThemeStore {
  theme: "dark" | "light";
  setTheme: (theme: "dark" | "light") => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  theme: "dark",
  setTheme: (theme) => {
    set({ theme });
    localStorage.setItem("bias-post-theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  },
}));

// Initialize theme from localStorage on mount
if (typeof window !== "undefined") {
  const savedTheme = localStorage.getItem("bias-post-theme") as
    | "dark"
    | "light"
    | null;
  const initialTheme = savedTheme || "dark";
  useThemeStore.getState().setTheme(initialTheme);
}
