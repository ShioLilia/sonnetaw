import type { PronunciationDict, Syllable, WordAnalysis } from './types';

/**
 * Dictionary service for loading and querying pronunciation data
 */
export class DictionaryService {
  private dict: PronunciationDict = {};

  /**
   * Load pronunciation dictionary from JSON data
   */
  async loadDictionary(dictData: PronunciationDict): Promise<void> {
    this.dict = dictData;
  }

  /**
   * Look up a word in the dictionary
   * Returns the first pronunciation if multiple exist
   */
  lookup(word: string): string[] | null {
    const normalized = word.toLowerCase().replace(/[^a-z']/g, '');
    const pronunciations = this.dict[normalized];
    if (!pronunciations || pronunciations.length === 0) {
      return null;
    }
    return pronunciations[0]; // Return first pronunciation
  }

  /**
   * Extract syllables from phonemes
   * A syllable contains one vowel sound (phonemes ending in 0, 1, or 2)
   */
  extractSyllables(phonemes: string[]): Syllable[] {
    const syllables: Syllable[] = [];
    let currentSyllable: string[] = [];
    let currentStress: 0 | 1 | 2 = 0;

    for (const phoneme of phonemes) {
      currentSyllable.push(phoneme);
      
      // Check if this phoneme contains stress information (ends with 0, 1, or 2)
      const stressMatch = phoneme.match(/[012]$/);
      if (stressMatch) {
        currentStress = parseInt(stressMatch[0]) as 0 | 1 | 2;
        syllables.push({
          phonemes: currentSyllable,
          stress: currentStress
        });
        currentSyllable = [];
        currentStress = 0;
      }
    }

    // Add any remaining consonants to the last syllable
    if (currentSyllable.length > 0 && syllables.length > 0) {
      syllables[syllables.length - 1].phonemes.push(...currentSyllable);
    }

    return syllables;
  }

  /**
   * Extract rhyme key from phonemes
   * The rhyme key consists of phonemes from the last primary stressed vowel to the end
   */
  extractRhymeKey(phonemes: string[]): string {
    // Find the last primary stress (1)
    let lastStressIndex = -1;
    for (let i = phonemes.length - 1; i >= 0; i--) {
      if (phonemes[i].match(/1$/)) {
        lastStressIndex = i;
        break;
      }
    }

    if (lastStressIndex === -1) {
      // No primary stress found, use all phonemes
      return phonemes.map(p => p.replace(/[012]$/, '')).join('-');
    }

    // Return from stressed vowel to end, removing stress markers
    return phonemes
      .slice(lastStressIndex)
      .map(p => p.replace(/[012]$/, ''))
      .join('-');
  }

  /**
   * Analyze a single word
   */
  analyzeWord(word: string): WordAnalysis {
    const phonemes = this.lookup(word);
    
    if (!phonemes) {
      return {
        word: word.toLowerCase(),
        originalWord: word,
        syllables: [],
        rhymeKey: '',
        found: false
      };
    }

    const syllables = this.extractSyllables(phonemes);
    const rhymeKey = this.extractRhymeKey(phonemes);

    return {
      word: word.toLowerCase(),
      originalWord: word,
      syllables,
      rhymeKey,
      found: true
    };
  }
}
