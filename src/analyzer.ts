import type {
  LineAnalysis,
  SonnetAnalysis,
  SonnetForm,
  StressPattern,
  WordAnalysis
} from './types';
import { DictionaryService } from './dictionary';
import { tokenizeLine, removePunctuation } from './textProcessor';

/**
 * Sonnet analyzer service
 */
export class SonnetAnalyzer {
  constructor(private dictionary: DictionaryService) {}

  /**
   * Analyze a single line of text
   */
  analyzeLine(lineText: string, lineNumber: number): LineAnalysis {
    const words = tokenizeLine(lineText);
    const wordAnalyses: WordAnalysis[] = [];
    const stressPattern: StressPattern = [];

    for (const word of words) {
      const cleaned = removePunctuation(word);
      if (!cleaned) continue;

      const analysis = this.dictionary.analyzeWord(cleaned);
      wordAnalyses.push(analysis);

      // Build stress pattern from syllables
      for (const syllable of analysis.syllables) {
        stressPattern.push(syllable.stress);
      }
    }

    // Get rhyme key from last word
    const lastWord = wordAnalyses.length > 0 ? wordAnalyses[wordAnalyses.length - 1] : null;
    let rhymeKey = lastWord?.rhymeKey || '';
    
    // If last word has no rhyme key (all consonants), look backward for last vowel in line
    if (rhymeKey === '' && wordAnalyses.length > 0) {
      for (let i = wordAnalyses.length - 1; i >= 0; i--) {
        if (wordAnalyses[i].rhymeKey) {
          rhymeKey = wordAnalyses[i].rhymeKey;
          break;
        }
      }
    }

    return {
      lineNumber,
      text: lineText,
      words: wordAnalyses,
      stressPattern,
      rhymeKey
    };
  }

  /**
   * Check if stress pattern matches expected meter
   * Returns true if valid, false if there are issues
   * Rules vary by meter type (iambic, trochaic, etc.)
   */
  checkMeter(
    actual: StressPattern, 
    expected: StressPattern, 
    meterType: string = 'iambic',
    strict: boolean = false
  ): boolean {
    // If syllable count is way off (more than 2 syllables difference), skip checking
    if (Math.abs(actual.length - expected.length) > 2) {
      return false; // Will be handled as unchecked line
    }

    // Check if length matches
    if (actual.length !== expected.length) {
      // In lenient mode, allow ±1 syllable difference by trying to fit
      if (!strict && Math.abs(actual.length - expected.length) === 1) {
        return this.checkMeterWithFitting(actual, expected, meterType);
      }
      return false;
    }

    // Apply checking rules based on meter type
    if (meterType === 'iambic') {
      return strict ? this.checkStrictMeter(actual, expected) : this.checkIambicMeter(actual, expected);
    } else {
      // For other meter types, use strict checking
      return this.checkStrictMeter(actual, expected);
    }
  }

  /**
   * Try to fit actual stress pattern to expected by skipping or padding
   * Used in lenient mode when there's ±1 syllable difference
   */
  private checkMeterWithFitting(
    actual: StressPattern,
    expected: StressPattern,
    meterType: string
  ): boolean {
    if (actual.length === expected.length + 1) {
      // One extra syllable - try removing each position and check
      for (let skip = 0; skip < actual.length; skip++) {
        const fitted = actual.filter((_, i) => i !== skip);
        if (meterType === 'iambic') {
          if (this.checkIambicMeter(fitted, expected)) return true;
        } else {
          if (this.checkStrictMeter(fitted, expected)) return true;
        }
      }
    } else if (actual.length === expected.length - 1) {
      // One fewer syllable - try inserting unstressed at each position
      for (let insert = 0; insert <= actual.length; insert++) {
        const fitted = [...actual.slice(0, insert), 0, ...actual.slice(insert)] as StressPattern;
        if (meterType === 'iambic') {
          if (this.checkIambicMeter(fitted, expected)) return true;
        } else {
          if (this.checkStrictMeter(fitted, expected)) return true;
        }
      }
    }
    return false;
  }

  /**
   * Iambic meter checking (抑扬格)
   * Lenient: allows "light→heavy" (0→1), but flags:
   * - "heavy→light" (1→0): wrong stress position
   * - "light→light" (0→0) when expecting heavy (1): missing stress
   */
  private checkIambicMeter(actual: StressPattern, expected: StressPattern): boolean {
    for (let i = 0; i < expected.length; i++) {
      if (expected[i] === 1) {
        // Expected stressed position
        if (actual[i] === 0) {
          // Got unstressed (0) when expecting stressed (1) - ERROR: "轻轻"
          return false;
        }
        // Allow actual[i] === 1 (correct) or actual[i] === 2 (secondary stress, acceptable)
      } else {
        // Expected unstressed position (expected[i] === 0)
        if (actual[i] === 1) {
          // Got stressed (1) in unstressed position - ALLOWED for flexibility
          // (单音节词可以轻读)
          continue;
        }
        // actual[i] === 0 or 2 are both fine for unstressed positions
      }
    }
    return true;
  }

  /**
   * Strict meter checking for non-iambic meters
   * Requires exact match of stress pattern
   */
  private checkStrictMeter(actual: StressPattern, expected: StressPattern): boolean {
    for (let i = 0; i < expected.length; i++) {
      if (expected[i] === 1 && actual[i] !== 1) {
        return false; // Expected primary stress, got something else
      }
      if (expected[i] === 0 && actual[i] === 1) {
        return false; // Expected unstressed, got primary stress
      }
    }
    return true;
  }

  /**
   * Validate rhyme scheme
   */
  validateRhymeScheme(lines: LineAnalysis[], expectedScheme: string[]): {
    valid: boolean;
    issues: string[];
    rhymeGroups: { [letter: string]: number[] }; // Map rhyme letters to line indices
  } {
    const rhymeGroups: { [letter: string]: number[] } = {};
    const rhymeKeys: { [letter: string]: string[] } = {};
    const issues: string[] = [];

    // Group lines by their rhyme scheme letter
    for (let i = 0; i < Math.min(lines.length, expectedScheme.length); i++) {
      const letter = expectedScheme[i];
      const rhymeKey = lines[i].rhymeKey;

      if (!rhymeGroups[letter]) {
        rhymeGroups[letter] = [];
        rhymeKeys[letter] = [];
      }
      rhymeGroups[letter].push(i);
      rhymeKeys[letter].push(rhymeKey);
    }

    // Check that all lines in each rhyme group have the same rhyme key
    for (const [letter, lineIndices] of Object.entries(rhymeGroups)) {
      // Skip single-line rhyme groups (no checking needed)
      if (lineIndices.length <= 1) {
        continue;
      }

      const rhymes = rhymeKeys[letter];
      const validRhymes = rhymes.filter(r => r !== '');
      const uniqueRhymes = new Set(validRhymes);
      
      // Check if there are multiple different rhymes
      if (uniqueRhymes.size > 1) {
        issues.push(`Rhyme group ${letter} has inconsistent rhymes: ${Array.from(uniqueRhymes).join(', ')}`);
      }
      
      // Check for missing rhyme keys (words not in dictionary)
      if (validRhymes.length < rhymes.length) {
        issues.push(`Rhyme group ${letter} contains words not found in dictionary`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      rhymeGroups
    };
  }

  /**
   * Analyze an entire sonnet
   */
  analyzeSonnet(
    text: string, 
    form: SonnetForm, 
    options: { strict?: boolean; intelligent?: boolean } = {}
  ): SonnetAnalysis {
    const strict = options.strict ?? false;
    const intelligent = options.intelligent ?? true;
    
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    const lineAnalyses: LineAnalysis[] = lines.map((line, index) => {
      const analysis = this.analyzeLine(line, index + 1);
      
      // Check meter
      analysis.expectedStressPattern = form.meter.stressPattern;
      analysis.meterValid = this.checkMeter(
        analysis.stressPattern,
        form.meter.stressPattern,
        form.meter.type || 'iambic', // Default to iambic if not specified
        strict
      );

      return analysis;
    });

    // Validate rhyme scheme
    const rhymeValidation = this.validateRhymeScheme(lineAnalyses, form.rhymeScheme);

    // Check meter validity
    const meterIssues: string[] = [];
    for (const line of lineAnalyses) {
      // Skip lines that are too far off or have no valid words
      if (line.words.length === 0 || Math.abs(line.stressPattern.length - form.meter.stressPattern.length) > 2) {
        continue;
      }
      
      if (!line.meterValid) {
        meterIssues.push(
          `Line ${line.lineNumber}: Expected ${form.meter.stressPattern.length} syllables ` +
          `with pattern ${form.meter.stressPattern.join('')}, ` +
          `got ${line.stressPattern.length} syllables with pattern ${line.stressPattern.join('')}`
        );
      }
    }

    return {
      lines: lineAnalyses,
      form,
      rhymeSchemeValid: rhymeValidation.valid,
      meterValid: meterIssues.length === 0,
      rhymeIssues: rhymeValidation.issues,
      meterIssues,
      rhymeGroups: rhymeValidation.rhymeGroups
    };
  }
}
