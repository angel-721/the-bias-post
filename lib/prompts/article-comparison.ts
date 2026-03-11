import type { Article } from './types';

export function ComparisonPrompt(articleA: Article, articleB: Article): {
  system: string;
  user: string;
} {
  const system = `You are an expert media analyst comparing two news articles for bias.
Your goal is to provide an objective, insightful comparison that helps readers understand differences in perspective, framing, and potential bias.

Focus on:
1. Differences in headline framing and language choices
2. Contrasting perspectives or agendas each article may promote
3. Signal phrases that indicate different biases or viewpoints
4. How the articles might influence readers' perceptions differently

Be specific and evidence-based. Quote phrases from the articles when relevant.
Avoid taking political sides or judging which article is "better."
Be concise but thorough - aim for 3-5 paragraphs.`;

  const getTopPhrases = (article: Article): string => {
    return article.signal_phrases
      .filter((sp) => sp.rank !== undefined && sp.rank >= 1 && sp.rank <= 4)
      .map((sp) => `${sp.rank}. "${sp.phrase}" (weight: ${sp.weight.toFixed(4)})`)
      .join('\n');
  };

  const user = `Compare these two news articles for bias and perspective:

**Article A:**
- Headline: "${articleA.headline}"
- Source: ${articleA.source_name || 'Unknown'}
- Bias Likelihood: ${articleA.likelihood}%
- AI Summary: ${articleA.ai_summary || 'N/A'}
- Top Signal Phrases:
${getTopPhrases(articleA)}

**Article B:**
- Headline: "${articleB.headline}"
- Source: ${articleB.source_name || 'Unknown'}
- Bias Likelihood: ${articleB.likelihood}%
- AI Summary: ${articleB.ai_summary || 'N/A'}
- Top Signal Phrases:
${getTopPhrases(articleB)}

Provide an objective comparison highlighting differences in framing, bias, and perspective between these two articles.`;

  return { system, user };
}
