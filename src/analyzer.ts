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
 * Sonnet forms and their patterns
 */
export const SONNET_FORMS: { [key: string]: SonnetForm } = {
  shakespearean: {
    name: 'Shakespearean (English) Sonnet',
    rhymeScheme: ['A', 'B', 'A', 'B', 'C', 'D', 'C', 'D', 'E', 'F', 'E', 'F', 'G', 'G'],
    meter: {
      name: 'Iambic Pentameter',
      description: 'Unstressed-stressed pattern, 10 syllables per line',
      stressPattern: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
      syllableCount: 10
    },
    lineCount: 14
  },
  petrarchan: {
    name: 'Petrarchan (Italian) Sonnet',
    rhymeScheme: ['A', 'B', 'B', 'A', 'A', 'B', 'B', 'A', 'C', 'D', 'E', 'C', 'D', 'E'],
    meter: {
      name: 'Iambic Pentameter',
      description: 'Unstressed-stressed pattern, 10 syllables per line',
      stressPattern: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
      syllableCount: 10
    },
    lineCount: 14
  }
};

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
    const lastWord = wordAnalyses[wordAnalyses.length - 1];
    const rhymeKey = lastWord?.rhymeKey || '';

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
   */
  checkMeter(actual: StressPattern, expected: StressPattern): boolean {
    if (actual.length !== expected.length) {
      return false;
    }

    // Allow some flexibility: check if primary stresses (1) are in the right positions
    for (let i = 0; i < expected.length; i++) {
      if (expected[i] === 1 && actual[i] !== 1) {
        return false;
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
  } {
    const rhymeGroups: { [letter: string]: string[] } = {};
    const issues: string[] = [];

    // Group lines by their rhyme scheme letter
    for (let i = 0; i < Math.min(lines.length, expectedScheme.length); i++) {
      const letter = expectedScheme[i];
      const rhymeKey = lines[i].rhymeKey;

      if (!rhymeGroups[letter]) {
        rhymeGroups[letter] = [];
      }
      rhymeGroups[letter].push(rhymeKey);
    }

    // Check that all lines in each rhyme group have the same rhyme key
    for (const [letter, rhymes] of Object.entries(rhymeGroups)) {
      const uniqueRhymes = new Set(rhymes.filter(r => r !== ''));
      if (uniqueRhymes.size > 1) {
        issues.push(`Rhyme group ${letter} has inconsistent rhymes: ${Array.from(uniqueRhymes).join(', ')}`);
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  /**
   * Analyze an entire sonnet
   */
  analyzeSonnet(text: string, formName: string = 'shakespearean'): SonnetAnalysis {
    const form = SONNET_FORMS[formName] || SONNET_FORMS.shakespearean;
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
      meterIssues
    };
  }
}
