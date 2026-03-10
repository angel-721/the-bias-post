"use client";

import { useArticleStore } from "@/store/useArticleStore";
import { Sun, Moon } from "@carbon/icons-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavBar() {
  const pathname = usePathname();
  const { theme, setField } = useArticleStore();

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setField("theme", newTheme);
  };

  const navLinks = [
    { href: "/recent", label: "Recent" },
    { href: "/", label: "Analyze" },
    { href: "/lens", label: "Lens" },
  ];

  return (
    <nav className="border-b border-border-color">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Masthead */}
          <Link
            href="/"
            className="font-display text-2xl font-black tracking-tight hover:opacity-80 transition-opacity"
          >
            THE BIAS POST
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors relative ${
                  pathname === link.href
                    ? "text-text-primary"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {link.label}
                {pathname === link.href && (
                  <span className="absolute bottom-[-21px] left-0 right-0 h-0.5 bg-accent" />
                )}
              </Link>
            ))}
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 hover:bg-bg-surface transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </div>
    </nav>
  );
}
