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
   */
  checkMeter(actual: StressPattern, expected: StressPattern): boolean {
    // If syllable count is way off (more than 2 syllables difference), skip checking
    if (Math.abs(actual.length - expected.length) > 2) {
      return false; // Will be handled as unchecked line
    }

    // Check if length matches
    if (actual.length !== expected.length) {
      return false;
    }

    // Check if primary stresses (1) are in the right positions
    // Also check for unstressed positions that should be stressed
    for (let i = 0; i < expected.length; i++) {
      if (expected[i] === 1 && actual[i] !== 1) {
        return false; // Expected stress but got unstressed
      }
      if (expected[i] === 0 && actual[i] === 1) {
        return false; // Expected unstressed but got stress
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
  analyzeSonnet(text: string, form: SonnetForm): SonnetAnalysis {
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    const lineAnalyses: LineAnalysis[] = lines.map((line, index) => {
      const analysis = this.analyzeLine(line, index + 1);
      
      // Check meter
      analysis.expectedStressPattern = form.meter.stressPattern;
      analysis.meterValid = this.checkMeter(
        analysis.stressPattern,
        form.meter.stressPattern
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
