import type { PronunciationDict, Syllable, WordAnalysis } from './types';

/**
 * Dictionary service for loading and querying pronunciation data
 */
export class DictionaryService {
  private dict: PronunciationDict = {};
  private currentLanguage: string = 'en'; // 当前加载的语言
  private customDict: PronunciationDict = {}; // 用户自定义词典

  /**
   * Load pronunciation dictionary from JSON data
   */
  async loadDictionary(dictData: PronunciationDict, languageCode: string = 'en'): Promise<void> {
    this.dict = dictData;
    this.currentLanguage = languageCode;
    // Load custom dictionary from localStorage if available
    this.loadCustomDictionary();
  }

  /**
   * Load custom dictionary from localStorage
   */
  private loadCustomDictionary(): void {
    try {
      const stored = localStorage.getItem(`customDict_${this.currentLanguage}`);
      if (stored) {
        this.customDict = JSON.parse(stored);
        console.log(`Loaded ${Object.keys(this.customDict).length} custom words`);
      }
    } catch (error) {
      console.error('Failed to load custom dictionary:', error);
      this.customDict = {};
    }
  }

  /**
   * Save custom dictionary to localStorage
   */
  private saveCustomDictionary(): void {
    try {
      localStorage.setItem(
        `customDict_${this.currentLanguage}`,
        JSON.stringify(this.customDict)
      );
    } catch (error) {
      console.error('Failed to save custom dictionary:', error);
    }
  }

  /**
   * Add a custom word pronunciation
   */
  addCustomWord(word: string, phonemes: string[]): void {
    const normalized = word.toLowerCase().replace(/[^a-z']/g, '');
    this.customDict[normalized] = [phonemes];
    this.saveCustomDictionary();
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
   * Checks custom dictionary first, then main dictionary
   */
  lookup(word: string): string[] | null {
    const normalized = word.toLowerCase().replace(/[^a-z']/g, '');
    
    // Check custom dictionary first
    if (this.customDict[normalized]?.length > 0) {
      return this.customDict[normalized][0];
    }
    
    // Then check main dictionary
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
   * Heuristic syllable count for unknown words
   * Based on vowel groups in English
   */
  private estimateSyllables(word: string): number {
    const lower = word.toLowerCase();
    // Count vowel groups (consecutive vowels = 1 syllable)
    let count = 0;
    let inVowelGroup = false;
    
    for (let i = 0; i < lower.length; i++) {
      const char = lower[i];
      if ('aeiouy'.includes(char)) {
        if (!inVowelGroup) {
          count++;
          inVowelGroup = true;
        }
      } else {
        inVowelGroup = false;
      }
    }
    
    // Silent 'e' at the end
    if (lower.endsWith('e') && count > 1) {
      count--;
    }
    
    // Words like 'fire', 'hour' often 1 syllable
    if (lower.match(/^(fire|hour|our)$/)) {
      count = 1;
    }
    
    return Math.max(1, count); // At least 1 syllable
  }

  /**
   * Create fallback analysis for unknown words
   */
  private createFallbackAnalysis(word: string): WordAnalysis {
    const syllableCount = this.estimateSyllables(word);
    const syllables: Syllable[] = [];
    
    // Create simple syllable structure
    // Assume first syllable has primary stress for single-syllable words
    // For multi-syllable words, guess stress on first or second syllable
    for (let i = 0; i < syllableCount; i++) {
      const stress: 0 | 1 | 2 = 
        syllableCount === 1 ? 1 : // Single syllable → stressed
        i === 0 ? 1 :              // First syllable of multi-syllable word
        0;                         // Other syllables
      
      syllables.push({
        phonemes: [],
        stress
      });
    }
    
    // Create a basic rhyme key from the last 2-3 characters
    const rhymeKey = word.length >= 2 ? 
      word.slice(-2).toLowerCase() : 
      word.toLowerCase();
    
    return {
      word: word.toLowerCase(),
      originalWord: word,
      syllables,
      rhymeKey,
      found: false
    };
  }

  /**
   * Analyze a single word
   */
  analyzeWord(word: string): WordAnalysis {
    const phonemes = this.lookup(word);
    
    if (!phonemes) {
      // Use fallback analysis for unknown words
      return this.createFallbackAnalysis(word);
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
