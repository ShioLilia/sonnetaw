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
   * Get all pronunciations for a word
   * Returns all available pronunciations, or null if word not found
   */
  getAllPronunciations(word: string): string[][] | null {
    const normalized = word.toLowerCase().replace(/[^a-z']/g, '');
    
    // Check custom dictionary first
    if (this.customDict[normalized]?.length > 0) {
      return this.customDict[normalized];
    }
    
    // Then check main dictionary
    const pronunciations = this.dict[normalized];
    if (!pronunciations || pronunciations.length === 0) {
      return null;
    }
    return pronunciations;
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
   * Based on vowel groups and English pronunciation rules
   * For other languages, this method should be overridden
   */
  private estimateSyllables(word: string): number {
    if (this.currentLanguage === 'en') {
      return this.estimateSyllablesEnglish(word);
    }
    // For other languages, add specific methods
    // else if (this.currentLanguage === 'la') return this.estimateSyllablesLatin(word);
    return this.estimateSyllablesEnglish(word); // Default fallback
  }

  /**
   * Advanced English syllable estimation
   * Implements comprehensive rules for better accuracy
   */
  private estimateSyllablesEnglish(word: string): number {
    const lower = word.toLowerCase().replace(/[^a-z]/g, '');
    if (lower.length === 0) return 1;
    
    // Special cases - common words with irregular syllabification
    const specialCases: { [key: string]: number } = {
      // Single syllable despite multiple vowels
      'are': 1, 'were': 1, 'where': 1, 'here': 1, 'there': 1,
      'fire': 1, 'hour': 1, 'our': 1, 'your': 1,
      'through': 1, 'though': 1, 'thought': 1, 'brought': 1,
      'sure': 1, 'pure': 1, 'cure': 1,
      
      // Two syllables
      'every': 2, 'prayer': 2, 'player': 2, 'layer': 2,
      'being': 2, 'seeing': 2, 'doing': 2, 'going': 2,
      
      // Three syllables
      'family': 3, 'library': 3, 'different': 3,
      
      // Common archaic/poetic words
      'thee': 1, 'thou': 1, 'thy': 1, 'thine': 1,
      'hath': 1, 'doth': 1, 'shalt': 1, 'wilt': 1,
      'ere': 1, 'oft': 1, 'nigh': 1,
      'oer': 1, 'eer': 1, 'neer': 1, // o'er, e'er, ne'er
      'tis': 1, 'twas': 1, 'twere': 1,
    };
    
    if (specialCases[lower]) {
      return specialCases[lower];
    }
    
    let count = 0;
    const vowels = 'aeiouy';
    let previousWasVowel = false;
    
    // Count vowel groups
    for (let i = 0; i < lower.length; i++) {
      const char = lower[i];
      const isVowel = vowels.includes(char);
      
      if (isVowel && !previousWasVowel) {
        count++;
      }
      previousWasVowel = isVowel;
    }
    
    // Apply English-specific rules
    
    // Rule 1: Silent 'e' at the end
    if (lower.endsWith('e')) {
      // But not after certain patterns
      if (count > 1 && !lower.match(/(le|re|ne|me|he|se|ze|ve|de|ge|te|ce|pe)$/)) {
        count--;
      }
      // Exceptions: -le, -tle, -ble, -ple, etc. after consonant
      if (lower.match(/[^aeiou]le$/)) {
        // 'le' after consonant adds a syllable (e.g., "table" = 2)
        // Already counted correctly, do nothing
      }
    }
    
    // Rule 2: -ed ending
    if (lower.endsWith('ed')) {
      // Usually doesn't add syllable except after 'd' or 't'
      if (!lower.match(/[dt]ed$/)) {
        count--;
      }
    }
    
    // Rule 3: -es ending
    if (lower.endsWith('es') && lower.length > 2) {
      const beforeEs = lower.slice(-3, -2);
      // -es adds syllable after s, z, x, ch, sh (e.g., "boxes", "wishes")
      if (!'szx'.includes(beforeEs) && !lower.endsWith('ches') && !lower.endsWith('shes')) {
        count--;
      }
    }
    
    // Rule 4: -ing, -ting, -ding usually don't add extra syllable
    // (already handled by vowel counting, but verify)
    
    // Rule 5: Diphthongs that should be one syllable
    // ea, ee, oo, ou, oi, ay, ey, ow are usually one vowel sound
    // (already handled by consecutive vowel grouping)
    
    // Rule 6: -tion, -sion, -cion endings
    if (lower.match(/(tion|sion|cion)$/)) {
      // These are usually 2 syllables: -ti-on, -si-on
      // The 'io' is counted as one vowel group, but should be 2
      count++;
    }
    
    // Rule 7: -ious, -eous endings
    if (lower.match(/(ious|eous)$/)) {
      // e.g., "curious" = 3, "gorgeous" = 2
      // 'ious' has 2 syllable sounds despite consecutive vowels
      count++;
    }
    
    // Rule 8: -ia, -iu, -io at the end often form separate syllable
    if (lower.match(/(ia|iu|io)$/) && lower.length > 3) {
      // e.g., "California" - 'ia' is separate
      const before = lower[lower.length - 3];
      if (!vowels.includes(before)) {
        count++;
      }
    }
    
    // Rule 9: Three+ consecutive vowels might be multiple syllables
    const tripleVowelMatch = lower.match(/[aeiouy]{3,}/g);
    if (tripleVowelMatch) {
      for (const match of tripleVowelMatch) {
        // "beautiful" has "eau" but it's 1 syllable in that context
        // Add logic for specific patterns if needed
      }
    }
    
    // Rule 10: Y between consonants acts as vowel
    // (already handled by including 'y' in vowels)
    
    return Math.max(1, count); // At least 1 syllable
  }

  /**
   * Create fallback analysis for unknown words
   * Attempts to guess stress patterns based on English rules
   */
  private createFallbackAnalysis(word: string): WordAnalysis {
    const syllableCount = this.estimateSyllables(word);
    const syllables: Syllable[] = [];
    
    // Guess stress position based on syllable count and word patterns
    let stressPosition = 0; // Which syllable gets primary stress (0-indexed)
    
    if (syllableCount === 1) {
      stressPosition = 0;
    } else if (syllableCount === 2) {
      // For 2-syllable words, stress is often on first syllable
      // But suffixes like -tion, -ment, -ly shift stress earlier
      const lower = word.toLowerCase();
      if (lower.match(/(ment|ness|less|ful|ly)$/)) {
        stressPosition = 0; // Stress before suffix
      } else if (lower.match(/(tion|sion|ic)$/)) {
        stressPosition = 0; // Stress before -tion
      } else {
        stressPosition = 0; // Default: first syllable
      }
    } else if (syllableCount >= 3) {
      // For 3+ syllable words, stress is often on first or second syllable
      const lower = word.toLowerCase();
      if (lower.match(/(tion|sion)$/)) {
        stressPosition = Math.max(0, syllableCount - 3); // Before -tion
      } else if (lower.match(/(ic|ical)$/)) {
        stressPosition = Math.max(0, syllableCount - 3); // Before -ic
      } else if (lower.match(/(ity|ety)$/)) {
        stressPosition = Math.max(0, syllableCount - 3); // Before -ity
      } else {
        stressPosition = Math.min(1, syllableCount - 1); // Second syllable or first
      }
    }
    
    // Create syllable structure
    for (let i = 0; i < syllableCount; i++) {
      const stress: 0 | 1 | 2 = 
        i === stressPosition ? 1 : // Primary stress
        0;                          // Unstressed
      
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
   * Map phonemes to letter positions in the word
   * Returns array of letter ranges for each syllable: [startIdx, endIdx]
   */
  syllabifyWord(word: string, syllables: Syllable[]): Array<[number, number]> {
    const lower = word.toLowerCase();
    const vowels = 'aeiouy';
    const result: Array<[number, number]> = [];
    
    // Find all vowel positions in the word
    const vowelPositions: number[] = [];
    for (let i = 0; i < lower.length; i++) {
      if (vowels.includes(lower[i])) {
        vowelPositions.push(i);
      }
    }
    
    if (vowelPositions.length === 0 || syllables.length === 0) {
      // No vowels or syllables, return whole word as one unit
      return [[0, word.length - 1]];
    }
    
    // If syllable count doesn't match vowel count, use simple division
    if (syllables.length !== vowelPositions.length) {
      // Fallback: divide word evenly
      const avgLength = word.length / syllables.length;
      for (let i = 0; i < syllables.length; i++) {
        const start = Math.floor(i * avgLength);
        const end = i === syllables.length - 1 ? word.length - 1 : Math.floor((i + 1) * avgLength) - 1;
        result.push([start, end]);
      }
      return result;
    }
    
    // Apply syllabification rules based on consonants between vowels
    for (let i = 0; i < vowelPositions.length; i++) {
      const vowelPos = vowelPositions[i];
      let start: number;
      let end: number;
      
      if (i === 0) {
        // First syllable: starts from beginning
        start = 0;
      } else {
        // Find consonants between this vowel and previous vowel
        const prevVowel = vowelPositions[i - 1];
        const consonantCount = vowelPos - prevVowel - 1;
        
        if (consonantCount === 0) {
          // Two vowels adjacent: split between them
          start = vowelPos;
        } else if (consonantCount === 1) {
          // One consonant: goes to current syllable
          start = prevVowel + 1;
        } else if (consonantCount === 2) {
          // Two consonants: split 1+1
          start = prevVowel + 2;
        } else if (consonantCount === 3) {
          // Three consonants: split 2+1
          start = prevVowel + 3;
        } else {
          // Four or more: split evenly
          const half = Math.floor(consonantCount / 2);
          start = prevVowel + 1 + half;
        }
      }
      
      if (i === vowelPositions.length - 1) {
        // Last syllable: goes to end
        end = word.length - 1;
      } else {
        // Find split point with next syllable
        const nextVowel = vowelPositions[i + 1];
        const consonantCount = nextVowel - vowelPos - 1;
        
        if (consonantCount === 0) {
          // Two vowels adjacent: include current vowel only
          end = vowelPos;
        } else if (consonantCount === 1) {
          // One consonant: include current vowel only
          end = vowelPos;
        } else if (consonantCount === 2) {
          // Two consonants: split 1+1, take first consonant
          end = vowelPos + 1;
        } else if (consonantCount === 3) {
          // Three consonants: split 2+1, take first two
          end = vowelPos + 2;
        } else {
          // Four or more: take half
          const half = Math.floor(consonantCount / 2);
          end = vowelPos + half;
        }
      }
      
      result.push([start, end]);
    }
    
    return result;
  }

  /**
   * Analyze a single word with optional context for choosing best pronunciation
   * @param word The word to analyze
   * @param expectedStress Optional expected stress pattern for this position (for meter matching)
   * @param preferredSyllableCount Optional preferred syllable count (for meter fitting)
   */
  analyzeWord(
    word: string, 
    expectedStress?: number,
    preferredSyllableCount?: number
  ): WordAnalysis {
    const allPronunciations = this.getAllPronunciations(word);
    
    if (!allPronunciations || allPronunciations.length === 0) {
      // Use fallback analysis for unknown words
      return this.createFallbackAnalysis(word);
    }

    // If only one pronunciation, use it
    if (allPronunciations.length === 1) {
      const phonemes = allPronunciations[0];
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

    // Multiple pronunciations: try to select the best match
    let bestPronunciation = allPronunciations[0];
    let bestScore = -1;

    for (const phonemes of allPronunciations) {
      const syllables = this.extractSyllables(phonemes);
      let score = 0;

      // Prefer pronunciation matching expected syllable count
      if (preferredSyllableCount !== undefined) {
        if (syllables.length === preferredSyllableCount) {
          score += 10;
        } else {
          // Penalize based on difference
          score -= Math.abs(syllables.length - preferredSyllableCount) * 2;
        }
      }

      // Prefer pronunciation matching expected stress (if single syllable word)
      if (expectedStress !== undefined && syllables.length === 1) {
        if (syllables[0].stress === expectedStress) {
          score += 5;
        } else if (expectedStress === 1 && syllables[0].stress > 0) {
          score += 2; // Partial match for any stress
        }
      }

      // Default: prefer fewer syllables (more common in poetry)
      score -= syllables.length * 0.5;

      if (score > bestScore) {
        bestScore = score;
        bestPronunciation = phonemes;
      }
    }

    const syllables = this.extractSyllables(bestPronunciation);
    const rhymeKey = this.extractRhymeKey(bestPronunciation);

    return {
      word: word.toLowerCase(),
      originalWord: word,
      syllables,
      rhymeKey,
      found: true
    };
  }
}
