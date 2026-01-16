/**
 * Core type definitions for the sonnet checker application
 */

// Pronunciation data from CMU dictionary
export interface PronunciationEntry {
  word: string;
  phonemes: string[]; // e.g., ["HH", "EH1", "L", "OW0"]
}

// Dictionary mapping words to their pronunciations
export type PronunciationDict = {
  [word: string]: string[][]; // Multiple pronunciations possible
};

// Stress pattern: 0=no stress, 1=primary stress, 2=secondary stress
export type StressPattern = (0 | 1 | 2)[];

// Syllable information
export interface Syllable {
  phonemes: string[];
  stress: 0 | 1 | 2;
}

// Word analysis result
export interface WordAnalysis {
  word: string;
  originalWord: string; // Before preprocessing
  syllables: Syllable[];
  rhymeKey: string; // Phonemes used for rhyming (typically from primary stress to end)
  found: boolean; // Whether word was found in dictionary
}

// Line analysis result
export interface LineAnalysis {
  lineNumber: number;
  text: string;
  words: WordAnalysis[];
  stressPattern: StressPattern;
  rhymeKey: string; // Rhyme key of the last word
  expectedStressPattern?: StressPattern;
  meterValid?: boolean;
}

// Rhyme scheme definition (e.g., "ABAB CDCD EFEF GG")
export type RhymeScheme = string[];

// Meter pattern definition
export interface MeterPattern {
  name: string;
  description: string;
  stressPattern: StressPattern; // Expected pattern per line
  syllableCount: number; // Expected syllables per line
}

// Sonnet form definition
export interface SonnetForm {
  name: string;
  rhymeScheme: RhymeScheme; // e.g., ["A", "B", "A", "B", ...]
  meter: MeterPattern;
  lineCount: number;
}

// Analysis result for the entire sonnet
export interface SonnetAnalysis {
  lines: LineAnalysis[];
  form: SonnetForm;
  rhymeSchemeValid: boolean;
  meterValid: boolean;
  rhymeIssues: string[];
  meterIssues: string[];
}
