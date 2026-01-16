/**
 * Text processing utilities for preprocessing sonnet input
 */

/**
 * Split text into lines, preserving empty lines
 */
export function splitLines(text: string): string[] {
  return text.split('\n');
}

/**
 * Tokenize a line into words
 * Preserves the original words before removing punctuation
 */
export function tokenizeLine(line: string): string[] {
  // Split on whitespace and filter empty strings
  return line.trim().split(/\s+/).filter(word => word.length > 0);
}

/**
 * Remove punctuation from a word but preserve apostrophes
 * for contractions like "it's" or "don't"
 */
export function removePunctuation(word: string): string {
  // First normalize all apostrophe variants to ASCII apostrophe
  const normalized = word.replace(/['']/g, "'");
  // Keep letters and apostrophes, remove everything else
  return normalized.replace(/[^a-zA-Z']/g, '');
}

/**
 * Preprocess text: split lines and tokenize
 */
export function preprocessText(text: string): { lines: string[], tokens: string[][] } {
  const lines = splitLines(text);
  const tokens = lines.map(line => tokenizeLine(line));
  return { lines, tokens };
}
