import { LogoGithub } from "@carbon/icons-react";

export function Footer() {
  return (
    <footer className="border-t border-border-color mt-16">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-4 text-sm text-text-secondary">
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

        {/* Copyright */}
        <div className="mt-8 pt-6 border-t border-border-color text-center text-xs text-text-secondary">
          © The Bias Post
        </div>
      </div>
    </footer>
  );
}
