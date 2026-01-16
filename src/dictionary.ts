import type { PronunciationDict, Syllable, WordAnalysis } from './types';

/**
 * Dictionary service for loading and querying pronunciation data
 */
export class DictionaryService {
  private dict: PronunciationDict = {};
  private currentLanguage: string = 'en'; // 当前加载的语言

  /**
   * Load pronunciation dictionary from JSON data
   */
  async loadDictionary(dictData: PronunciationDict, languageCode: string = 'en'): Promise<void> {
    this.dict = dictData;
    this.currentLanguage = languageCode;
  }

  /**
   * Get current language code
   */
  getCurrentLanguage(): string {
    return this.currentLanguage;
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
    // Find the last vowel (phoneme with stress marker 0, 1, or 2)
    let lastVowelIndex = -1;
    for (let i = phonemes.length - 1; i >= 0; i--) {
      if (phonemes[i].match(/[012]$/)) {
        lastVowelIndex = i;
        break;
      }
    }

    if (lastVowelIndex === -1) {
      // No vowel found in this word (all consonants), return empty
      // The caller should look for the previous vowel in the line
      return '';
    }

    // Return from last vowel to end, removing stress markers
    return phonemes
      .slice(lastVowelIndex)
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
