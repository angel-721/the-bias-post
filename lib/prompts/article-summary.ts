import type { ArticleSummaryInput } from './types';

export function ArticleSummaryPrompt(inputs: ArticleSummaryInput): {
  system: string;
  user: string;
} {
  const { signalPhrases, likelihood, headline, articleLede, isLowBias } = inputs;

  const system = 'You are an objective media analyst. You provide neutral, balanced summaries of bias indicators in news articles. For low-bias articles, you explain what makes the writing appear neutral. For high-bias articles, you describe patterns and tendencies in biased language.';

  const phrasesText = signalPhrases
    .map((sp, i) => `${i + 1}. "${sp.phrase}" (weight: ${sp.weight.toFixed(4)})`)
    .join('\n');

  let user: string;

  if (isLowBias) {
    user = `A bias classifier analyzed a news article and determined it has a LOW bias likelihood of ${likelihood}%.

Article headline: ${headline || 'N/A'}

Article lede (first 3 sentences):
"${articleLede || 'N/A'}"

Key signal phrases the classifier examined (even if not found in text):
${phrasesText}

In 2-3 sentences, explain why this article likely scored low on bias. Focus on what makes the language appear neutral (e.g., balanced sourcing, absence of loaded language, factual presentation, lack of emotional manipulation). Reference specific patterns in the lede if relevant.`;
  } else {
    user = `A bias classifier analyzed a news article and flagged these phrases as the top indicators of bias (confidence: ${likelihood}% likely biased):

${phrasesText}

In 2-3 sentences, give an objective summary of what these phrases collectively suggest about the article's framing or perspective. Be specific about what viewpoint or agenda the language may favor or oppose. Do not use absolute language.`;
  }

  return { system, user };
}
