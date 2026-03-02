import { ContentType } from "./types.js";

const URL_PATTERN = /https?:\/\/[^\s]+/;

const CODE_INDICATORS = [
  /^```/m,                      // markdown code blocks
  /\b(function|const|let|var|import|export|class|def|fn|pub)\b/,
  /[{}\[\]();]=>/,              // common code syntax
  /^\s*(if|else|for|while|return)\s*[({]/m,
];

const JOURNAL_INDICATORS = [
  /^(today|yesterday|this morning|this evening|this week)/i,
  /^(i feel|i think|i realized|i learned|i noticed)/i,
  /^(dear diary|journal|log|day \d+)/i,
];

/**
 * Auto-detect the content type from a raw message string.
 * Returns both the detected type and any extracted metadata.
 */
export function detectContentType(text: string): {
  type: ContentType;
  metadata: Record<string, unknown>;
  title: string | null;
} {
  const trimmed = text.trim();

  // Check for URLs first — if the message is mostly a URL, it's a link
  const urlMatch = trimmed.match(URL_PATTERN);
  if (urlMatch) {
    const urlPortion = urlMatch[0].length / trimmed.length;
    if (urlPortion > 0.5) {
      return {
        type: "link",
        metadata: { url: urlMatch[0] },
        title: trimmed.replace(urlMatch[0], "").trim() || null,
      };
    }
  }

  // Check for code
  const codeScore = CODE_INDICATORS.reduce(
    (score, pattern) => score + (pattern.test(trimmed) ? 1 : 0),
    0
  );
  if (codeScore >= 2) {
    const langMatch = trimmed.match(/^```(\w+)/);
    return {
      type: "code",
      metadata: langMatch ? { language: langMatch[1] } : {},
      title: null,
    };
  }

  // Check for journal-like entries
  const isJournal = JOURNAL_INDICATORS.some((p) => p.test(trimmed));
  if (isJournal) {
    return {
      type: "journal",
      metadata: {},
      title: null,
    };
  }

  // Default to note
  return {
    type: "note",
    metadata: urlMatch ? { url: urlMatch[0] } : {},
    title: null,
  };
}
