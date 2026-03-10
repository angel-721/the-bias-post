import type { SignalPhraseMatch } from '@/types';

interface WordPosition {
  start: number;
  end: number;
  word: string;
}

// Extract surrounding paragraph(s) as context for LLM analysis
export function extractContext(articleBody: string, start: number, end: number): string {
  // Walk backwards to find paragraph start
  let contextStart = articleBody.lastIndexOf('\n\n', start);
  contextStart = contextStart === -1 ? 0 : contextStart + 2;

  // Walk forwards to find paragraph end
  let contextEnd = articleBody.indexOf('\n\n', end);
  contextEnd = contextEnd === -1 ? articleBody.length : contextEnd;

  return articleBody.slice(contextStart, contextEnd).trim();
}

// Deep normalization for aggressive text cleaning
export function deepNormalize(text: string): string {
  return text
    .toLowerCase()
    // Remove spaces around apostrophes: " ' s" → "'s", " ' t" → "'t"
    .replace(/\s*'\s*/g, "'")
    // Remove spaces around hyphens: " - " → "-"
    .replace(/\s*-\s*/g, "-")
    // Strip all punctuation entirely
    .replace(/[^\w\s]/g, " ")
    // Collapse all whitespace
    .replace(/\s+/g, " ")
    .trim();
}

// Build word position map for accurate character offset mapping
export function buildWordPositionMap(text: string): WordPosition[] {
  const words: WordPosition[] = [];
  let currentWord = "";
  let wordStart = 0;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    // Build word character by character
    if (/\w/.test(char)) {
      if (currentWord === "") {
        wordStart = i;
        currentWord = char;
      } else {
        currentWord += char;
      }
    } else {
      // End of word
      if (currentWord !== "") {
        words.push({
          start: wordStart,
          end: i,
          word: currentWord,
        });
        currentWord = "";
      }
    }
  }

  // Don't forget the last word
  if (currentWord !== "") {
    words.push({
      start: wordStart,
      end: text.length,
      word: currentWord,
    });
  }

  return words;
}

// Exact stop word list from Python backend - must match character for character
const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to",
  "for", "of", "with", "by", "from", "is", "was", "are", "were",
  "be", "been", "have", "has", "had", "do", "does", "did", "will",
  "would", "could", "should", "may", "might", "that", "this", "it",
  "its", "we", "he", "she", "they", "not", "no", "as", "if", "so",
  "up", "out", "about", "who", "what", "which", "when", "there",
  "their", "our", "my", "your", "re", "ve", "ll", "s", "t", "d", "m"
]);

// Filter to significant words only (not in stop list and length > 1)
function getSignificantWords(words: string[]): string[] {
  return words.filter(word => !STOP_WORDS.has(word) && word.length > 1);
}

// Find all signal phrases using significant word sliding window matching
export function matchSignalPhrases(
  text: string,
  signalPhrases: Array<{ phrase: string; weight: number }>
): SignalPhraseMatch[] {
  const normalizedText = deepNormalize(text);
  const articleWords = normalizedText.split(" ");
  const wordPositions = buildWordPositionMap(text);

  console.log("=== SIGNIFICANT WORD FUZZY MATCHING DEBUG ===");
  console.log("Article text length:", text.length);
  console.log("Normalized text length:", normalizedText.length);
  console.log("Article words:", articleWords.length);
  console.log("Word positions:", wordPositions.length);

  const matches: SignalPhraseMatch[] = [];
  const threshold = 0.85;
  const minSignificantWords = 5;

  signalPhrases.forEach((sp, idx) => {
    const originalPhrase = sp.phrase;
    const normalizedPhrase = deepNormalize(originalPhrase);
    const phraseWords = normalizedPhrase.split(" ");
    const significantPhraseWords = getSignificantWords(phraseWords);

    console.log(`\n--- Phrase ${idx} ---`);
    console.log(`Original: "${originalPhrase}"`);
    console.log(`Normalized: "${normalizedPhrase}"`);
    console.log(`Phrase words:`, phraseWords.length);
    console.log(`Significant phrase words:`, significantPhraseWords.length);

    // Skip if too few significant words
    if (significantPhraseWords.length < minSignificantWords) {
      console.log(`Skipped: Only ${significantPhraseWords.length} significant words (need ${minSignificantWords})`);
      matches.push({
        start: -1,
        end: -1,
        phrase: sp.phrase,
        weight: sp.weight,
        index: idx,
        found: false,
        llmExplanation: null,
        llmAnalyzed: false,
        llmLoading: false,
      });
      return;
    }

    // Try exact substring match first (fast path)
    const exactIndex = normalizedText.indexOf(normalizedPhrase);
    if (exactIndex !== -1) {
      console.log(`Exact substring match found at normalized index ${exactIndex}`);

      const matchWordStart = normalizedText.slice(0, exactIndex).split(" ").length;
      const matchWordEnd = matchWordStart + phraseWords.length;

      if (matchWordEnd <= wordPositions.length) {
        const start = wordPositions[matchWordStart]?.start ?? -1;
        const end = wordPositions[matchWordEnd - 1]?.end ?? -1;

        if (start !== -1 && end !== -1) {
          const matchedText = text.slice(start, end);
          const context = extractContext(text, start, end);
          console.log(`Found exact match: "${matchedText}"`);
          console.log(`Position: ${start}-${end}`);

          matches.push({
            start,
            end,
            phrase: sp.phrase,
            weight: sp.weight,
            index: idx,
            found: true,
            context,
            llmExplanation: null,
            llmAnalyzed: false,
            llmLoading: false,
          });
          return;
        }
      }
    }

    // Sliding window match on significant words
    console.log(`Trying significant word sliding window match...`);
    let bestMatch: { score: number; windowStart: number; windowEnd: number } | null = null;

    // Slide window through article words
    for (let i = 0; i <= articleWords.length - phraseWords.length; i++) {
      const windowWords = articleWords.slice(i, i + phraseWords.length);
      const significantWindowWords = getSignificantWords(windowWords);

      if (significantWindowWords.length < significantPhraseWords.length) {
        continue;
      }

      // Count matching significant words
      let significantMatchCount = 0;
      for (const sigWord of significantPhraseWords) {
        if (significantWindowWords.includes(sigWord)) {
          significantMatchCount++;
        }
      }

      const score = significantMatchCount / significantPhraseWords.length;

      if (score >= threshold && (!bestMatch || score > bestMatch.score)) {
        bestMatch = {
          score,
          windowStart: i,
          windowEnd: i + phraseWords.length - 1,
        };
      }
    }

    if (bestMatch) {
      const start = wordPositions[bestMatch.windowStart]?.start ?? -1;
      const end = wordPositions[bestMatch.windowEnd]?.end ?? -1;

      if (start !== -1 && end !== -1) {
        const matchedText = text.slice(start, end);
        const context = extractContext(text, start, end);
        console.log(`Found match with score ${bestMatch.score.toFixed(2)}: "${matchedText}"`);
        console.log(`Position: ${start}-${end}`);

        matches.push({
          start,
          end,
          phrase: sp.phrase,
          weight: sp.weight,
          index: idx,
          found: true,
          context,
          llmExplanation: null,
          llmAnalyzed: false,
          llmLoading: false,
        });
        return;
      }
    }

    console.log(`No match found for phrase ${idx}`);
    matches.push({
      start: -1,
      end: -1,
      phrase: sp.phrase,
      weight: sp.weight,
      index: idx,
      found: false,
      llmExplanation: null,
      llmAnalyzed: false,
      llmLoading: false,
    });
  });

  // Resolve overlaps by weight (heavier phrases win)
  const sortedMatches = matches
    .filter(m => m.found)
    .sort((a, b) => b.weight - a.weight);

  const finalMatches: SignalPhraseMatch[] = [];
  const usedRanges = new Set<string>();

  for (const match of sortedMatches) {
    const rangeKey = `${match.start}-${match.end}`;
    if (!usedRanges.has(rangeKey)) {
      finalMatches.push(match);
      usedRanges.add(rangeKey);
    }
  }

  // Add unmatched phrases
  for (const match of matches) {
    if (!match.found) {
      finalMatches.push(match);
    }
  }

  // Validation log
  const validationTable = finalMatches
    .sort((a, b) => a.index - b.index)
    .map(m => ({
      Index: m.index,
      Phrase: m.phrase.slice(0, 50) + (m.phrase.length > 50 ? "..." : ""),
      Found: m.found ? "✓" : "✗",
      Weight: m.weight,
      Position: m.found ? `${m.start}-${m.end}` : "N/A",
    }));

  console.log("\n=== VALIDATION TABLE ===");
  console.table(validationTable);
  console.log("=== END SIGNIFICANT WORD FUZZY MATCHING DEBUG ===\n");

  return finalMatches.sort((a, b) => a.index - b.index);
}

// Helper function for word counting
export function getWordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

// Get confidence message based on percentage
export function getConfidenceMessage(likelyPercentage: number): string {
  if (likelyPercentage >= 85) {
    return "This article shows strong indicators of bias. The language and framing patterns detected are consistent with content that tends to present information one-sidedly.";
  } else if (likelyPercentage >= 60) {
    return "This article contains several phrases that may reflect a particular viewpoint. Some language patterns suggest the framing could influence how information is perceived.";
  } else if (likelyPercentage >= 40) {
    return "This article shows mixed signals. Some phrases lean toward a specific framing, but the overall pattern is not strongly indicative of bias in either direction.";
  } else {
    return "This article shows few indicators of bias. The language and framing appear relatively neutral based on the patterns detected.";
  }
}

