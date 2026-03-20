import { LogoGithub, Globe } from "@carbon/icons-react";

export function Footer() {
  return (
    <footer className="border-t border-border-color mt-16">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm text-text-secondary hidden md:grid">
          {/* Dataset */}
          <div className="flex items-start gap-3">
            <span className="text-lg">🤗</span>
            <div>
              <div className="font-medium text-text-primary">Dataset</div>
              <div>
                <a
                  href="https://huggingface.co/datasets/vector-institute/newsmediabias-plus"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-text-primary transition-colors"
                >
                  NewsmediaBias-Plus — Vector Institute
                </a>
                <div className="text-xs mt-1">
                  huggingface.co/datasets/vector-institute/newsmediabias-plus
                </div>
              </div>
            </div>
          </div>

          {/* LLM */}
          <div className="flex items-start gap-3">
            <span className="text-lg">✦</span>
            <div>
              <div className="font-medium text-text-primary">LLM</div>
              <div>Enhancements by GPT-5-nano</div>
            </div>
          </div>

          {/* Library */}
          <div className="flex items-start gap-3">
            <span className="text-lg">⚡</span>
            <div>
              <div className="font-medium text-text-primary">Library</div>
              <div>
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-text-primary transition-colors"
                >
                  Powered by Supabase
                </a>
                <div className="text-xs mt-1">supabase.com</div>
              </div>
            </div>
          </div>

          {/* Source */}
          <div className="flex items-start gap-3">
            <LogoGithub size={20} className="mt-0.5" />
            <div>
              <div className="font-medium text-text-primary">Source</div>
              <div>
                <a
                  href="https://github.com/angel-721/the-bias-post"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-text-primary transition-colors"
                >
                  View source on GitHub
                </a>
                <div className="text-xs mt-1">
                  github.com/angel-721/the-bias-post
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile copyright - always visible */}
        <div className="md:hidden text-center text-xs text-text-secondary">
          <div className="flex items-center justify-center gap-3">
            <span>© The Bias Post</span>
            <span>•</span>
            <a
              href="https://angelv.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-text-primary transition-colors"
            >
              <Globe size={14} />
              <span>angelv.dev</span>
            </a>
          </div>
        </div>

        {/* Desktop copyright */}
        <div className="hidden md:block mt-8 pt-6 border-t border-border-color text-center text-xs text-text-secondary">
          <div className="flex items-center justify-center gap-3">
            <span>© The Bias Post</span>
            <span>•</span>
            <a
              href="https://angelv.dev"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-text-primary transition-colors"
            >
              <Globe size={14} />
              <span>angelv.dev</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
